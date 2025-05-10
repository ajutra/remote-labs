package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"github.com/google/uuid"
)

type apiFunc func(w http.ResponseWriter, r *http.Request) error

type ApiServer struct {
	listenAddr      string
	userService     UserService
	subjectService  SubjectService
	emailService    EmailService
	instanceService InstanceService
}

type ApiError struct {
	Error string `json:"error"`
}

type TestEmailRequest struct {
	To string `json:"to"`
}

type TestEmailResponse struct {
	Message string `json:"message"`
}

type VerifyEmailRequest struct {
	Mail string `json:"mail"`
}

func (server *ApiServer) handleCreateUser(w http.ResponseWriter, r *http.Request) error {
	var request CreateUserRequest

	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		return NewHttpError(http.StatusBadRequest, err)
	}

	// Generate verification token
	verificationToken := uuid.New()

	// Create unverified user
	if err := server.userService.CreateUnverifiedUser(request, verificationToken); err != nil {
		return err
	}

	// Send verification email
	verificationLink := fmt.Sprintf("http://localhost:5173/verify-email?token=%s", verificationToken.String())
	emailBody := fmt.Sprintf("Please click the following link to verify your email: %s", verificationLink)
	if err := server.emailService.SendEmail(request.Mail, "Email Verification", emailBody); err != nil {
		// Log the error but don't return it to the user
		log.Printf("Error sending verification email: %v", err)
	}

	return writeResponse(w, http.StatusOK, "User created successfully. Please check your email to verify your account.")
}

func (server *ApiServer) handleCreateProfessor(w http.ResponseWriter, r *http.Request) error {
	var request CreateProfessorRequest

	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		return NewHttpError(http.StatusBadRequest, err)
	}

	user, plainPassword, err := server.userService.CreateProfessor(request)
	if err != nil {
		return err
	}

	// Send email with credentials
	subject := "Your Account Credentials"
	body := fmt.Sprintf(
		"Dear %s,\n\n"+
			"A professor account has been created for you on our platform.\n\n"+
			"Your login credentials are:\n"+
			"Email: %s\n"+
			"Password: %s\n\n"+
			"Please keep this information secure. We recommend changing your password after your first login.\n\n"+
			"Best regards,\n"+
			"Administration",
		user.Name, user.Mail, plainPassword)

	if err := server.emailService.SendEmail(request.Mail, subject, body); err != nil {
		// Log the error but don't return it to the user
		log.Printf("Error sending credentials email: %v", err)
	}

	return writeResponse(w, http.StatusOK, "Professor created successfully. Credentials have been sent to their email.")
}

func (server *ApiServer) handleUpdateUser(w http.ResponseWriter, r *http.Request) error {
	var request UpdateUserRequest

	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		return NewHttpError(http.StatusBadRequest, err)
	}

	if err := server.userService.UpdateUser(request); err != nil {
		return err
	}

	return writeResponse(w, http.StatusOK, "User updated successfully")
}

func (server *ApiServer) handleCreateSubject(w http.ResponseWriter, r *http.Request) error {
	var request CreateSubjectRequest

	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		return NewHttpError(http.StatusBadRequest, err)
	}

	subjectId, err := server.subjectService.CreateSubject(request)
	if err != nil {
		return err
	}

	return writeResponse(w, http.StatusOK, map[string]string{
		"subjectId": subjectId,
	})
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

func (server *ApiServer) handleValidateUserCredentials(w http.ResponseWriter, r *http.Request) error {
	var request ValidateUserRequest
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		return NewHttpError(http.StatusBadRequest, err)
	}

	validateUserResponse, err := server.userService.ValidateUser(request)
	if err != nil {
		return err
	}

	return writeResponse(w, http.StatusOK, validateUserResponse)
}

func (server *ApiServer) handleGetUserInfo(w http.ResponseWriter, r *http.Request) error {
	userId := r.PathValue("id")
	if userId == "" {
		return NewHttpError(http.StatusBadRequest, fmt.Errorf("missing user id"))
	}

	user, err := server.userService.GetUser(userId)
	if err != nil {
		return err
	}

	return writeResponse(w, http.StatusOK, user)
}

func (server *ApiServer) handleEnrollUserInSubject(w http.ResponseWriter, r *http.Request) error {
	subjectId := r.PathValue("subjectId")
	userEmail := r.PathValue("userEmail")

	if subjectId == "" || userEmail == "" {
		return NewHttpError(http.StatusBadRequest, fmt.Errorf("missing subject or user email"))
	}

	if err := server.subjectService.EnrollUserInSubject(userEmail, subjectId); err != nil {
		return err
	}

	return writeResponse(w, http.StatusOK, "User enrolled in subject successfully")
}

func (server *ApiServer) handleRemoveUserFromSubject(w http.ResponseWriter, r *http.Request) error {
	subjectId := r.PathValue("subjectId")
	userEmail := r.PathValue("userEmail")

	if subjectId == "" || userEmail == "" {
		return NewHttpError(http.StatusBadRequest, fmt.Errorf("missing subject or user email"))
	}

	if err := server.subjectService.RemoveUserFromSubject(userEmail, subjectId); err != nil {
		return err
	}

	return writeResponse(w, http.StatusOK, "User removed from subject successfully")
}

func (server *ApiServer) handleDeleteSubject(w http.ResponseWriter, r *http.Request) error {
	subjectId := r.PathValue("id")
	if subjectId == "" {
		return NewHttpError(http.StatusBadRequest, fmt.Errorf("missing subject id"))
	}

	if err := server.subjectService.DeleteSubject(subjectId); err != nil {
		return err
	}

	return writeResponse(w, http.StatusOK, "Subject deleted successfully")
}

func (server *ApiServer) handleDeleteUser(w http.ResponseWriter, r *http.Request) error {
	if r.Method != http.MethodDelete {
		return NewHttpError(http.StatusMethodNotAllowed, fmt.Errorf("method %s not allowed", r.Method))
	}

	userId := r.PathValue("id")
	if userId == "" {
		return NewHttpError(http.StatusBadRequest, fmt.Errorf("missing user id"))
	}

	if err := server.userService.DeleteUser(userId); err != nil {
		return err
	}

	return writeResponse(w, http.StatusOK, "User deleted successfully")
}

func (server *ApiServer) handleTestEmail(w http.ResponseWriter, r *http.Request) error {
	var request TestEmailRequest
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		return NewHttpError(http.StatusBadRequest, fmt.Errorf("invalid request body: %w", err))
	}

	// Generar un token de prueba
	token := uuid.New().String()

	// Enviar el correo de prueba
	subject := "Test Email"
	body := fmt.Sprintf("This is a test email. Token: %s", token)
	if err := server.emailService.SendEmail(request.To, subject, body); err != nil {
		return NewHttpError(http.StatusInternalServerError, fmt.Errorf("error sending test email: %w", err))
	}

	return writeResponse(w, http.StatusOK, TestEmailResponse{
		Message: "Test email sent successfully",
	})
}

func (server *ApiServer) handleVerifyEmail(w http.ResponseWriter, r *http.Request) error {
	var request VerifyEmailRequest
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		return NewHttpError(http.StatusBadRequest, fmt.Errorf("invalid request body: %w", err))
	}

	// Generate new verification token
	verificationToken := uuid.New()

	// Update the verification token in the database
	if err := server.userService.UpdateVerificationToken(request.Mail, verificationToken); err != nil {
		return err
	}

	// Send verification email
	verificationLink := fmt.Sprintf("http://localhost:5173/verify-email?token=%s", verificationToken.String())
	emailBody := fmt.Sprintf("Please click the following link to verify your email: %s", verificationLink)
	if err := server.emailService.SendEmail(request.Mail, "Email Verification", emailBody); err != nil {
		return NewHttpError(http.StatusInternalServerError, fmt.Errorf("error sending verification email: %w", err))
	}

	return writeResponse(w, http.StatusOK, "Verification email sent successfully")
}

func (server *ApiServer) handleVerifyUser(w http.ResponseWriter, r *http.Request) error {
	token := r.PathValue("token")
	if token == "" {
		return NewHttpError(http.StatusBadRequest, fmt.Errorf("missing verification token"))
	}

	if err := server.userService.VerifyUser(token); err != nil {
		if err.Error() == "user already verified" {
			return writeResponse(w, http.StatusOK, map[string]string{
				"message": "User already verified",
			})
		}
		return err
	}

	return writeResponse(w, http.StatusOK, map[string]string{
		"message": "User verified successfully",
	})
}

func (server *ApiServer) handleCreateInstance(w http.ResponseWriter, r *http.Request) error {
	var request CreateInstanceFrontendRequest

	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		return NewHttpError(http.StatusBadRequest, err)
	}

	response, err := server.instanceService.CreateInstance(request)
	if err != nil {
		return err
	}

	return writeResponse(w, http.StatusOK, response)
}

func (server *ApiServer) handleStartInstance(w http.ResponseWriter, r *http.Request) error {
	instanceId := r.PathValue("instanceId")
	if instanceId == "" {
		return NewHttpError(http.StatusBadRequest, fmt.Errorf("missing instance id"))
	}

	if err := server.instanceService.StartInstance(instanceId); err != nil {
		return err
	}

	return writeResponse(w, http.StatusOK, "Instance started successfully")
}

func (server *ApiServer) handleStopInstance(w http.ResponseWriter, r *http.Request) error {
	instanceId := r.PathValue("instanceId")
	if instanceId == "" {
		return NewHttpError(http.StatusBadRequest, fmt.Errorf("missing instance id"))
	}

	if err := server.instanceService.StopInstance(instanceId); err != nil {
		return err
	}

	return writeResponse(w, http.StatusOK, "Instance stopped successfully")
}

func (server *ApiServer) handleDeleteInstance(w http.ResponseWriter, r *http.Request) error {
	instanceId := r.PathValue("instanceId")
	if instanceId == "" {
		return NewHttpError(http.StatusBadRequest, fmt.Errorf("missing instance id"))
	}

	if err := server.instanceService.DeleteInstance(instanceId); err != nil {
		return err
	}

	return writeResponse(w, http.StatusOK, "Instance deleted successfully")
}

func (server *ApiServer) handleGetInstanceStatus(w http.ResponseWriter, r *http.Request) error {
	statuses, err := server.instanceService.GetInstanceStatus()
	if err != nil {
		return err
	}

	return writeResponse(w, http.StatusOK, statuses)
}

func (server *ApiServer) handleBases(w http.ResponseWriter, r *http.Request) error {
	bases, err := server.instanceService.Bases()
	if err != nil {
		return err
	}

	return writeResponse(w, http.StatusOK, bases)
}

func (server *ApiServer) handleDefineTemplate(w http.ResponseWriter, r *http.Request) error {
	var request DefineTemplateRequest

	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		return NewHttpError(http.StatusBadRequest, err)
	}

	if err := server.instanceService.DefineTemplate(request); err != nil {
		return err
	}

	return writeResponse(w, http.StatusOK, "Template defined successfully")
}

func (server *ApiServer) handleDeleteTemplate(w http.ResponseWriter, r *http.Request) error {
	templateId := r.PathValue("templateId")
	if templateId == "" {
		return NewHttpError(http.StatusBadRequest, fmt.Errorf("missing template id"))
	}

	subjectId := r.PathValue("subjectId")
	if subjectId == "" {
		return NewHttpError(http.StatusBadRequest, fmt.Errorf("missing subject id"))
	}

	if err := server.instanceService.DeleteTemplate(templateId, subjectId); err != nil {
		return err
	}

	return writeResponse(w, http.StatusOK, "Template deleted successfully")
}

func (server *ApiServer) handleGetInstanceStatusByUserId(w http.ResponseWriter, r *http.Request) error {
	userId := r.PathValue("userId")
	if userId == "" {
		return NewHttpError(http.StatusBadRequest, fmt.Errorf("missing user id"))
	}

	statuses, err := server.instanceService.GetInstanceStatusByUserId(userId)
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

func NewApiServer(listenAddr string, userService UserService, subjectService SubjectService, emailService EmailService, instanceService InstanceService) *ApiServer {
	return &ApiServer{
		listenAddr:      listenAddr,
		userService:     userService,
		subjectService:  subjectService,
		emailService:    emailService,
		instanceService: instanceService,
	}
}

func enableCors(w http.ResponseWriter) {
	w.Header().Set("Access-Control-Allow-Origin", "http://localhost:5173")
	w.Header().Set("Access-Control-Allow-Methods", "POST, GET, PUT, DELETE")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		enableCors(w)
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func (server *ApiServer) Run() {
	mux := http.NewServeMux()
	mux.HandleFunc("POST /users", createHttpHandler(server.handleCreateUser))
	mux.HandleFunc("POST /users/professors", createHttpHandler(server.handleCreateProfessor))
	mux.HandleFunc("PUT /users/update", createHttpHandler(server.handleUpdateUser))
	mux.HandleFunc("POST /subjects", createHttpHandler(server.handleCreateSubject))
	mux.HandleFunc("GET /users/{id}/subjects", createHttpHandler(server.handleListAllSubjectsByUserId))
	mux.HandleFunc("GET /subjects/{id}/users", createHttpHandler(server.handleListAllUsersBySubjectId))
	mux.HandleFunc("POST /users/validate", createHttpHandler(server.handleValidateUserCredentials))
	mux.HandleFunc("GET /users/{id}", createHttpHandler(server.handleGetUserInfo))
	mux.HandleFunc("PUT /subjects/{subjectId}/add/users/{userEmail}", createHttpHandler(server.handleEnrollUserInSubject))
	mux.HandleFunc("DELETE /subjects/{subjectId}/remove/users/{userEmail}", createHttpHandler(server.handleRemoveUserFromSubject))
	mux.HandleFunc("DELETE /subjects/{id}", createHttpHandler(server.handleDeleteSubject))
	mux.HandleFunc("DELETE /users/delete/{id}", createHttpHandler(server.handleDeleteUser))
	mux.HandleFunc("POST /test-email", createHttpHandler(server.handleTestEmail))
	mux.HandleFunc("POST /verify-email", createHttpHandler(server.handleVerifyEmail))
	mux.HandleFunc("GET /verify-email/{token}", createHttpHandler(server.handleVerifyUser))
	mux.HandleFunc("POST /instances/create", createHttpHandler(server.handleCreateInstance))
	mux.HandleFunc("POST /instances/start/{instanceId}", createHttpHandler(server.handleStartInstance))
	mux.HandleFunc("POST /instances/stop/{instanceId}", createHttpHandler(server.handleStopInstance))
	mux.HandleFunc("DELETE /instances/delete/{instanceId}", createHttpHandler(server.handleDeleteInstance))
	mux.HandleFunc("GET /instances/status", createHttpHandler(server.handleGetInstanceStatus))
	mux.HandleFunc("GET /bases", createHttpHandler(server.handleBases))
	mux.HandleFunc("POST /templates/define", createHttpHandler(server.handleDefineTemplate))
	mux.HandleFunc("POST /templates/delete/{templateId}/{subjectId}", createHttpHandler(server.handleDeleteTemplate))
	mux.HandleFunc("GET /instances/status/{userId}", createHttpHandler(server.handleGetInstanceStatusByUserId))

	log.Println("Starting server on port", server.listenAddr)

	http.ListenAndServe(server.listenAddr, corsMiddleware(mux))
}
