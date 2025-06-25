package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

// HealthCheck handles GET /health
func HealthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":    "healthy",
		"service":   "k8s-monitor",
		"version":   "1.0.0",
		"timestamp": time.Now().UTC(),
		"uptime":    time.Since(startTime).String(),
	})
}

var startTime = time.Now()