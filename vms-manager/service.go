package main

type Service interface {
	CloneVM(request CloneVmRequest) error
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
