package services

import (
	"context"
	"fmt"
	"path/filepath"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/watch"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"
	"k8s.io/client-go/util/homedir"

	"k8s-monitor/internal/config"
	"k8s-monitor/internal/models"
)

// K8sService interface for Kubernetes operations
type K8sService interface {
	GetPods(namespace string) ([]models.PodStatus, error)
	GetPod(namespace, name string) (*models.PodStatus, error)
	WatchPods(namespace string) (watch.Interface, error)
	RestartPod(namespace, name string) error
	GetEvents(namespace, podName string) ([]models.PodEvent, error)
	GetNamespaces() ([]string, error)
}

// k8sService implements K8sService interface
type k8sService struct {
	clientset *kubernetes.Clientset
}

// NewK8sService creates a new Kubernetes service
func NewK8sService(cfg *config.Config) (K8sService, error) {
	config, err := buildConfig(cfg.KubeConfig)
	if err != nil {
		return nil, fmt.Errorf("failed to build kubernetes config: %w", err)
	}

	clientset, err := kubernetes.NewForConfig(config)
	if err != nil {
		return nil, fmt.Errorf("failed to create kubernetes client: %w", err)
	}

	return &k8sService{
		clientset: clientset,
	}, nil
}

// buildConfig creates Kubernetes client configuration
func buildConfig(kubeConfigPath string) (*rest.Config, error) {
	// Try in-cluster config first
	if config, err := rest.InClusterConfig(); err == nil {
		return config, nil
	}

	// Fall back to kubeconfig file
	if kubeConfigPath == "" {
		if home := homedir.HomeDir(); home != "" {
			kubeConfigPath = filepath.Join(home, ".kube", "config")
		}
	}

	return clientcmd.BuildConfigFromFlags("", kubeConfigPath)
}

// GetPods retrieves all pods in a namespace
func (k *k8sService) GetPods(namespace string) ([]models.PodStatus, error) {
	listOptions := metav1.ListOptions{}
	
	podList, err := k.clientset.CoreV1().Pods(namespace).List(context.TODO(), listOptions)
	if err != nil {
		return nil, fmt.Errorf("failed to get pods in namespace %s: %w", namespace, err)
	}

	var podStatuses []models.PodStatus
	for _, pod := range podList.Items {
		podStatus := models.NewPodStatusFromK8s(&pod)
		
		// Get events for this pod
		events, err := k.GetEvents(namespace, pod.Name)
		if err == nil {
			podStatus.Events = events
		}
		
		podStatuses = append(podStatuses, *podStatus)
	}

	return podStatuses, nil
}

// GetPod retrieves a specific pod
func (k *k8sService) GetPod(namespace, name string) (*models.PodStatus, error) {
	pod, err := k.clientset.CoreV1().Pods(namespace).Get(context.TODO(), name, metav1.GetOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to get pod %s/%s: %w", namespace, name, err)
	}

	podStatus := models.NewPodStatusFromK8s(pod)
	
	// Get events for this pod
	events, err := k.GetEvents(namespace, name)
	if err == nil {
		podStatus.Events = events
	}

	return podStatus, nil
}

// WatchPods creates a watch for pod changes
func (k *k8sService) WatchPods(namespace string) (watch.Interface, error) {
	listOptions := metav1.ListOptions{
		Watch: true,
	}

	watcher, err := k.clientset.CoreV1().Pods(namespace).Watch(context.TODO(), listOptions)
	if err != nil {
		return nil, fmt.Errorf("failed to watch pods in namespace %s: %w", namespace, err)
	}

	return watcher, nil
}

// RestartPod restarts a pod by deleting it (deployment will recreate)
func (k *k8sService) RestartPod(namespace, name string) error {
	deletePolicy := metav1.DeletePropagationForeground
	deleteOptions := metav1.DeleteOptions{
		PropagationPolicy: &deletePolicy,
	}

	err := k.clientset.CoreV1().Pods(namespace).Delete(context.TODO(), name, deleteOptions)
	if err != nil {
		return fmt.Errorf("failed to restart pod %s/%s: %w", namespace, name, err)
	}

	return nil
}

// GetEvents retrieves events for a specific pod
func (k *k8sService) GetEvents(namespace, podName string) ([]models.PodEvent, error) {
	listOptions := metav1.ListOptions{
		FieldSelector: fmt.Sprintf("involvedObject.name=%s,involvedObject.kind=Pod", podName),
	}

	eventList, err := k.clientset.CoreV1().Events(namespace).List(context.TODO(), listOptions)
	if err != nil {
		return nil, fmt.Errorf("failed to get events for pod %s/%s: %w", namespace, podName, err)
	}

	var events []models.PodEvent
	for _, event := range eventList.Items {
		podEvent := models.PodEvent{
			Type:      event.Type,
			Reason:    event.Reason,
			Message:   event.Message,
			Timestamp: event.FirstTimestamp.Time,
			Source:    event.Source.Component,
		}
		events = append(events, podEvent)
	}

	return events, nil
}

// GetNamespaces retrieves all available namespaces
func (k *k8sService) GetNamespaces() ([]string, error) {
	namespaceList, err := k.clientset.CoreV1().Namespaces().List(context.TODO(), metav1.ListOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to get namespaces: %w", err)
	}

	var namespaces []string
	for _, ns := range namespaceList.Items {
		namespaces = append(namespaces, ns.Name)
	}

	return namespaces, nil
}