import { useMutation, useQuery } from "@tanstack/react-query";

import { analyticsService, type AnalyticsQueryParams } from "@/features/analytics/services/analytics-service";

export function useAnalyticsDisciplines(project: number | "") {
  return useQuery({
    queryKey: ["analytics", "disciplines", project],
    queryFn: () => analyticsService.getDisciplines(project as number),
    enabled: project !== ""
  });
}

export function useAnalyticsProgressTrend(params: AnalyticsQueryParams | null) {
  return useQuery({
    queryKey: ["analytics", "progress", params],
    queryFn: () => analyticsService.getProgressTrend(params as AnalyticsQueryParams),
    enabled: params !== null
  });
}

export function useAnalyticsExport() {
  return useMutation({
    mutationFn: (params: AnalyticsQueryParams) => analyticsService.exportCsv(params)
  });
}
