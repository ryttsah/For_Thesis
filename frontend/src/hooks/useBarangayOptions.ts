import { useEffect, useMemo, useState } from "react";
import { useDemoStore } from "../context/DemoStoreContext";
import { getApiBase, getAuthHeaders, isApiEnabled } from "../services/api";
import { normalizeBrgyLabel } from "../utils/pcaFormat";

const FALLBACK_BRGYS = [
  "Brgy. Conception",
  "Brgy. Granada",
  "Brgy. Alangilan",
  "Brgy. Mandalagan",
];

export function useBarangayOptions() {
  const { farms } = useDemoStore();
  const [fromApi, setFromApi] = useState<string[]>([]);

  useEffect(() => {
    if (!isApiEnabled()) return;
    void fetch(`${getApiBase()}/meta/barangays`, { headers: getAuthHeaders() })
      .then((res) => (res.ok ? res.json() : []))
      .then((rows) =>
        setFromApi(
          Array.isArray(rows) ? rows.map((r) => (typeof r === "string" ? normalizeBrgyLabel(r) : r)) : [],
        ),
      )
      .catch(() => setFromApi([]));
  }, [farms.length]);

  const options = useMemo(() => {
    const set = new Set<string>([...FALLBACK_BRGYS, ...fromApi]);
    for (const f of farms) {
      if (f.brgy?.trim()) set.add(normalizeBrgyLabel(f.brgy));
    }
    return [...set].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  }, [fromApi, farms]);

  return options;
}

/** Case-insensitive barangay match for farm scoping. */
export function brgyMatches(farmBrgy: string, assigned: string | null): boolean {
  if (!assigned) return true;
  return normalizeBrgyLabel(farmBrgy).toLowerCase() === normalizeBrgyLabel(assigned).toLowerCase();
}
