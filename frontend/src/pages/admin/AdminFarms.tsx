import { IconPlant2 } from "@tabler/icons-react";
import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import FarmTableToolbar from "../../components/ui/FarmTableToolbar";
import { useDemoStore } from "../../context/DemoStoreContext";
import { Card, CardHead, GhostButton } from "../../components/ui/Card";
import StatusBadge from "../../components/ui/StatusBadge";
import type { FarmStatus } from "../../types/demoStore";
import { brgyMatches } from "../../hooks/useBarangayOptions";
import { displayBrgyLabel } from "../../utils/pcaFormat";

export default function AdminFarms() {
  const { farms, adminFarmFilter, setAdminFarmFilter } = useDemoStore();
  const [selectedFarmId, setSelectedFarmId] = useState<string | null>(null);
  const [params] = useSearchParams();
  const brgyFromUrl = params.get("brgy");
  const activeFilter = brgyFromUrl ?? adminFarmFilter;

  const baseRows = useMemo(
    () =>
      (activeFilter
        ? farms.filter((f) => brgyMatches(f.brgy, activeFilter))
        : farms).slice().sort((a, b) => (b.farmerId ?? "").localeCompare(a.farmerId ?? "", undefined, { numeric: true })),
    [farms, activeFilter],
  );

  const tableRows = useMemo(
    () =>
      baseRows.map((f) => ({
        farmerId: f.farmerId,
        name: f.name,
        owner: f.owner,
        phone: f.phone,
        sector: f.sector,
        brgy: displayBrgyLabel(f.brgy),
        trees: f.trees,
        status: f.status as FarmStatus,
        lastSurvey: f.lastSurvey,
      })),
    [baseRows],
  );
  const selectedFarm = baseRows.find((farm) => (farm.farmerId ?? farm.name) === selectedFarmId) ?? null;

  return (
    <div className="animate-fade-in">
      <p className="mb-4 text-[13px] text-pca-muted">
        <strong>Status</strong> = farm health from AI/farmer reports: pending (new), healthy, caution, risk.
        <strong> Trees</strong> = estimate from registered hectares (~45 palms/ha).
        <strong> Sector</strong> = map zone; updated when the farmer submits a photo report. Records are ordered newest to oldest.
      </p>
      <Card className="mb-4">
        <CardHead
          title={
            <>
              All Farms
              {activeFilter && (
                <span className="ml-2 text-xs font-medium text-pca-muted">
                  — filtered: {displayBrgyLabel(activeFilter)}
                </span>
              )}
            </>
          }
          icon={<IconPlant2 size={16} />}
          action={
            activeFilter ? (
              <GhostButton
                onClick={() => {
                  setAdminFarmFilter(null);
                  window.history.replaceState({}, "", "/admin/farms");
                }}
              >
                Clear filter
              </GhostButton>
            ) : undefined
          }
        />
        <div className="px-4 pb-4">
          <FarmTableToolbar rows={tableRows}>
            {(filtered) => (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[13px]">
                  <thead>
                    <tr className="border-b border-pca-border bg-pca-bg text-left text-xs font-semibold uppercase text-pca-muted">
                      {["Farmer ID", "Farm", "Owner", "Phone", "Sector", "Brgy.", "Trees", "Status", "Last Survey"].map((h) => (
                        <th key={h} className="px-4 py-3">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((f) => (
                      <tr key={f.farmerId ?? f.name} onClick={() => setSelectedFarmId(f.farmerId ?? f.name)} className="cursor-pointer border-b border-pca-border hover:bg-pca-bg focus-within:bg-pca-bg">
                        <td className="px-4 py-3.5 font-mono text-xs font-semibold">{f.farmerId ?? "—"}</td>
                        <td className="px-4 py-3.5 font-semibold">{f.name}</td>
                        <td className="px-4 py-3.5">{f.owner}</td>
                        <td className="px-4 py-3.5">{f.phone ?? "—"}</td>
                        <td className="px-4 py-3.5">{f.sector}</td>
                        <td className="px-4 py-3.5">{f.brgy}</td>
                        <td className="px-4 py-3.5">{f.trees}</td>
                        <td className="px-4 py-3.5">
                          <StatusBadge status={f.status} />
                        </td>
                        <td className="px-4 py-3.5">{f.lastSurvey}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </FarmTableToolbar>
        </div>
      </Card>
      <div className="flex justify-between">
        <span className="text-[13px] text-pca-muted">
          {activeFilter ? `Filtered view (${tableRows.length} farms)` : `All farms in database (${tableRows.length})`}
        </span>
      </div>
      {!activeFilter && (
        <p className="mt-3 text-xs text-pca-muted">
          Tip: filter by barangay from the{" "}
          <Link to="/admin" className="text-pca-green hover:underline">
            dashboard
          </Link>{" "}
          overview.
        </p>
      )}
      {selectedFarm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4" role="dialog" aria-modal="true" aria-label="Farm registration details">
          <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-pca-border pb-4">
              <div><p className="text-xs font-bold uppercase tracking-wide text-pca-muted">Farm and farmer details</p><h2 className="mt-1 text-xl font-bold text-pca-text">{selectedFarm.name}</h2></div>
              <button type="button" onClick={() => setSelectedFarmId(null)} className="h-9 w-9 rounded-lg border border-pca-border text-xl text-pca-muted hover:bg-pca-bg" aria-label="Close farm details">×</button>
            </div>
            <dl className="mt-5 grid gap-x-6 gap-y-4 sm:grid-cols-2">
              {[
                ["Farmer ID", selectedFarm.farmerId ?? "—"], ["Farmer name", selectedFarm.owner], ["Phone", selectedFarm.phone ?? "—"], ["Password", "••••••••  Securely stored; use a credential reset to change it."], ["Farm area / palms", `${selectedFarm.trees} estimated palms`], ["Sector", selectedFarm.sector], ["Barangay", displayBrgyLabel(selectedFarm.brgy)], ["Farm status", selectedFarm.status], ["Latest survey", selectedFarm.lastSurvey],
              ].map(([label, value]) => <div key={label}><dt className="text-xs font-bold uppercase tracking-wide text-pca-muted">{label}</dt><dd className="mt-1 break-words text-sm font-semibold text-pca-text">{value}</dd></div>)}
            </dl>
          </div>
        </div>
      )}
    </div>
  );
}
