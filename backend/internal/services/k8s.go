package services

import (
	"context"
	"fmt"
	"path/filepath"
	"time"

	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/dynamic"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"
	"k8s.io/client-go/util/homedir"

	"k8s-monitor/internal/config"
)

// KubernetesService provides access to Kubernetes API
type KubernetesService struct {
	clientset     *kubernetes.Clientset
	dynamicClient dynamic.Interface
	config        config.KubernetesConfig
}

// ArgoCD Application GVR
var argoApplicationGVR = schema.GroupVersionResource{
	Group:    "argoproj.io",
	Version:  "v1alpha1",
	Resource: "applications",
}

// NewKubernetesService creates a new Kubernetes service instance
func NewKubernetesService(cfg config.KubernetesConfig) (*KubernetesService, error) {
	var kubeConfig *rest.Config
	var err error

	if cfg.InCluster {
		// Create in-cluster config
		kubeConfig, err = rest.InClusterConfig()
		if err != nil {
			return nil, fmt.Errorf("failed to create in-cluster config: %w", err)
		}
	} else {
		// Create out-of-cluster config
		kubeConfigPath := cfg.ConfigPath
		if kubeConfigPath == "" {
			if home := homedir.HomeDir(); home != "" {
				kubeConfigPath = filepath.Join(home, ".kube", "config")
			}
		}

		kubeConfig, err = clientcmd.BuildConfigFromFlags("", kubeConfigPath)
		if err != nil {
			return nil, fmt.Errorf("failed to build kubeconfig: %w", err)
		}
	}

	// Set timeouts for better reliability
	kubeConfig.Timeout = 30 * time.Second

	// Create the clientset
	clientset, err := kubernetes.NewForConfig(kubeConfig)
	if err != nil {
		return nil, fmt.Errorf("failed to create kubernetes clientset: %w", err)
	}

	dynamicClient, err := dynamic.NewForConfig(kubeConfig)
	if err != nil {
		return nil, fmt.Errorf("failed to create dynamic client: %w", err)
	}

	service := &KubernetesService{
		clientset:     clientset,
		dynamicClient: dynamicClient,
		config:        cfg,
	}

	// Test the connection
	if err := service.HealthCheck(); err != nil {
		return nil, fmt.Errorf("kubernetes connection health check failed: %w", err)
	}

	return service, nil
}

// ArgoCD methods
func (k *KubernetesService) GetArgoApplications(ctx context.Context, namespace string) (*unstructured.UnstructuredList, error) {
	if namespace == "" {
		return k.dynamicClient.Resource(argoApplicationGVR).List(ctx, metav1.ListOptions{})
	}
	return k.dynamicClient.Resource(argoApplicationGVR).Namespace(namespace).List(ctx, metav1.ListOptions{})
}

func (k *KubernetesService) GetArgoApplication(ctx context.Context, namespace, name string) (*unstructured.Unstructured, error) {
	return k.dynamicClient.Resource(argoApplicationGVR).Namespace(namespace).Get(ctx, name, metav1.GetOptions{})
}

// HealthCheck performs a basic connectivity test to the Kubernetes API server
func (k *KubernetesService) HealthCheck() error {
	// Try to get server version
	_, err := k.clientset.Discovery().ServerVersion()
	if err != nil {
		return fmt.Errorf("failed to get server version: %w", err)
	}
	return nil
}

// GetPods retrieves pods from specified namespace
func (k *KubernetesService) GetPods(ctx context.Context, namespace string) (*corev1.PodList, error) {
	if namespace == "" {
		namespace = "default"
	}
	pods, err := k.clientset.CoreV1().Pods(namespace).List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to list pods in namespace %s: %w", namespace, err)
	}
	return pods, nil
}

// GetAllPods retrieves pods from all accessible namespaces
func (k *KubernetesService) GetAllPods(ctx context.Context) (*corev1.PodList, error) {
	pods, err := k.clientset.CoreV1().Pods("").List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to list all pods: %w", err)
	}
	return pods, nil
}

// GetNamespaces retrieves all accessible namespaces
func (k *KubernetesService) GetNamespaces(ctx context.Context) (*corev1.NamespaceList, error) {
	namespaces, err := k.clientset.CoreV1().Namespaces().List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to list namespaces: %w", err)
	}
	return namespaces, nil
}

// GetPod retrieves a specific pod by name and namespace
func (k *KubernetesService) GetPod(ctx context.Context, namespace, name string) (*corev1.Pod, error) {
	pod, err := k.clientset.CoreV1().Pods(namespace).Get(ctx, name, metav1.GetOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to get pod %s in namespace %s: %w", name, namespace, err)
	}
	return pod, nil
}

// GetServices retrieves services from specified namespace
func (k *KubernetesService) GetServices(ctx context.Context, namespace string) (*corev1.ServiceList, error) {
	if namespace == "" {
		namespace = "default"
	}
	services, err := k.clientset.CoreV1().Services(namespace).List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to list services in namespace %s: %w", namespace, err)
	}
	return services, nil
}

// IsNamespaceAllowed checks if a namespace is allowed based on configuration
func (k *KubernetesService) IsNamespaceAllowed(namespace string) bool {
	// Check if namespace is in exclude list
	for _, excluded := range k.config.Namespaces.Exclude {
		if excluded == namespace {
			return false
		}
	}

	// If allowed list is empty, allow all (except excluded)
	if len(k.config.Namespaces.Allowed) == 0 {
		return true
	}

	// Check if namespace is in allowed list
	for _, allowed := range k.config.Namespaces.Allowed {
		if allowed == namespace {
			return true
		}
	}

	return false
}

// GetClientset returns the underlying Kubernetes clientset
func (k *KubernetesService) GetClientset() *kubernetes.Clientset {
	return k.clientset
}

func (k *KubernetesService) GetDynamicClient() dynamic.Interface {
	return k.dynamicClient
}
