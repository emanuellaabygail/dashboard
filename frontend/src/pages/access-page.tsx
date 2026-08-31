import { useState } from "react";
import { ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GrantAccessForm } from "@/features/access/components/grant-access-form";
import {
  useAccessRecords,
  useDecideAccess,
  useRevokeAccess,
  useUpdateUserRole,
  useUsers
} from "@/features/access/hooks/use-access";
import { ROLE_LABELS, isSuperAdminRole } from "@/features/access/lib/roles";
import { useCurrentUser } from "@/features/authentication/hooks/use-auth";
import type { UserRole } from "@/features/authentication/types";

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString();
}

function AccessRequestsSection() {
  const pendingQuery = useAccessRecords({ status: "pending" });
  const decideMutation = useDecideAccess();
  const [decidingId, setDecidingId] = useState<number | null>(null);

  const handleDecide = async (id: number, approve: boolean) => {
    setDecidingId(id);
    try {
      await decideMutation.mutateAsync({ id, approve });
    } finally {
      setDecidingId(null);
    }
  };

  const requests = pendingQuery.data?.results ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Access Requests</CardTitle>
        <CardDescription>Approve or deny requests from users asking to view a project.</CardDescription>
      </CardHeader>
      <CardContent>
        {pendingQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading requests…</p>
        ) : pendingQuery.isError ? (
          <p className="text-sm text-destructive">Could not load access requests.</p>
        ) : requests.length === 0 ? (
          <p className="text-sm text-muted-foreground">No pending requests.</p>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">User</th>
                  <th className="px-4 py-3 font-medium">Project</th>
                  <th className="px-4 py-3 font-medium">Requested</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {requests.map((record) => (
                  <tr key={record.id}>
                    <td className="px-4 py-3">{record.user_full_name || record.username}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {record.project_code} — {record.project_name}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDateTime(record.requested_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          disabled={decidingId === record.id}
                          onClick={() => handleDecide(record.id, true)}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={decidingId === record.id}
                          onClick={() => handleDecide(record.id, false)}
                        >
                          Deny
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function GrantedAccessSection() {
  const approvedQuery = useAccessRecords({ status: "approved" });
  const revokeMutation = useRevokeAccess();
  const [revokingId, setRevokingId] = useState<number | null>(null);

  const handleRevoke = async (id: number, label: string) => {
    if (!window.confirm(`Revoke access for ${label}?`)) {
      return;
    }
    setRevokingId(id);
    try {
      await revokeMutation.mutateAsync(id);
    } finally {
      setRevokingId(null);
    }
  };

  const records = approvedQuery.data?.results ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Granted Access</CardTitle>
        <CardDescription>Everyone with approved access to a project. Revoke to remove it.</CardDescription>
      </CardHeader>
      <CardContent>
        {approvedQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : approvedQuery.isError ? (
          <p className="text-sm text-destructive">Could not load access records.</p>
        ) : records.length === 0 ? (
          <p className="text-sm text-muted-foreground">No access has been granted yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">User</th>
                  <th className="px-4 py-3 font-medium">Project</th>
                  <th className="px-4 py-3 font-medium">Granted by</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {records.map((record) => (
                  <tr key={record.id}>
                    <td className="px-4 py-3">{record.user_full_name || record.username}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {record.project_code} — {record.project_name}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{record.decided_by_username || "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={revokingId === record.id}
                        onClick={() => handleRevoke(record.id, record.user_full_name || record.username)}
                      >
                        Revoke
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function UserRolesSection() {
  const [search, setSearch] = useState("");
  const usersQuery = useUsers(search);
  const updateRoleMutation = useUpdateUserRole();

  const handleRoleChange = async (userId: number, role: UserRole) => {
    await updateRoleMutation.mutateAsync({ userId, role });
  };

  const users = usersQuery.data?.results ?? [];

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Users &amp; Roles</CardTitle>
          <CardDescription>Assign the Project Admin role, or promote another Super Admin.</CardDescription>
        </div>
        <input
          className="flex h-9 w-full max-w-xs rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="Search by username or email"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </CardHeader>
      <CardContent>
        {usersQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading users…</p>
        ) : usersQuery.isError ? (
          <p className="text-sm text-destructive">Could not load users.</p>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">User</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-4 py-3">{user.full_name || user.username}</td>
                    <td className="px-4 py-3 text-muted-foreground">{user.email || "—"}</td>
                    <td className="px-4 py-3">
                      {user.is_superuser ? (
                        <span className="text-xs text-muted-foreground">{ROLE_LABELS.superadmin} (fixed)</span>
                      ) : (
                        <select
                          className="flex h-9 rounded-md border border-input bg-background px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          value={user.role}
                          onChange={(event) => handleRoleChange(user.id, event.target.value as UserRole)}
                        >
                          {(Object.keys(ROLE_LABELS) as UserRole[]).map((role) => (
                            <option key={role} value={role}>
                              {ROLE_LABELS[role]}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function AccessPage() {
  const currentUserQuery = useCurrentUser();
  const role = currentUserQuery.data?.role;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          <ShieldCheck className="size-6" aria-hidden="true" />
          Access Management
        </h1>
        <p className="text-sm text-muted-foreground">Grant project access and manage user roles.</p>
      </div>

      <GrantAccessForm />
      <AccessRequestsSection />
      <GrantedAccessSection />
      {isSuperAdminRole(role) ? <UserRolesSection /> : null}
    </div>
  );
}
