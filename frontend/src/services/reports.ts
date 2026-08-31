import { getApiBase, getAuthHeaders, isApiEnabled } from "./api";

export type ReportType = "monthly" | "officer-performance" | "farmer-audit" | "high-risk";

function getDeviceReportTimestamp(): string {
  return `${new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Manila",
  }).format(new Date())} PHT`;
}

export async function downloadMonthlyReport(
  month?: string,
  type: ReportType = "monthly",
): Promise<{ success: true } | { success: false; message: string }> {
  if (!isApiEnabled()) {
    return { success: false, message: "Connect the API before generating reports." };
  }

  const params = new URLSearchParams({ type });
  if (month) params.set("month", month);
  params.set("generated_at", getDeviceReportTimestamp());
  try {
    const response = await fetch(`${getApiBase()}/reports/monthly.pdf?${params.toString()}`, {
      headers: getAuthHeaders(),
      cache: "no-store",
    });
    if (!response.ok) {
      return { success: false, message: "Could not generate the report. Check your login and try again." };
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `pca-${type}-report-${month || "current"}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    return { success: true };
  } catch {
    return { success: false, message: "Cannot reach the report server. Try again later." };
  }
}
