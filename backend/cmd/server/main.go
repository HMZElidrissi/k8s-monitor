// @title           k8s-monitor API
// @version         1.0
// @description     API for monitoring Kubernetes clusters with application-centric visibility
// @termsOfService  http://swagger.io/terms/

// @contact.name   API Support
// @contact.url    http://www.swagger.io/support
// @contact.email  support@swagger.io

// @license.name  Apache 2.0
// @license.url   http://www.apache.org/licenses/LICENSE-2.0.html

// @host      localhost:8080
// @BasePath  /

// @externalDocs.description  OpenAPI
// @externalDocs.url          https://swagger.io/resources/open-api/

package main

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"

	"k8s-monitor/internal/config"
	"k8s-monitor/internal/handlers"
	"k8s-monitor/internal/middleware"
	"k8s-monitor/internal/services"
	"k8s-monitor/pkg/utils"
)

func main() {
	// Initialize logger
	logger := utils.NewLogger()
	logger.Info("Starting Kubernetes Dashboard API Server...")

	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		logger.WithError(err).Fatal("Failed to load configuration")
	}

	// Initialize Kubernetes service
	k8sService, err := services.NewKubernetesService(cfg.Kubernetes)
	if err != nil {
		logger.WithError(err).Fatal("Failed to initialize Kubernetes service")
	}

	// Initialize application service
	appService := services.NewApplicationService(k8sService, logger)

	// Setup Gin router
	if cfg.Server.Mode == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	router := gin.New()

	// Add middleware
	router.Use(gin.Recovery())
	router.Use(middleware.Logger(logger))
	router.Use(cors.New(cors.Config{
		AllowOrigins:     cfg.CORS.AllowedOrigins,
		AllowMethods:     cfg.CORS.AllowedMethods,
		AllowHeaders:     cfg.CORS.AllowedHeaders,
		ExposeHeaders:    cfg.CORS.ExposedHeaders,
		AllowCredentials: cfg.CORS.AllowCredentials,
		MaxAge:           time.Duration(cfg.CORS.MaxAge) * time.Hour,
	}))

	// Initialize handlers
	healthHandler := handlers.NewHealthHandler(k8sService, logger)
	podHandler := handlers.NewPodHandler(k8sService, logger)
	appHandler := handlers.NewApplicationHandler(appService, logger)
	docsHandler := handlers.NewDocsHandler()

	// Setup routes
	setupRoutes(router, healthHandler, podHandler, appHandler, docsHandler)

	// Create HTTP server
	server := &http.Server{
		Addr:         fmt.Sprintf(":%d", cfg.Server.Port),
		Handler:      router,
		ReadTimeout:  time.Duration(cfg.Server.ReadTimeout) * time.Second,
		WriteTimeout: time.Duration(cfg.Server.WriteTimeout) * time.Second,
		IdleTimeout:  time.Duration(cfg.Server.IdleTimeout) * time.Second,
	}

	// Start server in goroutine
	go func() {
		logger.WithField("port", cfg.Server.Port).Info("Server starting")
		if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			logger.WithError(err).Fatal("Failed to start server")
		}
	}()

	// Wait for interrupt signal for graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logger.Info("Shutting down server...")

	// Graceful shutdown with 30 second timeout
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		logger.WithError(err).Error("Server forced to shutdown")
	} else {
		logger.Info("Server shutdown complete")
	}
}

// setupRoutes configures all API routes
func setupRoutes(
	router *gin.Engine,
	healthHandler *handlers.HealthHandler,
	podHandler *handlers.PodHandler,
	appHandler *handlers.ApplicationHandler,
	docsHandler *handlers.DocsHandler,
) {
	// Health check endpoint
	router.GET("/health", healthHandler.Check)

	// API documentation endpoints
	router.GET("/docs", docsHandler.ScalarUI)
	router.GET("/docs/", docsHandler.ScalarUI)
	router.StaticFile("/docs/swagger.json", "./docs/swagger.json")
	router.StaticFile("/docs/swagger.yaml", "./docs/swagger.yaml")
	router.GET("/redoc", docsHandler.RedocUI)

	// API v1 routes
	v1 := router.Group("/api/v1")
	{
		// Pod endpoints
		v1.GET("/pods", podHandler.List)
		v1.GET("/pods/:namespace", podHandler.ListByNamespace)

		// Application endpoints
		v1.GET("/applications", appHandler.List)
		v1.GET("/applications/:namespace", appHandler.ListByNamespace)

		// Namespace endpoints
		v1.GET("/namespaces", podHandler.ListNamespaces)
	}
}
