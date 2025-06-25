/*
 * File: internal/models/pod.go
 * Application: K8s Monitor - Kubernetes Application Health Monitoring Tool
 * Author: Hamza El IDRISSI
 * Date: June 24, 2025
 * Version: v1.0.0 - Phase 1 Backend Implementation
 * Description: Pod status models and data structures
 */

package models

import (
	"time"

	corev1 "k8s.io/api/core/v1"
)

// PodStatus represents the status of a pod in a developer-friendly format
type PodStatus struct {
	Name        string            `json:"name"`
	Namespace   string            `json:"namespace"`
	Status      string            `json:"status"`
	Phase       string            `json:"phase"`
	Ready       bool              `json:"ready"`
	Restarts    int32             `json:"restarts"`
	Age         time.Duration     `json:"age"`
	CreatedAt   time.Time         `json:"created_at"`
	Labels      map[string]string `json:"labels"`
	NodeName    string            `json:"node_name"`
	PodIP       string            `json:"pod_ip"`
	Events      []PodEvent        `json:"events,omitempty"`
	Containers  []ContainerStatus `json:"containers"`
	Conditions  []PodCondition    `json:"conditions"`
}

// ContainerStatus represents the status of a container within a pod
type ContainerStatus struct {
	Name         string `json:"name"`
	Image        string `json:"image"`
	Ready        bool   `json:"ready"`
	RestartCount int32  `json:"restart_count"`
	State        string `json:"state"`
	Reason       string `json:"reason,omitempty"`
	Message      string `json:"message,omitempty"`
}

// PodCondition represents a pod condition
type PodCondition struct {
	Type    string    `json:"type"`
	Status  string    `json:"status"`
	Reason  string    `json:"reason,omitempty"`
	Message string    `json:"message,omitempty"`
	LastTransitionTime time.Time `json:"last_transition_time"`
}

// PodEvent represents a Kubernetes event related to a pod
type PodEvent struct {
	Type      string    `json:"type"`
	Reason    string    `json:"reason"`
	Message   string    `json:"message"`
	Timestamp time.Time `json:"timestamp"`
	Source    string    `json:"source"`
}

// WebSocketMessage represents a message sent over WebSocket
type WebSocketMessage struct {
	Type      string      `json:"type"`
	Namespace string      `json:"namespace"`
	Data      interface{} `json:"data"`
	Timestamp time.Time   `json:"timestamp"`
}

// MessageType constants for WebSocket messages
const (
	MessageTypePodUpdate   = "pod_update"
	MessageTypePodDelete   = "pod_delete"
	MessageTypePodAdd      = "pod_add"
	MessageTypeError       = "error"
	MessageTypeHeartbeat   = "heartbeat"
)

// NewPodStatusFromK8s converts a Kubernetes pod to our PodStatus model
func NewPodStatusFromK8s(pod *corev1.Pod) *PodStatus {
	podStatus := &PodStatus{
		Name:      pod.Name,
		Namespace: pod.Namespace,
		Phase:     string(pod.Status.Phase),
		Labels:    pod.Labels,
		NodeName:  pod.Spec.NodeName,
		PodIP:     pod.Status.PodIP,
		CreatedAt: pod.CreationTimestamp.Time,
		Age:       time.Since(pod.CreationTimestamp.Time),
	}

	// Calculate pod status
	podStatus.Status = calculatePodStatus(pod)
	podStatus.Ready = isPodReady(pod)

	// Process containers
	var totalRestarts int32
	for _, containerStatus := range pod.Status.ContainerStatuses {
		totalRestarts += containerStatus.RestartCount
		
		container := ContainerStatus{
			Name:         containerStatus.Name,
			Image:        containerStatus.Image,
			Ready:        containerStatus.Ready,
			RestartCount: containerStatus.RestartCount,
		}

		// Determine container state
		if containerStatus.State.Running != nil {
			container.State = "Running"
		} else if containerStatus.State.Waiting != nil {
			container.State = "Waiting"
			container.Reason = containerStatus.State.Waiting.Reason
			container.Message = containerStatus.State.Waiting.Message
		} else if containerStatus.State.Terminated != nil {
			container.State = "Terminated"
			container.Reason = containerStatus.State.Terminated.Reason
			container.Message = containerStatus.State.Terminated.Message
		}

		podStatus.Containers = append(podStatus.Containers, container)
	}

	podStatus.Restarts = totalRestarts

	// Process conditions
	for _, condition := range pod.Status.Conditions {
		podStatus.Conditions = append(podStatus.Conditions, PodCondition{
			Type:    string(condition.Type),
			Status:  string(condition.Status),
			Reason:  condition.Reason,
			Message: condition.Message,
			LastTransitionTime: condition.LastTransitionTime.Time,
		})
	}

	return podStatus
}

// calculatePodStatus determines a developer-friendly status
func calculatePodStatus(pod *corev1.Pod) string {
	if pod.DeletionTimestamp != nil {
		return "Terminating"
	}

	switch pod.Status.Phase {
	case corev1.PodPending:
		// Check if it's a scheduling issue
		for _, condition := range pod.Status.Conditions {
			if condition.Type == corev1.PodScheduled && condition.Status == corev1.ConditionFalse {
				return "Scheduling"
			}
		}
		return "Pending"
	case corev1.PodRunning:
		if isPodReady(pod) {
			return "Running"
		}
		return "Starting"
	case corev1.PodSucceeded:
		return "Completed"
	case corev1.PodFailed:
		return "Failed"
	default:
		return "Unknown"
	}
}

// isPodReady checks if all containers in the pod are ready
func isPodReady(pod *corev1.Pod) bool {
	for _, condition := range pod.Status.Conditions {
		if condition.Type == corev1.PodReady {
			return condition.Status == corev1.ConditionTrue
		}
	}
	return false
}