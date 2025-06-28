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

// PodHandler handles pod-related HTTP requests
type PodHandler struct {
	k8sService *services.KubernetesService
	logger     *logrus.Logger
}

// NewPodHandler creates a new pod handler instance
func NewPodHandler(k8sService *services.KubernetesService, logger *logrus.Logger) *PodHandler {
	return &PodHandler{
		k8sService: k8sService,
		logger:     logger,
	}
}

// List retrieves all pods across all accessible namespaces
// @Summary List all pods
// @Description Get a list of all pods across all accessible namespaces
// @Tags pods
// @Accept json
// @Produce json
// @Success 200 {object} models.PodListResponse
// @Failure 500 {object} models.APIResponse
// @Router /api/v1/pods [get]
func (h *PodHandler) List(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	logger := utils.WithComponent(h.logger, "pod-handler")
	logger.Info("Fetching all pods")

	// Get all pods
	podList, err := h.k8sService.GetAllPods(ctx)
	if err != nil {
		logger.WithError(err).Error("Failed to fetch pods")
		models.RespondKubernetesError(c, "list pods", err)
		return
	}

	// Convert to our model format
	var pods []models.PodStatus
	summary := models.PodSummary{}

	for _, pod := range podList.Items {
		// Check if namespace is allowed
		if !h.k8sService.IsNamespaceAllowed(pod.Namespace) {
			continue
		}

		podStatus := models.FromK8sPod(&pod)
		pods = append(pods, podStatus)

		// Update summary
		switch podStatus.Status {
		case "Running":
			summary.Running++
		case "Pending":
			summary.Pending++
		case "Succeeded":
			summary.Succeeded++
		case "Failed":
			summary.Failed++
		default:
			summary.Unknown++
		}
	}

	response := models.PodListResponse{
		Pods:    pods,
		Total:   len(pods),
		Summary: summary,
	}

	logger.WithField("total", len(pods)).Info("Successfully fetched pods")
	models.RespondSuccess(c, response)
}

// ListByNamespace retrieves pods from a specific namespace
// @Summary List pods by namespace
// @Description Get a list of pods from a specific namespace
// @Tags pods
// @Accept json
// @Produce json
// @Param namespace path string true "Namespace name"
// @Success 200 {object} models.PodListResponse
// @Failure 400 {object} models.APIResponse
// @Failure 404 {object} models.APIResponse
// @Failure 500 {object} models.APIResponse
// @Router /api/v1/pods/{namespace} [get]
func (h *PodHandler) ListByNamespace(c *gin.Context) {
	namespace := c.Param("namespace")
	if namespace == "" {
		models.RespondBadRequest(c, "Namespace parameter is required", "")
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	logger := utils.WithNamespace(h.logger, namespace)
	logger.Info("Fetching pods by namespace")

	// Check if namespace is allowed
	if !h.k8sService.IsNamespaceAllowed(namespace) {
		models.RespondBadRequest(c, "Access to namespace not allowed",
			fmt.Sprintf("Namespace '%s' is not in the allowed list", namespace))
		return
	}

	// Get pods from the specified namespace
	podList, err := h.k8sService.GetPods(ctx, namespace)
	if err != nil {
		logger.WithError(err).Error("Failed to fetch pods")

		// Check if it's a namespace not found error
		if IsNamespaceNotFoundError(err) {
			models.RespondNamespaceNotFound(c, namespace)
			return
		}

		models.RespondKubernetesError(c, "list pods in namespace", err)
		return
	}

	// Convert to our model format
	var pods []models.PodStatus
	summary := models.PodSummary{}

	for _, pod := range podList.Items {
		podStatus := models.FromK8sPod(&pod)
		pods = append(pods, podStatus)

		// Update summary
		switch podStatus.Status {
		case "Running":
			summary.Running++
		case "Pending":
			summary.Pending++
		case "Succeeded":
			summary.Succeeded++
		case "Failed":
			summary.Failed++
		default:
			summary.Unknown++
		}
	}

	response := models.PodListResponse{
		Pods:      pods,
		Total:     len(pods),
		Namespace: namespace,
		Summary:   summary,
	}

	logger.WithField("total", len(pods)).Info("Successfully fetched pods by namespace")
	models.RespondSuccess(c, response)
}

// ListNamespaces retrieves all accessible namespaces
// @Summary List namespaces
// @Description Get a list of all accessible namespaces
// @Tags namespaces
// @Accept json
// @Produce json
// @Success 200 {object} models.NamespaceListResponse
// @Failure 500 {object} models.APIResponse
// @Router /api/v1/namespaces [get]
func (h *PodHandler) ListNamespaces(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	logger := utils.WithComponent(h.logger, "pod-handler")
	logger.Info("Fetching namespaces")

	// Get all namespaces
	namespaceList, err := h.k8sService.GetNamespaces(ctx)
	if err != nil {
		logger.WithError(err).Error("Failed to fetch namespaces")
		models.RespondKubernetesError(c, "list namespaces", err)
		return
	}

	// Convert to our model format and filter allowed namespaces
	var namespaces []models.NamespaceInfo
	for _, ns := range namespaceList.Items {
		if !h.k8sService.IsNamespaceAllowed(ns.Name) {
			continue
		}

		nsInfo := models.FromK8sNamespace(&ns)

		// Optionally get pod count for this namespace
		if podList, err := h.k8sService.GetPods(ctx, ns.Name); err == nil {
			nsInfo.PodCount = len(podList.Items)
		}

		namespaces = append(namespaces, nsInfo)
	}

	response := models.NamespaceListResponse{
		Namespaces: namespaces,
		Total:      len(namespaces),
	}

	logger.WithField("total", len(namespaces)).Info("Successfully fetched namespaces")
	models.RespondSuccess(c, response)
}

// GetPod retrieves a specific pod by name and namespace
// @Summary Get a specific pod
// @Description Get detailed information about a specific pod
// @Tags pods
// @Accept json
// @Produce json
// @Param namespace path string true "Namespace name"
// @Param name path string true "Pod name"
// @Success 200 {object} models.PodStatus
// @Failure 400 {object} models.APIResponse
// @Failure 404 {object} models.APIResponse
// @Failure 500 {object} models.APIResponse
// @Router /api/v1/pods/{namespace}/{name} [get]
func (h *PodHandler) GetPod(c *gin.Context) {
	namespace := c.Param("namespace")
	podName := c.Param("name")

	if namespace == "" || podName == "" {
		models.RespondBadRequest(c, "Namespace and pod name are required", "")
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	logger := utils.WithPod(h.logger, namespace, podName)
	logger.Info("Fetching specific pod")

	// Check if namespace is allowed
	if !h.k8sService.IsNamespaceAllowed(namespace) {
		models.RespondBadRequest(c, "Access to namespace not allowed",
			fmt.Sprintf("Namespace '%s' is not in the allowed list", namespace))
		return
	}

	// Get the specific pod
	pod, err := h.k8sService.GetPod(ctx, namespace, podName)
	if err != nil {
		logger.WithError(err).Error("Failed to fetch pod")

		// Check if it's a pod not found error
		if IsPodNotFoundError(err) {
			models.RespondPodNotFound(c, namespace, podName)
			return
		}

		models.RespondKubernetesError(c, "get pod", err)
		return
	}

	podStatus := models.FromK8sPod(pod)

	logger.Info("Successfully fetched pod")
	models.RespondSuccess(c, podStatus)
}

// IsNamespaceNotFoundError checks if the error is due to namespace not being found
func IsNamespaceNotFoundError(err error) bool {
	// This is a simplified check - in a real implementation, you might want to
	// check for specific Kubernetes error types
	return err != nil &&
		(fmt.Sprintf("%v", err) == "namespaces \"not-found\" not found" ||
			fmt.Sprintf("%v", err) == "the server could not find the requested resource")
}

// IsPodNotFoundError checks if the error is due to pod not being found
func IsPodNotFoundError(err error) bool {
	// This is a simplified check - in a real implementation, you might want to
	// check for specific Kubernetes error types
	return err != nil &&
		fmt.Sprintf("%v", err) == "pods \"not-found\" not found"
}
