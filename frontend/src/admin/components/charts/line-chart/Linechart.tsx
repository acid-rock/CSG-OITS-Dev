import { Chart } from 'chart.js/auto';
import { useEffect, useRef } from 'react';
import './linechart.css';

interface ChartDataset {
  label: string;
  data: number[];
  borderColor?: string;
  backgroundColor?: string;
  fill?: boolean;
  tension?: number;
}

interface LinechartProps {
  labels: string[];
  datasets: ChartDataset[];
}

const getLastSixMonths = (): string[] => {
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(d.toLocaleString('default', { month: 'short', year: '2-digit' }));
  }
  return months;
};

const Linechart = ({ datasets }: LinechartProps) => {
  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<Chart | null>(null);

  const monthLabels = getLastSixMonths();
  const chartDatasets = datasets.length
    ? [{ ...datasets[0], data: Array(6).fill(0) }]
    : [];

  useEffect(() => {
    if (!chartRef.current) return;

    chartInstanceRef.current = new Chart(chartRef.current, {
      type: 'line',
      data: { labels: monthLabels, datasets: chartDatasets },
      options: {
        plugins: {
          legend: { display: false },
        },
        scales: {
          x: { ticks: { color: '#ffffff' } },
          y: { ticks: { color: '#ffffff' } },
        },
      },
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(datasets)]);

  return (
    <div className='line-chart-container'>
      <div className='line-chart-details'>
        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Document Views</span>
        <p>Coming soon</p>
      </div>
      <hr style={{ margin: '0 0 0.5rem', border: 'none', borderTop: '1px solid #e5e7eb' }} />
      <div className='canvas-line-container'>
        <canvas id='line-chart' ref={chartRef}></canvas>
      </div>
    </div>
  );
};

export default Linechart;
