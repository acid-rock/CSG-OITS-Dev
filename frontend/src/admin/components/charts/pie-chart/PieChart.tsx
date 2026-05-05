import { Chart } from "chart.js/auto";
import { useEffect, useRef, useState, useCallback } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL as string;

interface BucketStat {
  name: string;
  size: number;
}

const SLICE_COLORS = [
  "rgba(59, 130, 246, 0.8)",   // blue
  "rgba(34, 197, 94, 0.8)",    // green
  "rgba(249, 115, 22, 0.8)",   // orange
  "rgba(168, 85, 247, 0.8)",   // purple
  "rgba(239, 68, 68, 0.8)",    // red
];

const PieChart = () => {
  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<Chart | null>(null);

  const [buckets, setBuckets] = useState<BucketStat[]>([]);
  const [unavailable, setUnavailable] = useState(false);

  const fetchStorage = useCallback(async () => {
    try {
      const { data } = await axios.get<BucketStat[] | { error: string }>(
        `${API_URL}/dashboard/storage`,
        { withCredentials: true },
      );
      console.log("[PIE CHART] Storage data received:", data);
      if ("error" in data) {
        setUnavailable(true);
      } else {
        setBuckets(data);
      }
    } catch {
      setUnavailable(true);
    }
  }, []);

  useEffect(() => {
    fetchStorage();
  }, [fetchStorage]);

  useEffect(() => {
    if (!chartRef.current || buckets.length === 0) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const labels = buckets.map(
      (b) => `${b.name} (${(b.size / 1024 / 1024).toFixed(1)} MB)`,
    );
    const values = buckets.map((b) => b.size);

    chartInstanceRef.current = new Chart(chartRef.current, {
      type: "doughnut",
      data: {
        labels,
        datasets: [
          {
            data: values,
            backgroundColor: SLICE_COLORS.slice(0, buckets.length),
            borderWidth: 2,
          },
        ],
      },
      options: {
        plugins: {
          legend: {
            position: "bottom",
            labels: { color: "#6b7280", font: { size: 11 } },
          },
        },
      },
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [buckets]);

  if (unavailable) {
    return (
      <div
        style={{
          background: "#f3f4f6",
          borderRadius: 12,
          padding: "2rem",
          textAlign: "center",
          color: "#9ca3af",
          fontSize: "0.875rem",
        }}
      >
        Storage data unavailable
      </div>
    );
  }

  const totalBytes = buckets.reduce((sum, b) => sum + b.size, 0);
  const totalMB = (totalBytes / (1024 * 1024)).toFixed(1);
  const limitMB = 1024;
  const percentUsed = ((totalBytes / (limitMB * 1024 * 1024)) * 100).toFixed(1);

  return (
    <div style={{ padding: "1rem" }}>
      <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>Database Storage</span>
      <div style={{ maxWidth: 300, margin: "1rem auto 0" }}>
        <canvas ref={chartRef} />
      </div>
      {buckets.length > 0 && (
        <div style={{ marginTop: "0.75rem", fontSize: "0.8rem", color: "#374151", textAlign: "center" }}>
          <strong>{totalMB} MB</strong> used of <strong>1 GB</strong> ({percentUsed}% full)
        </div>
      )}
    </div>
  );
};

export default PieChart;
