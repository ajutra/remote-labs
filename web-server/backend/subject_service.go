package main

import (
	"fmt"
	"net/http"

	"github.com/google/uuid"
)

type SubjectService interface {
	GetAllSubjects() ([]SubjectResponse, error)
	CreateSubject(request CreateSubjectRequest) (string, error)
	ListAllSubjectsByUserId(userId string) ([]SubjectResponse, error)
	EnrollUserInSubject(userEmail, subjectId string) error
	RemoveUserFromSubject(userEmail, subjectId string) error
	DeleteSubject(subjectId string) error
	GetSubjectById(subjectId string) (SubjectResponse, error)
}

type SubjService struct {
	db              Database
	instanceService InstanceService
}

func NewSubjectService(db Database, instanceService InstanceService) SubjectService {
	return &SubjService{
		db:              db,
		instanceService: instanceService,
	}
}

func (s *SubjService) CreateSubject(request CreateSubjectRequest) (string, error) {
	subject := request.toSubject()

	// Check if professor exists
	if err := s.db.UserExistsByMail(subject.ProfessorMail); err != nil {
		return "", err
	}

	subjectId, err := s.db.CreateSubject(subject)
	if err != nil {
		return "", err
	}

	return subjectId, nil
}

func (s *SubjService) ListAllSubjectsByUserId(userId string) ([]SubjectResponse, error) {
	// Check if user exists
	if err := s.db.UserExistsById(userId); err != nil {
		return nil, err
	}

	subjects, err := s.db.ListAllSubjectsByUserId(userId)
	if err != nil {
		return nil, err
	}

	var subjectsResponse []SubjectResponse
	for _, subject := range subjects {
		subjectsResponse = append(subjectsResponse, subject.toSubjectResponse())
	}

	return subjectsResponse, nil
}

func (s *SubjService) EnrollUserInSubject(userEmail, subjectId string) error {
	// Check if user exists
	if err := s.db.UserExistsByMail(userEmail); err != nil {
		return err
	}

	// Check if subject exists
	if err := s.db.SubjectExistsById(subjectId); err != nil {
		return err
	}

	return s.db.EnrollUserInSubject(userEmail, subjectId)
}

func (s *SubjService) RemoveUserFromSubject(userEmail, subjectId string) error {
	// Check if user exists
	if err := s.db.UserExistsByMail(userEmail); err != nil {
		return err
	}

	// Check if subject exists
	if err := s.db.SubjectExistsById(subjectId); err != nil {
		return err
	}

	return s.db.RemoveUserFromSubject(userEmail, subjectId)
}

func (s *SubjService) DeleteSubject(subjectId string) error {
	// Check if subject exists
	if err := s.db.SubjectExistsById(subjectId); err != nil {
		return err
	}

	// Check for associated instances
	instancesIds, err := s.db.ListAllInstancesBySubjectId(subjectId)
	if err != nil {
		return err
	}
	if len(instancesIds) > 0 {
		return NewHttpError(http.StatusBadRequest, fmt.Errorf("Cannot delete a subject with associated instances"))
	}

	// Check for associated templates
	templatesIds, err := s.db.ListAllTemplatesBySubjectId(subjectId)
	if err != nil {
		return err
	}
	if len(templatesIds) > 0 {
		return NewHttpError(http.StatusBadRequest, fmt.Errorf("Cannot delete a subject with associated templates"))
	}

	// Remove all users from the subject
	if err := s.db.DeleteAllUsersFromSubject(subjectId); err != nil {
		return err
	}

	// Delete the subject
	return s.db.DeleteSubject(subjectId)
}

func (s *SubjService) GetSubjectById(subjectId string) (SubjectResponse, error) {
	subject, err := s.db.GetSubjectById(subjectId)
	if err != nil {
		return SubjectResponse{}, err
	}

	return subject.toSubjectResponse(), nil
}

func (s *SubjService) GetAllSubjects() ([]SubjectResponse, error) {
	subjects, err := s.db.GetAllSubjects()
	if err != nil {
		return nil, err
	}

	var subjectsResponse []SubjectResponse
	for _, subject := range subjects {
		subjectsResponse = append(subjectsResponse, subject.toSubjectResponse())
	}

	return subjectsResponse, nil
}

func (createSubjReq *CreateSubjectRequest) toSubject() Subject {
	return Subject{
		ID:            uuid.New(),
		Name:          createSubjReq.Name,
		Code:          createSubjReq.Code,
		ProfessorMail: createSubjReq.MainProfessor,
	}
}

func (subject Subject) toSubjectResponse() SubjectResponse {
	return SubjectResponse(subject)
}
