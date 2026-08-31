import { httpClient } from "@/api/http-client";
import type { UserRole } from "@/features/authentication/types";
import type {
  AccessRecordListParams,
  PaginatedResponse,
  ProjectAccessRecord,
  UserRoleRecord
} from "@/features/access/types";

export class AccessService {
  async listRecords(params: AccessRecordListParams = {}): Promise<PaginatedResponse<ProjectAccessRecord>> {
    const response = await httpClient.get<PaginatedResponse<ProjectAccessRecord>>("/access/records/", {
      params: {
        project: params.project || undefined,
        status: params.status || undefined
      }
    });
    return response.data;
  }

  async requestAccess(project: number): Promise<ProjectAccessRecord> {
    const response = await httpClient.post<ProjectAccessRecord>("/access/records/", { project });
    return response.data;
  }

  async grantAccess(project: number, user: number): Promise<ProjectAccessRecord> {
    const response = await httpClient.post<ProjectAccessRecord>("/access/records/grant/", { project, user });
    return response.data;
  }

  async approve(id: number): Promise<ProjectAccessRecord> {
    const response = await httpClient.post<ProjectAccessRecord>(`/access/records/${id}/approve/`);
    return response.data;
  }

  async deny(id: number): Promise<ProjectAccessRecord> {
    const response = await httpClient.post<ProjectAccessRecord>(`/access/records/${id}/deny/`);
    return response.data;
  }

  async revoke(id: number): Promise<void> {
    await httpClient.delete(`/access/records/${id}/`);
  }

  async listUsers(search = ""): Promise<PaginatedResponse<UserRoleRecord>> {
    const response = await httpClient.get<PaginatedResponse<UserRoleRecord>>("/access/users/", {
      params: { search: search || undefined }
    });
    return response.data;
  }

  async updateUserRole(userId: number, role: UserRole): Promise<UserRoleRecord> {
    const response = await httpClient.patch<UserRoleRecord>(`/access/users/${userId}/role/`, { role });
    return response.data;
  }
}

export const accessService = new AccessService();
