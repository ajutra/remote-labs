package main

import (
	"fmt"
	"net/http"

	"github.com/google/uuid"
	"golang.org/x/exp/rand"
)

type UserService interface {
	CreateUser(request CreateUserRequest) error
	CreateUnverifiedUser(request CreateUserRequest, verificationToken uuid.UUID) error
	CreateProfessor(request CreateProfessorRequest) (User, string, error)
	ListAllUsersBySubjectId(subjectId string) ([]UserResponse, error)
	ValidateUser(request ValidateUserRequest) (ValidateUserResponse, error)
	GetUser(userId string) (UserResponse, error)
	DeleteUser(userId string) error
	VerifyUser(token string) error
	UpdateVerificationToken(email string, token uuid.UUID) error
	UpdateUser(request UpdateUserRequest) error
}

type UserServiceImpl struct {
	db Database
}

func NewUserService(db Database) UserService {
	return &UserServiceImpl{
		db: db,
	}
}

func (s *UserServiceImpl) CreateUser(request CreateUserRequest) error {
	user := request.toUser()
	return s.db.CreateUser(user)
}

func (s *UserServiceImpl) CreateUnverifiedUser(request CreateUserRequest, verificationToken uuid.UUID) error {
	hashedPassword, _ := HashPassword(request.Password)
	user := request.toUser()
	user.Password = hashedPassword
	return s.db.CreateUnverifiedUser(user, verificationToken)
}

func (s *UserServiceImpl) CreateProfessor(request CreateProfessorRequest) (User, string, error) {
	user, plainPassword := request.toUser()
	err := s.db.CreateUser(user)
	if err != nil {
		return User{}, "", err
	}
	return user, plainPassword, nil
}

func (s *UserServiceImpl) ListAllUsersBySubjectId(subjectId string) ([]UserResponse, error) {
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

func (s *UserServiceImpl) ValidateUser(request ValidateUserRequest) (ValidateUserResponse, error) {

	user, err := s.db.ValidateUser(request.Mail, request.Password)
	if err != nil {
		return ValidateUserResponse{}, NewHttpError(http.StatusBadRequest, err)
	}

	return user.toValidateUserResponse(), nil
}

func (s *UserServiceImpl) GetUser(userId string) (UserResponse, error) {
	user, err := s.db.GetUser(userId)
	if err != nil {
		return UserResponse{}, NewHttpError(http.StatusBadRequest, err)
	}

	return user.toUserResponse(), nil
}

func (s *UserServiceImpl) DeleteUser(userId string) error {
	// Check if user exists
	if err := s.db.UserExistsById(userId); err != nil {
		return err
	}

	// Check if user is enrolled in any subject
	// An error means the user is not enrolled in any subject
	if _, err := s.db.ListAllSubjectsByUserId(userId); err != nil {
		return s.db.DeleteUser(userId)
	}

	return NewHttpError(http.StatusBadRequest, fmt.Errorf("user is enrolled in subjects"))
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

func (createProfReq *CreateProfessorRequest) toUser() (User, string) {
	// Generar una contraseña aleatoria de 10 caracteres
	const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
	password := make([]byte, 10)
	for i := range password {
		password[i] = charset[rand.Intn(len(charset))]
	}

	plainPassword := string(password)

	// Imprimir la contraseña en texto plano para desarrollo
	fmt.Printf("Contraseña generada para el profesor %s: %s\n",
		createProfReq.Name, plainPassword)

	// Crear hash de la contraseña
	hashedPassword, _ := HashPassword(plainPassword)

	user := User{
		ID:       uuid.New(),
		Role:     Professor,
		Name:     createProfReq.Name,
		Mail:     createProfReq.Mail,
		Password: hashedPassword,
	}

	return user, plainPassword
}

func (user User) toUserResponse() UserResponse {
	return UserResponse{
		ID:            user.ID.String(),
		Name:          user.Name,
		Role:          string(user.Role),
		Mail:          user.Mail,
		PublicSshKeys: user.PublicSshKeys,
	}
}

func (user User) toValidateUserResponse() ValidateUserResponse {
	return ValidateUserResponse{
		ID: user.ID,
	}
}

func (s *UserServiceImpl) VerifyUser(token string) error {
	return s.db.VerifyUser(token)
}

func (s *UserServiceImpl) UpdateVerificationToken(email string, token uuid.UUID) error {
	return s.db.UpdateVerificationToken(email, token)
}

func (s *UserServiceImpl) UpdateUser(request UpdateUserRequest) error {

	if request.Password != "" {
		hashedPassword, _ := HashPassword(request.Password)
		request.Password = hashedPassword
	}

	return s.db.UpdateUser(request.UserId, request.Password, request.PublicSshKeys)
}
