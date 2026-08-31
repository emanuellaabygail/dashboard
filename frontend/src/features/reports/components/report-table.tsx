import { PlayCircle, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Report, ReportStatus } from "@/features/reports/types";

const statusLabels: Record<ReportStatus, string> = {
  uploaded: "Uploaded",
  parsed: "Parsed",
  failed: "Failed"
};

const statusStyles: Record<ReportStatus, string> = {
  uploaded: "bg-secondary text-secondary-foreground",
  parsed: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800"
};

interface ReportTableProps {
  reports: Report[];
  onParse: (report: Report) => void;
  onDelete: (report: Report) => void;
  deletingId: number | null;
  canManage: boolean;
}

export function ReportTable({ reports, onParse, onDelete, deletingId, canManage }: ReportTableProps) {
  if (reports.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
        No reports uploaded yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">File</th>
            <th className="px-4 py-3 font-medium">Project</th>
            <th className="px-4 py-3 font-medium">Template</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Rows</th>
            <th className="px-4 py-3 font-medium">Uploaded by</th>
            <th className="px-4 py-3 font-medium">Uploaded at</th>
            {canManage ? <th className="px-4 py-3 text-right font-medium">Actions</th> : null}
          </tr>
        </thead>
        <tbody className="divide-y">
          {reports.map((report) => (
            <tr key={report.id}>
              <td className="px-4 py-3 font-medium">
                <a
                  className="text-primary hover:underline"
                  href={report.file}
                  target="_blank"
                  rel="noreferrer"
                >
                  {report.original_filename}
                </a>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{report.project_code}</td>
              <td className="px-4 py-3 text-muted-foreground">{report.template_name || "—"}</td>
              <td className="px-4 py-3">
                <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusStyles[report.status]}`}>
                  {statusLabels[report.status]}
                </span>
                {report.status === "failed" && report.error_message ? (
                  <p className="mt-1 max-w-xs truncate text-xs text-destructive" title={report.error_message}>
                    {report.error_message}
                  </p>
                ) : null}
              </td>
              <td className="px-4 py-3 text-muted-foreground">{report.status === "parsed" ? report.row_count : "—"}</td>
              <td className="px-4 py-3 text-muted-foreground">{report.uploaded_by_username}</td>
              <td className="px-4 py-3 text-muted-foreground">
                {new Date(report.uploaded_at).toLocaleString()}
              </td>
              {canManage ? (
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Button
                      aria-label={`Parse ${report.original_filename}`}
                      size="icon"
                      variant="ghost"
                      onClick={() => onParse(report)}
                    >
                      <PlayCircle className="size-4" aria-hidden="true" />
                    </Button>
                    <Button
                      aria-label={`Delete ${report.original_filename}`}
                      size="icon"
                      variant="ghost"
                      disabled={deletingId === report.id}
                      onClick={() => onDelete(report)}
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </Button>
                  </div>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
