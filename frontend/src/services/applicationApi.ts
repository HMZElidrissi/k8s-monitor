import type {
  APIResponse,
  Application,
  ApplicationsResponse,
  ArgoCDApplication,
  ArgoCDApplicationsResponse,
  NamespaceListResponse,
} from '@/types';
import api from './api';

const API_BASE = '/api/v1';

export const applicationsApi = {
  // ArgoCD Applications (Primary application interface)
  async getArgoCDApplications(
    namespace?: string
  ): Promise<ArgoCDApplicationsResponse> {
    const endpoint = namespace
      ? `${API_BASE}/argocd/applications/${namespace}`
      : `${API_BASE}/argocd/applications`;

    const response =
      await api.get<APIResponse<ArgoCDApplicationsResponse>>(endpoint);
    return response.data.data;
  },

  async getArgoCDApplication(
    namespace: string,
    name: string
  ): Promise<ArgoCDApplication> {
    const response = await api.get<APIResponse<ArgoCDApplication>>(
      `${API_BASE}/argocd/applications/${namespace}/${name}`
    );
    return response.data.data;
  },

  // Legacy Applications (for backwards compatibility)
  async getApplicationsByNamespace(
    namespace?: string
  ): Promise<ApplicationsResponse> {
    const endpoint = namespace
      ? `${API_BASE}/applications/${namespace}`
      : `${API_BASE}/applications`;

    const response = await api.get<APIResponse<ApplicationsResponse>>(endpoint);
    return response.data.data;
  },

  async getApplication(namespace: string, name: string): Promise<Application> {
    const response = await api.get<APIResponse<Application>>(
      `${API_BASE}/applications/${namespace}/${name}`
    );
    return response.data.data;
  },

  async getApplicationStatus(namespace: string, name: string) {
    const response = await api.get<APIResponse<any>>(
      `${API_BASE}/applications/${namespace}/${name}/status`
    );
    return response.data.data;
  },

  // Namespaces
  async getNamespaces(): Promise<NamespaceListResponse> {
    const response = await api.get<APIResponse<NamespaceListResponse>>(
      `${API_BASE}/namespaces`
    );
    return response.data.data;
  },
};

// Helper function to convert ArgoCD Application to legacy Application format
export function convertArgoCDToApplication(
  argoApp: ArgoCDApplication
): Application {
  // Use the computed status from backend
  let status = 'unknown';
  switch (argoApp.status) {
    case 'healthy':
      status = 'healthy';
      break;
    case 'degraded':
    case 'out-of-sync':
      status = 'degraded';
      break;
    case 'progressing':
      status = 'degraded'; // Map progressing to degraded for UI
      break;
    case 'missing':
    case 'suspended':
      status = 'unhealthy';
      break;
    default:
      status = 'unknown';
  }

  // Safely handle resources array - it might be undefined or null
  const resources = argoApp.resources || [];

  // Calculate summary from resources
  const totalResources = resources.length;

  // For ArgoCD resources, health might be empty for simple resources
  // Use sync status as fallback - if synced and no health issues, consider as healthy
  const healthyResources = resources.filter(
    (r) => r.health === 'Healthy' || (r.status === 'Synced' && !r.health)
  ).length;

  const syncedResources = resources.filter((r) => r.status === 'Synced').length;

  const degradedResources = resources.filter(
    (r) => r.health === 'Degraded' || r.health === 'Missing'
  ).length;

  return {
    name: argoApp.name,
    namespace: argoApp.namespace,
    status,
    type: 'argocd-application',
    version: argoApp.targetRevision || 'HEAD',
    labels: argoApp.labels || {},
    annotations: argoApp.annotations || {},
    pods: [], // ArgoCD doesn't directly expose pod info
    services: [],
    summary: {
      totalPods: totalResources,
      readyPods: healthyResources,
      runningPods: healthyResources,
      pendingPods: Math.max(0, totalResources - syncedResources),
      failedPods: degradedResources,
      restartCount: 0, // Not available from ArgoCD
    },
    createdAt: argoApp.createdAt,
    updatedAt: argoApp.lastSyncTime || argoApp.createdAt,
  };
}
