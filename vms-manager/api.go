package main

import (
	"encoding/json"
	"log"
	"net/http"
)

type apiFunc func(w http.ResponseWriter, r *http.Request) error

type ApiServer struct {
	listenAddr string
	service    Service
}

type ApiError struct {
	Error string `json:"error"`
}

func (server *ApiServer) handleCloneVM(w http.ResponseWriter, r *http.Request) error {
	var request CloneVmRequest

	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		return NewHttpError(http.StatusBadRequest, err)
	}

	if err := server.service.CloneVM(request); err != nil {
		return err
	}

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

func NewApiServer(listenAddr string, service Service) *ApiServer {
	return &ApiServer{
		listenAddr: listenAddr,
		service:    service,
	}
}

func (server *ApiServer) Run() {
	mux := http.NewServeMux()

	mux.HandleFunc("POST /vms/clone", createHttpHandler(server.handleCloneVM))

	log.Println("Starting server on", server.listenAddr)

	http.ListenAndServe(server.listenAddr, mux)
}
