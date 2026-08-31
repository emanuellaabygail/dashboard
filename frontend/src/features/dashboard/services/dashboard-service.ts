import { httpClient } from "@/api/http-client";
import type { DashboardSummary, ProjectSummary } from "@/features/dashboard/types";

export class DashboardService {
  async getSummary(): Promise<DashboardSummary> {
    const response = await httpClient.get<DashboardSummary>("/dashboard/summary/");
    return response.data;
  }

  async getProjectSummary(project: number): Promise<ProjectSummary> {
    const response = await httpClient.get<ProjectSummary>("/dashboard/project-summary/", {
      params: { project }
    });
    return response.data;
  }
}

export const dashboardService = new DashboardService();
