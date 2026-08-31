import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useGrantAccess, useUsers } from "@/features/access/hooks/use-access";
import { useProjects } from "@/features/projects/hooks/use-projects";

export function GrantAccessForm() {
  const [projectId, setProjectId] = useState<number | "">("");
  const [userSearch, setUserSearch] = useState("");
  const [userId, setUserId] = useState<number | "">("");
  const [feedback, setFeedback] = useState<string | null>(null);

  const projectsQuery = useProjects({});
  const usersQuery = useUsers(userSearch);
  const grantMutation = useGrantAccess();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!projectId || !userId) {
      return;
    }
    await grantMutation.mutateAsync({ project: projectId, user: userId });
    setFeedback("Access granted.");
    setUserId("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Grant Access</CardTitle>
        <CardDescription>Give a user access to a project directly, without waiting for a request.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <Label htmlFor="grant-project" className="text-xs text-muted-foreground">
              Project
            </Label>
            <select
              id="grant-project"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={projectId}
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
          <div className="space-y-1">
            <Label htmlFor="grant-user" className="text-xs text-muted-foreground">
              User
            </Label>
            <Input
              id="grant-user-search"
              className="mb-1"
              placeholder="Search users…"
              value={userSearch}
              onChange={(event) => setUserSearch(event.target.value)}
            />
            <select
              id="grant-user"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={userId}
              onChange={(event) => setUserId(event.target.value ? Number(event.target.value) : "")}
            >
              <option value="">Select a user</option>
              {usersQuery.data?.results.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.full_name || user.username}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={!projectId || !userId || grantMutation.isPending}>
              Grant
            </Button>
          </div>
        </form>
        {feedback ? <p className="mt-2 text-xs text-muted-foreground">{feedback}</p> : null}
        {grantMutation.isError ? <p className="mt-2 text-xs text-destructive">Could not grant access.</p> : null}
      </CardContent>
    </Card>
  );
}
