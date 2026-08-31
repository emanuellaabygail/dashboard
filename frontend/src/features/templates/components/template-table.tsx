import { Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Template } from "@/features/templates/types";

interface TemplateTableProps {
  templates: Template[];
  onEdit: (template: Template) => void;
  onDelete: (template: Template) => void;
  deletingId: number | null;
  canManage: boolean;
}

export function TemplateTable({ templates, onEdit, onDelete, deletingId, canManage }: TemplateTableProps) {
  if (templates.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
        No templates found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Project</th>
            <th className="px-4 py-3 font-medium">Sheets</th>
            <th className="px-4 py-3 font-medium">Columns mapped</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Created by</th>
            {canManage ? <th className="px-4 py-3 text-right font-medium">Actions</th> : null}
          </tr>
        </thead>
        <tbody className="divide-y">
          {templates.map((template) => (
            <tr key={template.id}>
              <td className="px-4 py-3 font-medium">{template.name}</td>
              <td className="px-4 py-3 text-muted-foreground">{template.project_code}</td>
              <td className="px-4 py-3 text-muted-foreground">
                {template.sheets.map((sheet) => sheet.sheet_name).join(", ") || "—"}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {template.sheets.reduce((total, sheet) => total + sheet.column_mappings.length, 0)}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`rounded-full px-2 py-1 text-xs font-medium ${
                    template.is_active
                      ? "bg-green-100 text-green-800"
                      : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  {template.is_active ? "Active" : "Inactive"}
                </span>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{template.created_by_username}</td>
              {canManage ? (
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Button
                      aria-label={`Edit ${template.name}`}
                      size="icon"
                      variant="ghost"
                      onClick={() => onEdit(template)}
                    >
                      <Pencil className="size-4" aria-hidden="true" />
                    </Button>
                    <Button
                      aria-label={`Delete ${template.name}`}
                      size="icon"
                      variant="ghost"
                      disabled={deletingId === template.id}
                      onClick={() => onDelete(template)}
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </Button>
                  </div>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
