package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"path/filepath"
	"strings"
	"sync"

	"github.com/google/uuid"
)

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
	serverAgentsURLs            string
	listBaseImagesEndpoint      string
	defineTemplateEndpoint      string
	deleteTemplateEndpoint      string
	createInstanceEndpoint      string
	deleteInstanceEndpoint      string
	startInstanceEndpoint       string
	stopInstanceEndpoint        string
	restartInstanceEndpoint     string
	listInstancesStatusEndpoint string
	mutexMap                    map[string]*sync.Mutex
	mutex                       sync.Mutex
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

	if request.SizeMB <= 0 {
		return DefineTemplateResponse{}, NewHttpError(
			http.StatusBadRequest,
			fmt.Errorf("sizeMB must be greater than 0"),
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
		return DefineTemplateResponse{}, err
	}

	vmMutex := s.getMutex(request.SourceInstanceId)
	vmMutex.Lock()
	defer vmMutex.Unlock()

	resp, err := http.Post(
		s.serverAgentsURLs+s.defineTemplateEndpoint,
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

	vmMutex := s.getMutex(templateId)
	vmMutex.Lock()
	defer vmMutex.Unlock()

	resp, err := http.Post(
		// Calling deleteInstaceEndpoint because the server agent
		// makes no difference between a template and an instance
		s.serverAgentsURLs+s.deleteInstanceEndpoint+"/"+templateId,
		"application/json",
		nil,
	)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if err := checkIfStatusCodeIsOk(resp); err != nil {
		return err
	}

	s.deleteVmFromDb(templateId)
	s.deleteMutex(templateId)

	return nil
}

func (s *ServiceImpl) CreateInstance(request CreateInstanceRequest) (CreateInstanceResponse, error) {
	if request.SizeMB <= 0 ||
		request.Username == "" ||
		request.Password == "" {
		return CreateInstanceResponse{}, NewHttpError(
			http.StatusBadRequest,
			fmt.Errorf(
				"invalid request: sizeMB must be greater than 0, username and password must be non-empty",
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

	agentRequest := CreateInstanceAgentRequest{
		SourceVmId:    request.SourceVmId,
		SourceIsBase:  isBase,
		InstanceId:    instanceId,
		SizeMB:        request.SizeMB,
		VcpuCount:     request.VcpuCount,
		VramMB:        request.VramMB,
		Username:      request.Username,
		Password:      request.Password,
		PublicSshKeys: request.PublicSshKeys,
	}

	jsonData, err := json.Marshal(agentRequest)
	if err != nil {
		return CreateInstanceResponse{}, err
	}

	vmMutex := s.getMutex(request.SourceVmId)
	vmMutex.Lock()
	defer vmMutex.Unlock()

	resp, err := http.Post(
		s.serverAgentsURLs+s.createInstanceEndpoint,
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
		ID:          instanceId,
		Description: nil,
		DependsOn:   &request.SourceVmId,
	}

	s.addVmToDb(vm, false)

	return CreateInstanceResponse{
		InstanceId: instanceId,
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

	vmMutex := s.getMutex(instanceId)
	vmMutex.Lock()
	defer vmMutex.Unlock()

	resp, err := http.Post(
		s.serverAgentsURLs+s.deleteInstanceEndpoint+"/"+instanceId,
		"application/json",
		nil,
	)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if err := checkIfStatusCodeIsOk(resp); err != nil {
		return err
	}

	s.deleteVmFromDb(instanceId)
	s.deleteMutex(instanceId)

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

	vmMutex := s.getMutex(instanceId)
	vmMutex.Lock()
	defer vmMutex.Unlock()

	resp, err := http.Post(
		s.serverAgentsURLs+s.startInstanceEndpoint+"/"+instanceId,
		"application/json",
		nil,
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

	vmMutex := s.getMutex(instanceId)
	vmMutex.Lock()
	defer vmMutex.Unlock()

	resp, err := http.Post(
		s.serverAgentsURLs+s.stopInstanceEndpoint+"/"+instanceId,
		"application/json",
		nil,
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

func (s *ServiceImpl) RestartInstance(instanceId string) error {
	if err := s.checkIfVmExists(instanceId); err != nil {
		return err
	}

	if err := s.checkIfVmIsRunning(instanceId, true); err != nil {
		return err
	}

	vmMutex := s.getMutex(instanceId)
	vmMutex.Lock()
	defer vmMutex.Unlock()

	resp, err := http.Post(
		s.serverAgentsURLs+s.restartInstanceEndpoint+"/"+instanceId,
		"application/json",
		nil,
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

func (s *ServiceImpl) ListInstancesStatus() ([]ListInstancesStatusResponse, error) {
	resp, err := http.Get(s.serverAgentsURLs + s.listInstancesStatusEndpoint)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if err := checkIfStatusCodeIsOk(resp); err != nil {
		return nil, err
	}

	var statuses []ListInstancesStatusResponse
	if err := json.NewDecoder(resp.Body).Decode(&statuses); err != nil {
		return nil, err
	}

	return statuses, nil
}

func (s *ServiceImpl) getBaseImagesNames() ([]string, error) {
	resp, err := http.Get(s.serverAgentsURLs + s.listBaseImagesEndpoint)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, NewHttpError(resp.StatusCode, fmt.Errorf("failed to list base VMs"))
	}

	var baseImagesAgentResponse ListBaseImagesAgentResponse
	if err := json.NewDecoder(resp.Body).Decode(&baseImagesAgentResponse); err != nil {
		return nil, err
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
			// TODO: add compatibility with other languages
			if vm.Status == "running" && !wantRunning {
				return NewHttpError(
					http.StatusBadRequest,
					fmt.Errorf("VM '%s' is running", vmId),
				)
			}
			if vm.Status != "running" && wantRunning {
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
		log.Println(err.Error())
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
			return err
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
			return "", fmt.Errorf("failed to generate a new VM ID")
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
) (Service, error) {
	service := &ServiceImpl{
		db:                          db,
		serverAgentsURLs:            serverAgentsURLs[0], // TODO: support multiple server agents
		listBaseImagesEndpoint:      listBaseImagesEndpoint,
		defineTemplateEndpoint:      defineTemplateEndpoint,
		deleteTemplateEndpoint:      deleteTemplateEndpoint,
		createInstanceEndpoint:      createInstanceEndpoint,
		deleteInstanceEndpoint:      deleteInstanceEndpoint,
		startInstanceEndpoint:       startInstanceEndpoint,
		stopInstanceEndpoint:        stopInstanceEndpoint,
		restartInstanceEndpoint:     restartInstanceEndpoint,
		listInstancesStatusEndpoint: listInstancesStatusEndpoint,
		mutexMap:                    make(map[string]*sync.Mutex),
	}

	if err := service.addBaseImagesToDb(); err != nil {
		return nil, err
	}

	return service, nil
}
