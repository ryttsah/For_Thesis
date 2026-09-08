import { IconAlertCircle, IconCalendar, IconCalendarEvent, IconCheck, IconEye, IconFlag, IconFlag2, IconMessageStar, IconPlus, IconStar, IconX } from "@tabler/icons-react";
import { useEffect, useMemo, useState } from "react";
import AnalysisDetailsModal, { type AnalysisModalRecord } from "../../components/analysis/AnalysisDetailsModal";
import ScheduleVisitModal from "../../components/modals/ScheduleVisitModal";
import VisitOutcomeModal from "../../components/modals/VisitOutcomeModal";
import { useDemoStore } from "../../context/DemoStoreContext";
import { filterByBrgy, useOfficerScope } from "../../hooks/useOfficerScope";
import { isApiEnabled } from "../../services/api";
import { completePriorityVisitApi, fetchOfficerBootstrap, recordVisitOutcomeApi } from "../../services/domain";
import MetricCard from "../../components/ui/MetricCard";
import { Card, CardHead, GhostButton, Pagination } from "../../components/ui/Card";

const FLAG_STYLES = {
  urgent: "border-pca-red-soft bg-pca-red-light text-pca-red",
  high: "border-orange-200 bg-orange-50 text-orange-600",
  medium: "border-yellow-200 bg-yellow-50 text-amber-600",
};

const TAG_STYLES = {
  urgent: "bg-pca-red text-white",
  high: "bg-orange-600 text-white",
  medium: "bg-amber-500 text-white",
};

function ReviewStars({ rating, size = 18 }: { rating: number; size?: number }) {
  return <span className="inline-flex gap-0.5 text-amber-500">{[1, 2, 3, 4, 5].map((star) => <IconStar key={star} size={size} fill={star <= Math.round(rating) ? "currentColor" : "none"} className={star <= Math.round(rating) ? "" : "text-slate-200"} />)}</span>;
}

function formatVisitLine(date: string, slot: string) {
  const dateText = new Date(date + "T12:00:00").toLocaleDateString("en-PH", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const slotLabel = slot === "AM" ? "8:00 AM - 11:30 AM" : "1:00 PM - 4:30 PM";
  return `${dateText} | ${slotLabel}`;
}

export default function OfficerVisits() {
  const { priorityVisits, scheduledVisits, surveys, visitLogs, completePriorityVisit, syncOfficerDomain } = useDemoStore();
  const { assignedBrgy, officerId } = useOfficerScope();
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [selectedPriorityId, setSelectedPriorityId] = useState<string | null>(null);
  const [outcomeVisitId, setOutcomeVisitId] = useState<string | null>(null);
  const [visitPage, setVisitPage] = useState(1);
  const [loggedOpen, setLoggedOpen] = useState(false);

  useEffect(() => {
    if (!isApiEnabled()) return;
    void fetchOfficerBootstrap().then((data) => {
      if (data) syncOfficerDomain(data);
    });
  }, [syncOfficerDomain]);

  const surveyForPriority = (farm: string) => {
    const farmName = farm.replace(/\s+-\s+Sector\s+[A-D].*$/i, "").trim();
    return surveys.find((survey) => survey.farm === farmName || farm.includes(survey.farm));
  };
  const scopedFlags = useMemo(
    () => filterByBrgy(priorityVisits.filter((v) => !v.completed), assignedBrgy)
      .filter((visit) => {
        if (visit.desc.startsWith("Administrator performance feedback:")) return true;
        const details = surveyForPriority(visit.farm)?.details;
        return Boolean(details && (details.perPhoto?.length || details.breakdown?.length));
      }),
    [priorityVisits, assignedBrgy, surveys],
  );
  const scopedVisits = useMemo(
    () => filterByBrgy(scheduledVisits, assignedBrgy),
    [scheduledVisits, assignedBrgy],
  );

  const urgent = scopedFlags.filter((f) => f.level === "urgent").length;
  const high = scopedFlags.filter((f) => f.level === "high").length;
  const selectedPriority = scopedFlags.find((item) => item.id === selectedPriorityId) ?? null;
  const selectedPriorityFarm = selectedPriority?.farm.replace(/\s+-\s+Sector\s+[A-D].*$/i, "").trim();
  const selectedSurvey = selectedPriorityFarm
    ? surveys.find((s) => s.farm === selectedPriorityFarm || Boolean(selectedPriority?.farm.includes(s.farm)))
    : null;
  const outcomeVisit = scopedVisits.find((visit) => visit.id === outcomeVisitId) ?? null;
  const activeVisits = scopedVisits.filter((visit) => !visitLogs.some((log) => log.visitId === visit.id));
  const loggedVisits = scopedVisits.filter((visit) => visitLogs.some((log) => log.visitId === visit.id));
  const pagedVisits = activeVisits.slice((visitPage - 1) * 5, visitPage * 5);
  const officerFeedback = useMemo(
    () => visitLogs.filter((log) => log.officerId === officerId && (log.farmerConfirmed !== null || log.adminFeedback.trim().length > 0)),
    [visitLogs, officerId],
  );
  const farmerRatings = officerFeedback.filter((log) => log.farmerRating !== null);
  const averageRating = farmerRatings.length ? farmerRatings.reduce((sum, log) => sum + (log.farmerRating ?? 0), 0) / farmerRatings.length : 0;
  const ratingCounts = [5, 4, 3, 2, 1].map((star) => farmerRatings.filter((log) => log.farmerRating === star).length);
  const highestRatingCount = Math.max(...ratingCounts, 1);

  function openSchedule() {
    if (!assignedBrgy) {
      alert(
        "No brgy. is linked to your officer account. Admin must assign you under Officers (e.g. Brgy. Daga), then log out and sign in again.",
      );
      return;
    }
    setScheduleOpen(true);
  }

  async function handleComplete(id: string) {
    if (isApiEnabled()) {
      const ok = await completePriorityVisitApi(id);
      if (ok) {
        const data = await fetchOfficerBootstrap();
        if (data) syncOfficerDomain(data);
        return;
      }
    }
    completePriorityVisit(id);
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-4 grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={<IconAlertCircle size={20} />} tone="red" value={urgent} label="Urgent Visits" />
        <MetricCard icon={<IconFlag size={20} />} tone="orange" value={high} label="High Priority" />
        <MetricCard icon={<IconCalendar size={20} />} tone="blue" value={scopedVisits.length} label="Scheduled (scoped)" />
        <MetricCard icon={<IconCheck size={20} />} value={priorityVisits.filter((v) => v.completed).length} label="Completed" />
      </div>

      <Card className="mb-4">
        <CardHead
          title="Priority Visit List"
          icon={<IconFlag2 size={16} className="text-pca-red" />}
          action={
            <GhostButton onClick={openSchedule}>
              <IconPlus size={14} className="mr-1 inline" />
              Schedule Visit
            </GhostButton>
          }
        />
        <div className="flex flex-col gap-3">
          {scopedFlags.map((f) => (
            <div
              key={f.id}
              className={`flex flex-wrap items-start gap-3.5 rounded-xl border p-4 sm:flex-nowrap ${FLAG_STYLES[f.level]}`}
            >
              <IconAlertCircle size={22} className="mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <strong className="block text-sm">{f.farm}</strong>
                <p className="text-[13px] opacity-90">{f.desc}</p>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase ${TAG_STYLES[f.level]}`}>
                  {f.level}
                </span>
                <span className="text-xs opacity-80">Due: {f.due}</span>
                <span className="text-xs opacity-80">Assigned: {f.assigned}</span>
                <button
                  type="button"
                  onClick={() => void handleComplete(f.id)}
                  className="rounded-lg border-[1.5px] border-pca-green px-3.5 py-1.5 text-xs font-semibold text-pca-green hover:bg-pca-green-light"
                >
                  <IconCheck size={14} className="mr-1 inline" />
                  Complete
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPriorityId(f.id)}
                  className="rounded-lg border-[1.5px] border-pca-border bg-white/70 px-3.5 py-1.5 text-xs font-semibold text-pca-text hover:bg-white"
                >
                  <IconEye size={14} className="mr-1 inline" />
                  View
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHead
          title="Scheduled Visit Calendar"
          icon={<IconCalendarEvent size={16} />}
          action={<div className="flex items-center gap-2"><button type="button" onClick={() => setLoggedOpen(true)} className="rounded-lg border border-pca-green/20 bg-pca-green-light px-2.5 py-1 text-[11px] font-bold text-pca-green hover:underline">Logged Visits</button><span className="rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700">{activeVisits.length} active</span></div>}
        />
        <p className="mb-3 text-xs text-pca-muted">
          Booked visits in your scope. Farmers receive in-system notifications when you schedule.
        </p>
        <div className="flex flex-col gap-2">
          {pagedVisits.map((v) => (
            <div key={v.id} className="flex items-center gap-3 rounded-xl border border-pca-border p-3.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-blue-50 text-blue-600">
                <IconCalendar size={20} />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold">{v.farm}</div>
                <span className="text-xs text-pca-muted">
                  {v.owner} · {formatVisitLine(v.date, v.slot)} · {v.purpose}
                </span>
              </div>
              <div className="flex flex-wrap gap-2"><button type="button" onClick={() => setOutcomeVisitId(v.id)} className="rounded-lg border border-pca-green px-3 py-2 text-xs font-bold text-pca-green hover:bg-pca-green-light">Record outcome</button><button type="button" onClick={() => { const reason = window.prompt("Reason for rescheduling this visit:"); if (reason?.trim()) alert("Reschedule reason recorded. The farmer will be notified after the server update."); }} className="rounded-lg border border-blue-300 px-3 py-2 text-xs font-bold text-blue-700">Reschedule</button><button type="button" onClick={() => { const reason = window.prompt("Reason for cancelling this visit:"); if (reason?.trim()) alert("Cancellation reason recorded. The farmer will be notified after the server update."); }} className="rounded-lg border border-pca-red px-3 py-2 text-xs font-bold text-pca-red">Cancel</button></div>
            </div>
          ))}
          {activeVisits.length === 0 && (
            <p className="py-6 text-center text-sm text-pca-muted">No scheduled visits in this barangay yet.</p>
          )}
        </div>
        <div className="mt-4 flex justify-end"><Pagination page={visitPage} totalItems={activeVisits.length} pageSize={5} onPageChange={setVisitPage} /></div>
      </Card>

      <Card className="mt-4">
        <CardHead
          title="Ratings and Reviews"
          icon={<IconMessageStar size={16} />}
          action={<span className="text-xs font-semibold text-pca-muted">Verified farmer feedback</span>}
        />
        {farmerRatings.length === 0 ? <p className="rounded-xl border border-dashed border-pca-border bg-pca-bg p-6 text-center text-sm text-pca-muted">No farmer ratings or comments have been submitted for your visits yet.</p> : <><div className="grid gap-6 lg:grid-cols-[150px_1fr] lg:items-center"><div><div className="text-6xl font-medium text-pca-text">{averageRating.toFixed(1)}</div><div className="mt-2"><ReviewStars rating={averageRating} size={21} /></div><p className="mt-3 text-sm text-pca-muted">{farmerRatings.length} farmer review{farmerRatings.length === 1 ? "" : "s"}</p></div><div className="space-y-2">{[5, 4, 3, 2, 1].map((star, index) => <div key={star} className="flex items-center gap-3"><span className="w-3 text-sm text-pca-muted">{star}</span><div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-emerald-600" style={{ width: `${(ratingCounts[index] / highestRatingCount) * 100}%` }} /></div><span className="w-7 text-right text-xs text-pca-muted">{ratingCounts[index]}</span></div>)}</div></div><div className="mt-7 space-y-5">{farmerRatings.map((log) => <article key={log.id} className="border-t border-pca-border pt-5"><div className="flex flex-wrap items-start justify-between gap-3"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-pca-green text-sm font-bold text-white">F</span><div><p className="font-semibold text-pca-text">Farmer review · {log.farm}</p><p className="mt-1 text-xs text-pca-muted">{log.recordedAt}</p></div></div><ReviewStars rating={log.farmerRating ?? 0} size={17} /></div><p className="mt-3 text-sm leading-relaxed text-pca-text">{log.farmerComment || "The farmer confirmed the visit without a written comment."}</p>{log.farmerReport && <p className="mt-2 text-sm text-pca-red"><strong>Reported concern:</strong> {log.farmerReport}</p>}</article>)}</div></>}
      </Card>

      <ScheduleVisitModal open={scheduleOpen} onClose={() => setScheduleOpen(false)} />
      <VisitOutcomeModal open={Boolean(outcomeVisit)} farm={outcomeVisit?.farm ?? ""} onClose={() => setOutcomeVisitId(null)} onSave={async (value) => {
        if (!outcomeVisit) return;
        const result = await recordVisitOutcomeApi(outcomeVisit.id, value);
        if (!result.ok) throw new Error(result.message);
        const data = await fetchOfficerBootstrap();
        if (data) syncOfficerDomain(data);
      }} />
      {loggedOpen && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 p-4"><div className="max-h-[88vh] w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl"><div className="flex items-center justify-between border-b border-pca-border p-6"><div><p className="text-xs font-bold uppercase tracking-wide text-pca-muted">Officer records</p><h2 className="mt-1 text-xl font-bold">Logged Visits</h2><p className="mt-1 text-sm text-pca-muted">Completed and missed visits are kept here after an outcome is recorded.</p></div><button type="button" onClick={() => setLoggedOpen(false)} className="rounded-lg border border-pca-border p-2"><IconX size={20} /></button></div><div className="max-h-[70vh] space-y-4 overflow-y-auto p-6">{loggedVisits.map((visit) => { const log = visitLogs.find((item) => item.visitId === visit.id); if (!log) return null; return <article key={visit.id} className="rounded-xl border border-pca-border p-5"><div className="grid gap-3 sm:grid-cols-[1fr_auto]"><div><p className="font-semibold text-pca-text">{visit.farm}</p><p className="mt-1 text-xs text-pca-muted">{visit.owner} · {formatVisitLine(visit.date, visit.slot)}</p></div><span className={`h-fit w-fit shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${log.visited ? "bg-pca-green-light text-pca-green" : "bg-pca-red-light text-pca-red"}`}>{log.visited ? "Visit completed" : "Visit not completed"}</span></div><div className="mt-4 grid gap-3 sm:grid-cols-2"><div className="rounded-lg bg-pca-bg p-3"><p className="text-[11px] font-bold uppercase tracking-wide text-pca-muted">Visit purpose</p><p className="mt-1 text-sm text-pca-text">{visit.purpose}</p></div><div className="rounded-lg bg-pca-bg p-3"><p className="text-[11px] font-bold uppercase tracking-wide text-pca-muted">Recorded outcome</p><p className="mt-1 text-sm text-pca-text">{log.visited ? log.officerComment : log.notVisitedReason}</p></div></div>{log.farmerConfirmed !== null && <div className="mt-3 rounded-lg bg-pca-green-light p-3 text-sm text-pca-text"><strong>Farmer feedback{log.farmerRating ? ` · ${log.farmerRating}/5 stars` : ""}:</strong> {log.farmerComment || (log.farmerConfirmed ? "Visit confirmed without a written comment." : log.farmerReport || "The farmer reported that the visit was not completed.")}</div>}{log.adminFeedback && <div className="mt-3 rounded-lg bg-blue-50 p-3 text-sm text-blue-950"><strong>Administrator feedback{log.adminRating ? ` · ${log.adminRating}/5 stars` : ""}:</strong> {log.adminFeedback}</div>}</article>; })}{loggedVisits.length === 0 && <p className="py-8 text-center text-sm text-pca-muted">No logged visits yet.</p>}</div></div></div>}
      <AnalysisDetailsModal
        open={Boolean(selectedPriority)}
        record={
          selectedPriority
            ? ({
                title: selectedPriority.farm,
                date: selectedSurvey?.date ?? selectedPriority.due,
                farm: selectedPriorityFarm ?? selectedPriority.farm,
                sector: selectedSurvey?.sector?.trim().match(/^([A-D])/i)?.[1]?.toUpperCase(),
                brgy: selectedPriority.brgy,
                result: selectedSurvey?.aiResult ?? selectedPriority.desc,
                details: selectedSurvey?.details,
              } satisfies AnalysisModalRecord)
            : null
        }
        onClose={() => setSelectedPriorityId(null)}
      />
    </div>
  );
}
