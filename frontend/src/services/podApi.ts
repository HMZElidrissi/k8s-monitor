import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './api';
import type { PodStatus } from '@/types';

export interface PodsResponse {
  pods: PodStatus[];
  count: number;
  namespace: string;
}

export interface PodResponse {
  pod: PodStatus;
}

export interface RestartPodResponse {
  message: string;
  pod: string;
  namespace: string;
}

// Pod API methods as constants
export const podApi = {
  getPods: async (namespace: string = 'default'): Promise<PodsResponse> => {
    return apiClient.get<PodsResponse>(`/api/v1/pods?namespace=${namespace}`);
  },

  getPod: async (namespace: string, name: string): Promise<PodResponse> => {
    return apiClient.get<PodResponse>(`/api/v1/pods/${namespace}/${name}`);
  },

  restartPod: async (
    namespace: string,
    name: string
  ): Promise<RestartPodResponse> => {
    return apiClient.delete<RestartPodResponse>(
      `/api/v1/pods/${namespace}/${name}`
    );
  },
};

// React Query Hooks
export const usePods = (namespace: string = 'default') => {
  return useQuery({
    queryKey: ['pods', namespace],
    queryFn: () => podApi.getPods(namespace),
    staleTime: 10000, // Data is fresh for 10 seconds
    refetchOnWindowFocus: false, // Only manual refresh
  });
};

export const usePod = (namespace: string, name: string) => {
  return useQuery({
    queryKey: ['pod', namespace, name],
    queryFn: () => podApi.getPod(namespace, name),
    enabled: !!(namespace && name),
    staleTime: 10000,
    refetchOnWindowFocus: false,
  });
};

export const useRestartPod = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ namespace, name }: { namespace: string; name: string }) =>
      podApi.restartPod(namespace, name),
    onSuccess: (data, variables) => {
      // Invalidate relevant queries to refetch data
      queryClient.invalidateQueries({
        queryKey: ['pods', variables.namespace],
      });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({
        queryKey: ['applications', variables.namespace],
      });
    },
  });
};
