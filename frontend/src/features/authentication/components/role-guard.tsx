import type { PropsWithChildren } from "react";
import { Navigate } from "react-router-dom";

import { useCurrentUser } from "@/features/authentication/hooks/use-auth";
import { isAdminRole } from "@/features/access/lib/roles";

export function AdminRoleGuard({ children }: PropsWithChildren) {
  const currentUserQuery = useCurrentUser();

  if (currentUserQuery.isLoading) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!isAdminRole(currentUserQuery.data?.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
