export type Role = "citizen" | "dept_admin" | "university_admin";

export type IssueStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED";

export type IssueCategory =
  | "road"
  | "water"
  | "lighting"
  | "waste"
  | "safety"
  | "other";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  department_id: string | null;
}

export interface AuditEntry {
  id: string;
  action: string;
  actor_name?: string;
  timestamp: string;
  meta?: Record<string, unknown> | null;
}

export interface IssueComment {
  id: string;
  author: string;
  message: string;
  created_at: string;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  category: IssueCategory;
  status: IssueStatus;
  lat: number;
  lng: number;
  created_at: string;
  updated_at: string;
  created_by: string;
  assigned_department_id: string | null;
  photo_url?: string | null;
  distance_km?: number;
  comments?: IssueComment[];
  audit?: AuditEntry[];
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
}

export interface IssueFilters {
  status?: IssueStatus | "";
  category?: IssueCategory | "";
  from?: string;
  to?: string;
  q?: string;
  page?: number;
  limit?: number;
  sort?: "newest" | "closest" | "status";
}

export interface AnalyticsSummary {
  totals: {
    issues: number;
    open: number;
    in_progress: number;
    resolved: number;
  };
  byCategory: Array<{ category: string; count: number }>;
  byStatus: Array<{ status: string; count: number }>;
  avgResolutionHours: number;
}

export interface H3AnalyticsCell {
  h3_index: string;
  count: number;
}

export interface AuthLoginResponse {
  token: string;
  user?: Partial<User> & { id?: string; name?: string; role?: string; department_id?: string | null };
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  login: string;
  password: string;
}

export interface CreateIssuePayload {
  title: string;
  description: string;
  category: IssueCategory;
  lat: number;
  lng: number;
  photo?: File | null;
}
