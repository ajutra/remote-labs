package main

import "github.com/google/uuid"

type UserService interface {
	CreateUser(request CreateUserRequest) error
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

func (createUsrReq *CreateUserRequest) toUser() User {
	return User{
		ID:       uuid.New(),
		Role:     Student,
		Name:     createUsrReq.Name,
		Mail:     createUsrReq.Mail,
		Password: createUsrReq.Password,
	}
}
