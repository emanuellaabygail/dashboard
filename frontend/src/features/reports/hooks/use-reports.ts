import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { reportService } from "@/features/reports/services/report-service";
import type { ReportListParams, ReportParsePayload, ReportUploadPayload } from "@/features/reports/types";

export const reportsQueryKey = (params: ReportListParams) => ["reports", params] as const;

export function useReports(params: ReportListParams = {}) {
  return useQuery({
    queryKey: reportsQueryKey(params),
    queryFn: () => reportService.list(params)
  });
}

export function useUploadReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ReportUploadPayload) => reportService.upload(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    }
  });
}

export function useDeleteReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => reportService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    }
  });
}

export function useParseReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ReportParsePayload) => reportService.parse(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    }
  });
}

export function useReportRows(reportId: number | null, sheet: string) {
  return useQuery({
    queryKey: ["reports", reportId, "rows", sheet],
    queryFn: () => reportService.getRows(reportId as number, sheet),
    enabled: reportId !== null
  });
}
