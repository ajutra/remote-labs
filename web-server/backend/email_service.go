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
	username string
	password string
	smtpHost string
	smtpPort string
}

func NewEmailService() EmailService {
	return &SMTPEmailService{
		from:     os.Getenv("SMTP_FROM"),
		username: os.Getenv("SMTP_USERNAME"),
		password: os.Getenv("SMTP_PASSWORD"),
		smtpHost: os.Getenv("SMTP_HOST"),
		smtpPort: os.Getenv("SMTP_PORT"),
	}
}

func (s *SMTPEmailService) SendEmail(to, subject, body string) error {
	// Configurar la autenticación
	auth := smtp.PlainAuth("", s.username, s.password, s.smtpHost)

	// Plantilla HTML para el correo
	htmlTemplate := `
	<!DOCTYPE html>
	<html>
	<head>
		<meta charset="UTF-8">
		<style>
			body {
				font-family: Arial, sans-serif;
				line-height: 1.6;
				color: #333333;
				margin: 0;
				padding: 0;
			}
			.container {
				max-width: 600px;
				margin: 0 auto;
				padding: 20px;
			}
			.header {
				background-color: #FFD700;
				color: white;
				padding: 20px;
				text-align: center;
				border-radius: 8px 8px 0 0;
			}
			.header h1 {
				margin: 0;
				display: flex;
				align-items: center;
				justify-content: center;
				gap: 10px;
			}
			.content {
				background-color: #ffffff;
				padding: 20px;
				border: 1px solid #e0e0e0;
				border-radius: 0 0 8px 8px;
			}
			.footer {
				text-align: center;
				padding: 20px;
				color: #666666;
				font-size: 12px;
			}
		</style>
	</head>
	<body>
		<div class="container">
			<div class="header">
				<h1>
					<span>💻</span>
					Remote Labs
				</h1>
			</div>
			<div class="content">
				%s
			</div>
			<div class="footer">
				<p>© 2025 Remote Labs - TecnoCampus</p>
				<p>This is an automated email, please do not reply to this message.</p>
			</div>
		</div>
	</body>
	</html>`

	// Convertir el cuerpo del mensaje a HTML
	htmlBody := fmt.Sprintf(htmlTemplate, body)

	// Construir el mensaje con formato HTML
	message := []byte(fmt.Sprintf("From: %s\r\n"+
		"To: %s\r\n"+
		"Subject: %s\r\n"+
		"MIME-Version: 1.0\r\n"+
		"Content-Type: text/html; charset=UTF-8\r\n"+
		"\r\n"+
		"%s", s.from, to, subject, htmlBody))

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
