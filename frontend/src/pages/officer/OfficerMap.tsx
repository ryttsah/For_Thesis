import { IconFileText, IconMap2, IconUpload } from "@tabler/icons-react";
import { useMemo, useState } from "react";
import { useDemoStore } from "../../context/DemoStoreContext";
import { filterByBrgy, useOfficerScope } from "../../hooks/useOfficerScope";
import { isApiEnabled } from "../../services/api";
import type { FarmRow } from "../../types/demoStore";
import { Card, CardHead } from "../../components/ui/Card";

const SECTOR_META: Record<
  string,
  { dir: string; color: string }
> = {
  A: { dir: "North Area", color: "#22a355" },
  B: { dir: "South Area", color: "#f59e0b" },
  C: { dir: "East Area", color: "#3b82f6" },
  D: { dir: "West Area", color: "#dc2626" },
};

function sectorCodeFromFarm(sector: string): string {
  const match = sector.trim().match(/^([A-D])/i);
  return match ? match[1]!.toUpperCase() : "?";
}

function statusLabel(status: FarmRow["status"]): { label: string; color: string } {
  if (status === "healthy") return { label: "Healthy", color: "#22a355" };
  if (status === "caution") return { label: "Caution", color: "#f59e0b" };
  if (status === "risk") return { label: "At Risk", color: "#dc2626" };
  return { label: "Pending", color: "#6b7280" };
}

export default function OfficerMap() {
  const [selected, setSelected] = useState<string | null>(null);
  const { assignedBrgy } = useOfficerScope();
  const { farms } = useDemoStore();

  const scopedFarms = useMemo(
    () => filterByBrgy(farms, assignedBrgy),
    [farms, assignedBrgy],
  );

  const mapSectors = useMemo(() => {
    const groups = new Map<string, FarmRow[]>();
    for (const farm of scopedFarms) {
      const code = sectorCodeFromFarm(farm.sector);
      const list = groups.get(code) ?? [];
      list.push(farm);
      groups.set(code, list);
    }

    return ["A", "B", "C", "D"]
      .filter((code) => groups.has(code))
      .map((code) => {
        const list = groups.get(code)!;
        const meta = SECTOR_META[code] ?? { dir: "Farm area", color: "#6b7280" };
        const brgy = list[0]?.brgy ?? assignedBrgy ?? "—";
        const healthy = list.filter((f) => f.status === "healthy").length;
        const pct = list.length ? Math.round((healthy / list.length) * 100) : 0;
        const worst = list.some((f) => f.status === "risk")
          ? "At Risk"
          : list.some((f) => f.status === "caution")
            ? "Caution"
            : "Healthy";

        return {
          code,
          name: `Sector ${code}`,
          dir: meta.dir,
          brgy,
          pct,
          color: meta.color,
          status: worst,
          farmCount: list.length,
          farms: list,
        };
      });
  }, [scopedFarms, assignedBrgy]);

  const selectedGroup = mapSectors.find((s) => s.code === selected);

  return (
    <div className="animate-fade-in">
      <div className="mb-4 rounded-[14px] border border-pca-border bg-white p-6">
        <h3 className="mb-2 flex items-center gap-2 text-sm font-bold">
          <IconMap2 size={16} className="text-pca-green" />
          Farm Map — Sectors from registered farms
        </h3>
        <p className="mb-5 text-xs text-pca-muted">
          {isApiEnabled()
            ? "Sectors A–D are compass areas on the farm. Only sectors that have at least one approved farm in the database are shown."
            : "Connect the API to load farms from the database."}
          {assignedBrgy ? ` Scoped to ${assignedBrgy}.` : ""}
        </p>

        {mapSectors.length === 0 ? (
          <p className="rounded-xl border border-dashed border-pca-border bg-pca-bg py-10 text-center text-sm text-pca-muted">
            No farms in the database yet. Sectors appear after admin approves farmer registrations.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
            {mapSectors.map((s) => (
              <button
                key={s.code}
                type="button"
                onClick={() => setSelected(s.code)}
                className={`rounded-xl border-2 p-5 text-left transition-all hover:-translate-y-0.5 ${
                  selected === s.code ? "border-pca-green bg-pca-green-light" : "border-pca-border"
                }`}
              >
                <h4 className="mb-1 font-bold">{s.name}</h4>
                <div className="mb-2 text-xs text-pca-muted">
                  {s.dir} | <span className="font-semibold">{s.brgy}</span>
                </div>
                <div className="mb-2 text-xs text-pca-muted">{s.farmCount} farm{s.farmCount === 1 ? "" : "s"}</div>
                <div className="mb-2 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-sm bg-pca-border">
                    <div className="h-full" style={{ width: `${s.pct}%`, background: s.color }} />
                  </div>
                  <span className="text-xs font-semibold">{s.pct}% healthy</span>
                </div>
                <span className="rounded-md bg-pca-green-light px-2 py-0.5 text-[10px] font-semibold text-pca-green">
                  {s.status}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <Card>
        <CardHead title="Sector detail" icon={<IconFileText size={16} />} />
        {!selectedGroup ? (
          <p className="text-[13px] text-pca-muted">Select a sector above to view farms in that area.</p>
        ) : (
          <div className="text-sm">
            <div className="mb-4">
              <div className="text-base font-bold">{selectedGroup.name} — {selectedGroup.dir}</div>
              <div className="text-xs text-pca-muted">{selectedGroup.brgy}</div>
            </div>
            <ul className="mb-4 flex flex-col gap-2">
              {selectedGroup.farms.map((f) => {
                const st = statusLabel(f.status);
                return (
                  <li
                    key={f.name}
                    className="flex items-center justify-between rounded-lg border border-pca-border px-3 py-2"
                  >
                    <div>
                      <div className="font-semibold">{f.name}</div>
                      <div className="text-xs text-pca-muted">
                        {f.owner} · {f.trees} trees · {f.sector}
                      </div>
                    </div>
                    <span
                      className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                      style={{ color: st.color, background: `${st.color}18` }}
                    >
                      {st.label}
                    </span>
                  </li>
                );
              })}
            </ul>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="font-semibold">Photos</span>
                <label className="flex cursor-pointer items-center gap-1 rounded-lg border border-pca-green px-2.5 py-1 text-xs font-semibold text-pca-green">
                  <IconUpload size={14} /> Add Photos
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={() => alert("Field photo upload — coming soon")}
                  />
                </label>
              </div>
              <p className="text-xs text-pca-muted">Upload links to surveys when that feature is added.</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
