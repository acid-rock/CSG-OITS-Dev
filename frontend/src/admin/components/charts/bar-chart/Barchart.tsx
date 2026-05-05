import { Chart } from 'chart.js/auto';
import './barchart.css';
import { useEffect, useRef, useState, useCallback } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL as string;

interface ChartDataset {
  label: string;
  data: number[];
  borderColor?: string;
  backgroundColor?: string;
}

interface BarchartProps {
  labels: string[];
  datasets: ChartDataset[];
}

const getLastSixMonths = () => {
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      label: d.toLocaleString('default', { month: 'short', year: '2-digit' }),
      year: d.getFullYear(),
      month: d.getMonth(),
    });
  }
  return months;
};

const Barcharts = ({ datasets }: BarchartProps) => {
  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<Chart | null>(null);
  const [monthLabels, setMonthLabels] = useState<string[]>([]);
  const [monthlyCounts, setMonthlyCounts] = useState<number[]>([]);
  const [thisMonth, setThisMonth] = useState(0);

  const fetchAndGroup = useCallback(async () => {
    try {
      const { data } = await axios.get<{ createdAt: string }[]>(`${API_URL}/documents/`);
      const slots = getLastSixMonths();
      const now = new Date();

      const counts = slots.map(slot =>
        data.filter(doc => {
          const d = new Date(doc.createdAt);
          return d.getFullYear() === slot.year && d.getMonth() === slot.month;
        }).length,
      );

      const currentMonthCount = data.filter(doc => {
        const d = new Date(doc.createdAt);
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      }).length;

      setMonthLabels(slots.map(s => s.label));
      setMonthlyCounts(counts);
      setThisMonth(currentMonthCount);
    } catch {
      const slots = getLastSixMonths();
      setMonthLabels(slots.map(s => s.label));
      setMonthlyCounts(Array(6).fill(0));
      setThisMonth(0);
    }
  }, []);

  useEffect(() => {
    fetchAndGroup();
  }, [fetchAndGroup]);

  useEffect(() => {
    if (!chartRef.current || !monthLabels.length) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const chartDatasets = datasets.length
      ? [{ ...datasets[0], data: monthlyCounts }]
      : [{
          label: 'Document Uploads',
          data: monthlyCounts,
          borderColor: 'rgb(51, 236, 236)',
          backgroundColor: 'rgba(17, 255, 255, 0.81)',
        }];

    chartInstanceRef.current = new Chart(chartRef.current, {
      type: 'bar',
      data: { labels: monthLabels, datasets: chartDatasets },
      options: {
        plugins: { legend: { display: false } },
      },
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [monthLabels, monthlyCounts, datasets]);

  return (
    <div className='bar-chart-container'>
      <div className='bar-chart-details'>
        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Document Uploads</span>
        <p>{thisMonth} this month</p>
      </div>
      <hr style={{ margin: '0 0 0.5rem', border: 'none', borderTop: '1px solid #e5e7eb' }} />
      <div className='canvas-bar-container'>
        <canvas ref={chartRef}></canvas>
      </div>
    </div>
  );
};

export default Barcharts;
