package config

import (
	"os"
	"strconv"
	"strings"

	"github.com/spf13/viper"
)

// Config holds all configuration for the application
type Config struct {
	Server     ServerConfig     `mapstructure:"server"`
	Kubernetes KubernetesConfig `mapstructure:"kubernetes"`
	CORS       CORSConfig       `mapstructure:"cors"`
	Logging    LoggingConfig    `mapstructure:"logging"`
}

// ServerConfig holds HTTP server configuration
type ServerConfig struct {
	Port         int    `mapstructure:"port"`
	Mode         string `mapstructure:"mode"`
	ReadTimeout  int    `mapstructure:"read_timeout"`
	WriteTimeout int    `mapstructure:"write_timeout"`
	IdleTimeout  int    `mapstructure:"idle_timeout"`
}

// KubernetesConfig holds Kubernetes client configuration
type KubernetesConfig struct {
	InCluster      bool   `mapstructure:"in_cluster"`
	ConfigPath     string `mapstructure:"config_path"`
	DefaultCluster string `mapstructure:"default_cluster"`
	Namespaces     struct {
		Allowed []string `mapstructure:"allowed"`
		Exclude []string `mapstructure:"exclude"`
	} `mapstructure:"namespaces"`
}

// CORSConfig holds CORS configuration
type CORSConfig struct {
	AllowedOrigins   []string `mapstructure:"allowed_origins"`
	AllowedMethods   []string `mapstructure:"allowed_methods"`
	AllowedHeaders   []string `mapstructure:"allowed_headers"`
	ExposedHeaders   []string `mapstructure:"exposed_headers"`
	AllowCredentials bool     `mapstructure:"allow_credentials"`
	MaxAge           int      `mapstructure:"max_age"`
}

// LoggingConfig holds logging configuration
type LoggingConfig struct {
	Level  string `mapstructure:"level"`
	Format string `mapstructure:"format"`
}

// Load reads configuration from environment variables and config files
func Load() (*Config, error) {
	// Set defaults
	viper.SetDefault("server.port", 8080)
	viper.SetDefault("server.mode", "development")
	viper.SetDefault("server.read_timeout", 30)
	viper.SetDefault("server.write_timeout", 30)
	viper.SetDefault("server.idle_timeout", 60)

	viper.SetDefault("kubernetes.in_cluster", false)
	viper.SetDefault("kubernetes.config_path", "")
	viper.SetDefault("kubernetes.default_cluster", "default")

	viper.SetDefault("cors.allowed_origins", []string{"http://localhost:3000", "http://localhost:5173"})
	viper.SetDefault("cors.allowed_methods", []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"})
	viper.SetDefault("cors.allowed_headers", []string{"Origin", "Content-Type", "Accept", "Authorization"})
	viper.SetDefault("cors.exposed_headers", []string{})
	viper.SetDefault("cors.allow_credentials", true)
	viper.SetDefault("cors.max_age", 12)

	viper.SetDefault("logging.level", "info")
	viper.SetDefault("logging.format", "json")

	// Environment variable mapping
	viper.SetEnvPrefix("K8S_DASHBOARD")
	viper.AutomaticEnv()
	viper.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))

	// Bind specific environment variables
	bindEnvVars()

	// Try to read config file
	viper.SetConfigName("config")
	viper.SetConfigType("yaml")
	viper.AddConfigPath(".")
	viper.AddConfigPath("/etc/k8s-dashboard/")
	viper.AddConfigPath("$HOME/.k8s-dashboard")

	// Read config file if it exists
	if err := viper.ReadInConfig(); err != nil {
		// Config file not found is OK - we'll use defaults and env vars
		if _, ok := err.(viper.ConfigFileNotFoundError); !ok {
			return nil, err
		}
	}

	var config Config
	if err := viper.Unmarshal(&config); err != nil {
		return nil, err
	}

	return &config, nil
}

// bindEnvVars binds environment variables to configuration keys
func bindEnvVars() {
	// Server configuration
	viper.BindEnv("server.port", "PORT", "K8S_DASHBOARD_SERVER_PORT")
	viper.BindEnv("server.mode", "GIN_MODE", "K8S_DASHBOARD_SERVER_MODE")

	// Kubernetes configuration
	viper.BindEnv("kubernetes.in_cluster", "K8S_DASHBOARD_KUBERNETES_IN_CLUSTER")
	viper.BindEnv("kubernetes.config_path", "KUBECONFIG", "K8S_DASHBOARD_KUBERNETES_CONFIG_PATH")

	// CORS configuration
	viper.BindEnv("cors.allowed_origins", "K8S_DASHBOARD_CORS_ALLOWED_ORIGINS")

	// Logging configuration
	viper.BindEnv("logging.level", "LOG_LEVEL", "K8S_DASHBOARD_LOGGING_LEVEL")
	viper.BindEnv("logging.format", "LOG_FORMAT", "K8S_DASHBOARD_LOGGING_FORMAT")

	// Handle special environment variables that need parsing
	if origins := os.Getenv("ALLOWED_ORIGINS"); origins != "" {
		viper.Set("cors.allowed_origins", strings.Split(origins, ","))
	}

	if port := os.Getenv("PORT"); port != "" {
		if p, err := strconv.Atoi(port); err == nil {
			viper.Set("server.port", p)
		}
	}

	if inCluster := os.Getenv("IN_CLUSTER"); inCluster != "" {
		if ic, err := strconv.ParseBool(inCluster); err == nil {
			viper.Set("kubernetes.in_cluster", ic)
		}
	}
}
