package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"

	"k8s-monitor/internal/services"
)

// PodHandler handles pod-related HTTP requests
type PodHandler struct {
	k8sService services.K8sService
	logger     *logrus.Logger
}

// NewPodHandler creates a new pod handler
func NewPodHandler(k8sService services.K8sService, logger *logrus.Logger) *PodHandler {
	return &PodHandler{
		k8sService: k8sService,
		logger:     logger,
	}
}

// GetPods handles GET /api/v1/pods
func (h *PodHandler) GetPods(c *gin.Context) {
	namespace := c.DefaultQuery("namespace", "default")
	
	pods, err := h.k8sService.GetPods(namespace)
	if err != nil {
		h.logger.WithError(err).WithField("namespace", namespace).Error("Failed to get pods")
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to retrieve pods",
			"details": err.Error(),
		})
		return
	}

	h.logger.WithFields(logrus.Fields{
		"namespace": namespace,
		"count": len(pods),
	}).Info("Retrieved pods")

	c.JSON(http.StatusOK, gin.H{
		"pods": pods,
		"count": len(pods),
		"namespace": namespace,
	})
}

// GetPodsByNamespace handles GET /api/v1/pods/:namespace
func (h *PodHandler) GetPodsByNamespace(c *gin.Context) {
	namespace := c.Param("namespace")
	
	if namespace == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Namespace parameter is required",
		})
		return
	}

	pods, err := h.k8sService.GetPods(namespace)
	if err != nil {
		h.logger.WithError(err).WithField("namespace", namespace).Error("Failed to get pods by namespace")
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to retrieve pods",
			"details": err.Error(),
		})
		return
	}

	h.logger.WithFields(logrus.Fields{
		"namespace": namespace,
		"count": len(pods),
	}).Info("Retrieved pods by namespace")

	c.JSON(http.StatusOK, gin.H{
		"pods": pods,
		"count": len(pods),
		"namespace": namespace,
	})
}

// GetPod handles GET /api/v1/pods/:namespace/:name
func (h *PodHandler) GetPod(c *gin.Context) {
	namespace := c.Param("namespace")
	name := c.Param("name")

	if namespace == "" || name == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Both namespace and name parameters are required",
		})
		return
	}

	pod, err := h.k8sService.GetPod(namespace, name)
	if err != nil {
		h.logger.WithError(err).WithFields(logrus.Fields{
			"namespace": namespace,
			"pod": name,
		}).Error("Failed to get pod")
		
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Pod not found",
			"details": err.Error(),
		})
		return
	}

	h.logger.WithFields(logrus.Fields{
		"namespace": namespace,
		"pod": name,
		"status": pod.Status,
	}).Info("Retrieved pod details")

	c.JSON(http.StatusOK, gin.H{
		"pod": pod,
	})
}

// RestartPod handles DELETE /api/v1/pods/:namespace/:name
func (h *PodHandler) RestartPod(c *gin.Context) {
	namespace := c.Param("namespace")
	name := c.Param("name")

	if namespace == "" || name == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Both namespace and name parameters are required",
		})
		return
	}

	// Log the restart attempt
	h.logger.WithFields(logrus.Fields{
		"namespace": namespace,
		"pod": name,
		"action": "restart",
		"user": c.GetString("user"), // Would be populated by auth middleware
	}).Info("Pod restart requested")

	err := h.k8sService.RestartPod(namespace, name)
	if err != nil {
		h.logger.WithError(err).WithFields(logrus.Fields{
			"namespace": namespace,
			"pod": name,
		}).Error("Failed to restart pod")
		
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to restart pod",
			"details": err.Error(),
		})
		return
	}

	h.logger.WithFields(logrus.Fields{
		"namespace": namespace,
		"pod": name,
	}).Info("Pod restart initiated")

	c.JSON(http.StatusOK, gin.H{
		"message": "Pod restart initiated",
		"pod": name,
		"namespace": namespace,
	})
}