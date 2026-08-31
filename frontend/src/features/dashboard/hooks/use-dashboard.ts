import { useQuery } from "@tanstack/react-query";

import { dashboardService } from "@/features/dashboard/services/dashboard-service";

export function useDashboardSummary(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ["dashboard", "summary"],
    queryFn: () => dashboardService.getSummary(),
    enabled: options.enabled ?? true
  });
}

export function useProjectSummary(project: number | "") {
  return useQuery({
    queryKey: ["dashboard", "project-summary", project],
    queryFn: () => dashboardService.getProjectSummary(project as number),
    enabled: project !== ""
  });
}
