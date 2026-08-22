import { Line } from "react-chartjs-2";
import "../charts/chartSetup";

interface LineComparisonChartProps {
  labels?: string[];
  thisYear?: number[];
  lastYear?: number[];
  height?: number;
}

export default function LineComparisonChart({
  labels = ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr"],
  thisYear = [58, 61, 63, 60, 64, 62],
  lastYear = [52, 55, 58, 56, 59, 57],
  height = 280,
}: LineComparisonChartProps) {
  return (
    <div style={{ height }}>
      <Line
        data={{
          labels,
          datasets: [
            {
              label: "This Year",
              data: thisYear,
              borderColor: "#22a355",
              backgroundColor: "rgba(34,163,85,0.1)",
              tension: 0.4,
              fill: true,
            },
            {
              label: "Last Year",
              data: lastYear,
              borderColor: "#9ca3af",
              backgroundColor: "rgba(156,163,175,0.1)",
              tension: 0.4,
              fill: true,
              borderDash: [5, 5],
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: "bottom" } },
          scales: {
            y: { beginAtZero: true, max: 100, ticks: { callback: (v) => `${v}%` } },
          },
        }}
      />
    </div>
  );
}
