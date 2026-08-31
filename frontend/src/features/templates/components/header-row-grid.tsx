import { useEffect, useRef, useState } from "react";

import type { PreviewCellValue } from "@/features/templates/types";

const ROW_HEIGHT = 29;
const OVERSCAN = 8;

interface HeaderRowGridProps {
  rows: PreviewCellValue[][];
  headerRowStart: number | null;
  headerRowEnd: number | null;
  onRowClick: (rowNumber: number, shiftKey: boolean) => void;
}

export function HeaderRowGrid({ rows, headerRowStart, headerRowEnd, onRowClick }: HeaderRowGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(384);

  useEffect(() => {
    if (containerRef.current) {
      setViewportHeight(containerRef.current.clientHeight);
    }
  }, []);

  const totalRows = rows.length;
  const visibleCount = Math.ceil(viewportHeight / ROW_HEIGHT) + OVERSCAN * 2;
  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const endIndex = Math.min(totalRows, startIndex + visibleCount);
  const topSpacerHeight = startIndex * ROW_HEIGHT;
  const bottomSpacerHeight = (totalRows - endIndex) * ROW_HEIGHT;
  const maxColumns = rows.reduce((max, row) => Math.max(max, row.length), 0);

  return (
    <div
      ref={containerRef}
      className="max-h-96 overflow-auto rounded-md border"
      onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
    >
      <table className="w-full border-collapse text-xs">
        <tbody>
          {topSpacerHeight > 0 ? (
            <tr aria-hidden="true" style={{ height: topSpacerHeight }}>
              <td colSpan={maxColumns + 1} />
            </tr>
          ) : null}
          {rows.slice(startIndex, endIndex).map((row, offset) => {
            const rowIndex = startIndex + offset;
            const rowNumber = rowIndex + 1;
            const isInRange =
              headerRowStart !== null &&
              headerRowEnd !== null &&
              rowNumber >= headerRowStart &&
              rowNumber <= headerRowEnd;
            return (
              <tr key={rowNumber} className={isInRange ? "bg-secondary" : undefined} style={{ height: ROW_HEIGHT }}>
                <td className="sticky left-0 z-10 border-b bg-muted/70 p-0">
                  <button
                    type="button"
                    onClick={(event) => onRowClick(rowNumber, event.shiftKey)}
                    className={`flex h-full w-10 items-center justify-center px-2 py-1.5 font-medium ${
                      isInRange ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {rowNumber}
                  </button>
                </td>
                {row.map((cell, cellIdx) => (
                  <td key={cellIdx} className="max-w-[160px] truncate border-b border-l px-2 py-1.5">
                    {cell === null || cell === undefined || cell === "" ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      String(cell)
                    )}
                  </td>
                ))}
              </tr>
            );
          })}
          {bottomSpacerHeight > 0 ? (
            <tr aria-hidden="true" style={{ height: bottomSpacerHeight }}>
              <td colSpan={maxColumns + 1} />
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
