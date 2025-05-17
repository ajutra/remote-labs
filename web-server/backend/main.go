package main

import (
	"log"
	"os"
	"strings"

	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(".backend.env"); err != nil {
		log.Fatal("Error loading .backend.env file")
	}

	db, err := NewDatabase()
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()
	vmManagerBaseUrl := os.Getenv("VM_MANAGER_BASE_URL")
	frontendUrl := os.Getenv("FRONTEND_URL")
	userService := NewUserService(db)
	instanceService := NewInstanceService(db, vmManagerBaseUrl)
	subjectService := NewSubjectService(db, instanceService)
	emailService := NewEmailService()

	listenAddr := getListenAddr()
	server := NewApiServer(
		listenAddr,
		userService,
		subjectService,
		emailService,
		instanceService,
		frontendUrl,
	)

	server.Run()
}

func getListenAddr() string {
	listenAddr := os.Getenv("API_URL")

	// Remove protocol from listen address if present
	if strings.HasPrefix(listenAddr, "http://") {
		listenAddr = strings.TrimPrefix(listenAddr, "http://")
	} else if strings.HasPrefix(listenAddr, "https://") {
		listenAddr = strings.TrimPrefix(listenAddr, "https://")
	}

	return listenAddr
}
