import api from './api';

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
    const response = await api.get<HealthResponse>('/health');
    return response.data;
  },
};
