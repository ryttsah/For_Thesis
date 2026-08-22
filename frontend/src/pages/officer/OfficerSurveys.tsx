import { IconCalendar, IconClipboardList, IconDownload } from "@tabler/icons-react";
import { useMemo } from "react";
import { useDemoStore } from "../../context/DemoStoreContext";
import { filterByBrgy, useOfficerScope } from "../../hooks/useOfficerScope";
import { Card, CardHead, GhostButton, Pagination } from "../../components/ui/Card";
import StatusBadge from "../../components/ui/StatusBadge";
import type { FarmStatus } from "../../types/demoStore";

function surveyStatusLabel(s: FarmStatus | "review") {
  if (s === "healthy") return "Validated";
  if (s === "pending") return "Pending";
  if (s === "review") return "Review";
  return "Validated";
}

export default function OfficerSurveys() {
  const { surveys } = useDemoStore();
  const { assignedBrgy } = useOfficerScope();
  const scoped = useMemo(() => filterByBrgy(surveys, assignedBrgy), [surveys, assignedBrgy]);

  return (
    <div className="animate-fade-in">
      <Card className="mb-4">
        <CardHead
          title="Recent Surveys"
          icon={<IconClipboardList size={16} />}
          action={
            <div className="flex gap-2">
              <GhostButton><IconCalendar size={14} className="mr-1 inline" />May 2026</GhostButton>
              <GhostButton onClick={() => alert("Export started — demo")}><IconDownload size={14} className="mr-1 inline" />Export</GhostButton>
            </div>
          }
        />
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
              {scoped.map((s) => (
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
        <span className="text-[13px] text-pca-muted">Showing {scoped.length} of 1,482 surveys this month</span>
        <Pagination />
      </div>
    </div>
  );
}
