import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { projectService } from "@/features/projects/services/project-service";
import type { ProjectListParams, ProjectPayload } from "@/features/projects/types";

export const projectsQueryKey = (params: ProjectListParams) => ["projects", params] as const;

export function useProjects(params: ProjectListParams = {}) {
  return useQuery({
    queryKey: projectsQueryKey(params),
    queryFn: () => projectService.list(params)
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ProjectPayload) => projectService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    }
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ProjectPayload }) =>
      projectService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    }
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => projectService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    }
  });
}
