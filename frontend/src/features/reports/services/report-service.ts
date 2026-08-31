import { httpClient } from "@/api/http-client";
import type {
  PaginatedResponse,
  Report,
  ReportListParams,
  ReportParsePayload,
  ReportRowsResponse,
  ReportUploadPayload
} from "@/features/reports/types";

export class ReportService {
  async list(params: ReportListParams = {}): Promise<PaginatedResponse<Report>> {
    const response = await httpClient.get<PaginatedResponse<Report>>("/reports/", {
      params: {
        project: params.project || undefined,
        status: params.status || undefined
      }
    });
    return response.data;
  }

  async upload(payload: ReportUploadPayload): Promise<Report> {
    const formData = new FormData();
    formData.append("project", String(payload.project));
    if (payload.template !== null) {
      formData.append("template", String(payload.template));
    }
    formData.append("file", payload.file);

    const response = await httpClient.post<Report>("/reports/", formData, {
      timeout: 60_000
    });
    return response.data;
  }

  async delete(id: number): Promise<void> {
    await httpClient.delete(`/reports/${id}/`);
  }

  async parse({ id, template }: ReportParsePayload): Promise<Report> {
    const response = await httpClient.post<Report>(
      `/reports/${id}/parse/`,
      template ? { template } : {},
      { timeout: 300_000 }
    );
    return response.data;
  }

  async getRows(id: number, sheet?: string): Promise<ReportRowsResponse> {
    const response = await httpClient.get<ReportRowsResponse>(`/reports/${id}/rows/`, {
      params: { sheet: sheet || undefined }
    });
    return response.data;
  }
}

export const reportService = new ReportService();
