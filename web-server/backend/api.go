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

func WriteResponse(w http.ResponseWriter, status int, value any) error {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	return json.NewEncoder(w).Encode(value)
}

func makeHTTPHandleFunc(fn apiFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if err := fn(w, r); err != nil {
			//TODO: check error from handlers and return appropriate status code
			WriteResponse(w, http.StatusBadRequest, ApiError{Error: err.Error()})
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
	mux.HandleFunc("GET /users", makeHTTPHandleFunc(server.getAllUsers))

	log.Println("Starting server on ", server.listenAddr)

	http.ListenAndServe(server.listenAddr, mux)
}

func (server *ApiServer) getAllUsers(w http.ResponseWriter, r *http.Request) error {
	users := GenerateDummyUsers()
	return WriteResponse(w, http.StatusOK, users)
}
