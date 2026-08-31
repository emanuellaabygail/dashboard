import { useState } from "react";
import { isAxiosError } from "axios";
import { ChevronLeft, Loader2, Pencil, Trash2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ColumnPickerGrid } from "@/features/templates/components/column-picker-grid";
import { HeaderRowGrid } from "@/features/templates/components/header-row-grid";
import { useProjects } from "@/features/projects/hooks/use-projects";
import { useTemplatePreview } from "@/features/templates/hooks/use-templates";
import type {
  ColumnMapping,
  ExcelPreview,
  MergedRange,
  PreviewCellValue,
  Template,
  TemplatePayload,
  TemplateSheetConfig
} from "@/features/templates/types";

function slugify(label: string): string {
  const slug = label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return slug || "field";
}

function getPreviewErrorMessage(error: unknown): string {
  if (isAxiosError(error) && error.response?.data && typeof error.response.data === "object") {
    const detail = (error.response.data as { detail?: string }).detail;
    if (detail) {
      return detail;
    }
  }
  return "Could not read the uploaded file. Make sure it is a valid Excel workbook.";
}

function getSaveErrorMessage(error: unknown): string {
  if (isAxiosError(error) && error.response?.data && typeof error.response.data === "object") {
    const messages = Object.values(error.response.data as Record<string, unknown>).flatMap((value) =>
      Array.isArray(value) ? value.map(String) : [String(value)]
    );
    if (messages.length > 0) {
      return messages.join(" ");
    }
  }
  return "Could not save the template. Check your inputs and try again.";
}

function buildFilledGrid(
  rows: PreviewCellValue[][],
  merges: MergedRange[],
  rowStart: number,
  rowEnd: number,
  colCount: number
): PreviewCellValue[][] {
  const grid: PreviewCellValue[][] = [];
  for (let r = rowStart; r <= rowEnd; r += 1) {
    const sourceRow = rows[r - 1] ?? [];
    const rowCopy: PreviewCellValue[] = [];
    for (let c = 1; c <= colCount; c += 1) {
      rowCopy.push(sourceRow[c - 1] ?? null);
    }
    grid.push(rowCopy);
  }

  merges.forEach((merge) => {
    if (merge.max_row < rowStart || merge.min_row > rowEnd) {
      return;
    }
    const topLeftValue = rows[merge.min_row - 1]?.[merge.min_col - 1] ?? null;
    for (let r = Math.max(merge.min_row, rowStart); r <= Math.min(merge.max_row, rowEnd); r += 1) {
      for (let c = merge.min_col; c <= Math.min(merge.max_col, colCount); c += 1) {
        grid[r - rowStart][c - 1] = topLeftValue;
      }
    }
  });

  return grid;
}

function combineColumnLabel(grid: PreviewCellValue[][], columnIndex: number): string {
  const parts: string[] = [];
  let last = "";
  grid.forEach((row) => {
    const raw = row[columnIndex - 1];
    const text = raw === null || raw === undefined ? "" : String(raw).trim();
    if (text && text !== last) {
      parts.push(text);
      last = text;
    }
  });
  return parts.join(" / ");
}

interface ColumnSelection {
  included: boolean;
  headerLabel: string;
  fieldKey: string;
}

function buildColumnSelections(
  grid: PreviewCellValue[][],
  existingSheet?: TemplateSheetConfig
): Record<number, ColumnSelection> {
  const colCount = grid[0]?.length ?? 0;
  const existingByIndex = new Map(existingSheet?.column_mappings.map((mapping) => [mapping.column_index, mapping]));
  const usedKeys = new Map<string, number>();
  const selections: Record<number, ColumnSelection> = {};

  for (let col = 1; col <= colCount; col += 1) {
    const combinedLabel = combineColumnLabel(grid, col);
    const existing = existingByIndex.get(col);
    let fieldKey = existing?.field_key ?? (combinedLabel ? slugify(combinedLabel) : "");
    if (fieldKey) {
      const occurrences = usedKeys.get(fieldKey) ?? 0;
      usedKeys.set(fieldKey, occurrences + 1);
      if (occurrences > 0) {
        fieldKey = `${fieldKey}_${occurrences + 1}`;
      }
    }
    selections[col] = {
      included: Boolean(existing),
      headerLabel: combinedLabel,
      fieldKey
    };
  }

  return selections;
}

interface DraftProgressCategory {
  label: string;
  planColumnIndex: number | null;
  actualColumnIndex: number | null;
  matchLabel: string;
  itemPlanColumnIndex: number | null;
  itemActualColumnIndex: number | null;
}

interface SheetDraft {
  editingIndex: number | null;
  step: "select-range" | "map-columns";
  headerRowStart: number | null;
  headerRowEnd: number | null;
  rangeAnchor: number | null;
  headerGrid: PreviewCellValue[][];
  columnSelections: Record<number, ColumnSelection>;
  keyColumnIndexes: number[];
  keyDepth: number;
  progressCategories: DraftProgressCategory[];
  labelColumnIndexes: number[];
  totalRowLabelsText: string;
}

interface TemplateWizardProps {
  template?: Template;
  isSubmitting: boolean;
  onSubmit: (payload: TemplatePayload) => Promise<void> | void;
  onCancel: () => void;
}

export function TemplateWizard({ template, isSubmitting, onSubmit, onCancel }: TemplateWizardProps) {
  const projectsQuery = useProjects({});
  const previewMutation = useTemplatePreview();

  const [projectId, setProjectId] = useState<number | "">(template?.project ?? "");
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ExcelPreview | null>(null);
  const [configuredSheets, setConfiguredSheets] = useState<TemplateSheetConfig[]>(template?.sheets ?? []);
  const [draft, setDraft] = useState<SheetDraft | null>(null);
  const [applyFilterTargets, setApplyFilterTargets] = useState<Set<string>>(new Set());

  const [name, setName] = useState(template?.name ?? "");
  const [description, setDescription] = useState(template?.description ?? "");
  const [isActive, setIsActive] = useState(template?.is_active ?? true);
  const [saveError, setSaveError] = useState<string | null>(null);

  const runPreview = async (file: File, sheetName?: string, full?: boolean) => {
    const result = await previewMutation.mutateAsync({ file, sheetName, full });
    setCurrentFile(file);
    setPreview(result);
    return result;
  };

  const handleFileSelected = async (file: File) => {
    setDraft(null);
    await runPreview(file);
  };

  const handleSheetChange = async (sheetName: string) => {
    if (!currentFile) {
      return;
    }
    setDraft(null);
    await runPreview(currentFile, sheetName);
  };

  const handleLoadFullSheet = async () => {
    if (!currentFile || !preview) {
      return;
    }
    await runPreview(currentFile, preview.sheet_name, true);
  };

  const startNewDraft = () => {
    setApplyFilterTargets(new Set());
    setDraft({
      editingIndex: null,
      step: "select-range",
      headerRowStart: null,
      headerRowEnd: null,
      rangeAnchor: null,
      headerGrid: [],
      columnSelections: {},
      keyColumnIndexes: [],
      keyDepth: 2,
      progressCategories: [],
      labelColumnIndexes: [],
      totalRowLabelsText: ""
    });
  };

  const startEditingSheet = async (index: number) => {
    if (!currentFile) {
      return;
    }
    setApplyFilterTargets(new Set());
    const existing = configuredSheets[index];
    const result = await runPreview(currentFile, existing.sheet_name);
    const colCount = result.rows[0]?.length ?? 0;
    const grid = buildFilledGrid(
      result.rows,
      result.merges,
      existing.header_row_start,
      existing.header_row_end,
      colCount
    );
    setDraft({
      editingIndex: index,
      step: "map-columns",
      headerRowStart: existing.header_row_start,
      headerRowEnd: existing.header_row_end,
      rangeAnchor: existing.header_row_start,
      headerGrid: grid,
      columnSelections: buildColumnSelections(grid, existing),
      keyColumnIndexes: existing.key_column_indexes ?? [],
      keyDepth: existing.key_depth ?? 2,
      progressCategories: (existing.progress_categories ?? []).map((category) => ({
        label: category.label,
        planColumnIndex:
          existing.column_mappings.find((mapping) => mapping.field_key === category.plan_field_key)
            ?.column_index ?? null,
        actualColumnIndex:
          existing.column_mappings.find((mapping) => mapping.field_key === category.actual_field_key)
            ?.column_index ?? null,
        matchLabel: category.match_label ?? "",
        itemPlanColumnIndex:
          existing.column_mappings.find((mapping) => mapping.field_key === category.item_plan_field_key)
            ?.column_index ?? null,
        itemActualColumnIndex:
          existing.column_mappings.find((mapping) => mapping.field_key === category.item_actual_field_key)
            ?.column_index ?? null
      })),
      labelColumnIndexes: (existing.label_field_keys ?? [])
        .map((fieldKey) => existing.column_mappings.find((mapping) => mapping.field_key === fieldKey)?.column_index)
        .filter((columnIndex): columnIndex is number => columnIndex !== undefined),
      totalRowLabelsText: (existing.total_row_labels ?? []).join(", ")
    });
  };

  const handleRowClick = (rowNumber: number, shiftKey: boolean) => {
    if (!draft) {
      return;
    }
    if (shiftKey && draft.rangeAnchor !== null) {
      setDraft({
        ...draft,
        headerRowStart: Math.min(draft.rangeAnchor, rowNumber),
        headerRowEnd: Math.max(draft.rangeAnchor, rowNumber)
      });
    } else {
      setDraft({ ...draft, rangeAnchor: rowNumber, headerRowStart: rowNumber, headerRowEnd: rowNumber });
    }
  };

  const proceedToColumnMapping = () => {
    if (!draft || !preview || draft.headerRowStart === null || draft.headerRowEnd === null) {
      return;
    }
    const existing = draft.editingIndex !== null ? configuredSheets[draft.editingIndex] : undefined;
    const colCount = preview.rows[0]?.length ?? 0;
    const grid = buildFilledGrid(preview.rows, preview.merges, draft.headerRowStart, draft.headerRowEnd, colCount);
    setDraft({
      ...draft,
      step: "map-columns",
      headerGrid: grid,
      columnSelections: buildColumnSelections(grid, existing)
    });
  };

  const toggleColumn = (columnIndex: number) => {
    if (!draft) {
      return;
    }
    const willInclude = !draft.columnSelections[columnIndex].included;
    setDraft({
      ...draft,
      columnSelections: {
        ...draft.columnSelections,
        [columnIndex]: {
          ...draft.columnSelections[columnIndex],
          included: willInclude
        }
      },
      keyColumnIndexes: willInclude
        ? draft.keyColumnIndexes
        : draft.keyColumnIndexes.filter((index) => index !== columnIndex),
      progressCategories: willInclude
        ? draft.progressCategories
        : draft.progressCategories.map((category) => ({
            ...category,
            planColumnIndex: category.planColumnIndex === columnIndex ? null : category.planColumnIndex,
            actualColumnIndex: category.actualColumnIndex === columnIndex ? null : category.actualColumnIndex,
            itemPlanColumnIndex:
              category.itemPlanColumnIndex === columnIndex ? null : category.itemPlanColumnIndex,
            itemActualColumnIndex:
              category.itemActualColumnIndex === columnIndex ? null : category.itemActualColumnIndex
          })),
      labelColumnIndexes: willInclude
        ? draft.labelColumnIndexes
        : draft.labelColumnIndexes.filter((index) => index !== columnIndex)
    });
  };

  const updateFieldKey = (columnIndex: number, fieldKey: string) => {
    if (!draft) {
      return;
    }
    setDraft({
      ...draft,
      columnSelections: {
        ...draft.columnSelections,
        [columnIndex]: { ...draft.columnSelections[columnIndex], fieldKey }
      }
    });
  };

  const includedColumns = draft
    ? Object.entries(draft.columnSelections)
        .map(([columnIndex, selection]) => ({ columnIndex: Number(columnIndex), ...selection }))
        .filter((column) => column.included)
    : [];

  const fieldKeyOccurrences = new Map<string, number>();
  includedColumns.forEach((column) => {
    const key = column.fieldKey.trim();
    if (key) {
      fieldKeyOccurrences.set(key, (fieldKeyOccurrences.get(key) ?? 0) + 1);
    }
  });
  const hasDuplicateFieldKeys = Array.from(fieldKeyOccurrences.values()).some((count) => count > 1);

  const canSaveSheet =
    includedColumns.length > 0 &&
    includedColumns.every((column) => column.fieldKey.trim().length > 0) &&
    !hasDuplicateFieldKeys;

  const saveSheetDraft = () => {
    if (!draft || !preview || draft.headerRowStart === null || draft.headerRowEnd === null || !canSaveSheet) {
      return;
    }

    const column_mappings: ColumnMapping[] = includedColumns.map((column) => ({
      column_index: column.columnIndex,
      header_label: column.headerLabel,
      field_key: column.fieldKey.trim()
    }));

    const progress_categories = draft.progressCategories
      .map((category) => {
        const planFieldKey = includedColumns.find(
          (column) => column.columnIndex === category.planColumnIndex
        )?.fieldKey;
        const actualFieldKey = includedColumns.find(
          (column) => column.columnIndex === category.actualColumnIndex
        )?.fieldKey;
        const itemPlanFieldKey = includedColumns.find(
          (column) => column.columnIndex === category.itemPlanColumnIndex
        )?.fieldKey;
        const itemActualFieldKey = includedColumns.find(
          (column) => column.columnIndex === category.itemActualColumnIndex
        )?.fieldKey;
        return {
          label: category.label.trim(),
          plan_field_key: planFieldKey,
          actual_field_key: actualFieldKey,
          match_label: category.matchLabel.trim(),
          item_plan_field_key: itemPlanFieldKey ?? "",
          item_actual_field_key: itemActualFieldKey ?? ""
        };
      })
      .filter(
        (
          category
        ): category is {
          label: string;
          plan_field_key: string;
          actual_field_key: string;
          match_label: string;
          item_plan_field_key: string;
          item_actual_field_key: string;
        } => Boolean(category.label && category.plan_field_key && category.actual_field_key)
      );

    const labelFieldKeys = draft.labelColumnIndexes
      .map((columnIndex) => includedColumns.find((column) => column.columnIndex === columnIndex)?.fieldKey)
      .filter((fieldKey): fieldKey is string => fieldKey !== undefined);

    const keyFieldKeys = draft.keyColumnIndexes
      .map((columnIndex) => includedColumns.find((column) => column.columnIndex === columnIndex)?.fieldKey)
      .filter((fieldKey): fieldKey is string => fieldKey !== undefined);

    const totalRowLabels = draft.totalRowLabelsText
      .split(",")
      .map((label) => label.trim())
      .filter((label) => label.length > 0);

    const sheetConfig: TemplateSheetConfig = {
      sheet_name: preview.sheet_name,
      header_row_start: draft.headerRowStart,
      header_row_end: draft.headerRowEnd,
      column_mappings,
      key_column_indexes: keyFieldKeys.length > 0 ? draft.keyColumnIndexes : [],
      key_depth: keyFieldKeys.length > 0 ? draft.keyDepth : null,
      progress_categories,
      label_field_keys: labelFieldKeys,
      total_row_labels: labelFieldKeys.length > 0 ? totalRowLabels : []
    };

    setConfiguredSheets((prev) => {
      let next: TemplateSheetConfig[];
      if (draft.editingIndex !== null) {
        next = prev.map((sheet, index) => (index === draft.editingIndex ? sheetConfig : sheet));
      } else {
        const matchIndex = prev.findIndex((sheet) => sheet.sheet_name === sheetConfig.sheet_name);
        next = matchIndex >= 0 ? prev.map((sheet, index) => (index === matchIndex ? sheetConfig : sheet)) : [...prev, sheetConfig];
      }

      if ((keyFieldKeys.length > 0 || progress_categories.length > 0 || labelFieldKeys.length > 0) && applyFilterTargets.size > 0) {
        next = next.map((sheet) => {
          if (sheet.sheet_name === sheetConfig.sheet_name || !applyFilterTargets.has(sheet.sheet_name)) {
            return sheet;
          }
          let updated = sheet;
          if (keyFieldKeys.length > 0) {
            const targetFieldKeys = new Set(sheet.column_mappings.map((mapping) => mapping.field_key));
            const matchingKeyIndexes = sheet.column_mappings
              .filter((mapping) => keyFieldKeys.includes(mapping.field_key) && targetFieldKeys.has(mapping.field_key))
              .map((mapping) => mapping.column_index);
            if (matchingKeyIndexes.length > 0) {
              updated = { ...updated, key_column_indexes: matchingKeyIndexes, key_depth: draft.keyDepth };
            }
          }
          if (labelFieldKeys.length > 0) {
            const targetFieldKeys = new Set(sheet.column_mappings.map((mapping) => mapping.field_key));
            const matchingLabelKeys = labelFieldKeys.filter((fieldKey) => targetFieldKeys.has(fieldKey));
            if (matchingLabelKeys.length > 0) {
              updated = { ...updated, label_field_keys: matchingLabelKeys };
            }
          }
          if (progress_categories.length > 0) {
            const targetFieldKeys = new Set(sheet.column_mappings.map((mapping) => mapping.field_key));
            const matchingCategories = progress_categories.filter(
              (category) => targetFieldKeys.has(category.plan_field_key) && targetFieldKeys.has(category.actual_field_key)
            );
            if (matchingCategories.length > 0) {
              const existingByLabel = new Map(
                (updated.progress_categories ?? []).map((category) => [category.label, category])
              );
              matchingCategories.forEach((category) => existingByLabel.set(category.label, category));
              updated = { ...updated, progress_categories: Array.from(existingByLabel.values()) };
            }
          }
          return updated;
        });
      }

      return next;
    });

    setApplyFilterTargets(new Set());
    setDraft(null);
  };

  const removeSheet = (index: number) => {
    setConfiguredSheets((prev) => prev.filter((_, i) => i !== index));
  };

  const canSaveTemplate = name.trim().length > 0 && configuredSheets.length > 0 && projectId !== "";

  const handleSaveTemplate = async () => {
    if (!canSaveTemplate) {
      return;
    }
    setSaveError(null);
    try {
      await onSubmit({
        project: projectId,
        name: name.trim(),
        description: description.trim(),
        is_active: isActive,
        sheets: configuredSheets
      });
    } catch (error) {
      setSaveError(getSaveErrorMessage(error));
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="wizard-project">Project</Label>
          <select
            id="wizard-project"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            value={projectId}
            disabled={Boolean(template)}
            onChange={(event) => setProjectId(event.target.value ? Number(event.target.value) : "")}
          >
            <option value="">Select a project</option>
            {projectsQuery.data?.results.map((project) => (
              <option key={project.id} value={project.id}>
                {project.code} — {project.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="wizard-file">Sample Excel file</Label>
          <div className="flex items-center gap-3">
            <label
              htmlFor="wizard-file"
              className="flex flex-1 cursor-pointer items-center gap-2 rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground hover:border-primary hover:text-foreground"
            >
              <Upload className="size-4 shrink-0" aria-hidden="true" />
              <span className="truncate">
                {previewMutation.isPending
                  ? "Reading file"
                  : currentFile
                    ? currentFile.name
                    : "Click to upload a sample report"}
              </span>
            </label>
            <input
              id="wizard-file"
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              disabled={projectId === "" || previewMutation.isPending}
              onChange={async (event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) {
                  await handleFileSelected(file);
                }
              }}
            />
          </div>
        </div>
      </div>
      {projectId === "" ? (
        <p className="text-sm text-muted-foreground">Choose a project before uploading a file.</p>
      ) : null}
      {previewMutation.isError ? (
        <p className="text-sm text-destructive">{getPreviewErrorMessage(previewMutation.error)}</p>
      ) : null}

      {preview && !draft ? (
        <div className="space-y-2 rounded-md border p-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <Label htmlFor="wizard-sheet">Sheet</Label>
              <select
                id="wizard-sheet"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 sm:w-64"
                value={preview.sheet_name}
                disabled={previewMutation.isPending}
                onChange={(event) => handleSheetChange(event.target.value)}
              >
                {preview.sheet_names.map((sheetName) => (
                  <option key={sheetName} value={sheetName}>
                    {sheetName}
                  </option>
                ))}
              </select>
            </div>
            {previewMutation.isPending ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Loading sheet…
              </p>
            ) : (
              <Button type="button" onClick={startNewDraft}>
                Configure this sheet
              </Button>
            )}
          </div>
        </div>
      ) : null}

      {draft && draft.step === "select-range" && preview ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Click the row that starts your header. Shift-click another row to extend the header across multiple
            rows (for grouped category headers).
          </p>

          {preview.rows.length < preview.total_rows ? (
            <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              Showing the first {preview.rows.length} of {preview.total_rows} rows.
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={previewMutation.isPending}
                onClick={handleLoadFullSheet}
              >
                {previewMutation.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    Loading…
                  </>
                ) : (
                  "Load full sheet"
                )}
              </Button>
            </p>
          ) : null}

          <HeaderRowGrid
            rows={preview.rows}
            headerRowStart={draft.headerRowStart}
            headerRowEnd={draft.headerRowEnd}
            onRowClick={handleRowClick}
          />

          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => setDraft(null)}>
              <ChevronLeft className="size-4" aria-hidden="true" />
              Cancel
            </Button>
            <Button type="button" disabled={draft.headerRowStart === null} onClick={proceedToColumnMapping}>
              Continue
            </Button>
          </div>
        </div>
      ) : null}

      {draft && draft.step === "map-columns" ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Select the columns you need</Label>
            <p className="text-sm text-muted-foreground">
              Click a cell to select or deselect its column. Only selected columns are saved.
            </p>
            <ColumnPickerGrid
              grid={draft.headerGrid}
              includedColumns={
                new Set(
                  Object.entries(draft.columnSelections)
                    .filter(([, selection]) => selection.included)
                    .map(([columnIndex]) => Number(columnIndex))
                )
              }
              onToggleColumn={toggleColumn}
            />
          </div>

          <div className="space-y-2">
            <Label>Field names</Label>
            {includedColumns.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No columns selected yet. Click cells above to add them here.
              </p>
            ) : (
              <div className="max-h-72 space-y-2 overflow-auto rounded-md border p-3">
                {includedColumns.map((column) => {
                  const trimmedKey = column.fieldKey.trim();
                  const isDuplicate = trimmedKey.length > 0 && (fieldKeyOccurrences.get(trimmedKey) ?? 0) > 1;
                  return (
                    <div key={column.columnIndex} className="flex items-center gap-3">
                      <div className="w-48 shrink-0 truncate text-sm text-muted-foreground" title={column.headerLabel}>
                        {column.headerLabel || `Column ${column.columnIndex}`}
                      </div>
                      <div className="max-w-xs flex-1">
                        <Input
                          placeholder="field_key"
                          disabled={isSubmitting}
                          value={column.fieldKey}
                          onChange={(event) => updateFieldKey(column.columnIndex, event.target.value)}
                          className={isDuplicate ? "border-destructive" : undefined}
                        />
                        {isDuplicate ? (
                          <p className="mt-1 text-xs text-destructive">Duplicate field key.</p>
                        ) : null}
                      </div>
                      <Button
                        aria-label={`Remove ${column.headerLabel || `Column ${column.columnIndex}`}`}
                        type="button"
                        size="icon"
                        variant="ghost"
                        disabled={isSubmitting}
                        onClick={() => toggleColumn(column.columnIndex)}
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {includedColumns.length > 0 ? (
            <div className="space-y-2 rounded-md border p-3">
              <Label>Keep only one grouping level (optional)</Label>
              <p className="text-sm text-muted-foreground">
                Numbering (e.g. "1.1", "III.1.1") is often split across columns by indent depth — check every
                column that can hold it. Then pick the exact depth to keep: 1 for top sections, 2 for "1.1", 3 for
                "1.1.1", and so on. Only rows at that exact depth are kept — shallower rollup rows and deeper
                sub-items are both skipped, so items never overlap with their own subtotal.
              </p>
              <div className="flex flex-wrap gap-3">
                {includedColumns.map((column) => (
                  <label key={column.columnIndex} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="size-4 rounded border-input"
                      checked={draft.keyColumnIndexes.includes(column.columnIndex)}
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          keyColumnIndexes: event.target.checked
                            ? [...draft.keyColumnIndexes, column.columnIndex].sort((a, b) => a - b)
                            : draft.keyColumnIndexes.filter((index) => index !== column.columnIndex)
                        })
                      }
                    />
                    {column.headerLabel || `Column ${column.columnIndex}`}
                  </label>
                ))}
              </div>
              {draft.keyColumnIndexes.length > 0 ? (
                <div className="flex items-center gap-2 pt-1">
                  <Label htmlFor="wizard-key-depth" className="whitespace-nowrap">
                    Depth to keep
                  </Label>
                  <Input
                    id="wizard-key-depth"
                    type="number"
                    min={1}
                    className="w-20"
                    value={draft.keyDepth}
                    onChange={(event) =>
                      setDraft({ ...draft, keyDepth: Math.max(1, Number(event.target.value) || 1) })
                    }
                  />
                </div>
              ) : null}
            </div>
          ) : null}

          {includedColumns.length > 0 ? (
            <div className="space-y-2 rounded-md border p-3">
              <Label>Work item label column(s) (optional)</Label>
              <p className="text-sm text-muted-foreground">
                Pick the column(s) that name each work item (e.g. "Lingkup Pekerjaan"). Item descriptions are often
                split across several columns by indent depth — check every one that can hold a label; the leftmost
                checked column with a value wins for each row. This powers the Dashboard's per-item progress view —
                rows without a label here, or without any progress data, are skipped there.
              </p>
              <div className="flex flex-wrap gap-3">
                {includedColumns.map((column) => (
                  <label key={column.columnIndex} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="size-4 rounded border-input"
                      checked={draft.labelColumnIndexes.includes(column.columnIndex)}
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          labelColumnIndexes: event.target.checked
                            ? [...draft.labelColumnIndexes, column.columnIndex].sort((a, b) => a - b)
                            : draft.labelColumnIndexes.filter((index) => index !== column.columnIndex)
                        })
                      }
                    />
                    {column.headerLabel || `Column ${column.columnIndex}`}
                  </label>
                ))}
              </div>
            </div>
          ) : null}

          {includedColumns.length > 0 && draft.labelColumnIndexes.length > 0 ? (
            <div className="space-y-2 rounded-md border p-3">
              <Label>Sheet total row label(s) (optional)</Label>
              <p className="text-sm text-muted-foreground">
                If this sheet has its own pre-computed "TOTAL" row(s) at the bottom of a section (e.g. "TOTAL III"),
                enter the exact label text here, comma-separated if there's more than one. The Dashboard's
                Procurement breakdown reads that row's values directly instead of re-summing items, since Excel's
                own total already includes everything in the section.
              </p>
              <Input
                placeholder='e.g. "TOTAL III" or "TOTAL I, TOTAL II"'
                value={draft.totalRowLabelsText}
                onChange={(event) => setDraft({ ...draft, totalRowLabelsText: event.target.value })}
              />
            </div>
          ) : null}

          {includedColumns.length > 0 ? (
            <div className="space-y-3 rounded-md border p-3">
              <Label>Progress categories (optional)</Label>
              <p className="text-sm text-muted-foreground">
                Add a row per progress category this sheet tracks (e.g. "Procurement", "Construction", "Overall"),
                each with its planned and actual weight columns (e.g. "Bobot Plan" / "Bobot Actual"). The Dashboard
                and Analytics pages sum a category's values across every sheet that defines it — use the exact same
                label (e.g. "Overall") on every sheet that should roll up together. A category literally labeled
                "Overall" drives the headline KPIs and S-curve; the rest become the per-category breakdown.
              </p>

              {draft.progressCategories.length > 0 ? (
                <div className="space-y-2">
                  {draft.progressCategories.map((category, index) => (
                    <div key={index} className="grid gap-2 rounded-md border p-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Label</Label>
                        <Input
                          placeholder="e.g. Overall"
                          value={category.label}
                          onChange={(event) =>
                            setDraft({
                              ...draft,
                              progressCategories: draft.progressCategories.map((item, itemIndex) =>
                                itemIndex === index ? { ...item, label: event.target.value } : item
                              )
                            })
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Plan column</Label>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          value={category.planColumnIndex ?? ""}
                          onChange={(event) =>
                            setDraft({
                              ...draft,
                              progressCategories: draft.progressCategories.map((item, itemIndex) =>
                                itemIndex === index
                                  ? { ...item, planColumnIndex: event.target.value ? Number(event.target.value) : null }
                                  : item
                              )
                            })
                          }
                        >
                          <option value="">Not set</option>
                          {includedColumns.map((column) => (
                            <option key={column.columnIndex} value={column.columnIndex}>
                              {column.headerLabel || `Column ${column.columnIndex}`}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Actual column</Label>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          value={category.actualColumnIndex ?? ""}
                          onChange={(event) =>
                            setDraft({
                              ...draft,
                              progressCategories: draft.progressCategories.map((item, itemIndex) =>
                                itemIndex === index
                                  ? { ...item, actualColumnIndex: event.target.value ? Number(event.target.value) : null }
                                  : item
                              )
                            })
                          }
                        >
                          <option value="">Not set</option>
                          {includedColumns.map((column) => (
                            <option key={column.columnIndex} value={column.columnIndex}>
                              {column.headerLabel || `Column ${column.columnIndex}`}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-end">
                        <Button
                          aria-label="Remove category"
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() =>
                            setDraft({
                              ...draft,
                              progressCategories: draft.progressCategories.filter((_, itemIndex) => itemIndex !== index)
                            })
                          }
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                        </Button>
                      </div>
                      {draft.labelColumnIndexes.length > 0 ? (
                        <div className="space-y-1 sm:col-span-3">
                          <Label className="text-xs text-muted-foreground">
                            Only rows where the label column equals (optional)
                          </Label>
                          <Input
                            placeholder='e.g. "Engineering" — leave blank to apply to every row'
                            value={category.matchLabel}
                            onChange={(event) =>
                              setDraft({
                                ...draft,
                                progressCategories: draft.progressCategories.map((item, itemIndex) =>
                                  itemIndex === index ? { ...item, matchLabel: event.target.value } : item
                                )
                              })
                            }
                          />
                          <p className="text-xs text-muted-foreground">
                            Use this for "summary" sheets where one row per phase (e.g. Engineering / Procurement /
                            Construction) already has the correct rolled-up plan/actual values — matching by label
                            picks just that row instead of summing the whole sheet.
                          </p>
                        </div>
                      ) : null}
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">
                          Item's own plan % column (optional)
                        </Label>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          value={category.itemPlanColumnIndex ?? ""}
                          onChange={(event) =>
                            setDraft({
                              ...draft,
                              progressCategories: draft.progressCategories.map((item, itemIndex) =>
                                itemIndex === index
                                  ? {
                                      ...item,
                                      itemPlanColumnIndex: event.target.value ? Number(event.target.value) : null
                                    }
                                  : item
                              )
                            })
                          }
                        >
                          <option value="">Same as plan column above</option>
                          {includedColumns.map((column) => (
                            <option key={column.columnIndex} value={column.columnIndex}>
                              {column.headerLabel || `Column ${column.columnIndex}`}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">
                          Item's own actual % column (optional)
                        </Label>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          value={category.itemActualColumnIndex ?? ""}
                          onChange={(event) =>
                            setDraft({
                              ...draft,
                              progressCategories: draft.progressCategories.map((item, itemIndex) =>
                                itemIndex === index
                                  ? {
                                      ...item,
                                      itemActualColumnIndex: event.target.value ? Number(event.target.value) : null
                                    }
                                  : item
                              )
                            })
                          }
                        >
                          <option value="">Same as actual column above</option>
                          {includedColumns.map((column) => (
                            <option key={column.columnIndex} value={column.columnIndex}>
                              {column.headerLabel || `Column ${column.columnIndex}`}
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-muted-foreground sm:col-span-3">
                          The plan/actual columns above are used to roll up this category's total progress — often a
                          "Bobot" (weighted) column. If the work item table should instead show this row's own plain
                          percentage (e.g. "100%" instead of a tiny weight fraction), pick the different column here.
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  setDraft({
                    ...draft,
                    progressCategories: [
                      ...draft.progressCategories,
                      {
                        label: "",
                        planColumnIndex: null,
                        actualColumnIndex: null,
                        matchLabel: "",
                        itemPlanColumnIndex: null,
                        itemActualColumnIndex: null
                      }
                    ]
                  })
                }
              >
                Add category
              </Button>
            </div>
          ) : null}

          {(draft.keyColumnIndexes.length > 0 ||
            draft.progressCategories.length > 0 ||
            draft.labelColumnIndexes.length > 0) &&
          configuredSheets.some((_, index) => index !== draft.editingIndex) ? (
            <div className="space-y-2 rounded-md border p-3">
              <Label className="text-sm">Also apply these settings to</Label>
              <p className="text-xs text-muted-foreground">
                Copies the row filter and progress fields set above to the checked sheets, matched by field name.
                Only sheets with a matching column are updated; others are left unchanged.
              </p>
              <div className="flex flex-wrap gap-3">
                {configuredSheets
                  .filter((_, index) => index !== draft.editingIndex)
                  .map((sheet) => (
                    <label key={sheet.sheet_name} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="size-4 rounded border-input"
                        checked={applyFilterTargets.has(sheet.sheet_name)}
                        onChange={(event) =>
                          setApplyFilterTargets((prev) => {
                            const next = new Set(prev);
                            if (event.target.checked) {
                              next.add(sheet.sheet_name);
                            } else {
                              next.delete(sheet.sheet_name);
                            }
                            return next;
                          })
                        }
                      />
                      {sheet.sheet_name}
                    </label>
                  ))}
              </div>
            </div>
          ) : null}

          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => setDraft({ ...draft, step: "select-range" })}>
              <ChevronLeft className="size-4" aria-hidden="true" />
              Back
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setDraft(null)}>
                Cancel
              </Button>
              <Button type="button" disabled={!canSaveSheet} onClick={saveSheetDraft}>
                Save sheet
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {!draft && configuredSheets.length > 0 ? (
        <div className="space-y-2">
          <Label>Configured sheets</Label>
          <div className="divide-y rounded-md border">
            {configuredSheets.map((sheet, index) => (
              <div key={`${sheet.sheet_name}-${index}`} className="flex items-center justify-between gap-3 px-3 py-2">
                <div className="text-sm">
                  <span className="font-medium">{sheet.sheet_name}</span>
                  <span className="ml-2 text-muted-foreground">
                    header rows {sheet.header_row_start}–{sheet.header_row_end}, {sheet.column_mappings.length}{" "}
                    column(s)
                    {sheet.key_column_indexes && sheet.key_column_indexes.length > 0
                      ? `, row filter: depth ${sheet.key_depth ?? 2}`
                      : ", no row filter"}
                    {sheet.progress_categories && sheet.progress_categories.length > 0
                      ? `, progress: ${sheet.progress_categories.map((category) => category.label).join(", ")}`
                      : ""}
                    {sheet.label_field_keys && sheet.label_field_keys.length > 0
                      ? `, label: ${sheet.label_field_keys.join(" / ")}`
                      : ""}
                  </span>
                </div>
                <div className="flex gap-1">
                  <Button
                    aria-label={`Edit ${sheet.sheet_name}`}
                    type="button"
                    size="icon"
                    variant="ghost"
                    disabled={!currentFile}
                    onClick={() => startEditingSheet(index)}
                  >
                    <Pencil className="size-4" aria-hidden="true" />
                  </Button>
                  <Button
                    aria-label={`Remove ${sheet.sheet_name}`}
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => removeSheet(index)}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {!draft ? (
        <div className="space-y-4 border-t pt-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="wizard-name">Template name</Label>
              <Input
                id="wizard-name"
                disabled={isSubmitting}
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </div>
            <div className="flex items-end gap-2 pb-2">
              <input
                id="wizard-active"
                type="checkbox"
                className="size-4 rounded border-input"
                disabled={isSubmitting}
                checked={isActive}
                onChange={(event) => setIsActive(event.target.checked)}
              />
              <Label htmlFor="wizard-active">Active</Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="wizard-description">Description</Label>
            <textarea
              id="wizard-description"
              rows={2}
              disabled={isSubmitting}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>

          {saveError ? <p className="text-sm text-destructive">{saveError}</p> : null}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" disabled={isSubmitting} onClick={onCancel}>
              Cancel
            </Button>
            <Button type="button" disabled={!canSaveTemplate || isSubmitting} onClick={handleSaveTemplate}>
              {isSubmitting ? "Saving" : template ? "Save changes" : "Create template"}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
