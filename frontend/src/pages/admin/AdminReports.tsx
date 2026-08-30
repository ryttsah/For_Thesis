import { IconDownload, IconFileExport } from "@tabler/icons-react";
import { useState } from "react";
import { Card, CardHead } from "../../components/ui/Card";
import { downloadMonthlyReport, type ReportType } from "../../services/reports";

const REPORT_CARDS: { title: string; type: ReportType }[] = [
  { title: "Monthly coconut health summary", type: "monthly" },
  { title: "Officer performance report", type: "officer-performance" },
  { title: "Farmer registration audit", type: "farmer-audit" },
  { title: "High-risk farm export", type: "high-risk" },
];

export default function AdminReports() {
  const [month, setMonth] = useState("2026-08");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");

  async function generateReport(type: ReportType = "monthly") {
    setIsGenerating(true);
    setError("");
    const result = await downloadMonthlyReport(month, type);
    if (!result.success) setError(result.message);
    setIsGenerating(false);
  }

  return (
    <div className="animate-fade-in">
      <Card>
        <CardHead title="Province Reports" icon={<IconFileExport size={16} />} />
        <div className="mb-4 flex flex-col gap-3 rounded-xl border border-pca-border bg-pca-bg p-4 sm:flex-row sm:items-end">
          <div>
            <label className="mb-1 block text-xs font-semibold">Reporting month</label>
            <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="rounded-lg border border-pca-border px-3 py-2 text-sm" />
          </div>
          <button
            type="button"
            disabled={isGenerating}
            onClick={() => generateReport("monthly")}
            className="rounded-[10px] bg-pca-green px-4 py-2.5 text-sm font-semibold text-white hover:bg-pca-green-hover disabled:opacity-50"
          >
            {isGenerating ? "Generating..." : "Generate monthly PDF"}
          </button>
        </div>
        {error && <p className="mb-3 text-sm font-semibold text-pca-red">{error}</p>}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {REPORT_CARDS.map((report) => (
            <div
              key={report.type}
              className="flex items-center justify-between rounded-xl border border-pca-border p-4 hover:bg-pca-bg"
            >
              <span className="text-sm font-semibold">{report.title}</span>
              <button
                type="button"
                disabled={isGenerating}
                onClick={() => generateReport(report.type)}
                className="rounded-lg border border-pca-border p-2 text-pca-muted hover:bg-white"
              >
                <IconDownload size={16} />
              </button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
