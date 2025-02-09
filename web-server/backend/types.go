package main

import "net/mail"

type UserResponse struct {
	ID   int          `json:"id"`
	Name string       `json:"name"`
	Role string       `json:"role"`
	Mail mail.Address `json:"mail"`
}

func GenerateDummyUsers() []UserResponse {
	return []UserResponse{
		{
			ID:   1,
			Name: "Alice",
			Role: "admin",
			Mail: mail.Address{
				Name:    "Alice",
				Address: "alice@mail.com",
			},
		},
		{
			ID:   2,
			Name: "Bob",
			Role: "student",
			Mail: mail.Address{
				Name:    "Bob",
				Address: "bob@mail.com",
			},
		},
	}
}
