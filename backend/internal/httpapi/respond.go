package httpapi

import "github.com/gin-gonic/gin"

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
	c.AbortWithStatusJSON(status, gin.H{"error": errorBody{Code: code, Message: message, Fields: fields}})
}
