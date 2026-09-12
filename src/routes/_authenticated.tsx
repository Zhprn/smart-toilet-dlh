import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated")({
  // Dinonaktifkan sementara agar bebas slicing tanpa login asli:
  /*
  beforeLoad: ({ context, location }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: "/login",
        search: {
          redirect: location.href,
        },
      });
    }
  },
  */
  component: () => <DashboardLayout />,
});