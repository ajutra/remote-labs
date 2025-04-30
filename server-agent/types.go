package main

type ListBaseImagesResponse struct {
	FileNames []string `json:"fileNames"`
}

type DefineTemplateRequest struct {
	SourceInstanceId string `json:"sourceInstanceId"`
	TemplateId       string `json:"templateId"`
	SizeMB           int    `json:"sizeMB"`
	VcpuCount        int    `json:"vcpuCount"`
	VramMB           int    `json:"vramMB"`
}

type CreateInstanceRequest struct {
	TemplateId    string   `json:"templateId"`
	InstanceId    string   `json:"instanceId"`
	SizeMB        int      `json:"sizeMB"`
	VcpuCount     int      `json:"vcpuCount"`
	VramMB        int      `json:"vramMB"`
	Username      string   `json:"username"`
	Password      string   `json:"password"`
	PublicSshKeys []string `json:"publicSshKeys"`
}

type ListInstancesStatusResponse struct {
	InstanceId string `json:"instanceId"`
	Status     string `json:"status"`
}
