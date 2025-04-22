package main

import (
	"encoding/json"
	"log"
	"net/http"
)

type apiFunc func(w http.ResponseWriter, r *http.Request) error

type ApiServer struct {
	listenAddr  string
	serverAgent ServerAgent
}

type ApiError struct {
	Error string `json:"error"`
}

func (server *ApiServer) handleCloneVM(w http.ResponseWriter, r *http.Request) error {
	var request CloneVmRequest

	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		return NewHttpError(http.StatusBadRequest, err)
	}

	if err := server.serverAgent.CloneVM(request.SourceVmId, request.TargetVmId); err != nil {
		return err
	}

	return writeResponse(w, http.StatusOK, nil)
}

func (server *ApiServer) handleDeleteVM(w http.ResponseWriter, r *http.Request) error {
	vmId := r.PathValue("vmId")

	if err := server.serverAgent.DeleteVM(vmId); err != nil {
		return err
	}

	return writeResponse(w, http.StatusOK, nil)
}

func (server *ApiServer) handleStartVM(w http.ResponseWriter, r *http.Request) error {
	vmId := r.PathValue("vmId")

	if err := server.serverAgent.StartVM(vmId); err != nil {
		return err
	}

	return writeResponse(w, http.StatusOK, nil)
}

func (server *ApiServer) handleStopVM(w http.ResponseWriter, r *http.Request) error {
	vmId := r.PathValue("vmId")

	if err := server.serverAgent.StopVM(vmId); err != nil {
		return err
	}

	return writeResponse(w, http.StatusOK, nil)
}

func (server *ApiServer) handleRestartVM(w http.ResponseWriter, r *http.Request) error {
	vmId := r.PathValue("vmId")

	if err := server.serverAgent.RestartVM(vmId); err != nil {
		return err
	}

	return writeResponse(w, http.StatusOK, nil)
}

func (server *ApiServer) handleForceStopVM(w http.ResponseWriter, r *http.Request) error {
	vmId := r.PathValue("vmId")

	if err := server.serverAgent.ForceStopVM(vmId); err != nil {
		return err
	}

	return writeResponse(w, http.StatusOK, nil)
}

func (server *ApiServer) handleListVMsStatus(w http.ResponseWriter, r *http.Request) error {
	statuses, err := server.serverAgent.ListVMsStatus()
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

func NewApiServer(listenAddr string, serverAgent ServerAgent) *ApiServer {
	return &ApiServer{
		listenAddr:  listenAddr,
		serverAgent: serverAgent,
	}
}

func (server *ApiServer) Run() {
	mux := http.NewServeMux()

	mux.HandleFunc("POST /vms/clone", createHttpHandler(server.handleCloneVM))
	mux.HandleFunc("DELETE /vms/delete/{vmId}", createHttpHandler(server.handleDeleteVM))
	mux.HandleFunc("POST /vms/start/{vmId}", createHttpHandler(server.handleStartVM))
	mux.HandleFunc("POST /vms/stop/{vmId}", createHttpHandler(server.handleStopVM))
	mux.HandleFunc("POST /vms/restart/{vmId}", createHttpHandler(server.handleRestartVM))
	mux.HandleFunc("POST /vms/force-stop/{vmId}", createHttpHandler(server.handleForceStopVM))
	mux.HandleFunc("GET /vms/status", createHttpHandler(server.handleListVMsStatus))

	log.Println("Starting server agent on", server.listenAddr)

	if err := http.ListenAndServe(server.listenAddr, mux); err != nil {
		log.Fatal("Error starting server agent:", err)
	}
}
