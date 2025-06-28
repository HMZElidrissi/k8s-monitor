package services

import (
	"context"
	"fmt"
	"sort"
	"time"

	"github.com/sirupsen/logrus"
	corev1 "k8s.io/api/core/v1"

	"k8s-monitor/internal/models"
	"k8s-monitor/pkg/utils"
)

// ApplicationService provides application-centric operations
type ApplicationService struct {
	k8sService *KubernetesService
	logger     *logrus.Logger
}

// NewApplicationService creates a new application service instance
func NewApplicationService(k8sService *KubernetesService, logger *logrus.Logger) *ApplicationService {
	return &ApplicationService{
		k8sService: k8sService,
		logger:     logger,
	}
}

// GetApplications retrieves all applications across all accessible namespaces
func (a *ApplicationService) GetApplications(ctx context.Context) (*models.ApplicationsResponse, error) {
	logger := utils.WithComponent(a.logger, "application-service")
	logger.Info("Fetching all applications")

	// Get all pods
	podList, err := a.k8sService.GetAllPods(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get pods: %w", err)
	}

	// Group pods by application
	applicationMap := a.groupPodsByApplication(podList.Items)

	// Convert to application models
	var applications []models.Application
	summary := models.ApplicationsSummary{}

	for appKey, pods := range applicationMap {
		if len(pods) == 0 {
			continue
		}

		// Check if namespace is allowed
		if !a.k8sService.IsNamespaceAllowed(pods[0].Namespace) {
			continue
		}

		app := a.buildApplicationFromPods(ctx, appKey, pods)
		applications = append(applications, app)

		// Update summary
		switch app.Status {
		case string(models.StatusHealthy):
			summary.Healthy++
		case string(models.StatusDegraded):
			summary.Degraded++
		case string(models.StatusUnhealthy):
			summary.Unhealthy++
		default:
			summary.Unknown++
		}

		summary.TotalPods += app.Summary.TotalPods
		summary.ReadyPods += app.Summary.ReadyPods
		summary.RunningPods += app.Summary.RunningPods
	}

	// Sort applications by name
	sort.Slice(applications, func(i, j int) bool {
		if applications[i].Namespace != applications[j].Namespace {
			return applications[i].Namespace < applications[j].Namespace
		}
		return applications[i].Name < applications[j].Name
	})

	response := &models.ApplicationsResponse{
		Applications: applications,
		Total:        len(applications),
		Summary:      summary,
	}

	logger.WithField("total", len(applications)).Info("Successfully fetched applications")
	return response, nil
}

// GetApplicationsByNamespace retrieves applications from a specific namespace
func (a *ApplicationService) GetApplicationsByNamespace(ctx context.Context, namespace string) (*models.ApplicationsResponse, error) {
	logger := utils.WithNamespace(a.logger, namespace)
	logger.Info("Fetching applications by namespace")

	// Check if namespace is allowed
	if !a.k8sService.IsNamespaceAllowed(namespace) {
		return nil, fmt.Errorf("access to namespace '%s' not allowed", namespace)
	}

	// Get pods from the specified namespace
	podList, err := a.k8sService.GetPods(ctx, namespace)
	if err != nil {
		return nil, fmt.Errorf("failed to get pods from namespace %s: %w", namespace, err)
	}

	// Group pods by application
	applicationMap := a.groupPodsByApplication(podList.Items)

	// Convert to application models
	var applications []models.Application
	summary := models.ApplicationsSummary{}

	for appKey, pods := range applicationMap {
		if len(pods) == 0 {
			continue
		}

		app := a.buildApplicationFromPods(ctx, appKey, pods)
		applications = append(applications, app)

		// Update summary
		switch app.Status {
		case string(models.StatusHealthy):
			summary.Healthy++
		case string(models.StatusDegraded):
			summary.Degraded++
		case string(models.StatusUnhealthy):
			summary.Unhealthy++
		default:
			summary.Unknown++
		}

		summary.TotalPods += app.Summary.TotalPods
		summary.ReadyPods += app.Summary.ReadyPods
		summary.RunningPods += app.Summary.RunningPods
	}

	// Sort applications by name
	sort.Slice(applications, func(i, j int) bool {
		return applications[i].Name < applications[j].Name
	})

	response := &models.ApplicationsResponse{
		Applications: applications,
		Total:        len(applications),
		Namespace:    namespace,
		Summary:      summary,
	}

	logger.WithField("total", len(applications)).Info("Successfully fetched applications by namespace")
	return response, nil
}

// applicationKey represents a unique identifier for an application
type applicationKey struct {
	namespace string
	name      string
}

// groupPodsByApplication groups pods by their application identity
func (a *ApplicationService) groupPodsByApplication(pods []corev1.Pod) map[applicationKey][]corev1.Pod {
	applicationMap := make(map[applicationKey][]corev1.Pod)

	for _, pod := range pods {
		appName := a.extractApplicationName(pod)
		key := applicationKey{
			namespace: pod.Namespace,
			name:      appName,
		}

		applicationMap[key] = append(applicationMap[key], pod)
	}

	return applicationMap
}

// extractApplicationName extracts the application name from a pod using various strategies
func (a *ApplicationService) extractApplicationName(pod corev1.Pod) string {
	// Strategy 1: Check standard application labels
	applicationKeys := []string{
		"app.kubernetes.io/name",
		"app.kubernetes.io/instance",
		"app",
		"application",
		"k8s-app",
	}

	for _, key := range applicationKeys {
		if value, exists := pod.Labels[key]; exists && value != "" {
			return value
		}
	}

	// Strategy 2: Extract from owner reference
	if len(pod.OwnerReferences) > 0 {
		ownerName := pod.OwnerReferences[0].Name

		// For ReplicaSet, try to get the Deployment name
		if pod.OwnerReferences[0].Kind == "ReplicaSet" {
			// ReplicaSet names typically follow the pattern: deploymentname-randomstring
			if idx := findLastDash(ownerName); idx > 0 {
				return ownerName[:idx]
			}
		}

		return ownerName
	}

	// Strategy 3: Use pod name prefix (before first dash)
	if idx := findFirstDash(pod.Name); idx > 0 {
		return pod.Name[:idx]
	}

	// Fallback: Use the full pod name
	return pod.Name
}

// buildApplicationFromPods creates an Application model from grouped pods
func (a *ApplicationService) buildApplicationFromPods(ctx context.Context, key applicationKey, k8sPods []corev1.Pod) models.Application {
	// Convert k8s pods to our pod models
	var pods []models.PodStatus
	var oldestCreation time.Time
	var newestUpdate time.Time
	var labels map[string]string
	var annotations map[string]string

	for i, k8sPod := range k8sPods {
		podStatus := models.FromK8sPod(&k8sPod)
		pods = append(pods, podStatus)

		// Track creation and update times
		if i == 0 || k8sPod.CreationTimestamp.Time.Before(oldestCreation) {
			oldestCreation = k8sPod.CreationTimestamp.Time
		}

		if k8sPod.Status.StartTime != nil {
			if i == 0 || k8sPod.Status.StartTime.Time.After(newestUpdate) {
				newestUpdate = k8sPod.Status.StartTime.Time
			}
		}

		// Use labels and annotations from the first pod as representative
		if i == 0 {
			labels = k8sPod.Labels
			annotations = k8sPod.Annotations
		}
	}

	// Determine application type
	appType := string(models.DetermineApplicationType(pods))

	// Calculate application status
	status := string(models.DetermineApplicationStatus(pods))

	// Calculate summary
	summary := models.CalculateApplicationSummary(pods)

	// Get version information
	version := models.GetApplicationVersion(labels, annotations)

	// Get services for this application (optional, can be implemented later)
	services := a.getApplicationServices(ctx, key.namespace, key.name)

	return models.Application{
		Name:        key.name,
		Namespace:   key.namespace,
		Status:      status,
		Type:        appType,
		Version:     version,
		Labels:      labels,
		Annotations: annotations,
		Pods:        pods,
		Services:    services,
		Summary:     summary,
		CreatedAt:   oldestCreation,
		UpdatedAt:   newestUpdate,
	}
}

// getApplicationServices retrieves services associated with an application
func (a *ApplicationService) getApplicationServices(ctx context.Context, namespace, appName string) []models.ServiceInfo {
	// Get services in the namespace
	serviceList, err := a.k8sService.GetServices(ctx, namespace)
	if err != nil {
		// Log error but don't fail the whole operation
		utils.WithApplication(a.logger, namespace, appName).
			WithError(err).Warn("Failed to get services for application")
		return nil
	}

	var services []models.ServiceInfo
	for _, svc := range serviceList.Items {
		// Check if service is related to this application
		if a.isServiceRelatedToApplication(svc, appName) {
			serviceInfo := a.convertServiceToModel(svc)
			services = append(services, serviceInfo)
		}
	}

	return services
}

// isServiceRelatedToApplication checks if a service is related to an application
func (a *ApplicationService) isServiceRelatedToApplication(service corev1.Service, appName string) bool {
	// Check if service has labels that match the application
	applicationKeys := []string{
		"app.kubernetes.io/name",
		"app.kubernetes.io/instance",
		"app",
		"application",
		"k8s-app",
	}

	for _, key := range applicationKeys {
		if value, exists := service.Labels[key]; exists && value == appName {
			return true
		}
	}

	// Check if service name contains the application name
	return service.Name == appName ||
		service.Name == appName+"-service" ||
		service.Name == appName+"-svc"
}

// convertServiceToModel converts a Kubernetes Service to our ServiceInfo model
func (a *ApplicationService) convertServiceToModel(svc corev1.Service) models.ServiceInfo {
	var ports []models.ServicePort
	for _, port := range svc.Spec.Ports {
		servicePort := models.ServicePort{
			Name:       port.Name,
			Port:       port.Port,
			TargetPort: port.TargetPort.String(),
			Protocol:   string(port.Protocol),
			NodePort:   port.NodePort,
		}
		ports = append(ports, servicePort)
	}

	var externalIPs []string
	for _, ip := range svc.Status.LoadBalancer.Ingress {
		if ip.IP != "" {
			externalIPs = append(externalIPs, ip.IP)
		}
		if ip.Hostname != "" {
			externalIPs = append(externalIPs, ip.Hostname)
		}
	}

	return models.ServiceInfo{
		Name:        svc.Name,
		Type:        string(svc.Spec.Type),
		ClusterIP:   svc.Spec.ClusterIP,
		ExternalIP:  externalIPs,
		Ports:       ports,
		Labels:      svc.Labels,
		Annotations: svc.Annotations,
	}
}

// Helper functions
func findFirstDash(s string) int {
	for i, r := range s {
		if r == '-' {
			return i
		}
	}
	return -1
}

func findLastDash(s string) int {
	for i := len(s) - 1; i >= 0; i-- {
		if s[i] == '-' {
			return i
		}
	}
	return -1
}
