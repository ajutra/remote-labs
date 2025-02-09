package main

var users []User = GenerateDummyUsers()

func GenerateDummyUsers() []User {
	return []User{
		{
			ID:       1,
			Role:     Admin,
			Name:     "Alice",
			Mail:     "alice@mail.com",
			Password: "password",
		},
		{
			ID:       2,
			Role:     Student,
			Name:     "Bob",
			Mail:     "bob@mail.com",
			Password: "password",
		},
	}
}

func GetAllUsers() []UserResponse {
	var userResponses []UserResponse
	for _, user := range users {
		userResponses = append(userResponses, UserResponse{
			ID:   user.ID,
			Name: user.Name,
			Role: string(user.Role),
			Mail: user.Mail,
		})
	}
	return userResponses
}
