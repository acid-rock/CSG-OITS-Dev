import "./dashboard.css";
import { useState, useEffect, useCallback } from "react";
import Barcharts from "../../components/charts/bar-chart/Barchart";
import Linechart from "../../components/charts/line-chart/Linechart";
import PieChart from "../../components/charts/pie-chart/PieChart";
import axios from "axios";
import { useNavigate } from "react-router-dom";

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
  uuid ? uuid.substring(0, 8) + "…" : "—";

// Returns the ISO week number for a given date
function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

const Dashboard = () => {
  const navigate = useNavigate();

  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [recentLogs, setRecentLogs] = useState<AuditEntry[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [logsError, setLogsError] = useState(false);

  // Real weekly upload counts from documents API
  const [weeklyUploads, setWeeklyUploads] = useState<{ label: string; count: number }[]>([]);
  const [weeklyDataFallback, setWeeklyDataFallback] = useState(false);
  const [activeOfficerCount, setActiveOfficerCount] = useState<number | null>(null);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const { data } = await axios.get(`${API_URL}/dashboard/summary`, {
        withCredentials: true,
      });
      setAnalytics({
        total_officers: data.officers?.active ?? 0,
        total_documents: data.documents?.active ?? 0,
        documents_this_week: 0,
        total_announcements: data.announcements?.active ?? 0,
        total_events: data.events?.active ?? 0,
        uploads_by_month: [],
        views_by_week: [],
      });
      setActiveOfficerCount(data.officers?.active ?? 0);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to load dashboard data.";
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

  const fetchWeeklyUploads = useCallback(async () => {
    try {
      const { data } = await axios.get<{ createdAt: string }[]>(`${API_URL}/documents/`, {
        withCredentials: true,
      });
      // Build last-8-weeks buckets
      const now = new Date();
      const weeks: { label: string; count: number; weekStart: Date }[] = [];
      for (let i = 7; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i * 7);
        weeks.push({ label: `Wk ${getISOWeek(d)}`, count: 0, weekStart: d });
      }
      data.forEach((doc) => {
        const created = new Date(doc.createdAt);
        const wk = getISOWeek(created);
        const yr = created.getFullYear();
        const match = weeks.find(
          (w) => getISOWeek(w.weekStart) === wk && w.weekStart.getFullYear() === yr,
        );
        if (match) match.count++;
      });
      setWeeklyUploads(weeks.map((w) => ({ label: w.label, count: w.count })));
      setWeeklyDataFallback(false);
    } catch {
      setWeeklyDataFallback(true);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
    fetchRecentLogs();
    fetchWeeklyUploads();
  }, [fetchSummary, fetchRecentLogs, fetchWeeklyUploads]);

  // Bar chart — Document Uploads by week (real data)
  const barLabels = weeklyUploads.length
    ? weeklyUploads.map((w) => w.label)
    : (analytics?.uploads_by_month.map((m) => m.month) ?? []);
  const barDatasets = weeklyUploads.length
    ? [
        {
          label: "Document Uploads",
          data: weeklyUploads.map((w) => w.count),
          borderColor: "rgb(51, 236, 236)",
          backgroundColor: "rgba(17, 255, 255, 0.81)",
        },
      ]
    : analytics
    ? [
        {
          label: "Documents",
          data: analytics.uploads_by_month.map((m) => m.documents),
          borderColor: "rgb(51, 236, 236)",
          backgroundColor: "rgba(17, 255, 255, 0.81)",
        },
      ]
    : [];

  // Line chart — flat zeros (view tracking not yet implemented)
  const placeholderWeeks = Array.from({ length: 8 }, (_, i) => `Wk ${i + 1}`);
  const lineLabels = placeholderWeeks;
  const lineDatasets = [
    {
      label: "Document Views",
      data: Array(8).fill(0),
      borderColor: "rgba(171, 203, 233, 1)",
      fill: true,
      tension: 0.4,
    },
  ];

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <span>Dashboard</span>
        <p>
          {new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </p>
      </div>

      {fetchError && (
        <p style={{ padding: "0.5rem 1rem", color: "red" }}>{fetchError}</p>
      )}

      <div className="dashboard-content">
        {/* Charts — Bar (uploads) | Line (views placeholder) | Pie (storage) */}
        <div
          className="graph-container"
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.5rem", width: "100%", alignItems: "start" }}
        >
          {loading ? (
            <p style={{ padding: "1rem", gridColumn: "1/-1" }}>Loading charts...</p>
          ) : (
            <>
              <div style={{ minHeight: "360px", display: "flex", flexDirection: "column", justifyContent: "flex-start" }}>
                <Barcharts labels={barLabels} datasets={barDatasets} />
                {weeklyDataFallback && (
                  <p style={{ fontSize: "0.75rem", color: "#f59e0b", textAlign: "center", marginTop: "0.25rem" }}>
                    ⚠ Using sample data
                  </p>
                )}
              </div>
              <div style={{ minHeight: "360px", display: "flex", flexDirection: "column", justifyContent: "flex-start" }}>
                <Linechart labels={lineLabels} datasets={lineDatasets} />
                <p style={{ fontSize: "0.75rem", color: "#9ca3af", textAlign: "center", marginTop: "0.25rem" }}>
                  View tracking coming soon
                </p>
              </div>
              <div style={{ minHeight: "360px", display: "flex", flexDirection: "column", justifyContent: "flex-start" }}>
                <PieChart />
              </div>
            </>
          )}
        </div>

        {/* Stats & Pending Banner */}
        <div className="dashboard-summary-bar">
          <div className="pending-requests-banner">
            <div className="pending-icon">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="12" y1="18" x2="12" y2="12" />
                <line x1="9" y1="15" x2="15" y2="15" />
              </svg>
            </div>
            <div className="pending-text">
              <span className="pending-label">Total Content</span>
              <span className="pending-value">
                {loading
                  ? "—"
                  : `${analytics?.total_documents ?? 0} Documents · ${analytics?.total_announcements ?? 0} Announcements · ${analytics?.total_events ?? 0} Events`}
              </span>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="quick-stats">
            <div className="stat-card">
              <div className="stat-icon stat-icon--officers">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div className="stat-info">
                <span className="stat-number">
                  {loading ? "—" : (activeOfficerCount ?? analytics?.total_officers ?? 0)}
                </span>
                <span className="stat-label">Total Officers</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon stat-icon--docs">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="16 16 12 12 8 16" />
                  <line x1="12" y1="12" x2="12" y2="21" />
                  <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
                </svg>
              </div>
              <div className="stat-info">
                <span className="stat-number">
                  {loading ? "—" : (analytics?.documents_this_week ?? 0)}
                </span>
                <span className="stat-label">Documents Uploaded this Week</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="dashboard-file-table">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "1rem",
            }}
          >
            <span style={{ fontSize: "16px" }}>Recent Activity</span>
            <button
              onClick={() => navigate("/admin?panel=auditlog")}
              style={{
                background: "none",
                border: "1px solid #3b82f6",
                color: "#3b82f6",
                borderRadius: "6px",
                padding: "0.35rem 0.85rem",
                fontSize: "0.8rem",
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              View All Logs
            </button>
          </div>

          {logsLoading ? (
            <p
              style={{
                fontSize: "0.85rem",
                color: "#9ca3af",
                padding: "0.5rem 0",
              }}
            >
              Loading...
            </p>
          ) : logsError ? (
            <p
              style={{
                fontSize: "0.85rem",
                color: "#9ca3af",
                padding: "0.5rem 0",
              }}
            >
              Could not load recent activity.
            </p>
          ) : (
            <table>
              <thead>
                <tr className="table-header-black">
                  <th>Time</th>
                  <th>Action</th>
                  <th>Table</th>
                  <th>Admin ID</th>
                </tr>
              </thead>
              <tbody>
                {recentLogs.map((entry, idx) => (
                  <tr key={idx} className="table-row">
                    <td
                      style={{
                        whiteSpace: "nowrap",
                        color: "#6b7280",
                        fontSize: "0.85rem",
                      }}
                    >
                      {entry.created_at ? timeAgo(entry.created_at) : "—"}
                    </td>
                    <td>
                      <span
                        style={{
                          fontWeight: 600,
                          fontSize: "0.8rem",
                          color:
                            entry.action === "DELETE"
                              ? "#dc2626"
                              : entry.action === "INSERT"
                                ? "#16a34a"
                                : "#2563eb",
                        }}
                      >
                        {entry.action ?? "—"}
                      </span>
                    </td>
                    <td style={{ fontSize: "0.85rem" }}>
                      {entry.entity ?? "—"}
                    </td>
                    <td
                      style={{ fontSize: "0.8rem", color: "#9ca3af" }}
                      title={entry.created_by}
                    >
                      {shortId(entry.created_by)}
                    </td>
                  </tr>
                ))}
                {recentLogs.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      style={{
                        textAlign: "center",
                        color: "#9ca3af",
                        fontSize: "0.85rem",
                        padding: "1rem",
                      }}
                    >
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
