package main

import (
	"encoding/json"
	"log"
	"net/http"
)

type apiFunc func(w http.ResponseWriter, r *http.Request) error

type ApiServer struct {
	listenAddr string
}

type ApiError struct {
	Error string
}

func writeResponse(w http.ResponseWriter, status int, value any) error {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	return json.NewEncoder(w).Encode(value)
}

func createHttpHandler(fn apiFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if err := fn(w, r); err != nil {
			//TODO: check error from handlers and return appropriate status code
			writeResponse(w, http.StatusBadRequest, ApiError{Error: err.Error()})
		}
	}
}

func NewApiServer(listenAddr string) *ApiServer {
	return &ApiServer{
		listenAddr: listenAddr,
	}
}

func (server *ApiServer) Run() {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /users", createHttpHandler(server.handleGetAllUsers))

	log.Println("Starting server on port", server.listenAddr)

	http.ListenAndServe(server.listenAddr, mux)
}

func (server *ApiServer) handleGetAllUsers(w http.ResponseWriter, r *http.Request) error {
	users := GenerateDummyUsers()

	if err := writeResponse(w, http.StatusOK, users); err != nil {
		return writeResponse(w, http.StatusInternalServerError, ApiError{Error: err.Error()})
	}

	// Return nil to indicate success
	return nil
}
