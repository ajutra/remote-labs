package main

import "github.com/google/uuid"

type User struct {
	ID       uuid.UUID
	Role     Role
	Name     string
	Mail     string
	Password string
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
	ID   uuid.UUID `json:"id"`
	Name string    `json:"name"`
	Role string    `json:"role"`
	Mail string    `json:"mail"`
}

type CreateUserRequest struct {
	Name     string `json:"name"`
	Mail     string `json:"mail"`
	Password string `json:"password"`
}

type CreateProfessorRequest struct {
	Name string `json:"name"`
	Mail string `json:"mail"`
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

func (subject Subject) toSubjectResponse() SubjectResponse {
	return SubjectResponse{
		ID:            subject.ID,
		Name:          subject.Name,
		Code:          subject.Code,
		ProfessorMail: subject.ProfessorMail,
	}
}
