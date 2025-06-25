package models

import "time"

// Application represents a grouped set of pods/deployments from developer perspective
type Application struct {
	Name               string            `json:"name"`
	Namespace          string            `json:"namespace"`
	Status             ApplicationStatus `json:"status"`
	Pods               []PodStatus       `json:"pods"`
	ExpectedReplicas   int32             `json:"expected_replicas"`
	AvailableReplicas  int32             `json:"available_replicas"`
	HealthEndpoint     string            `json:"health_endpoint,omitempty"`
	Labels             map[string]string `json:"labels"`
	BusinessContext    BusinessContext   `json:"business_context,omitempty"`
	LastUpdated        time.Time         `json:"last_updated"`
	DeploymentStrategy string            `json:"deployment_strategy,omitempty"`
}

// ApplicationStatus represents the aggregated health status
type ApplicationStatus string

const (
	StatusHealthy   ApplicationStatus = "healthy"
	StatusDegraded  ApplicationStatus = "degraded"
	StatusUnhealthy ApplicationStatus = "unhealthy"
	StatusUnknown   ApplicationStatus = "unknown"
)

// BusinessContext provides additional context for application importance
type BusinessContext struct {
	IsDemo       bool   `json:"is_demo"`
	ClientFacing bool   `json:"client_facing"`
	Team         string `json:"team"`
	Environment  string `json:"environment"`
	Priority     string `json:"priority"` // high, medium, low
}

// Event represents an application-level event
type Event struct {
	ID          string    `json:"id"`
	Type        string    `json:"type"`
	Application string    `json:"application"`
	Namespace   string    `json:"namespace"`
	Message     string    `json:"message"`
	Timestamp   time.Time `json:"timestamp"`
	Severity    string    `json:"severity"` // info, warning, error, critical
}

// HealthSummary provides overview metrics
type HealthSummary struct {
	TotalApplications   int32             `json:"total_applications"`
	HealthyApplications int32             `json:"healthy_applications"`
	TotalPods          int32             `json:"total_pods"`
	RunningPods        int32             `json:"running_pods"`
	StatusBreakdown    map[string]int32  `json:"status_breakdown"`
	LastUpdated        time.Time         `json:"last_updated"`
}

// CalculateApplicationStatus determines overall application health
func CalculateApplicationStatus(pods []PodStatus, expectedReplicas int32) ApplicationStatus {
	if len(pods) == 0 {
		return StatusUnknown
	}

	runningPods := int32(0)
	readyPods := int32(0)
	
	for _, pod := range pods {
		if pod.Status == "Running" {
			runningPods++
			if pod.Ready {
				readyPods++
			}
		}
	}

	// All expected pods running and ready
	if readyPods == expectedReplicas && runningPods == expectedReplicas {
		return StatusHealthy
	}

	// Some pods running but not all expected
	if readyPods > 0 && readyPods < expectedReplicas {
		return StatusDegraded
	}

	// No pods ready
	if readyPods == 0 {
		return StatusUnhealthy
	}

	return StatusUnknown
}