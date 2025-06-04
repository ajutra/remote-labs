package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"sync"
	"time"

	"github.com/google/uuid"
)

// getSpainTime returns the current time in Spain's timezone (GMT+2)
func getSpainTime() time.Time {
	loc, err := time.LoadLocation("Europe/Madrid")
	if err != nil {
		log.Printf("Error loading timezone: %v, falling back to UTC+2", err)
		return time.Now().UTC().Add(2 * time.Hour)
	}
	return time.Now().In(loc)
}

// formatTimeForDisplay formats a time.Time to a user-friendly string in Spain's timezone
func formatTimeForDisplay(t time.Time) string {
	loc, err := time.LoadLocation("Europe/Madrid")
	if err != nil {
		log.Printf("Error loading timezone: %v, falling back to UTC+2", err)
		return t.UTC().Add(2 * time.Hour).Format("15:04")
	}
	return t.In(loc).Format("15:04")
}

type SessionManager interface {
	StartSession(instanceId string) error
	StopSession(instanceId string) error
	RenewSession(instanceId string) error
}

type SessionEvent struct {
	EndTime time.Time
	Token   string
}

type SessionManagerImpl struct {
	db               Database
	emailService     EmailService
	vmManagerBaseUrl string
	scheduledEvents  map[string]*SessionEvent
	eventsMutex      sync.Mutex
	stopChan         chan struct{}
}

func NewSessionManager(db Database, emailService EmailService, vmManagerBaseUrl string) SessionManager {
	manager := &SessionManagerImpl{
		db:               db,
		emailService:     emailService,
		vmManagerBaseUrl: vmManagerBaseUrl,
		scheduledEvents:  make(map[string]*SessionEvent),
		stopChan:         make(chan struct{}),
	}

	// Start the session monitor
	go manager.monitorSessions()

	return manager
}

func (s *SessionManagerImpl) monitorSessions() {
	ticker := time.NewTicker(10 * time.Second)
	defer ticker.Stop()

	log.Printf("[SessionMonitor] Starting session monitor")
	for {
		select {
		case <-ticker.C:
			s.eventsMutex.Lock()
			now := getSpainTime()

			// Check all sessions
			for instanceId, event := range s.scheduledEvents {
				// Check if we need to send a reminder (less than 30 minutes before end)
				timeUntilEnd := event.EndTime.Sub(now)
				if timeUntilEnd > 0 && timeUntilEnd <= 30*time.Minute {
					// Get user email and reminder status
					query := `
					SELECT u.mail, i.session_reminder_sent
					FROM instances i
					JOIN users u ON i.user_id = u.id
					WHERE i.id = $1`

					var userEmail string
					var reminderSent bool
					err := s.db.(*PostgresDatabase).db.QueryRow(context.Background(), query, instanceId).Scan(&userEmail, &reminderSent)
					if err != nil {
						log.Printf("[SessionMonitor] Error getting user email: %v", err)
						continue
					}

					if !reminderSent {
						renewalLink := fmt.Sprintf("%s/renew-session?token=%s", os.Getenv("FRONTEND_URL"), event.Token)
						emailBody := fmt.Sprintf("Your session will end at %s. To renew your session, click here: %s", formatTimeForDisplay(event.EndTime), renewalLink)

						err = s.emailService.SendEmail(userEmail, "Session Ending Soon", emailBody)
						if err != nil {
							log.Printf("[SessionMonitor] Error sending reminder email: %v", err)
							continue
						}

						// Mark reminder as sent
						_, err = s.db.(*PostgresDatabase).db.Exec(context.Background(),
							"UPDATE instances SET session_reminder_sent = true WHERE id = $1", instanceId)
						if err != nil {
							log.Printf("[SessionMonitor] Error updating reminder status: %v", err)
						}
					}
				}

				if now.After(event.EndTime) {
					// Get current session info to verify it hasn't been renewed
					query := `
					SELECT session_end_time
					FROM instances
					WHERE id = $1`

					var currentEndTime time.Time
					err := s.db.(*PostgresDatabase).db.QueryRow(context.Background(), query, instanceId).Scan(&currentEndTime)
					if err != nil {
						log.Printf("[SessionMonitor] Error checking session end time for instance %s: %v", instanceId, err)
						continue
					}

					// If the end time hasn't changed, the session wasn't renewed
					if currentEndTime.Equal(event.EndTime) {
						// Stop the instance directly using VM manager
						url := fmt.Sprintf("%s/instances/stop/%s", s.vmManagerBaseUrl, instanceId)

						resp, err := http.Post(url, "application/json", nil)
						if err != nil {
							log.Printf("[SessionMonitor] Error calling VM manager API: %v", err)
							continue
						}
						defer resp.Body.Close()

						if resp.StatusCode != http.StatusOK {
							log.Printf("[SessionMonitor] VM manager returned error status %d", resp.StatusCode)
							continue
						}

						// Clear all session info from database
						query := `
						UPDATE instances 
						SET session_start_time = NULL, 
							session_end_time = NULL, 
							session_reminder_sent = false,
							session_reminder_token = NULL
						WHERE id = $1`

						_, err = s.db.(*PostgresDatabase).db.Exec(context.Background(), query, instanceId)
						if err != nil {
							log.Printf("[SessionMonitor] Error clearing session info from DB: %v", err)
							continue
						}

						// Remove from scheduled events
						delete(s.scheduledEvents, instanceId)
					} else {
						// Update the event with new end time
						event.EndTime = currentEndTime
						s.scheduledEvents[instanceId] = event
					}
				}
			}
			s.eventsMutex.Unlock()

		case <-s.stopChan:
			log.Printf("[SessionMonitor] Stopping session monitor")
			return
		}
	}
}

func (s *SessionManagerImpl) StartSession(instanceId string) error {
	s.eventsMutex.Lock()
	defer s.eventsMutex.Unlock()

	// Get session duration from environment variable (in minutes)
	sessionDurationStr := os.Getenv("SESSION_DURATION_MINUTES")
	if sessionDurationStr == "" {
		sessionDurationStr = "1" // Default to 1 minute for testing
	}
	sessionDuration, err := strconv.Atoi(sessionDurationStr)
	if err != nil {
		return fmt.Errorf("invalid session duration: %w", err)
	}

	startTime := getSpainTime()
	endTime := startTime.Add(time.Duration(sessionDuration) * time.Minute)
	reminderToken := uuid.New().String()

	// Get user email
	query := `
	SELECT u.mail
	FROM instances i
	JOIN users u ON i.user_id = u.id
	WHERE i.id = $1`

	var userEmail string
	err = s.db.(*PostgresDatabase).db.QueryRow(context.Background(), query, instanceId).Scan(&userEmail)
	if err != nil {
		log.Printf("[SessionManager] Error getting user email: %v", err)
		return fmt.Errorf("error getting user email: %w", err)
	}

	// Store session info in database
	query = `
	UPDATE instances 
	SET session_start_time = $1, 
		session_end_time = $2, 
		session_reminder_sent = false,
		session_reminder_token = $3
	WHERE id = $4`

	_, err = s.db.(*PostgresDatabase).db.Exec(context.Background(), query, startTime, endTime, reminderToken, instanceId)
	if err != nil {
		log.Printf("[SessionManager] Error storing session info in DB: %v", err)
		return fmt.Errorf("error storing session info: %w", err)
	}

	// Send initial email with formatted time
	emailBody := fmt.Sprintf("Your session has started and will end at %s.", formatTimeForDisplay(endTime))

	err = s.emailService.SendEmail(userEmail, "Session Started", emailBody)
	if err != nil {
		log.Printf("[SessionManager] Error sending initial email: %v", err)
		// Don't return error, continue with session start
	}

	// Add to scheduled events
	s.scheduledEvents[instanceId] = &SessionEvent{
		EndTime: endTime,
		Token:   reminderToken,
	}

	return nil
}

func (s *SessionManagerImpl) StopSession(instanceId string) error {
	log.Printf("[SessionManager] Stopping session for instance %s", instanceId)

	s.eventsMutex.Lock()
	defer s.eventsMutex.Unlock()

	// Remove from scheduled events
	if event, exists := s.scheduledEvents[instanceId]; exists {
		log.Printf("[SessionManager] Found active session for instance %s, end time was %v", instanceId, event.EndTime)
		delete(s.scheduledEvents, instanceId)
		log.Printf("[SessionManager] Removed instance %s from scheduled events", instanceId)
	} else {
		log.Printf("[SessionManager] No active session found for instance %s", instanceId)
	}

	// Clear all session info from database
	query := `
	UPDATE instances 
	SET session_start_time = NULL, 
		session_end_time = NULL, 
		session_reminder_sent = false,
		session_reminder_token = NULL
	WHERE id = $1`

	_, err := s.db.(*PostgresDatabase).db.Exec(context.Background(), query, instanceId)
	if err != nil {
		log.Printf("[SessionManager] Error clearing session info from DB: %v", err)
		return fmt.Errorf("error clearing session info: %w", err)
	}

	log.Printf("[SessionManager] Session stopped for instance %s", instanceId)
	return nil
}

func (s *SessionManagerImpl) RenewSession(instanceId string) error {
	log.Printf("[SessionManager] Attempting to renew session for instance %s", instanceId)

	s.eventsMutex.Lock()
	defer s.eventsMutex.Unlock()

	// Check if session exists
	event, exists := s.scheduledEvents[instanceId]
	if !exists {
		log.Printf("[SessionManager] No active session found for instance %s", instanceId)
		return fmt.Errorf("no active session found")
	}

	log.Printf("[SessionManager] Found active session for instance %s, current end time: %v", instanceId, event.EndTime)

	// Get session duration
	sessionDurationStr := os.Getenv("SESSION_DURATION_MINUTES")
	if sessionDurationStr == "" {
		sessionDurationStr = "1"
	}
	sessionDuration, err := strconv.Atoi(sessionDurationStr)
	if err != nil {
		return fmt.Errorf("invalid session duration: %w", err)
	}

	// Calculate new end time using Spain's timezone
	newEndTime := getSpainTime().Add(time.Duration(sessionDuration) * time.Minute)
	log.Printf("[SessionManager] New session duration: %d minutes, will end at %v", sessionDuration, newEndTime)

	// Update all session info in database
	query := `
	UPDATE instances 
	SET session_end_time = $1,
		session_reminder_sent = false,
		session_reminder_token = $2
	WHERE id = $3`

	_, err = s.db.(*PostgresDatabase).db.Exec(context.Background(), query, newEndTime, event.Token, instanceId)
	if err != nil {
		log.Printf("[SessionManager] Error updating session info in DB: %v", err)
		return fmt.Errorf("error updating session info: %w", err)
	}

	// Update event
	event.EndTime = newEndTime
	s.scheduledEvents[instanceId] = event

	log.Printf("[SessionManager] Session renewed for instance %s, new end time: %v", instanceId, newEndTime)
	return nil
}
