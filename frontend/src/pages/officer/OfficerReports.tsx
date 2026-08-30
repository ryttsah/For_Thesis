import { IconDownload, IconFileAnalytics, IconFileText } from "@tabler/icons-react";
import { useMemo, useState } from "react";
import { useDemoStore } from "../../context/DemoStoreContext";
import { filterByBrgy, useOfficerScope } from "../../hooks/useOfficerScope";
import { Card, CardHead } from "../../components/ui/Card";
import { downloadMonthlyReport, type ReportType } from "../../services/reports";

const OFFICER_REPORT_TYPES: Record<string, ReportType> = {
  monthly: "monthly",
  pest: "high-risk",
  survey: "monthly",
};

export default function OfficerReports() {
  const { surveys, queue } = useDemoStore();
  const { assignedBrgy } = useOfficerScope();
  const [reportType, setReportType] = useState("monthly");
  const [reportMonth, setReportMonth] = useState("2026-08");
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportError, setReportError] = useState("");

  const monthly = useMemo(() => {
    const scoped = filterByBrgy(surveys, assignedBrgy);
    return scoped.map((s) => ({
      title: `${s.farm} — ${s.aiResult}`,
      sub: `${s.date} · ${s.brgy} · ${s.status}`,
      tone: s.status === "pending" ? "blue" as const : "green" as const,
    }));
  }, [surveys, assignedBrgy]);

  const incidents = useMemo(() => {
    const scoped = filterByBrgy(
      queue.filter((q) => !q.validated),
      assignedBrgy,
    );
    return scoped.map((q) => ({
      title: q.title,
      sub: `${q.sub} · confidence ${q.conf}`,
    }));
  }, [queue, assignedBrgy]);

  return (
    <div className="animate-fade-in">
      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHead title="Monthly Reports" icon={<IconFileAnalytics size={16} />} />
          <div className="flex flex-col gap-2.5">
            {monthly.length === 0 ? (
              <p className="py-6 text-center text-sm text-pca-muted">No survey records in your scope yet.</p>
            ) : (
              monthly.map((r) => (
              <div key={r.title} className="flex items-center gap-3 rounded-xl border border-pca-border p-3.5 hover:bg-pca-bg">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${r.tone === "green" ? "bg-pca-green-light text-pca-green" : "bg-blue-50 text-blue-600"}`}>
                  <IconFileText size={22} />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold">{r.title}</div>
                  <span className="text-xs text-pca-muted">{r.sub}</span>
                </div>
                <button type="button" onClick={() => alert("Download — demo")} className="rounded-[10px] border border-pca-border p-2">
                  <IconDownload size={16} />
                </button>
              </div>
              ))
            )}
          </div>
        </Card>
        <Card>
          <CardHead
            title="Incident Reports"
            icon={<IconFileText size={16} />}
          />
          <p className="mb-3 text-xs text-pca-muted">
            Pending validation queue items in your barangay (pest / low-confidence CNN results).
          </p>
          <div className="flex flex-col gap-2.5">
            {incidents.length === 0 ? (
              <p className="py-6 text-center text-sm text-pca-muted">No open incidents in your scope.</p>
            ) : (
              incidents.map((r) => (
              <div key={r.title} className="flex items-center gap-3 rounded-xl border border-pca-border p-3.5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-pca-red-light text-pca-red">
                  <IconFileText size={22} />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold">{r.title}</div>
                  <span className="text-xs text-pca-muted">{r.sub}</span>
                </div>
              </div>
              ))
            )}
          </div>
        </Card>
      </div>
      <Card>
        <CardHead title="Generate Custom Report" icon={<IconFileAnalytics size={16} />} />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-semibold">Report type</label>
            <select value={reportType} onChange={(e) => setReportType(e.target.value)} className="w-full rounded-lg border border-pca-border px-3 py-2 text-sm">
              <option value="monthly">Monthly summary</option>
              <option value="pest">Pest outbreak</option>
              <option value="survey">Survey log</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold">Sector</label>
            <select className="w-full rounded-lg border border-pca-border px-3 py-2 text-sm">
              <option>All sectors</option>
              <option>A</option><option>B</option><option>C</option><option>D</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold">Date range</label>
            <input type="month" value={reportMonth} onChange={(e) => setReportMonth(e.target.value)} className="w-full rounded-lg border border-pca-border px-3 py-2 text-sm" />
          </div>
        </div>
        <button
          type="button"
          disabled={isGenerating}
          onClick={async () => {
            setIsGenerating(true);
            setReportError("");
            const result = await downloadMonthlyReport(reportMonth, OFFICER_REPORT_TYPES[reportType] ?? "monthly");
            if (!result.success) setReportError(result.message);
            setIsGenerating(false);
          }}
          className="mt-4 rounded-[10px] bg-pca-green px-4 py-2.5 text-sm font-semibold text-white hover:bg-pca-green-hover disabled:opacity-50"
        >
          {isGenerating ? "Generating..." : "Generate report"}
        </button>
        <p className="mt-2 text-xs text-pca-muted">
          Pest outbreak uses the high-risk report format. Survey log uses the monthly report format scoped to your assigned barangay.
        </p>
        {reportError && <p className="mt-2 text-sm font-semibold text-pca-red">{reportError}</p>}
      </Card>
    </div>
  );
}
