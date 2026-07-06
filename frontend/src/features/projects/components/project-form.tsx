import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Project, ProjectPayload, ProjectStatus } from "@/features/projects/types";

const statusOptions: { value: ProjectStatus; label: string }[] = [
  { value: "planned", label: "Planned" },
  { value: "in_progress", label: "In Progress" },
  { value: "on_hold", label: "On Hold" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" }
];

const projectSchema = z
  .object({
    name: z.string().min(1, "Name is required.").max(200),
    code: z.string().min(1, "Code is required.").max(50),
    description: z.string().max(2000).optional(),
    status: z.enum(["planned", "in_progress", "on_hold", "completed", "cancelled"]),
    start_date: z.string().optional(),
    end_date: z.string().optional()
  })
  .refine((values) => !values.start_date || !values.end_date || values.start_date <= values.end_date, {
    message: "End date must be on or after the start date.",
    path: ["end_date"]
  });

export type ProjectFormValues = z.infer<typeof projectSchema>;

interface ProjectFormProps {
  project?: Project;
  isSubmitting: boolean;
  onSubmit: (payload: ProjectPayload) => Promise<void> | void;
  onCancel: () => void;
}

export function ProjectForm({ project, isSubmitting, onSubmit, onCancel }: ProjectFormProps) {
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: project?.name ?? "",
      code: project?.code ?? "",
      description: project?.description ?? "",
      status: project?.status ?? "planned",
      start_date: project?.start_date ?? "",
      end_date: project?.end_date ?? ""
    }
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit({
      name: values.name,
      code: values.code,
      description: values.description ?? "",
      status: values.status,
      start_date: values.start_date || null,
      end_date: values.end_date || null
    });
  });

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" disabled={isSubmitting} {...form.register("name")} />
          {form.formState.errors.name ? (
            <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="code">Code</Label>
          <Input id="code" disabled={isSubmitting} {...form.register("code")} />
          {form.formState.errors.code ? (
            <p className="text-sm text-destructive">{form.formState.errors.code.message}</p>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          disabled={isSubmitting}
          rows={3}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          {...form.register("description")}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            disabled={isSubmitting}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            {...form.register("status")}
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="start_date">Start date</Label>
          <Input id="start_date" type="date" disabled={isSubmitting} {...form.register("start_date")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="end_date">End date</Label>
          <Input id="end_date" type="date" disabled={isSubmitting} {...form.register("end_date")} />
          {form.formState.errors.end_date ? (
            <p className="text-sm text-destructive">{form.formState.errors.end_date.message}</p>
          ) : null}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" disabled={isSubmitting} onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving" : project ? "Save changes" : "Create project"}
        </Button>
      </div>
    </form>
  );
}
