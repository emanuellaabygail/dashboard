import { httpClient } from "@/api/http-client";
import type {
  PaginatedResponse,
  Project,
  ProjectListParams,
  ProjectPayload
} from "@/features/projects/types";

export class ProjectService {
  async list(params: ProjectListParams = {}): Promise<PaginatedResponse<Project>> {
    const response = await httpClient.get<PaginatedResponse<Project>>("/projects/", {
      params: {
        search: params.search || undefined,
        status: params.status || undefined,
        page: params.page
      }
    });
    return response.data;
  }

  async create(payload: ProjectPayload): Promise<Project> {
    const response = await httpClient.post<Project>("/projects/", payload);
    return response.data;
  }

  async update(id: number, payload: ProjectPayload): Promise<Project> {
    const response = await httpClient.put<Project>(`/projects/${id}/`, payload);
    return response.data;
  }

  async delete(id: number): Promise<void> {
    await httpClient.delete(`/projects/${id}/`);
  }
}

export const projectService = new ProjectService();
