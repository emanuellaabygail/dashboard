import { useState } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { isAdminRole } from "@/features/access/lib/roles";
import { useCurrentUser } from "@/features/authentication/hooks/use-auth";
import { CategoryProgressCard } from "@/features/dashboard/components/category-progress-card";
import { CategoryWeightDonut } from "@/features/dashboard/components/category-weight-donut";
import { IncrementalProgressTable } from "@/features/dashboard/components/incremental-progress-table";
import { ProcurementBreakdownGrid } from "@/features/dashboard/components/procurement-breakdown-grid";
import { RecentReportsTable } from "@/features/dashboard/components/recent-reports-table";
import { SCurveChart } from "@/features/dashboard/components/s-curve-chart";
import { StatCard, type StatBadgeTone } from "@/features/dashboard/components/stat-card";
import { useDashboardSummary, useProjectSummary } from "@/features/dashboard/hooks/use-dashboard";
import { formatCurrency, formatPercent, formatSignedPercent, hueForIndex } from "@/features/dashboard/lib/format";
import type { DashboardSummary, ProjectSummary } from "@/features/dashboard/types";
import { AccessCell } from "@/features/projects/components/project-table";
import { useProjects } from "@/features/projects/hooks/use-projects";
import { WorkItemsPanel } from "@/features/reports/components/work-items-panel";
import { useReports } from "@/features/reports/hooks/use-reports";
import { cn } from "@/lib/utils";

const DISCIPLINE_TABS = ["Engineering", "Procurement", "Construction"] as const;
type ProjectView = "summary" | (typeof DISCIPLINE_TABS)[number];

export function DashboardPage() {
  const currentUserQuery = useCurrentUser();
  const isAdmin = isAdminRole(currentUserQuery.data?.role);

  const projectsQuery = useProjects({});
  const [selectedProject, setSelectedProject] = useState<number | "">("");
  const [view, setView] = useState<ProjectView>("summary");

  const summaryQuery = useDashboardSummary({ enabled: isAdmin });
  const selectedProjectRecord = projectsQuery.data?.results.find((project) => project.id === selectedProject);
  const hasAccess = selectedProjectRecord
    ? selectedProjectRecord.access_status === "admin" || selectedProjectRecord.access_status === "approved"
    : false;
  const projectSummaryQuery = useProjectSummary(hasAccess ? selectedProject : "");

  const handleSelectProject = (id: number) => {
    setSelectedProject(id);
    setView("summary");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Project progress summaries from parsed report data.</p>
        </div>
        <div className="space-y-2 sm:w-72">
          <Label htmlFor="dashboard-project">Project</Label>
          <select
            id="dashboard-project"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={selectedProject}
            onChange={(event) =>
              event.target.value ? handleSelectProject(Number(event.target.value)) : setSelectedProject("")
            }
          >
            <option value="">{isAdmin ? "All projects overview" : "Select a project"}</option>
            {projectsQuery.data?.results.map((project) => (
              <option key={project.id} value={project.id}>
                {project.code} — {project.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedProject === "" ? (
        isAdmin ? (
          <OverviewSection summaryQuery={summaryQuery} onSelectProject={handleSelectProject} />
        ) : (
          <ProjectPickerSection projectsQuery={projectsQuery} onSelectProject={handleSelectProject} />
        )
      ) : !hasAccess ? (
        <Card>
          <CardHeader>
            <CardTitle>{selectedProjectRecord?.name ?? "Project"}</CardTitle>
            <CardDescription>
              You don't have access to this project's dashboard yet. Request access below — a Super Admin or
              Project Admin will need to approve it.
            </CardDescription>
          </CardHeader>
          <CardContent>{selectedProjectRecord ? <AccessCell project={selectedProjectRecord} /> : null}</CardContent>
        </Card>
      ) : (
        <>
          <div className="flex gap-1 border-b">
            {(["summary", ...DISCIPLINE_TABS] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setView(tab)}
                className={cn(
                  "border-b-2 px-3 py-2 text-sm font-medium",
                  view === tab
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {tab === "summary" ? "Summary" : tab}
              </button>
            ))}
          </div>

          {view === "summary" ? (
            <ProjectSummarySection query={projectSummaryQuery} />
          ) : (
            <ProjectWorkItemsSection projectId={selectedProject} categoryLabel={view} summaryQuery={projectSummaryQuery} />
          )}
        </>
      )}
    </div>
  );
}

function ProjectPickerSection({
  projectsQuery,
  onSelectProject
}: {
  projectsQuery: ReturnType<typeof useProjects>;
  onSelectProject: (id: number) => void;
}) {
  if (projectsQuery.isLoading) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        Loading projects…
      </p>
    );
  }

  if (projectsQuery.isError || !projectsQuery.data) {
    return <p className="text-sm text-destructive">Could not load the project list.</p>;
  }

  const projects = projectsQuery.data.results;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Projects</CardTitle>
        <CardDescription>
          Select a project you have access to, or request access to one you don't.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {projects.length === 0 ? (
          <p className="text-sm text-muted-foreground">No projects yet.</p>
        ) : (
          <div className="space-y-2">
            {projects.map((project) => (
              <div key={project.id} className="flex flex-col gap-2 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={() => onSelectProject(project.id)}
                  className="text-left text-sm hover:underline"
                >
                  <p className="font-medium">{project.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {project.code} · {project.status.replace("_", " ")}
                  </p>
                </button>
                <AccessCell project={project} />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function OverviewSection({
  summaryQuery,
  onSelectProject
}: {
  summaryQuery: UseQueryResult<DashboardSummary>;
  onSelectProject: (id: number) => void;
}) {
  if (summaryQuery.isLoading) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        Loading dashboard…
      </p>
    );
  }

  if (summaryQuery.isError || !summaryQuery.data) {
    return <p className="text-sm text-destructive">Could not load the dashboard summary.</p>;
  }

  const data = summaryQuery.data;

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Overall Progress"
          value={data.overall_progress.percent !== null ? `${data.overall_progress.percent.toFixed(1)}%` : "No data"}
          hint={
            data.overall_progress.percent !== null
              ? "Actual vs. planned progress across latest parsed reports"
              : "Set an 'Overall' progress category on a template to enable this"
          }
        />
        <StatCard title="Total Projects" value={String(data.projects.total)} />
        <StatCard title="Total Reports" value={String(data.reports.total)} />
        <StatCard
          title="Delayed Projects"
          value={String(data.delayed_projects)}
          hint="Past end date, not completed or cancelled"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Projects</CardTitle>
          <CardDescription>Select a project to see its detailed progress dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          {data.project_list.length === 0 ? (
            <p className="text-sm text-muted-foreground">No projects yet.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {data.project_list.map((project) => (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => onSelectProject(project.id)}
                  className="rounded-md border p-3 text-left text-sm hover:border-primary hover:bg-muted"
                >
                  <p className="font-medium">{project.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {project.code} · {project.status.replace("_", " ")}
                  </p>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Reports</CardTitle>
          <CardDescription>Latest uploads across all projects.</CardDescription>
        </CardHeader>
        <CardContent>
          <RecentReportsTable reports={data.recent_reports} />
        </CardContent>
      </Card>
    </>
  );
}

function spiBadge(spi: number | null): { label: string; tone: StatBadgeTone } | undefined {
  if (spi === null) {
    return undefined;
  }
  if (spi >= 1) {
    return { label: "Ahead of schedule", tone: "good" };
  }
  if (spi >= 0.9) {
    return { label: "On track", tone: "warning" };
  }
  return { label: "Behind schedule", tone: "critical" };
}

function ProjectSummarySection({ query }: { query: UseQueryResult<ProjectSummary> }) {
  if (query.isLoading) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        Loading project dashboard…
      </p>
    );
  }

  if (query.isError || !query.data) {
    return <p className="text-sm text-destructive">Could not load this project's dashboard.</p>;
  }

  const summary = query.data;

  if (!summary.has_data || !summary.overall) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{summary.project.name}</CardTitle>
          <CardDescription>
            No progress data yet. Configure an "Overall" progress category on this project's template, then upload
            and parse a report.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const { overall, categories, s_curve } = summary;

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard
          title="Overall Progress — Actual"
          value={formatPercent(overall.actual)}
          hint="Cumulative actual progress"
        />
        <StatCard title="Plan Progress — Baseline" value={formatPercent(overall.plan)} hint="Cumulative baseline" />
        <StatCard
          title="Deviation (Actual vs Plan)"
          value={formatSignedPercent(overall.deviation)}
          badge={overall.deviation >= 0 ? { label: "Ahead of schedule", tone: "good" } : { label: "Behind schedule", tone: "critical" }}
        />
        <StatCard title="Contract Value" value={formatCurrency(summary.project.contract_value)} />
        <StatCard
          title="Schedule Performance Index"
          value={overall.spi !== null ? overall.spi.toFixed(2) : "—"}
          badge={spiBadge(overall.spi)}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Overall S-Curve Progress</CardTitle>
          <CardDescription>Plan vs. actual, cumulative across every parsed report.</CardDescription>
        </CardHeader>
        <CardContent>
          <SCurveChart data={s_curve} />
        </CardContent>
      </Card>

      {categories.length > 0 ? (
        <div>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">Per category — click to compare</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {categories.map((category, index) => (
              <CategoryProgressCard key={category.label} category={category} color={hueForIndex(index)} />
            ))}
          </div>
        </div>
      ) : null}

      <ProcurementBreakdownGrid data={summary.procurement_breakdown} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Weight Distribution (WF)</CardTitle>
            <CardDescription>Each category's share of the total project weight.</CardDescription>
          </CardHeader>
          <CardContent>
            <CategoryWeightDonut categories={categories} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Incremental Progress</CardTitle>
            <CardDescription>Change between consecutive parsed reports.</CardDescription>
          </CardHeader>
          <CardContent>
            <IncrementalProgressTable data={s_curve} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function ProjectWorkItemsSection({
  projectId,
  categoryLabel,
  summaryQuery
}: {
  projectId: number;
  categoryLabel: string;
  summaryQuery: UseQueryResult<ProjectSummary>;
}) {
  const reportsQuery = useReports({ project: projectId, status: "parsed" });
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  const [selectedSheet, setSelectedSheet] = useState("");

  const category = summaryQuery.data?.categories.find((item) => item.label === categoryLabel);

  if (reportsQuery.isLoading) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        Loading reports…
      </p>
    );
  }

  if (reportsQuery.isError) {
    return <p className="text-sm text-destructive">Could not load this project's reports.</p>;
  }

  const reports = reportsQuery.data?.results ?? [];
  if (reports.length === 0) {
    return <p className="text-sm text-muted-foreground">No parsed reports yet for this project.</p>;
  }

  const activeReport = reports.find((report) => report.id === selectedReportId) ?? reports[0];

  return (
    <div className="space-y-4">
      {category ? (
        <CategoryProgressCard category={category} color={hueForIndex(DISCIPLINE_TABS.indexOf(categoryLabel as (typeof DISCIPLINE_TABS)[number]))} />
      ) : (
        <p className="text-sm text-muted-foreground">
          No "{categoryLabel}" progress category is configured on this project's template yet — item-level data
          below may still show if any sheet defines it.
        </p>
      )}

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>{categoryLabel} Work Items</CardTitle>
            <CardDescription>Plan vs. actual progress for each line item in the selected report.</CardDescription>
          </div>
          {reports.length > 1 ? (
            <div className="space-y-1">
              <Label htmlFor="work-items-report" className="text-xs text-muted-foreground">
                Report
              </Label>
              <select
                id="work-items-report"
                className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-64"
                value={activeReport.id}
                onChange={(event) => {
                  setSelectedReportId(Number(event.target.value));
                  setSelectedSheet("");
                }}
              >
                {reports.map((report) => (
                  <option key={report.id} value={report.id}>
                    {report.original_filename} · {new Date(report.uploaded_at).toLocaleDateString()}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
        </CardHeader>
        <CardContent>
          <WorkItemsPanel
            report={activeReport}
            selectedSheet={selectedSheet}
            onSelectSheet={setSelectedSheet}
            categoryFilter={categoryLabel}
          />
        </CardContent>
      </Card>
    </div>
  );
}
