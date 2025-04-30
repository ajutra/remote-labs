package main

import (
	"embed"
	"fmt"
	"log"
	"os"
	"os/exec"
	"strconv"
	"strings"
	"text/template"
)

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

type CloudInitMetadata struct {
	InstanceId    string
	LocalHostname string
}

type CloudInitUserData struct {
	Username      string
	Password      string
	PublicSshKeys []string
}

type CreateDiskImageData struct {
	sourceVmId   string
	sourceIsBase bool
	SizeMB       int
}

func (agent *ServerAgentImpl) ListBaseImages() ([]ListBaseImagesResponse, error) {
	// TODO: Figure out how to rename the base images to it's id once it's generated
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
	log.Printf("Defining template...")

	dirPath := agent.vmsStoragePath + "/" + request.TemplateId

	log.Printf("Creating template directory...")

	if err := createDir(dirPath); err != nil {
		return logAndReturnError("Error creating template directory: ", err.Error())
	}

	log.Printf("Template directory created successfully!")

	log.Printf("Creating metadata files...")

	if err := agent.createTemplateMetadataFiles(dirPath, request); err != nil {
		return err
	}

	log.Printf("Metadata files created successfully!")

	log.Printf("Creating template disk image...")
	createDiskImageData := CreateDiskImageData{
		sourceVmId:   request.SourceInstanceId,
		sourceIsBase: false,
		SizeMB:       request.SizeMB,
	}

	if err := agent.createDiskImage(dirPath, createDiskImageData); err != nil {
		return err
	}

	log.Printf("Template disk image created successfully!")

	// TODO: Create the vm using virt-install

	// TODO: Shutdown the vm

	// TODO: Remove the backing file from the template disk image using qemu-img rebase

	log.Printf("Template '%s' defined successfully!", request.TemplateId)

	return nil
}

func (agent *ServerAgentImpl) CreateInstance(request CreateInstanceRequest) error {
	log.Printf("Creating instance '%s'...", request.InstanceId)

	// TODO: Implement

	return nil
}

// TODO: Implement
func (agent *ServerAgentImpl) DeleteVm(vmId string) error {
	log.Printf("Deleting VM '%s'...", vmId)

	cmd := exec.Command(
		"virsh", "undefine", vmId, "--remove-all-storage",
	)

	output, err := cmd.CombinedOutput()

	if err != nil {
		return logAndReturnError("Error deleting VM '"+vmId+"': ", string(output))
	}

	log.Printf("Deleted VM '%s' successfully!", vmId)

	return nil
}

// TODO: Implement
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

// TODO: Implement
func (agent *ServerAgentImpl) StopInstance(instanceId string) error {
	log.Printf("Stopping instance '%s'...", instanceId)

	cmd := exec.Command(
		"virsh", "shutdown", instanceId,
	)

	output, err := cmd.CombinedOutput()

	if err != nil {
		return logAndReturnError("Error stopping instance '"+instanceId+"': ", string(output))
	}

	log.Printf("Stopped instance '%s' successfully!", instanceId)

	return nil
}

// TODO: Implement
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

/* Keeping this as a reference for future use

func (agent *ServerAgentImpl) ForceStopVM(vmId string) error {
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
}*/

func (agent *ServerAgentImpl) ListInstancesStatus() ([]ListInstancesStatusResponse, error) {
	log.Printf("Getting VMs status...")

	cmd := exec.Command(
		"virsh", "list", "--all",
	)

	output, err := cmd.CombinedOutput()

	if err != nil {
		return nil, logAndReturnError("", string(output))
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

func toListBaseImagesResponse(fileNames []string) []ListBaseImagesResponse {
	response := []ListBaseImagesResponse{}
	response = append(response, ListBaseImagesResponse{FileNames: fileNames})
	return response
}

func createDir(path string) error {
	return os.MkdirAll(path, 0755)
}

func (agent *ServerAgentImpl) createTemplateMetadataFiles(
	templatePath string,
	request DefineTemplateRequest,
) error {
	cloudInitMetadata := CloudInitMetadata{
		InstanceId:    request.TemplateId,
		LocalHostname: "template-" + request.TemplateId,
	}

	// Create meta-data.yaml file from template
	tmpl, err := template.ParseFS(templateFS, "templates/meta-data.yaml.tmpl")
	if err != nil {
		return logAndReturnError("Error parsing meta-data.yaml template: ", err.Error())
	}

	metaDataFile, err := os.Create(templatePath + "/meta-data.yaml")
	if err != nil {
		return logAndReturnError("Error creating meta-data.yaml file: ", err.Error())
	}

	if err := tmpl.Execute(metaDataFile, cloudInitMetadata); err != nil {
		return logAndReturnError("Error executing meta-data.yaml template: ", err.Error())
	}

	metaDataFile.Close()

	// Copy user-data.yaml file from the instance used to create the template,
	// this is because the template shouldn't need to configure new user-data,
	// as they will never be started.
	instancePath := agent.vmsStoragePath + "/" + request.SourceInstanceId
	copyCmd := exec.Command(
		"cp",
		instancePath+"/user-data.yaml",
		templatePath+"/user-data.yaml",
	)

	copyCmdOutput, err := copyCmd.CombinedOutput()
	if err != nil {
		return logAndReturnError("Error copying user-data.yaml file: ", string(copyCmdOutput))
	}

	// Create cidata.iso using genisoimage
	createIsoCmd := exec.Command(
		"genisoimage",
		"-output", templatePath+"/cidata.iso",
		"-V", "cidata",
		"-r",
		"-J", templatePath+"/meta-data.yaml", templatePath+"/user-data.yaml",
	)

	createIsoCmdOutput, err := createIsoCmd.CombinedOutput()

	if err != nil {
		return logAndReturnError("Error creating cidata.iso: ", string(createIsoCmdOutput))
	}

	return nil
}

func (agent *ServerAgentImpl) createDiskImage(path string, data CreateDiskImageData) error {
	var sourceVmPath string
	if data.sourceIsBase {
		sourceVmPath = agent.vmsStoragePath + "/" + agent.cloudInitImagesPath + "/" + data.sourceVmId + ".qcow2"
	} else {
		sourceVmPath = agent.vmsStoragePath + "/" + data.sourceVmId + "/" + data.sourceVmId + ".qcow2"
	}

	createDiskImageCmd := exec.Command(
		"qemu-img",
		"create",
		"-b", sourceVmPath,
		"-f", "qcow2",
		"-F", "qcow2",
		path+"/"+data.sourceVmId+".qcow2",
		strconv.Itoa(data.SizeMB)+"M",
	)

	createDiskImageCmdOutput, err := createDiskImageCmd.CombinedOutput()
	if err != nil {
		return logAndReturnError("Error creating disk image: ", string(createDiskImageCmdOutput))
	}

	return nil
}

func (agent *ServerAgentImpl) createInstanceMetadataFile(path string, request CreateInstanceRequest) error {
	// TODO: Implement
	return nil
}

func toListInstancesStatusResponse(vmStatusMap map[string]string) []ListInstancesStatusResponse {
	response := []ListInstancesStatusResponse{}
	for vmName, status := range vmStatusMap {
		response = append(response, ListInstancesStatusResponse{InstanceId: vmName, Status: status})
	}
	return response
}

func logAndReturnError(customMsg string, err string) error {
	err = strings.TrimPrefix(err, "error")
	err = strings.TrimPrefix(err, "ERROR")
	err = strings.TrimPrefix(err, ":")
	err = strings.TrimSpace(err)
	log.Printf("%s%s", customMsg, err)
	return fmt.Errorf("%s%s", customMsg, err)
}

func NewServerAgent(vmsStoragePath string, cloudInitImagesPath string) ServerAgent {
	return &ServerAgentImpl{
		vmsStoragePath:      vmsStoragePath,
		cloudInitImagesPath: cloudInitImagesPath,
	}
}
