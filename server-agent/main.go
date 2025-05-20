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

	vmsStoragePath := os.Getenv("VMS_STORAGE_PATH")
	cloudInitImagesPath := os.Getenv("CLOUD_INIT_IMAGES_PATH")
	listBaseImagesEndpoint := os.Getenv("LIST_BASE_IMAGES_ENDPOINT")
	defineTemplateEndpoint := os.Getenv("DEFINE_TEMPLATE_ENDPOINT")
	createInstanceEndpoint := os.Getenv("CREATE_INSTANCE_ENDPOINT")
	deleteVmEndpoint := os.Getenv("DELETE_VM_ENDPOINT")
	startInstanceEndpoint := os.Getenv("START_INSTANCE_ENDPOINT")
	stopInstanceEndpoint := os.Getenv("STOP_INSTANCE_ENDPOINT")
	restartInstanceEndpoint := os.Getenv("RESTART_INSTANCE_ENDPOINT")
	listInstancesStatusEndpoint := os.Getenv("LIST_INSTANCES_STATUS_ENDPOINT")
	vmsBridge := os.Getenv("VMS_BRIDGE")
	vmNetworkInterface := os.Getenv("VM_NETWORK_INTERFACE")
	getResourceStatusEndpoint := os.Getenv("GET_RESOURCE_STATUS_ENDPOINT")
	isAliveEndpoint := os.Getenv("IS_ALIVE_ENDPOINT")

	serverAgent := NewServerAgent(
		vmsStoragePath,
		cloudInitImagesPath,
		vmsBridge,
		vmNetworkInterface,
	)

	listenAddr := getListenAddr()

	apiServer := NewApiServer(
		listenAddr,
		serverAgent,
		listBaseImagesEndpoint,
		defineTemplateEndpoint,
		createInstanceEndpoint,
		deleteVmEndpoint,
		startInstanceEndpoint,
		stopInstanceEndpoint,
		restartInstanceEndpoint,
		listInstancesStatusEndpoint,
		getResourceStatusEndpoint,
		isAliveEndpoint,
	)
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
