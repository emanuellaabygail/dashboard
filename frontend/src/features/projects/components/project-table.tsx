import { Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Project, ProjectStatus } from "@/features/projects/types";

const statusLabels: Record<ProjectStatus, string> = {
  planned: "Planned",
  in_progress: "In Progress",
  on_hold: "On Hold",
  completed: "Completed",
  cancelled: "Cancelled"
};

const statusStyles: Record<ProjectStatus, string> = {
  planned: "bg-secondary text-secondary-foreground",
  in_progress: "bg-blue-100 text-blue-800",
  on_hold: "bg-amber-100 text-amber-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800"
};

interface ProjectTableProps {
  projects: Project[];
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
  deletingId: number | null;
}

export function ProjectTable({ projects, onEdit, onDelete, deletingId }: ProjectTableProps) {
  if (projects.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
        No projects found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Code</th>
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Start</th>
            <th className="px-4 py-3 font-medium">End</th>
            <th className="px-4 py-3 font-medium">Created by</th>
            <th className="px-4 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {projects.map((project) => (
            <tr key={project.id}>
              <td className="px-4 py-3 font-medium">{project.code}</td>
              <td className="px-4 py-3">{project.name}</td>
              <td className="px-4 py-3">
                <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusStyles[project.status]}`}>
                  {statusLabels[project.status]}
                </span>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{project.start_date ?? "—"}</td>
              <td className="px-4 py-3 text-muted-foreground">{project.end_date ?? "—"}</td>
              <td className="px-4 py-3 text-muted-foreground">{project.created_by_username}</td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-2">
                  <Button
                    aria-label={`Edit ${project.name}`}
                    size="icon"
                    variant="ghost"
                    onClick={() => onEdit(project)}
                  >
                    <Pencil className="size-4" aria-hidden="true" />
                  </Button>
                  <Button
                    aria-label={`Delete ${project.name}`}
                    size="icon"
                    variant="ghost"
                    disabled={deletingId === project.id}
                    onClick={() => onDelete(project)}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
