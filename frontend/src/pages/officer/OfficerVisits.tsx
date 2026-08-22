import { IconAlertCircle, IconCalendar, IconCalendarEvent, IconCheck, IconFlag, IconFlag2, IconPlus } from "@tabler/icons-react";
import { useMemo, useState } from "react";
import ScheduleVisitModal from "../../components/modals/ScheduleVisitModal";
import { useDemoStore } from "../../context/DemoStoreContext";
import { filterByBrgy, useOfficerScope } from "../../hooks/useOfficerScope";
import { isApiEnabled } from "../../services/api";
import { completePriorityVisitApi, fetchOfficerBootstrap } from "../../services/domain";
import MetricCard from "../../components/ui/MetricCard";
import { Card, CardHead, GhostButton } from "../../components/ui/Card";

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
  const { priorityVisits, scheduledVisits, completePriorityVisit, syncOfficerDomain } = useDemoStore();
  const { assignedBrgy } = useOfficerScope();
  const [scheduleOpen, setScheduleOpen] = useState(false);

  const scopedFlags = useMemo(
    () => filterByBrgy(priorityVisits.filter((v) => !v.completed), assignedBrgy),
    [priorityVisits, assignedBrgy],
  );
  const scopedVisits = useMemo(
    () => filterByBrgy(scheduledVisits, assignedBrgy),
    [scheduledVisits, assignedBrgy],
  );

  const urgent = scopedFlags.filter((f) => f.level === "urgent").length;
  const high = scopedFlags.filter((f) => f.level === "high").length;

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
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHead
          title="Scheduled Visit Calendar"
          icon={<IconCalendarEvent size={16} />}
          action={
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-600">
              {scopedVisits.length} visits
            </span>
          }
        />
        <p className="mb-3 text-xs text-pca-muted">
          Booked visits in your scope. Farmers receive in-system notifications when you schedule.
        </p>
        <div className="flex flex-col gap-2">
          {scopedVisits.map((v) => (
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
            </div>
          ))}
          {scopedVisits.length === 0 && (
            <p className="py-6 text-center text-sm text-pca-muted">No scheduled visits in this barangay yet.</p>
          )}
        </div>
      </Card>

      <ScheduleVisitModal open={scheduleOpen} onClose={() => setScheduleOpen(false)} />
    </div>
  );
}
