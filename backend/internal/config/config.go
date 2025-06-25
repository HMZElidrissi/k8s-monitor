package config

import (
	"os"
	"strconv"
)

// Config holds all configuration for the application
type Config struct {
	Port        int    `json:"port"`
	Environment string `json:"environment"`
	KubeConfig  string `json:"kube_config"`
	LogLevel    string `json:"log_level"`
}

// Load reads configuration from environment variables with defaults
func Load() (*Config, error) {
	cfg := &Config{
		Port:        getEnvAsInt("PORT", 8080),
		Environment: getEnvAsString("ENVIRONMENT", "development"),
		KubeConfig:  getEnvAsString("KUBECONFIG", ""),
		LogLevel:    getEnvAsString("LOG_LEVEL", "info"),
	}

	return cfg, nil
}

// getEnvAsString gets environment variable as string with fallback
func getEnvAsString(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

// getEnvAsInt gets environment variable as int with fallback
func getEnvAsInt(key string, fallback int) int {
	if value := os.Getenv(key); value != "" {
		if intVal, err := strconv.Atoi(value); err == nil {
			return intVal
		}
	}
	return fallback
}