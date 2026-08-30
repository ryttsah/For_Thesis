import { Line } from "react-chartjs-2";
import "../charts/chartSetup";

interface ConditionLineChartProps {
  labels: string[];
  healthy: number[];
  yellowing: number[];
  scale: number[];
  beetle: number[];
  height?: number;
}

export default function ConditionLineChart({
  labels,
  healthy,
  yellowing,
  scale,
  beetle,
  height = 280,
}: ConditionLineChartProps) {
  return (
    <div style={{ height }}>
      <Line
        data={{
          labels,
          datasets: [
            { label: "Healthy", data: healthy, borderColor: "#22a355", backgroundColor: "#22a355", tension: 0.35 },
            { label: "Yellowing", data: yellowing, borderColor: "#f59e0b", backgroundColor: "#f59e0b", tension: 0.35 },
            { label: "Scale Insect", data: scale, borderColor: "#e53935", backgroundColor: "#e53935", tension: 0.35 },
            { label: "Rhino Beetle", data: beetle, borderColor: "#7c3aed", backgroundColor: "#7c3aed", tension: 0.35 },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          interaction: { intersect: false, mode: "index" },
          plugins: {
            legend: { position: "bottom", labels: { boxWidth: 10, boxHeight: 10, usePointStyle: true } },
            tooltip: {
              callbacks: {
                label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y}%`,
              },
            },
          },
          scales: {
            x: { grid: { display: false }, ticks: { color: "#6b7280", font: { size: 11 } } },
            y: {
              beginAtZero: true,
              max: 100,
              ticks: { callback: (value) => `${value}%`, color: "#6b7280", font: { size: 11 } },
              grid: { color: "rgba(0,0,0,0.05)" },
            },
          },
        }}
      />
    </div>
  );
}
