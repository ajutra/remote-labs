package main

type CloneVmRequest struct {
	SourceVmName string `json:"sourceVmName"`
	TargetVmName string `json:"targetVmName"`
}
