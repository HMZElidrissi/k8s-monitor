package models

import (
	"fmt"
	"time"

	corev1 "k8s.io/api/core/v1"
)

// PodStatus represents the status information of a Kubernetes pod
type PodStatus struct {
	Name        string            `json:"name"`
	Namespace   string            `json:"namespace"`
	Status      string            `json:"status"`
	Ready       bool              `json:"ready"`
	Restarts    int32             `json:"restarts"`
	Age         string            `json:"age"`
	CreatedAt   time.Time         `json:"createdAt"`
	Node        string            `json:"node,omitempty"`
	IP          string            `json:"ip,omitempty"`
	Labels      map[string]string `json:"labels,omitempty"`
	Annotations map[string]string `json:"annotations,omitempty"`
	Containers  []ContainerStatus `json:"containers"`
	Conditions  []PodCondition    `json:"conditions,omitempty"`
	OwnerKind   string            `json:"ownerKind,omitempty"`
	OwnerName   string            `json:"ownerName,omitempty"`
	Application string            `json:"application,omitempty"`
}

// ContainerStatus represents the status of a container within a pod
type ContainerStatus struct {
	Name         string `json:"name"`
	Ready        bool   `json:"ready"`
	RestartCount int32  `json:"restartCount"`
	Image        string `json:"image"`
	State        string `json:"state"`
	LastRestart  string `json:"lastRestart,omitempty"`
}

// PodCondition represents a pod condition
type PodCondition struct {
	Type               string    `json:"type"`
	Status             string    `json:"status"`
	LastTransitionTime time.Time `json:"lastTransitionTime"`
	Reason             string    `json:"reason,omitempty"`
	Message            string    `json:"message,omitempty"`
}

// PodListResponse represents the response for pod list endpoints
type PodListResponse struct {
	Pods      []PodStatus `json:"pods"`
	Total     int         `json:"total"`
	Namespace string      `json:"namespace,omitempty"`
	Summary   PodSummary  `json:"summary"`
}

// PodSummary provides aggregated statistics about pods
type PodSummary struct {
	Running   int `json:"running"`
	Pending   int `json:"pending"`
	Succeeded int `json:"succeeded"`
	Failed    int `json:"failed"`
	Unknown   int `json:"unknown"`
}

// NamespaceInfo represents information about a Kubernetes namespace
type NamespaceInfo struct {
	Name        string            `json:"name"`
	Status      string            `json:"status"`
	Age         string            `json:"age"`
	CreatedAt   time.Time         `json:"createdAt"`
	Labels      map[string]string `json:"labels,omitempty"`
	Annotations map[string]string `json:"annotations,omitempty"`
	PodCount    int               `json:"podCount,omitempty"`
}

// NamespaceListResponse represents the response for namespace list endpoints
type NamespaceListResponse struct {
	Namespaces []NamespaceInfo `json:"namespaces"`
	Total      int             `json:"total"`
}

// FromK8sPod converts a Kubernetes Pod object to our PodStatus model
func FromK8sPod(pod *corev1.Pod) PodStatus {
	// Calculate age
	age := time.Since(pod.CreationTimestamp.Time)
	ageStr := formatDuration(age)

	// Determine ready status
	ready := false
	for _, condition := range pod.Status.Conditions {
		if condition.Type == corev1.PodReady {
			ready = condition.Status == corev1.ConditionTrue
			break
		}
	}

	// Calculate total restarts
	var totalRestarts int32
	var containers []ContainerStatus
	for _, containerStatus := range pod.Status.ContainerStatuses {
		totalRestarts += containerStatus.RestartCount

		containerState := "unknown"
		lastRestart := ""

		if containerStatus.State.Running != nil {
			containerState = "running"
		} else if containerStatus.State.Waiting != nil {
			containerState = "waiting"
		} else if containerStatus.State.Terminated != nil {
			containerState = "terminated"
		}

		if containerStatus.LastTerminationState.Terminated != nil {
			lastRestart = containerStatus.LastTerminationState.Terminated.FinishedAt.Format(time.RFC3339)
		}

		containers = append(containers, ContainerStatus{
			Name:         containerStatus.Name,
			Ready:        containerStatus.Ready,
			RestartCount: containerStatus.RestartCount,
			Image:        containerStatus.Image,
			State:        containerState,
			LastRestart:  lastRestart,
		})
	}

	// Convert conditions
	var conditions []PodCondition
	for _, condition := range pod.Status.Conditions {
		conditions = append(conditions, PodCondition{
			Type:               string(condition.Type),
			Status:             string(condition.Status),
			LastTransitionTime: condition.LastTransitionTime.Time,
			Reason:             condition.Reason,
			Message:            condition.Message,
		})
	}

	// Determine owner reference
	ownerKind := ""
	ownerName := ""
	if len(pod.OwnerReferences) > 0 {
		ownerKind = pod.OwnerReferences[0].Kind
		ownerName = pod.OwnerReferences[0].Name
	}

	// Try to determine application name from labels
	application := getApplicationName(pod.Labels)

	return PodStatus{
		Name:        pod.Name,
		Namespace:   pod.Namespace,
		Status:      string(pod.Status.Phase),
		Ready:       ready,
		Restarts:    totalRestarts,
		Age:         ageStr,
		CreatedAt:   pod.CreationTimestamp.Time,
		Node:        pod.Spec.NodeName,
		IP:          pod.Status.PodIP,
		Labels:      pod.Labels,
		Annotations: pod.Annotations,
		Containers:  containers,
		Conditions:  conditions,
		OwnerKind:   ownerKind,
		OwnerName:   ownerName,
		Application: application,
	}
}

// FromK8sNamespace converts a Kubernetes Namespace object to our NamespaceInfo model
func FromK8sNamespace(ns *corev1.Namespace) NamespaceInfo {
	age := time.Since(ns.CreationTimestamp.Time)
	ageStr := formatDuration(age)

	return NamespaceInfo{
		Name:        ns.Name,
		Status:      string(ns.Status.Phase),
		Age:         ageStr,
		CreatedAt:   ns.CreationTimestamp.Time,
		Labels:      ns.Labels,
		Annotations: ns.Annotations,
	}
}

// getApplicationName extracts application name from pod labels using common conventions
func getApplicationName(labels map[string]string) string {
	// Try different common label keys for application name
	applicationKeys := []string{
		"app.kubernetes.io/name",
		"app.kubernetes.io/instance",
		"app",
		"application",
		"k8s-app",
	}

	for _, key := range applicationKeys {
		if value, exists := labels[key]; exists && value != "" {
			return value
		}
	}

	return ""
}

// formatDuration formats a duration into a human-readable string
func formatDuration(d time.Duration) string {
	if d < time.Minute {
		return "< 1m"
	}
	if d < time.Hour {
		return formatDurationInMinutes(d)
	}
	if d < 24*time.Hour {
		return formatDurationInHours(d)
	}
	return formatDurationInDays(d)
}

func formatDurationInMinutes(d time.Duration) string {
	return fmt.Sprintf("%.0fm", d.Minutes())
}

func formatDurationInHours(d time.Duration) string {
	hours := int(d.Hours())
	minutes := int(d.Minutes()) % 60
	if minutes == 0 {
		return fmt.Sprintf("%dh", hours)
	}
	return fmt.Sprintf("%dh%dm", hours, minutes)
}

func formatDurationInDays(d time.Duration) string {
	days := int(d.Hours()) / 24
	hours := int(d.Hours()) % 24
	if hours == 0 {
		return fmt.Sprintf("%dd", days)
	}
	return fmt.Sprintf("%dd%dh", days, hours)
}
