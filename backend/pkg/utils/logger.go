package utils

import (
	"os"

	"github.com/sirupsen/logrus"
)

// NewLogger creates a new configured logger instance
func NewLogger() *logrus.Logger {
	logger := logrus.New()

	// Set output to stdout
	logger.SetOutput(os.Stdout)

	// Configure log level from environment
	level := os.Getenv("LOG_LEVEL")
	switch level {
	case "debug":
		logger.SetLevel(logrus.DebugLevel)
	case "info":
		logger.SetLevel(logrus.InfoLevel)
	case "warn":
		logger.SetLevel(logrus.WarnLevel)
	case "error":
		logger.SetLevel(logrus.ErrorLevel)
	default:
		logger.SetLevel(logrus.InfoLevel)
	}

	// Configure log format from environment
	format := os.Getenv("LOG_FORMAT")
	switch format {
	case "json":
		logger.SetFormatter(&logrus.JSONFormatter{
			TimestampFormat: "2006-01-02T15:04:05.000Z07:00",
		})
	case "text":
		logger.SetFormatter(&logrus.TextFormatter{
			FullTimestamp:   true,
			TimestampFormat: "2006-01-02T15:04:05.000Z07:00",
		})
	default:
		// Default to JSON for production readiness
		logger.SetFormatter(&logrus.JSONFormatter{
			TimestampFormat: "2006-01-02T15:04:05.000Z07:00",
		})
	}

	return logger
}

// WithFields creates a logger with predefined fields
func WithFields(logger *logrus.Logger, fields logrus.Fields) *logrus.Entry {
	return logger.WithFields(fields)
}

// WithComponent creates a logger with component field
func WithComponent(logger *logrus.Logger, component string) *logrus.Entry {
	return logger.WithField("component", component)
}

// WithNamespace creates a logger with namespace field
func WithNamespace(logger *logrus.Logger, namespace string) *logrus.Entry {
	return logger.WithField("namespace", namespace)
}

// WithPod creates a logger with pod-related fields
func WithPod(logger *logrus.Logger, namespace, podName string) *logrus.Entry {
	return logger.WithFields(logrus.Fields{
		"namespace": namespace,
		"pod":       podName,
	})
}

// WithApplication creates a logger with application-related fields
func WithApplication(logger *logrus.Logger, namespace, appName string) *logrus.Entry {
	return logger.WithFields(logrus.Fields{
		"namespace":   namespace,
		"application": appName,
	})
}

// WithK8sError creates a logger with Kubernetes error context
func WithK8sError(logger *logrus.Logger, operation string, err error) *logrus.Entry {
	return logger.WithFields(logrus.Fields{
		"operation": operation,
		"error":     err.Error(),
		"component": "kubernetes-client",
	})
}
