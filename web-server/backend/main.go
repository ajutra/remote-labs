package main

import (
	"log"

	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(".backend.env"); err != nil {
		log.Fatal("Error loading .env file")
	}

	db, err := NewDatabase()
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	userService := NewUserService(db)
	subjectService := NewSubjectService(db)
	emailService := NewEmailService()

	server := NewApiServer(":8080", userService, subjectService, emailService)
	server.Run()
}
