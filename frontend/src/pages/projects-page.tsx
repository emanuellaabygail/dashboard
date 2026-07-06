import { useState } from "react";
import { FolderKanban } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ProjectForm } from "@/features/projects/components/project-form";
import { ProjectTable } from "@/features/projects/components/project-table";
import {
  useCreateProject,
  useDeleteProject,
  useProjects,
  useUpdateProject
} from "@/features/projects/hooks/use-projects";
import type { Project, ProjectPayload } from "@/features/projects/types";

type FormMode = { kind: "closed" } | { kind: "create" } | { kind: "edit"; project: Project };

export function ProjectsPage() {
  const [search, setSearch] = useState("");
  const [formMode, setFormMode] = useState<FormMode>({ kind: "closed" });
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const projectsQuery = useProjects({ search });
  const createMutation = useCreateProject();
  const updateMutation = useUpdateProject();
  const deleteMutation = useDeleteProject();

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = async (payload: ProjectPayload) => {
    if (formMode.kind === "edit") {
      await updateMutation.mutateAsync({ id: formMode.project.id, payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    setFormMode({ kind: "closed" });
  };

  const handleDelete = async (project: Project) => {
    if (!window.confirm(`Delete project "${project.name}"?`)) {
      return;
    }
    setDeletingId(project.id);
    try {
      await deleteMutation.mutateAsync(project.id);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Projects</h1>
          <p className="text-sm text-muted-foreground">Manage the engineering projects tracked in this workspace.</p>
        </div>
        <Button onClick={() => setFormMode({ kind: "create" })} disabled={formMode.kind !== "closed"}>
          <FolderKanban className="size-4" aria-hidden="true" />
          New Project
        </Button>
      </div>

      {formMode.kind !== "closed" ? (
        <Card>
          <CardHeader>
            <CardTitle>{formMode.kind === "edit" ? "Edit project" : "Create project"}</CardTitle>
            <CardDescription>
              {formMode.kind === "edit"
                ? `Updating ${formMode.project.code}`
                : "Add a new project to the register."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProjectForm
              project={formMode.kind === "edit" ? formMode.project : undefined}
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
            <CardTitle>Project Register</CardTitle>
            <CardDescription>
              {projectsQuery.data ? `${projectsQuery.data.count} project(s)` : "Loading project records."}
            </CardDescription>
          </div>
          <Input
            className="sm:max-w-xs"
            placeholder="Search by name or code"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </CardHeader>
        <CardContent>
          {projectsQuery.isLoading ? (
            <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
              Loading projects
            </div>
          ) : projectsQuery.isError ? (
            <div className="flex h-48 items-center justify-center text-sm text-destructive">
              Unable to load projects.
            </div>
          ) : (
            <ProjectTable
              projects={projectsQuery.data?.results ?? []}
              onEdit={(project) => setFormMode({ kind: "edit", project })}
              onDelete={handleDelete}
              deletingId={deletingId}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
