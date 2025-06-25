import type { PodStatus } from "@/types";

export interface Application {
  name: string;
  namespace: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  pods: PodStatus[];
  expected_replicas: number;
  available_replicas: number;
  health_endpoint?: string;
  labels: Record<string, string>;
  business_context?: BusinessContext;
  last_updated: string;
  deployment_strategy?: string;
}

export interface BusinessContext {
  is_demo: boolean;
  client_facing: boolean;
  team: string;
  environment: string;
  priority: string;
}

export interface HealthSummary {
  total_applications: number;
  healthy_applications: number;
  total_pods: number;
  running_pods: number;
  status_breakdown: Record<string, number>;
  last_updated: string;
}

export interface WebSocketMessage {
  type: 'pod_add' | 'pod_update' | 'pod_delete' | 'heartbeat' | 'error';
  namespace: string;
  data: unknown;
  timestamp: string;
}
