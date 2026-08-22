import { IconPlant2 } from "@tabler/icons-react";
import { useMemo } from "react";
import FarmTableToolbar from "../../components/ui/FarmTableToolbar";
import { useDemoStore } from "../../context/DemoStoreContext";
import { filterByBrgy, useOfficerScope } from "../../hooks/useOfficerScope";
import { Card, CardHead, Pagination } from "../../components/ui/Card";
import StatusBadge from "../../components/ui/StatusBadge";
import type { FarmStatus } from "../../types/demoStore";
import { displayBrgyLabel } from "../../utils/pcaFormat";

export default function OfficerFarms() {
  const { farms } = useDemoStore();
  const { assignedBrgy } = useOfficerScope();
  const scoped = useMemo(() => filterByBrgy(farms, assignedBrgy), [farms, assignedBrgy]);

  const tableRows = useMemo(
    () =>
      scoped.map((f) => ({
        name: f.name,
        owner: f.owner,
        sector: f.sector,
        brgy: displayBrgyLabel(f.brgy),
        trees: f.trees,
        status: f.status as FarmStatus,
        lastSurvey: f.lastSurvey,
      })),
    [scoped],
  );

  return (
    <div className="animate-fade-in">
      <Card className="mb-4">
        <CardHead title="Registered Farms" icon={<IconPlant2 size={16} />} />
        <div className="px-4 pb-4">
          <FarmTableToolbar rows={tableRows}>
            {(filtered) => (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[13px]">
                  <thead>
                    <tr className="border-b border-pca-border bg-pca-bg text-left text-xs font-semibold uppercase text-pca-muted">
                      {["Farm Name", "Owner", "Sector", "Brgy.", "Trees", "Status", "Last Survey"].map((h) => (
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-[13px] text-pca-muted">
          {assignedBrgy
            ? `Farms in ${displayBrgyLabel(assignedBrgy)} (${tableRows.length})`
            : `All farms (${tableRows.length}) — assign a brgy. to scope your list`}
        </span>
        <Pagination />
      </div>
    </div>
  );
}
