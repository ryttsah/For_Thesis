import { IconLeaf, IconLogout, IconMenu2 } from "@tabler/icons-react";
import PortalNotifications from "./PortalNotifications";
import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import type { NavItem } from "../../constants/navigation";

interface AppShellProps {
  portalLabel: string;
  navGroups: { label: string; items: NavItem[] }[];
  pageTitles: Record<string, string>;
  subtitle?: string;
  getNavBadge?: (itemId: string) => number | undefined;
}

export default function AppShell({
  portalLabel,
  navGroups,
  pageTitles,
  subtitle = "Negros Occidental — May 2026",
  getNavBadge,
}: AppShellProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const pageTitle = pageTitles[location.pathname] ?? "Dashboard";

  function handleLogout() {
    logout();
    navigate("/", { replace: true });
  }

  return (
    <div className="portal-app flex h-full min-h-screen">
      <div
        className={`portal-overlay fixed inset-0 z-40 bg-black/40 lg:hidden ${sidebarOpen ? "block" : "hidden"}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden={!sidebarOpen}
      />

      <nav
        className={`portal-sidebar fixed bottom-0 left-0 top-0 z-50 flex w-[260px] min-w-[260px] flex-col border-r border-pca-border bg-white transition-transform lg:static lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center gap-3 border-b border-pca-border px-[18px] py-4">
          <IconLeaf size={24} className="text-pca-green" stroke={2} />
          <div>
            <div className="text-sm font-bold">PCA Negros Occ.</div>
            <span className="block text-[11px] text-pca-muted">{portalLabel}</span>
          </div>
        </div>

        {navGroups.map((group) => (
          <div key={group.label} className="px-3 py-1.5">
            <div className="px-2 pb-1 pt-2.5 text-[10px] font-bold uppercase tracking-wider text-pca-muted">
              {group.label}
            </div>
            {group.items.map((item) => (
              <NavLink
                key={item.id}
                to={item.path}
                end={item.path === "/officer" || item.path === "/admin"}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `mb-0.5 flex w-full items-center gap-2.5 rounded-[10px] px-3 py-2 text-[13px] font-medium transition-colors ${
                    isActive
                      ? "bg-pca-green-light font-semibold text-pca-green"
                      : "text-pca-muted hover:bg-pca-bg hover:text-pca-text"
                  }`
                }
              >
                <item.icon size={18} stroke={2} />
                {item.label}
                {(() => {
                  const count = getNavBadge?.(item.id) ?? item.badge;
                  return count != null && count > 0 ? (
                    <span className="ml-auto rounded-full bg-pca-red px-2 py-px text-[11px] font-semibold text-white">
                      {count}
                    </span>
                  ) : null;
                })()}
              </NavLink>
            ))}
          </div>
        ))}

        <div className="mt-auto border-t border-pca-border px-4 py-4">
          <div className="flex items-center gap-2.5 rounded-[10px] p-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-pca-green text-[13px] font-semibold text-white">
              {user?.initials}
            </div>
            <div>
              <div className="text-[13px] font-semibold">{user?.displayName}</div>
              <div className="text-[11px] text-pca-muted">{user?.subtitle}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-1.5 flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-pca-muted transition-colors hover:bg-pca-bg hover:text-pca-text"
          >
            <IconLogout size={16} stroke={2} />
            Logout
          </button>
        </div>
      </nav>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-[60px] shrink-0 items-center justify-between border-b border-pca-border bg-white px-6">
          <div className="flex items-center">
            <button
              type="button"
              className="mr-2.5 flex h-[38px] w-[38px] items-center justify-center rounded-[10px] border-[1.5px] border-pca-border text-pca-muted lg:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <IconMenu2 size={18} />
            </button>
            <div>
              <h2 className="text-[17px] font-bold">{pageTitle}</h2>
              <span className="hidden text-xs text-pca-muted sm:inline">{subtitle}</span>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <PortalNotifications />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
