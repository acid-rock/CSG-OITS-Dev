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

const Linechart = ({ labels, datasets }: LinechartProps) => {
  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<Chart | null>(null);
  const lastValue = datasets[0]?.data.at(-1) ?? 0;

  useEffect(() => {
    if (!chartRef.current || !labels.length) return;

    chartInstanceRef.current = new Chart(chartRef.current, {
      type: 'line',
      data: { labels, datasets },
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
  }, [JSON.stringify(labels), JSON.stringify(datasets)]);

  return (
    <div className='line-chart-container'>
      <div className='line-chart-details'>
        <span>Activity by Week</span>
        <p>{lastValue} this week</p>
      </div>
      <div className='canvas-line-container'>
        <canvas id='line-chart' ref={chartRef}></canvas>
      </div>
    </div>
  );
};

export default Linechart;
