package main

type Service interface {
	CloneVM(request CloneVmRequest) error
}

type VmService struct {
}

func NewService() Service {
	return &VmService{}
}

func (s *VmService) CloneVM(request CloneVmRequest) error {
	if err := CloneVM(request.SourceVmName, request.TargetVmName); err != nil {
		return err
	}
	return nil
}
