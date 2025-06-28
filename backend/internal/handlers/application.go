package handlers

import (
	"context"
	"fmt"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"

	"k8s-monitor/internal/models"
	"k8s-monitor/internal/services"
	"k8s-monitor/pkg/utils"
)

// ApplicationHandler handles application-related HTTP requests
type ApplicationHandler struct {
	appService *services.ApplicationService
	logger     *logrus.Logger
}

// NewApplicationHandler creates a new application handler instance
func NewApplicationHandler(appService *services.ApplicationService, logger *logrus.Logger) *ApplicationHandler {
	return &ApplicationHandler{
		appService: appService,
		logger:     logger,
	}
}

// List retrieves all applications across all accessible namespaces
// @Summary List all applications
// @Description Get a list of all applications with their health status across all accessible namespaces
// @Tags applications
// @Accept json
// @Produce json
// @Success 200 {object} models.ApplicationsResponse
// @Failure 500 {object} models.APIResponse
// @Router /api/v1/applications [get]
func (h *ApplicationHandler) List(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 60*time.Second)
	defer cancel()

	logger := utils.WithComponent(h.logger, "application-handler")
	logger.Info("Fetching all applications")

	// Get applications from service layer
	response, err := h.appService.GetApplications(ctx)
	if err != nil {
		logger.WithError(err).Error("Failed to fetch applications")
		models.RespondKubernetesError(c, "list applications", err)
		return
	}

	logger.WithField("total", response.Total).Info("Successfully fetched applications")
	models.RespondSuccess(c, response)
}

// ListByNamespace retrieves applications from a specific namespace
// @Summary List applications by namespace
// @Description Get a list of applications with their health status from a specific namespace
// @Tags applications
// @Accept json
// @Produce json
// @Param namespace path string true "Namespace name"
// @Success 200 {object} models.ApplicationsResponse
// @Failure 400 {object} models.APIResponse
// @Failure 404 {object} models.APIResponse
// @Failure 500 {object} models.APIResponse
// @Router /api/v1/applications/{namespace} [get]
func (h *ApplicationHandler) ListByNamespace(c *gin.Context) {
	namespace := c.Param("namespace")
	if namespace == "" {
		models.RespondBadRequest(c, "Namespace parameter is required", "")
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 60*time.Second)
	defer cancel()

	logger := utils.WithNamespace(h.logger, namespace)
	logger.Info("Fetching applications by namespace")

	// Get applications from service layer
	response, err := h.appService.GetApplicationsByNamespace(ctx, namespace)
	if err != nil {
		logger.WithError(err).Error("Failed to fetch applications")

		// Check if it's a namespace access error
		if fmt.Sprintf("%v", err) == fmt.Sprintf("access to namespace '%s' not allowed", namespace) {
			models.RespondBadRequest(c, "Access to namespace not allowed",
				fmt.Sprintf("Namespace '%s' is not in the allowed list", namespace))
			return
		}

		// Check if it's a namespace not found error
		if IsNamespaceNotFoundError(err) {
			models.RespondNamespaceNotFound(c, namespace)
			return
		}

		models.RespondKubernetesError(c, "list applications in namespace", err)
		return
	}

	logger.WithField("total", response.Total).Info("Successfully fetched applications by namespace")
	models.RespondSuccess(c, response)
}

// GetApplication retrieves a specific application by name and namespace
// @Summary Get a specific application
// @Description Get detailed information about a specific application including all its pods and services
// @Tags applications
// @Accept json
// @Produce json
// @Param namespace path string true "Namespace name"
// @Param name path string true "Application name"
// @Success 200 {object} models.Application
// @Failure 400 {object} models.APIResponse
// @Failure 404 {object} models.APIResponse
// @Failure 500 {object} models.APIResponse
// @Router /api/v1/applications/{namespace}/{name} [get]
func (h *ApplicationHandler) GetApplication(c *gin.Context) {
	namespace := c.Param("namespace")
	appName := c.Param("name")

	if namespace == "" || appName == "" {
		models.RespondBadRequest(c, "Namespace and application name are required", "")
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 60*time.Second)
	defer cancel()

	logger := utils.WithApplication(h.logger, namespace, appName)
	logger.Info("Fetching specific application")

	// Get applications from the namespace
	response, err := h.appService.GetApplicationsByNamespace(ctx, namespace)
	if err != nil {
		logger.WithError(err).Error("Failed to fetch applications")

		// Check if it's a namespace access error
		if fmt.Sprintf("%v", err) == fmt.Sprintf("access to namespace '%s' not allowed", namespace) {
			models.RespondBadRequest(c, "Access to namespace not allowed",
				fmt.Sprintf("Namespace '%s' is not in the allowed list", namespace))
			return
		}

		models.RespondKubernetesError(c, "get application", err)
		return
	}

	// Find the specific application
	var foundApp *models.Application
	for _, app := range response.Applications {
		if app.Name == appName {
			foundApp = &app
			break
		}
	}

	if foundApp == nil {
		models.RespondError(c, 404, models.ErrCodeResourceNotFound,
			"Application not found",
			fmt.Sprintf("Application '%s' not found in namespace '%s'", appName, namespace))
		return
	}

	logger.Info("Successfully fetched application")
	models.RespondSuccess(c, foundApp)
}

// GetApplicationStatus retrieves the health status of a specific application
// @Summary Get application status
// @Description Get the current health status of a specific application
// @Tags applications
// @Accept json
// @Produce json
// @Param namespace path string true "Namespace name"
// @Param name path string true "Application name"
// @Success 200 {object} object{name=string,namespace=string,status=string,summary=models.ApplicationSummary}
// @Failure 400 {object} models.APIResponse
// @Failure 404 {object} models.APIResponse
// @Failure 500 {object} models.APIResponse
// @Router /api/v1/applications/{namespace}/{name}/status [get]
func (h *ApplicationHandler) GetApplicationStatus(c *gin.Context) {
	namespace := c.Param("namespace")
	appName := c.Param("name")

	if namespace == "" || appName == "" {
		models.RespondBadRequest(c, "Namespace and application name are required", "")
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	logger := utils.WithApplication(h.logger, namespace, appName)
	logger.Info("Fetching application status")

	// Get applications from the namespace
	response, err := h.appService.GetApplicationsByNamespace(ctx, namespace)
	if err != nil {
		logger.WithError(err).Error("Failed to fetch application status")
		models.RespondKubernetesError(c, "get application status", err)
		return
	}

	// Find the specific application
	var foundApp *models.Application
	for _, app := range response.Applications {
		if app.Name == appName {
			foundApp = &app
			break
		}
	}

	if foundApp == nil {
		models.RespondError(c, 404, models.ErrCodeResourceNotFound,
			"Application not found",
			fmt.Sprintf("Application '%s' not found in namespace '%s'", appName, namespace))
		return
	}

	// Return simplified status response
	statusResponse := map[string]interface{}{
		"name":      foundApp.Name,
		"namespace": foundApp.Namespace,
		"status":    foundApp.Status,
		"summary":   foundApp.Summary,
		"type":      foundApp.Type,
		"version":   foundApp.Version,
	}

	logger.Info("Successfully fetched application status")
	models.RespondSuccess(c, statusResponse)
}
