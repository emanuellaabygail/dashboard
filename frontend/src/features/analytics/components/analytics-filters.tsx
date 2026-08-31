import { Download, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Project } from "@/features/projects/types";
import type { AnalyticsFilters } from "@/features/analytics/types";

interface AnalyticsFiltersBarProps {
  filters: AnalyticsFilters;
  onChange: (filters: AnalyticsFilters) => void;
  projects: Project[];
  disciplines: string[];
  onExport: () => void;
  isExporting: boolean;
}

export function AnalyticsFiltersBar({
  filters,
  onChange,
  projects,
  disciplines,
  onExport,
  isExporting
}: AnalyticsFiltersBarProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5 xl:items-end">
      <div className="space-y-2">
        <Label htmlFor="analytics-project">Project</Label>
        <select
          id="analytics-project"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          value={filters.project}
          onChange={(event) =>
            onChange({
              ...filters,
              project: event.target.value ? Number(event.target.value) : "",
              sheet: ""
            })
          }
        >
          <option value="">Select a project</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.code} — {project.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="analytics-discipline">Discipline</Label>
        <select
          id="analytics-discipline"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          value={filters.sheet}
          disabled={filters.project === ""}
          onChange={(event) => onChange({ ...filters, sheet: event.target.value })}
        >
          <option value="">All disciplines</option>
          {disciplines.map((sheetName) => (
            <option key={sheetName} value={sheetName}>
              {sheetName}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="analytics-date-from">From</Label>
        <Input
          id="analytics-date-from"
          type="date"
          value={filters.dateFrom}
          onChange={(event) => onChange({ ...filters, dateFrom: event.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="analytics-date-to">To</Label>
        <Input
          id="analytics-date-to"
          type="date"
          value={filters.dateTo}
          onChange={(event) => onChange({ ...filters, dateTo: event.target.value })}
        />
      </div>

      <Button type="button" variant="outline" disabled={filters.project === "" || isExporting} onClick={onExport}>
        {isExporting ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <Download className="size-4" aria-hidden="true" />
        )}
        Export CSV
      </Button>
    </div>
  );
}
