package main

import (
	"net/http"

	"github.com/google/uuid"
)

type UserService interface {
	CreateUser(request CreateUserRequest) error
	CreateProfessor(request CreateProfessorRequest) error
	ListAllUsersBySubjectId(subjectId string) ([]UserResponse, error)
	ValidateUser(request ValidateUserRequest) (ValidateUserResponse, error)
	GetUser(userId string) (UserResponse, error)
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

func (s *UsrService) ListAllUsersBySubjectId(subjectId string) ([]UserResponse, error) {
	users, err := s.db.ListAllUsersBySubjectId(subjectId)
	if err != nil {
		return nil, err
	}

	var usersResponse []UserResponse
	for _, user := range users {
		usersResponse = append(usersResponse, user.toUserResponse())
	}

	return usersResponse, nil
}

func (s *UsrService) ValidateUser(request ValidateUserRequest) (ValidateUserResponse, error) {
	user, err := s.db.ValidateUser(request.Mail, request.Password)
	if err != nil {
		return ValidateUserResponse{}, NewHttpError(http.StatusBadRequest, err)
	}

	return user.toValidateUserResponse(), nil
}

func (s *UsrService) GetUser(userId string) (UserResponse, error) {
	user, err := s.db.GetUser(userId)
	if err != nil {
		return UserResponse{}, NewHttpError(http.StatusBadRequest, err)
	}

	return user.toUserResponse(), nil
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

func (user User) toUserResponse() UserResponse {
	return UserResponse{
		ID:   user.ID,
		Name: user.Name,
		Role: string(user.Role),
		Mail: user.Mail,
	}
}

func (user User) toValidateUserResponse() ValidateUserResponse {
	return ValidateUserResponse{
		ID: user.ID,
	}
}
