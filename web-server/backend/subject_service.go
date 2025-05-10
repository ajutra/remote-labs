package main

import (
	"fmt"
	"net/http"

	"github.com/google/uuid"
)

type SubjectService interface {
	CreateSubject(request CreateSubjectRequest) (string, error)
	ListAllSubjectsByUserId(userId string) ([]SubjectResponse, error)
	EnrollUserInSubject(userEmail, subjectId string) error
	RemoveUserFromSubject(userEmail, subjectId string) error
	DeleteSubject(subjectId string) error
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

	//list all instancesIds of the subject
	instancesIds, err := s.db.ListAllInstancesBySubjectId(subjectId)
	if err != nil {
		return err
	}
	//stop all instances
	for _, instanceId := range instancesIds {
		if err := s.instanceService.StopInstance(instanceId); err != nil {
			return err
		}
	}

	//delete all instances
	for _, instanceId := range instancesIds {
		if err := s.instanceService.DeleteInstance(instanceId); err != nil {
			return err
		}
	}

	//list all templatesIds of the subject
	templatesIds, err := s.db.ListAllTemplatesBySubjectId(subjectId)
	if err != nil {
		return err
	}
	//delete all templates
	for _, templateId := range templatesIds {
		if err := s.instanceService.DeleteTemplate(templateId, subjectId); err != nil {
			return err
		}
	}

	//delete all users enrolled in the subject
	if err := s.db.DeleteAllUsersFromSubject(subjectId); err != nil {
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
