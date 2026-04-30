import { Chart } from 'chart.js/auto';
import { useEffect, useRef } from 'react';
import './pierchart.css';

const storageData = [
  { category: 'Documents', storage: 45 },
  { category: 'Events', storage: 30 },
  { category: 'Bulletin', storage: 25 },
];

const Piechart = () => {
  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    chartInstanceRef.current = new Chart(chartRef.current, {
      type: 'pie',
      data: {
        labels: storageData.map((d) => d.category),
        datasets: [
          {
            label: 'Storage Allocation (%)',
            data: storageData.map((d) => d.storage),
            backgroundColor: [
              'rgba(59, 130, 246, 0.85)',
              'rgba(37, 99, 235, 0.85)',
              'rgba(147, 197, 253, 0.85)',
            ],
            borderColor: '#ffffff',
            borderWidth: 3,
          },
        ],
      },
      options: {
        plugins: {
          legend: {
            display: true,
            labels: {
              color: '#475569',
              font: { size: 12 },
              padding: 16,
            },
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
  }, []);

  return (
    <div className='pie-chart-container'>
      <div className='pie-chart-details'>
        <span>Memory Storage Allocation</span>
      </div>
      <div className='canvas-pie-container'>
        <canvas id='pie-chart' ref={chartRef}></canvas>
      </div>
    </div>
  );
};

export default Piechart;
