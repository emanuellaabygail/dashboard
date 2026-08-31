import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { formatDate } from "@/features/dashboard/lib/format";
import type { ProjectSummarySCurvePoint } from "@/features/dashboard/types";

interface SCurveChartProps {
  data: ProjectSummarySCurvePoint[];
}

export function SCurveChart({ data }: SCurveChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
        No progress data yet. Configure an "Overall" progress category on the template and parse a report to see
        the S-curve.
      </div>
    );
  }

  const chartData = data.map((point) => ({
    ...point,
    label: formatDate(point.uploaded_at),
    planPercent: point.plan * 100,
    actualPercent: point.actual * 100
  }));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} unit="%" />
          <Tooltip formatter={(value, name) => [`${Number(value).toFixed(2)}%`, name]} />
          <Legend />
          <Line
            type="monotone"
            dataKey="planPercent"
            name="Plan"
            stroke="#94a3b8"
            strokeWidth={2}
            strokeDasharray="4 3"
            dot={{ r: 3 }}
          />
          <Line type="monotone" dataKey="actualPercent" name="Actual" stroke="#2a78d6" strokeWidth={2} dot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
