import { Outlet } from "react-router-dom";

import { AppLayout } from "@/layouts/app-layout";

export function App() {
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}
