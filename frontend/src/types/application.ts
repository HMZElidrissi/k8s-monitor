import type { PodStatus } from '@/types';

export interface ArgoCDResource {
  group: string;
  version: string;
  kind: string;
  namespace: string;
  name: string;
  status: string; // Synced, OutOfSync
  health: string; // Healthy, Progressing, Degraded, etc.
}

export interface ArgoCDApplication {
  name: string;
  namespace: string;
  status: string; // Computed overall status: healthy, degraded, progressing, etc.
  syncStatus: string; // Synced, OutOfSync, Unknown
  healthStatus: string; // Healthy, Progressing, Degraded, Suspended, Missing, Unknown
  operationState: string; // Running, Succeeded, Failed, Error, Terminating
  repoURL: string;
  path: string;
  targetRevision: string;
  server: string;
  destNamespace: string;
  createdAt: string;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
  lastSyncTime?: string;
  resources: ArgoCDResource[];
}

export interface ArgoCDSummary {
  synced: number;
  outOfSync: number;
  healthy: number;
  degraded: number;
  progressing: number;
  unknown: number;
}

export interface ArgoCDApplicationsResponse {
  applications: ArgoCDApplication[];
  total: number;
  namespace?: string;
  summary: ArgoCDSummary;
}

// Legacy Application types (for backwards compatibility with logical apps)
export interface Application {
  name: string;
  namespace: string;
  status: string; // healthy, degraded, unhealthy, unknown
  type: string; // deployment, statefulset, daemonset, standalone
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
