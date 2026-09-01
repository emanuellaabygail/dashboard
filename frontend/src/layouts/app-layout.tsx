import { useState, type PropsWithChildren } from "react";
import {
  BarChart3,
  FileSpreadsheet,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  Upload,
  X
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { isAdminRole } from "@/features/access/lib/roles";
import { useCurrentUser, useLogout } from "@/features/authentication/hooks/use-auth";
import { cn } from "@/lib/utils";

const navigationItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Projects", href: "/projects", icon: FolderKanban },
  { label: "Templates", href: "/templates", icon: FileSpreadsheet },
  { label: "Reports", href: "/reports", icon: Upload },
  { label: "Analytics", href: "/analytics", icon: BarChart3 }
];

export function AppLayout({ children }: PropsWithChildren) {
  const navigate = useNavigate();
  const currentUserQuery = useCurrentUser();
  const logoutMutation = useLogout();
  const user = currentUserQuery.data;
  const displayName = user?.full_name || user?.username || "Signed in";
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const items = isAdminRole(user?.role)
    ? [...navigationItems, { label: "Access", href: "/access", icon: ShieldCheck }]
    : navigationItems;

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      {isMobileNavOpen ? (
        <div
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          aria-hidden="true"
          onClick={() => setIsMobileNavOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 w-64 border-r bg-card transition-transform duration-200 ease-in-out",
          "lg:translate-x-0",
          isMobileNavOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b px-5">
          <div>
            <p className="text-sm font-semibold">Engineering Progress</p>
            <p className="text-xs text-muted-foreground">Internal reporting</p>
          </div>
          <Button
            aria-label="Close navigation"
            className="lg:hidden"
            onClick={() => setIsMobileNavOpen(false)}
            size="icon"
            type="button"
            variant="ghost"
          >
            <X className="size-4" aria-hidden="true" />
          </Button>
        </div>
        <nav className="space-y-1 p-3">
          {items.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.href === "/"}
              onClick={() => setIsMobileNavOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-muted-foreground",
                  "hover:bg-muted hover:text-foreground",
                  isActive && "bg-secondary text-secondary-foreground"
                )
              }
            >
              <item.icon className="size-4" aria-hidden="true" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b bg-background/95 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            <Button
              aria-label="Open navigation"
              className="lg:hidden"
              onClick={() => setIsMobileNavOpen(true)}
              size="icon"
              type="button"
              variant="ghost"
            >
              <Menu className="size-4" aria-hidden="true" />
            </Button>
            <div>
              <p className="text-sm font-semibold">Project reporting workspace</p>
              <p className="text-xs text-muted-foreground hidden sm:block">
                Progress data normalized from Excel uploads
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium">{displayName}</p>
              <p className="text-xs text-muted-foreground">Authenticated session</p>
            </div>
            <Button
              aria-label="Sign out"
              disabled={logoutMutation.isPending}
              onClick={handleLogout}
              size="icon"
              type="button"
              variant="ghost"
            >
              <LogOut className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </header>
        <main className="px-4 py-6 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
