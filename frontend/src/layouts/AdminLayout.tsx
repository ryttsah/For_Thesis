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
  const { pendingCount, visitLogs, syncRegistrationData, syncAdminDomain } = useDemoStore();
  const visitLogsReadyForReview = visitLogs.filter((log) => {
    const officerHasResponded = log.officerComment.trim().length > 0
      || (log.notVisitedReason.trim().length > 0 && log.notVisitedReason !== "Awaiting officer visit outcome.");
    return officerHasResponded && log.farmerConfirmed !== null && !log.adminFeedback.trim();
  }).length;

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
      getNavBadge={(id) => {
        if (id === "admin-approvals") return pendingCount;
        if (id === "admin-visit-logs") return visitLogsReadyForReview || undefined;
        return undefined;
      }}
    />
  );
}
