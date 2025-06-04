package main

import (
	"encoding/json"
	"log"
	"net/http"
)

type apiFunc func(w http.ResponseWriter, r *http.Request) error

type ApiServer struct {
	listenAddr                  string
	serverAgent                 ServerAgent
	listBaseImagesEndpoint      string
	defineTemplateEndpoint      string
	createInstanceEndpoint      string
	deleteVmEndpoint            string
	startInstanceEndpoint       string
	stopInstanceEndpoint        string
	restartInstanceEndpoint     string
	listInstancesStatusEndpoint string
	getResourceStatusEndpoint   string
	isAliveEndpoint             string
}

type ApiError struct {
	Error string `json:"error"`
}

func (server *ApiServer) handleListBaseImages(w http.ResponseWriter, r *http.Request) error {
	fileNames, err := server.serverAgent.ListBaseImages()
	if err != nil {
		return err
	}

	return writeResponse(w, http.StatusOK, fileNames)
}

func (server *ApiServer) handleDefineTemplate(w http.ResponseWriter, r *http.Request) error {
	var request DefineTemplateRequest
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		return NewHttpError(http.StatusBadRequest, err)
	}

	if err := server.serverAgent.DefineTemplate(request); err != nil {
		return err
	}

	return writeResponse(w, http.StatusOK, nil)
}

func (server *ApiServer) handleCreateInstance(w http.ResponseWriter, r *http.Request) error {
	var request CreateInstanceRequest
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		return NewHttpError(http.StatusBadRequest, err)
	}

	if err := server.serverAgent.CreateInstance(request); err != nil {
		return err
	}

	return writeResponse(w, http.StatusOK, nil)
}

func (server *ApiServer) handleDeleteVM(w http.ResponseWriter, r *http.Request) error {
	var request DeleteVmRequest
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		return NewHttpError(http.StatusBadRequest, err)
	}

	if err := server.serverAgent.DeleteVm(request); err != nil {
		return err
	}

	return writeResponse(w, http.StatusOK, nil)
}

func (server *ApiServer) handleStartInstance(w http.ResponseWriter, r *http.Request) error {
	var request StartInstanceRequest
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		return NewHttpError(http.StatusBadRequest, err)
	}

	if err := server.serverAgent.StartInstance(request); err != nil {
		return err
	}

	return writeResponse(w, http.StatusOK, nil)
}

func (server *ApiServer) handleStopInstance(w http.ResponseWriter, r *http.Request) error {
	instanceId := r.PathValue("instanceId")

	if err := server.serverAgent.StopInstance(instanceId); err != nil {
		return err
	}

	return writeResponse(w, http.StatusOK, nil)
}

func (server *ApiServer) handleRestartInstance(w http.ResponseWriter, r *http.Request) error {
	instanceId := r.PathValue("instanceId")

	if err := server.serverAgent.RestartInstance(instanceId); err != nil {
		return err
	}

	return writeResponse(w, http.StatusOK, nil)
}

func (server *ApiServer) handleListInstancesStatus(w http.ResponseWriter, r *http.Request) error {
	statuses, err := server.serverAgent.ListInstancesStatus()
	if err != nil {
		return err
	}

	return writeResponse(w, http.StatusOK, statuses)
}

func (server *ApiServer) handleGetResourceStatus(w http.ResponseWriter, r *http.Request) error {
	status, err := server.serverAgent.GetResourceStatus()
	if err != nil {
		return err
	}

	return writeResponse(w, http.StatusOK, status)
}

func (server *ApiServer) handleIsAlive(w http.ResponseWriter, r *http.Request) error {
	return writeResponse(w, http.StatusOK, nil)
}

func writeResponse(w http.ResponseWriter, status int, value any) error {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	return json.NewEncoder(w).Encode(value)
}

func createHttpHandler(fn apiFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if err := fn(w, r); err != nil {
			var status int
			if httpErr, ok := err.(*HttpError); ok {
				status = httpErr.StatusCode
			} else {
				status = http.StatusInternalServerError
			}
			writeResponse(w, status, ApiError{Error: err.Error()})
		}
	}
}

func NewApiServer(
	listenAddr string,
	serverAgent ServerAgent,
	listBaseImagesEndpoint string,
	defineTemplateEndpoint string,
	createInstanceEndpoint string,
	deleteVmEndpoint string,
	startInstanceEndpoint string,
	stopInstanceEndpoint string,
	restartInstanceEndpoint string,
	listInstancesStatusEndpoint string,
	getResourceStatusEndpoint string,
	isAliveEndpoint string,
) *ApiServer {
	return &ApiServer{
		listenAddr:                  listenAddr,
		serverAgent:                 serverAgent,
		listBaseImagesEndpoint:      listBaseImagesEndpoint,
		defineTemplateEndpoint:      defineTemplateEndpoint,
		createInstanceEndpoint:      createInstanceEndpoint,
		deleteVmEndpoint:            deleteVmEndpoint,
		startInstanceEndpoint:       startInstanceEndpoint,
		stopInstanceEndpoint:        stopInstanceEndpoint,
		restartInstanceEndpoint:     restartInstanceEndpoint,
		listInstancesStatusEndpoint: listInstancesStatusEndpoint,
		getResourceStatusEndpoint:   getResourceStatusEndpoint,
		isAliveEndpoint:             isAliveEndpoint,
	}
}

func (server *ApiServer) Run() {
	mux := http.NewServeMux()

	mux.HandleFunc(
		"GET "+server.listBaseImagesEndpoint,
		createHttpHandler(server.handleListBaseImages),
	)
	mux.HandleFunc(
		"POST "+server.defineTemplateEndpoint,
		createHttpHandler(server.handleDefineTemplate),
	)
	mux.HandleFunc(
		"POST "+server.createInstanceEndpoint,
		createHttpHandler(server.handleCreateInstance),
	)
	mux.HandleFunc(
		"DELETE "+server.deleteVmEndpoint,
		createHttpHandler(server.handleDeleteVM),
	)
	mux.HandleFunc(
		"POST "+server.startInstanceEndpoint,
		createHttpHandler(server.handleStartInstance),
	)
	mux.HandleFunc(
		"POST "+server.stopInstanceEndpoint+"/{instanceId}",
		createHttpHandler(server.handleStopInstance),
	)
	mux.HandleFunc(
		"POST "+server.restartInstanceEndpoint+"/{instanceId}",
		createHttpHandler(server.handleRestartInstance),
	)
	mux.HandleFunc(
		"GET "+server.listInstancesStatusEndpoint,
		createHttpHandler(server.handleListInstancesStatus),
	)
	mux.HandleFunc(
		"GET "+server.getResourceStatusEndpoint,
		createHttpHandler(server.handleGetResourceStatus),
	)
	mux.HandleFunc(
		"GET "+server.isAliveEndpoint,
		createHttpHandler(server.handleIsAlive),
	)

	log.Println("Starting server agent on", server.listenAddr)

	if err := http.ListenAndServe(server.listenAddr, mux); err != nil {
		log.Fatal("Error starting server agent:", err)
	}
}
