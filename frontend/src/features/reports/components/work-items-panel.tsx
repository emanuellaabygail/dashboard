import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Loader2 } from "lucide-react";

import { Label } from "@/components/ui/label";
import { useReportRows } from "@/features/reports/hooks/use-reports";
import type { Report, WorkItem, WorkItemCategoryValue } from "@/features/reports/types";

function rowKey(item: WorkItem): string {
  return `${item.sheet_name}-${item.row_number}`;
}

/** Items arrive as a flat pre-order (document-order) list with a depth per row, so a
 * collapsed group's descendants are exactly the contiguous run of rows deeper than it —
 * one linear pass tracks whether we're still inside a collapsed group's subtree. */
function useVisibleItems(items: WorkItem[], collapsedKeys: Set<string>): WorkItem[] {
  return useMemo(() => {
    const visible: WorkItem[] = [];
    let hideBelowDepth: number | null = null;
    for (const item of items) {
      const depth = item.depth ?? 1;
      if (hideBelowDepth !== null) {
        if (depth > hideBelowDepth) {
          continue;
        }
        hideBelowDepth = null;
      }
      visible.push(item);
      if (item.is_group && collapsedKeys.has(rowKey(item))) {
        hideBelowDepth = depth;
      }
    }
    return visible;
  }, [items, collapsedKeys]);
}

function formatPercent(value: number | null): string {
  if (value === null || Number.isNaN(value)) {
    return "—";
  }
  return `${(value * 100).toFixed(1)}%`;
}

function CategoryCell({ value }: { value: WorkItemCategoryValue }) {
  const widthPercent = value.actual === null ? 0 : Math.max(0, Math.min(1, value.actual)) * 100;
  return (
    <div className="min-w-[9rem] space-y-1">
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${widthPercent}%` }} />
      </div>
      <p className="text-xs text-muted-foreground">
        Actual {formatPercent(value.actual)} · Plan {formatPercent(value.plan)}
      </p>
    </div>
  );
}

interface WorkItemsPanelProps {
  report: Report;
  selectedSheet: string;
  onSelectSheet: (sheet: string) => void;
  categoryFilter?: string;
}

export function WorkItemsPanel({ report, selectedSheet, onSelectSheet, categoryFilter }: WorkItemsPanelProps) {
  const rowsQuery = useReportRows(report.id, selectedSheet);
  const [collapsedKeys, setCollapsedKeys] = useState<Set<string>>(new Set());

  const sheetNames = rowsQuery.data?.sheet_names ?? [];
  const allItems = rowsQuery.data?.items ?? [];
  const items = categoryFilter
    ? allItems.filter((item) => item.is_group || item.categories[categoryFilter] !== undefined)
    : allItems;
  const categoryLabels = categoryFilter
    ? [categoryFilter]
    : Array.from(new Set(items.flatMap((item) => Object.keys(item.categories))));
  const visibleItems = useVisibleItems(items, collapsedKeys);

  const toggleGroup = (item: WorkItem) => {
    const key = rowKey(item);
    setCollapsedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <Label htmlFor="work-items-sheet" className="text-xs text-muted-foreground">
            Sheet
          </Label>
          <select
            id="work-items-sheet"
            className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-64"
            value={selectedSheet}
            onChange={(event) => onSelectSheet(event.target.value)}
          >
            <option value="">All sheets</option>
            {sheetNames.map((sheetName) => (
              <option key={sheetName} value={sheetName}>
                {sheetName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {rowsQuery.isLoading ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          Loading work items…
        </p>
      ) : rowsQuery.isError ? (
        <p className="text-sm text-destructive">Could not load work items for this report.</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {categoryFilter
            ? `No work items have a "${categoryFilter}" progress category configured yet.`
            : 'No work items to show. Configure a "work item label column" and at least one progress category on ' +
              "this sheet's template, then re-parse this report."}
        </p>
      ) : (
        <div className="max-h-[32rem] overflow-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-muted/50 text-left text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Work item</th>
                {!selectedSheet ? <th className="px-3 py-2 font-medium">Sheet</th> : null}
                {categoryLabels.map((label) => (
                  <th key={label} className="px-3 py-2 font-medium">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {visibleItems.map((item) => {
                const indent = Math.max(0, (item.depth ?? 1) - 1);
                const collapsed = item.is_group && collapsedKeys.has(rowKey(item));
                return (
                  <tr key={rowKey(item)} className={item.is_group ? "bg-muted/30" : undefined}>
                    <td
                      className="max-w-sm px-3 py-2"
                      style={{ paddingLeft: `${0.75 + indent * 1.25}rem` }}
                    >
                      <div className="flex items-center gap-1">
                        {item.is_group ? (
                          <button
                            type="button"
                            onClick={() => toggleGroup(item)}
                            className="shrink-0 rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                            aria-label={collapsed ? "Expand group" : "Collapse group"}
                          >
                            {collapsed ? (
                              <ChevronRight className="size-3.5" aria-hidden="true" />
                            ) : (
                              <ChevronDown className="size-3.5" aria-hidden="true" />
                            )}
                          </button>
                        ) : (
                          <span className="inline-block size-3.5 shrink-0" aria-hidden="true" />
                        )}
                        <span className={item.is_group ? "font-semibold" : undefined}>{item.label}</span>
                      </div>
                    </td>
                    {!selectedSheet ? (
                      <td className="px-3 py-2 text-muted-foreground">{item.sheet_name}</td>
                    ) : null}
                    {categoryLabels.map((label) => {
                      const value = item.categories[label];
                      return (
                        <td key={label} className="px-3 py-2">
                          {item.is_group ? null : value ? (
                            <CategoryCell value={value} />
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
