import { IconFilter, IconSearch } from "@tabler/icons-react";
import { useMemo, useState } from "react";
import type { FarmStatus } from "../../types/demoStore";
import { normalizeBrgyLabel } from "../../utils/pcaFormat";

export interface FarmRowLike {
  farmerId?: string | null;
  name: string;
  owner: string;
  phone?: string | null;
  sector: string;
  brgy: string;
  trees: number;
  status: FarmStatus;
  lastSurvey: string;
}

interface FarmTableToolbarProps {
  rows: FarmRowLike[];
  children: (filtered: FarmRowLike[]) => React.ReactNode;
  brgyOptions?: string[];
}

export default function FarmTableToolbar({ rows, children, brgyOptions }: FarmTableToolbarProps) {
  const [query, setQuery] = useState("");
  const [brgyFilter, setBrgyFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const brgys = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) set.add(r.brgy);
    for (const b of brgyOptions ?? []) set.add(b);
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [rows, brgyOptions]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (brgyFilter && normalizeBrgyLabel(r.brgy) !== normalizeBrgyLabel(brgyFilter)) return false;
      if (statusFilter && r.status !== statusFilter) return false;
      if (!q) return true;
      return (
        r.name.toLowerCase().includes(q) ||
        (r.farmerId ?? "").toLowerCase().includes(q) ||
        r.owner.toLowerCase().includes(q) ||
        (r.phone ?? "").toLowerCase().includes(q) ||
        r.brgy.toLowerCase().includes(q) ||
        r.sector.toLowerCase().includes(q)
      );
    });
  }, [rows, query, brgyFilter, statusFilter]);

  return (
    <>
      <div className="mb-4 flex flex-wrap items-end gap-2">
        <div className="min-w-[200px] flex-1">
          <label className="mb-1 block text-xs font-semibold text-pca-muted">Search</label>
          <div className="flex items-center gap-2 rounded-lg border border-pca-border bg-pca-bg px-3 py-2">
            <IconSearch size={18} className="shrink-0 text-pca-muted" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Farm, farmer ID, owner, phone, barangay..."
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-[10px] border border-pca-border bg-white px-3 py-2 text-sm font-semibold text-pca-muted hover:bg-pca-bg"
        >
          <IconFilter size={16} />
          Filter
        </button>
      </div>
      {showFilters && (
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-pca-muted">Brgy.</label>
            <select
              value={brgyFilter}
              onChange={(e) => setBrgyFilter(e.target.value)}
              className="w-full rounded-lg border border-pca-border px-3 py-2 text-sm"
            >
              <option value="">All barangays</option>
              {brgys.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-pca-muted">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-lg border border-pca-border px-3 py-2 text-sm"
            >
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="healthy">Healthy</option>
              <option value="caution">Caution</option>
              <option value="risk">Risk</option>
            </select>
          </div>
        </div>
      )}
      {children(filtered)}
      <p className="mt-3 text-[13px] text-pca-muted">
        Showing {filtered.length} of {rows.length} farm{rows.length === 1 ? "" : "s"}
      </p>
    </>
  );
}
