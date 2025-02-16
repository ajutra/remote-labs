package main

type Service interface {
	CloneVM(request CloneVmRequest) error
	DeleteVM(vmName string) error
	StartVM(vmName string) error
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
