package main

import (
	"context"
	"fmt"
	"os"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
)

type Database interface {
	Close()
	CreateUser(user User) error
	UserExistsByMail(mail string) error
	CreateSubject(subject Subject) error
	UserExistsById(userId string) error
	ListAllSubjectsByUserId(userId string) ([]Subject, error)
	ListAllUsersBySubjectId(subjectId string) ([]User, error)
	ValidateUser(mail, password string) (User, error)
	GetUser(userId string) (User, error)
	SubjectExistsById(subjectId string) error
	EnrollUserInSubject(userId, subjectId string) error
	IsMainProfessorOfSubject(userId, subjectId string) bool
	RemoveUserFromSubject(userId, subjectId string) error
	DeleteSubject(subjectId string) error
}

type PostgresDatabase struct {
	db *pgxpool.Pool
}

type DatabaseUser struct {
	ID       uuid.UUID
	Role     Role
	Name     string
	Mail     string
	Password string
}

type DatabaseSubject struct {
	ID            uuid.UUID
	Name          string
	Code          string
	ProfessorMail string
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

func (postgres *PostgresDatabase) UserExistsByMail(mail string) error {
	query := "SELECT EXISTS(SELECT 1 FROM users WHERE mail = @mail)"
	args := pgx.NamedArgs{"mail": mail}

	var exists bool
	if err := postgres.db.QueryRow(context.Background(), query, args).Scan(&exists); err != nil {
		return fmt.Errorf("user with mail %s does not exist: %w", mail, err)
	}

	return nil
}

func (postgres *PostgresDatabase) CreateSubject(subject Subject) error {
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
		return fmt.Errorf("error creating subject: %w", err)
	}

	return nil
}

func (postgres *PostgresDatabase) UserExistsById(userId string) error {
	query := "SELECT EXISTS(SELECT 1 FROM users WHERE id = @id)"
	args := pgx.NamedArgs{"id": userId}

	var exists bool
	if err := postgres.db.QueryRow(context.Background(), query, args).Scan(&exists); err != nil {
		return fmt.Errorf("user with id %s does not exist: %w", userId, err)
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

	return subjects, nil
}

func (postgres *PostgresDatabase) ListAllUsersBySubjectId(subjectId string) ([]User, error) {
	query := `
	SELECT u.id, u.role_id, u.name, u.mail, u.password
	FROM users u
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

	return users, nil
}

func (postgres *PostgresDatabase) ValidateUser(mail, password string) (User, error) {
	query := `
	SELECT u.id, r.role, u.name, u.mail, u.password
	FROM users u
	JOIN roles r ON u.role_id = r.id
	WHERE u.mail = @mail AND u.password = @password`
	args := pgx.NamedArgs{"mail": mail, "password": password}

	var dbUser DatabaseUser
	if err := postgres.db.QueryRow(context.Background(), query, args).Scan(&dbUser.ID, &dbUser.Role, &dbUser.Name, &dbUser.Mail, &dbUser.Password); err != nil {
		return User{}, fmt.Errorf("error validating user: %w", err)
	}

	return dbUser.toUser(), nil
}

func (postgres *PostgresDatabase) GetUser(userId string) (User, error) {
	query := `
	SELECT u.id, r.role, u.name, u.mail, u.password
	FROM users u
	JOIN roles r ON u.role_id = r.id
	WHERE u.id = @id`
	args := pgx.NamedArgs{"id": userId}

	var dbUser DatabaseUser
	if err := postgres.db.QueryRow(context.Background(), query, args).Scan(&dbUser.ID, &dbUser.Role, &dbUser.Name, &dbUser.Mail, &dbUser.Password); err != nil {
		return User{}, fmt.Errorf("error getting user: %w", err)
	}

	return dbUser.toUser(), nil
}

func (postgres *PostgresDatabase) SubjectExistsById(subjectId string) error {
	query := "SELECT EXISTS(SELECT 1 FROM subjects WHERE id = @id)"
	args := pgx.NamedArgs{"id": subjectId}

	var exists bool
	if err := postgres.db.QueryRow(context.Background(), query, args).Scan(&exists); err != nil {
		return fmt.Errorf("subject with id %s does not exist: %w", subjectId, err)
	}

	return nil
}

func (postgres *PostgresDatabase) EnrollUserInSubject(userId, subjectId string) error {
	query := `
	INSERT INTO user_subjects (user_id, subject_id)
	VALUES (@user_id, @subject_id)`
	args := pgx.NamedArgs{"user_id": userId, "subject_id": subjectId}

	_, err := postgres.db.Exec(context.Background(), query, args)
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

func (postgres *PostgresDatabase) RemoveUserFromSubject(userId, subjectId string) error {
	query := `
	DELETE FROM user_subjects
	WHERE user_id = @user_id AND subject_id = @subject_id`
	args := pgx.NamedArgs{"user_id": userId, "subject_id": subjectId}

	_, err := postgres.db.Exec(context.Background(), query, args)
	if err != nil {
		return fmt.Errorf("error removing user from subject: %w", err)
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

func (user *User) toDatabaseUser() DatabaseUser {
	return DatabaseUser{
		ID:       user.ID,
		Role:     user.Role,
		Name:     user.Name,
		Mail:     user.Mail,
		Password: user.Password,
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
		ID:       dbUser.ID,
		Role:     dbUser.Role,
		Name:     dbUser.Name,
		Mail:     dbUser.Mail,
		Password: dbUser.Password,
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
        role_id INTEGER NOT NULL,
        name VARCHAR(100) NOT NULL,
        mail VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(100) NOT NULL,
        FOREIGN KEY (role_id) REFERENCES roles(id)
    );

    CREATE TABLE IF NOT EXISTS subjects (
        id UUID PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        code VARCHAR(50) NOT NULL UNIQUE,
        main_professor_id UUID,
        FOREIGN KEY (main_professor_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS user_subjects (
        user_id UUID NOT NULL,
        subject_id UUID NOT NULL,
        PRIMARY KEY (user_id, subject_id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (subject_id) REFERENCES subjects(id)
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
