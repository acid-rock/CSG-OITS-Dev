import { fileTableConfig } from './dashboardExample';
import './dashboard.css';
import { useState } from 'react';
import Barcharts from '../../components/charts/bar-chart/Barchart';
import Linechart from '../../components/charts/line-chart/Linechart';

const Dashboard = () => {
  const [active, setActive] = useState<string[]>([]);

  const handleActive = (fileName: string) => {
    setActive((prev) =>
      prev.includes(fileName)
        ? prev.filter((name) => name !== fileName)
        : [...prev, fileName]
    );
  };

  return (
    <div className='dashboard-container'>
      <div className='dashboard-header'>
        <span>Dashboard</span>
        <p>
          {new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </p>
      </div>
      <div className='dashboard-content'>
        {/*graph div*/}
        <div className='graph-container'>
          <Barcharts />
          <Linechart />
        </div>

        {/* Stats & Pending Banner */}
        <div className='dashboard-summary-bar'>
          {/* Pending Requests Banner */}
          <div className='pending-requests-banner'>
            <div className='pending-icon'>
              <svg
                width='20'
                height='20'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
              >
                <path d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' />
                <polyline points='14 2 14 8 20 8' />
                <line x1='12' y1='18' x2='12' y2='12' />
                <line x1='9' y1='15' x2='15' y2='15' />
              </svg>
            </div>
            <div className='pending-text'>
              <span className='pending-label'>Pending Requests</span>
              <span className='pending-value'>
                3 New Documents Awaiting Approval
              </span>
            </div>
            <span className='pending-badge'>3</span>
          </div>

          {/* Quick Stats */}
          <div className='quick-stats'>
            <div className='stat-card'>
              <div className='stat-icon stat-icon--officers'>
                <svg
                  width='18'
                  height='18'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                >
                  <path d='M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2' />
                  <circle cx='9' cy='7' r='4' />
                  <path d='M23 21v-2a4 4 0 0 0-3-3.87' />
                  <path d='M16 3.13a4 4 0 0 1 0 7.75' />
                </svg>
              </div>
              <div className='stat-info'>
                <span className='stat-number'>15</span>
                <span className='stat-label'>Total Officers</span>
              </div>
            </div>

            <div className='stat-card'>
              <div className='stat-icon stat-icon--docs'>
                <svg
                  width='18'
                  height='18'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                >
                  <polyline points='16 16 12 12 8 16' />
                  <line x1='12' y1='12' x2='12' y2='21' />
                  <path d='M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3' />
                </svg>
              </div>
              <div className='stat-info'>
                <span className='stat-number'>8</span>
                <span className='stat-label'>Documents Uploaded this Week</span>
              </div>
            </div>
          </div>
        </div>

        {/*file table div*/}
        <div className='dashboard-file-table'>
          <span>Recent Activity</span>
          <table>
            <thead>
              <tr className='table-header-black'>
                <th>Action</th>
                <th>File Name</th>
                <th>Description</th>
                <th>Size</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {fileTableConfig.map((file, idx) => (
                <tr
                  key={idx}
                  onClick={() => handleActive(file.fileName)}
                  className={`table-row ${active.includes(file.fileName) ? 'active' : ''}`}
                >
                  <td>{file.action}</td>
                  <td>{file.fileName}</td>
                  <td>{file.description}</td>
                  <td>{file.size}</td>
                  <td>{file.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
