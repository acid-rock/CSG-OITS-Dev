import { Chart } from 'chart.js/auto';
import './barchart.css';
import { useEffect, useRef } from 'react';

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

const Barcharts = ({ labels, datasets }: BarchartProps) => {
  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const lastValue = datasets[0]?.data.at(-1) ?? 0;

  useEffect(() => {
    if (!chartRef.current || !labels.length) return;

    const chart = new Chart(chartRef.current, {
      type: 'bar',
      data: { labels, datasets },
      options: {
        plugins: {
          legend: { display: datasets.length > 1 },
        },
      },
    });

    return () => {
      chart.destroy();
    };
  // Stringify to avoid re-renders from new array references with same content
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(labels), JSON.stringify(datasets)]);

  return (
    <div className='bar-chart-container'>
      <div className='bar-chart-details'>
        <span>Uploads by Month</span>
        <p>{lastValue} this month</p>
      </div>
      <div className='canvas-bar-container'>
        <canvas id='bar-chart' ref={chartRef}></canvas>
      </div>
    </div>
  );
};

export default Barcharts;
