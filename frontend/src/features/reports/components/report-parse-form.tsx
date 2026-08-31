import { useState } from "react";
import { isAxiosError } from "axios";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useTemplates } from "@/features/templates/hooks/use-templates";
import type { Report } from "@/features/reports/types";

function getParseErrorMessage(error: unknown): string {
  if (isAxiosError(error) && error.response?.data && typeof error.response.data === "object") {
    const detail = (error.response.data as { detail?: string }).detail;
    if (detail) {
      return detail;
    }
  }
  return "Could not parse this report.";
}

interface ReportParseFormProps {
  report: Report;
  isSubmitting: boolean;
  submitError: unknown;
  onSubmit: (templateId?: number) => Promise<void> | void;
  onCancel: () => void;
}

export function ReportParseForm({ report, isSubmitting, submitError, onSubmit, onCancel }: ReportParseFormProps) {
  const templatesQuery = useTemplates({ project: report.project, is_active: "true" });
  const [templateId, setTemplateId] = useState<number | "">(report.template ?? "");

  const canSubmit = templateId !== "";

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="parse-template">Template</Label>
        <select
          id="parse-template"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-72"
          value={templateId}
          disabled={isSubmitting}
          onChange={(event) => setTemplateId(event.target.value ? Number(event.target.value) : "")}
        >
          <option value="">Select a template</option>
          {templatesQuery.data?.results.map((template) => (
            <option key={template.id} value={template.id}>
              {template.name}
            </option>
          ))}
        </select>
      </div>

      {submitError ? <p className="text-sm text-destructive">{getParseErrorMessage(submitError)}</p> : null}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" disabled={isSubmitting} onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="button"
          disabled={!canSubmit || isSubmitting}
          onClick={() => (templateId !== "" ? onSubmit(templateId) : undefined)}
        >
          {isSubmitting ? "Parsing" : "Run parse"}
        </Button>
      </div>
    </div>
  );
}
