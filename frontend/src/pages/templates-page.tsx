import { useState } from "react";
import { FileSpreadsheet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { isAdminRole } from "@/features/access/lib/roles";
import { useCurrentUser } from "@/features/authentication/hooks/use-auth";
import { TemplateTable } from "@/features/templates/components/template-table";
import { TemplateWizard } from "@/features/templates/components/template-wizard";
import {
  useCreateTemplate,
  useDeleteTemplate,
  useTemplates,
  useUpdateTemplate
} from "@/features/templates/hooks/use-templates";
import type { Template, TemplatePayload } from "@/features/templates/types";

type FormMode = { kind: "closed" } | { kind: "create" } | { kind: "edit"; template: Template };

export function TemplatesPage() {
  const [search, setSearch] = useState("");
  const [formMode, setFormMode] = useState<FormMode>({ kind: "closed" });
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const currentUserQuery = useCurrentUser();
  const canManage = isAdminRole(currentUserQuery.data?.role);

  const templatesQuery = useTemplates({ search });
  const createMutation = useCreateTemplate();
  const updateMutation = useUpdateTemplate();
  const deleteMutation = useDeleteTemplate();

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = async (payload: TemplatePayload) => {
    if (formMode.kind === "edit") {
      await updateMutation.mutateAsync({ id: formMode.template.id, payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    setFormMode({ kind: "closed" });
  };

  const handleDelete = async (template: Template) => {
    if (!window.confirm(`Delete template "${template.name}"?`)) {
      return;
    }
    setDeletingId(template.id);
    try {
      await deleteMutation.mutateAsync(template.id);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Templates</h1>
          <p className="text-sm text-muted-foreground">
            Define sheet names, header rows, and mapped columns used to parse Excel uploads.
          </p>
        </div>
        {canManage ? (
          <Button onClick={() => setFormMode({ kind: "create" })} disabled={formMode.kind !== "closed"}>
            <FileSpreadsheet className="size-4" aria-hidden="true" />
            New Template
          </Button>
        ) : null}
      </div>

      {formMode.kind !== "closed" && canManage ? (
        <Card>
          <CardHeader>
            <CardTitle>{formMode.kind === "edit" ? "Edit template" : "Create template"}</CardTitle>
            <CardDescription>
              {formMode.kind === "edit"
                ? `Updating ${formMode.template.name}`
                : "Add a new Excel mapping template."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TemplateWizard
              template={formMode.kind === "edit" ? formMode.template : undefined}
              isSubmitting={isSubmitting}
              onSubmit={handleSubmit}
              onCancel={() => setFormMode({ kind: "closed" })}
            />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Excel Mapping Templates</CardTitle>
            <CardDescription>
              {templatesQuery.data ? `${templatesQuery.data.count} template(s)` : "Loading template records."}
            </CardDescription>
          </div>
          <Input
            className="sm:max-w-xs"
            placeholder="Search by name or sheet"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </CardHeader>
        <CardContent>
          {templatesQuery.isLoading ? (
            <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
              Loading templates
            </div>
          ) : templatesQuery.isError ? (
            <div className="flex h-48 items-center justify-center text-sm text-destructive">
              Unable to load templates.
            </div>
          ) : (
            <TemplateTable
              templates={templatesQuery.data?.results ?? []}
              onEdit={(template) => setFormMode({ kind: "edit", template })}
              onDelete={handleDelete}
              deletingId={deletingId}
              canManage={canManage}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
