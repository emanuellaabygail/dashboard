import { createBrowserRouter } from "react-router-dom";

import { App } from "@/app";
import { AnalyticsPage } from "@/pages/analytics-page";
import { DashboardPage } from "@/pages/dashboard-page";
import { NotFoundPage } from "@/pages/not-found-page";
import { ProjectsPage } from "@/pages/projects-page";
import { ReportsPage } from "@/pages/reports-page";
import { SettingsPage } from "@/pages/settings-page";
import { TemplatesPage } from "@/pages/templates-page";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <NotFoundPage />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "projects", element: <ProjectsPage /> },
      { path: "templates", element: <TemplatesPage /> },
      { path: "reports", element: <ReportsPage /> },
      { path: "analytics", element: <AnalyticsPage /> },
      { path: "settings", element: <SettingsPage /> }
    ]
  },
  {
    path: "*",
    element: <NotFoundPage />
  }
]);
