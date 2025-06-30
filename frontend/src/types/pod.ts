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

export interface PodFilters {
  namespace?: string;
  status?: string[];
  labels?: string[];
  node_name?: string;
  search_query?: string;
  show_system?: boolean;
}

export interface PodListResponse {
  pods: PodStatus[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  summary: PodSummary;
}

export interface PodSummary {
  total_pods: number;
  running_pods: number;
  pending_pods: number;
  failed_pods: number;
  status_counts: Record<string, number>;
  namespace_list: string[];
  node_list: string[];
}

export interface PodDetailsResponse {
  pod: PodStatus;
  events: PodEvent[];
  metrics?: PodMetrics;
  health_checks: PodHealthCheck[];
  owner_reference?: PodOwnerReference;
  recent_logs?: PodLog[];
  related_pods?: PodStatus[];
}

export interface PodEvent {
  type: string;
  reason: string;
  message: string;
  timestamp: string;
  source: string;
}

export interface PodLog {
  pod_name: string;
  namespace: string;
  container: string;
  timestamp: string;
  message: string;
  level?: string;
  stream: string;
}

export interface PodMetrics {
  pod_name: string;
  namespace: string;
  cpu: ResourceMetric;
  memory: ResourceMetric;
  network: NetworkMetric;
  timestamp: string;
  containers: ContainerMetrics[];
}

export interface ResourceMetric {
  usage: number;
  requests: number;
  limits: number;
  unit: string;
  usage_percent: number;
}

export interface NetworkMetric {
  rx_bytes: number;
  tx_bytes: number;
  rx_errors: number;
  tx_errors: number;
}

export interface ContainerMetrics {
  name: string;
  cpu: ResourceMetric;
  memory: ResourceMetric;
}

export interface PodHealthCheck {
  type: string;
  status: string;
  last_checked: string;
  failure_count: number;
  success_threshold: number;
  failure_threshold: number;
  check_endpoint?: string;
  error_message?: string;
}

export interface PodOwnerReference {
  kind: string;
  name: string;
  api_version: string;
  uid: string;
}

export interface PodCondition {
  type: string;
  status: string;
  reason?: string;
  message?: string;
  last_transition_time: string;
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

// Enhanced PodStatus interface (extends existing)
export interface PodStatus {
  name: string;
  namespace: string;
  status: string;
  phase: string;
  ready: boolean;
  restarts: number;
  age?: number;
  created_at: string;
  labels?: Record<string, string>;
  node_name?: string;
  pod_ip?: string;
  conditions?: PodCondition[];
  containers: ContainerStatus[];
  events?: PodEvent[];
}

// Application types (if not already defined)
export interface Application {
  name: string;
  namespace: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  pods: PodStatus[];
  expected_replicas: number;
  available_replicas: number;
  health_endpoint?: string;
  labels?: Record<string, string>;
  business_context?: BusinessContext;
  last_updated: string;
}

export interface BusinessContext {
  is_demo?: boolean;
  client_facing?: boolean;
  team?: string;
  environment?: string;
  priority?: string;
}

export interface HealthSummary {
  total_applications: number;
  healthy_applications: number;
  total_pods: number;
  running_pods: number;
  status_breakdown: Record<string, number>;
  last_updated: string;
}

// Action-related types
export interface PodActionRequest {
  action: 'restart' | 'delete' | 'logs' | 'shell';
  reason?: string;
  container?: string;
  tail_lines?: number;
}

export interface PodBulkActionRequest {
  action: 'restart' | 'delete' | 'export';
  reason?: string;
  pods: PodIdentifier[];
}

export interface PodIdentifier {
  name: string;
  namespace: string;
}

export interface PodBulkActionResponse {
  total_requested: number;
  successful: number;
  failed: number;
  results: PodActionResult[];
}

export interface PodActionResult {
  pod: PodIdentifier;
  success: boolean;
  message: string;
  error?: string;
}

// WebSocket message types
export interface WebSocketMessage {
  type: string;
  namespace: string;
  data: any;
  timestamp: string;
}

// Search and export types
export interface PodSearchRequest {
  query: string;
  namespaces?: string[];
  status?: string[];
  labels?: string[];
  nodes?: string[];
  show_system?: boolean;
  sort_by?: string;
  sort_order?: string;
  page?: number;
  page_size?: number;
}

export interface PodSearchResponse {
  query: string;
  results: PodListResponse;
}

export interface PodExportRequest {
  format: 'json' | 'csv' | 'yaml';
  namespaces?: string[];
  status?: string[];
  include_logs?: boolean;
  include_events?: boolean;
}

// Filter and sort types
export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

export interface PaginationOptions {
  page: number;
  page_size: number;
  offset?: number;
}

// Dashboard and monitoring types
export interface DashboardMetrics {
  total_pods: number;
  running_pods: number;
  pending_pods: number;
  failed_pods: number;
  healthy_applications: number;
  total_applications: number;
  critical_alerts: number;
  system_status: string;
}

export interface RealtimeUpdate {
  type: 'pod_update' | 'pod_add' | 'pod_delete' | 'heartbeat';
  data: any;
  timestamp: string;
}

// API response wrapper types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  timestamp: string;
}

export interface ApiError {
  error: string;
  details?: string;
  timestamp: string;
  status: number;
}

// Hook options types
export interface QueryOptions {
  enabled?: boolean;
  staleTime?: number;
  refetchInterval?: number;
  refetchOnWindowFocus?: boolean;
  keepPreviousData?: boolean;
}

export interface MutationOptions {
  onSuccess?: (data: any, variables: any) => void;
  onError?: (error: Error, variables: any) => void;
  onSettled?: (data: any, error: Error | null, variables: any) => void;
}

// Component prop types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface TableProps extends BaseComponentProps {
  loading?: boolean;
  error?: Error | null;
  onRefresh?: () => void;
}

export interface FilterProps extends BaseComponentProps {
  filters: PodFilters;
  onChange: (filters: Partial<PodFilters>) => void;
  onReset?: () => void;
}

// Theme and UI types
export type Theme = 'light' | 'dark' | 'system';

export interface UIPreferences {
  theme: Theme;
  sidebar_collapsed: boolean;
  table_density: 'compact' | 'normal' | 'comfortable';
  auto_refresh: boolean;
  refresh_interval: number;
}

// Navigation and routing types
export interface NavItem {
  title: string;
  url: string;
  icon?: React.ComponentType;
  badge?: string | number;
  items?: NavItem[];
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export interface BreadcrumbItem {
  title: string;
  url?: string;
  current?: boolean;
}

// Error boundary types
export interface ErrorInfo {
  componentStack: string;
  errorBoundary?: string;
}

export interface ErrorFallbackProps {
  error: Error;
  errorInfo: ErrorInfo;
  resetError: () => void;
}

// Utility types
export type Status = 'idle' | 'loading' | 'success' | 'error';

export type ActionStatus = 'pending' | 'success' | 'failed';

export type Priority = 'low' | 'medium' | 'high' | 'critical';

export type Environment = 'development' | 'staging' | 'production' | 'testing';

// Union types for better type safety
export type PodStatusType =
    | 'Running'
    | 'Pending'
    | 'Failed'
    | 'Succeeded'
    | 'Unknown'
    | 'Terminating'
    | 'Starting';

export type ApplicationStatusType =
    | 'healthy'
    | 'degraded'
    | 'unhealthy'
    | 'unknown';

export type ContainerStateType =
    | 'Running'
    | 'Waiting'
    | 'Terminated';

export type EventType =
    | 'Normal'
    | 'Warning';

export type LogLevel =
    | 'debug'
    | 'info'
    | 'warn'
    | 'error'
    | 'fatal';

// Conditional types for advanced TypeScript features
export type PodActionType<T extends string> = T extends 'logs'
    ? PodActionRequest & { container: string; tail_lines: number }
    : T extends 'shell'
        ? PodActionRequest & { container: string }
        : PodActionRequest;

// Generic types for reusable components
export interface GenericListProps<T> {
  items: T[];
  loading?: boolean;
  error?: Error | null;
  emptyMessage?: string;
  onItemClick?: (item: T) => void;
  onItemSelect?: (item: T, selected: boolean) => void;
  selectedItems?: T[];
}

export interface GenericTableColumn<T> {
  key: keyof T;
  title: string;
  sortable?: boolean;
  render?: (value: any, item: T) => React.ReactNode;
  width?: string | number;
}

export interface GenericTableProps<T> extends GenericListProps<T> {
  columns: GenericTableColumn<T>[];
  sortBy?: keyof T;
  sortOrder?: 'asc' | 'desc';
  onSort?: (key: keyof T) => void;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (pageSize: number) => void;
  };
}
