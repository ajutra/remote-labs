package main

type Service interface {
	CloneVM(request CloneVmRequest) error
	DeleteVM(vmName string) error
	StartVM(vmName string) error
	StopVM(vmName string) error
	RestartVM(vmName string) error
	ForceStopVM(vmName string) error
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
