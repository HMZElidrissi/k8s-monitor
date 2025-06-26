package middleware

import (
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

// Logger returns a gin.HandlerFunc that logs HTTP requests using the provided logger
func Logger(logger *logrus.Logger) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Start timer
		start := time.Now()
		path := c.Request.URL.Path
		raw := c.Request.URL.RawQuery

		// Process request
		c.Next()

		// Calculate latency
		latency := time.Since(start)

		// Get request details
		clientIP := c.ClientIP()
		method := c.Request.Method
		statusCode := c.Writer.Status()
		userAgent := c.Request.UserAgent()

		if raw != "" {
			path = path + "?" + raw
		}

		// Create log entry
		entry := logger.WithFields(logrus.Fields{
			"status":     statusCode,
			"latency":    latency,
			"client_ip":  clientIP,
			"method":     method,
			"path":       path,
			"user_agent": userAgent,
			"component":  "http-server",
		})

		// Add error information if present
		if len(c.Errors) > 0 {
			entry = entry.WithField("errors", c.Errors.String())
		}

		// Log with appropriate level based on status code
		switch {
		case statusCode >= 400 && statusCode < 500:
			entry.Warn("HTTP request completed with client error")
		case statusCode >= 500:
			entry.Error("HTTP request completed with server error")
		case statusCode >= 300 && statusCode < 400:
			entry.Info("HTTP request completed with redirect")
		default:
			entry.Info("HTTP request completed")
		}
	}
}

// RequestID middleware adds a unique request ID to each request
func RequestID() gin.HandlerFunc {
	return func(c *gin.Context) {
		requestID := c.GetHeader("X-Request-ID")
		if requestID == "" {
			requestID = generateRequestID()
		}

		c.Header("X-Request-ID", requestID)
		c.Set("request_id", requestID)
		c.Next()
	}
}

// generateRequestID generates a simple request ID (in production, use a more robust method)
func generateRequestID() string {
	return time.Now().Format("20060102150405") + "-" + string(rune(time.Now().Nanosecond()%1000))
}
