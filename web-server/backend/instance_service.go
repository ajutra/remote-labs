package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

type InstanceService interface {
	CreateInstance(request CreateInstanceFrontendRequest) (CreateInstanceFrontendResponse, error)
	StartInstance(instanceId string) error
	StopInstance(instanceId string) error
	DeleteInstance(instanceId string) error
	GetInstanceStatus() ([]InstanceStatus, error)
	Bases() ([]Base, error)
}

type InstanceStatus struct {
	InstanceId string `json:"instanceId"`
	Status     string `json:"status"`
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

	s.db.DeleteInstance(instanceId)
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

	var statuses []InstanceStatus
	if err := json.NewDecoder(resp.Body).Decode(&statuses); err != nil {
		return nil, fmt.Errorf("error decoding response: %w", err)
	}

	return statuses, nil
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

	var bases []ListBasesResponse
	if err := json.NewDecoder(resp.Body).Decode(&bases); err != nil {
		return nil, fmt.Errorf("error decoding response: %w", err)
	}

	return bases, nil
}
