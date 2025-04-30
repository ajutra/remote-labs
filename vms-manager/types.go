package main

// VM Manager API
type ListBaseImagesResponse struct {
	BaseId      string `json:"baseId"`
	Description string `json:"description"`
}

type DefineTemplateResponse struct {
	TemplateId string `json:"templateId"`
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
	SourceVmId string `json:"sourceVmId"`
	TemplateId string `json:"templateId"`
}

type CreateInstanceAgentRequest struct {
	TemplateId string `json:"templateId"`
	InstanceId string `json:"instanceId"`
}

// Model
type Vm struct {
	ID          string
	Description *string
	DependsOn   *string
}
