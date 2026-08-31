import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { accessService } from "@/features/access/services/access-service";
import type { AccessRecordListParams } from "@/features/access/types";
import type { UserRole } from "@/features/authentication/types";

export const accessRecordsQueryKey = (params: AccessRecordListParams) => ["access", "records", params] as const;
export const accessUsersQueryKey = (search: string) => ["access", "users", search] as const;

export function useAccessRecords(params: AccessRecordListParams = {}) {
  return useQuery({
    queryKey: accessRecordsQueryKey(params),
    queryFn: () => accessService.listRecords(params)
  });
}

export function useRequestAccess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (project: number) => accessService.requestAccess(project),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["access", "records"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    }
  });
}

export function useGrantAccess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ project, user }: { project: number; user: number }) => accessService.grantAccess(project, user),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["access", "records"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    }
  });
}

export function useDecideAccess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, approve }: { id: number; approve: boolean }) =>
      approve ? accessService.approve(id) : accessService.deny(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["access", "records"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    }
  });
}

export function useRevokeAccess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => accessService.revoke(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["access", "records"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    }
  });
}

export function useUsers(search = "") {
  return useQuery({
    queryKey: accessUsersQueryKey(search),
    queryFn: () => accessService.listUsers(search)
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: number; role: UserRole }) =>
      accessService.updateUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["access", "users"] });
    }
  });
}
