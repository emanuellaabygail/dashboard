import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CATEGORICAL_HUES, formatPercent } from "@/features/dashboard/lib/format";
import type { ProjectSummaryProcurementBreakdown } from "@/features/dashboard/types";

interface ProcurementBreakdownGridProps {
  data: ProjectSummaryProcurementBreakdown[];
}

// Fixed categorical identity — Procurement and Construction always get the same hue
// everywhere in the dashboard, regardless of a sheet's own category order.
const CATEGORY_COLORS: Record<string, string> = {
  Procurement: CATEGORICAL_HUES[0],
  Construction: CATEGORICAL_HUES[1]
};

function CategoryPanel({
  categoryLabel,
  data,
  color
}: {
  categoryLabel: string;
  data: ProjectSummaryProcurementBreakdown[];
  color: string;
}) {
  const sheets = data.filter((sheet) => sheet.categories[categoryLabel] !== undefined);
  if (sheets.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle>{categoryLabel}</CardTitle>
        <span className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground">Per category — Actual</span>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {sheets.map((sheet) => {
            const actual = sheet.categories[categoryLabel].actual;
            const widthPercent = Math.max(0, Math.min(1, actual)) * 100;
            return (
              <div key={sheet.label} className="space-y-2 rounded-md border p-3">
                <p className="truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {sheet.label}
                </p>
                <p className="text-2xl font-semibold tabular-nums">{sheet.item_count}</p>
                <p className="text-xs text-muted-foreground">item</p>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full" style={{ width: `${widthPercent}%`, backgroundColor: color }} />
                </div>
                <p className="text-xs font-medium tabular-nums" style={{ color: actual > 0 ? color : undefined }}>
                  {formatPercent(actual, 0)} actual
                </p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export function ProcurementBreakdownGrid({ data }: ProcurementBreakdownGridProps) {
  if (data.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <CategoryPanel categoryLabel="Procurement" data={data} color={CATEGORY_COLORS.Procurement} />
      <CategoryPanel categoryLabel="Construction" data={data} color={CATEGORY_COLORS.Construction} />
    </div>
  );
}
