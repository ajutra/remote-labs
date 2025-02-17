package main

import (
	"fmt"
	"log"
	"net/http"
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
	vmManager VmManager
	db        Database
}

func NewService(vmManager VmManager, db Database) (Service, error) {
	service := &ServiceImpl{
		vmManager: vmManager,
		db:        db,
	}

	if err := service.addCurrentVMsToDb(); err != nil {
		return nil, err
	}

	return service, nil
}

func (s *ServiceImpl) CloneVM(request CloneVmRequest) error {
	if err := checkIfVmExists(request.SourceVmName, s.db); err != nil {
		return err
	}

	if err := s.vmManager.CloneVM(request.SourceVmName, request.TargetVmName); err != nil {
		return err
	}
	return nil
}

func (s *ServiceImpl) DeleteVM(vmName string) error {
	if err := checkIfVmExists(vmName, s.db); err != nil {
		return err
	}

	if err := s.vmManager.DeleteVM(vmName); err != nil {
		return err
	}
	return nil
}

func (s *ServiceImpl) StartVM(vmName string) error {
	if err := checkIfVmExists(vmName, s.db); err != nil {
		return err
	}

	if err := s.vmManager.StartVM(vmName); err != nil {
		return err
	}
	return nil
}

func (s *ServiceImpl) StopVM(vmName string) error {
	if err := checkIfVmExists(vmName, s.db); err != nil {
		return err
	}

	if err := s.vmManager.StopVM(vmName); err != nil {
		return err
	}
	return nil
}

func (s *ServiceImpl) RestartVM(vmName string) error {
	if err := checkIfVmExists(vmName, s.db); err != nil {
		return err
	}

	if err := s.vmManager.RestartVM(vmName); err != nil {
		return err
	}
	return nil
}

func (s *ServiceImpl) ForceStopVM(vmName string) error {
	if err := checkIfVmExists(vmName, s.db); err != nil {
		return err
	}

	if err := s.vmManager.ForceStopVM(vmName); err != nil {
		return err
	}
	return nil
}

func (s *ServiceImpl) ListVMsStatus() ([]ListVMsStatusResponse, error) {
	status, err := s.vmManager.ListVMsStatus()
	if err != nil {
		return nil, err
	}
	return toVMsStatusResponse(status), nil
}

func (s *ServiceImpl) addCurrentVMsToDb() error {
	vms, err := s.vmManager.ListVMsStatus()
	if err != nil {
		return err
	}

	for vmName := range vms {
		exists, err := s.db.VmExistsByName(vmName)

		if err != nil {
			log.Println(err.Error())
		}

		if !exists {
			if err := s.db.AddVm(vmName); err != nil {
				return err
			}
		}
	}

	return nil
}

func toVMsStatusResponse(status map[string]string) []ListVMsStatusResponse {
	var response []ListVMsStatusResponse
	for vmName, status := range status {
		response = append(response, ListVMsStatusResponse{
			VmName: vmName,
			Status: status,
		})
	}
	return response
}

func checkIfVmExists(vmName string, db Database) error {
	exists, err := db.VmExistsByName(vmName)

	if err != nil {
		log.Println(err.Error())
		return err
	}

	if !exists {
		return NewHttpError(
			http.StatusBadRequest,
			fmt.Errorf("VM '%s' does not exist", vmName),
		)
	}

	return nil
}
