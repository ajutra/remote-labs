package main

import (
	"bufio"
	"embed"
	"errors"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strconv"
	"strings"
	"syscall"
	"text/template"
	"time"
)

const DEFAULT_OS_VARIANT = "debian11"
const AFTER_INSTALL_WAIT_TIME = 20 * time.Second
const SHUTDOWN_WAIT_TIME = 5 * time.Second
const RETRY_SHUTDOWN_WAIT_TIME = 10 * time.Second
const FORCE_SHUTDOWN_WAIT_TIME = 20 * time.Second
const SHUTOFF_STATUS = "shut off"

//go:embed templates/*.tmpl
var templateFS embed.FS

type ServerAgent interface {
	ListBaseImages() (ListBaseImagesResponse, error)
	DefineTemplate(request DefineTemplateRequest) error
	CreateInstance(request CreateInstanceRequest) error
	DeleteVm(request DeleteVmRequest) error
	StartInstance(request StartInstanceRequest) error
	StopInstance(instanceId string) error
	RestartInstance(instanceId string) error
	ListInstancesStatus() ([]ListInstancesStatusResponse, error)
	GetResourceStatus() (GetResourceStatusResponse, error)
}

type ServerAgentImpl struct {
	vmsStoragePath      string
	cloudInitImagesPath string
	vmsBridge           string
	vmNetworkInterface  string
}

type VmType string

const (
	TemplateVm VmType = "template"
	InstanceVm VmType = "instance"
)

type CreateVmRequest struct {
	VmType          VmType
	VmId            string
	SourceVmId      string
	SourceIsBase    bool
	DirPath         string
	SizeMB          int
	VramMB          int
	VcpuCount       int
	Username        string
	Password        string
	PublicSshKeys   []string
	IpAddWithSubnet string
	Dns1            string
	Dns2            string
	Gateway         string
	VlanEtiquete    string
}

type CloudInitMetadata struct {
	InstanceId    string
	LocalHostname string
}

type CloudInitUserData struct {
	Username      string
	Password      string
	PublicSshKeys []string
}

type CloudInitNetworkConfig struct {
	IpAddWithSubnet string
	Dns1            string
	Dns2            string
	Gateway         string
}

func (agent *ServerAgentImpl) ListBaseImages() (ListBaseImagesResponse, error) {
	cmd := exec.Command(
		"ls",
		agent.cloudInitImagesPath,
	)

	output, err := cmd.CombinedOutput()

	if err != nil {
		return ListBaseImagesResponse{}, logAndReturnError("Error listing base VMs: ", string(output))
	}

	files := strings.Split(string(output), "\n")

	// Remove empty strings from the list
	files = files[:len(files)-1]

	log.Printf("Base VMs: %v", files)

	return toListBaseImagesResponse(files), nil
}

func (agent *ServerAgentImpl) DefineTemplate(request DefineTemplateRequest) error {
	createVmRequest := CreateVmRequest{
		VmType:       TemplateVm,
		VmId:         request.TemplateId,
		SourceVmId:   request.SourceInstanceId,
		SourceIsBase: false,
		DirPath:      agent.vmsStoragePath + "/" + request.TemplateId,
		SizeMB:       request.SizeMB,
		VramMB:       request.VramMB,
		VcpuCount:    request.VcpuCount,
	}

	return agent.createVm(createVmRequest)
}

func (agent *ServerAgentImpl) CreateInstance(request CreateInstanceRequest) error {
	createVmRequest := CreateVmRequest{
		VmType:          InstanceVm,
		VmId:            request.InstanceId,
		SourceVmId:      request.SourceVmId,
		SourceIsBase:    request.SourceIsBase,
		DirPath:         agent.vmsStoragePath + "/" + request.InstanceId,
		SizeMB:          request.SizeMB,
		VramMB:          request.VramMB,
		VcpuCount:       request.VcpuCount,
		Username:        request.Username,
		Password:        request.Password,
		PublicSshKeys:   request.PublicSshKeys,
		IpAddWithSubnet: request.IpAddWithSubnet,
		Dns1:            request.Dns1,
		Dns2:            request.Dns2,
		Gateway:         request.Gateway,
		VlanEtiquete:    request.VlanEtiquete,
	}

	return agent.createVm(createVmRequest)
}

func (agent *ServerAgentImpl) DeleteVm(request DeleteVmRequest) error {
	log.Printf("Deleting VM '%s'...", request.VmId)

	cmd := exec.Command(
		"virsh", "undefine", request.VmId, "--remove-all-storage",
	)

	output, err := cmd.CombinedOutput()

	if err != nil {
		// If the domain doesn't exist, it means it does not exist in this server
		// we need to remove the vlan etiquete from the network bridge anyway
		if strings.Contains(string(output), "failed to get domain") {
			if request.RemoveEtiquete {
				if err := agent.removeVidFromNetworkBridge(request.Vid); err != nil {
					return err
				}
			}
			return nil
		}

		return logAndReturnError("Error deleting VM '"+request.VmId+"': ", string(output))
	}

	log.Printf("Removing VM '%s' files from storage...", request.VmId)

	if err := os.RemoveAll(agent.vmsStoragePath + "/" + request.VmId); err != nil {
		return logAndReturnError("Error deleting VM '"+request.VmId+"' files from storage: ", err.Error())
	}

	log.Printf("Deleted VM '%s' successfully!", request.VmId)

	if request.RemoveEtiquete {
		if err := agent.removeVidFromNetworkBridge(request.Vid); err != nil {
			return err
		}
	}

	return nil
}

func (agent *ServerAgentImpl) StartInstance(request StartInstanceRequest) error {
	log.Printf("Starting instance '%s'...", request.InstanceId)

	if !agent.vmDomainExists(request.InstanceId) {
		if err := agent.importVmDomain(request.InstanceId); err != nil {
			return err
		}
	}

	cmd := exec.Command(
		"virsh", "start", request.InstanceId,
	)

	output, err := cmd.CombinedOutput()

	if err != nil {
		return logAndReturnError("Error starting instance '"+request.InstanceId+"': ", string(output))
	}

	log.Printf("Started instance '%s' successfully!", request.InstanceId)

	if err := agent.setupVMNetwork(request.Vid, request.VlanEtiquete); err != nil {
		return err
	}

	return nil
}

func (agent *ServerAgentImpl) StopInstance(instanceId string) error {
	log.Printf("Stopping instance '%s'...", instanceId)
	cmd := exec.Command(
		"virsh", "shutdown", instanceId,
	)

	if output, err := cmd.CombinedOutput(); err != nil {
		// If the domain doesn't exist, or is already shut down, we return a bad request
		// to inform the vms-manager that the instance is not running in this server
		if strings.Contains(string(output), "failed to get domain") || strings.Contains(string(output), "Domain is not running") {
			return NewHttpError(http.StatusBadRequest, errors.New("instance is not running in this server"))
		}

		return logAndReturnError("Error stopping instance '"+instanceId+"': ", string(output))
	}

	// Wait for the instance to shut down
	time.Sleep(SHUTDOWN_WAIT_TIME)

	// Check if the instance is shut down
	currentTime := time.Now()
	retryShutdown := true
	for {
		statuses, err := agent.ListInstancesStatus()
		if err != nil {
			return err
		}

		for _, status := range statuses {
			if status.InstanceId == instanceId {
				if status.Status != SHUTOFF_STATUS {
					if time.Since(currentTime) >= FORCE_SHUTDOWN_WAIT_TIME {
						return agent.forceStopVM(instanceId)
					} else if time.Since(currentTime) >= RETRY_SHUTDOWN_WAIT_TIME && retryShutdown {
						retryShutdown = false
						retryShutdownCmd := exec.Command(
							"virsh", "shutdown", instanceId,
						)
						if output, err := retryShutdownCmd.CombinedOutput(); err != nil {
							return logAndReturnError("Error stopping instance '"+instanceId+"': ", string(output))
						}
					} else {
						time.Sleep(SHUTDOWN_WAIT_TIME)
					}
				} else {
					log.Printf("Stopped instance '%s' successfully!", instanceId)
					return nil
				}
			}
		}
	}
}

func (agent *ServerAgentImpl) RestartInstance(instanceId string) error {
	log.Printf("Restarting instance '%s'...", instanceId)

	if !agent.vmDomainExists(instanceId) {
		// If the domain doesn't exist, we return a bad request to inform the vms-manager
		// that the instance is not running in this server
		return NewHttpError(http.StatusBadRequest, errors.New("instance is not running in this server"))
	}

	cmd := exec.Command(
		"virsh", "reboot", instanceId,
	)

	output, err := cmd.CombinedOutput()

	if err != nil {
		// If the domain is not running, we return a bad request to inform the vms-manager
		// that the instance is not running in this server
		if strings.Contains(string(output), "Domain is not running") {
			return NewHttpError(http.StatusBadRequest, errors.New("instance is not running in this server"))
		}

		return logAndReturnError("Error restarting instance '"+instanceId+"': ", string(output))
	}

	log.Printf("Restarted instance '%s' successfully!", instanceId)

	return nil
}

func (agent *ServerAgentImpl) ListInstancesStatus() ([]ListInstancesStatusResponse, error) {
	cmd := exec.Command(
		"virsh", "list", "--all",
	)

	output, err := cmd.CombinedOutput()
	if err != nil {
		return nil, logAndReturnError("Error listing VMs status: ", string(output))
	}

	lines := strings.Split(string(output), "\n")
	vmStatusMap := make(map[string]string)

	for _, line := range lines {
		fields := strings.Fields(line)
		if len(fields) == 3 && fields[0] != "Id" {
			vmStatusMap[fields[1]] = fields[2]
		} else if len(fields) > 3 && fields[0] != "Id" {
			vmStatusMap[fields[1]] = fields[2] + " " + fields[3]
		}
	}

	log.Printf("VMs status:")
	for vmName, status := range vmStatusMap {
		log.Printf("%s: %s", vmName, status)
	}

	return toListInstancesStatusResponse(vmStatusMap), nil
}

func (agent *ServerAgentImpl) GetResourceStatus() (GetResourceStatusResponse, error) {
	cpuLoad, err := getCpuLoad()
	if err != nil {
		return GetResourceStatusResponse{}, err
	}

	totalMemoryMB, freeMemoryMB, err := getMemoryInfo()
	if err != nil {
		return GetResourceStatusResponse{}, err
	}

	totalDiskMB, freeDiskMB, err := getDiskInfo()
	if err != nil {
		return GetResourceStatusResponse{}, err
	}

	return GetResourceStatusResponse{
		CpuLoad:       cpuLoad,
		TotalMemoryMB: totalMemoryMB,
		FreeMemoryMB:  freeMemoryMB,
		TotalDiskMB:   totalDiskMB,
		FreeDiskMB:    freeDiskMB,
	}, nil
}

func (agent *ServerAgentImpl) createVm(request CreateVmRequest) error {
	if err := createDir(request.DirPath); err != nil {
		return err
	}

	if err := agent.createVmConfigurationFiles(request); err != nil {
		return err
	}

	if err := agent.createDiskImage(request); err != nil {
		return err
	}

	if request.VmType == TemplateVm {
		if err := agent.removeBackingFileFromTemplateDiskImage(request.DirPath, request.VmId); err != nil {
			return err
		}
	}

	if err := agent.installVm(request); err != nil {
		return err
	}

	if err := agent.StopInstance(request.VmId); err != nil {
		return err
	}

	agent.dumpVmXML(request.VmId)

	return nil
}

func (agent *ServerAgentImpl) removeVidFromNetworkBridge(vid string) error {
	log.Printf("Removing vlan etiquete from network bridge...")

	removeVlanEtiqueteCmd := exec.Command(
		"bridge", "vlan", "del", "vid", vid, "dev", agent.vmNetworkInterface,
	)

	if output, err := removeVlanEtiqueteCmd.CombinedOutput(); err != nil {
		return logAndReturnError("Error removing vlan etiquete from network bridge: ", string(output))
	}

	return nil
}

func (agent *ServerAgentImpl) setupVMNetwork(vid string, vlanEtiquete string) error {
	log.Printf("Setting up network...")

	addVlanEtiqueteCmd := exec.Command(
		"bridge", "vlan", "add", "vid", vid, "dev", agent.vmNetworkInterface,
	)

	if output, err := addVlanEtiqueteCmd.CombinedOutput(); err != nil {
		return logAndReturnError("Error adding vlan etiquete to network bridge: ", string(output))
	}

	setupVmInterfaceAsAccessPortCmd := exec.Command(
		"bridge", "vlan", "add", "vid", vid, "dev", vlanEtiquete, "pvid", vid, "untagged",
	)

	if output, err := setupVmInterfaceAsAccessPortCmd.CombinedOutput(); err != nil {
		return logAndReturnError("Error setting up vm interface as access port: ", string(output))
	}

	return nil
}

func toListBaseImagesResponse(fileNames []string) ListBaseImagesResponse {
	response := ListBaseImagesResponse{FileNames: fileNames}
	return response
}

func createDir(dirPath string) error {
	log.Printf("Creating directory '%s'...", dirPath)

	if err := os.MkdirAll(dirPath, 0755); err != nil {
		return logAndReturnError("Error creating directory: ", err.Error())
	}

	return nil
}

func (agent *ServerAgentImpl) createVmConfigurationFiles(request CreateVmRequest) error {
	log.Printf("Creating %s configuration files...", request.VmType)

	// Create meta-data file
	cloudInitMetadata := CloudInitMetadata{
		InstanceId:    request.VmId,
		LocalHostname: string(request.VmType) + "-" + request.VmId,
	}

	if err := createFileFromTemplate(request.DirPath, "meta-data", cloudInitMetadata); err != nil {
		return err
	}

	// Handle user-data based on type
	if request.VmType == TemplateVm {
		// For templates, copy user-data from source instance
		// because the template shouldn't need to configure new user-data, as they won't be started.
		copyCmd := exec.Command(
			"cp",
			agent.vmsStoragePath+"/"+request.SourceVmId+"/user-data",
			request.DirPath+"/user-data",
		)

		copyCmdOutput, err := copyCmd.CombinedOutput()
		if err != nil {
			return logAndReturnError("Error copying user-data file: ", string(copyCmdOutput))
		}
	} else {
		// For instances, create user-data from template
		cloudInitUserData := CloudInitUserData{
			Username:      request.Username,
			Password:      request.Password,
			PublicSshKeys: request.PublicSshKeys,
		}

		if err := createFileFromTemplate(request.DirPath, "user-data", cloudInitUserData); err != nil {
			return err
		}

		// And setup the network config
		cloudInitNetworkConfig := CloudInitNetworkConfig{
			IpAddWithSubnet: request.IpAddWithSubnet,
			Dns1:            request.Dns1,
			Dns2:            request.Dns2,
			Gateway:         request.Gateway,
		}

		if err := createFileFromTemplate(request.DirPath, "network-config", cloudInitNetworkConfig); err != nil {
			return err
		}
	}

	// Create cidata.iso
	if err := createCidataIso(request.DirPath, request.VmType == TemplateVm); err != nil {
		return err
	}

	return nil
}

func createFileFromTemplate(newFilePath string, fileName string, data interface{}) error {
	log.Printf("Creating file %s...", fileName)

	tmpl, err := template.ParseFS(templateFS, "templates/"+fileName+".tmpl")
	if err != nil {
		return logAndReturnError("Error parsing "+fileName+" template: ", err.Error())
	}

	file, err := os.Create(newFilePath + "/" + fileName)
	if err != nil {
		return logAndReturnError("Error creating "+fileName+" file: ", err.Error())
	}

	if err := tmpl.Execute(file, data); err != nil {
		return logAndReturnError("Error executing "+fileName+" template: ", err.Error())
	}

	file.Close()

	return nil
}

func createCidataIso(dirPath string, isTemplate bool) error {
	log.Printf("Creating cidata.iso...")

	files := []string{dirPath + "/meta-data", dirPath + "/user-data"}
	if !isTemplate {
		files = append(files, dirPath+"/network-config")
	}

	args := []string{
		"-output", dirPath + "/cidata.iso",
		"-V", "cidata",
		"-r",
		"-J",
	}
	args = append(args, files...)

	createIsoCmd := exec.Command("genisoimage", args...)

	createIsoCmdOutput, err := createIsoCmd.CombinedOutput()
	if err != nil {
		return logAndReturnError("Error creating cidata.iso: ", string(createIsoCmdOutput))
	}

	return nil
}

func (agent *ServerAgentImpl) createDiskImage(request CreateVmRequest) error {
	log.Printf("Creating disk image...")

	var sourceVmPath string
	if request.SourceIsBase {
		sourceVmPath = agent.cloudInitImagesPath + "/" + request.SourceVmId + ".qcow2"
	} else {
		sourceVmPath = agent.vmsStoragePath + "/" + request.SourceVmId + "/" + request.SourceVmId + ".qcow2"
	}

	createDiskImageCmd := exec.Command(
		"qemu-img",
		"create",
		"-b", sourceVmPath,
		"-f", "qcow2",
		"-F", "qcow2",
		request.DirPath+"/"+request.VmId+".qcow2",
		strconv.Itoa(request.SizeMB)+"M",
	)

	createDiskImageCmdOutput, err := createDiskImageCmd.CombinedOutput()
	if err != nil {
		return logAndReturnError("Error creating disk image: ", string(createDiskImageCmdOutput))
	}

	return nil
}

func (agent *ServerAgentImpl) removeBackingFileFromTemplateDiskImage(dirPath string, templateId string) error {
	log.Printf("Removing backing file from template disk image...")

	removeBackingFileCmd := exec.Command(
		"qemu-img",
		"rebase",
		"-b", "",
		"-f", "qcow2",
		dirPath+"/"+templateId+".qcow2",
	)

	if removeBackingFileOutput, err := removeBackingFileCmd.CombinedOutput(); err != nil {
		return logAndReturnError(
			"Error removing backing file from template disk image: ",
			string(removeBackingFileOutput),
		)
	}

	return nil
}

func (agent *ServerAgentImpl) installVm(request CreateVmRequest) error {
	log.Printf("Installing VM...")

	installVmCmd := exec.Command(
		"virt-install",
		"--name", request.VmId,
		"--ram", strconv.Itoa(request.VramMB),
		"--vcpus", strconv.Itoa(request.VcpuCount),
		"--import",
		"--disk", "path="+request.DirPath+"/"+request.VmId+".qcow2,format=qcow2",
		"--disk", "path="+request.DirPath+"/cidata.iso,device=cdrom",
		"--os-variant", DEFAULT_OS_VARIANT,
		"--network", "bridge="+agent.vmsBridge+",target="+request.VlanEtiquete+",model=virtio",
		"--graphics", "vnc,listen=0.0.0.0",
		"--noautoconsole",
	)

	installVmCmdOutput, err := installVmCmd.CombinedOutput()
	if err != nil {
		return logAndReturnError("Error installing VM: ", string(installVmCmdOutput))
	}

	// We need to wait for the VM to be started and configured
	time.Sleep(AFTER_INSTALL_WAIT_TIME)

	return nil
}

func (agent *ServerAgentImpl) dumpVmXML(vmId string) {
	xmlPath := filepath.Join(agent.vmsStoragePath, vmId, vmId+".xml")

	log.Printf("Dumping VM XML to %s...", xmlPath)

	for {
		cmd := exec.Command("virsh", "dumpxml", vmId)
		output, err := cmd.Output()
		if err != nil {
			log.Printf("Error dumping VM XML: %v; retrying…", err)
			time.Sleep(time.Second)
			continue
		}

		if err := os.WriteFile(xmlPath, output, 0644); err != nil {
			log.Printf("Error writing XML file: %v; retrying…", err)
			time.Sleep(time.Second)
			continue
		}

		return
	}
}

func (agent *ServerAgentImpl) forceStopVM(vmId string) error {
	log.Printf("Force stopping VM '%s'...", vmId)

	cmd := exec.Command(
		"virsh", "destroy", vmId,
	)

	output, err := cmd.CombinedOutput()

	if err != nil {
		return logAndReturnError("Error force stopping VM '"+vmId+"': ", string(output))
	}

	return nil
}

func (agent *ServerAgentImpl) vmDomainExists(vmId string) bool {
	domains, err := agent.ListInstancesStatus()
	if err != nil {
		return false
	}

	for _, domain := range domains {
		if domain.InstanceId == vmId {
			return true
		}
	}

	return false
}

func (agent *ServerAgentImpl) importVmDomain(vmId string) error {
	log.Printf("Importing VM domain...")

	importVmDomainCmd := exec.Command(
		"virsh", "define", agent.vmsStoragePath+"/"+vmId+"/"+vmId+".xml",
	)

	if output, err := importVmDomainCmd.CombinedOutput(); err != nil {
		return logAndReturnError("Error importing VM domain: ", string(output))
	}

	return nil
}

func toListInstancesStatusResponse(vmStatusMap map[string]string) []ListInstancesStatusResponse {
	response := []ListInstancesStatusResponse{}
	for vmName, status := range vmStatusMap {
		response = append(response, ListInstancesStatusResponse{InstanceId: vmName, Status: status})
	}
	return response
}

func getCpuLoad() (float64, error) {
	data, err := os.ReadFile("/proc/loadavg")
	if err != nil {
		return 0, err
	}

	fields := strings.Fields(string(data))
	loadAvgString := fields[0] // 1-minute load average

	loadAvg, err := strconv.ParseFloat(loadAvgString, 64)
	if err != nil {
		return 0, err
	}

	cpuCount := runtime.NumCPU()

	cpuLoad := loadAvg / float64(cpuCount)

	return cpuLoad, nil
}

func getMemoryInfo() (totalMemoryMB int, freeMemoryMB int, err error) {
	totalMemoryMB = -1
	freeMemoryMB = -1

	file, err := os.Open("/proc/meminfo")
	if err != nil {
		return 0, 0, err
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := scanner.Text()
		fields := strings.Fields(line)

		if len(fields) < 2 {
			continue
		}

		key := strings.TrimSuffix(fields[0], ":")
		value, err2 := strconv.Atoi(fields[1])
		if err2 != nil {
			continue
		}

		if key == "MemFree" {
			// Return in MB
			freeMemoryMB = value / 1024
		} else if key == "MemTotal" {
			totalMemoryMB = value / 1024
		}
	}

	if totalMemoryMB == -1 || freeMemoryMB == -1 {
		return 0, 0, logAndReturnError("MemFree or MemTotal not found", "")
	}

	return totalMemoryMB, freeMemoryMB, nil
}

func getDiskInfo() (totalDiskMB int, freeDiskMB int, err error) {
	var stat syscall.Statfs_t

	if err = syscall.Statfs("/", &stat); err != nil {
		return
	}

	// Blocks * size-per-block = bytes
	total := stat.Blocks * uint64(stat.Bsize)
	free := stat.Bavail * uint64(stat.Bsize)

	// Convert to MB
	totalDiskMB = int(total / (1024 * 1024))
	freeDiskMB = int(free / (1024 * 1024))

	return totalDiskMB, freeDiskMB, nil
}

func NewServerAgent(
	vmsStoragePath string,
	cloudInitImagesPath string,
	vmsBridge string,
	vmNetworkInterface string,
) ServerAgent {
	return &ServerAgentImpl{
		vmsStoragePath:      vmsStoragePath,
		cloudInitImagesPath: cloudInitImagesPath,
		vmsBridge:           vmsBridge,
		vmNetworkInterface:  vmNetworkInterface,
	}
}
