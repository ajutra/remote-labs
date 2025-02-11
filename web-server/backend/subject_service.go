package main

import (
	"net/http"

	"github.com/google/uuid"
)

type SubjectService interface {
	CreateSubject(request CreateSubjectRequest) error
	ListAllSubjectsByUserId(userId string) ([]SubjectResponse, error)
	EnrollUserInSubject(userId, subjectId string) error
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
		return NewHttpError(http.StatusBadRequest, err)
	}

	return s.db.CreateSubject(subject)
}

func (s *SubjService) ListAllSubjectsByUserId(userId string) ([]SubjectResponse, error) {
	// Check if user exists
	if err := s.db.UserExistsById(userId); err != nil {
		return nil, NewHttpError(http.StatusBadRequest, err)
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
		return NewHttpError(http.StatusBadRequest, err)
	}

	// Check if subject exists
	if err := s.db.SubjectExistsById(subjectId); err != nil {
		return NewHttpError(http.StatusBadRequest, err)
	}

	return s.db.EnrollUserInSubject(userId, subjectId)
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
