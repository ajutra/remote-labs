package main

import "github.com/google/uuid"

type UserService interface {
	CreateUser(request CreateUserRequest) error
	CreateProfessor(request CreateProfessorRequest) error
}

type Service struct {
	db Database
}

func NewUserService(db Database) UserService {
	return &Service{
		db: db,
	}
}

func (s *Service) CreateUser(request CreateUserRequest) error {
	user := request.toUser()
	return s.db.CreateUser(user)
}

func (s *Service) CreateProfessor(request CreateProfessorRequest) error {
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
