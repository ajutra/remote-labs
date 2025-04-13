package main

import (
	"fmt"
	"log"
	"net/smtp"
	"os"
)

type EmailService interface {
	SendEmail(to, subject, body string) error
}

type SMTPEmailService struct {
	from     string
	password string
	smtpHost string
	smtpPort string
}

func NewEmailService() EmailService {
	return &SMTPEmailService{
		from:     os.Getenv("SMTP_FROM"),
		password: os.Getenv("SMTP_PASSWORD"),
		smtpHost: os.Getenv("SMTP_HOST"),
		smtpPort: os.Getenv("SMTP_PORT"),
	}
}

func (s *SMTPEmailService) SendEmail(to, subject, body string) error {
	// Configurar la autenticación
	auth := smtp.PlainAuth("", s.from, s.password, s.smtpHost)

	// Construir el mensaje
	message := []byte(fmt.Sprintf("From: %s\r\n"+
		"To: %s\r\n"+
		"Subject: %s\r\n"+
		"MIME-Version: 1.0\r\n"+
		"Content-Type: text/plain; charset=UTF-8\r\n"+
		"\r\n"+
		"%s", s.from, to, subject, body))

	// Enviar el correo
	err := smtp.SendMail(
		fmt.Sprintf("%s:%s", s.smtpHost, s.smtpPort),
		auth,
		s.from,
		[]string{to},
		message,
	)
	if err != nil {
		return fmt.Errorf("error sending email: %w", err)
	}

	log.Printf("Email sent successfully to %s", to)
	return nil
}
