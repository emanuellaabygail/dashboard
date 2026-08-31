export interface DashboardCounts {
  total: number;
  by_status: Record<string, number>;
}

export interface DashboardOverallProgress {
  plan: number | null;
  actual: number | null;
  percent: number | null;
}

export interface DashboardRecentReport {
  id: number;
  project_name: string;
  template_name: string | null;
  status: "uploaded" | "parsed" | "failed";
  row_count: number;
  uploaded_at: string;
  uploaded_by_username: string;
}

export interface DashboardProjectListItem {
  id: number;
  name: string;
  code: string;
  status: string;
  created_at: string;
}

export interface DashboardSummary {
  projects: DashboardCounts;
  reports: DashboardCounts;
  templates: { total: number; active: number };
  total_rows_parsed: number;
  delayed_projects: number;
  overall_progress: DashboardOverallProgress;
  recent_reports: DashboardRecentReport[];
  project_list: DashboardProjectListItem[];
}

export interface ProjectSummaryOverall {
  plan: number;
  actual: number;
  deviation: number;
  spi: number | null;
}

export interface ProjectSummaryCategory {
  label: string;
  plan: number;
  actual: number;
  deviation: number;
  weight_fraction: number | null;
}

export interface ProjectSummarySCurvePoint {
  report_id: number;
  uploaded_at: string;
  plan: number;
  actual: number;
}

export interface ProjectSummaryProject {
  id: number;
  name: string;
  code: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  contract_value: string | null;
}

export interface ProjectSummaryBreakdownCategory {
  plan: number;
  actual: number;
}

export interface ProjectSummaryProcurementBreakdown {
  label: string;
  item_count: number;
  categories: Record<string, ProjectSummaryBreakdownCategory>;
}

export interface ProjectSummary {
  has_data: boolean;
  overall: ProjectSummaryOverall | null;
  categories: ProjectSummaryCategory[];
  s_curve: ProjectSummarySCurvePoint[];
  project: ProjectSummaryProject;
  procurement_breakdown: ProjectSummaryProcurementBreakdown[];
}
