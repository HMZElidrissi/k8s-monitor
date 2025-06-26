import axios from 'axios';
import type { AxiosResponse } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Setup interceptors
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response.data;
  },
  (error) => {
    const errorMessage =
      error.response?.data?.error ||
      error.response?.statusText ||
      error.message ||
      'An unexpected error occurred';

    throw new Error(errorMessage);
  }
);

// Typed API methods
export const apiClient = {
  get: async <T>(url: string): Promise<T> => {
    return api.get(url);
  },

  post: async <T>(url: string, data?: any): Promise<T> => {
    return api.post(url, data);
  },

  put: async <T>(url: string, data?: any): Promise<T> => {
    return api.put(url, data);
  },

  patch: async <T>(url: string, data?: any): Promise<T> => {
    return api.patch(url, data);
  },

  delete: async <T>(url: string): Promise<T> => {
    return api.delete(url);
  },

  // Build a WebSocket URL that matches the REST API host, switching protocol.
  getWebSocketUrl: (namespace: string = 'default'): string => {
    const apiBase: string =
      (import.meta.env.VITE_API_URL as string) || window.location.origin;

    try {
      const parsed = new URL(apiBase);
      const protocol = parsed.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${protocol}//${parsed.host}/api/v1/ws?namespace=${namespace}`;
    } catch {
      // Fallback – assume apiBase is host without scheme
      const protocol = apiBase.startsWith('https') ? 'wss://' : 'ws://';
      const host = apiBase.replace(/^https?:\/\//, '');
      return `${protocol}${host}/api/v1/ws?namespace=${namespace}`;
    }
  },
};

export default api;
