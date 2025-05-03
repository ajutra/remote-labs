package main

import (
	"embed"
	"log"
	"os"
	"os/exec"
	"strconv"
	"strings"
	"text/template"
	"time"
)

const DEFAULT_OS_VARIANT = "debian11"
const DEFAULT_NETWORK_BRIDGE = "virbr0"
const SHUTDOWN_WAIT_TIME = 500 * time.Millisecond
const MAX_SHUTDOWN_WAIT_TIME_RETRIES = 20
const SHUTOFF_STATUS = "shut off"

//go:embed templates/*.tmpl
var templateFS embed.FS

type ServerAgent interface {
	ListBaseImages() ([]ListBaseImagesResponse, error)
	DefineTemplate(request DefineTemplateRequest) error
	CreateInstance(request CreateInstanceRequest) error
	DeleteVm(vmId string) error
	StartInstance(instanceId string) error
	StopInstance(instanceId string) error
	RestartInstance(instanceId string) error
	ListInstancesStatus() ([]ListInstancesStatusResponse, error)
}

type ServerAgentImpl struct {
	vmsStoragePath      string
	cloudInitImagesPath string
}

type VmType string

const (
	TemplateVm VmType = "template"
	InstanceVm VmType = "instance"
)

type CreateVmRequest struct {
	VmType        VmType
	VmId          string
	SourceVmId    string
	SourceIsBase  bool
	DirPath       string
	SizeMB        int
	VramMB        int
	VcpuCount     int
	Username      string
	Password      string
	PublicSshKeys []string
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

func (agent *ServerAgentImpl) ListBaseImages() ([]ListBaseImagesResponse, error) {
	log.Printf("Getting base images...")

	cmd := exec.Command(
		"ls",
		agent.cloudInitImagesPath,
	)

	output, err := cmd.CombinedOutput()

	if err != nil {
		return nil, logAndReturnError("Error listing base VMs: ", string(output))
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
		VmType:        InstanceVm,
		VmId:          request.InstanceId,
		SourceVmId:    request.SourceVmId,
		SourceIsBase:  request.SourceIsBase,
		DirPath:       agent.vmsStoragePath + "/" + request.InstanceId,
		SizeMB:        request.SizeMB,
		VramMB:        request.VramMB,
		VcpuCount:     request.VcpuCount,
		Username:      request.Username,
		Password:      request.Password,
		PublicSshKeys: request.PublicSshKeys,
	}

	return agent.createVm(createVmRequest)
}

func (agent *ServerAgentImpl) DeleteVm(vmId string) error {
	log.Printf("Deleting VM '%s'...", vmId)

	cmd := exec.Command(
		"virsh", "undefine", vmId, "--remove-all-storage",
	)

	output, err := cmd.CombinedOutput()

	if err != nil {
		return logAndReturnError("Error deleting VM '"+vmId+"': ", string(output))
	}

	log.Printf("Removing VM '%s' files from storage...", vmId)

	if err := os.RemoveAll(agent.vmsStoragePath + "/" + vmId); err != nil {
		return logAndReturnError("Error deleting VM '"+vmId+"' files from storage: ", err.Error())
	}

	log.Printf("VM '%s' files removed from storage successfully!", vmId)

	log.Printf("Deleted VM '%s' successfully!", vmId)

	return nil
}

func (agent *ServerAgentImpl) StartInstance(instanceId string) error {
	log.Printf("Starting instance '%s'...", instanceId)

	cmd := exec.Command(
		"virsh", "start", instanceId,
	)

	output, err := cmd.CombinedOutput()

	if err != nil {
		return logAndReturnError("Error starting instance '"+instanceId+"': ", string(output))
	}

	log.Printf("Started instance '%s' successfully!", instanceId)

	return nil
}

func (agent *ServerAgentImpl) StopInstance(instanceId string) error {
	log.Printf("Stopping instance '%s'...", instanceId)
	//TODO: check why is not stopping on some cases
	cmd := exec.Command(
		"virsh", "shutdown", instanceId,
	)

	if output, err := cmd.CombinedOutput(); err != nil {
		return logAndReturnError("Error stopping instance '"+instanceId+"': ", string(output))
	}

	// Wait for the instance to shut down
	time.Sleep(SHUTDOWN_WAIT_TIME)

	// Check if the instance is shut down
	for {
		retryCount := 0

		statuses, err := agent.ListInstancesStatus()
		if err != nil {
			return err
		}

		for _, status := range statuses {
			if status.InstanceId == instanceId && status.Status != SHUTOFF_STATUS {
				time.Sleep(SHUTDOWN_WAIT_TIME)
				retryCount++
			} else if retryCount > MAX_SHUTDOWN_WAIT_TIME_RETRIES {
				return agent.forceStopVM(instanceId)
			} else { //Check condition, when creating a new vm, sometimesit returns without status SHUTOFF_STATUS
				log.Printf("Stopped instance '%s' successfully!", instanceId)
				return nil
			}
		}
	}
}

func (agent *ServerAgentImpl) RestartInstance(instanceId string) error {
	log.Printf("Restarting instance '%s'...", instanceId)

	cmd := exec.Command(
		"virsh", "reboot", instanceId,
	)

	output, err := cmd.CombinedOutput()

	if err != nil {
		return logAndReturnError("Error restarting instance '"+instanceId+"': ", string(output))
	}

	log.Printf("Restarted instance '%s' successfully!", instanceId)

	return nil
}

func (agent *ServerAgentImpl) ListInstancesStatus() ([]ListInstancesStatusResponse, error) {
	log.Printf("Getting VMs status...")

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

func (agent *ServerAgentImpl) createVm(request CreateVmRequest) error {
	log.Printf("Creating %s '%s'...", request.VmType, request.VmId)

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

	log.Printf("%s '%s' created successfully!", request.VmType, request.VmId)
	return nil
}

func toListBaseImagesResponse(fileNames []string) []ListBaseImagesResponse {
	response := []ListBaseImagesResponse{}
	response = append(response, ListBaseImagesResponse{FileNames: fileNames})
	return response
}

func createDir(dirPath string) error {
	log.Printf("Creating directory '%s'...", dirPath)

	if err := os.MkdirAll(dirPath, 0755); err != nil {
		return logAndReturnError("Error creating directory: ", err.Error())
	}

	log.Printf("Directory '%s' created successfully!", dirPath)
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
	}

	// Create cidata.iso
	if err := createCidataIso(request.DirPath); err != nil {
		return err
	}

	log.Printf("%s configuration files created successfully!", request.VmType)
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

	log.Printf("File %s created successfully!", fileName)
	return nil
}

func createCidataIso(dirPath string) error {
	log.Printf("Creating cidata.iso...")

	createIsoCmd := exec.Command(
		"genisoimage",
		"-output", dirPath+"/cidata.iso",
		"-V", "cidata",
		"-r",
		"-J", dirPath+"/meta-data", dirPath+"/user-data",
	)

	createIsoCmdOutput, err := createIsoCmd.CombinedOutput()
	if err != nil {
		return logAndReturnError("Error creating cidata.iso: ", string(createIsoCmdOutput))
	}

	log.Printf("Cidata.iso created successfully!")
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

	log.Printf("Disk image created successfully!")
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

	log.Printf("Backing file removed from template disk image successfully!")
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
		"--network", "bridge="+DEFAULT_NETWORK_BRIDGE+",model=virtio",
		"--graphics", "vnc,listen=0.0.0.0",
		"--noautoconsole",
	)

	installVmCmdOutput, err := installVmCmd.CombinedOutput()
	if err != nil {
		return logAndReturnError("Error installing VM: ", string(installVmCmdOutput))
	}

	log.Printf("VM installed successfully!")
	return nil
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

	log.Printf("Force stopped VM '%s' successfully!", vmId)

	return nil
}

func toListInstancesStatusResponse(vmStatusMap map[string]string) []ListInstancesStatusResponse {
	response := []ListInstancesStatusResponse{}
	for vmName, status := range vmStatusMap {
		response = append(response, ListInstancesStatusResponse{InstanceId: vmName, Status: status})
	}
	return response
}

func NewServerAgent(vmsStoragePath string, cloudInitImagesPath string) ServerAgent {
	return &ServerAgentImpl{
		vmsStoragePath:      vmsStoragePath,
		cloudInitImagesPath: cloudInitImagesPath,
	}
}
