package main

import (
	"fmt"
	"log"
	"strings"
)

type HttpError struct {
	StatusCode int
	Err        error
}

func (e *HttpError) Error() string {
	return e.Err.Error()
}

func NewHttpError(statusCode int, err error) *HttpError {
	return &HttpError{
		StatusCode: statusCode,
		Err:        err,
	}
}

func logAndReturnError(customMsg string, err string) error {
	err = strings.TrimPrefix(err, "error")
	err = strings.TrimPrefix(err, "ERROR")
	err = strings.TrimPrefix(err, ":")
	err = strings.TrimSpace(err)
	log.Printf("%s%s", customMsg, err)
	return fmt.Errorf("%s%s", customMsg, err)
}
