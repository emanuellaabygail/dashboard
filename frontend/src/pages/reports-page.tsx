import { useState } from "react";
import { Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { isAdminRole } from "@/features/access/lib/roles";
import { useCurrentUser } from "@/features/authentication/hooks/use-auth";
import { ReportParseForm } from "@/features/reports/components/report-parse-form";
import { ReportTable } from "@/features/reports/components/report-table";
import { ReportUploadForm } from "@/features/reports/components/report-upload-form";
import { useDeleteReport, useParseReport, useReports, useUploadReport } from "@/features/reports/hooks/use-reports";
import type { Report, ReportUploadPayload } from "@/features/reports/types";

export function ReportsPage() {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [parsingReport, setParsingReport] = useState<Report | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const currentUserQuery = useCurrentUser();
  const canManage = isAdminRole(currentUserQuery.data?.role);

  const reportsQuery = useReports();
  const uploadMutation = useUploadReport();
  const deleteMutation = useDeleteReport();
  const parseMutation = useParseReport();

  const handleUpload = async (payload: ReportUploadPayload) => {
    await uploadMutation.mutateAsync(payload);
    setIsUploadOpen(false);
  };

  const handleParse = async (templateId?: number) => {
    if (!parsingReport) {
      return;
    }
    await parseMutation.mutateAsync({ id: parsingReport.id, template: templateId });
    setParsingReport(null);
  };

  const handleDelete = async (report: Report) => {
    if (!window.confirm(`Delete report "${report.original_filename}"?`)) {
      return;
    }
    setDeletingId(report.id);
    try {
      await deleteMutation.mutateAsync(report.id);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Reports</h1>
          <p className="text-sm text-muted-foreground">
            Upload Excel progress reports, then parse them into normalized rows using a project template. See
            per-item progress on the Dashboard page.
          </p>
        </div>
        {canManage ? (
          <Button onClick={() => setIsUploadOpen(true)} disabled={isUploadOpen}>
            <Upload className="size-4" aria-hidden="true" />
            Upload Report
          </Button>
        ) : null}
      </div>

      {isUploadOpen && canManage ? (
        <Card>
          <CardHeader>
            <CardTitle>Upload report</CardTitle>
            <CardDescription>Choose the project this report belongs to and attach the Excel file.</CardDescription>
          </CardHeader>
          <CardContent>
            <ReportUploadForm
              isSubmitting={uploadMutation.isPending}
              submitError={uploadMutation.isError ? uploadMutation.error : null}
              onSubmit={handleUpload}
              onCancel={() => setIsUploadOpen(false)}
            />
          </CardContent>
        </Card>
      ) : null}

      {parsingReport ? (
        <Card>
          <CardHeader>
            <CardTitle>Parse report</CardTitle>
            <CardDescription>
              Parsing "{parsingReport.original_filename}" replaces any previously parsed rows for this report.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ReportParseForm
              report={parsingReport}
              isSubmitting={parseMutation.isPending}
              submitError={parseMutation.isError ? parseMutation.error : null}
              onSubmit={handleParse}
              onCancel={() => setParsingReport(null)}
            />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Recent Uploads</CardTitle>
          <CardDescription>
            {reportsQuery.data ? `${reportsQuery.data.count} report(s)` : "Loading upload history."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reportsQuery.isLoading ? (
            <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
              Loading reports
            </div>
          ) : reportsQuery.isError ? (
            <div className="flex h-48 items-center justify-center text-sm text-destructive">
              Unable to load reports.
            </div>
          ) : (
            <ReportTable
              reports={reportsQuery.data?.results ?? []}
              onParse={setParsingReport}
              onDelete={handleDelete}
              deletingId={deletingId}
              canManage={canManage}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
