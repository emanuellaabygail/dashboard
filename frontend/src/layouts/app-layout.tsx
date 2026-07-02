import type { PropsWithChildren } from "react";
import { BarChart3, FileSpreadsheet, FolderKanban, LayoutDashboard, Settings, Upload } from "lucide-react";
import { NavLink } from "react-router-dom";

import { cn } from "@/lib/utils";

const navigationItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Projects", href: "/projects", icon: FolderKanban },
  { label: "Templates", href: "/templates", icon: FileSpreadsheet },
  { label: "Reports", href: "/reports", icon: Upload },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Settings", href: "/settings", icon: Settings }
];

export function AppLayout({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r bg-card lg:block">
        <div className="flex h-16 items-center border-b px-5">
          <div>
            <p className="text-sm font-semibold">Engineering Progress</p>
            <p className="text-xs text-muted-foreground">Internal reporting</p>
          </div>
        </div>
        <nav className="space-y-1 p-3">
          {navigationItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.href === "/"}
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
        <header className="sticky top-0 z-10 flex h-16 items-center border-b bg-background/95 px-4 backdrop-blur sm:px-6">
          <div>
            <p className="text-sm font-semibold">Project reporting workspace</p>
            <p className="text-xs text-muted-foreground">Progress data normalized from Excel uploads</p>
          </div>
        </header>
        <main className="px-4 py-6 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
