package main

import "github.com/google/uuid"

type User struct {
	ID            uuid.UUID
	Role          Role
	Name          string
	Mail          string
	Password      string
	PublicSshKeys []string
}

type Role string

const (
	Admin     Role = "admin"
	Professor Role = "professor"
	Student   Role = "student"
)

type Subject struct {
	ID            uuid.UUID
	Name          string
	Code          string
	ProfessorMail string
}

type UserResponse struct {
	ID            string   `json:"id"`
	Name          string   `json:"name"`
	Role          string   `json:"role"`
	Mail          string   `json:"mail"`
	PublicSshKeys []string `json:"publicSshKeys"`
}

type CreateUserRequest struct {
	Name     string `json:"name"`
	Mail     string `json:"mail"`
	Password string `json:"password"`
}

type CreateProfessorRequest struct {
	Name     string `json:"name"`
	Mail     string `json:"mail"`
	Password string `json:"password"`
}

type CreateSubjectRequest struct {
	Name          string `json:"name"`
	Code          string `json:"code"`
	MainProfessor string `json:"professorMail"`
}

type SubjectResponse struct {
	ID            uuid.UUID `json:"id"`
	Name          string    `json:"name"`
	Code          string    `json:"code"`
	ProfessorMail string    `json:"professorMail"`
}

type ValidateUserRequest struct {
	Mail     string `json:"mail"`
	Password string `json:"password"`
}

type ValidateUserResponse struct {
	ID uuid.UUID `json:"id"`
}

type CreateInstanceFrontendRequest struct {
	UserId        string   `json:"user_id"`
	SubjectId     string   `json:"subject_id"`
	SourceVmId    string   `json:"sourceVmId"`
	Username      string   `json:"username"`
	Password      string   `json:"password"`
	PublicSshKeys []string `json:"publicSshKeys"`
	SizeMB        int      `json:"sizeMB"`
	VcpuCount     int      `json:"vcpuCount"`
	VramMB        int      `json:"vramMB"`
}

type CreateInstanceFrontendResponse struct {
	InstanceId string `json:"instanceId"`
}

type TemplateConfig struct {
	SizeMB    int `json:"sizeMB"`
	VcpuCount int `json:"vcpuCount"`
	VramMB    int `json:"vramMB"`
}

type DefineTemplateRequest struct {
	SourceInstanceId string `json:"sourceInstanceId"`
	SizeMB           int    `json:"sizeMB"`
	VcpuCount        int    `json:"vcpuCount"`
	VramMB           int    `json:"vramMB"`
	SubjectId        string `json:"subjectId"`
	Description      string `json:"description"`
	IsValidated      bool   `json:"isValidated"`
}

type UpdateUserRequest struct {
	UserId        string   `json:"userId"`
	Password      string   `json:"password"`
	PublicSshKeys []string `json:"publicSshKeys"`
}
