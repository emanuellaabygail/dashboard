export type ProjectStatus = "planned" | "in_progress" | "on_hold" | "completed" | "cancelled";

export interface Project {
  id: number;
  name: string;
  code: string;
  description: string;
  status: ProjectStatus;
  start_date: string | null;
  end_date: string | null;
  created_by: number;
  created_by_username: string;
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
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
