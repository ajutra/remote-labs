package main

import (
	"context"
	"fmt"
	"log"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Database interface {
	Close()
	VmExistsById(vmId string) (bool, error)
	VmExistsByDescription(description string) (bool, error)
	VmHasInstancesThatDependOnIt(vmId string) (bool, error)
	VmIsTemplate(vmId string) (bool, error)
	VmIsBase(vmId string) (bool, error)
	AddVm(vm Vm, isBase bool, isTemplate bool) error
	DeleteVm(vmId string) error
	GetBaseImages() ([]Vm, error)
	GetDescriptionById(vmId string) (string, error)
}

type PostgresDatabase struct {
	db *pgxpool.Pool
}

type DatabaseVM struct {
	ID          string
	Description *string
	IsBase      bool
	IsTemplate  bool
	DependsOn   *string
}

func (postgres *PostgresDatabase) VmExistsById(vmId string) (bool, error) {
	query := "SELECT EXISTS(SELECT 1 FROM vms WHERE id = @id)"
	args := pgx.NamedArgs{"id": vmId}

	var exists bool
	if err := postgres.db.QueryRow(context.Background(), query, args).Scan(&exists); err != nil {
		return false, fmt.Errorf("Error checking if VM exists by id: %v", err)
	}

	return exists, nil
}

func (postgres *PostgresDatabase) VmExistsByDescription(description string) (bool, error) {
	query := "SELECT EXISTS(SELECT 1 FROM vms WHERE description = @description)"
	args := pgx.NamedArgs{"description": description}

	var exists bool
	if err := postgres.db.QueryRow(context.Background(), query, args).Scan(&exists); err != nil {
		return false, fmt.Errorf("Error checking if VM exists by description: %v", err)
	}

	return exists, nil
}

func (postgres *PostgresDatabase) VmHasInstancesThatDependOnIt(vmId string) (bool, error) {
	query := "SELECT EXISTS(SELECT 1 FROM vms WHERE depends_on = @id)"
	args := pgx.NamedArgs{"id": vmId}

	var exists bool
	if err := postgres.db.QueryRow(context.Background(), query, args).Scan(&exists); err != nil {
		return false, fmt.Errorf("Error checking if VM has instances that depend on it: %v", err)
	}

	return exists, nil
}

func (postgres *PostgresDatabase) VmIsTemplate(vmId string) (bool, error) {
	query := "SELECT is_template FROM vms WHERE id = @id"
	args := pgx.NamedArgs{"id": vmId}

	var isTemplate bool
	if err := postgres.db.QueryRow(context.Background(), query, args).Scan(&isTemplate); err != nil {
		return false, fmt.Errorf("Error checking if VM is a template: %v", err)
	}

	return isTemplate, nil
}

func (postgres *PostgresDatabase) VmIsBase(vmId string) (bool, error) {
	query := "SELECT is_base FROM vms WHERE id = @id"
	args := pgx.NamedArgs{"id": vmId}

	var isBase bool
	if err := postgres.db.QueryRow(context.Background(), query, args).Scan(&isBase); err != nil {
		return false, fmt.Errorf("Error checking if VM is base: %v", err)
	}

	return isBase, nil
}

func (postgres *PostgresDatabase) AddVm(vm Vm, isBase bool, isTemplate bool) error {
	dbVm := postgres.toDatabaseVM(vm, isBase, isTemplate)

	query := `
		INSERT INTO vms (id, description, is_base, is_template, depends_on)
		VALUES (@id, @description, @is_base, @is_template, @depends_on)
	`
	args := pgx.NamedArgs{
		"id":          dbVm.ID,
		"description": dbVm.Description,
		"is_base":     dbVm.IsBase,
		"is_template": dbVm.IsTemplate,
		"depends_on":  dbVm.DependsOn,
	}

	if _, err := postgres.db.Exec(context.Background(), query, args); err != nil {
		return fmt.Errorf("Error adding VM to database: %v", err)
	}

	return nil
}

func (postgres *PostgresDatabase) DeleteVm(vmId string) error {
	query := "DELETE FROM vms WHERE id = @id"
	args := pgx.NamedArgs{"id": vmId}

	if _, err := postgres.db.Exec(context.Background(), query, args); err != nil {
		return fmt.Errorf("Error deleting VM: %v", err)
	}

	return nil
}

func (postgres *PostgresDatabase) GetBaseImages() ([]Vm, error) {
	query := "SELECT id, description FROM vms WHERE is_base = true"

	rows, err := postgres.db.Query(context.Background(), query)
	if err != nil {
		return nil, fmt.Errorf("Error getting base images: %v", err)
	}
	defer rows.Close()

	var baseImages []Vm
	for rows.Next() {
		var dbVm DatabaseVM
		if err := rows.Scan(&dbVm.ID, &dbVm.Description); err != nil {
			return nil, fmt.Errorf("Error getting base images: %v", err)
		}

		baseImages = append(baseImages, postgres.toVm(dbVm))
	}

	return baseImages, nil
}

func (postgres *PostgresDatabase) GetDescriptionById(vmId string) (string, error) {
	query := "SELECT description FROM vms WHERE id = @id"
	args := pgx.NamedArgs{"id": vmId}

	var description string
	if err := postgres.db.QueryRow(context.Background(), query, args).Scan(&description); err != nil {
		return "", fmt.Errorf("Error getting description by id: %v", err)
	}

	return description, nil
}

func (postgres *PostgresDatabase) toVm(dbVm DatabaseVM) Vm {
	return Vm{
		ID:          dbVm.ID,
		Description: dbVm.Description,
		DependsOn:   dbVm.DependsOn,
	}
}

func (postgres *PostgresDatabase) toDatabaseVM(vm Vm, isBase bool, isTemplate bool) DatabaseVM {
	return DatabaseVM{
		ID:          vm.ID,
		Description: vm.Description,
		IsBase:      isBase,
		IsTemplate:  isTemplate,
		DependsOn:   vm.DependsOn,
	}
}

func NewDatabase(databaseURL string) (Database, error) {
	dbpool, err := pgxpool.New(context.Background(), databaseURL)
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
			id TEXT PRIMARY KEY,
			description TEXT UNIQUE DEFAULT NULL,
			is_base BOOLEAN NOT NULL DEFAULT false,
			is_template BOOLEAN NOT NULL DEFAULT false,
			depends_on TEXT DEFAULT NULL,
			CONSTRAINT check_base_template CHECK (
				NOT (is_base = true AND is_template = true)
			),
			CONSTRAINT check_depends_on CHECK (
				NOT (is_base = true AND depends_on IS NOT NULL)
				AND NOT (is_template = true AND depends_on IS NOT NULL)
			)
		)
	`)
	if err != nil {
		return fmt.Errorf("Error creating vms table: %v", err)
	}

	return nil
}
