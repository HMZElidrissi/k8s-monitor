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
