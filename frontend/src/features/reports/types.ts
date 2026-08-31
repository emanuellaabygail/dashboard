export type ReportStatus = "uploaded" | "parsed" | "failed";

export interface Report {
  id: number;
  project: number;
  project_name: string;
  project_code: string;
  template: number | null;
  template_name: string;
  file: string;
  original_filename: string;
  status: ReportStatus;
  error_message: string;
  row_count: number;
  uploaded_by: number;
  uploaded_by_username: string;
  uploaded_at: string;
}

export interface ReportListParams {
  project?: number | "";
  status?: ReportStatus | "";
}

export interface ReportUploadPayload {
  project: number;
  template: number | null;
  file: File;
}

export interface ReportParsePayload {
  id: number;
  template?: number;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface WorkItemCategoryValue {
  plan: number | null;
  actual: number | null;
}

export interface WorkItem {
  row_number: number;
  sheet_name: string;
  label: string;
  categories: Record<string, WorkItemCategoryValue>;
  is_group: boolean;
  group_number: string | null;
  depth: number | null;
}

export interface ReportRowsResponse {
  sheet_names: string[];
  items: WorkItem[];
}
