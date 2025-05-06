package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"slices"
)

type InstanceService interface {
	CreateInstance(request CreateInstanceFrontendRequest) (CreateInstanceFrontendResponse, error)
	StartInstance(instanceId string) error
	StopInstance(instanceId string) error
	DeleteInstance(instanceId string) error
	GetInstanceStatus() ([]InstanceStatus, error)
	GetInstanceStatusByUserId(userId string) ([]InstanceStatus, error)
	Bases() ([]Base, error)
	DefineTemplate(request DefineTemplateRequest) error
	DeleteTemplate(templateId string, subjectId string) error
}

type InstanceStatus struct {
	InstanceId          string `json:"instanceId"`
	Status              string `json:"status"`
	UserId              string `json:"userId"`
	SubjectId           string `json:"subjectId"`
	TemplateId          string `json:"templateId"`
	CreatedAt           string `json:"createdAt"`
	UserMail            string `json:"userMail"`
	SubjectName         string `json:"subjectName"`
	Template_vcpu_count int    `json:"template_vcpu_count"`
	Template_vram_mb    int    `json:"template_vram_mb"`
	Template_size_mb    int    `json:"template_size_mb"`
}

type Base struct {
	Id   string `json:"base_id"`
	Name string `json:"description"`
}

type InstanceServiceImpl struct {
	db               Database
	vmManagerBaseUrl string
}

func NewInstanceService(db Database, vmManagerBaseUrl string) InstanceService {
	return &InstanceServiceImpl{
		db:               db,
		vmManagerBaseUrl: vmManagerBaseUrl,
	}
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

type DefineTemplateResponse struct {
	TemplateId string `json:"templateId"`
}

type vmManagerStatus struct {
	InstanceId string `json:"instanceId"`
	Status     string `json:"status"`
}

func (s *InstanceServiceImpl) CreateInstance(request CreateInstanceFrontendRequest) (CreateInstanceFrontendResponse, error) {
	templateConfig, err := s.db.GetTemplateConfig(request.TemplateId, request.SubjectId)
	if err != nil {
		return CreateInstanceFrontendResponse{}, fmt.Errorf("error getting template config: %w", err)
	}

	createInstanceRequest := CreateInstanceRequest{
		SourceVmId:    request.TemplateId,
		SizeMB:        templateConfig.SizeMB,
		VcpuCount:     templateConfig.VcpuCount,
		VramMB:        templateConfig.VramMB,
		Username:      request.Username,
		Password:      request.Password,
		PublicSshKeys: request.PublicSshKeys,
	}

	// Convertir la solicitud a JSON
	jsonData, err := json.Marshal(createInstanceRequest)
	if err != nil {
		return CreateInstanceFrontendResponse{}, fmt.Errorf("error marshaling create instance request: %w", err)
	}

	// Hacer la petición al gestor de máquinas
	resp, err := http.Post(
		fmt.Sprintf("%s/instances/create", s.vmManagerBaseUrl),
		"application/json",
		bytes.NewBuffer(jsonData),
	)
	if err != nil {
		return CreateInstanceFrontendResponse{}, fmt.Errorf("error calling VM manager API: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return CreateInstanceFrontendResponse{}, fmt.Errorf("VM manager API returned status code %d", resp.StatusCode)
	}

	// Decodificar la respuesta
	var response CreateInstanceResponse
	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		return CreateInstanceFrontendResponse{}, fmt.Errorf("error decoding response: %w", err)
	}

	err = s.db.CreateInstance(response.InstanceId, request.UserId, request.SubjectId, request.TemplateId)
	if err != nil {
		return CreateInstanceFrontendResponse{}, fmt.Errorf("error creating instance: %w", err)
	}

	return CreateInstanceFrontendResponse{
		InstanceId: response.InstanceId,
	}, nil
}

func (s *InstanceServiceImpl) StartInstance(instanceId string) error {
	resp, err := http.Post(
		fmt.Sprintf("%s/instances/start/%s", s.vmManagerBaseUrl, instanceId),
		"application/json",
		nil,
	)
	if err != nil {
		return fmt.Errorf("error calling VM manager API: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("VM manager API returned status code %d", resp.StatusCode)
	}

	return nil
}

func (s *InstanceServiceImpl) StopInstance(instanceId string) error {
	resp, err := http.Post(
		fmt.Sprintf("%s/instances/stop/%s", s.vmManagerBaseUrl, instanceId),
		"application/json",
		nil,
	)
	if err != nil {
		return fmt.Errorf("error calling VM manager API: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("VM manager API returned status code %d", resp.StatusCode)
	}

	return nil
}

func (s *InstanceServiceImpl) DeleteInstance(instanceId string) error {
	req, err := http.NewRequest(
		http.MethodDelete,
		fmt.Sprintf("%s/instances/delete/%s", s.vmManagerBaseUrl, instanceId),
		nil,
	)
	if err != nil {
		return fmt.Errorf("error calling VM manager API: %w", err)
	}

	client := http.DefaultClient
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("error calling VM manager API: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("VM manager API returned status code %d", resp.StatusCode)
	}

	err = s.db.DeleteInstance(instanceId)
	if err != nil {
		return fmt.Errorf("error deleting instance: %w", err)
	}

	return nil
}

func (s *InstanceServiceImpl) GetInstanceStatus() ([]InstanceStatus, error) {
	resp, err := http.Get(
		fmt.Sprintf("%s/instances/status", s.vmManagerBaseUrl),
	)
	if err != nil {
		return nil, fmt.Errorf("error calling VM manager API: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("VM manager API returned status code %d", resp.StatusCode)
	}

	var vmStatuses []vmManagerStatus
	if err := json.NewDecoder(resp.Body).Decode(&vmStatuses); err != nil {
		return nil, fmt.Errorf("error decoding response: %w", err)
	}

	var enrichedStatuses []InstanceStatus
	for _, vmStatus := range vmStatuses {
		status := InstanceStatus{
			InstanceId: vmStatus.InstanceId,
			Status:     vmStatus.Status,
		}

		// Get additional info from database
		info, err := s.db.GetInstanceInfo(vmStatus.InstanceId)
		if err != nil {
			// If there's an error, set error values for the additional fields
			status.UserId = "error"
			status.SubjectId = "error"
			status.TemplateId = "error"
			status.CreatedAt = "error"
			status.UserMail = "error"
			status.SubjectName = "error"
		} else {
			// If successful, set the values from the database
			status.UserId = info.UserId
			status.SubjectId = info.SubjectId
			status.TemplateId = info.TemplateId
			status.CreatedAt = info.CreatedAt
			status.UserMail = info.UserMail
			status.SubjectName = info.SubjectName
		}

		enrichedStatuses = append(enrichedStatuses, status)
	}

	return enrichedStatuses, nil
}

func (s *InstanceServiceImpl) Bases() ([]Base, error) {
	resp, err := http.Get(
		fmt.Sprintf("%s/bases", s.vmManagerBaseUrl),
	)
	if err != nil {
		return nil, fmt.Errorf("error calling VM manager API: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("VM manager API returned status code %d", resp.StatusCode)
	}

	var bases []Base
	if err := json.NewDecoder(resp.Body).Decode(&bases); err != nil {
		return nil, fmt.Errorf("error decoding response: %w", err)
	}

	return bases, nil
}

func (s *InstanceServiceImpl) DefineTemplate(request DefineTemplateRequest) error {
	jsonData, err := json.Marshal(request)
	if err != nil {
		return fmt.Errorf("error marshaling define template request: %w", err)
	}

	resp, err := http.Post(
		fmt.Sprintf("%s/templates/define", s.vmManagerBaseUrl),
		"application/json",
		bytes.NewBuffer(jsonData),
	)
	if err != nil {
		return fmt.Errorf("error calling VM manager API: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("VM manager API returned status code %d", resp.StatusCode)
	}

	var response DefineTemplateResponse
	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		return fmt.Errorf("error decoding response: %w", err)
	}

	err = s.db.CreateTemplate(response.TemplateId, request.SubjectId, request.SourceInstanceId, request.SizeMB, request.VcpuCount, request.VramMB, request.IsValidated, request.Description)
	if err != nil {
		return fmt.Errorf("error creating template: %w", err)
	}

	return nil
}

func (s *InstanceServiceImpl) DeleteTemplate(templateId string, subjectId string) error {
	resp, err := http.Post(
		fmt.Sprintf("%s/templates/delete/%s", s.vmManagerBaseUrl, templateId),
		"application/json",
		nil,
	)
	if err != nil {
		return fmt.Errorf("error calling VM manager API: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("VM manager API returned status code %d", resp.StatusCode)
	}

	err = s.db.DeleteTemplate(templateId, subjectId)
	if err != nil {
		return fmt.Errorf("error deleting template: %w", err)
	}

	return nil
}

func (s *InstanceServiceImpl) GetInstanceStatusByUserId(userId string) ([]InstanceStatus, error) {
	resp, err := http.Get(
		fmt.Sprintf("%s/instances/status", s.vmManagerBaseUrl),
	)
	if err != nil {
		return nil, fmt.Errorf("error calling VM manager API: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("VM manager API returned status code %d", resp.StatusCode)
	}

	var vmStatuses []vmManagerStatus
	if err := json.NewDecoder(resp.Body).Decode(&vmStatuses); err != nil {
		return nil, fmt.Errorf("error decoding response: %w", err)
	}
	var filteredStatuses []vmManagerStatus
	for _, vmStatus := range vmStatuses {
		var instanceIds []string
		instanceIds, err = s.db.GetInstanceIdsByUserId(userId)
		if err != nil {
			return nil, fmt.Errorf("error getting instance ids: %w", err)
		}
		if slices.Contains(instanceIds, vmStatus.InstanceId) {
			filteredStatuses = append(filteredStatuses, vmStatus)
		}
	}
	var enrichedStatuses []InstanceStatus
	for _, vmStatus := range filteredStatuses {
		status := InstanceStatus{
			InstanceId: vmStatus.InstanceId,
			Status:     vmStatus.Status,
		}

		// Get additional info from database
		info, err := s.db.GetInstanceInfo(vmStatus.InstanceId)
		if err != nil {
			// If there's an error, set error values for the additional fields
			status.UserId = "error"
			status.SubjectId = "error"
			status.TemplateId = "error"
			status.CreatedAt = "error"
			status.UserMail = "error"
			status.SubjectName = "error"
		} else {
			// If successful, set the values from the database
			status.UserId = info.UserId
			status.SubjectId = info.SubjectId
			status.TemplateId = info.TemplateId
			status.CreatedAt = info.CreatedAt
			status.UserMail = info.UserMail
			status.SubjectName = info.SubjectName
		}

		enrichedStatuses = append(enrichedStatuses, status)
	}

	return enrichedStatuses, nil
}
