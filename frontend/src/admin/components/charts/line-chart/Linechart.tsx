import { Chart } from 'chart.js/auto';
import { useEffect, useRef } from 'react';
import './linechart.css';

const monthsData = [
  { month: 'January', views: Math.floor(Math.random() * 100) },
  { month: 'February', views: Math.floor(Math.random() * 100) },
  { month: 'March', views: Math.floor(Math.random() * 100) },
  { month: 'April', views: Math.floor(Math.random() * 100) },
  { month: 'May', views: Math.floor(Math.random() * 100) },
];

const Linechart = () => {
  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    chartInstanceRef.current = new Chart(chartRef.current, {
      type: 'line',
      data: {
        labels: monthsData.map((d) => d.month),
        datasets: [
          {
            label: 'Views',
            data: monthsData.map((d) => d.views),
            borderColor: 'rgba(171, 203, 233, 1)',
            fill: true,
            tension: 0.4,
          },
        ],
      },
      options: {
        plugins: {
          legend: {
            display: false,
          },
        },
        scales: {
          x: {
            ticks: {
              color: '#ffffff',
            },
          },
          y: {
            ticks: {
              color: '#ffffff',
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
    <div className='line-chart-container'>
      <div className='line-chart-details'>
        <span>Document Views</span>
        <p>{monthsData[monthsData.length - 1].views} Views</p>
      </div>
      <div className='canvas-line-container'>
        <canvas id='line-chart' ref={chartRef}></canvas>
      </div>
    </div>
  );
};

export default Linechart;
