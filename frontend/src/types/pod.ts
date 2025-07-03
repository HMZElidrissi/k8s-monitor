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
