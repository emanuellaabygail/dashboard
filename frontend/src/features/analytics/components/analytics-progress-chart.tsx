import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { AnalyticsProgressPoint } from "@/features/analytics/types";

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

interface AnalyticsProgressChartProps {
  data: AnalyticsProgressPoint[];
}

export function AnalyticsProgressChart({ data }: AnalyticsProgressChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
        No progress data for this selection. Make sure the project's template has progress fields configured and
        reports have been parsed.
      </div>
    );
  }

  const chartData = data.map((point) => ({ ...point, label: formatDate(point.uploaded_at) }));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip formatter={(value, name) => [Number(value).toFixed(3), name]} />
          <Legend />
          <Line type="monotone" dataKey="plan" name="Plan (cumulative bobot)" stroke="#94a3b8" strokeWidth={2} dot />
          <Line type="monotone" dataKey="actual" name="Actual (cumulative bobot)" stroke="#2563eb" strokeWidth={2} dot />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
