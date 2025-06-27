package models

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

// APIResponse represents a standard API response structure
type APIResponse struct {
	Success   bool        `json:"success"`
	Data      interface{} `json:"data,omitempty"`
	Error     *APIError   `json:"error,omitempty"`
	Meta      *Meta       `json:"meta,omitempty"`
	Timestamp time.Time   `json:"timestamp"`
}

// APIError represents error information in API responses
type APIError struct {
	Code    string `json:"code"`
	Message string `json:"message"`
	Details string `json:"details,omitempty"`
}

// Meta provides additional metadata for API responses
type Meta struct {
	Total      int    `json:"total,omitempty"`
	Page       int    `json:"page,omitempty"`
	PageSize   int    `json:"pageSize,omitempty"`
	TotalPages int    `json:"totalPages,omitempty"`
	Namespace  string `json:"namespace,omitempty"`
}

// HealthResponse represents the health check response
type HealthResponse struct {
	Status           string            `json:"status"`
	Version          string            `json:"version"`
	Uptime           string            `json:"uptime"`
	KubernetesStatus string            `json:"kubernetesStatus"`
	Checks           map[string]string `json:"checks"`
	Timestamp        time.Time         `json:"timestamp"`
}

// ErrorCode constants for different types of errors
const (
	ErrCodeInternal          = "INTERNAL_ERROR"
	ErrCodeBadRequest        = "BAD_REQUEST"
	ErrCodeNotFound          = "NOT_FOUND"
	ErrCodeUnauthorized      = "UNAUTHORIZED"
	ErrCodeForbidden         = "FORBIDDEN"
	ErrCodeValidation        = "VALIDATION_ERROR"
	ErrCodeKubernetesAPI     = "KUBERNETES_API_ERROR"
	ErrCodeNamespaceNotFound = "NAMESPACE_NOT_FOUND"
	ErrCodePodNotFound       = "POD_NOT_FOUND"
	ErrCodeResourceNotFound  = "RESOURCE_NOT_FOUND"
	ErrCodeTimeout           = "TIMEOUT_ERROR"
	ErrCodeRateLimit         = "RATE_LIMIT_EXCEEDED"
)

// NewSuccessResponse creates a successful API response
func NewSuccessResponse(data interface{}) *APIResponse {
	return &APIResponse{
		Success:   true,
		Data:      data,
		Timestamp: time.Now(),
	}
}

// NewSuccessResponseWithMeta creates a successful API response with metadata
func NewSuccessResponseWithMeta(data interface{}, meta *Meta) *APIResponse {
	return &APIResponse{
		Success:   true,
		Data:      data,
		Meta:      meta,
		Timestamp: time.Now(),
	}
}

// NewErrorResponse creates an error API response
func NewErrorResponse(code, message, details string) *APIResponse {
	return &APIResponse{
		Success: false,
		Error: &APIError{
			Code:    code,
			Message: message,
			Details: details,
		},
		Timestamp: time.Now(),
	}
}

// RespondSuccess sends a successful response
func RespondSuccess(c *gin.Context, data interface{}) {
	c.JSON(http.StatusOK, NewSuccessResponse(data))
}

// RespondSuccessWithMeta sends a successful response with metadata
func RespondSuccessWithMeta(c *gin.Context, data interface{}, meta *Meta) {
	c.JSON(http.StatusOK, NewSuccessResponseWithMeta(data, meta))
}

// RespondError sends an error response with appropriate HTTP status
func RespondError(c *gin.Context, statusCode int, code, message, details string) {
	c.JSON(statusCode, NewErrorResponse(code, message, details))
}

// RespondBadRequest sends a 400 Bad Request response
func RespondBadRequest(c *gin.Context, message, details string) {
	RespondError(c, http.StatusBadRequest, ErrCodeBadRequest, message, details)
}

// RespondNotFound sends a 404 Not Found response
func RespondNotFound(c *gin.Context, message, details string) {
	RespondError(c, http.StatusNotFound, ErrCodeNotFound, message, details)
}

// RespondInternalError sends a 500 Internal Server Error response
func RespondInternalError(c *gin.Context, message, details string) {
	RespondError(c, http.StatusInternalServerError, ErrCodeInternal, message, details)
}

// RespondKubernetesError sends an error response for Kubernetes API errors
func RespondKubernetesError(c *gin.Context, operation string, err error) {
	message := "Kubernetes API operation failed"
	details := "Operation: " + operation + ", Error: " + err.Error()
	RespondError(c, http.StatusBadGateway, ErrCodeKubernetesAPI, message, details)
}

// RespondNamespaceNotFound sends a namespace not found error
func RespondNamespaceNotFound(c *gin.Context, namespace string) {
	message := "Namespace not found"
	details := "The specified namespace '" + namespace + "' does not exist or is not accessible"
	RespondError(c, http.StatusNotFound, ErrCodeNamespaceNotFound, message, details)
}

// RespondPodNotFound sends a pod not found error
func RespondPodNotFound(c *gin.Context, namespace, podName string) {
	message := "Pod not found"
	details := "The pod '" + podName + "' in namespace '" + namespace + "' does not exist"
	RespondError(c, http.StatusNotFound, ErrCodePodNotFound, message, details)
}

// RespondValidationError sends a validation error response
func RespondValidationError(c *gin.Context, details string) {
	RespondError(c, http.StatusBadRequest, ErrCodeValidation, "Validation failed", details)
}
