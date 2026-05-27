import '../_shared/admin-list.css';
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import PauseAccessModal from '../../components/modals/PauseAccessModal/PauseAccessModal';
import ChangelogModal from '../../components/modals/changelogModal/ChangelogModal';
import PasswordForm from '../../components/settings-form/password-form/PasswordForm';
import Sidebar from '../_shared/Sidebar';
import { PageHead } from '../_shared/chrome';
import { I } from '../_shared/icons';

const API_URL = import.meta.env.VITE_API_URL as string;

interface AdminAccount {
  id: string;
  owner_id: string;
  role: string;
  email: string | null;
}


const Settings = () => {
  const [adminAccounts, setAdminAccounts] = useState<AdminAccount[]>([]);
  const [adminLoading, setAdminLoading] = useState(true);
  const [adminError, setAdminError] = useState<string | null>(null);

  const [pauseModal, setPauseModal] = useState(false);
  const [isChangelogOpen, setIsChangelogOpen] = useState(false);
  const [pause, setPause] = useState(false);
  const [pauseSaving, setPauseSaving] = useState(false);

  const [activeTerm, setActiveTerm] = useState('');
  const [termSelect, setTermSelect] = useState('');
  const [termOptions, setTermOptions] = useState<string[]>([]);
  const [termSaving, setTermSaving] = useState(false);
  const [termSaved, setTermSaved] = useState(false);

  /* ── Current logged-in user (for Account Security label) ── */
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string | null } | null>(null);

  useEffect(() => {
    axios.get(`${API_URL}/settings/access_paused`, { withCredentials: true })
      .then(({ data }) => setPause(data.value === 'true'))
      .catch(() => {});
  }, []);

  useEffect(() => {
    axios.get(`${API_URL}/settings/term`, { withCredentials: true })
      .then(({ data }) => { setActiveTerm(data.value ?? ''); setTermSelect(data.value ?? ''); })
      .catch(() => {});
    axios.get(`${API_URL}/officers/terms`, { withCredentials: true })
      .then(({ data }) => setTermOptions(Array.isArray(data) ? data : []))
      .catch(() => setTermOptions([]));
  }, []);

  const handleSaveTerm = async () => {
    if (!termSelect.trim()) return;
    setTermSaving(true); setTermSaved(false);
    try {
      await axios.post(`${API_URL}/settings/term`, { value: termSelect.trim() }, { withCredentials: true });
      setActiveTerm(termSelect.trim());
      setTermSaved(true);
      setTimeout(() => setTermSaved(false), 2500);
    } catch { /* silently ignore */ }
    finally { setTermSaving(false); }
  };

  /* ── Fetch current user info ── */
  useEffect(() => {
    axios
      .get<{ name: string; email: string; role: string }>(
        `${API_URL}/user/me`,
        { withCredentials: true },
      )
      .then(({ data }) => {
        setCurrentUser({
          name:  data.name ?? 'Admin',
          email: data.email ?? null,
        });
      })
      .catch(() => {});
  }, []);

  const handlePauseConfirm = async () => {
    const next = !pause;
    setPauseSaving(true);
    try {
      await axios.post(`${API_URL}/settings/access_paused`, { value: String(next) }, { withCredentials: true });
      setPause(next);
    } catch { /* silently ignore */ }
    finally { setPauseSaving(false); }
  };

  const fetchAdminAccounts = useCallback(async () => {
    setAdminLoading(true); setAdminError(null);
    try {
      const { data } = await axios.get(`${API_URL}/user/list`, { withCredentials: true });
      setAdminAccounts(data);
    } catch (err: unknown) {
      setAdminError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Could not load accounts.',
      );
    } finally { setAdminLoading(false); }
  }, []);

  useEffect(() => { fetchAdminAccounts(); }, [fetchAdminAccounts]);

  const SectionHead = ({ icon, title }: { icon: React.ReactNode; title: string }) => (
    <div className="ads-head">
      <span className="ads-head-icon">{icon}</span>
      <span className="ads-head-title">{title}</span>
    </div>
  );

  return (
    <div className="ad-shell">
      <Sidebar active="settings" />
      <main className="ad-main">
        <PageHead
          title="Settings"
          subtitle="Manage the active term, access controls, admin accounts, and your password."
        />

        {/* ── General System Settings ── */}
        <div className="ad-card ads-section">
          <SectionHead icon={<I.settings width="17" height="17" />} title="General System Settings" />

          <div className="ads-sub">
            <div className="ads-label-row">
              <span className="ads-label">Administration Term</span>
              {activeTerm && (
                <span className="ads-active-tag">
                  <span className="ads-active-dot" />
                  {activeTerm} — active
                </span>
              )}
            </div>
            <p className="ads-hint">
              This term is used across all modules (Officers, Documents, etc.) as the default term year.
            </p>
            <div className="ads-row">
              <select className="ads-term-select" value={termSelect} onChange={e => setTermSelect(e.target.value)}>
                <option value="">Select a term year…</option>
                {/* Always include the current active term even if no officers are assigned to it yet */}
                {activeTerm && !termOptions.includes(activeTerm) && (
                  <option value={activeTerm}>{activeTerm} — current</option>
                )}
                {termOptions.map(t => (
                  <option key={t} value={t}>{t}{t === activeTerm ? ' — current' : ''}</option>
                ))}
              </select>
              <button
                className="ad-btn-primary"
                onClick={handleSaveTerm}
                disabled={termSaving || !termSelect.trim() || termSelect.trim() === activeTerm}
              >
                {termSaving ? 'Saving…' : 'Save'}
              </button>
              {termSaved && <span className="ads-saved">✓ Saved</span>}
            </div>
            {termOptions.length === 0 && (
              <p className="ads-no-data">
                No term years available. Assign <em>year_serving</em> to officers first.
              </p>
            )}
          </div>

          <div className="ads-pause-row">
            <div className="ads-pause-text">
              <p className="ads-pause-label">
                Pause access for students
                {pauseSaving && <span className="ads-saving">Saving…</span>}
              </p>
              <p className="ads-pause-sub">When enabled, the public site shows a maintenance message.</p>
            </div>
            <span className="ads-toggle" onClick={() => setPauseModal(true)}>
              <span className={`ads-toggle-track${pause ? ' is-on' : ''}`}>
                <span className="ads-toggle-thumb" />
              </span>
            </span>
          </div>
        </div>

        {/* ── Admin Accounts ── */}
        <div className="ad-card">
          <div className="ads-section" style={{ paddingBottom: 4 }}>
            <SectionHead icon={<I.users width="17" height="17" />} title="Admin Accounts" />
          </div>
          {adminLoading ? (
            <div className="ad-empty"><p>Loading accounts…</p></div>
          ) : adminError ? (
            <div style={{ padding: '12px 24px', fontSize: 13, color: 'var(--color-danger-text)' }}>{adminError}</div>
          ) : (
            <table className="ad-table">
              <thead><tr>
                <th>Email</th>
                <th style={{ width: 140 }}>Role</th>
                <th className="ad-th-right" style={{ width: 120 }}>Actions</th>
              </tr></thead>
              <tbody>
                {adminAccounts.length === 0 && (
                  <tr><td colSpan={3}><div className="ad-empty"><p>No admin accounts found.</p></div></td></tr>
                )}
                {adminAccounts.map(acct => (
                  <tr key={acct.id}>
                    <td><span style={{ fontSize: 13.5, color: 'var(--color-text-primary)' }}>{acct.email ?? '—'}</span></td>
                    <td><span className="ad-tag tone-neutral" style={{ fontSize: 11 }}>{acct.role}</span></td>
                    <td className="ad-actions">
                      <button
                        className="ad-icon-btn ad-icon-btn--danger"
                        style={{ width: 'auto', padding: '0 10px', fontSize: 12, fontWeight: 600 }}
                        onClick={() => console.warn('remove', acct.owner_id)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* ── Account Security ── */}
        <div className="ad-card ads-section">
          <SectionHead
            icon={<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z"/><path d="m9 12 2 2 4-4"/></svg>}
            title="Account Security"
          />
          <p className="ads-hint" style={{ marginBottom: 16 }}>
            Change your admin account password. You will remain logged in after saving.
          </p>

          {/* Account identity badge */}
          {currentUser && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 14px',
              background: 'var(--color-surface-deep, #eef1fb)',
              border: '1px solid var(--color-border, #e2e8f0)',
              borderRadius: 10,
              marginBottom: 18,
              maxWidth: 400,
            }}>
              <span style={{
                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                background: 'var(--gradient-deep, linear-gradient(160deg,#3b5fbc,#4f6fd1))',
                color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700,
              }}>
                {currentUser.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase() || 'A'}
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary, #0f1729)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {currentUser.name}
                </span>
                {currentUser.email && (
                  <span style={{ fontSize: 11.5, color: 'var(--color-text-muted, #6b7280)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {currentUser.email}
                  </span>
                )}
              </div>
              <span className="ad-tag tone-neutral" style={{ fontSize: 10.5, marginLeft: 'auto', flexShrink: 0 }}>
                Current account
              </span>
            </div>
          )}

          <PasswordForm />
        </div>

        {/* ── About ── */}
        <div className="ad-card ads-section">
          <SectionHead icon={<I.doc width="17" height="17" />} title="About" />
          <div className="ads-about">
            <div className="ads-about-meta">
              <span className="ads-about-version">Current Version: <strong>v1.3.0</strong> (Stable)</span>
              <span className="ads-about-date">Last Updated: May 22, 2026</span>
            </div>
            <button className="ad-btn-ghost" onClick={() => setIsChangelogOpen(true)}>
              View System Changelog
            </button>
          </div>
        </div>
      </main>

      {pauseModal && (
        <PauseAccessModal
          isPause={pause}
          isOpen={pauseModal}
          onClose={() => setPauseModal(false)}
          onConfirm={handlePauseConfirm}
        />
      )}
      <ChangelogModal isOpen={isChangelogOpen} onClose={() => setIsChangelogOpen(false)} />
    </div>
  );
};

export default Settings;
