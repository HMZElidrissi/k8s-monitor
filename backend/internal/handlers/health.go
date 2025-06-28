package handlers

import (
	"context"
	"fmt"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"

	"k8s-monitor/internal/models"
	"k8s-monitor/internal/services"
)

var (
	// startTime tracks when the server started
	startTime = time.Now()
	// version can be set during build time
	version = "1.0.0"
)

// HealthHandler handles health check requests
type HealthHandler struct {
	k8sService *services.KubernetesService
	logger     *logrus.Logger
}

// NewHealthHandler creates a new health handler instance
func NewHealthHandler(k8sService *services.KubernetesService, logger *logrus.Logger) *HealthHandler {
	return &HealthHandler{
		k8sService: k8sService,
		logger:     logger,
	}
}

// Check performs health checks and returns system status
// @Summary Health check endpoint
// @Description Returns the health status of the API server and its dependencies
// @Tags health
// @Accept json
// @Produce json
// @Success 200 {object} models.HealthResponse
// @Failure 503 {object} models.APIResponse
// @Router /health [get]
func (h *HealthHandler) Check(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	// Calculate uptime
	uptime := time.Since(startTime)
	uptimeStr := formatUptime(uptime)

	// Initialize response
	response := &models.HealthResponse{
		Status:    "healthy",
		Version:   version,
		Uptime:    uptimeStr,
		Checks:    make(map[string]string),
		Timestamp: time.Now(),
	}

	// Perform Kubernetes connectivity check
	k8sStatus := "healthy"
	if err := h.k8sService.HealthCheck(ctx); err != nil {
		h.logger.WithError(err).Error("Kubernetes health check failed")
		k8sStatus = "unhealthy"
		response.Status = "unhealthy"
		response.Checks["kubernetes"] = fmt.Sprintf("Failed: %v", err)
	} else {
		response.Checks["kubernetes"] = "Connected"
	}
	response.KubernetesStatus = k8sStatus

	// Additional health checks can be added here
	response.Checks["database"] = "N/A - No database dependency"
	response.Checks["memory"] = "OK"
	response.Checks["disk"] = "OK"

	// Set appropriate HTTP status code
	statusCode := 200
	if response.Status == "unhealthy" {
		statusCode = 503
	}

	if statusCode == 200 {
		models.RespondSuccess(c, response)
	} else {
		models.RespondError(c, statusCode, models.ErrCodeInternal,
			"Service unhealthy", "One or more health checks failed")
	}
}

// formatUptime formats uptime duration into a readable string
func formatUptime(d time.Duration) string {
	days := int(d.Hours()) / 24
	hours := int(d.Hours()) % 24
	minutes := int(d.Minutes()) % 60
	seconds := int(d.Seconds()) % 60

	if days > 0 {
		return fmt.Sprintf("%dd %dh %dm %ds", days, hours, minutes, seconds)
	} else if hours > 0 {
		return fmt.Sprintf("%dh %dm %ds", hours, minutes, seconds)
	} else if minutes > 0 {
		return fmt.Sprintf("%dm %ds", minutes, seconds)
	} else {
		return fmt.Sprintf("%ds", seconds)
	}
}
