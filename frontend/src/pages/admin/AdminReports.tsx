import { IconDownload, IconFileExport } from "@tabler/icons-react";
import { Card, CardHead } from "../../components/ui/Card";

export default function AdminReports() {
  return (
    <div className="animate-fade-in">
      <Card>
        <CardHead title="Province Reports" icon={<IconFileExport size={16} />} />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {[
            "Monthly coconut health summary",
            "Officer performance report",
            "Farmer registration audit",
            "High-risk farm export",
          ].map((title) => (
            <div
              key={title}
              className="flex items-center justify-between rounded-xl border border-pca-border p-4 hover:bg-pca-bg"
            >
              <span className="text-sm font-semibold">{title}</span>
              <button
                type="button"
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
