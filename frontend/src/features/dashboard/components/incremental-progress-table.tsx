import { formatDate, formatPercent, formatSignedPercent } from "@/features/dashboard/lib/format";
import type { ProjectSummarySCurvePoint } from "@/features/dashboard/types";

interface IncrementalProgressTableProps {
  data: ProjectSummarySCurvePoint[];
}

export function IncrementalProgressTable({ data }: IncrementalProgressTableProps) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">No parsed reports yet for this project.</p>;
  }

  const rows = data.map((point, index) => {
    const previous = index > 0 ? data[index - 1] : null;
    return {
      ...point,
      planIncrement: point.plan - (previous?.plan ?? 0),
      actualIncrement: point.actual - (previous?.actual ?? 0),
      deviation: point.actual - point.plan
    };
  });

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="py-2 pr-4 font-medium">Report date</th>
            <th className="py-2 pr-4 font-medium">Plan (Inc.)</th>
            <th className="py-2 pr-4 font-medium">Plan (Cum.)</th>
            <th className="py-2 pr-4 font-medium">Actual (Inc.)</th>
            <th className="py-2 pr-4 font-medium">Actual (Cum.)</th>
            <th className="py-2 font-medium">Dev</th>
          </tr>
        </thead>
        <tbody className="tabular-nums">
          {rows.map((row) => (
            <tr key={row.report_id} className="border-b last:border-0">
              <td className="py-2 pr-4">{formatDate(row.uploaded_at)}</td>
              <td className="py-2 pr-4">{formatSignedPercent(row.planIncrement)}</td>
              <td className="py-2 pr-4">{formatPercent(row.plan)}</td>
              <td className="py-2 pr-4">{formatSignedPercent(row.actualIncrement)}</td>
              <td className="py-2 pr-4">{formatPercent(row.actual)}</td>
              <td className={`py-2 ${row.deviation >= 0 ? "text-emerald-700" : "text-amber-700"}`}>
                {formatSignedPercent(row.deviation)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
