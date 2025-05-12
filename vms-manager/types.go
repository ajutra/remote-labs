package main

// VM Manager API
type ListBaseImagesResponse struct {
	BaseId      string `json:"baseId"`
	Description string `json:"description"`
}

type DefineTemplateRequest struct {
	SourceInstanceId string `json:"sourceInstanceId"`
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
	SubjectId     string   `json:"subjectId"`
	UserWgPubKey  string   `json:"userWgPubKey"` // User's WireGuard public key
}

type CreateInstanceResponse struct {
	InstanceId       string   `json:"instanceId"`
	InterfaceAddress string   `json:"interfaceAddress"`
	PeerPublicKey    string   `json:"peerPublicKey"`
	PeerAllowedIps   []string `json:"peerAllowedIps"`
	PeerEndpointPort int      `json:"peerEndpointPort"`
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
	SourceVmId      string   `json:"sourceVmId"`
	SourceIsBase    bool     `json:"sourceIsBase"`
	InstanceId      string   `json:"instanceId"`
	SizeMB          int      `json:"sizeMB"`
	VcpuCount       int      `json:"vcpuCount"`
	VramMB          int      `json:"vramMB"`
	Username        string   `json:"username"`
	Password        string   `json:"password"`
	PublicSshKeys   []string `json:"publicSshKeys"`
	IpAddWithSubnet string   `json:"ipAddWithSubnet"`
	Dns1            string   `json:"dns1"`
	Dns2            string   `json:"dns2"`
	Gateway         string   `json:"gateway"`
	VlanEtiquete    string   `json:"vlanEtiquete"`
}

type StartInstanceAgentRequest struct {
	InstanceId   string `json:"instanceId"`
	Vid          string `json:"vid"`
	VlanEtiquete string `json:"vlanEtiquete"`
}

type DeleteVmAgentRequest struct {
	VmId           string `json:"vmId"`
	RemoveEtiquete bool   `json:"removeEtiquete"`
	Vid            string `json:"vid"`
}

// Model
type Vm struct {
	ID               string
	Description      *string
	DependsOn        *string
	SubjectId        *string
	VmVlanIdentifier *int
}

type Subject struct {
	SubjectId string
	Vlan      int
}
