export interface Common {
  id?: string;
  email: string;
  name?: string;
  avatar?: string;
}

export interface Team {
  id?: string;
  name: string;
  logo?: string | React.ElementType;
  plan: string;
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
