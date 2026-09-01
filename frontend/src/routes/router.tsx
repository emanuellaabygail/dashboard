import { createBrowserRouter } from "react-router-dom";

import { App } from "@/app";
import { AuthGuard } from "@/features/authentication/components/auth-guard";
import { AdminRoleGuard } from "@/features/authentication/components/role-guard";
import { NotFoundPage } from "@/pages/not-found-page";

export const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <AuthGuard>
        <App />
      </AuthGuard>
    ),
    errorElement: <NotFoundPage />,
    children: [
      {
        index: true,
        lazy: async () => {
          const { DashboardPage } = await import("@/pages/dashboard-page");
          return { Component: DashboardPage };
        }
      },
      {
        path: "projects",
        lazy: async () => {
          const { ProjectsPage } = await import("@/pages/projects-page");
          return { Component: ProjectsPage };
        }
      },
      {
        path: "templates",
        lazy: async () => {
          const { TemplatesPage } = await import("@/pages/templates-page");
          return { Component: TemplatesPage };
        }
      },
      {
        path: "reports",
        lazy: async () => {
          const { ReportsPage } = await import("@/pages/reports-page");
          return { Component: ReportsPage };
        }
      },
      {
        path: "analytics",
        lazy: async () => {
          const { AnalyticsPage } = await import("@/pages/analytics-page");
          return { Component: AnalyticsPage };
        }
      },
      {
        path: "access",
        lazy: async () => {
          const { AccessPage } = await import("@/pages/access-page");
          return {
            Component: () => (
              <AdminRoleGuard>
                <AccessPage />
              </AdminRoleGuard>
            )
          };
        }
      }
    ]
  },
  {
    path: "/login",
    lazy: async () => {
      const { LoginPage } = await import("@/pages/login-page");
      return { Component: LoginPage };
    }
  },
  {
    path: "/signup",
    lazy: async () => {
      const { SignUpPage } = await import("@/pages/signup-page");
      return { Component: SignUpPage };
    }
  },
  {
    path: "*",
    element: <NotFoundPage />
  }
]);
