import axios from 'axios';
import type { AxiosResponse } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

api.interceptors.request.use(
  (config) => {
    // Add request timestamp for debugging
    console.debug(
      `[API Request] ${config.method?.toUpperCase()} ${config.url}`,
      {
        params: config.params,
        data: config.data,
      }
    );
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response: AxiosResponse) => {
    console.debug(`[API Response] ${response.status} ${response.config.url}`, {
      data: response.data,
    });
    return response;
  },
  (error) => {
    console.error('[API Response Error]', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      message: error.message,
      data: error.response?.data,
    });

    // Handle specific error cases
    if (error.response?.status === 401) {
      // Handle unauthorized - could redirect to login
      console.warn('Unauthorized access - authentication required');
    } else if (error.response?.status === 403) {
      // Handle forbidden - insufficient permissions
      console.warn('Forbidden access - insufficient permissions');
    } else if (error.response?.status >= 500) {
      // Handle server errors
      console.error('Server error occurred');
    }

    return Promise.reject(error);
  }
);

export default api;
