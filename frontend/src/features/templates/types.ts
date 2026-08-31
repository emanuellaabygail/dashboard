export interface ColumnMapping {
  column_index: number;
  header_label: string;
  field_key: string;
}

export interface TemplateSheetConfig {
  id?: number;
  sheet_name: string;
  header_row_start: number;
  header_row_end: number;
  column_mappings: ColumnMapping[];
  key_column_indexes?: number[];
  key_depth?: number | null;
  progress_categories?: ProgressCategory[];
  label_field_keys?: string[];
  total_row_labels?: string[];
}

export interface ProgressCategory {
  label: string;
  plan_field_key: string;
  actual_field_key: string;
  match_label?: string;
  item_plan_field_key?: string;
  item_actual_field_key?: string;
}

export interface Template {
  id: number;
  project: number;
  project_name: string;
  project_code: string;
  name: string;
  description: string;
  is_active: boolean;
  sheets: TemplateSheetConfig[];
  created_by: number;
  created_by_username: string;
  created_at: string;
  updated_at: string;
}

export interface TemplateListParams {
  search?: string;
  is_active?: "true" | "false" | "";
  project?: number | "";
}

export interface TemplatePayload {
  project: number;
  name: string;
  description: string;
  is_active: boolean;
  sheets: TemplateSheetConfig[];
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export type PreviewCellValue = string | number | null;

export interface MergedRange {
  min_row: number;
  max_row: number;
  min_col: number;
  max_col: number;
}

export interface ExcelPreview {
  sheet_names: string[];
  sheet_name: string;
  rows: PreviewCellValue[][];
  total_rows: number;
  merges: MergedRange[];
}
