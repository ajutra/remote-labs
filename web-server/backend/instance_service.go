package main

import (
	"bytes"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"slices"
	"strings"
	"time"

	"golang.org/x/crypto/curve25519"
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
	GetTemplatesBySubjectId(subjectId string) ([]Template, error)
	GetWireguardConfig(instanceId string) (string, error)
	GetServerStatus() ([]ServerStatus, error)
}

type InstanceStatus struct {
	InstanceId           string `json:"instanceId"`
	Status               string `json:"status"`
	UserId               string `json:"userId"`
	SubjectId            string `json:"subjectId"`
	TemplateId           string `json:"templateId"`
	CreatedAt            string `json:"createdAt"`
	UserMail             string `json:"userMail"`
	SubjectName          string `json:"subjectName"`
	Template_vcpu_count  int    `json:"template_vcpu_count"`
	Template_vram_mb     int    `json:"template_vram_mb"`
	Template_size_mb     int    `json:"template_size_mb"`
	Template_Description string `json:"template_description"`
}

type Base struct {
	Id   string `json:"baseId"`
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
	BaseId        string   `json:"baseId,omitempty"`
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

type DefineTemplateResponse struct {
	TemplateId string `json:"templateId"`
}

type vmManagerStatus struct {
	InstanceId string `json:"instanceId"`
	Status     string `json:"status"`
}

type Template struct {
	Id          string `json:"id"`
	Description string `json:"description"`
	VcpuCount   int    `json:"vcpuCount"`
	VramMB      int    `json:"vramMB"`
	SizeMB      int    `json:"sizeMB"`
}



func (s *InstanceServiceImpl) CreateInstance(request CreateInstanceFrontendRequest) (CreateInstanceFrontendResponse, error) {
	log.Printf("Starting instance creation process for user %s and subject %s", request.UserId, request.SubjectId)
	log.Printf("Received request: %+v", request)

	// Check if the sourceVmId is a base
	isBase := false
	bases, err := s.Bases()
	if err != nil {
		log.Printf("Error checking bases: %v", err)
		return CreateInstanceFrontendResponse{}, fmt.Errorf("error checking if source is a base: %w", err)
	}

	for _, base := range bases {
		if base.Id == request.SourceVmId {
			isBase = true
			break
		}
	}

	// Check if the sourceVmId exists asa template for the subject
	isTemplate, err := s.db.GetTemplatesBySubjectId(request.SubjectId)
	if err != nil {
		log.Printf("Error checking templates: %v", err)
		return CreateInstanceFrontendResponse{}, fmt.Errorf("error checking templates: %w", err)
	}
	if isTemplate != nil {
		for _, template := range isTemplate {
			if template.ID == request.SourceVmId {
				isBase = false
				break
			}
		}
	}

	log.Printf("Source VM is base: %v", isBase)

	var templateConfig TemplateConfig
	if isBase {
		// If it's a base, use the config from the request
		templateConfig = TemplateConfig{
			SizeMB:    request.SizeMB,
			VcpuCount: request.VcpuCount,
			VramMB:    request.VramMB,
		}
	} else {
		// If it's not a base, get the template config from the database
		templateConfig, err = s.db.GetTemplateConfig(request.SourceVmId, request.SubjectId)
		if err != nil {
			log.Printf("Error fetching template config: %v", err)
			return CreateInstanceFrontendResponse{}, fmt.Errorf("error fetching template config: %w", err)
		}
	}

	log.Printf("Template configuration: %+v", templateConfig)

	// Generate a new WireGuard key pair
	wgPrivateKey, wgPublicKey, err := GenerateKeyPair()
	if err != nil {
		log.Printf("Error generating WireGuard key pair: %v", err)
		return CreateInstanceFrontendResponse{}, fmt.Errorf("error generating WireGuard key pair: %w", err)
	}
	log.Printf("Generated WireGuard key pair: PrivateKey: %s, PublicKey: %s", wgPrivateKey, wgPublicKey)

	// Hash password
	hashedPassword, err := HashPassword(request.Password)
	if err != nil {
		log.Printf("Error hashing password: %v", err)
		return CreateInstanceFrontendResponse{}, fmt.Errorf("error hashing password: %w", err)
	}

	createInstanceRequest := CreateInstanceRequest{
		SourceVmId:    request.SourceVmId,
		SizeMB:        templateConfig.SizeMB,
		VcpuCount:     templateConfig.VcpuCount,
		VramMB:        templateConfig.VramMB,
		Username:      request.Username,
		Password:      hashedPassword,
		PublicSshKeys: request.PublicSshKeys,
		SubjectId:     request.SubjectId,
		UserWgPubKey:  wgPublicKey,
	}

	jsonData, err := json.Marshal(createInstanceRequest)
	if err != nil {
		log.Printf("Error marshaling request: %v", err)
		return CreateInstanceFrontendResponse{}, fmt.Errorf("error marshaling request: %w", err)
	}

	log.Printf("Sending request to VM manager at %s/instances/create", s.vmManagerBaseUrl)
	resp, err := http.Post(
		fmt.Sprintf("%s/instances/create", s.vmManagerBaseUrl),
		"application/json",
		bytes.NewBuffer(jsonData),
	)
	if err != nil {
		log.Printf("Error calling VM manager: %v", err)
		return CreateInstanceFrontendResponse{}, fmt.Errorf("error calling VM manager: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		log.Printf("VM manager returned error status %d: %s", resp.StatusCode, string(body))
		return CreateInstanceFrontendResponse{}, fmt.Errorf("VM manager returned error status %d: %s", resp.StatusCode, string(body))
	}

	var response CreateInstanceResponse
	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		log.Printf("Error decoding VM manager response: %v", err)
		return CreateInstanceFrontendResponse{}, fmt.Errorf("error decoding VM manager response: %w", err)
	}

	log.Printf("VM manager response: %+v", response)

	// Create the instance record in the database
	var templateId *string
	if !isBase {
		templateId = &request.SourceVmId
	}

	err = s.db.CreateInstance(response.InstanceId, request.UserId, request.SubjectId, templateId, wgPrivateKey, wgPublicKey, response.InterfaceAddress, response.PeerPublicKey, response.PeerAllowedIps, response.PeerEndpointPort)
	if err != nil {
		log.Printf("Error creating instance record in database: %v", err)
		return CreateInstanceFrontendResponse{}, fmt.Errorf("error creating instance record: %w", err)
	}

	log.Printf("Instance record created successfully in database")

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
	log.Println("Calling VM manager API for instance statuses")
	resp, err := http.Get(
		fmt.Sprintf("%s/instances/status", s.vmManagerBaseUrl),
	)
	if err != nil {
		log.Printf("Error connecting to VM manager API: %v", err)
		return nil, fmt.Errorf("error calling VM manager API: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		log.Printf("VM manager API returned status code %d", resp.StatusCode)
		return nil, fmt.Errorf("VM manager API returned status code %d", resp.StatusCode)
	}

	var vmStatuses []vmManagerStatus
	if err := json.NewDecoder(resp.Body).Decode(&vmStatuses); err != nil {
		log.Printf("Error decoding VM manager response: %v", err)
		return nil, fmt.Errorf("error decoding response: %w", err)
	}

	log.Printf("Successfully retrieved VM statuses: %+v", vmStatuses)

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
			status.Template_Description = "error"
			status.Template_vcpu_count = 0
			status.Template_vram_mb = 0
			status.Template_size_mb = 0
		} else {
			// If successful, set the values from the database
			status.UserId = info.UserId
			status.SubjectId = info.SubjectId
			if info.TemplateId != nil {
				status.TemplateId = *info.TemplateId
				status.Template_Description = *info.TemplateDescription
				status.Template_vcpu_count = *info.Template_vcpu_count
				status.Template_vram_mb = *info.Template_vram_mb
				status.Template_size_mb = *info.Template_size_mb
			} else {
				status.TemplateId = ""
				status.Template_Description = ""
				status.Template_vcpu_count = 0
				status.Template_vram_mb = 0
				status.Template_size_mb = 0
			}
			status.CreatedAt = info.CreatedAt.Format(time.RFC3339)
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
	log.Printf("DefineTemplate called with request: %+v", request)

	// Check if the sourceInstanceId is a base
	isBase := false
	bases, err := s.Bases()
	if err != nil {
		log.Printf("Error getting bases: %v", err)
		return fmt.Errorf("error checking if source is a base: %w", err)
	}
	log.Printf("Available bases: %+v", bases)

	for _, base := range bases {
		if base.Id == request.SourceInstanceId {
			isBase = true
			log.Printf("Found matching base: %+v", base)
			break
		}
	}

	if isBase {
		log.Printf("Creating template from base %s", request.SourceInstanceId)
		// If it's a base, just create the template record in the database
		// Use the base ID as the template ID
		err = s.db.CreateTemplate(
			request.SourceInstanceId,
			request.SubjectId,
			request.SizeMB,
			request.VcpuCount,
			request.VramMB,
			request.IsValidated,
			request.Description,
		)
		if err != nil {
			log.Printf("Error creating template from base: %v", err)
			return fmt.Errorf("error creating template from base: %w", err)
		}
		log.Printf("Successfully created template from base")
		return nil
	}

	log.Printf("Creating template from instance %s", request.SourceInstanceId)
	// If it's not a base, proceed with the normal template definition process
	jsonData, err := json.Marshal(request)
	if err != nil {
		log.Printf("Error marshaling request: %v", err)
		return fmt.Errorf("error marshaling define template request: %w", err)
	}

	resp, err := http.Post(
		fmt.Sprintf("%s/templates/define", s.vmManagerBaseUrl),
		"application/json",
		bytes.NewBuffer(jsonData),
	)
	if err != nil {
		log.Printf("Error calling VM manager API: %v", err)
		return fmt.Errorf("error calling VM manager API: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		log.Printf("VM manager API returned status code %d with body: %s", resp.StatusCode, string(body))
		return fmt.Errorf("VM manager API returned status code %d", resp.StatusCode)
	}

	var response DefineTemplateResponse
	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		log.Printf("Error decoding response: %v", err)
		return fmt.Errorf("error decoding response: %w", err)
	}

	log.Printf("Creating template in database with ID %s", response.TemplateId)
	err = s.db.CreateTemplate(
		response.TemplateId,
		request.SubjectId,
		request.SizeMB,
		request.VcpuCount,
		request.VramMB,
		request.IsValidated,
		request.Description,
	)
	if err != nil {
		log.Printf("Error creating template in database: %v", err)
		return fmt.Errorf("error creating template: %w", err)
	}

	log.Printf("Successfully created template")
	return nil
}

func (s *InstanceServiceImpl) DeleteTemplate(templateId string, subjectId string) error {
	log.Printf("[DeleteTemplate] Called with templateId=%s, subjectId=%s", templateId, subjectId)

	// Comprobar si templateId es una base
	bases, err := s.Bases()
	if err != nil {
		log.Printf("[DeleteTemplate] Error getting bases: %v", err)
		return fmt.Errorf("error getting bases: %w", err)
	}
	for _, base := range bases {
		if base.Id == templateId {
			// Es una base, solo eliminar de la base de datos
			err = s.db.DeleteTemplate(templateId, subjectId)
			if err != nil {
				log.Printf("[DeleteTemplate] Error deleting base template in DB: %v", err)
				return fmt.Errorf("error deleting base template: %w", err)
			}
			log.Printf("[DeleteTemplate] Successfully deleted base template %s from subject %s", templateId, subjectId)
			return nil
		}
	}

	// Si no es base, eliminar también en el VM manager
	req, err := http.NewRequest(
		http.MethodDelete,
		fmt.Sprintf("%s/templates/delete/%s", s.vmManagerBaseUrl, templateId),
		nil,
	)
	if err != nil {
		log.Printf("[DeleteTemplate] Error creating DELETE request: %v", err)
		return fmt.Errorf("error creating DELETE request: %w", err)
	}

	client := http.DefaultClient
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("[DeleteTemplate] Error calling VM manager API: %v", err)
		return fmt.Errorf("error calling VM manager API: %w", err)
	}
	defer resp.Body.Close()

	log.Printf("[DeleteTemplate] VM manager response status: %d", resp.StatusCode)
	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		log.Printf("[DeleteTemplate] VM manager API returned status code %d with body: %s", resp.StatusCode, string(body))
		return fmt.Errorf("VM manager API returned status code %d", resp.StatusCode)
	}

	err = s.db.DeleteTemplate(templateId, subjectId)
	if err != nil {
		log.Printf("[DeleteTemplate] Error deleting template in DB: %v", err)
		return fmt.Errorf("error deleting template: %w", err)
	}
	log.Printf("[DeleteTemplate] Successfully deleted template %s from subject %s", templateId, subjectId)
	return nil
}

func (s *InstanceServiceImpl) GetTemplatesBySubjectId(subjectId string) ([]Template, error) {
	templates, err := s.db.GetTemplatesBySubjectId(subjectId)
	if err != nil {
		return nil, fmt.Errorf("error getting templates by subject ID: %w", err)
	}
	log.Printf("Retrieved templates for subject ID %s: %+v", subjectId, templates)
	//convert form templatedb to template struct
	var result []Template
	for _, template := range templates {
		result = append(result, Template{
			Id:          template.ID,
			Description: template.Description,
			VcpuCount:   template.VcpuCount,
			VramMB:      template.VramMB,
			SizeMB:      template.SizeMB,
		})
	}
	log.Printf("Converted templates: %+v", result)
	return result, nil
}

func (s *InstanceServiceImpl) GetInstanceStatusByUserId(userId string) ([]InstanceStatus, error) {
	log.Printf("Fetching instance statuses for user ID: %s", userId)
	resp, err := http.Get(
		fmt.Sprintf("%s/instances/status", s.vmManagerBaseUrl),
	)
	if err != nil {
		log.Printf("Error calling VM manager API: %v", err)
		return nil, fmt.Errorf("error calling VM manager API: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		log.Printf("VM manager API returned status code %d", resp.StatusCode)
		return nil, fmt.Errorf("VM manager API returned status code %d", resp.StatusCode)
	}

	var vmStatuses []vmManagerStatus
	if err := json.NewDecoder(resp.Body).Decode(&vmStatuses); err != nil {
		log.Printf("Error decoding VM manager response: %v", err)
		return nil, fmt.Errorf("error decoding response: %w", err)
	}
	log.Printf("Successfully retrieved VM statuses: %+v", vmStatuses)

	var filteredStatuses []vmManagerStatus
	for _, vmStatus := range vmStatuses {
		log.Printf("Processing VM status: %+v", vmStatus)
		var instanceIds []string
		instanceIds, err = s.db.GetInstanceIdsByUserId(userId)
		if err != nil {
			log.Printf("Error getting instance IDs for user ID %s: %v", userId, err)
			return nil, fmt.Errorf("error getting instance ids: %w", err)
		}
		if slices.Contains(instanceIds, vmStatus.InstanceId) {
			filteredStatuses = append(filteredStatuses, vmStatus)
		}
	}
	log.Printf("Filtered VM statuses: %+v", filteredStatuses)

	var enrichedStatuses []InstanceStatus
	for _, vmStatus := range filteredStatuses {
		status := InstanceStatus{
			InstanceId: vmStatus.InstanceId,
			Status:     vmStatus.Status,
		}

		info, err := s.db.GetInstanceInfo(vmStatus.InstanceId)
		if err != nil {
			log.Printf("Error getting instance info for instance ID %s: %v", vmStatus.InstanceId, err)
			status.UserId = "error"
			status.SubjectId = "error"
			status.TemplateId = "error"
			status.CreatedAt = "error"
			status.UserMail = "error"
			status.SubjectName = "error"
			status.Template_Description = "error"
			status.Template_vcpu_count = 0
			status.Template_vram_mb = 0
			status.Template_size_mb = 0

		} else {
			status.UserId = info.UserId
			status.SubjectId = info.SubjectId
			if info.TemplateId != nil {
				status.TemplateId = *info.TemplateId
				status.Template_Description = *info.TemplateDescription
				status.Template_vcpu_count = *info.Template_vcpu_count
				status.Template_vram_mb = *info.Template_vram_mb
				status.Template_size_mb = *info.Template_size_mb
			} else {
				status.TemplateId = ""
				status.Template_Description = ""
				status.Template_vcpu_count = 0
				status.Template_vram_mb = 0
				status.Template_size_mb = 0
			}
			status.CreatedAt = info.CreatedAt.Format(time.RFC3339)
			status.UserMail = info.UserMail
			status.SubjectName = info.SubjectName
		}

		enrichedStatuses = append(enrichedStatuses, status)
	}
	log.Printf("Enriched VM statuses: %+v", enrichedStatuses)

	return enrichedStatuses, nil
}

func (s *InstanceServiceImpl) GetWireguardConfig(instanceId string) (string, error) {
	conf, err := s.db.GetWireguardConfig(instanceId)
	if err != nil {
		return "", fmt.Errorf("error getting WireGuard config: %w", err)
	}
	var endpoint = "vpn.nethermir.cloud"
	// Join the AllowedIPs with commas and spaces
	allowedIPs := strings.Join(conf.PeerAllowedIps, ", ")
	wgConfig := fmt.Sprintf("[Interface]\nPrivateKey = %s\nAddress = %s\n\n[Peer]\nPublicKey = %s\nAllowedIPs = %s\nEndpoint = %s:%d",
		conf.PrivateKey, conf.InterfaceIp, conf.PublicKey, allowedIPs, endpoint, conf.PeerPort)
	return wgConfig, nil
}

func GenerateKeyPair() (string, string, error) {
	privateKey := make([]byte, 32)
	_, err := rand.Read(privateKey)
	if err != nil {
		return "", "", fmt.Errorf("failed to generate private key: %w", err)
	}

	// Optional: clamp manually
	privateKey[0] &= 248
	privateKey[31] &= 127
	privateKey[31] |= 64

	publicKey, err := curve25519.X25519(privateKey, curve25519.Basepoint)
	if err != nil {
		return "", "", fmt.Errorf("failed to generate public key: %w", err)
	}

	privB64 := base64.StdEncoding.EncodeToString(privateKey)
	pubB64 := base64.StdEncoding.EncodeToString(publicKey)

	return privB64, pubB64, nil
}

func (s *InstanceServiceImpl) GetServerStatus() ([]ServerStatus, error) {
	
	log.Printf("Fetching server status from VM manager at %s/servers/status", s.vmManagerBaseUrl)
	
	resp, err := http.Get(fmt.Sprintf("%s/servers/status", s.vmManagerBaseUrl))
	if err != nil {
		log.Printf("Error calling VM manager for server status: %v", err)
		return nil, fmt.Errorf("error calling VM manager: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		log.Printf("VM manager returned error status %d: %s", resp.StatusCode, string(body))
		return nil, fmt.Errorf("VM manager returned error status %d: %s", resp.StatusCode, string(body))
	}

	// Read the raw response body for debugging
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Printf("Error reading response body: %v", err)
		return nil, fmt.Errorf("error reading response body: %w", err)
	}
	log.Printf("Raw response from VM manager: %s", string(body))
	log.Printf("Response content type: %s", resp.Header.Get("Content-Type"))

	// Create a new reader with the body for JSON decoding
	var status []ServerStatus
	if err := json.NewDecoder(bytes.NewReader(body)).Decode(&status); err != nil {
		log.Printf("Error decoding server status response: %v", err)
		log.Printf("Response content type: %s", resp.Header.Get("Content-Type"))
		return nil, fmt.Errorf("error decoding response: %w", err)
	}

	log.Printf("Successfully retrieved status for %d servers", len(status))
	for _, server := range status {
		log.Printf("Server %s has %d running instances", server.ServerIP, len(server.RunningInstances))
	}
	/*
	ip := "172.16.200.13:8081"

	var status []ServerStatus
	status = append(status, ServerStatus{
		ServerIP:        strings.Split(ip, ":")[0],
		CpuLoad:          0.2025,
		TotalMemoryMB:    3914,
		FreeMemoryMB:     197,
		TotalDiskMB:      32046,
		FreeDiskMB:       21295,
		RunningInstances: []string{"instance1", "instance2"},
	}) */
	return status, nil
}
