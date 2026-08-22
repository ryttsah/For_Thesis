import { Bar } from "react-chartjs-2";
import "../charts/chartSetup";

interface StackedTrendChartProps {
  labels?: string[];
  healthy?: number[];
  yellowing?: number[];
  scale?: number[];
  beetle?: number[];
  height?: number;
}

export default function StackedTrendChart({
  labels = ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr"],
  healthy = [58, 61, 63, 60, 64, 62],
  yellowing = [20, 18, 17, 19, 16, 18],
  scale = [12, 11, 10, 12, 11, 11],
  beetle = [6, 6, 7, 5, 5, 5],
  height = 200,
}: StackedTrendChartProps) {
  return (
    <div style={{ height }}>
      <Bar
        data={{
          labels,
          datasets: [
            { label: "Healthy", data: healthy, backgroundColor: "#22a355", borderRadius: 4 },
            { label: "Yellowing", data: yellowing, backgroundColor: "#f59e0b", borderRadius: 4 },
            { label: "Scale Insect", data: scale, backgroundColor: "#e53935", borderRadius: 4 },
            { label: "Rhino Beetle", data: beetle, backgroundColor: "#7c3aed", borderRadius: 4 },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              mode: "index",
              intersect: false,
              callbacks: {
                label: (ctx) => {
                  const value = ctx.parsed.y;
                  if (value == null) return ctx.dataset.label ?? "";
                  return `${ctx.dataset.label}: ${value}%`;
                },
              },
            },
          },
          scales: {
            x: { stacked: true, grid: { display: false }, ticks: { font: { size: 11 }, color: "#9ca3af" } },
            y: {
              stacked: true,
              max: 100,
              ticks: { callback: (v) => `${v}%`, color: "#9ca3af", font: { size: 11 } },
              grid: { color: "rgba(0,0,0,0.03)" },
            },
          },
        }}
      />
    </div>
  );
}
