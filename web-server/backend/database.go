package main

import (
	"context"
	"fmt"
	"os"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
)

type Database interface {
	Close()
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
