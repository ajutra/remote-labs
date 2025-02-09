package main

import "github.com/google/uuid"

var users []User = GenerateDummyUsers()

func GenerateDummyUsers() []User {
	return []User{
		{
			ID:       uuid.New(),
			Role:     Admin,
			Name:     "Alice",
			Mail:     "alice@mail.com",
			Password: "password",
		},
		{
			ID:       uuid.New(),
			Role:     Student,
			Name:     "Bob",
			Mail:     "bob@mail.com",
			Password: "password",
		},
	}
}

func GetAllUsers() ([]UserResponse, error) {
	var userResponses []UserResponse

	for _, user := range users {
		userResponses = append(userResponses, UserResponse{
			ID:   user.ID,
			Name: user.Name,
			Role: string(user.Role),
			Mail: user.Mail,
		})
	}

	return userResponses, nil
}

func CreateUser(request CreateUserRequest) error {
	users = append(users, User{
		ID:       uuid.New(),
		Role:     Student,
		Name:     request.Name,
		Mail:     request.Mail,
		Password: request.Password,
	})

	return nil
}
