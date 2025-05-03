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

	databaseURL := os.Getenv("DATABASE_URL")
	serverAgentsURLs := strings.Split(os.Getenv("SERVER_AGENTS_API_URLS"), ",")
	listBaseImagesEndpoint := os.Getenv("LIST_BASE_IMAGES_ENDPOINT")
	defineTemplateEndpoint := os.Getenv("DEFINE_TEMPLATE_ENDPOINT")
	deleteTemplateEndpoint := os.Getenv("DELETE_TEMPLATE_ENDPOINT")
	createInstanceEndpoint := os.Getenv("CREATE_INSTANCE_ENDPOINT")
	deleteInstanceEndpoint := os.Getenv("DELETE_INSTANCE_ENDPOINT")
	startInstanceEndpoint := os.Getenv("START_INSTANCE_ENDPOINT")
	stopInstanceEndpoint := os.Getenv("STOP_INSTANCE_ENDPOINT")
	restartInstanceEndpoint := os.Getenv("RESTART_INSTANCE_ENDPOINT")
	listInstancesStatusEndpoint := os.Getenv("LIST_INSTANCES_STATUS_ENDPOINT")

	database, err := NewDatabase(databaseURL)
	if err != nil {
		log.Fatal(err)
	}
	defer database.Close()

	service, err := NewService(
		database,
		serverAgentsURLs,
		listBaseImagesEndpoint,
		defineTemplateEndpoint,
		deleteTemplateEndpoint,
		createInstanceEndpoint,
		deleteInstanceEndpoint,
		startInstanceEndpoint,
		stopInstanceEndpoint,
		restartInstanceEndpoint,
		listInstancesStatusEndpoint,
	)
	if err != nil {
		log.Fatal(err)
	}

	listenAddr := getListenAddr()

	server := NewApiServer(
		listenAddr,
		service,
		listBaseImagesEndpoint,
		defineTemplateEndpoint,
		deleteTemplateEndpoint,
		createInstanceEndpoint,
		deleteInstanceEndpoint,
		startInstanceEndpoint,
		stopInstanceEndpoint,
		restartInstanceEndpoint,
		listInstancesStatusEndpoint,
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
