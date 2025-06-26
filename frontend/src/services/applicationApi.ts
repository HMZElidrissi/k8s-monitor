import { useQuery } from '@tanstack/react-query';
import { apiClient } from './api';
import type { Application, HealthSummary } from '@/types';

export interface ApplicationsResponse {
  applications: Application[];
  summary: HealthSummary;
}

export interface ApplicationsByNamespaceResponse {
  applications: Application[];
  namespace: string;
  summary: HealthSummary;
}

// Application API methods as constants
export const applicationApi = {
  getApplications: async (): Promise<ApplicationsResponse> => {
    return apiClient.get<ApplicationsResponse>('/api/v1/applications');
  },

  getApplicationsByNamespace: async (
    namespace: string
  ): Promise<ApplicationsByNamespaceResponse> => {
    return apiClient.get<ApplicationsByNamespaceResponse>(
      `/api/v1/applications/${namespace}`
    );
  },
};

// React Query Hooks
export const useApplications = () => {
  return useQuery({
    queryKey: ['applications'],
    queryFn: () => applicationApi.getApplications(),
    staleTime: 15000, // Data is fresh for 15 seconds
    refetchOnWindowFocus: false, // Only manual refresh
  });
};

export const useApplicationsByNamespace = (namespace: string) => {
  return useQuery({
    queryKey: ['applications', namespace],
    queryFn: () => applicationApi.getApplicationsByNamespace(namespace),
    enabled: !!namespace,
    staleTime: 15000,
    refetchOnWindowFocus: false,
  });
};
