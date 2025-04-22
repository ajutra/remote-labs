package main

type CloneVmRequest struct {
	SourceVmId string `json:"sourceVmId"`
	TargetVmId string `json:"targetVmId"`
}

type ListVMsStatusResponse struct {
	VmId   string `json:"vmId"`
	Status string `json:"status"`
}
