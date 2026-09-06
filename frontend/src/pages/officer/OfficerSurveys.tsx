import { IconCalendar, IconClipboardList, IconDownload, IconFilter, IconSearch } from "@tabler/icons-react";
import { useMemo, useState } from "react";
import { useDemoStore } from "../../context/DemoStoreContext";
import { useBarangayOptions } from "../../hooks/useBarangayOptions";
import { filterByBrgy, useOfficerScope } from "../../hooks/useOfficerScope";
import { Card, CardHead, GhostButton, Pagination } from "../../components/ui/Card";
import StatusBadge from "../../components/ui/StatusBadge";
import type { FarmStatus } from "../../types/demoStore";
import { displayBrgyLabel, normalizeBrgyLabel } from "../../utils/pcaFormat";

function surveyStatusLabel(s: FarmStatus | "review") {
  if (s === "healthy") return "Validated";
  if (s === "pending") return "Pending";
  if (s === "review") return "Review";
  return "Validated";
}

export default function OfficerSurveys() {
  const { surveys } = useDemoStore();
  const { assignedBrgy } = useOfficerScope();
  const barangays = useBarangayOptions();
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [sectorFilter, setSectorFilter] = useState("all");
  const [brgyFilter, setBrgyFilter] = useState(assignedBrgy ? normalizeBrgyLabel(assignedBrgy) : "all");
  const scoped = useMemo(() => filterByBrgy(surveys, assignedBrgy), [surveys, assignedBrgy]);
  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return scoped.filter((s) => {
      const matchesText =
        !q || `${s.date} ${s.farm} ${s.sector} ${s.brgy} ${s.aiResult} ${s.officer}`.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || s.status === statusFilter;
      const matchesSector = sectorFilter === "all" || s.sector === sectorFilter;
      const matchesBrgy = brgyFilter === "all" || normalizeBrgyLabel(s.brgy) === normalizeBrgyLabel(brgyFilter);
      return matchesText && matchesStatus && matchesSector && matchesBrgy;
    });
  }, [scoped, query, statusFilter, sectorFilter, brgyFilter]);

  return (
    <div className="animate-fade-in">
      <Card className="mb-4">
        <CardHead
          title="Recent Surveys"
          icon={<IconClipboardList size={16} />}
          action={
            <div className="flex gap-2">
              <GhostButton><IconCalendar size={14} className="mr-1 inline" />May 2026</GhostButton>
              <GhostButton onClick={() => setShowFilters((v) => !v)}><IconFilter size={14} className="mr-1 inline" />Filter</GhostButton>
              <GhostButton onClick={() => alert("Export started.")}><IconDownload size={14} className="mr-1 inline" />Export</GhostButton>
            </div>
          }
        />
        <div className="mb-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <label>
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-pca-muted">Search</span>
            <div className="flex items-center gap-2.5 rounded-[10px] border-[1.5px] border-pca-border bg-pca-bg px-3.5 focus-within:border-pca-green focus-within:bg-white">
              <IconSearch size={18} className="text-pca-muted" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Farm, barangay, date, AI result..."
                className="min-w-0 flex-1 border-none bg-transparent py-2.5 text-sm outline-none"
              />
            </div>
          </label>
          <span className="text-right text-xs font-semibold text-pca-muted">
            {assignedBrgy ? `Scope: ${displayBrgyLabel(assignedBrgy)}` : "Scope: All barangays"}
          </span>
        </div>
        {showFilters && (
          <div className="mb-4 grid gap-3 rounded-xl border border-pca-border bg-pca-bg p-4 md:grid-cols-3">
            <label>
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-pca-muted">Status</span>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full rounded-lg border border-pca-border bg-white px-3 py-2 text-sm">
                <option value="all">All statuses</option>
                <option value="healthy">Validated</option>
                <option value="pending">Pending</option>
                <option value="review">Review</option>
                <option value="caution">Caution</option>
                <option value="risk">Risk</option>
              </select>
            </label>
            <label>
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-pca-muted">Sector</span>
              <select value={sectorFilter} onChange={(e) => setSectorFilter(e.target.value)} className="w-full rounded-lg border border-pca-border bg-white px-3 py-2 text-sm">
                <option value="all">All sectors</option>
                {["A", "B", "C", "D"].map((sector) => (
                  <option key={sector} value={sector}>Sector {sector}</option>
                ))}
              </select>
            </label>
            <label>
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-pca-muted">Barangay</span>
              <select value={brgyFilter} onChange={(e) => setBrgyFilter(e.target.value)} className="w-full rounded-lg border border-pca-border bg-white px-3 py-2 text-sm">
                <option value="all">All barangays</option>
                {barangays.map((brgy) => (
                  <option key={brgy} value={brgy}>{displayBrgyLabel(brgy)}</option>
                ))}
              </select>
            </label>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-pca-border bg-pca-bg text-left text-xs font-semibold uppercase text-pca-muted">
                {["Date", "Farm", "Sector", "Barangay", "Images", "AI Result", "Officer", "Status"].map((h) => (
                  <th key={h} className="px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.date + s.farm} className="border-b border-pca-border hover:bg-pca-bg">
                  <td className="px-4 py-3.5">{s.date}</td>
                  <td className="px-4 py-3.5">{s.farm}</td>
                  <td className="px-4 py-3.5">{s.sector}</td>
                  <td className="px-4 py-3.5">{s.brgy}</td>
                  <td className="px-4 py-3.5">{s.images}</td>
                  <td className="px-4 py-3.5">{s.aiResult}</td>
                  <td className="px-4 py-3.5">{s.officer}</td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={s.status === "review" ? "caution" : s.status} label={surveyStatusLabel(s.status)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-[13px] text-pca-muted">Showing {filtered.length} of {scoped.length} survey records</span>
        <Pagination />
      </div>
    </div>
  );
}
