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

// ArgoCDHandler handles ArgoCD application related HTTP requests
type ArgoCDHandler struct {
	k8sService *services.KubernetesService
	logger     *logrus.Logger
}

// NewArgoCDHandler creates a new ArgoCD handler instance
func NewArgoCDHandler(k8sService *services.KubernetesService, logger *logrus.Logger) *ArgoCDHandler {
	return &ArgoCDHandler{
		k8sService: k8sService,
		logger:     logger,
	}
}

// List retrieves all ArgoCD applications across all accessible namespaces
func (h *ArgoCDHandler) List(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	logger := utils.WithComponent(h.logger, "argocd-handler")
	logger.Info("Fetching all ArgoCD applications")

	appList, err := h.k8sService.GetArgoApplications(ctx, "")
	if err != nil {
		logger.WithError(err).Error("Failed to fetch ArgoCD applications")
		models.RespondKubernetesError(c, "list argocd applications", err)
		return
	}

	var applications []models.ArgoCDApplication
	summary := models.ArgoCDSummary{}

	for _, app := range appList.Items {
		if !h.k8sService.IsNamespaceAllowed(app.GetNamespace()) {
			continue
		}

		argoCDApp := models.FromArgoApplication(&app)
		applications = append(applications, argoCDApp)

		// Update summary based on computed status
		switch argoCDApp.Status {
		case "healthy":
			summary.Healthy++
		case "degraded":
			summary.Degraded++
		case "progressing":
			summary.Progressing++
		default:
			summary.Unknown++
		}

		// Also track sync status
		switch argoCDApp.SyncStatus {
		case "Synced":
			summary.Synced++
		case "OutOfSync":
			summary.OutOfSync++
		}

		switch argoCDApp.HealthStatus {
		case "Healthy":
			summary.Healthy++
		case "Degraded":
			summary.Degraded++
		case "Progressing":
			summary.Progressing++
		default:
			summary.Unknown++
		}
	}

	response := models.ArgoCDApplicationsResponse{
		Applications: applications,
		Total:        len(applications),
		Summary:      summary,
	}

	logger.WithField("total", len(applications)).Info("Successfully fetched ArgoCD applications")
	models.RespondSuccess(c, response)
}

// ListByNamespace retrieves ArgoCD applications from a specific namespace
func (h *ArgoCDHandler) ListByNamespace(c *gin.Context) {
	namespace := c.Param("namespace")
	if namespace == "" {
		models.RespondBadRequest(c, "Namespace parameter is required", "")
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	logger := utils.WithNamespace(h.logger, namespace)
	logger.Info("Fetching ArgoCD applications by namespace")

	if !h.k8sService.IsNamespaceAllowed(namespace) {
		models.RespondBadRequest(c, "Access to namespace not allowed",
			fmt.Sprintf("Namespace '%s' is not in the allowed list", namespace))
		return
	}

	appList, err := h.k8sService.GetArgoApplications(ctx, namespace)
	if err != nil {
		logger.WithError(err).Error("Failed to fetch ArgoCD applications")
		models.RespondKubernetesError(c, "list argocd applications in namespace", err)
		return
	}

	var applications []models.ArgoCDApplication
	summary := models.ArgoCDSummary{}

	for _, app := range appList.Items {
		argoCDApp := models.FromArgoApplication(&app)
		applications = append(applications, argoCDApp)

		// Update summary based on computed status
		switch argoCDApp.Status {
		case "healthy":
			summary.Healthy++
		case "degraded":
			summary.Degraded++
		case "progressing":
			summary.Progressing++
		default:
			summary.Unknown++
		}

		// Also track sync status
		switch argoCDApp.SyncStatus {
		case "Synced":
			summary.Synced++
		case "OutOfSync":
			summary.OutOfSync++
		}

		switch argoCDApp.HealthStatus {
		case "Healthy":
			summary.Healthy++
		case "Degraded":
			summary.Degraded++
		case "Progressing":
			summary.Progressing++
		default:
			summary.Unknown++
		}
	}

	response := models.ArgoCDApplicationsResponse{
		Applications: applications,
		Total:        len(applications),
		Namespace:    namespace,
		Summary:      summary,
	}

	logger.WithField("total", len(applications)).Info("Successfully fetched ArgoCD applications by namespace")
	models.RespondSuccess(c, response)
}

// GetApplication retrieves a specific ArgoCD application by name and namespace
func (h *ArgoCDHandler) GetApplication(c *gin.Context) {
	namespace := c.Param("namespace")
	appName := c.Param("name")

	if namespace == "" || appName == "" {
		models.RespondBadRequest(c, "Namespace and application name are required", "")
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	logger := utils.WithFields(h.logger, logrus.Fields{
		"namespace":   namespace,
		"application": appName,
		"component":   "argocd-handler",
	})
	logger.Info("Fetching specific ArgoCD application")

	if !h.k8sService.IsNamespaceAllowed(namespace) {
		models.RespondBadRequest(c, "Access to namespace not allowed",
			fmt.Sprintf("Namespace '%s' is not in the allowed list", namespace))
		return
	}

	app, err := h.k8sService.GetArgoApplication(ctx, namespace, appName)
	if err != nil {
		logger.WithError(err).Error("Failed to fetch ArgoCD application")
		models.RespondKubernetesError(c, "get argocd application", err)
		return
	}

	argoCDApp := models.FromArgoApplication(app)

	logger.Info("Successfully fetched ArgoCD application")
	models.RespondSuccess(c, argoCDApp)
}
