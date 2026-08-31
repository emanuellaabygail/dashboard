export type ProjectStatus = "planned" | "in_progress" | "on_hold" | "completed" | "cancelled";

export type ProjectAccessStatus = "admin" | "approved" | "pending" | "denied" | "none";

export interface Project {
  id: number;
  name: string;
  code: string;
  description: string;
  status: ProjectStatus;
  start_date: string | null;
  end_date: string | null;
  contract_value: string | null;
  created_by: number;
  created_by_username: string;
  access_status: ProjectAccessStatus;
  created_at: string;
  updated_at: string;
}

export interface ProjectListParams {
  search?: string;
  status?: ProjectStatus | "";
  page?: number;
}

export interface ProjectPayload {
  name: string;
  code: string;
  description: string;
  status: ProjectStatus;
  start_date: string | null;
  end_date: string | null;
  contract_value: string | null;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
