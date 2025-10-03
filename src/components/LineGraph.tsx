import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  TimeSeriesScale
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  TimeSeriesScale,
  LineElement,
  PointElement,
  Tooltip,
  Legend
);

export type LineGraphPoint = { x: number; y: number };

type Props = {
  title?: string;
  points: LineGraphPoint[];
  unit?: string;
  reducedMotion?: boolean;
  maxPoints?: number;
};

export const LineGraph: React.FC<Props> = ({
  title = "Realtime",
  points,
  unit,
  reducedMotion = false,
  maxPoints = 200
}) => {
  const trimmed = points.slice(-maxPoints);
  const data = {
    labels: trimmed.map((p) => new Date(p.x).toLocaleTimeString()),
    datasets: [
      {
        label: unit ? `${title} (${unit})` : title,
        data: trimmed.map((p) => p.y),
        borderColor: "#38bdf8",
        backgroundColor: "rgba(56,189,248,0.2)",
        borderWidth: 2,
        pointRadius: 0
      }
    ]
  };
  const options = {
    responsive: true,
    animation: reducedMotion ? false : { duration: 300 },
    scales: {
      x: { ticks: { color: "#94a3b8" }, grid: { color: "#1f2937" } },
      y: { ticks: { color: "#94a3b8" }, grid: { color: "#1f2937" } }
    },
    plugins: {
      legend: { labels: { color: "#cbd5e1" } },
      tooltip: { enabled: true }
    }
  } as const;

  return (
    <div className="card p-4 w-full h-full">
      <div className="mb-2 text-sm text-slate-300">{title}</div>
      <Line data={data} options={options} />
    </div>
  );
};
