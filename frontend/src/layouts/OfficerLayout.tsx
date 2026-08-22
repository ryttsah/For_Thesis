import { useEffect } from "react";
import AppShell from "../components/layout/AppShell";
import { useAuth } from "../context/AuthContext";
import { useDemoStore } from "../context/DemoStoreContext";
import { OFFICER_NAV, OFFICER_PAGE_TITLES } from "../constants/navigation";
import { hasAuthToken, isApiEnabled } from "../services/api";
import { fetchCurrentUser } from "../services/auth";
import { fetchOfficerBootstrap } from "../services/domain";

export default function OfficerLayout() {
  const { user, isAuthLoading, establishSession } = useAuth();
  const { queuePendingCount, syncOfficerDomain } = useDemoStore();

  useEffect(() => {
    if (!isApiEnabled() || isAuthLoading || !hasAuthToken()) return;
    void fetchOfficerBootstrap().then((data) => {
      if (data) syncOfficerDomain(data);
    });
    void fetchCurrentUser().then((me) => {
      if (me && user) {
        establishSession(me.userId, me.role, me.displayName, me.assignedBrgy);
      }
    });
  }, [syncOfficerDomain, isAuthLoading, user?.id, establishSession]);

  return (
    <AppShell
      portalLabel="Officer Portal"
      navGroups={OFFICER_NAV}
      pageTitles={OFFICER_PAGE_TITLES}
      getNavBadge={(id) => (id === "officer-queue" ? queuePendingCount : undefined)}
    />
  );
}
