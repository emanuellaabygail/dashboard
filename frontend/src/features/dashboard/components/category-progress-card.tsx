import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatPercent, formatSignedPercent } from "@/features/dashboard/lib/format";
import type { ProjectSummaryCategory } from "@/features/dashboard/types";

interface CategoryProgressCardProps {
  category: ProjectSummaryCategory;
  color: string;
}

function ProgressBar({ label, value, color }: { label: string; value: number; color: string }) {
  const widthPercent = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div className="flex items-center gap-3">
      <span className="w-14 shrink-0 text-xs text-muted-foreground">{label}</span>
      <div className="h-3 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full"
          style={{ width: `${widthPercent}%`, backgroundColor: color }}
        />
      </div>
      <span className="w-16 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
        {formatPercent(value)}
      </span>
    </div>
  );
}

export function CategoryProgressCard({ category, color }: CategoryProgressCardProps) {
  const isAhead = category.deviation >= 0;

  return (
    <Card className="border-l-4" style={{ borderLeftColor: color }}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <span className="font-semibold">{category.label}</span>
        {category.weight_fraction !== null ? (
          <span className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
            WF {formatPercent(category.weight_fraction, 1)}
          </span>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        <ProgressBar label="Plan" value={category.plan} color="#94a3b8" />
        <ProgressBar label="Actual" value={category.actual} color={color} />
        <div className="flex items-center gap-2 pt-1">
          <span className="text-xs text-muted-foreground">Dev</span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              isAhead ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
            }`}
          >
            {formatSignedPercent(category.deviation)} {isAhead ? "on track" : "behind"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
