import { useEffect } from "react";
import AppShell from "../components/layout/AppShell";
import { useAuth } from "../context/AuthContext";
import { useDemoStore } from "../context/DemoStoreContext";
import { ADMIN_NAV, ADMIN_PAGE_TITLES } from "../constants/navigation";
import { hasAuthToken, isApiEnabled } from "../services/api";
import { fetchAdminBootstrap } from "../services/domain";
import { fetchAdminRegistrations } from "../services/registrations";

export default function AdminLayout() {
  const { isAuthLoading } = useAuth();
  const { pendingCount, syncRegistrationData, syncAdminDomain } = useDemoStore();

  useEffect(() => {
    if (!isApiEnabled() || isAuthLoading || !hasAuthToken()) return;
    void Promise.all([fetchAdminRegistrations(), fetchAdminBootstrap()]).then(
      ([registrations, domain]) => {
        if (registrations) syncRegistrationData(registrations);
        if (domain) syncAdminDomain(domain);
      },
    );
  }, [syncRegistrationData, syncAdminDomain, isAuthLoading]);

  return (
    <AppShell
      portalLabel="Admin Portal"
      navGroups={ADMIN_NAV}
      pageTitles={ADMIN_PAGE_TITLES}
      getNavBadge={(id) => (id === "admin-approvals" ? pendingCount : undefined)}
    />
  );
}
