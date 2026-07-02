import { FolderKanban } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function ProjectsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Projects</h1>
          <p className="text-sm text-muted-foreground">Project CRUD will be implemented in Milestone 4.</p>
        </div>
        <Button disabled>
          <FolderKanban className="size-4" aria-hidden="true" />
          New Project
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Project Register</CardTitle>
          <CardDescription>No project records have been connected yet.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-48 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
            Table placeholder
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
