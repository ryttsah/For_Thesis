import { IconClipboardList, IconFilter, IconSearch } from "@tabler/icons-react";
import { useMemo, useState } from "react";
import AnalysisDetailsModal, { type AnalysisModalRecord } from "../../components/analysis/AnalysisDetailsModal";
import { useDemoStore } from "../../context/DemoStoreContext";
import { useBarangayOptions } from "../../hooks/useBarangayOptions";
import { Card, CardHead, GhostButton, Pagination } from "../../components/ui/Card";
import StatusBadge from "../../components/ui/StatusBadge";
import type { SurveyRow } from "../../types/demoStore";
import { displayBrgyLabel, normalizeBrgyLabel } from "../../utils/pcaFormat";
import { useTablePagination } from "../../hooks/useTablePagination";

function sectorCode(sector: string) {
  return sector.trim().match(/^([A-D])/i)?.[1]?.toUpperCase() ?? sector.trim().toUpperCase();
}

function statusKey(status: SurveyRow["status"] | string) {
  if (status === "healthy" || status === "validated") return "validated";
  return status;
}

function statusLabel(status: SurveyRow["status"] | string) {
  if (statusKey(status) === "validated") return "Validated";
  if (status === "pending") return "Pending";
  if (status === "review") return "Review";
  if (status === "caution") return "Caution";
  if (status === "risk") return "Risk";
  return "Review";
}

export default function AdminSurveys() {
  const { surveys } = useDemoStore();
  const barangays = useBarangayOptions();
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [sectorFilter, setSectorFilter] = useState("all");
  const [brgyFilter, setBrgyFilter] = useState("all");
  const [selectedSurvey, setSelectedSurvey] = useState<SurveyRow | null>(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return surveys.filter((s) => {
      const matchesText =
        !q || `${s.date} ${s.farm} ${s.sector} ${s.brgy} ${s.aiResult} ${s.officer}`.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || statusKey(s.status) === statusFilter;
      const matchesSector = sectorFilter === "all" || sectorCode(s.sector) === sectorFilter;
      const matchesBrgy = brgyFilter === "all" || normalizeBrgyLabel(s.brgy) === normalizeBrgyLabel(brgyFilter);
      return matchesText && matchesStatus && matchesSector && matchesBrgy;
    });
  }, [surveys, query, statusFilter, sectorFilter, brgyFilter]);
  const { page, setPage, pageRows, pageSize } = useTablePagination(filtered);

  return (
    <div className="animate-fade-in">
      <Card className="mb-4">
        <CardHead
          title="All Surveys (Province-wide)"
          icon={<IconClipboardList size={16} />}
          action={<GhostButton onClick={() => setShowFilters((v) => !v)}><IconFilter size={14} className="mr-1 inline" />Filter</GhostButton>}
        />
        <div className="admin-survey-toolbar mb-4">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-pca-muted">Search</label>
          <div className="flex items-center gap-2.5 rounded-[10px] border-[1.5px] border-pca-border bg-pca-bg px-3.5 focus-within:border-pca-green focus-within:bg-white">
            <IconSearch size={18} className="text-pca-muted" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Farm, officer, barangay, date, AI result..."
              className="flex-1 border-none bg-transparent py-2.5 text-sm outline-none"
            />
          </div>
        </div>
        {showFilters && (
          <div className="mb-4 grid gap-3 rounded-xl border border-pca-border bg-pca-bg p-4 md:grid-cols-3">
            <label>
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-pca-muted">Status</span>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full rounded-lg border border-pca-border bg-white px-3 py-2 text-sm">
                <option value="all">All statuses</option>
                <option value="validated">Validated</option>
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
              {pageRows.map((s) => (
                <tr
                  key={s.id ?? s.date + s.farm}
                  onClick={() => setSelectedSurvey(s)}
                  className="cursor-pointer border-b border-pca-border hover:bg-pca-bg"
                >
                  <td className="px-4 py-3.5">{s.date}</td>
                  <td className="px-4 py-3.5">{s.farm}</td>
                  <td className="px-4 py-3.5">{s.sector}</td>
                  <td className="px-4 py-3.5">{s.brgy}</td>
                  <td className="px-4 py-3.5">{s.images}</td>
                  <td className="px-4 py-3.5">{s.aiResult}</td>
                  <td className="px-4 py-3.5">{s.officer}</td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={statusKey(s.status) === "validated" ? "healthy" : s.status === "review" ? "caution" : s.status} label={statusLabel(s.status)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-[13px] text-pca-muted">Showing {filtered.length ? (page - 1) * pageSize + 1 : 0}–{Math.min(page * pageSize, filtered.length)} of {filtered.length} survey records</span>
        <Pagination page={page} totalItems={filtered.length} pageSize={pageSize} onPageChange={setPage} />
      </div>
      <AnalysisDetailsModal
        open={Boolean(selectedSurvey)}
        record={
          selectedSurvey
            ? ({
                title: selectedSurvey.farm,
                date: selectedSurvey.date,
                farm: selectedSurvey.farm,
                sector: sectorCode(selectedSurvey.sector),
                brgy: selectedSurvey.brgy,
                result: selectedSurvey.aiResult,
                details: selectedSurvey.details,
              } satisfies AnalysisModalRecord)
            : null
        }
        onClose={() => setSelectedSurvey(null)}
      />
    </div>
  );
}
