package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"path/filepath"
	"slices"
	"strings"
	"sync"

	"github.com/google/uuid"
)

const RUNNING_STATUS = "running"
const SHUTOFF_STATUS = "shut off"
const FIRST_VLAN = 100
const MAX_VLANS = 255
const MAX_VMS_PER_VLAN = 253 // 255 total IPs in the subnet, minus the first IP (gateway) and the last IP (broadcast)
const FIRST_IP_IN_SUBNET = 1
const SUBNET_MASK = 24
const INTERFACE_ADDRESS_SECOND_OCTET = 1
const MAX_CPU_USAGE = 0.9
const MIN_AVAILABLE_RAM_MB = 1024
const CPU_USAGE_PENALTY_FACTOR = 10240 // 10240 MB of RAM for 100% of CPU Load, adjust this value to change the penalty for high CPU usage

type Service interface {
	ListBaseImages() ([]ListBaseImagesResponse, error)
	DefineTemplate(request DefineTemplateRequest) (DefineTemplateResponse, error)
	DeleteTemplate(templateId string) error
	CreateInstance(request CreateInstanceRequest) (CreateInstanceResponse, error)
	DeleteInstance(instanceId string) error
	StartInstance(instanceId string) error
	StopInstance(instanceId string) error
	RestartInstance(instanceId string) error
	ListInstancesStatus() ([]ListInstancesStatusResponse, error)
}

type ServiceImpl struct {
	db                          Database
	serverAgentsURLs            []string
	listBaseImagesEndpoint      string
	defineTemplateEndpoint      string
	deleteTemplateEndpoint      string
	createInstanceEndpoint      string
	deleteInstanceEndpoint      string
	startInstanceEndpoint       string
	stopInstanceEndpoint        string
	restartInstanceEndpoint     string
	listInstancesStatusEndpoint string
	getResourceStatusEndpoint   string
	serverAgentIsAliveEndpoint  string
	vmsDns1                     string
	vmsDns2                     string
	mutexMap                    map[string]*sync.Mutex
	mutex                       sync.Mutex
}

type VmNetworkConfig struct {
	IpAddWithSubnet  string
	Gateway          string
	VlanEtiquete     string
	VmVlanIdentifier int
}

func (s *ServiceImpl) ListBaseImages() ([]ListBaseImagesResponse, error) {
	baseImages, err := s.db.GetBaseImages()
	if err != nil {
		return nil, err
	}

	return s.toListBaseImagesResponse(baseImages)
}

func (s *ServiceImpl) DefineTemplate(request DefineTemplateRequest) (DefineTemplateResponse, error) {
	if err := s.checkIfVmExists(request.SourceInstanceId); err != nil {
		return DefineTemplateResponse{}, err
	}

	if err := s.checkIfVmIsRunning(request.SourceInstanceId, false); err != nil {
		return DefineTemplateResponse{}, err
	}

	isTemplate, err := s.db.VmIsTemplate(request.SourceInstanceId)
	if err != nil {
		return DefineTemplateResponse{}, err
	}
	if isTemplate {
		return DefineTemplateResponse{}, NewHttpError(
			http.StatusBadRequest,
			fmt.Errorf("VM '%s' is already a template", request.SourceInstanceId),
		)
	}

	isBase, err := s.db.VmIsBase(request.SourceInstanceId)
	if err != nil {
		return DefineTemplateResponse{}, err
	}
	if isBase {
		return DefineTemplateResponse{}, NewHttpError(
			http.StatusBadRequest,
			fmt.Errorf(
				"VM '%s' is a base image, it cannot be used to create a template",
				request.SourceInstanceId,
			),
		)
	}

	if request.SizeMB <= 0 ||
		request.VcpuCount <= 0 ||
		request.VramMB <= 0 {
		return DefineTemplateResponse{}, NewHttpError(
			http.StatusBadRequest,
			fmt.Errorf("sizeMB, vcpuCount and vramMB must be greater than 0"),
		)
	}
	templateId, err := s.generateNewVmId()
	if err != nil {
		return DefineTemplateResponse{}, err
	}

	agentRequest := DefineTemplateAgentRequest{
		SourceInstanceId: request.SourceInstanceId,
		TemplateId:       templateId,
		SizeMB:           request.SizeMB,
		VcpuCount:        request.VcpuCount,
		VramMB:           request.VramMB,
	}

	jsonData, err := json.Marshal(agentRequest)
	if err != nil {
		return DefineTemplateResponse{}, logAndReturnError("Error marshalling define template agent request: ", err.Error())
	}

	agentUrl, err := s.selectServerAgent()
	if err != nil {
		return DefineTemplateResponse{}, err
	}

	vmMutex := s.getMutex(request.SourceInstanceId)
	vmMutex.Lock()
	defer vmMutex.Unlock()

	resp, err := http.Post(
		agentUrl+s.defineTemplateEndpoint,
		"application/json",
		bytes.NewBuffer(jsonData),
	)
	if err != nil {
		return DefineTemplateResponse{}, err
	}
	defer resp.Body.Close()
	if err := checkIfStatusCodeIsOk(resp); err != nil {
		return DefineTemplateResponse{}, err
	}

	vm := Vm{
		ID:          templateId,
		Description: nil,
		DependsOn:   nil,
	}

	s.addVmToDb(vm, true)

	return DefineTemplateResponse{
		TemplateId: templateId,
	}, nil
}

func (s *ServiceImpl) DeleteTemplate(templateId string) error {
	if err := s.checkIfVmExists(templateId); err != nil {
		return err
	}

	isTemplate, err := s.db.VmIsTemplate(templateId)
	if err != nil {
		return err
	}
	if !isTemplate {
		return NewHttpError(
			http.StatusBadRequest,
			fmt.Errorf("VM '%s' is not a template", templateId),
		)
	}

	hasInstancesThatDependOnIt, err := s.db.VmHasInstancesThatDependOnIt(templateId)
	if err != nil {
		return err
	}
	if hasInstancesThatDependOnIt {
		return NewHttpError(
			http.StatusBadRequest,
			fmt.Errorf("VM '%s' has instances that depend on it", templateId),
		)
	}

	// We don't want to remove the etiq because templates don't have network configuration
	request := DeleteVmAgentRequest{
		VmId:           templateId,
		RemoveEtiquete: false,
		Vid:            "",
	}

	jsonData, err := json.Marshal(request)
	if err != nil {
		return logAndReturnError("Error marshalling delete template agent request: ", err.Error())
	}

	// We need to call the deleteInstanceEndpoint for each server agent
	// because the template might not exist in all of them
	agentsCalled := 0
	vmMutex := s.getMutex(templateId)
	vmMutex.Lock()
	defer vmMutex.Unlock()
	for _, agentUrl := range s.serverAgentsURLs {
		if err := s.checkIfServerAgentIsAlive(agentUrl); err != nil {
			continue
		}
		agentsCalled++

		// Calling deleteInstaceEndpoint because the server agent
		// makes no difference between a template and an instance
		req, err := http.NewRequest(
			http.MethodDelete,
			agentUrl+s.deleteInstanceEndpoint,
			bytes.NewBuffer(jsonData),
		)
		if err != nil {
			return logAndReturnError("Error creating delete template request: ", err.Error())
		}

		client := &http.Client{}
		resp, err := client.Do(req)
		if err != nil {
			return logAndReturnError("Error sending delete template request: ", err.Error())
		}

		if err := checkIfStatusCodeIsOk(resp); err != nil {
			return err
		}

		resp.Body.Close()
	}

	if agentsCalled == 0 {
		return NewHttpError(
			http.StatusInternalServerError,
			fmt.Errorf("no server agents available to delete template"),
		)
	}
	s.deleteVmFromDb(templateId)
	s.deleteMutex(templateId)

	return nil
}

func (s *ServiceImpl) CreateInstance(request CreateInstanceRequest) (CreateInstanceResponse, error) {
	if request.SizeMB <= 0 ||
		request.VcpuCount <= 0 ||
		request.VramMB <= 0 ||
		request.Username == "" ||
		request.Password == "" ||
		request.SubjectId == "" ||
		request.UserWgPubKey == "" {
		return CreateInstanceResponse{}, NewHttpError(
			http.StatusBadRequest,
			fmt.Errorf(
				"invalid request: sizeMB must be greater than 0, username, password, subjectId and userWgPubKey must be non-empty",
			),
		)
	}

	if err := s.checkIfVmExists(request.SourceVmId); err != nil {
		return CreateInstanceResponse{}, err
	}

	isTemplate, err := s.db.VmIsTemplate(request.SourceVmId)
	if err != nil {
		return CreateInstanceResponse{}, err
	}

	isBase, err := s.db.VmIsBase(request.SourceVmId)
	if err != nil {
		return CreateInstanceResponse{}, err
	}

	if !isTemplate && !isBase {
		return CreateInstanceResponse{}, NewHttpError(
			http.StatusBadRequest,
			fmt.Errorf("VM '%s' is not a template or base image", request.SourceVmId),
		)
	}

	instanceId, err := s.generateNewVmId()
	if err != nil {
		return CreateInstanceResponse{}, err
	}

	vmNetworkConfig, err := s.getVmNetworkConfigFromSubjectId(request.SubjectId)
	if err != nil {
		return CreateInstanceResponse{}, err
	}

	// If the source VM is a base image, we need to get the description
	// this is because base images are stored in servers with their description as the file name.
	// Non-base VMs are stored with their ID as the file name.
	var sourceVmId string
	if isBase {
		sourceVmId, err = s.db.GetDescriptionById(request.SourceVmId)
		if err != nil {
			return CreateInstanceResponse{}, err
		}
	} else {
		sourceVmId = request.SourceVmId
	}

	agentRequest := CreateInstanceAgentRequest{
		SourceVmId:      sourceVmId,
		SourceIsBase:    isBase,
		InstanceId:      instanceId,
		SizeMB:          request.SizeMB,
		VcpuCount:       request.VcpuCount,
		VramMB:          request.VramMB,
		Username:        request.Username,
		Password:        request.Password,
		PublicSshKeys:   request.PublicSshKeys,
		IpAddWithSubnet: vmNetworkConfig.IpAddWithSubnet,
		Dns1:            s.vmsDns1,
		Dns2:            s.vmsDns2,
		Gateway:         vmNetworkConfig.Gateway,
		VlanEtiquete:    vmNetworkConfig.VlanEtiquete,
	}

	jsonData, err := json.Marshal(agentRequest)
	if err != nil {
		return CreateInstanceResponse{}, logAndReturnError("Error marshalling create instance agent request: ", err.Error())
	}

	agentUrl, err := s.selectServerAgent()
	if err != nil {
		return CreateInstanceResponse{}, err
	}

	vmMutex := s.getMutex(request.SourceVmId)
	vmMutex.Lock()
	defer vmMutex.Unlock()

	resp, err := http.Post(
		agentUrl+s.createInstanceEndpoint,
		"application/json",
		bytes.NewBuffer(jsonData),
	)
	if err != nil {
		return CreateInstanceResponse{}, err
	}
	defer resp.Body.Close()
	if err := checkIfStatusCodeIsOk(resp); err != nil {
		return CreateInstanceResponse{}, err
	}

	vm := Vm{
		ID:               instanceId,
		Description:      nil,
		DependsOn:        &request.SourceVmId,
		SubjectId:        &request.SubjectId,
		VmVlanIdentifier: &vmNetworkConfig.VmVlanIdentifier,
	}

	s.addVmToDb(vm, false)

	interfaceAddress := getInterfaceAddress(vmNetworkConfig.IpAddWithSubnet)
	peerAllowedIps := []string{
		vmNetworkConfig.IpAddWithSubnet,
		interfaceAddress,
	}

	return CreateInstanceResponse{
		InstanceId:       instanceId,
		InterfaceAddress: interfaceAddress,
		PeerPublicKey:    "Not implemented yet", // TODO: Implement this
		PeerAllowedIps:   peerAllowedIps,
		PeerEndpointPort: 0, // TODO: Implement this
	}, nil
}

func (s *ServiceImpl) DeleteInstance(instanceId string) error {
	if err := s.checkIfVmExists(instanceId); err != nil {
		return err
	}

	if err := s.checkIfVmIsTemplateOrBase(instanceId); err != nil {
		return err
	}

	if err := s.checkIfVmIsRunning(instanceId, false); err != nil {
		return err
	}

	vlan, err := s.db.GetVlanByVmId(instanceId)
	if err != nil {
		return err
	}

	// Check if the instance is the last one in that subject
	// If it is, we need to unassign the vlan from the bridge
	isLastInstanceInSubject, err := s.db.VmIsLastInstanceInSubject(instanceId)
	if err != nil {
		return err
	}

	request := DeleteVmAgentRequest{
		VmId:           instanceId,
		RemoveEtiquete: isLastInstanceInSubject,
		Vid:            fmt.Sprintf("%d", vlan),
	}

	jsonData, err := json.Marshal(request)
	if err != nil {
		return logAndReturnError("Error marshalling delete instance agent request: ", err.Error())
	}

	// We need to call the deleteInstanceEndpoint for each server agent
	// because the instance might exist in some of them
	agentsCalled := 0
	vmMutex := s.getMutex(instanceId)
	vmMutex.Lock()
	defer vmMutex.Unlock()
	for _, agentUrl := range s.serverAgentsURLs {
		if err := s.checkIfServerAgentIsAlive(agentUrl); err != nil {
			continue
		}
		agentsCalled++

		req, err := http.NewRequest(
			http.MethodDelete,
			agentUrl+s.deleteInstanceEndpoint,
			bytes.NewBuffer(jsonData),
		)
		if err != nil {
			return logAndReturnError("Error creating delete instance request: ", err.Error())
		}

		client := &http.Client{}
		resp, err := client.Do(req)
		if err != nil {
			return logAndReturnError("Error sending delete instance request: ", err.Error())
		}

		if err := checkIfStatusCodeIsOk(resp); err != nil {
			return err
		}

		resp.Body.Close()
	}

	if agentsCalled != len(s.serverAgentsURLs) {
		return NewHttpError(
			http.StatusInternalServerError,
			fmt.Errorf("some server agents did not respond to delete instance request, please try again later"),
		)
	}

	subjectId, err := s.db.GetSubjectIdByVmId(instanceId)
	if err != nil {
		return err
	}

	s.deleteVmFromDb(instanceId)
	s.deleteMutex(instanceId)

	if isLastInstanceInSubject {
		s.deleteSubjectFromDb(subjectId)
	}

	return nil
}

func (s *ServiceImpl) StartInstance(instanceId string) error {
	if err := s.checkIfVmExists(instanceId); err != nil {
		return err
	}

	if err := s.checkIfVmIsTemplateOrBase(instanceId); err != nil {
		return err
	}

	if err := s.checkIfVmIsRunning(instanceId, false); err != nil {
		return err
	}

	vlan, err := s.db.GetVlanByVmId(instanceId)
	if err != nil {
		return err
	}

	vmVlanIdentifier, err := s.db.GetVmVlanIdentifierByVmId(instanceId)
	if err != nil {
		return err
	}

	request := StartInstanceAgentRequest{
		InstanceId:   instanceId,
		Vid:          fmt.Sprintf("%d", vlan),
		VlanEtiquete: getVlanEtiquete(vlan, vmVlanIdentifier),
	}

	jsonData, err := json.Marshal(request)
	if err != nil {
		return logAndReturnError("Error marshalling start instance agent request: ", err.Error())
	}

	agentUrl, err := s.selectServerAgent()
	if err != nil {
		return err
	}

	vmMutex := s.getMutex(instanceId)
	vmMutex.Lock()
	defer vmMutex.Unlock()

	resp, err := http.Post(
		agentUrl+s.startInstanceEndpoint,
		"application/json",
		bytes.NewBuffer(jsonData),
	)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if err := checkIfStatusCodeIsOk(resp); err != nil {
		return err
	}

	return nil
}

func (s *ServiceImpl) StopInstance(instanceId string) error {
	if err := s.checkIfVmExists(instanceId); err != nil {
		return err
	}

	if err := s.checkIfVmIsRunning(instanceId, true); err != nil {
		return err
	}

	// We need to call the stopInstanceEndpoint for each server agent until we get a 200 response
	// because we don't know which server agent the instance is running on
	vmMutex := s.getMutex(instanceId)
	vmMutex.Lock()
	defer vmMutex.Unlock()
	for _, agentUrl := range s.serverAgentsURLs {
		if err := s.checkIfServerAgentIsAlive(agentUrl); err != nil {
			continue
		}

		resp, err := http.Post(
			agentUrl+s.stopInstanceEndpoint+"/"+instanceId,
			"application/json",
			nil,
		)
		if err != nil {
			return err
		}
		defer resp.Body.Close()

		if resp.StatusCode == http.StatusBadRequest {
			resp.Body.Close()
			continue
		}

		if err := checkIfStatusCodeIsOk(resp); err != nil {
			return err
		}

		// If we get a 200 response, we found the server agent that is running the instance
		// and we can break the loop
		break
	}

	return nil
}

func (s *ServiceImpl) RestartInstance(instanceId string) error {
	if err := s.checkIfVmExists(instanceId); err != nil {
		return err
	}

	if err := s.checkIfVmIsRunning(instanceId, true); err != nil {
		return err
	}

	// We need to call the restartInstanceEndpoint for each server agent until we get a 200 response
	// because we don't know which server agent the instance is running on
	correctServerFound := false
	vmMutex := s.getMutex(instanceId)
	vmMutex.Lock()
	defer vmMutex.Unlock()
	for _, agentUrl := range s.serverAgentsURLs {
		if err := s.checkIfServerAgentIsAlive(agentUrl); err != nil {
			continue
		}

		resp, err := http.Post(
			agentUrl+s.restartInstanceEndpoint+"/"+instanceId,
			"application/json",
			nil,
		)
		if err != nil {
			return err
		}
		defer resp.Body.Close()

		if resp.StatusCode == http.StatusBadRequest {
			resp.Body.Close()
			continue
		}

		if err := checkIfStatusCodeIsOk(resp); err != nil {
			return err
		}

		correctServerFound = true

		// If we get a 200 response, we found the server agent that is running the instance
		// and we can break the loop
		break
	}

	if !correctServerFound {
		return NewHttpError(
			http.StatusInternalServerError,
			fmt.Errorf("server agent did not respond, please start the instance again"),
		)
	}

	return nil
}

func (s *ServiceImpl) ListInstancesStatus() ([]ListInstancesStatusResponse, error) {
	var globalStatuses []ListInstancesStatusResponse

	// We need to call the listInstancesStatusEndpoint for each server agent to get the status of all instances
	agentsCalled := 0
	for _, agentUrl := range s.serverAgentsURLs {
		if err := s.checkIfServerAgentIsAlive(agentUrl); err != nil {
			continue
		}
		agentsCalled++
		resp, err := http.Get(agentUrl + s.listInstancesStatusEndpoint)
		if err != nil {
			return nil, err
		}

		if err := checkIfStatusCodeIsOk(resp); err != nil {
			return nil, err
		}

		var statuses []ListInstancesStatusResponse
		if err := json.NewDecoder(resp.Body).Decode(&statuses); err != nil {
			return nil, logAndReturnError("Error decoding list instances status response: ", err.Error())
		}

		// We check if the vmId is already in the globalStatuses
		// If it is, we update the status only if the new status is running
		// If it is not, we add the status to the globalStatuses
		for _, vmStatus := range statuses {
			found := false
			for i, existingStatus := range globalStatuses {
				if existingStatus.InstanceId == vmStatus.InstanceId {
					found = true
					if vmStatus.Status == RUNNING_STATUS {
						globalStatuses[i] = vmStatus
					}
					break
				}
			}
			if !found {
				globalStatuses = append(globalStatuses, vmStatus)
			}
		}
	}

	if agentsCalled != len(s.serverAgentsURLs) {
		// In case some server agents did not respond, we need to add missing VMs with a status of "shut off"
		vmIds, err := s.db.GetAllVmIds()
		if err != nil {
			return nil, err
		}

		for _, vmId := range vmIds {
			found := false
			for _, vmStatus := range globalStatuses {
				if vmStatus.InstanceId == vmId {
					found = true
					break
				}
			}
			if !found {
				globalStatuses = append(globalStatuses, ListInstancesStatusResponse{
					InstanceId: vmId,
					Status:     SHUTOFF_STATUS,
				})
			}
		}
	}

	return globalStatuses, nil
}

func (s *ServiceImpl) selectServerAgent() (string, error) {
	var selectedAgent string
	var bestScore float64

	for _, agentUrl := range s.serverAgentsURLs {
		if err := s.checkIfServerAgentIsAlive(agentUrl); err != nil {
			continue
		}

		resourceStatus, err := s.getResourceStatus(agentUrl)
		if err != nil {
			continue
		}

		if resourceStatus.FreeMemoryMB < MIN_AVAILABLE_RAM_MB || resourceStatus.CpuLoad > MAX_CPU_USAGE {
			continue
		}

		score := getServerAgentScore(resourceStatus)
		if score > bestScore {
			bestScore = score
			selectedAgent = agentUrl
		}
	}

	if selectedAgent == "" {
		return "", NewHttpError(
			http.StatusInternalServerError,
			fmt.Errorf("all servers are busy, please try again later"),
		)
	}

	return selectedAgent, nil
}

func (s *ServiceImpl) checkIfServerAgentIsAlive(agentUrl string) error {
	resp, err := http.Get(agentUrl + s.serverAgentIsAliveEndpoint)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if err := checkIfStatusCodeIsOk(resp); err != nil {
		return err
	}

	return nil
}

func (s *ServiceImpl) getResourceStatus(agentUrl string) (GetResourceStatusAgentResponse, error) {
	resp, err := http.Get(agentUrl + s.getResourceStatusEndpoint)
	if err != nil {
		return GetResourceStatusAgentResponse{}, err
	}
	defer resp.Body.Close()

	if err := checkIfStatusCodeIsOk(resp); err != nil {
		return GetResourceStatusAgentResponse{}, err
	}

	var resourceStatus GetResourceStatusAgentResponse
	if err := json.NewDecoder(resp.Body).Decode(&resourceStatus); err != nil {
		return GetResourceStatusAgentResponse{}, logAndReturnError("Error decoding get resource status response: ", err.Error())
	}

	return resourceStatus, nil
}

func getServerAgentScore(resourceStatus GetResourceStatusAgentResponse) float64 {
	return float64(resourceStatus.FreeMemoryMB) - (CPU_USAGE_PENALTY_FACTOR * resourceStatus.CpuLoad)
}

func (s *ServiceImpl) getBaseImagesNames() ([]string, error) {
	agentUrl, err := s.selectServerAgent()
	if err != nil {
		return nil, err
	}

	resp, err := http.Get(agentUrl + s.listBaseImagesEndpoint)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, NewHttpError(resp.StatusCode, fmt.Errorf("failed to list base VMs"))
	}

	var baseImagesAgentResponse ListBaseImagesAgentResponse
	if err := json.NewDecoder(resp.Body).Decode(&baseImagesAgentResponse); err != nil {
		return nil, logAndReturnError("Error decoding list base images agent response: ", err.Error())
	}

	var baseImages []string
	for _, baseImage := range baseImagesAgentResponse.FileNames {
		baseImages = append(baseImages, strings.TrimSuffix(baseImage, filepath.Ext(baseImage)))
	}

	return baseImages, nil
}

func (s *ServiceImpl) checkIfVmIsRunning(vmId string, wantRunning bool) error {
	statuses, err := s.ListInstancesStatus()
	if err != nil {
		return err
	}

	for _, vm := range statuses {
		if vm.InstanceId == vmId {
			if vm.Status == RUNNING_STATUS && !wantRunning {
				return NewHttpError(
					http.StatusBadRequest,
					fmt.Errorf("VM '%s' is running", vmId),
				)
			}
			if vm.Status != RUNNING_STATUS && wantRunning {
				return NewHttpError(
					http.StatusBadRequest,
					fmt.Errorf("VM '%s' is not running", vmId),
				)
			}
			return nil
		}
	}

	if wantRunning {
		return NewHttpError(
			http.StatusBadRequest,
			fmt.Errorf("VM '%s' not found", vmId),
		)
	}

	return nil
}

func (s *ServiceImpl) addBaseImagesToDb() error {
	log.Println("Trying to add base images to the database if they don't exist...")

	baseImages, err := s.getBaseImagesNames()
	if err != nil {
		return err
	}

	// Delete all base images that are not in the list of base images
	if err := s.db.DeleteBaseImagesNotInList(baseImages); err != nil {
		return err
	}

	for _, baseImage := range baseImages {
		exists, err := s.db.VmExistsByDescription(baseImage)
		if err != nil {
			log.Println(err.Error())
			continue
		}

		if !exists {
			vmId, err := s.generateNewVmId()
			if err != nil {
				return err
			}

			vm := Vm{
				ID:          vmId,
				Description: &baseImage,
				DependsOn:   nil,
			}

			if err := s.db.AddVm(vm, true, false); err != nil {
				return err
			}
		}
	}

	return nil
}

func (s *ServiceImpl) checkIfVmExists(vmId string) error {
	exists, err := s.db.VmExistsById(vmId)
	if err != nil {
		return err
	}

	if !exists {
		return NewHttpError(
			http.StatusBadRequest,
			fmt.Errorf("VM '%s' does not exist", vmId),
		)
	}
	return nil
}

func (s *ServiceImpl) toListBaseImagesResponse(baseImages []Vm) ([]ListBaseImagesResponse, error) {
	var baseImagesList []ListBaseImagesResponse
	for _, baseImage := range baseImages {
		baseImagesList = append(baseImagesList, ListBaseImagesResponse{
			BaseId:      baseImage.ID,
			Description: *baseImage.Description,
		})
	}
	return baseImagesList, nil
}

func checkIfStatusCodeIsOk(resp *http.Response) error {
	if resp.StatusCode != http.StatusOK {
		var apiErr ApiError
		if err := json.NewDecoder(resp.Body).Decode(&apiErr); err != nil {
			// If JSON decoding fails, read the response body as a string
			body, err := io.ReadAll(resp.Body)
			if err != nil {
				return logAndReturnError("Error reading response body: ", err.Error())
			}
			return NewHttpError(resp.StatusCode, fmt.Errorf("%s", string(body)))
		}
		return NewHttpError(resp.StatusCode, fmt.Errorf(apiErr.Error))
	}
	return nil
}

func (s *ServiceImpl) generateNewVmId() (string, error) {
	var vmId string
	errorCount := 0
	for {
		vmId = uuid.New().String()

		if exists, err := s.db.VmExistsById(vmId); !exists && err == nil {
			break
		}

		errorCount++
		if errorCount > 10 {
			return "", logAndReturnError("Failed to generate a new VM ID", "")
		}
	}

	return vmId, nil
}

func (s *ServiceImpl) addVmToDb(vm Vm, isTemplate bool) {
	// Try to add the VM to the database until it succeeds
	// The only reason it might fail is if the DB has gone down
	// All the other scenarios are checked before calling this function
	// In that case, the VM will be added to the database when the DB is back up
	for {
		if err := s.db.AddVm(vm, false, isTemplate); err != nil {
			log.Println(err.Error())
		} else {
			break
		}
	}
}

func (s *ServiceImpl) deleteVmFromDb(vmId string) {
	// Try to delete the VM from the database until it succeeds
	// The only reason it might fail is if the DB has gone down
	// All the other scenarios are checked before calling this function
	// In that case, the VM will be deleted from the database when the DB is back up
	for {
		if err := s.db.DeleteVm(vmId); err != nil {
			log.Println(err.Error())
		} else {
			break
		}
	}
}

func (s *ServiceImpl) checkIfVmIsTemplateOrBase(vmId string) error {
	isTemplate, err := s.db.VmIsTemplate(vmId)
	if err != nil {
		return err
	}

	if isTemplate {
		return NewHttpError(http.StatusBadRequest, fmt.Errorf("VM '%s' is a template", vmId))
	}

	isBase, err := s.db.VmIsBase(vmId)
	if err != nil {
		return err
	}

	if isBase {
		return NewHttpError(http.StatusBadRequest, fmt.Errorf("VM '%s' is a base image", vmId))
	}

	return nil
}

func (s *ServiceImpl) getVmNetworkConfigFromSubjectId(subjectId string) (VmNetworkConfig, error) {
	exists, err := s.db.SubjectExistsById(subjectId)
	if err != nil {
		return VmNetworkConfig{}, err
	}

	var vlan int
	if !exists {
		vlan, err = s.getFirstAvailableVlan()
		if err != nil {
			return VmNetworkConfig{}, err
		}

		subject := Subject{
			SubjectId: subjectId,
			Vlan:      vlan,
		}

		s.addSubjectToDb(subject)
	} else {
		vlan, err = s.db.GetSubjectVlan(subjectId)
		if err != nil {
			return VmNetworkConfig{}, err
		}
	}

	vmVlanIdentifier, err := s.getFirstAvailableVmVlanIdentifier(vlan)
	if err != nil {
		return VmNetworkConfig{}, err
	}

	gateway := getGatewayIp(vlan)
	ipAddWithSubnet := getIpAddWithSubnet(vlan, vmVlanIdentifier)
	vlanEtiquete := getVlanEtiquete(vlan, vmVlanIdentifier)

	return VmNetworkConfig{
		IpAddWithSubnet:  ipAddWithSubnet,
		Gateway:          gateway,
		VlanEtiquete:     vlanEtiquete,
		VmVlanIdentifier: vmVlanIdentifier,
	}, nil
}

func (s *ServiceImpl) getFirstAvailableVlan() (int, error) {
	vlans, err := s.db.GetAllVlans()
	if err != nil {
		return 0, err
	}

	if len(vlans) == MAX_VLANS {
		return 0, NewHttpError(
			http.StatusInternalServerError,
			fmt.Errorf("no more vlans available"),
		)
	}

	auxVlan := FIRST_VLAN
	for {
		if !slices.Contains(vlans, auxVlan) {
			return auxVlan, nil
		}
		auxVlan++
	}
}

func (s *ServiceImpl) addSubjectToDb(subject Subject) {
	// Try to add the subject to the database until it succeeds
	// The only reason it might fail is if the DB has gone down
	// All the other scenarios are checked before calling this function
	// In that case, the subject will be added to the database when the DB is back up
	for {
		if err := s.db.AddSubject(subject); err != nil {
			log.Println(err.Error())
		} else {
			break
		}
	}
}

func (s *ServiceImpl) getFirstAvailableVmVlanIdentifier(vlan int) (int, error) {
	vmsVlanIdentifiers, err := s.db.GetVmsVlanIdentifiers(vlan)
	if err != nil {
		return 0, err
	}

	if len(vmsVlanIdentifiers) == MAX_VMS_PER_VLAN {
		return 0, NewHttpError(
			http.StatusInternalServerError,
			fmt.Errorf("maximum number of VMs per VLAN reached"),
		)
	}

	auxVlanIdentifier := 1
	for {
		if !slices.Contains(vmsVlanIdentifiers, auxVlanIdentifier) {
			return auxVlanIdentifier, nil
		}
		auxVlanIdentifier++
	}
}

func getGatewayIp(vlan int) string {
	return fmt.Sprintf("10.0.%d.%d", mapVlanToThirdIpOctet(vlan), FIRST_IP_IN_SUBNET)
}

func getIpAddWithSubnet(vlan int, vmVlanIdentifier int) string {
	return fmt.Sprintf(
		"10.0.%d.%d/%d",
		mapVlanToThirdIpOctet(vlan),
		vmVlanIdentifier+FIRST_IP_IN_SUBNET,
		SUBNET_MASK,
	)
}

func mapVlanToThirdIpOctet(vlan int) int {
	return vlan - FIRST_VLAN
}

func getVlanEtiquete(vlan int, vmVlanIdentifier int) string {
	return fmt.Sprintf("vlan%d-%d", vlan, vmVlanIdentifier)
}

func getInterfaceAddress(vmIpAddWithSubnet string) string {
	ipParts := strings.Split(vmIpAddWithSubnet, ".")
	return fmt.Sprintf(
		"%s.%d.%s.%s",
		ipParts[0],
		INTERFACE_ADDRESS_SECOND_OCTET,
		ipParts[2],
		ipParts[3],
	)
}

func (s *ServiceImpl) deleteSubjectFromDb(subjectId string) {
	// Try to delete the subject from the database until it succeeds
	// The only reason it might fail is if the DB has gone down
	// All the other scenarios are checked before calling this function
	// In that case, the subject will be deleted from the database when the DB is back up
	for {
		if err := s.db.DeleteSubject(subjectId); err != nil {
			log.Println(err.Error())
		} else {
			break
		}
	}
}

func (s *ServiceImpl) getMutex(vmId string) *sync.Mutex {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	if s.mutexMap[vmId] == nil {
		s.mutexMap[vmId] = &sync.Mutex{}
	}

	return s.mutexMap[vmId]
}

func (s *ServiceImpl) deleteMutex(vmId string) {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	delete(s.mutexMap, vmId)
}

func NewService(
	db Database,
	serverAgentsURLs []string,
	listBaseImagesEndpoint string,
	defineTemplateEndpoint string,
	deleteTemplateEndpoint string,
	createInstanceEndpoint string,
	deleteInstanceEndpoint string,
	startInstanceEndpoint string,
	stopInstanceEndpoint string,
	restartInstanceEndpoint string,
	listInstancesStatusEndpoint string,
	getResourceStatusEndpoint string,
	serverAgentIsAliveEndpoint string,
	vmsDns1 string,
	vmsDns2 string,
) (Service, error) {
	service := &ServiceImpl{
		db:                          db,
		serverAgentsURLs:            serverAgentsURLs,
		listBaseImagesEndpoint:      listBaseImagesEndpoint,
		defineTemplateEndpoint:      defineTemplateEndpoint,
		deleteTemplateEndpoint:      deleteTemplateEndpoint,
		createInstanceEndpoint:      createInstanceEndpoint,
		deleteInstanceEndpoint:      deleteInstanceEndpoint,
		startInstanceEndpoint:       startInstanceEndpoint,
		stopInstanceEndpoint:        stopInstanceEndpoint,
		restartInstanceEndpoint:     restartInstanceEndpoint,
		listInstancesStatusEndpoint: listInstancesStatusEndpoint,
		getResourceStatusEndpoint:   getResourceStatusEndpoint,
		serverAgentIsAliveEndpoint:  serverAgentIsAliveEndpoint,
		vmsDns1:                     vmsDns1,
		vmsDns2:                     vmsDns2,
		mutexMap:                    make(map[string]*sync.Mutex),
	}

	if err := service.addBaseImagesToDb(); err != nil {
		return nil, err
	}

	return service, nil
}
