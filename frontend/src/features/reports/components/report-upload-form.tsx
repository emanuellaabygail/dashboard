import { useState, type FormEvent } from "react";
import { isAxiosError } from "axios";
import { Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useProjects } from "@/features/projects/hooks/use-projects";
import { useTemplates } from "@/features/templates/hooks/use-templates";
import type { ReportUploadPayload } from "@/features/reports/types";

function getUploadErrorMessage(error: unknown): string {
  if (isAxiosError(error) && error.response?.data && typeof error.response.data === "object") {
    const messages = Object.values(error.response.data as Record<string, unknown>).flatMap((value) =>
      Array.isArray(value) ? value.map(String) : [String(value)]
    );
    if (messages.length > 0) {
      return messages.join(" ");
    }
  }
  return "Could not upload the report. Make sure it is a valid Excel workbook.";
}

interface ReportUploadFormProps {
  isSubmitting: boolean;
  submitError: unknown;
  onSubmit: (payload: ReportUploadPayload) => Promise<void> | void;
  onCancel: () => void;
}

export function ReportUploadForm({ isSubmitting, submitError, onSubmit, onCancel }: ReportUploadFormProps) {
  const projectsQuery = useProjects({});
  const [projectId, setProjectId] = useState<number | "">("");
  const [templateId, setTemplateId] = useState<number | "">("");
  const [file, setFile] = useState<File | null>(null);

  const templatesQuery = useTemplates({ project: projectId, is_active: "true" });

  const canSubmit = projectId !== "" && file !== null;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (projectId === "" || file === null) {
      return;
    }
    await onSubmit({
      project: projectId,
      template: templateId === "" ? null : templateId,
      file
    });
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="upload-project">Project</Label>
          <select
            id="upload-project"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={projectId}
            disabled={isSubmitting}
            onChange={(event) => {
              setProjectId(event.target.value ? Number(event.target.value) : "");
              setTemplateId("");
            }}
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
          <Label htmlFor="upload-template">Template (optional)</Label>
          <select
            id="upload-template"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            value={templateId}
            disabled={isSubmitting || projectId === ""}
            onChange={(event) => setTemplateId(event.target.value ? Number(event.target.value) : "")}
          >
            <option value="">No template yet</option>
            {templatesQuery.data?.results.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="upload-file">Excel file</Label>
        <label
          htmlFor="upload-file"
          className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed px-4 py-6 text-sm text-muted-foreground hover:border-primary hover:text-foreground"
        >
          <Upload className="size-4 shrink-0" aria-hidden="true" />
          <span className="truncate">{file ? file.name : "Click to choose a report file"}</span>
        </label>
        <input
          id="upload-file"
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          disabled={isSubmitting}
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        />
      </div>

      {submitError ? <p className="text-sm text-destructive">{getUploadErrorMessage(submitError)}</p> : null}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" disabled={isSubmitting} onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!canSubmit || isSubmitting}>
          {isSubmitting ? "Uploading" : "Upload report"}
        </Button>
      </div>
    </form>
  );
}
