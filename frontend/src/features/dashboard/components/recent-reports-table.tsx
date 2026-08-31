import type { DashboardRecentReport } from "@/features/dashboard/types";

const statusStyles: Record<DashboardRecentReport["status"], string> = {
  uploaded: "bg-amber-100 text-amber-800",
  parsed: "bg-emerald-100 text-emerald-800",
  failed: "bg-red-100 text-red-800"
};

interface RecentReportsTableProps {
  reports: DashboardRecentReport[];
}

export function RecentReportsTable({ reports }: RecentReportsTableProps) {
  if (reports.length === 0) {
    return <p className="text-sm text-muted-foreground">No reports have been uploaded yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="py-2 pr-4 font-medium">Project</th>
            <th className="py-2 pr-4 font-medium">Template</th>
            <th className="py-2 pr-4 font-medium">Status</th>
            <th className="py-2 pr-4 font-medium">Rows</th>
            <th className="py-2 pr-4 font-medium">Uploaded</th>
            <th className="py-2 font-medium">By</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((report) => (
            <tr key={report.id} className="border-b last:border-0">
              <td className="py-2 pr-4">{report.project_name}</td>
              <td className="py-2 pr-4">{report.template_name ?? "—"}</td>
              <td className="py-2 pr-4">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[report.status]}`}>
                  {report.status}
                </span>
              </td>
              <td className="py-2 pr-4">{report.row_count}</td>
              <td className="py-2 pr-4">{new Date(report.uploaded_at).toLocaleString()}</td>
              <td className="py-2">{report.uploaded_by_username}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
