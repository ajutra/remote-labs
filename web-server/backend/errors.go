package main

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
