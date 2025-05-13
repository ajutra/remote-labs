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
	getResourceStatusEndpoint := os.Getenv("GET_RESOURCE_STATUS_ENDPOINT")
	serverAgentIsAliveEndpoint := os.Getenv("SERVER_AGENT_IS_ALIVE_ENDPOINT")
	vmsDns1 := os.Getenv("VMS_DNS_1")
	vmsDns2 := os.Getenv("VMS_DNS_2")
	routerosApiUrl := os.Getenv("ROUTEROS_API_URL")
	routerosApiUsername := os.Getenv("ROUTEROS_API_USERNAME")
	routerosApiPassword := os.Getenv("ROUTEROS_API_PASSWORD")
	routerosVlanBridge := os.Getenv("ROUTEROS_VLAN_BRIDGE")
	routerosTaggedBridges := strings.Split(os.Getenv("ROUTEROS_TAGGED_BRIDGES"), ",")
	routerosExternalGateway := os.Getenv("ROUTEROS_EXTERNAL_GATEWAY")

	database, err := NewDatabase(databaseURL)
	if err != nil {
		log.Fatal(err)
	}
	defer database.Close()

	routerosService, err := NewRouterOSService(routerosApiUrl, routerosApiUsername, routerosApiPassword)
	if err != nil {
		log.Fatal(err)
	}
	defer routerosService.Close()

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
		getResourceStatusEndpoint,
		serverAgentIsAliveEndpoint,
		vmsDns1,
		vmsDns2,
		routerosService,
		routerosVlanBridge,
		routerosTaggedBridges,
		routerosExternalGateway,
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
