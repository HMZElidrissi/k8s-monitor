package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"

	"k8s-monitor/internal/models"
	"k8s-monitor/internal/services"
)

// ApplicationHandler handles application-related HTTP requests
type ApplicationHandler struct {
	appService *services.ApplicationService
	logger     *logrus.Logger
}

// NewApplicationHandler creates a new application handler
func NewApplicationHandler(appService *services.ApplicationService, logger *logrus.Logger) *ApplicationHandler {
	return &ApplicationHandler{
		appService: appService,
		logger:     logger,
	}
}

// GetApplications handles GET /api/v1/applications
func (h *ApplicationHandler) GetApplications(c *gin.Context) {
	applications, err := h.appService.GetApplications()
	if err != nil {
		h.logger.WithError(err).Error("Failed to get applications")
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to retrieve applications",
			"details": err.Error(),
		})
		return
	}

	// Calculate summary statistics
	summary := calculateApplicationSummary(applications)

	h.logger.WithField("count", len(applications)).Info("Retrieved applications")

	c.JSON(http.StatusOK, gin.H{
		"applications": applications,
		"summary":      summary,
	})
}

// GetApplicationsByNamespace handles GET /api/v1/applications/:namespace
func (h *ApplicationHandler) GetApplicationsByNamespace(c *gin.Context) {
	namespace := c.Param("namespace")

	if namespace == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Namespace parameter is required",
		})
		return
	}

	applications, err := h.appService.GetApplicationsByNamespace(namespace)
	if err != nil {
		h.logger.WithError(err).WithField("namespace", namespace).Error("Failed to get applications by namespace")
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to retrieve applications",
			"details": err.Error(),
		})
		return
	}

	// Calculate summary for this namespace
	summary := calculateApplicationSummary(applications)

	h.logger.WithFields(logrus.Fields{
		"namespace": namespace,
		"count":     len(applications),
	}).Info("Retrieved applications by namespace")

	c.JSON(http.StatusOK, gin.H{
		"applications": applications,
		"namespace":    namespace,
		"summary":      summary,
	})
}

// calculateApplicationSummary generates summary statistics from applications
func calculateApplicationSummary(applications []models.Application) map[string]interface{} {
	if len(applications) == 0 {
		return map[string]interface{}{
			"total_applications":   0,
			"healthy_applications": 0,
			"total_pods":           0,
			"running_pods":         0,
			"status_breakdown":     map[string]int{},
		}
	}

	totalApps := len(applications)
	healthyApps := 0
	totalPods := 0
	runningPods := 0
	statusBreakdown := make(map[string]int)

	// This is a simplified calculation - would need proper type assertion in real code
	// For now, returning basic structure

	return map[string]interface{}{
		"total_applications":   totalApps,
		"healthy_applications": healthyApps,
		"total_pods":           totalPods,
		"running_pods":         runningPods,
		"status_breakdown":     statusBreakdown,
	}
}
