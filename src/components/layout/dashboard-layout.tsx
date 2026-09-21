import * as React from "react";
import {
  Link,
  Outlet,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { LayoutDashboard, ReceiptText, Menu, X } from "lucide-react";

const primaryNav = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    title: "Log Pendapatan",
    href: "/log-pendapatan",
    icon: ReceiptText,
  },
];

export function DashboardLayout() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = React.useState(false);
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  const [user, setUser] = React.useState<{ name?: string; role?: string } | null>(null);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem("user-data");
      if (raw) {
        setUser(JSON.parse(raw));
      }
    } catch {
      // ignore JSON parse error
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("auth-token");
    localStorage.removeItem("user-data");
    navigate({ to: "/login" });
  };

  const displayName = user?.name || "ADMIN GATE QRIS";
  const displayRole = user?.role || "ADMIN";
  const initialLetter = displayName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen w-full bg-white">
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-gray-100 bg-white px-4 lg:hidden">
        <div className="flex items-center gap-2">
          <img src="/images/logodlh.svg" alt="Smart Toilet" className="h-7 w-auto object-contain" />
          <span className="text-xs font-bold text-gray-900">Smart Toilet</span>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
          aria-label="Buka Menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs transition-opacity lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col justify-between bg-[#1D408C] p-6 text-white shadow-xl transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div>
          <div className="flex items-center justify-between px-1 py-3">
            <div className="flex items-center gap-3">
              <img
                src="/images/logodlh.svg"
                alt="Smart Toilet DLH"
                className="h-10 w-auto object-contain"
              />
              <div>
                <h2 className="text-base font-bold leading-tight tracking-wide">
                  Smart Toilet
                </h2>
                <p className="text-xs text-blue-100/80">DLH Kota Padang</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1.5 text-white/70 hover:bg-white/10 hover:text-white lg:hidden"
              aria-label="Tutup Menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="mt-8 space-y-2.5">
            {primaryNav.map((item) => {
              const isActive = item.exact
                ? pathname === item.href || pathname === `${item.href}/`
                : pathname.startsWith(item.href);

              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                    isActive
                      ? "bg-white text-gray-900 shadow-md"
                      : "text-blue-100/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 ${
                      isActive ? "text-gray-900" : "text-blue-200"
                    }`}
                  />
                  <span>{item.title}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-white/10 pt-5">
          <div className="flex items-center gap-3 px-1">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold text-[#1D408C] shadow-sm">
              {initialLetter}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold uppercase tracking-wider text-white">
                {displayName}
              </p>
              <p className="truncate text-[11px] text-blue-200">
                {displayRole}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="mt-4 w-full rounded-xl border border-white/30 bg-transparent py-2.5 text-xs font-semibold text-white transition hover:bg-white/10 active:scale-[0.99]"
          >
            Keluar
          </button>
        </div>
      </aside>

      <main className="min-h-screen bg-white p-4 sm:p-6 lg:ml-72 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}