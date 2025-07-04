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

type StartInstanceRequest struct {
	InstanceId   string `json:"instanceId"`
	Vid          string `json:"vid"`
	VlanEtiquete string `json:"vlanEtiquete"`
}

type DeleteVmRequest struct {
	VmId           string `json:"vmId"`
	RemoveEtiquete bool   `json:"removeEtiquete"`
	Vid            string `json:"vid"`
}

type ListInstancesStatusResponse struct {
	InstanceId string `json:"instanceId"`
	Status     string `json:"status"`
}

type GetResourceStatusResponse struct {
	CpuLoad       float64 `json:"cpuLoad"`
	TotalMemoryMB int     `json:"totalMemoryMB"`
	FreeMemoryMB  int     `json:"freeMemoryMB"`
	TotalDiskMB   int     `json:"totalDiskMB"`
	FreeDiskMB    int     `json:"freeDiskMB"`
}
