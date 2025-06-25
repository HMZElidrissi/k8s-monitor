package services

import (
	"fmt"
	"strings"
	"time"

	"github.com/sirupsen/logrus"

	"k8s-monitor/internal/models"
)

// ApplicationService handles application-level operations
type ApplicationService struct {
	k8sService K8sService
	logger     *logrus.Logger
}

// NewApplicationService creates a new application service
func NewApplicationService(k8sService K8sService, logger *logrus.Logger) *ApplicationService {
	return &ApplicationService{
		k8sService: k8sService,
		logger:     logger,
	}
}

// GetApplications retrieves all applications across all namespaces
func (a *ApplicationService) GetApplications() ([]models.Application, error) {
	namespaces, err := a.k8sService.GetNamespaces()
	if err != nil {
		return nil, fmt.Errorf("failed to get namespaces: %w", err)
	}

	var allApplications []models.Application
	for _, namespace := range namespaces {
		// Skip system namespaces
		if a.isSystemNamespace(namespace) {
			continue
		}

		apps, err := a.GetApplicationsByNamespace(namespace)
		if err != nil {
			a.logger.WithError(err).WithField("namespace", namespace).Warning("Failed to get applications for namespace")
			continue
		}

		allApplications = append(allApplications, apps...)
	}

	return allApplications, nil
}

// GetApplicationsByNamespace retrieves applications in a specific namespace
func (a *ApplicationService) GetApplicationsByNamespace(namespace string) ([]models.Application, error) {
	pods, err := a.k8sService.GetPods(namespace)
	if err != nil {
		return nil, fmt.Errorf("failed to get pods for namespace %s: %w", namespace, err)
	}

	// Group pods by application
	appGroups := a.groupPodsByApplication(pods)
	
	var applications []models.Application
	for appName, appPods := range appGroups {
		app := a.buildApplication(appName, namespace, appPods)
		applications = append(applications, app)
	}

	return applications, nil
}

// groupPodsByApplication groups pods by their application label or name pattern
func (a *ApplicationService) groupPodsByApplication(pods []models.PodStatus) map[string][]models.PodStatus {
	groups := make(map[string][]models.PodStatus)

	for _, pod := range pods {
		appName := a.determineApplicationName(pod)
		groups[appName] = append(groups[appName], pod)
	}

	return groups
}

// determineApplicationName extracts application name from pod labels or name
func (a *ApplicationService) determineApplicationName(pod models.PodStatus) string {
	// Try common application labels
	if appLabel, exists := pod.Labels["app"]; exists {
		return appLabel
	}
	
	if appLabel, exists := pod.Labels["app.kubernetes.io/name"]; exists {
		return appLabel
	}

	if appLabel, exists := pod.Labels["k8s-app"]; exists {
		return appLabel
	}

	// Fall back to extracting from pod name (remove replica set suffix)
	name := pod.Name
	
	// Remove replica set suffix pattern (e.g., -7d4c8f9b8-x2k9m)
	if idx := strings.LastIndex(name, "-"); idx > 0 {
		beforeDash := name[:idx]
		if idx2 := strings.LastIndex(beforeDash, "-"); idx2 > 0 {
			// Check if it looks like a replica set hash
			suffix := beforeDash[idx2+1:]
			if len(suffix) >= 8 && a.isAlphaNumeric(suffix) {
				return beforeDash[:idx2]
			}
		}
	}

	return name
}

// buildApplication creates an Application model from grouped pods
func (a *ApplicationService) buildApplication(name, namespace string, pods []models.PodStatus) models.Application {
	app := models.Application{
		Name:        name,
		Namespace:   namespace,
		Pods:        pods,
		LastUpdated: time.Now(),
	}

	// Calculate replicas
	app.AvailableReplicas = int32(len(pods))
	app.ExpectedReplicas = a.calculateExpectedReplicas(pods)

	// Calculate overall status
	app.Status = models.CalculateApplicationStatus(pods, app.ExpectedReplicas)

	// Extract labels from first pod (assuming consistent labeling)
	if len(pods) > 0 {
		app.Labels = pods[0].Labels
	}

	// Determine business context
	app.BusinessContext = a.determineBusinessContext(namespace, name, app.Labels)

	return app
}

// calculateExpectedReplicas estimates expected replicas based on current pods
func (a *ApplicationService) calculateExpectedReplicas(pods []models.PodStatus) int32 {
	// This is a simplified approach - in a real implementation,
	// we would query the deployment/replicaset to get the actual desired count
	
	runningOrStarting := int32(0)
	for _, pod := range pods {
		if pod.Status == "Running" || pod.Status == "Starting" || pod.Status == "Pending" {
			runningOrStarting++
		}
	}

	// Return at least 1, and assume current running count is expected
	if runningOrStarting == 0 {
		return 1
	}
	
	return runningOrStarting
}

// determineBusinessContext infers business context from labels and namespace
func (a *ApplicationService) determineBusinessContext(namespace, appName string, labels map[string]string) models.BusinessContext {
	context := models.BusinessContext{
		Environment: a.determineEnvironment(namespace),
		Team:        a.determineTeam(labels),
		Priority:    "medium", // Default priority
	}

	// Check if it's a demo environment
	context.IsDemo = strings.Contains(namespace, "demo") || 
					strings.Contains(appName, "demo") ||
					a.hasLabel(labels, "demo", "true")

	// Check if it's client-facing
	context.ClientFacing = a.hasLabel(labels, "client-facing", "true") ||
						  a.hasLabel(labels, "public", "true") ||
						  strings.Contains(appName, "frontend") ||
						  strings.Contains(appName, "web") ||
						  strings.Contains(appName, "api")

	// Determine priority based on context
	if context.ClientFacing {
		context.Priority = "high"
	} else if context.IsDemo {
		context.Priority = "medium"
	}

	return context
}

// determineEnvironment extracts environment from namespace
func (a *ApplicationService) determineEnvironment(namespace string) string {
	switch {
	case strings.Contains(namespace, "prod"):
		return "production"
	case strings.Contains(namespace, "staging") || strings.Contains(namespace, "stage"):
		return "staging"
	case strings.Contains(namespace, "dev"):
		return "development"
	case strings.Contains(namespace, "test"):
		return "testing"
	case namespace == "default":
		return "development"
	default:
		return "unknown"
	}
}

// determineTeam extracts team information from labels
func (a *ApplicationService) determineTeam(labels map[string]string) string {
	if team, exists := labels["team"]; exists {
		return team
	}
	if team, exists := labels["owner"]; exists {
		return team
	}
	return "unknown"
}

// hasLabel checks if a label exists with a specific value
func (a *ApplicationService) hasLabel(labels map[string]string, key, value string) bool {
	if val, exists := labels[key]; exists {
		return val == value
	}
	return false
}

// isAlphaNumeric checks if string contains only alphanumeric characters
func (a *ApplicationService) isAlphaNumeric(s string) bool {
	for _, r := range s {
		if !((r >= 'a' && r <= 'z') || (r >= 'A' && r <= 'Z') || (r >= '0' && r <= '9')) {
			return false
		}
	}
	return true
}

// isSystemNamespace checks if namespace should be excluded from monitoring
func (a *ApplicationService) isSystemNamespace(namespace string) bool {
	systemNamespaces := []string{
		"kube-system",
		"kube-public",
		"kube-node-lease",
		"kubernetes-dashboard",
	}

	for _, sysNs := range systemNamespaces {
		if namespace == sysNs {
			return true
		}
	}

	return false
}