package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
)

type Database interface {
	Close()
	CreateUnverifiedUser(user User, verificationToken uuid.UUID) error
	VerifyUser(token string) error
	CreateUser(user User) error
	UserExistsByMail(mail string) error
	CreateSubject(subject Subject) (string, error)
	UserExistsByEmailorError(userEmail string) error
	UserExistsById(userId string) error
	ListAllSubjectsByUserId(userId string) ([]Subject, error)
	ListAllUsersBySubjectId(subjectId string) ([]User, error)
	ValidateUser(mail, password string) (User, error)
	GetUser(userId string) (User, error)
	SubjectExistsById(subjectId string) error
	EnrollUserInSubject(userEmail, subjectId string) error
	IsMainProfessorOfSubject(userEmail, subjectId string) bool
	RemoveUserFromSubject(userEmail, subjectId string) error
	DeleteSubject(subjectId string) error
	DeleteUser(userId string) error
	UpdateVerificationToken(email string, token uuid.UUID) error
	GetTemplateConfig(templateId string, subjectId string) (TemplateConfig, error)
	CreateInstance(instanceId string, userId string, subjectId string, templateId *string, wgPrivateKey string, wgPublicKey string, interfaceIp string, peerPublicKey string, peerAllowedIps []string, peerEndpointPort int) error
	DeleteInstance(instanceId string) error
	CreateTemplate(templateId string, subjectId string, sizeMB int, vcpuCount int, vramMB int, isValidated bool, description string) error
	DeleteTemplate(templateId string, subjectId string) error
	UpdateUser(userId string, password string, publicSshKeys []string) error
	GetUserIdByEmail(userEmail string) (string, error)
	DeleteAllUsersFromSubject(subjectId string) error
	ListAllTemplatesBySubjectId(subjectId string) ([]string, error)
	ListAllInstancesBySubjectId(subjectId string) ([]string, error)
	GetInstanceInfo(instanceId string) (InstanceInfo, error)
	GetInstanceIdsByUserId(userId string) ([]string, error)
}

type PostgresDatabase struct {
	db *pgxpool.Pool
}

type DatabaseUser struct {
	ID            uuid.UUID
	Role          Role
	Name          string
	Mail          string
	Password      string
	PublicSshKeys []string
}

type DatabaseSubject struct {
	ID            uuid.UUID
	Name          string
	Code          string
	ProfessorMail string
}

type InstanceInfo struct {
	UserId              string
	SubjectId           string
	TemplateId          *string
	CreatedAt           time.Time // Changed from string to time.Time
	UserMail            string
	SubjectName         string
	Template_vcpu_count *int
	Template_vram_mb    *int
	Template_size_mb    *int
}

func (postgres *PostgresDatabase) GetInstanceIdsByUserId(userId string) ([]string, error) {
	query := "SELECT id FROM instances WHERE user_id = $1"

	rows, err := postgres.db.Query(context.Background(), query, userId)
	if err != nil {
		return nil, fmt.Errorf("error executing query: %w", err)
	}
	defer rows.Close()

	var instanceIds []string
	for rows.Next() {
		var instanceId string
		if err := rows.Scan(&instanceId); err != nil {
			return nil, fmt.Errorf("error scanning row: %w", err)
		}
		instanceIds = append(instanceIds, instanceId)
	}

	if rows.Err() != nil {
		return nil, fmt.Errorf("error iterating rows: %w", rows.Err())
	}

	return instanceIds, nil
}

func (postgres *PostgresDatabase) ListAllTemplatesBySubjectId(subjectId string) ([]string, error) {
	query := "SELECT id FROM templates WHERE subject_id = @subject_id"
	args := pgx.NamedArgs{"subject_id": subjectId}

	var templates []string
	if err := postgres.db.QueryRow(context.Background(), query, args).Scan(&templates); err != nil {
		return nil, fmt.Errorf("error listing templates: %w", err)
	}

	return templates, nil
}

func (postgres *PostgresDatabase) ListAllInstancesBySubjectId(subjectId string) ([]string, error) {
	query := "SELECT id FROM instances WHERE subject_id = @subject_id"
	args := pgx.NamedArgs{"subject_id": subjectId}

	var instances []string
	if err := postgres.db.QueryRow(context.Background(), query, args).Scan(&instances); err != nil {
		return nil, fmt.Errorf("error listing instances: %w", err)
	}

	return instances, nil
}

func (postgres *PostgresDatabase) UserExistsById(userId string) error {
	query := "SELECT EXISTS(SELECT 1 FROM users WHERE id = @id)"
	args := pgx.NamedArgs{"id": userId}

	var exists bool
	if err := postgres.db.QueryRow(context.Background(), query, args).Scan(&exists); err != nil {
		return fmt.Errorf("error checking if user exists: %w", err)
	}

	if !exists {
		return NewHttpError(http.StatusBadRequest, fmt.Errorf("user with id %s does not exist", userId))
	}

	return nil
}

func (postgres *PostgresDatabase) UpdateUser(userId string, password string, publicSshKeys []string) error {
	//if password is empty, don't update it
	var query string
	var args pgx.NamedArgs
	if password != "" {
		query = `
		UPDATE users SET password = @password, public_ssh_keys = @public_ssh_keys WHERE id = @id`
		args = pgx.NamedArgs{
			"password":        password,
			"public_ssh_keys": publicSshKeys,
		}
	} else {
		query = `
		UPDATE users SET public_ssh_keys = @public_ssh_keys WHERE id = @id`
		args = pgx.NamedArgs{
			"id":              userId,
			"public_ssh_keys": publicSshKeys,
		}
	}

	_, err := postgres.db.Exec(context.Background(), query, args)
	if err != nil {
		return fmt.Errorf("error updating user: %w", err)
	}

	return nil
}

func (postgres *PostgresDatabase) CreateTemplate(templateId string, subjectId string, sizeMB int, vcpuCount int, vramMB int, isValidated bool, description string) error {
	// Convert subjectId to UUID
	subjectUUID, err := uuid.Parse(subjectId)
	if err != nil {
		return fmt.Errorf("error parsing subject ID: %w", err)
	}

	query := `
	INSERT INTO templates (id, subject_id, size_mb, vcpu_count, vram_mb, is_validated, description)
	VALUES (@id, @subject_id, @size_mb, @vcpu_count, @vram_mb, @is_validated, @description)
	ON CONFLICT (id, subject_id) DO NOTHING`

	args := pgx.NamedArgs{
		"id":           templateId,
		"subject_id":   subjectUUID,
		"size_mb":      sizeMB,
		"vcpu_count":   vcpuCount,
		"vram_mb":      vramMB,
		"is_validated": isValidated,
		"description":  description,
	}

	_, err = postgres.db.Exec(context.Background(), query, args)
	if err != nil {
		return fmt.Errorf("error creating template: %w", err)
	}

	return nil
}

func (postgres *PostgresDatabase) DeleteTemplate(templateId string, subjectId string) error {
	query := `
	DELETE FROM templates WHERE id = @template_id AND subject_id = @subject_id`
	args := pgx.NamedArgs{
		"template_id": templateId,
		"subject_id":  subjectId,
	}

	_, err := postgres.db.Exec(context.Background(), query, args)
	if err != nil {
		return fmt.Errorf("error deleting template: %w", err)
	}

	return nil
}

func (postgres *PostgresDatabase) GetTemplateConfig(templateId string, subjectId string) (TemplateConfig, error) {
	query := `
	SELECT size_mb, vcpu_count, vram_mb
	FROM templates
	WHERE id = @template_id AND subject_id = @subject_id`
	args := pgx.NamedArgs{
		"template_id": templateId,
		"subject_id":  subjectId,
	}

	var templateConfig TemplateConfig
	if err := postgres.db.QueryRow(context.Background(), query, args).Scan(&templateConfig.SizeMB, &templateConfig.VcpuCount, &templateConfig.VramMB); err != nil {
		return TemplateConfig{}, fmt.Errorf("error getting template config: %w", err)
	}

	return templateConfig, nil
}

func (postgres *PostgresDatabase) CreateInstance(instanceId string, userId string, subjectId string, templateId *string, wgPrivateKey string, wgPublicKey string, interfaceIp string, peerPublicKey string, peerAllowedIps []string, peerEndpointPort int) error {
	// Convertir los strings a UUID
	instanceUUID, err := uuid.Parse(instanceId)
	if err != nil {
		return fmt.Errorf("error parsing instance ID: %w", err)
	}

	userUUID, err := uuid.Parse(userId)
	if err != nil {
		return fmt.Errorf("error parsing user ID: %w", err)
	}

	subjectUUID, err := uuid.Parse(subjectId)
	if err != nil {
		return fmt.Errorf("error parsing subject ID: %w", err)
	}

	var templateUUID *uuid.UUID
	if templateId != nil {
		parsedUUID, err := uuid.Parse(*templateId)
		if err != nil {
			return fmt.Errorf("error parsing template ID: %w", err)
		}
		templateUUID = &parsedUUID
	}

	query := `
	INSERT INTO instances (id, user_id, subject_id, template_id, wg_private_key, wg_public_key, interface_ip, peer_public_key, peer_allowed_ips, peer_endpoint_port)
	VALUES (@id, @user_id, @subject_id, @template_id, @wg_private_key, @wg_public_key, @interface_ip, @peer_public_key, @peer_allowed_ips, @peer_endpoint_port)`
	args := pgx.NamedArgs{
		"id":                 instanceUUID,
		"user_id":            userUUID,
		"subject_id":         subjectUUID,
		"template_id":        templateUUID,
		"wg_private_key":     wgPrivateKey,
		"wg_public_key":      wgPublicKey,
		"interface_ip":       interfaceIp,
		"peer_public_key":    peerPublicKey,
		"peer_allowed_ips":   peerAllowedIps,
		"peer_endpoint_port": peerEndpointPort,
	}

	_, err = postgres.db.Exec(context.Background(), query, args)
	if err != nil {
		return fmt.Errorf("error creating instance: %w", err)
	}

	return nil
}

func (postgres *PostgresDatabase) DeleteInstance(instanceId string) error {
	query := `
	DELETE FROM instances WHERE id = @id`
	args := pgx.NamedArgs{"id": instanceId}

	_, err := postgres.db.Exec(context.Background(), query, args)
	if err != nil {
		return fmt.Errorf("error deleting instance: %w", err)
	}
	return nil
}

func (postgres *PostgresDatabase) CreateUser(user User) error {
	dbUser := user.toDatabaseUser()
	query := `
	INSERT INTO users (id, role_id, name, mail, password)
	VALUES (
		@id, 
		(SELECT id FROM roles WHERE role = @role), 
		@name, 
		@mail, 
		@password)`
	args := pgx.NamedArgs{
		"id":       dbUser.ID,
		"role":     dbUser.Role,
		"name":     dbUser.Name,
		"mail":     dbUser.Mail,
		"password": dbUser.Password,
	}

	_, err := postgres.db.Exec(context.Background(), query, args)
	if err != nil {
		return fmt.Errorf("error creating user: %w", err)
	}

	return nil
}

func (postgres *PostgresDatabase) CreateUnverifiedUser(user User, verificationToken uuid.UUID) error {
	dbUser := user.toDatabaseUser()
	query := `
	INSERT INTO unverified_users (id, role_id, name, mail, password, verification_token)
	VALUES (
		@id, 
		(SELECT id FROM roles WHERE role = @role), 
		@name, 
		@mail, 
		@password,
		@verification_token)`
	args := pgx.NamedArgs{
		"id":                 dbUser.ID,
		"role":               dbUser.Role,
		"name":               dbUser.Name,
		"mail":               dbUser.Mail,
		"password":           dbUser.Password,
		"verification_token": verificationToken,
	}

	_, err := postgres.db.Exec(context.Background(), query, args)
	if err != nil {
		return fmt.Errorf("error creating unverified user: %w", err)
	}

	return nil
}

func (postgres *PostgresDatabase) UserExistsByMail(mail string) error {
	// Check if user exists in users table
	query := "SELECT EXISTS(SELECT 1 FROM users WHERE mail = @mail)"
	args := pgx.NamedArgs{"mail": mail}

	var exists bool
	if err := postgres.db.QueryRow(context.Background(), query, args).Scan(&exists); err != nil {
		return fmt.Errorf("error checking if user exists: %w", err)
	}

	if !exists {
		return NewHttpError(http.StatusBadRequest, fmt.Errorf("user with mail %s does not exist", mail))
	}

	// Check if user exists in unverified_users table
	query = "SELECT EXISTS(SELECT 1 FROM unverified_users WHERE mail = @mail)"
	if err := postgres.db.QueryRow(context.Background(), query, args).Scan(&exists); err != nil {
		return fmt.Errorf("error checking if unverified user exists: %w", err)
	}

	if exists {
		return NewHttpError(http.StatusBadRequest, fmt.Errorf("user with mail %s exists but is not verified", mail))
	}

	return nil
}

func (postgres *PostgresDatabase) CreateSubject(subject Subject) (string, error) {
	dbSubject := subject.toDatabaseSubject()
	query := `
	INSERT INTO subjects (id, name, code, main_professor_id)
	VALUES (
		@id, 
		@name, 
		@code, 
		(SELECT id FROM users WHERE mail = @professor_mail))`
	args := pgx.NamedArgs{
		"id":             dbSubject.ID,
		"name":           dbSubject.Name,
		"code":           dbSubject.Code,
		"professor_mail": dbSubject.ProfessorMail,
	}

	_, err := postgres.db.Exec(context.Background(), query, args)
	if err != nil {
		return "", fmt.Errorf("error creating subject: %w", err)
	}

	return dbSubject.ID.String(), nil
}

func (postgres *PostgresDatabase) UserExistsByEmailorError(userEmail string) error {
	query := "SELECT EXISTS(SELECT 1 FROM users WHERE mail = @mail)"
	args := pgx.NamedArgs{"mail": userEmail}

	var exists bool
	if err := postgres.db.QueryRow(context.Background(), query, args).Scan(&exists); err != nil {
		return fmt.Errorf("error checking if user exists: %w", err)
	}

	if !exists {
		return NewHttpError(http.StatusBadRequest, fmt.Errorf("user with email %s does not exist", userEmail))
	}

	return nil
}

func (postgres *PostgresDatabase) ListAllSubjectsByUserId(userId string) ([]Subject, error) {
	query := `
	SELECT s.id, s.name, s.code, s.main_professor_id
	FROM subjects s
	JOIN user_subjects us ON s.id = us.subject_id
	WHERE us.user_id = @id`
	args := pgx.NamedArgs{"id": userId}

	rows, err := postgres.db.Query(context.Background(), query, args)
	if err != nil {
		return nil, fmt.Errorf("error listing subjects: %w", err)
	}
	defer rows.Close()

	var subjects []Subject
	for rows.Next() {
		var dbSubject DatabaseSubject
		if err := rows.Scan(&dbSubject.ID, &dbSubject.Name, &dbSubject.Code, &dbSubject.ProfessorMail); err != nil {
			return nil, fmt.Errorf("error scanning subject: %w", err)
		}

		subjects = append(subjects, dbSubject.toSubject())
	}

	if len(subjects) == 0 {
		return nil, NewHttpError(http.StatusBadRequest, fmt.Errorf("no subjects found for user with id %s", userId))
	}

	return subjects, nil
}

func (postgres *PostgresDatabase) ListAllUsersBySubjectId(subjectId string) ([]User, error) {
	query := `
	SELECT u.id, r.role, u.name, u.mail, u.password
	FROM users u
	JOIN roles r ON u.role_id = r.id
	JOIN user_subjects us ON u.id = us.user_id
	WHERE us.subject_id = @id`
	args := pgx.NamedArgs{"id": subjectId}

	rows, err := postgres.db.Query(context.Background(), query, args)
	if err != nil {
		return nil, fmt.Errorf("error listing users: %w", err)
	}
	defer rows.Close()

	var users []User
	for rows.Next() {
		var dbUser DatabaseUser
		if err := rows.Scan(&dbUser.ID, &dbUser.Role, &dbUser.Name, &dbUser.Mail, &dbUser.Password); err != nil {
			return nil, fmt.Errorf("error scanning user: %w", err)
		}

		users = append(users, dbUser.toUser())
	}

	if len(users) == 0 {
		return nil, NewHttpError(http.StatusBadRequest, fmt.Errorf("no users enrolled in subject with id %s", subjectId))
	}

	return users, nil
}

func (postgres *PostgresDatabase) ValidateUser(mail, password string) (User, error) {

	query := `
	SELECT u.id, r.role, u.name, u.mail, u.password
	FROM users u
	JOIN roles r ON u.role_id = r.id
	WHERE u.mail = @mail`
	args := pgx.NamedArgs{"mail": mail}

	var dbUser DatabaseUser
	err := postgres.db.QueryRow(context.Background(), query, args).Scan(&dbUser.ID, &dbUser.Role, &dbUser.Name, &dbUser.Mail, &dbUser.Password)
	if err != nil {
		return User{}, fmt.Errorf("error validating user: %w", err)
	}

	// Comparar la contraseña en texto plano con el hash almacenado
	if !CheckPasswordHash(password, dbUser.Password) {
		return User{}, fmt.Errorf("invalid password")
	}

	return dbUser.toUser(), nil
}

func (postgres *PostgresDatabase) GetUser(userId string) (User, error) {
	query := `
	SELECT u.id, r.role, u.name, u.mail, u.password, u.public_ssh_keys
	FROM users u
	JOIN roles r ON u.role_id = r.id
	WHERE u.id = @id`
	args := pgx.NamedArgs{"id": userId}

	var dbUser DatabaseUser
	if err := postgres.db.QueryRow(context.Background(), query, args).Scan(&dbUser.ID, &dbUser.Role, &dbUser.Name, &dbUser.Mail, &dbUser.Password, &dbUser.PublicSshKeys); err != nil {
		return User{}, fmt.Errorf("error getting user: %w", err)
	}

	return dbUser.toUser(), nil
}

func (postgres *PostgresDatabase) SubjectExistsById(subjectId string) error {
	query := "SELECT EXISTS(SELECT 1 FROM subjects WHERE id = @id)"
	args := pgx.NamedArgs{"id": subjectId}

	var exists bool
	if err := postgres.db.QueryRow(context.Background(), query, args).Scan(&exists); err != nil {
		return fmt.Errorf("error checking if subject exists: %w", err)
	}

	if !exists {
		return NewHttpError(http.StatusBadRequest, fmt.Errorf("subject with id %s does not exist", subjectId))
	}

	return nil
}

func (postgres *PostgresDatabase) EnrollUserInSubject(userEmail, subjectId string) error {
	userId, err := postgres.GetUserIdByEmail(userEmail)
	if err != nil {
		return fmt.Errorf("error getting user id: %w", err)
	}

	query := `
	INSERT INTO user_subjects (user_id, subject_id)
	VALUES (@user_id, @subject_id)`
	args := pgx.NamedArgs{"user_id": userId, "subject_id": subjectId}

	_, err = postgres.db.Exec(context.Background(), query, args)
	if err != nil {
		return fmt.Errorf("error enrolling user in subject: %w", err)
	}

	return nil
}

func (postgres *PostgresDatabase) IsMainProfessorOfSubject(userId, subjectId string) bool {
	query := "SELECT EXISTS(SELECT 1 FROM subjects WHERE id = @subject_id AND main_professor_id = @user_id)"
	args := pgx.NamedArgs{"subject_id": subjectId, "user_id": userId}

	var isMainProfessor bool
	if err := postgres.db.QueryRow(context.Background(), query, args).Scan(&isMainProfessor); err != nil {
		return false
	}

	return isMainProfessor
}

func (postgres *PostgresDatabase) RemoveUserFromSubject(userEmail, subjectId string) error {
	userId, err := postgres.GetUserIdByEmail(userEmail)
	if err != nil {
		return fmt.Errorf("error getting user id: %w", err)
	}

	query := `
	DELETE FROM user_subjects
	WHERE user_id = @user_id AND subject_id = @subject_id`
	args := pgx.NamedArgs{"user_id": userId, "subject_id": subjectId}

	_, err = postgres.db.Exec(context.Background(), query, args)
	if err != nil {
		return fmt.Errorf("error removing user from subject: %w", err)
	}

	return nil
}

func (postgres *PostgresDatabase) DeleteAllUsersFromSubject(subjectId string) error {
	query := "DELETE FROM user_subjects WHERE subject_id = @subject_id"
	args := pgx.NamedArgs{"subject_id": subjectId}

	_, err := postgres.db.Exec(context.Background(), query, args)
	if err != nil {
		return fmt.Errorf("error deleting all users from subject: %w", err)
	}

	return nil
}

func (postgres *PostgresDatabase) DeleteSubject(subjectId string) error {
	query := "DELETE FROM subjects WHERE id = @id"
	args := pgx.NamedArgs{"id": subjectId}

	_, err := postgres.db.Exec(context.Background(), query, args)
	if err != nil {
		return fmt.Errorf("error deleting subject: %w", err)
	}

	return nil
}

func (postgres *PostgresDatabase) DeleteUser(userId string) error {
	query := "DELETE FROM users WHERE id = @id"
	args := pgx.NamedArgs{"id": userId}

	_, err := postgres.db.Exec(context.Background(), query, args)
	if err != nil {
		return fmt.Errorf("error deleting user: %w", err)
	}

	return nil
}

func (postgres *PostgresDatabase) VerifyUser(token string) error {
	// Start a transaction
	tx, err := postgres.db.Begin(context.Background())
	if err != nil {
		return fmt.Errorf("error starting transaction: %w", err)
	}
	defer tx.Rollback(context.Background())

	// Get the unverified user
	query := `
	SELECT id, role_id, name, mail, password
	FROM unverified_users
	WHERE verification_token = @token`
	args := pgx.NamedArgs{"token": token}

	var dbUser DatabaseUser
	if err := tx.QueryRow(context.Background(), query, args).Scan(&dbUser.ID, &dbUser.Role, &dbUser.Name, &dbUser.Mail, &dbUser.Password); err != nil {
		if err == pgx.ErrNoRows {
			return fmt.Errorf("no unverified user found with this token")
		}
		return fmt.Errorf("error retrieving unverified user: %w", err)
	}

	// Check if user already exists in users table
	query = "SELECT EXISTS(SELECT 1 FROM users WHERE mail = @mail)"
	args = pgx.NamedArgs{"mail": dbUser.Mail}
	var exists bool
	if err := tx.QueryRow(context.Background(), query, args).Scan(&exists); err != nil {
		return fmt.Errorf("error checking if user exists: %w", err)
	}

	if exists {
		// User is already verified, just delete from unverified_users
		query = "DELETE FROM unverified_users WHERE verification_token = @token"
		args = pgx.NamedArgs{"token": token}
		if _, err := tx.Exec(context.Background(), query, args); err != nil {
			return fmt.Errorf("error deleting unverified user: %w", err)
		}
		return fmt.Errorf("user already verified")
	}

	// Insert into verified users
	query = `
	INSERT INTO users (id, role_id, name, mail, password)
	VALUES (@id, @role_id, @name, @mail, @password)`
	args = pgx.NamedArgs{
		"id":       dbUser.ID,
		"role_id":  dbUser.Role,
		"name":     dbUser.Name,
		"mail":     dbUser.Mail,
		"password": dbUser.Password,
	}

	if _, err := tx.Exec(context.Background(), query, args); err != nil {
		return fmt.Errorf("error inserting verified user: %w", err)
	}

	// Delete from unverified users
	query = "DELETE FROM unverified_users WHERE verification_token = @token"
	args = pgx.NamedArgs{"token": token}
	if _, err := tx.Exec(context.Background(), query, args); err != nil {
		return fmt.Errorf("error deleting unverified user: %w", err)
	}

	// Commit the transaction
	if err := tx.Commit(context.Background()); err != nil {
		return fmt.Errorf("error committing transaction: %w", err)
	}

	return nil
}

func (user *User) toDatabaseUser() DatabaseUser {
	return DatabaseUser{
		ID:            user.ID,
		Role:          user.Role,
		Name:          user.Name,
		Mail:          user.Mail,
		Password:      user.Password,
		PublicSshKeys: user.PublicSshKeys,
	}
}

func (subject *Subject) toDatabaseSubject() DatabaseSubject {
	return DatabaseSubject{
		ID:            subject.ID,
		Name:          subject.Name,
		Code:          subject.Code,
		ProfessorMail: subject.ProfessorMail,
	}
}

func (dbSubject *DatabaseSubject) toSubject() Subject {
	return Subject{
		ID:            dbSubject.ID,
		Name:          dbSubject.Name,
		Code:          dbSubject.Code,
		ProfessorMail: dbSubject.ProfessorMail,
	}
}

func (dbUser *DatabaseUser) toUser() User {
	return User{
		ID:            dbUser.ID,
		Role:          dbUser.Role,
		Name:          dbUser.Name,
		Mail:          dbUser.Mail,
		Password:      dbUser.Password,
		PublicSshKeys: dbUser.PublicSshKeys,
	}
}

func NewDatabase() (Database, error) {
	if err := godotenv.Load(".backend.env"); err != nil {
		return nil, fmt.Errorf("error loading .env file: %w", err)
	}

	dbpool, err := pgxpool.New(context.Background(), os.Getenv("DATABASE_URL"))
	if err != nil {
		return nil, fmt.Errorf("error creating connection pool: %w", err)
	}

	if err := dbpool.Ping(context.Background()); err != nil {
		return nil, fmt.Errorf("error pinging database: %w", err)
	}

	fmt.Println("Connected to database")

	// Create tables if they don't exist
	ddlStatements := getDDLStatements()
	if _, err := dbpool.Exec(context.Background(), ddlStatements); err != nil {
		return nil, fmt.Errorf("error creating tables: %w", err)
	}

	// Insert default roles if they don't exist
	insertRolesSQL := getInsertRolesSQL()
	_, err = dbpool.Exec(context.Background(), insertRolesSQL)
	if err != nil {
		return nil, fmt.Errorf("error inserting default roles: %w", err)
	}

	return &PostgresDatabase{db: dbpool}, nil
}

func (postgres *PostgresDatabase) Close() {
	postgres.db.Close()
}

func getDDLStatements() string {
	return `
		CREATE TABLE IF NOT EXISTS roles (
			id SERIAL PRIMARY KEY,
			role VARCHAR(50) NOT NULL UNIQUE
		);

		CREATE TABLE IF NOT EXISTS users (
			id UUID PRIMARY KEY,
			role_id INTEGER NOT NULL REFERENCES roles(id),
			name VARCHAR(100) NOT NULL,
			mail VARCHAR(100) NOT NULL UNIQUE,
			password VARCHAR(100) NOT NULL,
			public_ssh_keys TEXT[] DEFAULT NULL
		);

		CREATE TABLE IF NOT EXISTS unverified_users (
			id UUID PRIMARY KEY,
			role_id INTEGER NOT NULL REFERENCES roles(id),
			name VARCHAR(100) NOT NULL,
			mail VARCHAR(100) NOT NULL UNIQUE,
			password VARCHAR(100) NOT NULL,
			verification_token UUID NOT NULL UNIQUE,
			created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
		);

		CREATE TABLE IF NOT EXISTS subjects (
			id UUID PRIMARY KEY,
			name VARCHAR(100) NOT NULL,
			code VARCHAR(50) NOT NULL UNIQUE,
			main_professor_id UUID NOT NULL REFERENCES users(id)
		);

		CREATE TABLE IF NOT EXISTS templates (
			id VARCHAR(100) NOT NULL,
			subject_id UUID NOT NULL REFERENCES subjects(id),
			description TEXT NOT NULL,
			size_mb INTEGER NOT NULL,
			vcpu_count INTEGER NOT NULL,
			vram_mb INTEGER NOT NULL,
			is_validated BOOLEAN NOT NULL DEFAULT FALSE,
			PRIMARY KEY (id, subject_id)
		);

		CREATE TABLE IF NOT EXISTS instances (
			id VARCHAR(100) PRIMARY KEY,
			user_id UUID NOT NULL REFERENCES users(id),
			subject_id UUID NOT NULL REFERENCES subjects(id),
			template_id VARCHAR(100),
			wg_private_key TEXT NOT NULL,
			wg_public_key TEXT NOT NULL,
			interface_ip TEXT NOT NULL,
			peer_public_key TEXT NOT NULL,
			peer_allowed_ips TEXT[] NOT NULL,
			peer_endpoint_port INTEGER NOT NULL,
			created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (template_id, subject_id) REFERENCES templates(id, subject_id) ON DELETE SET NULL
		);

		CREATE TABLE IF NOT EXISTS user_subjects (
			user_id UUID NOT NULL REFERENCES users(id),
			subject_id UUID NOT NULL REFERENCES subjects(id),
			PRIMARY KEY (user_id, subject_id)
		);
	`
}

func getInsertRolesSQL() string {
	return `
		INSERT INTO roles (role) VALUES
		('admin'),
		('professor'),
		('student')
		ON CONFLICT (role) DO NOTHING;
	`
}

func (postgres *PostgresDatabase) UpdateVerificationToken(email string, token uuid.UUID) error {
	query := `
	UPDATE unverified_users
	SET verification_token = @token
	WHERE mail = @mail`
	args := pgx.NamedArgs{
		"mail":  email,
		"token": token,
	}

	_, err := postgres.db.Exec(context.Background(), query, args)
	if err != nil {
		return fmt.Errorf("error updating verification token: %w", err)
	}

	return nil
}

func (postgres *PostgresDatabase) GetUserIdByEmail(userEmail string) (string, error) {
	query := "SELECT id FROM users WHERE mail = @mail"
	args := pgx.NamedArgs{"mail": userEmail}

	var userId string
	if err := postgres.db.QueryRow(context.Background(), query, args).Scan(&userId); err != nil {
		return "", fmt.Errorf("error getting user id: %w", err)
	}

	return userId, nil
}

func (postgres *PostgresDatabase) GetInstanceInfo(instanceId string) (InstanceInfo, error) {
	query := `
	SELECT i.user_id, i.subject_id, i.template_id, i.created_at, u.mail, s.name,
	       COALESCE(t.vcpu_count, 0), COALESCE(t.vram_mb, 0), COALESCE(t.size_mb, 0)
	FROM instances i
	LEFT JOIN users u ON i.user_id = u.id
	LEFT JOIN subjects s ON i.subject_id = s.id
	LEFT JOIN templates t ON i.template_id = t.id AND i.subject_id = t.subject_id
	WHERE i.id = $1`

	var info InstanceInfo
	if err := postgres.db.QueryRow(context.Background(), query, instanceId).Scan(
		&info.UserId,
		&info.SubjectId,
		&info.TemplateId,
		&info.CreatedAt,
		&info.UserMail,
		&info.SubjectName,
		&info.Template_vcpu_count,
		&info.Template_vram_mb,
		&info.Template_size_mb,
	); err != nil {
		return InstanceInfo{}, fmt.Errorf("error fetching instance info: %w", err)
	}

	return info, nil
}
