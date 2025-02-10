package main

import (
	"net/http"

	"github.com/google/uuid"
)

type SubjectService interface {
	CreateSubject(request CreateSubjectRequest) error
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

func (createSubjReq *CreateSubjectRequest) toSubject() Subject {
	return Subject{
		ID:            uuid.New(),
		Name:          createSubjReq.Name,
		Code:          createSubjReq.Code,
		ProfessorMail: createSubjReq.MainProfessor,
	}
}
