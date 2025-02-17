package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
)

type Database interface {
	Close()
	VmExistsByName(vmName string) (bool, error)
	AddVm(vmName string) error
	DeleteVm(vmName string) error
}

type PostgresDatabase struct {
	db *pgxpool.Pool
}

type DatabaseVM struct {
	ID   uint64
	Name string
}

func (postgres *PostgresDatabase) VmExistsByName(vmName string) (bool, error) {
	query := "SELECT EXISTS(SELECT 1 FROM vms WHERE name = @name)"
	args := pgx.NamedArgs{"name": vmName}

	var exists bool
	if err := postgres.db.QueryRow(context.Background(), query, args).Scan(&exists); err != nil {
		return false, fmt.Errorf("Error checking if VM exists by name: %v", err)
	}

	return exists, nil
}

func (postgres *PostgresDatabase) AddVm(vmName string) error {
	query := "INSERT INTO vms (name) VALUES (@name)"
	args := pgx.NamedArgs{"name": vmName}

	if _, err := postgres.db.Exec(context.Background(), query, args); err != nil {
		return fmt.Errorf("Error adding VM: %v", err)
	}

	return nil
}

func (postgres *PostgresDatabase) DeleteVm(vmName string) error {
	query := "DELETE FROM vms WHERE name = @name"
	args := pgx.NamedArgs{"name": vmName}

	if _, err := postgres.db.Exec(context.Background(), query, args); err != nil {
		return fmt.Errorf("Error deleting VM: %v", err)
	}

	return nil
}

func NewDatabase() (Database, error) {
	if err := godotenv.Load(".backend.env"); err != nil {
		return nil, fmt.Errorf("Error loading .env file: %v", err)
	}

	dbpool, err := pgxpool.New(context.Background(), os.Getenv("DATABASE_URL"))
	if err != nil {
		return nil, fmt.Errorf("Error creating database connection pool: %v", err)
	}

	if err := dbpool.Ping(context.Background()); err != nil {
		return nil, fmt.Errorf("Error pinging database: %v", err)
	}

	log.Printf("Connected to database")

	db := &PostgresDatabase{db: dbpool}

	if err := db.createTablesIfNotExist(); err != nil {
		return nil, err
	}

	return db, nil
}

func (postgres *PostgresDatabase) Close() {
	postgres.db.Close()
}

func (postgres *PostgresDatabase) createTablesIfNotExist() error {
	_, err := postgres.db.Exec(context.Background(), `
		CREATE TABLE IF NOT EXISTS vms (
			id BIGSERIAL PRIMARY KEY,
			name TEXT NOT NULL UNIQUE
		)
	`)
	if err != nil {
		return fmt.Errorf("Error creating vms table: %v", err)
	}

	return nil
}
