import { IconAlertTriangle, IconCalendarStats, IconChartBar, IconMapPin, IconPlant2, IconStar, IconUserCheck, IconUsers } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import StackedTrendChart from "../../components/charts/StackedTrendChart";
import EmptyChartNote from "../../components/ui/EmptyChartNote";
import { isApiEnabled } from "../../services/api";
import { fetchAdminBootstrap, submitAdminVisitFeedbackApi } from "../../services/domain";
import { fetchConditionTrend, type ConditionTrendData } from "../../services/analytics";
import { useDemoStore } from "../../context/DemoStoreContext";
import { brgyMatches } from "../../hooks/useBarangayOptions";
import { Card, CardHead } from "../../components/ui/Card";
import MetricCard from "../../components/ui/MetricCard";

function formatVisitLine(date: string, slot: string) {
  const d = new Date(date + "T12:00:00").toLocaleDateString("en-PH", { weekday: "short", month: "short", day: "numeric" });
  return `${d} | ${slot === "AM" ? "Morning" : "Afternoon"}`;
}

export default function AdminDashboard() {
  const { pendingCount, scheduledVisits, visitLogs, farms, officers, syncAdminDomain } = useDemoStore();
  const [trend, setTrend] = useState<ConditionTrendData | null>(null);
  const [feedbackFor, setFeedbackFor] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackError, setFeedbackError] = useState("");

  useEffect(() => {
    if (!isApiEnabled()) return;
    void fetchConditionTrend().then(setTrend);
  }, [farms.length, officers.length, pendingCount]);

  useEffect(() => {
    if (!isApiEnabled()) return;
    void fetchAdminBootstrap().then((data) => {
      if (data) syncAdminDomain(data);
    });
  }, [syncAdminDomain]);

  const highRisk = farms.filter((f) => f.status === "risk").length;
  const farmsCoveredFor = (brgy: string) =>
    brgy && brgy !== "Unassigned" ? farms.filter((farm) => brgyMatches(farm.brgy, brgy)).length : "—";
  const brgyGroups = farms.reduce<Record<string, number>>((acc, f) => {
    acc[f.brgy] = (acc[f.brgy] ?? 0) + 1;
    return acc;
  }, {});
  const latestBarangays = Object.entries(brgyGroups).slice(0, 5);
  const feedbackReadyLogs = visitLogs.filter((log) => {
    const officerHasResponded = log.officerComment.trim().length > 0
      || (log.notVisitedReason.trim().length > 0 && log.notVisitedReason !== "Awaiting officer visit outcome.");
    return log.farmerConfirmed !== null && officerHasResponded;
  });

  return (
    <div className="animate-fade-in">
      <div className="mb-5 grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={<IconPlant2 size={20} />} value={farms.length} label="Total Registered Farms" />
        <MetricCard icon={<IconUsers size={20} />} tone="blue" value={officers.length} label="Total Officers" />
        <MetricCard icon={<IconUserCheck size={20} />} tone="orange" value={pendingCount} label="Pending Farmer Approvals" />
        <MetricCard icon={<IconAlertTriangle size={20} />} tone="red" value={highRisk} label="High-Risk Farms" />
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="flex min-h-[650px] flex-col">
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
                height={370}
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
        <Card className="flex min-h-[650px] flex-col">
          <CardHead title="Barangay Overview" icon={<IconMapPin size={16} />} action={<Link to="/admin/farms" className="text-xs font-bold text-pca-green hover:underline">All Farms</Link>} />
          <div className="flex flex-col gap-2">
            {Object.keys(brgyGroups).length === 0 ? (
              <p className="py-6 text-center text-sm text-pca-muted">
                No farms by barangay yet. Approve farmer registrations to add farms.
              </p>
            ) : (
              latestBarangays.map(([name, count]) => (
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

      <Card className="mb-4">
        <CardHead title="Officer Visit Logs" icon={<IconUserCheck size={16} />} action={<span className="rounded-full bg-pca-bg px-2.5 py-0.5 text-[11px] font-semibold text-pca-muted">{feedbackReadyLogs.length} ready for review</span>} />
        <p className="mb-3 text-xs text-pca-muted">A visit appears here only after the farmer has submitted confirmation, a report, or a service rating.</p>
        <div className="flex flex-col gap-3">
          {feedbackReadyLogs.length === 0 ? <p className="py-5 text-center text-sm text-pca-muted">No farmer-confirmed officer visit logs are ready for review yet.</p> : feedbackReadyLogs.map((log) => (
            <div key={log.id} className="rounded-xl border border-pca-border p-4">
              <div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-semibold">{log.farm}</p><p className="text-xs text-pca-muted">{log.officerName} · {log.recordedAt}</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${log.visited ? "bg-pca-green-light text-pca-green" : "bg-pca-red-light text-pca-red"}`}>{log.visited ? "Visited" : "Not visited"}</span></div>
              <p className="mt-3 text-sm">{log.visited ? log.officerComment : log.notVisitedReason}</p>
              {log.farmerConfirmed !== null && <div className="mt-3 border-t border-pca-border pt-3 text-sm"><strong>Farmer feedback:</strong> {log.farmerConfirmed ? `Confirmed${log.farmerRating ? ` · ${log.farmerRating}/5 stars` : ""}` : "Farmer reported that the visit was not completed"}{log.farmerComment ? ` — ${log.farmerComment}` : ""}{log.farmerReport ? ` Report: ${log.farmerReport}` : ""}</div>}
              {log.adminFeedback ? <p className="mt-3 rounded-lg bg-blue-50 p-3 text-sm text-blue-900"><strong>Admin performance feedback:</strong> {log.adminRating ? `${log.adminRating}/5 stars · ` : ""}{log.adminFeedback}</p> : <div className="mt-3"><button type="button" onClick={() => { setFeedbackFor(log.visitId); setFeedback(""); setFeedbackRating(0); setFeedbackError(""); }} className="text-xs font-bold text-pca-green hover:underline">Add performance feedback</button>{feedbackFor === log.visitId && <div className="mt-2 rounded-lg border border-pca-border bg-pca-bg p-3"><p className="text-xs font-bold text-pca-text">Officer performance rating</p><div className="mt-2 flex gap-1">{[1,2,3,4,5].map((star) => <button key={star} type="button" onClick={() => setFeedbackRating(star)} className={star <= feedbackRating ? "text-amber-500" : "text-slate-300"} aria-label={`${star} stars`}><IconStar size={24} fill="currentColor" /></button>)}</div><div className="mt-3 flex flex-col gap-2 sm:flex-row"><input value={feedback} onChange={(e) => setFeedback(e.target.value)} className="min-w-0 flex-1 rounded-lg border border-pca-border px-3 py-2 text-sm" placeholder="Feedback for the officer"/><button type="button" onClick={async () => { if (!feedback.trim() || !feedbackRating) { setFeedbackError("Enter feedback and choose a rating."); return; } const result = await submitAdminVisitFeedbackApi(log.visitId, { feedback, rating: feedbackRating }); if (!result.ok) { setFeedbackError(result.message ?? "Could not save feedback."); return; } const data = await fetchAdminBootstrap(); if (data) syncAdminDomain(data); setFeedbackFor(null); }} className="rounded-lg bg-pca-green px-3 py-2 text-xs font-bold text-white">Save</button></div>{feedbackError && <p className="mt-2 text-xs text-pca-red">{feedbackError}</p>}</div>}</div>}
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
                    <td className="px-4 py-3.5">{farmsCoveredFor(o.brgy)}</td>
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
