import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { formatPercent, hueForIndex } from "@/features/dashboard/lib/format";
import type { ProjectSummaryCategory } from "@/features/dashboard/types";

interface CategoryWeightDonutProps {
  categories: ProjectSummaryCategory[];
}

export function CategoryWeightDonut({ categories }: CategoryWeightDonutProps) {
  const data = categories
    .filter((category) => category.weight_fraction !== null)
    .map((category) => ({ name: category.label, value: category.weight_fraction ?? 0 }));

  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
        No category weights to distribute yet.
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="80%" paddingAngle={2}>
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={hueForIndex(index)} stroke="transparent" />
            ))}
          </Pie>
          <Tooltip formatter={(value) => formatPercent(Number(value), 1)} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
