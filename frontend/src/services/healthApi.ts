import { useQuery } from '@tanstack/react-query';
import { apiClient } from './api';

export interface HealthResponse {
  status: string;
  service: string;
  version: string;
  timestamp: string;
  uptime: string;
}

// Health API methods as constants
export const healthApi = {
  getHealth: async (): Promise<HealthResponse> => {
    return apiClient.get<HealthResponse>('/health');
  },
};

// React Query Hooks
export const useHealth = () => {
  return useQuery({
    queryKey: ['health'],
    queryFn: () => healthApi.getHealth(),
    staleTime: 30000, // Data is fresh for 30 seconds
    refetchOnWindowFocus: false, // Only manual refresh
  });
};
