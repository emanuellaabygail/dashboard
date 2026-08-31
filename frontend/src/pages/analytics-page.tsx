import { useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AnalyticsFiltersBar } from "@/features/analytics/components/analytics-filters";
import { AnalyticsProgressChart } from "@/features/analytics/components/analytics-progress-chart";
import { useAnalyticsDisciplines, useAnalyticsExport, useAnalyticsProgressTrend } from "@/features/analytics/hooks/use-analytics";
import type { AnalyticsFilters } from "@/features/analytics/types";
import { useProjects } from "@/features/projects/hooks/use-projects";

const emptyFilters: AnalyticsFilters = { project: "", sheet: "", dateFrom: "", dateTo: "" };

function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export function AnalyticsPage() {
  const [filters, setFilters] = useState<AnalyticsFilters>(emptyFilters);
  const projectsQuery = useProjects({});
  const disciplinesQuery = useAnalyticsDisciplines(filters.project);
  const exportMutation = useAnalyticsExport();

  const progressParams =
    filters.project !== ""
      ? {
          project: filters.project,
          sheet: filters.sheet,
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo
        }
      : null;
  const progressQuery = useAnalyticsProgressTrend(progressParams);

  const handleExport = async () => {
    if (filters.project === "") {
      return;
    }
    const blob = await exportMutation.mutateAsync({
      project: filters.project,
      sheet: filters.sheet,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo
    });
    downloadBlob(blob, `analytics-export-project-${filters.project}.csv`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Filter parsed report data by project, discipline, and date range.
        </p>
      </div>

      <Card>
        <CardContent className="pt-5">
          <AnalyticsFiltersBar
            filters={filters}
            onChange={setFilters}
            projects={projectsQuery.data?.results ?? []}
            disciplines={disciplinesQuery.data ?? []}
            onExport={handleExport}
            isExporting={exportMutation.isPending}
          />
          {exportMutation.isError ? (
            <p className="mt-2 text-sm text-destructive">Could not export CSV. Try again.</p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Progress Analysis</CardTitle>
          <CardDescription>Plan vs. actual progress across parsed reports for the selected filters.</CardDescription>
        </CardHeader>
        <CardContent>
          {filters.project === "" ? (
            <p className="text-sm text-muted-foreground">Select a project to see its progress trend.</p>
          ) : progressQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : progressQuery.isError ? (
            <p className="text-sm text-destructive">Could not load progress data.</p>
          ) : (
            <AnalyticsProgressChart data={progressQuery.data ?? []} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
