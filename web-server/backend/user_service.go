package main

import "github.com/google/uuid"

type UserService interface {
	CreateUser(request CreateUserRequest) error
	CreateProfessor(request CreateProfessorRequest) error
}

type UsrService struct {
	db Database
}

func NewUserService(db Database) UserService {
	return &UsrService{
		db: db,
	}
}

func (s *UsrService) CreateUser(request CreateUserRequest) error {
	user := request.toUser()
	return s.db.CreateUser(user)
}

func (s *UsrService) CreateProfessor(request CreateProfessorRequest) error {
	user := request.toUser()
	return s.db.CreateUser(user)
}

func (createUsrReq *CreateUserRequest) toUser() User {
	return User{
		ID:       uuid.New(),
		Role:     Student,
		Name:     createUsrReq.Name,
		Mail:     createUsrReq.Mail,
		Password: createUsrReq.Password,
	}
}

func (createProfReq *CreateProfessorRequest) toUser() User {
	return User{
		ID:   uuid.New(),
		Role: Professor,
		Name: createProfReq.Name,
		Mail: createProfReq.Mail,
		// TODO: Generate random password
		Password: "randomPassword",
	}
}

func (subject Subject) toSubjectResponse() SubjectResponse {
	return SubjectResponse{
		ID:            subject.ID,
		Name:          subject.Name,
		Code:          subject.Code,
		ProfessorMail: subject.ProfessorMail,
	}
}
