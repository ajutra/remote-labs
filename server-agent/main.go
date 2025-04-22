package main

import (
	"log"
	"os"
	"strings"

	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(".env"); err != nil {
		log.Fatal("Error loading .env file: " + err.Error())
	}

	serverAgent := NewServerAgent()

	listenAddr := getListenAddr()

	apiServer := NewApiServer(listenAddr, serverAgent)
	apiServer.Run()
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
