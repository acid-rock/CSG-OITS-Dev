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

const Barcharts = () => {
  const chartRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    const chart = new Chart(chartRef.current, {
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
      },
    });

    return () => {
      chart.destroy();
    };
  }, []);

  return (
    <div className='bar-chart-container'>
      <div className='bar-chart-details'>
        <span>Recent Visits</span>
        <p>{monthsData[monthsData.length - 1].views} Views</p>
      </div>
      <div className='canvas-bar-container'>
        <canvas id='bar-chart' ref={chartRef}></canvas>
      </div>
    </div>
  );
};

export default Barcharts;
