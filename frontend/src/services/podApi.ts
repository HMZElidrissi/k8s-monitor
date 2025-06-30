import api from './api';

const API_BASE = '/api/v1';

// Types matching backend models
export interface PodStatus {
  name: string;
  namespace: string;
  status: string;
  ready: boolean;
  restarts: number;
  age: string;
  createdAt: string;
  node?: string;
  ip?: string;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
  containers: ContainerStatus[];
  conditions?: PodCondition[];
  ownerKind?: string;
  ownerName?: string;
  application?: string;
}

export interface ContainerStatus {
  name: string;
  ready: boolean;
  restartCount: number;
  image: string;
  state: string;
  lastRestart?: string;
}

export interface PodCondition {
  type: string;
  status: string;
  lastTransitionTime: string;
  reason?: string;
  message?: string;
}

export interface PodSummary {
  running: number;
  pending: number;
  succeeded: number;
  failed: number;
  unknown: number;
}

export interface PodListResponse {
  pods: PodStatus[];
  total: number;
  namespace?: string;
  summary: PodSummary;
}

export interface Application {
  name: string;
  namespace: string;
  status: string; // healthy, degraded, unhealthy, unknown
  type: string;   // deployment, statefulset, daemonset, standalone
  version?: string;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
  pods: PodStatus[];
  services?: ServiceInfo[];
  summary: ApplicationSummary;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationSummary {
  totalPods: number;
  readyPods: number;
  runningPods: number;
  pendingPods: number;
  failedPods: number;
  restartCount: number;
}

export interface ServiceInfo {
  name: string;
  type: string;
  clusterIP?: string;
  externalIP?: string[];
  ports?: ServicePort[];
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
}

export interface ServicePort {
  name?: string;
  port: number;
  targetPort?: string;
  protocol: string;
  nodePort?: number;
}

export interface ApplicationsResponse {
  applications: Application[];
  total: number;
  namespace?: string;
  summary: ApplicationsSummary;
}

export interface ApplicationsSummary {
  healthy: number;
  degraded: number;
  unhealthy: number;
  unknown: number;
  totalPods: number;
  readyPods: number;
  runningPods: number;
}

export interface NamespaceInfo {
  name: string;
  status: string;
  age: string;
  createdAt: string;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
  podCount?: number;
}

export interface NamespaceListResponse {
  namespaces: NamespaceInfo[];
  total: number;
}

export interface APIResponse<T> {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
    details?: string;
  };
  meta?: {
    total?: number;
    page?: number;
    pageSize?: number;
    totalPages?: number;
    namespace?: string;
  };
  timestamp: string;
}

export const podsApi = {
  // Applications
  async getApplications(namespace?: string): Promise<ApplicationsResponse> {
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

  // Pods
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

  // Health check
  async getHealth() {
    const response = await api.get('/health');
    return response.data;
  },
};
