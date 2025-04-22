package main

import (
	"fmt"
	"log"
	"strings"
)

// This file is kept for reference but its functionality has been moved to server-agent/server_agent.go
// The VM management operations are now handled through HTTP API calls to the server-agent

func logAndReturnError(customMsg string, err string) error {
	err = strings.TrimPrefix(err, "error")
	err = strings.TrimPrefix(err, "ERROR")
	err = strings.TrimPrefix(err, ":")
	err = strings.TrimSpace(err)
	log.Printf("%s%s", customMsg, err)
	return fmt.Errorf("%s%s", customMsg, err)
}
