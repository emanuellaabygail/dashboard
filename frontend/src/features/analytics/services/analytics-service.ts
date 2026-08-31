import { httpClient } from "@/api/http-client";
import type { AnalyticsProgressPoint } from "@/features/analytics/types";

export interface AnalyticsQueryParams {
  project: number;
  sheet?: string;
  dateFrom?: string;
  dateTo?: string;
}

function toParams({ project, sheet, dateFrom, dateTo }: AnalyticsQueryParams) {
  return {
    project,
    sheet: sheet || undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined
  };
}

export class AnalyticsService {
  async getDisciplines(project: number): Promise<string[]> {
    const response = await httpClient.get<{ disciplines: string[] }>("/analytics/filters/", {
      params: { project }
    });
    return response.data.disciplines;
  }

  async getProgressTrend(params: AnalyticsQueryParams): Promise<AnalyticsProgressPoint[]> {
    const response = await httpClient.get<AnalyticsProgressPoint[]>("/analytics/progress/", {
      params: toParams(params)
    });
    return response.data;
  }

  async exportCsv(params: AnalyticsQueryParams): Promise<Blob> {
    const response = await httpClient.get("/analytics/export/", {
      params: toParams(params),
      responseType: "blob"
    });
    return response.data;
  }
}

export const analyticsService = new AnalyticsService();
