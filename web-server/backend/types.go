package main

type User struct {
	ID       int
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

type UserResponse struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
	Role string `json:"role"`
	Mail string `json:"mail"`
}

type CreateUserRequest struct {
	Name     string `json:"name"`
	Mail     string `json:"mail"`
	Password string `json:"password"`
}
