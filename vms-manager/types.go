package main

type CloneVmRequest struct {
	SourceVmName string `json:"sourceVmName"`
	TargetVmName string `json:"targetVmName"`
}

type ListVMsStatusResponse struct {
	VmName string `json:"vmName"`
	Status string `json:"status"`
}
