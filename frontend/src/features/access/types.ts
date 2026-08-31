import type { UserRole } from "@/features/authentication/types";

export type AccessRecordStatus = "pending" | "approved" | "denied";

export interface ProjectAccessRecord {
  id: number;
  project: number;
  project_name: string;
  project_code: string;
  user: number;
  username: string;
  user_full_name: string;
  status: AccessRecordStatus;
  requested_at: string;
  decided_by: number | null;
  decided_by_username: string;
  decided_at: string | null;
}

export interface AccessRecordListParams {
  project?: number | "";
  status?: AccessRecordStatus | "";
}

export interface UserRoleRecord {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_superuser: boolean;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
