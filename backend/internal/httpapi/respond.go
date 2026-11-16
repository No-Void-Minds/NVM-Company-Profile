package httpapi

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
)

const (
	codeValidation   = "VALIDATION"
	codeNotFound     = "NOT_FOUND"
	codeUnauthorized = "UNAUTHORIZED"
	codeForbidden    = "FORBIDDEN"
	codeRateLimited  = "RATE_LIMITED"
	codeConflict     = "CONFLICT"
	codeInternal     = "INTERNAL"
)

type errorBody struct {
	Code    string            `json:"code"`
	Message string            `json:"message"`
	Fields  map[string]string `json:"fields,omitempty"`
}

func respondError(c *gin.Context, status int, code, message string, fields map[string]string) {
	// Errors must not stay in caches set up earlier by publicCache.
	c.Header("Cache-Control", "no-store")
	c.AbortWithStatusJSON(status, gin.H{"error": errorBody{Code: code, Message: message, Fields: fields}})
}

// tooLarge answers 413 when a JSON body went past its MaxBytesReader limit, so the caller stops.
func tooLarge(c *gin.Context, err error) bool {
	var maxErr *http.MaxBytesError
	if !errors.As(err, &maxErr) {
		return false
	}
	respondError(c, http.StatusRequestEntityTooLarge, codeValidation, "Data terlalu besar.", nil)
	return true
}
