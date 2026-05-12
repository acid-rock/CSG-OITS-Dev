import { Chart } from "chart.js/auto";
import { useEffect, useRef, useState, useCallback } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL as string;
const LIMIT_MB = 1024;
const WARN_MB = 900;

interface BucketStat {
  name: string;
  size: number;
}

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

    const totalBytes = buckets.reduce((sum, b) => sum + b.size, 0);
    const totalMB = totalBytes / (1024 * 1024);
    const remainingMB = Math.max(0, LIMIT_MB - totalMB);
    const nearFull = totalMB >= WARN_MB;

    chartInstanceRef.current = new Chart(chartRef.current, {
      type: "doughnut",
      data: {
        labels: [
          `Used (${totalMB.toFixed(1)} MB)`,
          `Remaining (${remainingMB.toFixed(1)} MB)`,
        ],
        datasets: [
          {
            data: [totalMB, remainingMB],
            backgroundColor: [
              nearFull ? "rgba(220, 38, 38, 0.8)" : "rgba(249, 115, 22, 0.8)",
              "rgba(156, 163, 175, 0.4)",
            ],
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
  const totalMB = totalBytes / (1024 * 1024);
  const remainingMB = Math.max(0, LIMIT_MB - totalMB);
  const nearFull = totalMB >= WARN_MB;

  return (
    <div style={{ padding: "1rem" }}>
      <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>Database Storage</span>
      <div style={{ maxWidth: 300, margin: "1rem auto 0" }}>
        <canvas ref={chartRef} />
      </div>
      {buckets.length > 0 && (
        <div style={{ marginTop: "0.75rem", fontSize: "0.8rem", color: "#374151", textAlign: "center" }}>
          <strong>{totalMB.toFixed(1)} MB</strong> used ·{" "}
          <strong>{remainingMB.toFixed(1)} MB</strong> remaining of 1 GB
        </div>
      )}
      {nearFull && (
        <div style={{ marginTop: "0.5rem", fontSize: "0.78rem", color: "#dc2626", textAlign: "center", fontWeight: 600 }}>
          ⚠ Storage nearly full
        </div>
      )}
    </div>
  );
};

export default PieChart;
