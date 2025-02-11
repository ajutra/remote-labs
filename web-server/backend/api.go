package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
)

type apiFunc func(w http.ResponseWriter, r *http.Request) error

type ApiServer struct {
	listenAddr     string
	userService    UserService
	subjectService SubjectService
}

type ApiError struct {
	Error string `json:"error"`
}

func (server *ApiServer) handleCreateUser(w http.ResponseWriter, r *http.Request) error {
	var request CreateUserRequest

	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		return NewHttpError(http.StatusBadRequest, err)
	}

	if err := server.userService.CreateUser(request); err != nil {
		return err
	}

	return writeResponse(w, http.StatusOK, "User created successfully")
}

func (server *ApiServer) handleCreateProfessor(w http.ResponseWriter, r *http.Request) error {
	var request CreateProfessorRequest

	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		return NewHttpError(http.StatusBadRequest, err)
	}

	if err := server.userService.CreateProfessor(request); err != nil {
		return err
	}

	return writeResponse(w, http.StatusOK, "Professor created successfully")
}

func (server *ApiServer) handleCreateSubject(w http.ResponseWriter, r *http.Request) error {
	var request CreateSubjectRequest

	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		return NewHttpError(http.StatusBadRequest, err)
	}

	if err := server.subjectService.CreateSubject(request); err != nil {
		return err
	}

	return writeResponse(w, http.StatusOK, "Subject created successfully")
}

func (server *ApiServer) handleListAllSubjectsByUserId(w http.ResponseWriter, r *http.Request) error {
	userId := r.PathValue("id")
	if userId == "" {
		return NewHttpError(http.StatusBadRequest, fmt.Errorf("missing user id"))
	}

	subjects, err := server.subjectService.ListAllSubjectsByUserId(userId)
	if err != nil {
		return err
	}

	return writeResponse(w, http.StatusOK, subjects)
}

func (server *ApiServer) handleListAllUsersBySubjectId(w http.ResponseWriter, r *http.Request) error {
	subjectId := r.PathValue("id")
	if subjectId == "" {
		return NewHttpError(http.StatusBadRequest, fmt.Errorf("missing subject id"))
	}

	users, err := server.userService.ListAllUsersBySubjectId(subjectId)
	if err != nil {
		return err
	}

	return writeResponse(w, http.StatusOK, users)
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

func NewApiServer(listenAddr string, userService UserService, subjectService SubjectService) *ApiServer {
	return &ApiServer{
		listenAddr:     listenAddr,
		userService:    userService,
		subjectService: subjectService,
	}
}

func (server *ApiServer) Run() {
	mux := http.NewServeMux()
	mux.HandleFunc("POST /users", createHttpHandler(server.handleCreateUser))
	mux.HandleFunc("POST /users/professors", createHttpHandler(server.handleCreateProfessor))
	mux.HandleFunc("POST /subjects", createHttpHandler(server.handleCreateSubject))
	mux.HandleFunc("GET /users/{id}/subjects", createHttpHandler(server.handleListAllSubjectsByUserId))
	mux.HandleFunc("GET /subjects/{id}/users", createHttpHandler(server.handleListAllUsersBySubjectId))

	log.Println("Starting server on port", server.listenAddr)

	http.ListenAndServe(server.listenAddr, mux)
}
