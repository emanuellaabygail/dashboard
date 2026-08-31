import type { PreviewCellValue } from "@/features/templates/types";

interface ColumnPickerGridProps {
  grid: PreviewCellValue[][];
  includedColumns: Set<number>;
  onToggleColumn: (columnIndex: number) => void;
}

export function ColumnPickerGrid({ grid, includedColumns, onToggleColumn }: ColumnPickerGridProps) {
  const colCount = grid[0]?.length ?? 0;

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full border-collapse text-xs">
        <tbody>
          {grid.map((row, rowIdx) => (
            <tr key={rowIdx}>
              {Array.from({ length: colCount }, (_, colOffset) => {
                const columnIndex = colOffset + 1;
                const cell = row[colOffset];
                const included = includedColumns.has(columnIndex);
                return (
                  <td
                    key={colOffset}
                    role="button"
                    tabIndex={0}
                    onClick={() => onToggleColumn(columnIndex)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onToggleColumn(columnIndex);
                      }
                    }}
                    className={`max-w-[140px] cursor-pointer select-none truncate border-b border-l px-2 py-1.5 ${
                      included
                        ? "bg-primary/15 outline outline-2 -outline-offset-1 outline-primary"
                        : "hover:bg-muted"
                    }`}
                  >
                    {cell === null || cell === undefined || cell === "" ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      String(cell)
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
