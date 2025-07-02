package models

import (
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"time"
)

// ArgoCDApplication represents an ArgoCD Application resource
type ArgoCDApplication struct {
	Name           string            `json:"name"`
	Namespace      string            `json:"namespace"`
	Status         string            `json:"status"` // Computed overall status
	SyncStatus     string            `json:"syncStatus"`
	HealthStatus   string            `json:"healthStatus"`
	OperationState string            `json:"operationState"`
	RepoURL        string            `json:"repoURL"`
	Path           string            `json:"path"`
	TargetRevision string            `json:"targetRevision"`
	Server         string            `json:"server"`
	DestNamespace  string            `json:"destNamespace"`
	CreatedAt      time.Time         `json:"createdAt"`
	Labels         map[string]string `json:"labels,omitempty"`
	Annotations    map[string]string `json:"annotations,omitempty"`
	LastSyncTime   *time.Time        `json:"lastSyncTime,omitempty"`
	Resources      []ArgoCDResource  `json:"resources,omitempty"`
}

// ArgoCDResource represents a resource managed by ArgoCD
type ArgoCDResource struct {
	Group     string `json:"group"`
	Version   string `json:"version"`
	Kind      string `json:"kind"`
	Namespace string `json:"namespace"`
	Name      string `json:"name"`
	Status    string `json:"status"`
	Health    string `json:"health"`
}

// ArgoCDApplicationsResponse represents the response for ArgoCD application endpoints
type ArgoCDApplicationsResponse struct {
	Applications []ArgoCDApplication `json:"applications"`
	Total        int                 `json:"total"`
	Namespace    string              `json:"namespace,omitempty"`
	Summary      ArgoCDSummary       `json:"summary"`
}

// ArgoCDSummary provides aggregated statistics about ArgoCD applications
type ArgoCDSummary struct {
	Synced      int `json:"synced"`
	OutOfSync   int `json:"outOfSync"`
	Healthy     int `json:"healthy"`
	Degraded    int `json:"degraded"`
	Progressing int `json:"progressing"`
	Unknown     int `json:"unknown"`
}

// FromArgoApplication converts an unstructured ArgoCD Application to our model
func FromArgoApplication(obj *unstructured.Unstructured) ArgoCDApplication {
	app := ArgoCDApplication{
		Name:        obj.GetName(),
		Namespace:   obj.GetNamespace(),
		Labels:      obj.GetLabels(),
		Annotations: obj.GetAnnotations(),
		CreatedAt:   obj.GetCreationTimestamp().Time,
	}

	// Extract spec information
	if spec, found, err := unstructured.NestedMap(obj.Object, "spec"); found && err == nil {
		if source, found, err := unstructured.NestedMap(spec, "source"); found && err == nil {
			if repoURL, found, err := unstructured.NestedString(source, "repoURL"); found && err == nil {
				app.RepoURL = repoURL
			}
			if path, found, err := unstructured.NestedString(source, "path"); found && err == nil {
				app.Path = path
			}
			if targetRevision, found, err := unstructured.NestedString(source, "targetRevision"); found && err == nil {
				app.TargetRevision = targetRevision
			}
		}

		if destination, found, err := unstructured.NestedMap(spec, "destination"); found && err == nil {
			if server, found, err := unstructured.NestedString(destination, "server"); found && err == nil {
				app.Server = server
			}
			if namespace, found, err := unstructured.NestedString(destination, "namespace"); found && err == nil {
				app.DestNamespace = namespace
			}
		}
	}

	// Extract status information
	if status, found, err := unstructured.NestedMap(obj.Object, "status"); found && err == nil {
		if sync, found, err := unstructured.NestedMap(status, "sync"); found && err == nil {
			if syncStatus, found, err := unstructured.NestedString(sync, "status"); found && err == nil {
				app.SyncStatus = syncStatus
			}
		}

		if health, found, err := unstructured.NestedMap(status, "health"); found && err == nil {
			if healthStatus, found, err := unstructured.NestedString(health, "status"); found && err == nil {
				app.HealthStatus = healthStatus
			}
		}

		if operation, found, err := unstructured.NestedMap(status, "operationState"); found && err == nil {
			if phase, found, err := unstructured.NestedString(operation, "phase"); found && err == nil {
				app.OperationState = phase
			}
		}

		if resources, found, err := unstructured.NestedSlice(status, "resources"); found && err == nil {
			for _, resource := range resources {
				if resourceMap, ok := resource.(map[string]interface{}); ok {
					argoCDResource := ArgoCDResource{}

					if group, found, err := unstructured.NestedString(resourceMap, "group"); found && err == nil {
						argoCDResource.Group = group
					}
					if version, found, err := unstructured.NestedString(resourceMap, "version"); found && err == nil {
						argoCDResource.Version = version
					}
					if kind, found, err := unstructured.NestedString(resourceMap, "kind"); found && err == nil {
						argoCDResource.Kind = kind
					}
					if namespace, found, err := unstructured.NestedString(resourceMap, "namespace"); found && err == nil {
						argoCDResource.Namespace = namespace
					}
					if name, found, err := unstructured.NestedString(resourceMap, "name"); found && err == nil {
						argoCDResource.Name = name
					}
					if status, found, err := unstructured.NestedString(resourceMap, "status"); found && err == nil {
						argoCDResource.Status = status
					}
					if health, found, err := unstructured.NestedString(resourceMap, "health"); found && err == nil {
						argoCDResource.Health = health
					}

					app.Resources = append(app.Resources, argoCDResource)
				}
			}
		}
	}

	// Set computed status
	app.Status = app.GetArgoCDStatus()

	return app
}

// GetArgoCDStatus determines overall status based on sync and health
func (app *ArgoCDApplication) GetArgoCDStatus() string {
	switch {
	case app.SyncStatus == "Synced" && app.HealthStatus == "Healthy":
		return "healthy"
	case app.SyncStatus == "OutOfSync":
		return "out-of-sync"
	case app.HealthStatus == "Degraded":
		return "degraded"
	case app.HealthStatus == "Progressing":
		return "progressing"
	case app.HealthStatus == "Suspended":
		return "suspended"
	case app.HealthStatus == "Missing":
		return "missing"
	default:
		return "unknown"
	}
}
