import type { UserRole } from "@/features/authentication/types";

export function isAdminRole(role: UserRole | undefined): boolean {
  return role === "superadmin" || role === "project_admin";
}

export function isSuperAdminRole(role: UserRole | undefined): boolean {
  return role === "superadmin";
}

export const ROLE_LABELS: Record<UserRole, string> = {
  superadmin: "Super Admin",
  project_admin: "Project Admin",
  user: "User"
};
