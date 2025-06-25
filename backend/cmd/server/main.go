package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"

	"k8s-monitor/internal/config"
	"k8s-monitor/internal/handlers"
	"k8s-monitor/internal/middleware"
	"k8s-monitor/internal/services"
	"k8s-monitor/pkg/utils"
)

func main() {
	// Initialize logger
	logger := utils.NewLogger()
	logger.Info("Starting K8s Monitor server...")

	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		logger.WithError(err).Fatal("Failed to load configuration")
	}

	// Initialize Kubernetes service
	k8sService, err := services.NewK8sService(cfg)
	if err != nil {
		logger.WithError(err).Fatal("Failed to initialize Kubernetes service")
	}

	// Initialize monitoring service
	monitorService := services.NewMonitorService(k8sService, logger)

	// Initialize application service
	appService := services.NewApplicationService(k8sService, logger)

	// Set Gin mode
	if cfg.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	// Setup router
	router := gin.New()

	// Add middleware
	router.Use(gin.Logger())
	router.Use(gin.Recovery())
	router.Use(middleware.CORS())

	// Setup routes
	setupRoutes(router, k8sService, monitorService, appService, logger)

	// Create HTTP server
	srv := &http.Server{
		Addr:    fmt.Sprintf(":%d", cfg.Port),
		Handler: router,
	}

	// Start server in goroutine
	go func() {
		logger.WithField("port", cfg.Port).Info("Server starting")
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.WithError(err).Fatal("Failed to start server")
		}
	}()

	// Wait for interrupt signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logger.Info("Shutting down server...")

	// Graceful shutdown with timeout
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		logger.WithError(err).Fatal("Server forced to shutdown")
	}

	logger.Info("Server exited")
}

func setupRoutes(
	router *gin.Engine,
	k8sService services.K8sService,
	monitorService *services.MonitorService,
	appService *services.ApplicationService,
	logger *logrus.Logger,
) {
	// Health check endpoint
	router.GET("/health", handlers.HealthCheck)

	// API routes
	api := router.Group("/api/v1")
	{
		// Pod endpoints
		podHandler := handlers.NewPodHandler(k8sService, logger)
		api.GET("/pods", podHandler.GetPods)
		api.GET("/pods/:namespace", podHandler.GetPodsByNamespace)
		api.GET("/pods/:namespace/:name", podHandler.GetPod)
		api.DELETE("/pods/:namespace/:name", podHandler.RestartPod)

		// Application endpoints
		appHandler := handlers.NewApplicationHandler(appService, logger)
		api.GET("/applications", appHandler.GetApplications)
		api.GET("/applications/:namespace", appHandler.GetApplicationsByNamespace)

		// WebSocket endpoint for real-time updates
		wsHandler := handlers.NewWebSocketHandler(monitorService, logger)
		api.GET("/ws", wsHandler.HandleWebSocket)
	}

	// Serve static files (frontend)
	router.Static("/static", "./web/static")
	router.StaticFile("/", "./web/index.html")
	router.NoRoute(func(c *gin.Context) {
		c.File("./web/index.html")
	})
}
