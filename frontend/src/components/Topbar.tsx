import { useRouterState } from "@tanstack/react-router";
import { BarChart3, ReceiptText, Users, Settings } from "lucide-react";

const routeMap: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  "/": {
    label: "Dashboard",
    icon: BarChart3,
  },
  "/log-pendapatan": {
    label: "Log Pendapatan",
    icon: ReceiptText,
  },
  "/management-user": {
    label: "Manajemen User",
    icon: Users,
  },
  "/settings": {
    label: "Pengaturan",
    icon: Settings,
  },
};

export function Topbar() {
  const router = useRouterState();
  const currentPath = router.location.pathname;

  const activeItem =
    routeMap[currentPath] ||
    Object.entries(routeMap).find(
      ([path]) => path !== "/" && currentPath.startsWith(path)
    )?.[1] || {
      label: "Dashboard",
      icon: BarChart3,
    };

  const Icon = activeItem.icon;

  return (
    <header className="flex h-16 w-full items-center justify-between border-b border-gray-100 bg-white px-6">
      <div className="flex items-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-gray-100/80 px-4 py-1.5 text-xs font-semibold text-gray-800 transition-all">
          <Icon className="h-4 w-4 text-gray-600" />
          <span>{activeItem.label}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-[11px] font-medium text-gray-400">
          DLH Kota Padang
        </span>
      </div>
    </header>
  );
}