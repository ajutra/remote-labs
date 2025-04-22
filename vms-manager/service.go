package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"
)

type Service interface {
	CloneVM(request CloneVmRequest) error
	DeleteVM(vmName string) error
	StartVM(vmName string) error
	StopVM(vmName string) error
	RestartVM(vmName string) error
	ForceStopVM(vmName string) error
	ListVMsStatus() ([]ListVMsStatusResponse, error)
}

type ServiceImpl struct {
	db             Database
	serverAgentURL string
	mutexMap       map[string]*sync.Mutex
	mutex          sync.Mutex
}

func NewService(db Database, serverAgentURL string) (Service, error) {
	service := &ServiceImpl{
		db:             db,
		serverAgentURL: serverAgentURL,
		mutexMap:       make(map[string]*sync.Mutex),
	}

	if err := service.addCurrentVMsToDb(); err != nil {
		return nil, err
	}

	return service, nil
}

func (s *ServiceImpl) getMutex(vmId string) *sync.Mutex {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	if s.mutexMap[vmId] == nil {
		s.mutexMap[vmId] = &sync.Mutex{}
	}

	return s.mutexMap[vmId]
}

func (s *ServiceImpl) CloneVM(request CloneVmRequest) error {
	if err := checkIfVmExists(request.SourceVmId, s.db); err != nil {
		return err
	}

	exists, err := s.db.VmExistsById(request.TargetVmId)
	if err != nil {
		return err
	}

	if exists {
		return NewHttpError(
			http.StatusBadRequest,
			fmt.Errorf("VM '%s' already exists", request.TargetVmId),
		)
	}

	vmMutex := s.getMutex(request.SourceVmId)
	vmMutex.Lock()
	defer vmMutex.Unlock()

	// Make API call to server-agent
	jsonData, err := json.Marshal(request)
	if err != nil {
		return err
	}

	resp, err := http.Post(s.serverAgentURL+"/vms/clone", "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		var apiErr ApiError
		if err := json.NewDecoder(resp.Body).Decode(&apiErr); err != nil {
			return err
		}
		return NewHttpError(resp.StatusCode, fmt.Errorf(apiErr.Error))
	}

	// Try to add the VM to the database until it succeeds
	for {
		if err := s.db.AddVm(request.TargetVmId); err != nil {
			log.Println(err.Error())
		} else {
			break
		}
	}

	return nil
}

func (s *ServiceImpl) DeleteVM(vmName string) error {
	if err := checkIfVmExists(vmName, s.db); err != nil {
		return err
	}

	vmMutex := s.getMutex(vmName)
	vmMutex.Lock()
	defer vmMutex.Unlock()

	// Make API call to server-agent
	req, err := http.NewRequest(http.MethodDelete, s.serverAgentURL+"/vms/delete/"+vmName, nil)
	if err != nil {
		return err
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		var apiErr ApiError
		if err := json.NewDecoder(resp.Body).Decode(&apiErr); err != nil {
			return err
		}
		return NewHttpError(resp.StatusCode, fmt.Errorf(apiErr.Error))
	}

	// Try to delete the VM from the database until it succeeds
	for {
		if err := s.db.DeleteVm(vmName); err != nil {
			log.Println(err.Error())
		} else {
			break
		}
	}

	return nil
}

func (s *ServiceImpl) StartVM(vmName string) error {
	if err := checkIfVmExists(vmName, s.db); err != nil {
		return err
	}

	vmMutex := s.getMutex(vmName)
	vmMutex.Lock()
	defer vmMutex.Unlock()

	// Make API call to server-agent
	resp, err := http.Post(s.serverAgentURL+"/vms/start/"+vmName, "application/json", nil)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		var apiErr ApiError
		if err := json.NewDecoder(resp.Body).Decode(&apiErr); err != nil {
			return err
		}
		return NewHttpError(resp.StatusCode, fmt.Errorf(apiErr.Error))
	}

	return nil
}

func (s *ServiceImpl) StopVM(vmName string) error {
	if err := checkIfVmExists(vmName, s.db); err != nil {
		return err
	}

	vmMutex := s.getMutex(vmName)
	vmMutex.Lock()
	defer vmMutex.Unlock()

	// Make API call to server-agent
	resp, err := http.Post(s.serverAgentURL+"/vms/stop/"+vmName, "application/json", nil)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		var apiErr ApiError
		if err := json.NewDecoder(resp.Body).Decode(&apiErr); err != nil {
			return err
		}
		return NewHttpError(resp.StatusCode, fmt.Errorf(apiErr.Error))
	}

	return nil
}

func (s *ServiceImpl) RestartVM(vmName string) error {
	if err := checkIfVmExists(vmName, s.db); err != nil {
		return err
	}

	vmMutex := s.getMutex(vmName)
	vmMutex.Lock()
	defer vmMutex.Unlock()

	// Make API call to server-agent
	resp, err := http.Post(s.serverAgentURL+"/vms/restart/"+vmName, "application/json", nil)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		var apiErr ApiError
		if err := json.NewDecoder(resp.Body).Decode(&apiErr); err != nil {
			return err
		}
		return NewHttpError(resp.StatusCode, fmt.Errorf(apiErr.Error))
	}

	return nil
}

func (s *ServiceImpl) ForceStopVM(vmName string) error {
	if err := checkIfVmExists(vmName, s.db); err != nil {
		return err
	}

	vmMutex := s.getMutex(vmName)
	vmMutex.Lock()
	defer vmMutex.Unlock()

	// Make API call to server-agent
	resp, err := http.Post(s.serverAgentURL+"/vms/force-stop/"+vmName, "application/json", nil)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		var apiErr ApiError
		if err := json.NewDecoder(resp.Body).Decode(&apiErr); err != nil {
			return err
		}
		return NewHttpError(resp.StatusCode, fmt.Errorf(apiErr.Error))
	}

	return nil
}

func (s *ServiceImpl) ListVMsStatus() ([]ListVMsStatusResponse, error) {
	// Make API call to server-agent
	resp, err := http.Get(s.serverAgentURL + "/vms/status")
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		var apiErr ApiError
		if err := json.NewDecoder(resp.Body).Decode(&apiErr); err != nil {
			return nil, err
		}
		return nil, NewHttpError(resp.StatusCode, fmt.Errorf(apiErr.Error))
	}

	var statuses []ListVMsStatusResponse
	if err := json.NewDecoder(resp.Body).Decode(&statuses); err != nil {
		return nil, err
	}

	return statuses, nil
}

func (s *ServiceImpl) addCurrentVMsToDb() error {
	log.Println("Trying to add current VMs to the database if they don't exist...")

	statuses, err := s.ListVMsStatus()
	if err != nil {
		return err
	}

	for _, vm := range statuses {
		exists, err := s.db.VmExistsById(vm.VmId)
		if err != nil {
			log.Println(err.Error())
			continue
		}

		if !exists {
			if err := s.db.AddVm(vm.VmId); err != nil {
				return err
			}
		}
	}

	return nil
}

func checkIfVmExists(vmId string, db Database) error {
	exists, err := db.VmExistsById(vmId)
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
