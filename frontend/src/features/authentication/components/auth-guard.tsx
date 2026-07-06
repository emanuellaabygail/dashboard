import type { PropsWithChildren } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { useCurrentUser } from "@/features/authentication/hooks/use-auth";

export function AuthGuard({ children }: PropsWithChildren) {
  const location = useLocation();
  const currentUserQuery = useCurrentUser();

  if (currentUserQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Loading workspace
      </div>
    );
  }

  if (currentUserQuery.isError || !currentUserQuery.data) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
