import api from './api';
import type { HealthResponse } from '@/types';

// Health API methods as constants
export const healthApi = {
  async getHealth(): Promise<HealthResponse> {
    const response = await api.get('/health');
    return response.data.data || response.data;
  },
};
