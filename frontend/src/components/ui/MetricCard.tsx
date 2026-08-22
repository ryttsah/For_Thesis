import type { ReactNode } from "react";

type MetricTone = "green" | "orange" | "red" | "blue";

const ICON_TONES: Record<MetricTone, string> = {
  green: "bg-pca-green-light text-pca-green",
  orange: "bg-orange-50 text-orange-600",
  red: "bg-pca-red-light text-pca-red",
  blue: "bg-blue-50 text-blue-600",
};

export default function MetricCard({
  icon,
  value,
  label,
  tone = "green",
  trend,
}: {
  icon: ReactNode;
  value: string | number;
  label: string;
  tone?: MetricTone;
  trend?: ReactNode;
}) {
  return (
    <div className="rounded-[14px] border border-pca-border bg-white p-5 transition-all hover:border-[#d1d5db] hover:shadow-[0_4px_12px_rgba(0,0,0,0.04)]">
      <div className="mb-3 flex items-center justify-between">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${ICON_TONES[tone]}`}
        >
          {icon}
        </div>
        {trend}
      </div>
      <div className="text-[30px] font-bold tracking-tight text-pca-text">{value}</div>
      <div className="mt-1 text-[13px] font-medium text-pca-muted">{label}</div>
    </div>
  );
}
