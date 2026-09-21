import { createFileRoute, redirect } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: () => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("auth-token")
        : null;

    if (!token) {
      throw redirect({
        to: "/login",
      });
    }
  },
  component: DashboardLayout,
});