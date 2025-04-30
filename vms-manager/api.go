package main

import (
	"encoding/json"
	"log"
	"net/http"
)

type apiFunc func(w http.ResponseWriter, r *http.Request) error

type ApiServer struct {
	listenAddr                  string
	service                     Service
	listBaseImagesEndpoint      string
	defineTemplateEndpoint      string
	deleteTemplateEndpoint      string
	createInstanceEndpoint      string
	deleteInstanceEndpoint      string
	startInstanceEndpoint       string
	stopInstanceEndpoint        string
	restartInstanceEndpoint     string
	listInstancesStatusEndpoint string
}

func (server *ApiServer) handleListBaseImages(w http.ResponseWriter, r *http.Request) error {
	baseImages, err := server.service.ListBaseImages()
	if err != nil {
		return err
	}
	return writeResponse(w, http.StatusOK, baseImages)
}

func (server *ApiServer) handleDefineTemplate(w http.ResponseWriter, r *http.Request) error {
	sourceInstanceId := r.PathValue("sourceInstanceId")

	response, err := server.service.DefineTemplate(sourceInstanceId)
	if err != nil {
		return err
	}

	return writeResponse(w, http.StatusOK, response)
}

func (server *ApiServer) handleDeleteTemplate(w http.ResponseWriter, r *http.Request) error {
	templateId := r.PathValue("templateId")

	if err := server.service.DeleteTemplate(templateId); err != nil {
		return err
	}

	return writeResponse(w, http.StatusOK, nil)
}

func (server *ApiServer) handleCreateInstance(w http.ResponseWriter, r *http.Request) error {
	var request CreateInstanceRequest
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		return err
	}

	response, err := server.service.CreateInstance(request)
	if err != nil {
		return err
	}

	return writeResponse(w, http.StatusOK, response)
}

func (server *ApiServer) handleDeleteInstance(w http.ResponseWriter, r *http.Request) error {
	instanceId := r.PathValue("instanceId")

	if err := server.service.DeleteInstance(instanceId); err != nil {
		return err
	}

	return writeResponse(w, http.StatusOK, nil)
}

func (server *ApiServer) handleStartInstance(w http.ResponseWriter, r *http.Request) error {
	instanceId := r.PathValue("instanceId")

	if err := server.service.StartInstance(instanceId); err != nil {
		return err
	}

	return writeResponse(w, http.StatusOK, nil)
}

func (server *ApiServer) handleStopInstance(w http.ResponseWriter, r *http.Request) error {
	instanceId := r.PathValue("instanceId")

	if err := server.service.StopInstance(instanceId); err != nil {
		return err
	}

	return writeResponse(w, http.StatusOK, nil)
}

func (server *ApiServer) handleRestartInstance(w http.ResponseWriter, r *http.Request) error {
	instanceId := r.PathValue("instanceId")

	if err := server.service.RestartInstance(instanceId); err != nil {
		return err
	}

	return writeResponse(w, http.StatusOK, nil)
}

func (server *ApiServer) handleListInstancesStatus(w http.ResponseWriter, r *http.Request) error {
	statuses, err := server.service.ListInstancesStatus()
	if err != nil {
		return err
	}

	return writeResponse(w, http.StatusOK, statuses)
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
	service Service,
	listBaseImagesEndpoint string,
	defineTemplateEndpoint string,
	deleteTemplateEndpoint string,
	createInstanceEndpoint string,
	deleteInstanceEndpoint string,
	startInstanceEndpoint string,
	stopInstanceEndpoint string,
	restartInstanceEndpoint string,
	listInstancesStatusEndpoint string,
) *ApiServer {
	return &ApiServer{
		listenAddr:                  listenAddr,
		service:                     service,
		listBaseImagesEndpoint:      listBaseImagesEndpoint,
		defineTemplateEndpoint:      defineTemplateEndpoint,
		deleteTemplateEndpoint:      deleteTemplateEndpoint,
		createInstanceEndpoint:      createInstanceEndpoint,
		deleteInstanceEndpoint:      deleteInstanceEndpoint,
		startInstanceEndpoint:       startInstanceEndpoint,
		stopInstanceEndpoint:        stopInstanceEndpoint,
		restartInstanceEndpoint:     restartInstanceEndpoint,
		listInstancesStatusEndpoint: listInstancesStatusEndpoint,
	}
}

func (server *ApiServer) Run() {
	mux := http.NewServeMux()

	mux.HandleFunc(
		"GET "+server.listBaseImagesEndpoint,
		createHttpHandler(server.handleListBaseImages),
	)
	mux.HandleFunc(
		"POST "+server.defineTemplateEndpoint+"/{sourceInstanceId}",
		createHttpHandler(server.handleDefineTemplate),
	)
	mux.HandleFunc(
		"DELETE "+server.deleteTemplateEndpoint+"/{templateId}",
		createHttpHandler(server.handleDeleteTemplate),
	)
	mux.HandleFunc(
		"POST "+server.createInstanceEndpoint,
		createHttpHandler(server.handleCreateInstance),
	)
	mux.HandleFunc(
		"DELETE "+server.deleteInstanceEndpoint+"/{instanceId}",
		createHttpHandler(server.handleDeleteInstance),
	)
	mux.HandleFunc(
		"POST "+server.startInstanceEndpoint+"/{instanceId}",
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

	log.Println("Starting server on", server.listenAddr)

	if err := http.ListenAndServe(server.listenAddr, mux); err != nil {
		log.Fatal("Error starting server:", err)
	}
}
