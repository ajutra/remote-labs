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
	MainProfessor DatabaseUser
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

func (user *User) toDatabaseUser() DatabaseUser {
	return DatabaseUser{
		ID:       user.ID,
		Role:     user.Role,
		Name:     user.Name,
		Mail:     user.Mail,
		Password: user.Password,
	}
}

// This will be used in the future
/*func (dbUser *DatabaseUser) toUserResponse() UserResponse {
	return UserResponse{
		ID:   dbUser.ID,
		Name: dbUser.Name,
		Role: string(dbUser.Role),
		Mail: dbUser.Mail,
	}
}*/

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
