import type {
  APIResponse,
  NamespaceListResponse,
  PodListResponse,
  PodStatus,
} from '@/types';
import api from './api';

const API_BASE = '/api/v1';

export const podsApi = {
  async getAllPods(params?: { namespace?: string }): Promise<PodListResponse> {
    const endpoint = params?.namespace
      ? `${API_BASE}/pods/${params.namespace}`
      : `${API_BASE}/pods`;

    const response = await api.get<APIResponse<PodListResponse>>(endpoint);
    return response.data.data;
  },

  async getPod(namespace: string, name: string): Promise<PodStatus> {
    const response = await api.get<APIResponse<PodStatus>>(
      `${API_BASE}/pods/${namespace}/${name}`
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
