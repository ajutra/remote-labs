package main

import (
	"context"
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
	DeleteBaseImagesNotInList(baseImages []string) error
	SubjectExistsById(subjectId string) (bool, error)
	GetSubjectVlan(subjectId string) (int, error)
	GetAllVlans() ([]int, error)
	AddSubject(subject Subject) error
	GetVmsVlanIdentifiers(vlan int) ([]int, error)
	GetVlanByVmId(vmId string) (int, error)
	GetVmVlanIdentifierByVmId(vmId string) (int, error)
	VmIsLastInstanceInSubject(vmId string) (bool, error)
	GetSubjectIdByVmId(vmId string) (string, error)
	DeleteSubject(subjectId string) error
	GetAllVmIds() ([]string, error)
}

type PostgresDatabase struct {
	db *pgxpool.Pool
}

type DatabaseVM struct {
	ID               string
	Description      *string
	IsBase           bool
	IsTemplate       bool
	DependsOn        *string
	SubjectId        *string
	VmVlanIdentifier *int
}

type DatabaseSubject struct {
	SubjectId string
	Vlan      int
}

func (postgres *PostgresDatabase) VmExistsById(vmId string) (bool, error) {
	query := "SELECT EXISTS(SELECT 1 FROM vms WHERE id = @id)"
	args := pgx.NamedArgs{"id": vmId}

	var exists bool
	if err := postgres.db.QueryRow(context.Background(), query, args).Scan(&exists); err != nil {
		return false, logAndReturnError("Error checking if VM exists by id: ", err.Error())
	}

	return exists, nil
}

func (postgres *PostgresDatabase) VmExistsByDescription(description string) (bool, error) {
	query := "SELECT EXISTS(SELECT 1 FROM vms WHERE description = @description)"
	args := pgx.NamedArgs{"description": description}

	var exists bool
	if err := postgres.db.QueryRow(context.Background(), query, args).Scan(&exists); err != nil {
		return false, logAndReturnError("Error checking if VM exists by description: ", err.Error())
	}

	return exists, nil
}

func (postgres *PostgresDatabase) VmHasInstancesThatDependOnIt(vmId string) (bool, error) {
	query := "SELECT EXISTS(SELECT 1 FROM vms WHERE depends_on = @id)"
	args := pgx.NamedArgs{"id": vmId}

	var exists bool
	if err := postgres.db.QueryRow(context.Background(), query, args).Scan(&exists); err != nil {
		return false, logAndReturnError("Error checking if VM has instances that depend on it: ", err.Error())
	}

	return exists, nil
}

func (postgres *PostgresDatabase) VmIsTemplate(vmId string) (bool, error) {
	query := "SELECT is_template FROM vms WHERE id = @id"
	args := pgx.NamedArgs{"id": vmId}

	var isTemplate bool
	if err := postgres.db.QueryRow(context.Background(), query, args).Scan(&isTemplate); err != nil {
		return false, logAndReturnError("Error checking if VM is a template: ", err.Error())
	}

	return isTemplate, nil
}

func (postgres *PostgresDatabase) VmIsBase(vmId string) (bool, error) {
	query := "SELECT is_base FROM vms WHERE id = @id"
	args := pgx.NamedArgs{"id": vmId}

	var isBase bool
	if err := postgres.db.QueryRow(context.Background(), query, args).Scan(&isBase); err != nil {
		return false, logAndReturnError("Error checking if VM is base: ", err.Error())
	}

	return isBase, nil
}

func (postgres *PostgresDatabase) AddVm(vm Vm, isBase bool, isTemplate bool) error {
	dbVm := vm.toDatabaseVM(isBase, isTemplate)

	query := `
		INSERT INTO vms (id, description, is_base, is_template, depends_on, subject_id, vm_vlan_identifier)
		VALUES (@id, @description, @is_base, @is_template, @depends_on, @subject_id, @vm_vlan_identifier)
	`
	args := pgx.NamedArgs{
		"id":                 dbVm.ID,
		"description":        dbVm.Description,
		"is_base":            dbVm.IsBase,
		"is_template":        dbVm.IsTemplate,
		"depends_on":         dbVm.DependsOn,
		"subject_id":         dbVm.SubjectId,
		"vm_vlan_identifier": dbVm.VmVlanIdentifier,
	}

	if _, err := postgres.db.Exec(context.Background(), query, args); err != nil {
		return logAndReturnError("Error adding VM to database: ", err.Error())
	}

	return nil
}

func (postgres *PostgresDatabase) DeleteVm(vmId string) error {
	query := "DELETE FROM vms WHERE id = @id"
	args := pgx.NamedArgs{"id": vmId}

	if _, err := postgres.db.Exec(context.Background(), query, args); err != nil {
		return logAndReturnError("Error deleting VM: ", err.Error())
	}

	return nil
}

func (postgres *PostgresDatabase) GetBaseImages() ([]Vm, error) {
	query := "SELECT id, description FROM vms WHERE is_base = true"

	rows, err := postgres.db.Query(context.Background(), query)
	if err != nil {
		return nil, logAndReturnError("Error getting base images: ", err.Error())
	}
	defer rows.Close()

	var baseImages []Vm
	for rows.Next() {
		var dbVm DatabaseVM
		if err := rows.Scan(&dbVm.ID, &dbVm.Description); err != nil {
			return nil, logAndReturnError("Error getting base images: ", err.Error())
		}

		baseImages = append(baseImages, dbVm.toVm())
	}

	return baseImages, nil
}

func (postgres *PostgresDatabase) GetDescriptionById(vmId string) (string, error) {
	query := "SELECT description FROM vms WHERE id = @id"
	args := pgx.NamedArgs{"id": vmId}

	var description string
	if err := postgres.db.QueryRow(context.Background(), query, args).Scan(&description); err != nil {
		return "", logAndReturnError("Error getting description by id: ", err.Error())
	}

	return description, nil
}

func (postgres *PostgresDatabase) DeleteBaseImagesNotInList(baseImages []string) error {
	//Get all base images from the database
	query := "SELECT description FROM vms WHERE is_base = true"
	rows, err := postgres.db.Query(context.Background(), query)
	if err != nil {
		return logAndReturnError("Error getting base images: ", err.Error())
	}
	defer rows.Close()

	for rows.Next() {
		var dbVm DatabaseVM
		if err := rows.Scan(&dbVm.Description); err != nil {
			return logAndReturnError("Error getting base images: ", err.Error())
		}

		found := false
		for _, baseImage := range baseImages {
			if *dbVm.Description == baseImage {
				found = true
				break
			}
		}

		if !found {
			query := "DELETE FROM vms WHERE is_base = true AND description = @description"
			args := pgx.NamedArgs{"description": *dbVm.Description}

			if _, err := postgres.db.Exec(context.Background(), query, args); err != nil {
				return logAndReturnError("Error deleting base images not in list: ", err.Error())
			}
		}
	}

	return nil
}

func (postgres *PostgresDatabase) SubjectExistsById(subjectId string) (bool, error) {
	query := "SELECT EXISTS(SELECT 1 FROM subjects WHERE subject_id = @subject_id)"
	args := pgx.NamedArgs{"subject_id": subjectId}

	var exists bool
	if err := postgres.db.QueryRow(context.Background(), query, args).Scan(&exists); err != nil {
		return false, logAndReturnError("Error checking if subject exists: ", err.Error())
	}

	return exists, nil
}

func (postgres *PostgresDatabase) GetSubjectVlan(subjectId string) (int, error) {
	query := "SELECT vlan FROM subjects WHERE subject_id = @subject_id"
	args := pgx.NamedArgs{"subject_id": subjectId}

	var vlan int
	if err := postgres.db.QueryRow(context.Background(), query, args).Scan(&vlan); err != nil {
		return 0, logAndReturnError("Error getting subject vlan: ", err.Error())
	}

	return vlan, nil
}

func (postgres *PostgresDatabase) GetAllVlans() ([]int, error) {
	query := "SELECT vlan FROM subjects"
	rows, err := postgres.db.Query(context.Background(), query)
	if err != nil {
		return nil, logAndReturnError("Error getting all vlans: ", err.Error())
	}
	defer rows.Close()

	var vlans []int
	for rows.Next() {
		var vlan int
		if err := rows.Scan(&vlan); err != nil {
			return nil, logAndReturnError("Error getting all vlans: ", err.Error())
		}
		vlans = append(vlans, vlan)
	}

	return vlans, nil
}

func (postgres *PostgresDatabase) AddSubject(subject Subject) error {
	dbSubject := subject.toDatabaseSubject()
	query := `
		INSERT INTO subjects (subject_id, vlan)
		VALUES (@subject_id, @vlan)
	`
	args := pgx.NamedArgs{
		"subject_id": dbSubject.SubjectId,
		"vlan":       dbSubject.Vlan,
	}

	if _, err := postgres.db.Exec(context.Background(), query, args); err != nil {
		return logAndReturnError("Error adding subject: ", err.Error())
	}

	return nil
}

func (postgres *PostgresDatabase) GetVmsVlanIdentifiers(vlan int) ([]int, error) {
	query := "SELECT subject_id FROM subjects WHERE vlan = @vlan"
	args := pgx.NamedArgs{"vlan": vlan}

	var subjectId string
	if err := postgres.db.QueryRow(context.Background(), query, args).Scan(&subjectId); err != nil {
		return nil, logAndReturnError("Error getting vms vlan identifiers: ", err.Error())
	}

	query = "SELECT vm_vlan_identifier FROM vms WHERE subject_id = @subject_id"
	args = pgx.NamedArgs{"subject_id": subjectId}

	rows, err := postgres.db.Query(context.Background(), query, args)
	if err != nil {
		return nil, logAndReturnError("Error getting vms vlan identifiers: ", err.Error())
	}
	defer rows.Close()

	var vmsVlanIdentifiers []int
	for rows.Next() {
		var vmVlanIdentifier int
		if err := rows.Scan(&vmVlanIdentifier); err != nil {
			return nil, logAndReturnError("Error getting vms vlan identifiers: ", err.Error())
		}
		vmsVlanIdentifiers = append(vmsVlanIdentifiers, vmVlanIdentifier)
	}

	return vmsVlanIdentifiers, nil
}

func (postgres *PostgresDatabase) GetVlanByVmId(vmId string) (int, error) {
	var query string
	var args pgx.NamedArgs

	query = "SELECT subject_id FROM vms WHERE id = @id"
	args = pgx.NamedArgs{"id": vmId}

	var subjectId string
	if err := postgres.db.QueryRow(context.Background(), query, args).Scan(&subjectId); err != nil {
		return 0, logAndReturnError("Error getting vlan by vm id: ", err.Error())
	}

	query = "SELECT vlan FROM subjects WHERE subject_id = @subject_id"
	args = pgx.NamedArgs{"subject_id": subjectId}

	var vlan int
	if err := postgres.db.QueryRow(context.Background(), query, args).Scan(&vlan); err != nil {
		return 0, logAndReturnError("Error getting vlan by vm id: ", err.Error())
	}

	return vlan, nil
}

func (postgres *PostgresDatabase) GetVmVlanIdentifierByVmId(vmId string) (int, error) {
	query := "SELECT vm_vlan_identifier FROM vms WHERE id = @id"
	args := pgx.NamedArgs{"id": vmId}

	var vmVlanIdentifier int
	if err := postgres.db.QueryRow(context.Background(), query, args).Scan(&vmVlanIdentifier); err != nil {
		return 0, logAndReturnError("Error getting vm vlan identifier by vm id: ", err.Error())
	}

	return vmVlanIdentifier, nil
}

func (postgres *PostgresDatabase) VmIsLastInstanceInSubject(vmId string) (bool, error) {
	var query string
	var args pgx.NamedArgs

	query = "SELECT subject_id FROM vms WHERE id = @id"
	args = pgx.NamedArgs{"id": vmId}

	var subjectId string
	if err := postgres.db.QueryRow(context.Background(), query, args).Scan(&subjectId); err != nil {
		return false, logAndReturnError("Error getting subject id: ", err.Error())
	}

	query = "SELECT COUNT(*) FROM vms WHERE subject_id = @subject_id"
	args = pgx.NamedArgs{"subject_id": subjectId}

	var count int
	if err := postgres.db.QueryRow(context.Background(), query, args).Scan(&count); err != nil {
		return false, logAndReturnError("Error getting count of vms in subject: ", err.Error())
	}

	return count == 1, nil
}

func (postgres *PostgresDatabase) GetSubjectIdByVmId(vmId string) (string, error) {
	query := "SELECT subject_id FROM vms WHERE id = @id"
	args := pgx.NamedArgs{"id": vmId}

	var subjectId string
	if err := postgres.db.QueryRow(context.Background(), query, args).Scan(&subjectId); err != nil {
		return "", logAndReturnError("Error getting subject id by vm id: ", err.Error())
	}

	return subjectId, nil
}

func (postgres *PostgresDatabase) DeleteSubject(subjectId string) error {
	query := "DELETE FROM subjects WHERE subject_id = @subject_id"
	args := pgx.NamedArgs{"subject_id": subjectId}

	if _, err := postgres.db.Exec(context.Background(), query, args); err != nil {
		return logAndReturnError("Error deleting subject: ", err.Error())
	}

	return nil
}

func (postgres *PostgresDatabase) GetAllVmIds() ([]string, error) {
	query := "SELECT id FROM vms WHERE is_base = false"
	rows, err := postgres.db.Query(context.Background(), query)
	if err != nil {
		return nil, logAndReturnError("Error getting all vm ids: ", err.Error())
	}
	defer rows.Close()

	var vmIds []string
	for rows.Next() {
		var vmId string
		if err := rows.Scan(&vmId); err != nil {
			return nil, logAndReturnError("Error getting all vm ids: ", err.Error())
		}
		vmIds = append(vmIds, vmId)
	}

	return vmIds, nil
}

func (dbVm *DatabaseVM) toVm() Vm {
	return Vm{
		ID:               dbVm.ID,
		Description:      dbVm.Description,
		DependsOn:        dbVm.DependsOn,
		SubjectId:        dbVm.SubjectId,
		VmVlanIdentifier: dbVm.VmVlanIdentifier,
	}
}

func (vm *Vm) toDatabaseVM(isBase bool, isTemplate bool) DatabaseVM {
	return DatabaseVM{
		ID:               vm.ID,
		Description:      vm.Description,
		IsBase:           isBase,
		IsTemplate:       isTemplate,
		DependsOn:        vm.DependsOn,
		SubjectId:        vm.SubjectId,
		VmVlanIdentifier: vm.VmVlanIdentifier,
	}
}

func (dbSubject *DatabaseSubject) toSubject() Subject {
	return Subject{
		SubjectId: dbSubject.SubjectId,
		Vlan:      dbSubject.Vlan,
	}
}

func (subject *Subject) toDatabaseSubject() DatabaseSubject {
	return DatabaseSubject{
		SubjectId: subject.SubjectId,
		Vlan:      subject.Vlan,
	}
}

func NewDatabase(databaseURL string) (Database, error) {
	dbpool, err := pgxpool.New(context.Background(), databaseURL)
	if err != nil {
		return nil, logAndReturnError("Error creating database connection pool: ", err.Error())
	}

	if err := dbpool.Ping(context.Background()); err != nil {
		return nil, logAndReturnError("Error pinging database: ", err.Error())
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
		CREATE TABLE IF NOT EXISTS subjects (
			subject_id TEXT PRIMARY KEY,
			vlan INTEGER NOT NULL,
			UNIQUE(subject_id),
			UNIQUE(vlan)
		)
	`)
	if err != nil {
		return logAndReturnError("Error creating subjects table: ", err.Error())
	}

	_, err = postgres.db.Exec(context.Background(), `
		CREATE TABLE IF NOT EXISTS vms (
			id TEXT PRIMARY KEY,
			description TEXT UNIQUE DEFAULT NULL,
			is_base BOOLEAN NOT NULL DEFAULT false,
			is_template BOOLEAN NOT NULL DEFAULT false,
			depends_on TEXT DEFAULT NULL,
			subject_id TEXT DEFAULT NULL,
			vm_vlan_identifier INTEGER DEFAULT NULL,
			CONSTRAINT check_base_template CHECK (
				NOT (is_base = true AND is_template = true)
			),
			CONSTRAINT check_depends_on CHECK (
				NOT (is_base = true AND depends_on IS NOT NULL)
				AND NOT (is_template = true AND depends_on IS NOT NULL)
			),
			CONSTRAINT check_subject_relation CHECK (
				NOT (is_base = true AND subject_id IS NOT NULL)
				AND NOT (is_template = true AND subject_id IS NOT NULL)
				AND NOT (is_base = false AND is_template = false AND subject_id IS NULL)
			),
			CONSTRAINT check_vm_vlan_identifier CHECK (
				(subject_id IS NULL AND vm_vlan_identifier IS NULL)
				OR (subject_id IS NOT NULL AND vm_vlan_identifier IS NOT NULL)
			),
			CONSTRAINT fk_subject FOREIGN KEY (subject_id)
				REFERENCES subjects(subject_id)
				ON DELETE RESTRICT,
			CONSTRAINT unique_vm_vlan_identifier_per_vlan UNIQUE (subject_id, vm_vlan_identifier)
		)
	`)
	if err != nil {
		return logAndReturnError("Error creating vms table: ", err.Error())
	}

	return nil
}
