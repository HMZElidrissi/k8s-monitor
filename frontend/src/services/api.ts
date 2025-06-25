import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Application, HealthSummary, PodStatus } from '@/types';


const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// API Client Class
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  // Health check
  async getHealth() {
    return this.request<{
      status: string;
      service: string;
      version: string;
      timestamp: string;
      uptime: string;
    }>('/health');
  }

  // Pod endpoints
  async getPods(namespace: string = 'default') {
    return this.request<{
      pods: PodStatus[];
      count: number;
      namespace: string;
    }>(`/api/v1/pods?namespace=${namespace}`);
  }

  async getPodsByNamespace(namespace: string) {
    return this.request<{
      pods: PodStatus[];
      count: number;
      namespace: string;
    }>(`/api/v1/pods/${namespace}`);
  }

  async getPod(namespace: string, name: string) {
    return this.request<{
      pod: PodStatus;
    }>(`/api/v1/pods/${namespace}/${name}`);
  }

  async restartPod(namespace: string, name: string) {
    return this.request<{
      message: string;
      pod: string;
      namespace: string;
    }>(`/api/v1/pods/${namespace}/${name}`, {
      method: 'DELETE',
    });
  }

  // Application endpoints
  async getApplications() {
    return this.request<{
      applications: Application[];
      summary: HealthSummary;
    }>('/api/v1/applications');
  }

  async getApplicationsByNamespace(namespace: string) {
    return this.request<{
      applications: Application[];
      namespace: string;
      summary: HealthSummary;
    }>(`/api/v1/applications/${namespace}`);
  }

  // WebSocket URL
  getWebSocketUrl(namespace: string = 'default') {
    const wsProtocol = this.baseURL.startsWith('https:') ? 'wss:' : 'ws:';
    const wsBaseUrl = this.baseURL.replace(/^https?:/, wsProtocol);
    return `${wsBaseUrl}/api/v1/ws?namespace=${namespace}`;
  }
}

export const apiClient = new ApiClient();

// React Query Hooks
export const useHealth = () => {
  return useQuery({
    queryKey: ['health'],
    queryFn: () => apiClient.getHealth(),
    refetchInterval: 30000, // Check every 30 seconds
  });
};

export const usePods = (namespace: string = 'default') => {
  return useQuery({
    queryKey: ['pods', namespace],
    queryFn: () => apiClient.getPods(namespace),
    refetchInterval: 5000, // Refetch every 5 seconds as fallback
  });
};

export const usePod = (namespace: string, name: string) => {
  return useQuery({
    queryKey: ['pod', namespace, name],
    queryFn: () => apiClient.getPod(namespace, name),
    enabled: !!(namespace && name),
  });
};

export const useApplications = () => {
  return useQuery({
    queryKey: ['applications'],
    queryFn: () => apiClient.getApplications(),
    refetchInterval: 10000, // Refetch every 10 seconds
  });
};

export const useApplicationsByNamespace = (namespace: string) => {
  return useQuery({
    queryKey: ['applications', namespace],
    queryFn: () => apiClient.getApplicationsByNamespace(namespace),
    enabled: !!namespace,
    refetchInterval: 10000,
  });
};

export const useRestartPod = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ namespace, name }: { namespace: string; name: string }) =>
      apiClient.restartPod(namespace, name),
    onSuccess: (data, variables) => {
      // Invalidate relevant queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['pods', variables.namespace] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['applications', variables.namespace] });
    },
  });
};