package main

import (
	"fmt"
	"net/http"

	"github.com/google/uuid"
)

type SubjectService interface {
	CreateSubject(request CreateSubjectRequest) error
	ListAllSubjectsByUserId(userId string) ([]SubjectResponse, error)
	EnrollUserInSubject(userId, subjectId string) error
	RemoveUserFromSubject(userId, subjectId string) error
	DeleteSubject(subjectId string) error
}

type SubjService struct {
	db Database
}

func NewSubjectService(db Database) SubjectService {
	return &SubjService{
		db: db,
	}
}

func (s *SubjService) CreateSubject(request CreateSubjectRequest) error {
	subject := request.toSubject()

	// Check if professor exists
	if err := s.db.UserExistsByMail(subject.ProfessorMail); err != nil {
		return err
	}

	return s.db.CreateSubject(subject)
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

func (s *SubjService) EnrollUserInSubject(userId, subjectId string) error {
	// Check if user exists
	if err := s.db.UserExistsById(userId); err != nil {
		return err
	}

	// Check if subject exists
	if err := s.db.SubjectExistsById(subjectId); err != nil {
		return err
	}

	return s.db.EnrollUserInSubject(userId, subjectId)
}

func (s *SubjService) RemoveUserFromSubject(userId, subjectId string) error {
	// Check if user exists
	if err := s.db.UserExistsById(userId); err != nil {
		return err
	}

	// Check if subject exists
	if err := s.db.SubjectExistsById(subjectId); err != nil {
		return err
	}

	// Check if user is main professor of the subject
	if s.db.IsMainProfessorOfSubject(userId, subjectId) {
		return NewHttpError(http.StatusBadRequest, fmt.Errorf("main professor cannot be removed from subject"))
	}

	return s.db.RemoveUserFromSubject(userId, subjectId)
}

func (s *SubjService) DeleteSubject(subjectId string) error {
	// Check if subject exists
	if err := s.db.SubjectExistsById(subjectId); err != nil {
		return err
	}

	// Check if there are users enrolled in the subject
	// An error means there are no users enrolled in the subject
	if _, err := s.db.ListAllUsersBySubjectId(subjectId); err != nil {
		return s.db.DeleteSubject(subjectId)
	}

	return NewHttpError(http.StatusBadRequest, fmt.Errorf("cannot delete subject with users enrolled"))
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
