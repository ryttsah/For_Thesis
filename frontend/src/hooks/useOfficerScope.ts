import { useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { useDemoStore } from "../context/DemoStoreContext";
import { OFFICER_ASSIGNED_BRGY } from "../constants/demoData";
import { isApiEnabled } from "../services/api";
import type { FarmRow } from "../types/demoStore";
import { brgyMatches } from "./useBarangayOptions";

function statsFromFarms(farms: FarmRow[], brgy: string | null) {
  const scoped = brgy ? farms.filter((f) => brgyMatches(f.brgy, brgy)) : farms;
  return {
    farms: scoped.length,
    surveysMonth: String(scoped.length),
    highRisk: scoped.filter((f) => f.status === "risk").length,
  };
}

export function useOfficerScope() {
  const { user } = useAuth();
  const { farms, officers } = useDemoStore();

  return useMemo(() => {
    let assignedBrgy: string | null = null;
    if (user?.assignedBrgy && user.assignedBrgy !== "Unassigned") {
      assignedBrgy = user.assignedBrgy;
    } else if (user?.id) {
      if (isApiEnabled()) {
        const row = officers.find(
          (o) => o.empId.trim().toUpperCase() === user.id.trim().toUpperCase(),
        );
        if (row?.brgy && row.brgy !== "Unassigned") {
          assignedBrgy = row.brgy;
        }
      } else {
        assignedBrgy = OFFICER_ASSIGNED_BRGY[user.id] ?? null;
      }
    }
    const stats =
      isApiEnabled() && farms.length >= 0
        ? statsFromFarms(farms, assignedBrgy)
        : assignedBrgy
          ? statsFromFarms(farms, assignedBrgy)
          : statsFromFarms(farms, null);

    return {
      officerId: user?.id ?? null,
      assignedBrgy,
      isScoped: !!assignedBrgy,
      stats,
      subtitle: assignedBrgy
        ? `${assignedBrgy} — ${new Date().toLocaleDateString("en-PH", { month: "long", year: "numeric" })}`
        : `Negros Occidental — ${new Date().toLocaleDateString("en-PH", { month: "long", year: "numeric" })}`,
    };
  }, [user?.id, user?.assignedBrgy, farms, officers]);
}

export function filterByBrgy<T extends { brgy: string }>(items: T[], brgy: string | null): T[] {
  if (!brgy) return items;
  return items.filter((i) => brgyMatches(i.brgy, brgy));
}
