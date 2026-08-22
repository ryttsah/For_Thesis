import { IconPlant2 } from "@tabler/icons-react";
import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import FarmTableToolbar from "../../components/ui/FarmTableToolbar";
import { useDemoStore } from "../../context/DemoStoreContext";
import { Card, CardHead, GhostButton, Pagination } from "../../components/ui/Card";
import StatusBadge from "../../components/ui/StatusBadge";
import type { FarmStatus } from "../../types/demoStore";
import { brgyMatches } from "../../hooks/useBarangayOptions";
import { displayBrgyLabel } from "../../utils/pcaFormat";

export default function AdminFarms() {
  const { farms, adminFarmFilter, setAdminFarmFilter } = useDemoStore();
  const [params] = useSearchParams();
  const brgyFromUrl = params.get("brgy");
  const activeFilter = brgyFromUrl ?? adminFarmFilter;

  const baseRows = useMemo(
    () =>
      activeFilter
        ? farms.filter((f) => brgyMatches(f.brgy, activeFilter))
        : farms,
    [farms, activeFilter],
  );

  const tableRows = useMemo(
    () =>
      baseRows.map((f) => ({
        name: f.name,
        owner: f.owner,
        sector: f.sector,
        brgy: displayBrgyLabel(f.brgy),
        trees: f.trees,
        status: f.status as FarmStatus,
        lastSurvey: f.lastSurvey,
      })),
    [baseRows],
  );

  return (
    <div className="animate-fade-in">
      <p className="mb-4 text-[13px] text-pca-muted">
        <strong>Status</strong> = farm health from AI/farmer reports: pending (new), healthy, caution, risk.
        <strong> Trees</strong> = estimate from registered hectares (~45 palms/ha).
        <strong> Sector</strong> = map zone; updated when the farmer submits a photo report.
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
                      {["Farm", "Owner", "Sector", "Brgy.", "Trees", "Status", "Last Survey"].map((h) => (
                        <th key={h} className="px-4 py-3">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((f) => (
                      <tr key={f.name} className="border-b border-pca-border hover:bg-pca-bg">
                        <td className="px-4 py-3.5 font-semibold">{f.name}</td>
                        <td className="px-4 py-3.5">{f.owner}</td>
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
        <Pagination />
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
    </div>
  );
}
