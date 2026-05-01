import './dashboard.css';
import { useState, useEffect, useCallback } from 'react';
import Barcharts from '../../components/charts/bar-chart/Barchart';
import Linechart from '../../components/charts/line-chart/Linechart';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL as string;

interface MonthUpload {
  month: string;
  documents: number;
  announcements: number;
}

interface WeekViews {
  week: string;
  views: number;
}

interface AnalyticsData {
  total_officers: number;
  total_documents: number;
  documents_this_week: number;
  total_announcements: number;
  total_events: number;
  uploads_by_month: MonthUpload[];
  views_by_week: WeekViews[];
}

const Dashboard = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const { data } = await axios.get<AnalyticsData>(`${API_URL}/analytics`, {
        withCredentials: true,
      });
      setAnalytics(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load analytics.';
      setFetchError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const barLabels = analytics?.uploads_by_month.map((m) => m.month) ?? [];
  const barDatasets = analytics
    ? [
        {
          label: 'Documents',
          data: analytics.uploads_by_month.map((m) => m.documents),
          borderColor: 'rgb(51, 236, 236)',
          backgroundColor: 'rgba(17, 255, 255, 0.81)',
        },
        {
          label: 'Announcements',
          data: analytics.uploads_by_month.map((m) => m.announcements),
          borderColor: 'rgb(255, 160, 50)',
          backgroundColor: 'rgba(255, 160, 50, 0.6)',
        },
      ]
    : [];

  const lineLabels = analytics?.views_by_week.map((w) => w.week) ?? [];
  const lineDatasets = analytics
    ? [
        {
          label: 'Uploads',
          data: analytics.views_by_week.map((w) => w.views),
          borderColor: 'rgba(171, 203, 233, 1)',
          fill: true,
          tension: 0.4,
        },
      ]
    : [];

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

      {fetchError && (
        <p style={{ padding: '0.5rem 1rem', color: 'red' }}>{fetchError}</p>
      )}

      <div className='dashboard-content'>
        {/* Charts */}
        <div className='graph-container'>
          {loading ? (
            <p style={{ padding: '1rem' }}>Loading charts...</p>
          ) : (
            <>
              <Barcharts labels={barLabels} datasets={barDatasets} />
              <Linechart labels={lineLabels} datasets={lineDatasets} />
            </>
          )}
        </div>

        {/* Stats & Pending Banner */}
        <div className='dashboard-summary-bar'>
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
              <span className='pending-label'>Total Content</span>
              <span className='pending-value'>
                {loading
                  ? '—'
                  : `${analytics?.total_documents ?? 0} Documents · ${analytics?.total_announcements ?? 0} Announcements · ${analytics?.total_events ?? 0} Events`}
              </span>
            </div>
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
                <span className='stat-number'>
                  {loading ? '—' : analytics?.total_officers ?? 0}
                </span>
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
                <span className='stat-number'>
                  {loading ? '—' : analytics?.documents_this_week ?? 0}
                </span>
                <span className='stat-label'>Documents Uploaded this Week</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
