export interface PodStatus {
  name: string;
  namespace: string;
  status: string;
  phase: string;
  ready: boolean;
  restarts: number;
  age: number;
  created_at: string;
  labels: Record<string, string>;
  node_name: string;
  pod_ip: string;
  containers: ContainerStatus[];
  conditions: PodCondition[];
  events?: PodEvent[];
}

export interface ContainerStatus {
  name: string;
  image: string;
  ready: boolean;
  restart_count: number;
  state: string;
  reason?: string;
  message?: string;
}

export interface PodCondition {
  type: string;
  status: string;
  reason?: string;
  message?: string;
  last_transition_time: string;
}

export interface PodEvent {
  type: string;
  reason: string;
  message: string;
  timestamp: string;
  source: string;
}
