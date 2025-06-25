package utils

import (
	"os"

	"github.com/sirupsen/logrus"
)

// NewLogger creates a new structured logger
func NewLogger() *logrus.Logger {
	logger := logrus.New()
	
	// Set output to stdout
	logger.SetOutput(os.Stdout)
	
	// Set log level from environment or default to info
	level := os.Getenv("LOG_LEVEL")
	switch level {
	case "debug":
		logger.SetLevel(logrus.DebugLevel)
	case "warn":
		logger.SetLevel(logrus.WarnLevel)
	case "error":
		logger.SetLevel(logrus.ErrorLevel)
	default:
		logger.SetLevel(logrus.InfoLevel)
	}
	
	// Use JSON formatter for structured logging
	logger.SetFormatter(&logrus.JSONFormatter{
		TimestampFormat: "2006-01-02T15:04:05.000Z",
		FieldMap: logrus.FieldMap{
			logrus.FieldKeyTime:  "timestamp",
			logrus.FieldKeyLevel: "level",
			logrus.FieldKeyMsg:   "message",
		},
	})
	
	return logger
}