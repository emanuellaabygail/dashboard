import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { templateService } from "@/features/templates/services/template-service";
import type { TemplateListParams, TemplatePayload } from "@/features/templates/types";

export const templatesQueryKey = (params: TemplateListParams) => ["templates", params] as const;

export function useTemplates(params: TemplateListParams = {}) {
  return useQuery({
    queryKey: templatesQueryKey(params),
    queryFn: () => templateService.list(params)
  });
}

export function useCreateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: TemplatePayload) => templateService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
    }
  });
}

export function useUpdateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: TemplatePayload }) =>
      templateService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
    }
  });
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => templateService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
    }
  });
}

export function useTemplatePreview() {
  return useMutation({
    mutationFn: ({ file, sheetName, full }: { file: File; sheetName?: string; full?: boolean }) =>
      templateService.preview(file, sheetName, full)
  });
}
