import { IconClipboardList, IconSearch } from "@tabler/icons-react";
import { useMemo, useState } from "react";
import { useDemoStore } from "../../context/DemoStoreContext";
import { Card, CardHead, Pagination } from "../../components/ui/Card";
import StatusBadge from "../../components/ui/StatusBadge";

export default function AdminSurveys() {
  const { surveys } = useDemoStore();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return surveys;
    return surveys.filter((s) =>
      `${s.date} ${s.farm} ${s.sector} ${s.brgy} ${s.aiResult} ${s.officer}`.toLowerCase().includes(q),
    );
  }, [surveys, query]);

  return (
    <div className="animate-fade-in">
      <Card className="mb-4">
        <CardHead title="All Surveys (Province-wide)" icon={<IconClipboardList size={16} />} />
        <div className="admin-survey-toolbar mb-4">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-pca-muted">Search</label>
          <div className="flex items-center gap-2.5 rounded-[10px] border-[1.5px] border-pca-border bg-pca-bg px-3.5 focus-within:border-pca-green focus-within:bg-white">
            <IconSearch size={18} className="text-pca-muted" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Farm, officer, barangay, date, AI result..."
              className="flex-1 border-none bg-transparent py-2.5 text-sm outline-none"
            />
          </div>
        </div>
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
              {filtered.map((s) => (
                <tr key={s.date + s.farm} className="border-b border-pca-border hover:bg-pca-bg">
                  <td className="px-4 py-3.5">{s.date}</td>
                  <td className="px-4 py-3.5">{s.farm}</td>
                  <td className="px-4 py-3.5">{s.sector}</td>
                  <td className="px-4 py-3.5">{s.brgy}</td>
                  <td className="px-4 py-3.5">{s.images}</td>
                  <td className="px-4 py-3.5">{s.aiResult}</td>
                  <td className="px-4 py-3.5">{s.officer}</td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={s.status === "review" ? "caution" : s.status} label={s.status === "healthy" ? "Validated" : s.status === "pending" ? "Pending" : "Review"} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <div className="flex justify-between">
        <span className="text-[13px] text-pca-muted">Showing {filtered.length} of 1,482 surveys this month</span>
        <Pagination />
      </div>
    </div>
  );
}
