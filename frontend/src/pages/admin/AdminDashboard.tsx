import { IconAlertTriangle, IconCalendarStats, IconChartBar, IconMapPin, IconPlant2, IconUserCheck, IconUsers } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import StackedTrendChart from "../../components/charts/StackedTrendChart";
import EmptyChartNote from "../../components/ui/EmptyChartNote";
import { isApiEnabled } from "../../services/api";
import { fetchConditionTrend, type ConditionTrendData } from "../../services/analytics";
import { useDemoStore } from "../../context/DemoStoreContext";
import { Card, CardHead } from "../../components/ui/Card";
import MetricCard from "../../components/ui/MetricCard";

function formatVisitLine(date: string, slot: string) {
  const d = new Date(date + "T12:00:00").toLocaleDateString("en-PH", { weekday: "short", month: "short", day: "numeric" });
  return `${d} | ${slot === "AM" ? "Morning" : "Afternoon"}`;
}

export default function AdminDashboard() {
  const { pendingCount, scheduledVisits, farms, officers } = useDemoStore();
  const [trend, setTrend] = useState<ConditionTrendData | null>(null);

  useEffect(() => {
    if (!isApiEnabled()) return;
    void fetchConditionTrend().then(setTrend);
  }, [farms.length, officers.length, pendingCount]);

  const highRisk = farms.filter((f) => f.status === "risk").length;
  const brgyGroups = farms.reduce<Record<string, number>>((acc, f) => {
    acc[f.brgy] = (acc[f.brgy] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="animate-fade-in">
      <div className="mb-5 grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={<IconPlant2 size={20} />} value={farms.length} label="Total Registered Farms" />
        <MetricCard icon={<IconUsers size={20} />} tone="blue" value={officers.length} label="Total Officers" />
        <MetricCard icon={<IconUserCheck size={20} />} tone="orange" value={pendingCount} label="Pending Farmer Approvals" />
        <MetricCard icon={<IconAlertTriangle size={20} />} tone="red" value={highRisk} label="High-Risk Farms" />
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHead title="Condition Trend — Last 6 Months" icon={<IconChartBar size={16} />} />
          {trend && trend.labels.length > 0 ? (
            <>
              <p className="mb-2 text-xs text-pca-muted">Province-wide from surveys and farmer submissions (last 6 months).</p>
              <StackedTrendChart
                labels={trend.labels}
                healthy={trend.healthy}
                yellowing={trend.yellowing}
                scale={trend.scale}
                beetle={trend.beetle}
                height={220}
              />
            </>
          ) : (
            <EmptyChartNote
              message={
                isApiEnabled()
                  ? "No trend data yet. Approve farmers and record surveys or CNN submissions."
                  : "Connect the API to load live data."
              }
            />
          )}
        </Card>
        <Card>
          <CardHead title="Barangay Overview" icon={<IconMapPin size={16} />} />
          <div className="flex flex-col gap-2">
            {Object.keys(brgyGroups).length === 0 ? (
              <p className="py-6 text-center text-sm text-pca-muted">
                No farms by barangay yet. Approve farmer registrations to add farms.
              </p>
            ) : (
              Object.entries(brgyGroups).map(([name, count]) => (
                <Link key={name} to={`/admin/farms?brgy=${encodeURIComponent(name)}`} className="flex items-center gap-3 rounded-xl border border-pca-border p-3.5 hover:bg-pca-bg">
                  <span className="h-2.5 w-2.5 rounded-full bg-pca-green" />
                  <div className="flex-1">
                    <div className="text-sm font-semibold">{name}</div>
                    <span className="text-xs text-pca-muted">{count} farm{count === 1 ? "" : "s"}</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </Card>
      </div>

      <Card className="mb-4">
        <CardHead title="Scheduled Visits Overview" icon={<IconCalendarStats size={16} />} action={<span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-600">{scheduledVisits.length} scheduled</span>} />
        <p className="mb-3 text-xs text-pca-muted">Read-only province-wide monitoring of officer-booked farm visits.</p>
        <div className="flex flex-col gap-2">
          {scheduledVisits.map((v) => (
            <div key={v.id} className="flex items-center gap-3 rounded-xl border border-pca-border p-3.5">
              <div className="flex-1">
                <div className="text-sm font-semibold">{v.farm}</div>
                <span className="text-xs text-pca-muted">{v.brgy} · {formatVisitLine(v.date, v.slot)} · {v.scheduledBy}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHead title="Officer Assignment Summary" icon={<IconUsers size={16} />} />
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-pca-border bg-pca-bg text-left text-xs font-semibold uppercase text-pca-muted">
                {["Officer", "Assigned Barangay", "Farms Covered", "Last Active"].map((h) => (
                  <th key={h} className="px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {officers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-sm text-pca-muted">
                    No officers yet. Use Officers → Add Officer.
                  </td>
                </tr>
              ) : (
                officers.map((o) => (
                  <tr key={o.empId} className="border-b border-pca-border hover:bg-pca-bg">
                    <td className="px-4 py-3.5 font-semibold">{o.name}</td>
                    <td className="px-4 py-3.5">{o.brgy}</td>
                    <td className="px-4 py-3.5">{o.farmsCovered}</td>
                    <td className="px-4 py-3.5">{o.lastActive}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
