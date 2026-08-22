import {
  IconAlertTriangle,
  IconArrowRight,
  IconBrain,
  IconChartBar,
  IconEye,
  IconInfoCircle,
  IconMapPin,
  IconPhotoCheck,
  IconPlant2,
} from "@tabler/icons-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { isApiEnabled } from "../../services/api";
import StackedTrendChart from "../../components/charts/StackedTrendChart";
import EmptyChartNote from "../../components/ui/EmptyChartNote";
import { fetchOfficerConditionTrend, type ConditionTrendData } from "../../services/analytics";
import { useDemoStore } from "../../context/DemoStoreContext";
import { filterByBrgy, useOfficerScope } from "../../hooks/useOfficerScope";
import { Card, CardHead } from "../../components/ui/Card";
import MetricCard from "../../components/ui/MetricCard";

export default function OfficerDashboard() {
  const { queue, farms, surveys, priorityVisits } = useDemoStore();
  const { assignedBrgy, isScoped, stats } = useOfficerScope();

  const scopedQueue = useMemo(() => filterByBrgy(queue.filter((q) => !q.validated), assignedBrgy), [queue, assignedBrgy]);
  const scopedFarms = useMemo(() => filterByBrgy(farms, assignedBrgy), [farms, assignedBrgy]);
  const scopedPriority = useMemo(
    () => filterByBrgy(priorityVisits.filter((v) => !v.completed), assignedBrgy),
    [priorityVisits, assignedBrgy],
  );
  const useLiveData = isApiEnabled();
  const [trend, setTrend] = useState<ConditionTrendData | null>(null);

  useEffect(() => {
    if (!useLiveData) return;
    void fetchOfficerConditionTrend().then(setTrend);
  }, [useLiveData, surveys.length, scopedQueue.length]);

  return (
    <div className="animate-fade-in">
      {isScoped && assignedBrgy && (
        <div className="mb-4 flex gap-2.5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-[13px] leading-relaxed text-blue-600">
          <IconInfoCircle size={18} className="mt-0.5 shrink-0" />
          <span>
            You are viewing data scoped to <strong>{assignedBrgy}</strong> only.
          </span>
        </div>
      )}

      <div className="mb-5 grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={<IconPlant2 size={20} />} value={stats?.farms ?? 0} label={isScoped ? "Farms in Your Barangay" : "Registered Farms"} />
        <MetricCard icon={<IconPhotoCheck size={20} />} tone="orange" value={surveys.length} label="Surveys on Record" />
        <MetricCard icon={<IconAlertTriangle size={20} />} tone="red" value={stats?.highRisk ?? 0} label="High-Risk Farms" />
        <MetricCard icon={<IconBrain size={20} />} value={scopedQueue.length} label="Pending Review" />
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHead title="Condition Trend — Last 6 Months" icon={<IconChartBar size={16} />} />
          {trend && trend.labels.length > 0 ? (
            <>
              <p className="mb-2 text-xs text-pca-muted">
                {trend.brgy
                  ? `Barangay scope: ${trend.brgy} (your assignment).`
                  : "Province-wide (assign yourself to a barangay to scope)."}
              </p>
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
                useLiveData
                  ? "No trend data yet for your scope. Validate farmer CNN submissions or add surveys."
                  : "Connect the API to load live trends."
              }
            />
          )}
        </Card>
        <Card>
          <CardHead title="Farms in Scope" icon={<IconMapPin size={16} />} action={<Link to="/officer/farms" className="text-xs font-semibold text-pca-green hover:underline">All farms <IconArrowRight size={11} className="inline" /></Link>} />
          <div className="flex flex-col gap-2">
            {scopedFarms.length === 0 ? (
              <p className="py-6 text-center text-sm text-pca-muted">No farms yet. Farms are added when admin approves farmer registration.</p>
            ) : (
              scopedFarms.slice(0, 5).map((f) => (
                <Link key={f.name} to="/officer/farms" className="flex items-center gap-3 rounded-xl border border-pca-border p-3.5 hover:bg-pca-bg">
                  <span className="h-2.5 w-2.5 rounded-full bg-pca-green" />
                  <div className="flex-1"><div className="text-sm font-semibold">{f.name}</div><span className="text-xs text-pca-muted">{f.brgy} · {f.sector}</span></div>
                  <span className="text-[13px] font-semibold capitalize text-pca-muted">{f.status}</span>
                </Link>
              ))
            )}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHead title="Review Queue" action={<Link to="/officer/queue" className="text-xs font-semibold text-pca-green">View all</Link>} />
          <div className="flex flex-col gap-2">
            {scopedQueue.length === 0 && (
              <p className="py-4 text-center text-sm text-pca-muted">No items in the review queue.</p>
            )}
            {scopedQueue.slice(0, 4).map((q) => (
              <div key={q.id} className="flex items-center gap-3 rounded-xl border border-pca-border p-3.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-pca-green-light text-pca-green"><IconPhotoCheck size={20} /></div>
                <div className="flex-1"><div className="text-sm font-semibold">{q.title}</div><span className="text-xs text-pca-muted">{q.sub}</span></div>
                <span className="rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-bold text-orange-600">{q.conf}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <CardHead title="Priority Visits" action={<Link to="/officer/visits" className="text-xs font-semibold text-pca-green">All visits</Link>} />
          <div className="flex flex-col gap-3">
            {scopedPriority.length === 0 ? (
              <p className="py-4 text-center text-sm text-pca-muted">No priority visits scheduled.</p>
            ) : (
              scopedPriority.slice(0, 3).map((v) => (
                <div key={v.id} className="flex gap-3 rounded-xl border border-pca-red-soft bg-pca-red-light p-4">
                  <IconAlertTriangle size={22} className="text-pca-red" />
                  <div className="flex-1"><strong className="text-sm">{v.farm}</strong><p className="text-[13px] text-pca-muted">{v.desc}</p></div>
                  <Link to="/officer/visits" className="rounded-lg border border-pca-green px-3 py-1.5 text-xs font-semibold text-pca-green"><IconEye size={14} className="inline" /> Review</Link>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
