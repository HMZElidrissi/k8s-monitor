interface DailyStats {
  ok: number;
  count: number;
  day: string;
}

export interface Monitor {
  id: number;
  name: string | null;
  description: string | null;
  url: string;
  periodicity: string;
  regions: string[];
  method: string;
  body: string;
  headers: Array<{ key: string; value: string }>;
  active: boolean;
  data: DailyStats[];
}

interface IncidentUpdate {
  id: string;
  timestamp: string;
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
  message: string;
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  status: 'ongoing' | 'resolved';
  severity: 'minor' | 'major' | 'critical';
  startTime: string;
  resolvedTime?: string;
  affectedServices: string[];
  updates: IncidentUpdate[];
}

export interface HealthResponse {
  status: string;
  version: string;
  uptime: string;
  kubernetesStatus: string;
  checks: Record<string, string>;
  timestamp: string;
}
