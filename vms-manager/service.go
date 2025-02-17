package main

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
}

func NewService(vmManager VmManager) Service {
	return &ServiceImpl{
		vmManager: vmManager,
	}
}

func (s *ServiceImpl) CloneVM(request CloneVmRequest) error {
	if err := s.vmManager.CloneVM(request.SourceVmName, request.TargetVmName); err != nil {
		return err
	}
	return nil
}

func (s *ServiceImpl) DeleteVM(vmName string) error {
	if err := s.vmManager.DeleteVM(vmName); err != nil {
		return err
	}
	return nil
}

func (s *ServiceImpl) StartVM(vmName string) error {
	if err := s.vmManager.StartVM(vmName); err != nil {
		return err
	}
	return nil
}

func (s *ServiceImpl) StopVM(vmName string) error {
	if err := s.vmManager.StopVM(vmName); err != nil {
		return err
	}
	return nil
}

func (s *ServiceImpl) RestartVM(vmName string) error {
	if err := s.vmManager.RestartVM(vmName); err != nil {
		return err
	}
	return nil
}

func (s *ServiceImpl) ForceStopVM(vmName string) error {
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
