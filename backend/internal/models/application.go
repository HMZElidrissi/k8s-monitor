package models

import (
	"time"
)

// Application represents an application composed of multiple Kubernetes resources
type Application struct {
	Name        string             `json:"name"`
	Namespace   string             `json:"namespace"`
	Status      string             `json:"status"` // healthy, degraded, unhealthy, unknown
	Type        string             `json:"type"`   // deployment, statefulset, daemonset, standalone
	Version     string             `json:"version,omitempty"`
	Labels      map[string]string  `json:"labels,omitempty"`
	Annotations map[string]string  `json:"annotations,omitempty"`
	Pods        []PodStatus        `json:"pods"`
	Services    []ServiceInfo      `json:"services,omitempty"`
	Summary     ApplicationSummary `json:"summary"`
	CreatedAt   time.Time          `json:"createdAt"`
	UpdatedAt   time.Time          `json:"updatedAt"`
}

// ApplicationSummary provides aggregated statistics for an application
type ApplicationSummary struct {
	TotalPods    int `json:"totalPods"`
	ReadyPods    int `json:"readyPods"`
	RunningPods  int `json:"runningPods"`
	PendingPods  int `json:"pendingPods"`
	FailedPods   int `json:"failedPods"`
	RestartCount int `json:"restartCount"`
}

// ServiceInfo represents basic information about a Kubernetes service
type ServiceInfo struct {
	Name        string            `json:"name"`
	Type        string            `json:"type"`
	ClusterIP   string            `json:"clusterIP,omitempty"`
	ExternalIP  []string          `json:"externalIP,omitempty"`
	Ports       []ServicePort     `json:"ports,omitempty"`
	Labels      map[string]string `json:"labels,omitempty"`
	Annotations map[string]string `json:"annotations,omitempty"`
}

// ServicePort represents a port exposed by a service
type ServicePort struct {
	Name       string `json:"name,omitempty"`
	Port       int32  `json:"port"`
	TargetPort string `json:"targetPort,omitempty"`
	Protocol   string `json:"protocol"`
	NodePort   int32  `json:"nodePort,omitempty"`
}

// ApplicationsResponse represents the response for application list endpoints
type ApplicationsResponse struct {
	Applications []Application       `json:"applications"`
	Total        int                 `json:"total"`
	Namespace    string              `json:"namespace,omitempty"`
	Summary      ApplicationsSummary `json:"summary"`
}

// ApplicationsSummary provides aggregated statistics across all applications
type ApplicationsSummary struct {
	Healthy     int `json:"healthy"`
	Degraded    int `json:"degraded"`
	Unhealthy   int `json:"unhealthy"`
	Unknown     int `json:"unknown"`
	TotalPods   int `json:"totalPods"`
	ReadyPods   int `json:"readyPods"`
	RunningPods int `json:"runningPods"`
}

// ApplicationStatus represents possible application health states
type ApplicationStatus string

const (
	StatusHealthy   ApplicationStatus = "healthy"
	StatusDegraded  ApplicationStatus = "degraded"
	StatusUnhealthy ApplicationStatus = "unhealthy"
	StatusUnknown   ApplicationStatus = "unknown"
)

// ApplicationType represents the type of Kubernetes workload
type ApplicationType string

const (
	TypeDeployment  ApplicationType = "deployment"
	TypeStatefulSet ApplicationType = "statefulset"
	TypeDaemonSet   ApplicationType = "daemonset"
	TypeStandalone  ApplicationType = "standalone"
	TypeJob         ApplicationType = "job"
	TypeCronJob     ApplicationType = "cronjob"
)

// DetermineApplicationStatus calculates the overall health status of an application
func DetermineApplicationStatus(pods []PodStatus) ApplicationStatus {
	if len(pods) == 0 {
		return StatusUnknown
	}

	var running, ready, failed, pending int
	for _, pod := range pods {
		switch pod.Status {
		case "Running":
			running++
			if pod.Ready {
				ready++
			}
		case "Failed":
			failed++
		case "Pending":
			pending++
		}
	}

	totalPods := len(pods)

	// All pods are running and ready
	if ready == totalPods {
		return StatusHealthy
	}

	// Some pods are failed
	if failed > 0 {
		return StatusUnhealthy
	}

	// Some pods are pending or not ready, but none failed
	if pending > 0 || ready < running {
		return StatusDegraded
	}

	// Fallback to unknown
	return StatusUnknown
}

// DetermineApplicationType determines the application type based on owner references
func DetermineApplicationType(pods []PodStatus) ApplicationType {
	if len(pods) == 0 {
		return TypeStandalone
	}

	// Check the first pod's owner kind (assuming all pods have the same owner type)
	firstPod := pods[0]
	switch firstPod.OwnerKind {
	case "ReplicaSet":
		// ReplicaSet is typically owned by a Deployment
		return TypeDeployment
	case "StatefulSet":
		return TypeStatefulSet
	case "DaemonSet":
		return TypeDaemonSet
	case "Job":
		return TypeJob
	case "CronJob":
		return TypeCronJob
	default:
		return TypeStandalone
	}
}

// CalculateApplicationSummary generates summary statistics for an application
func CalculateApplicationSummary(pods []PodStatus) ApplicationSummary {
	summary := ApplicationSummary{
		TotalPods: len(pods),
	}

	for _, pod := range pods {
		if pod.Ready {
			summary.ReadyPods++
		}

		switch pod.Status {
		case "Running":
			summary.RunningPods++
		case "Pending":
			summary.PendingPods++
		case "Failed":
			summary.FailedPods++
		}

		summary.RestartCount += int(pod.Restarts)
	}

	return summary
}

// GetApplicationVersion tries to extract version information from labels or annotations
func GetApplicationVersion(labels, annotations map[string]string) string {
	// Try different common label/annotation keys for version
	versionKeys := []string{
		"app.kubernetes.io/version",
		"version",
		"app.version",
		"helm.sh/chart",
	}

	// Check labels first
	for _, key := range versionKeys {
		if value, exists := labels[key]; exists && value != "" {
			return value
		}
	}

	// Check annotations
	for _, key := range versionKeys {
		if value, exists := annotations[key]; exists && value != "" {
			return value
		}
	}

	return ""
}
