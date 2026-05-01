import './dashboard.css';
import { useState, useEffect, useCallback } from 'react';
import Barcharts from '../../components/charts/bar-chart/Barchart';
import Linechart from '../../components/charts/line-chart/Linechart';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

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

interface AuditEntry {
  id: string;
  action: string;
  entity: string;
  entity_id: string;
  created_by: string;
  ip_address: string;
  created_at: string;
}

const timeAgo = (iso: string): string => {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

const shortId = (uuid: string | null): string =>
  uuid ? uuid.substring(0, 8) + '…' : '—';

const Dashboard = () => {
  const navigate = useNavigate();

  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [recentLogs, setRecentLogs] = useState<AuditEntry[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [logsError, setLogsError] = useState(false);

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

  const fetchRecentLogs = useCallback(async () => {
    setLogsLoading(true);
    setLogsError(false);
    try {
      const { data } = await axios.get<AuditEntry[]>(
        `${API_URL}/auditlog/?limit=5`,
        { withCredentials: true },
      );
      setRecentLogs(data);
    } catch {
      setLogsError(true);
    } finally {
      setLogsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
    fetchRecentLogs();
  }, [fetchAnalytics, fetchRecentLogs]);

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

        {/* Recent Activity */}
        <div className='dashboard-file-table'>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span>Recent Activity</span>
            <button
              onClick={() => navigate('/admin?panel=auditlog')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', color: '#6b7280', textDecoration: 'underline' }}
            >
              View All Logs
            </button>
          </div>

          {logsLoading ? (
            <p style={{ fontSize: '0.85rem', color: '#9ca3af', padding: '0.5rem 0' }}>Loading...</p>
          ) : logsError ? (
            <p style={{ fontSize: '0.85rem', color: '#9ca3af', padding: '0.5rem 0' }}>Could not load recent activity.</p>
          ) : (
            <table>
              <thead>
                <tr className='table-header-black'>
                  <th>Time</th>
                  <th>Action</th>
                  <th>Table</th>
                  <th>Admin ID</th>
                </tr>
              </thead>
              <tbody>
                {recentLogs.map((entry, idx) => (
                  <tr key={idx} className='table-row'>
                    <td style={{ whiteSpace: 'nowrap', color: '#6b7280', fontSize: '0.85rem' }}>
                      {entry.created_at ? timeAgo(entry.created_at) : '—'}
                    </td>
                    <td>
                      <span
                        style={{
                          fontWeight: 600,
                          fontSize: '0.8rem',
                          color:
                            entry.action === 'DELETE'
                              ? '#dc2626'
                              : entry.action === 'INSERT'
                                ? '#16a34a'
                                : '#2563eb',
                        }}
                      >
                        {entry.action ?? '—'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>{entry.entity ?? '—'}</td>
                    <td style={{ fontSize: '0.8rem', color: '#9ca3af' }} title={entry.created_by}>
                      {shortId(entry.created_by)}
                    </td>
                  </tr>
                ))}
                {recentLogs.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', color: '#9ca3af', fontSize: '0.85rem', padding: '1rem' }}>
                      No activity recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
