package main

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(".backend.env"); err != nil {
		log.Fatal("Error loading .env file: " + err.Error())
	}

	database, err := NewDatabase()
	if err != nil {
		log.Fatal(err)
	}
	defer database.Close()

	vmManager := NewVmManager()

	service, err := NewService(vmManager, database)
	if err != nil {
		log.Fatal(err)
	}

	server := NewApiServer(os.Getenv("API_URL"), service)
	server.Run()
}
