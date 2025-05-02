package main

// VM Manager API
type ListBaseImagesResponse struct {
	BaseId      string `json:"baseId"`
	Description string `json:"description"`
}

type DefineTemplateRequest struct {
	SourceInstanceId string `json:"sourceInstanceId"`
	TemplateId       string `json:"templateId"`
	SizeMB           int    `json:"sizeMB"`
	VcpuCount        int    `json:"vcpuCount"`
	VramMB           int    `json:"vramMB"`
}

type DefineTemplateResponse struct {
	TemplateId string `json:"templateId"`
}

type CreateInstanceRequest struct {
	SourceVmId    string   `json:"sourceVmId"`
	SizeMB        int      `json:"sizeMB"`
	VcpuCount     int      `json:"vcpuCount"`
	VramMB        int      `json:"vramMB"`
	Username      string   `json:"username"`
	Password      string   `json:"password"`
	PublicSshKeys []string `json:"publicSshKeys"`
}

type CreateInstanceResponse struct {
	InstanceId string `json:"instanceId"`
}

type ListInstancesStatusResponse struct {
	InstanceId string `json:"instanceId"`
	Status     string `json:"status"`
}

type ApiError struct {
	Error string `json:"error"`
}

// Server Agent API
type ListBaseImagesAgentResponse struct {
	FileNames []string `json:"fileNames"`
}

type DefineTemplateAgentRequest struct {
	SourceInstanceId string `json:"sourceInstanceId"`
	TemplateId       string `json:"templateId"`
	SizeMB           int    `json:"sizeMB"`
	VcpuCount        int    `json:"vcpuCount"`
	VramMB           int    `json:"vramMB"`
}

type CreateInstanceAgentRequest struct {
	SourceVmId    string   `json:"sourceVmId"`
	SourceIsBase  bool     `json:"sourceIsBase"`
	InstanceId    string   `json:"instanceId"`
	SizeMB        int      `json:"sizeMB"`
	VcpuCount     int      `json:"vcpuCount"`
	VramMB        int      `json:"vramMB"`
	Username      string   `json:"username"`
	Password      string   `json:"password"`
	PublicSshKeys []string `json:"publicSshKeys"`
}

// Model
type Vm struct {
	ID          string
	Description *string
	DependsOn   *string
}
