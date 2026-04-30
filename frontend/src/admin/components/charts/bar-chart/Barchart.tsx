import { Chart } from 'chart.js/auto';
import './barchart.css';
import { useEffect, useRef } from 'react';

const monthsData = [
  { month: 'January', views: Math.floor(Math.random() * 100) },
  { month: 'February', views: Math.floor(Math.random() * 100) },
  { month: 'March', views: Math.floor(Math.random() * 100) },
  { month: 'April', views: Math.floor(Math.random() * 100) },
  { month: 'May', views: Math.floor(Math.random() * 100) },
];

const totalViews = monthsData.reduce((sum, d) => sum + d.views, 0);

const Barcharts = () => {
  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    chartInstanceRef.current = new Chart(chartRef.current, {
      type: 'bar',
      data: {
        labels: monthsData.map((d) => d.month),
        datasets: [
          {
            label: 'Views',
            data: monthsData.map((d) => d.views),
            borderColor: 'rgb(51, 236, 236)',
            backgroundColor: 'rgba(17, 255, 255, 0.81)',
          },
        ],
      },
      options: {
        plugins: {
          legend: { display: false },
        },
        scales: {
          x: {
            grid: { color: 'rgba(203, 213, 225, 0.4)' },
            ticks: { color: '#64748b', font: { size: 11 } },
          },
          y: {
            grid: { color: 'rgba(203, 213, 225, 0.4)' },
            ticks: { color: '#64748b', font: { size: 11 } },
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
    <div className='bar-chart-container'>
      <div className='bar-chart-details'>
        <span>Recent Visits</span>
        <p>{totalViews} Views</p>
      </div>
      <div className='canvas-bar-container'>
        <canvas id='bar-chart' ref={chartRef}></canvas>
      </div>
    </div>
  );
};

export default Barcharts;
