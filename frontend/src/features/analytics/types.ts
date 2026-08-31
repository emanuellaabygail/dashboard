export interface AnalyticsFilters {
  project: number | "";
  sheet: string;
  dateFrom: string;
  dateTo: string;
}

export interface AnalyticsProgressPoint {
  report_id: number;
  uploaded_at: string;
  plan: number;
  actual: number;
  percent: number | null;
}
