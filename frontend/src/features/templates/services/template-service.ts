import { httpClient } from "@/api/http-client";
import type {
  ExcelPreview,
  PaginatedResponse,
  Template,
  TemplateListParams,
  TemplatePayload
} from "@/features/templates/types";

export class TemplateService {
  async list(params: TemplateListParams = {}): Promise<PaginatedResponse<Template>> {
    const response = await httpClient.get<PaginatedResponse<Template>>("/templates/", {
      params: {
        search: params.search || undefined,
        is_active: params.is_active || undefined,
        project: params.project || undefined
      }
    });
    return response.data;
  }

  async preview(file: File, sheetName?: string, full?: boolean): Promise<ExcelPreview> {
    const formData = new FormData();
    formData.append("file", file);
    if (sheetName) {
      formData.append("sheet_name", sheetName);
    }
    if (full) {
      formData.append("full", "true");
    }
    const response = await httpClient.post<ExcelPreview>("/templates/preview/", formData, {
      timeout: 240_000
    });
    return response.data;
  }

  async create(payload: TemplatePayload): Promise<Template> {
    const response = await httpClient.post<Template>("/templates/", payload);
    return response.data;
  }

  async update(id: number, payload: TemplatePayload): Promise<Template> {
    const response = await httpClient.put<Template>(`/templates/${id}/`, payload);
    return response.data;
  }

  async delete(id: number): Promise<void> {
    await httpClient.delete(`/templates/${id}/`);
  }
}

export const templateService = new TemplateService();
