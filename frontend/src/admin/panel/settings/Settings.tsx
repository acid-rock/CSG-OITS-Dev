import PauseAccessModal from '../../components/modals/PauseAccessModal/PauseAccessModal';
import './settings.css';
import '../_shared/admin-list.css';
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import ChangelogModal from '../../components/modals/changelogModal/ChangelogModal';
import PasswordForm from '../../components/settings-form/password-form/PasswordForm';
import Sidebar from '../_shared/Sidebar';

const API_URL = import.meta.env.VITE_API_URL as string;

interface AdminAccount {
  id: string;
  owner_id: string;
  role: string;
  email: string | null;
}

const Settings = () => {
  // Admin accounts list
  const [adminAccounts, setAdminAccounts] = useState<AdminAccount[]>([]);
  const [adminLoading, setAdminLoading] = useState(true);
  const [adminError, setAdminError] = useState<string | null>(null);

  const [pauseModal, setPauseModal] = useState(false);
  const [isChangelogOpen, setIsChangelogOpen] = useState(false);
  const [pause, setPause] = useState(false);

  // Active term — dropdown + badge
  const [activeTerm, setActiveTerm] = useState('');
  const [termSelect, setTermSelect] = useState('');
  const [termOptions, setTermOptions] = useState<string[]>([]);
  const [termSaving, setTermSaving] = useState(false);
  const [termSaved, setTermSaved] = useState(false);

  // Fetch current active term
  useEffect(() => {
    axios.get(`${API_URL}/settings/term`, { withCredentials: true })
      .then(({ data }) => {
        setActiveTerm(data.value ?? '');
        setTermSelect(data.value ?? '');
      })
      .catch(() => {});
  }, []);

  // Fetch available term options from officers table
  useEffect(() => {
    axios.get(`${API_URL}/officers/terms`, { withCredentials: true })
      .then(({ data }) => setTermOptions(Array.isArray(data) ? data : []))
      .catch(() => setTermOptions([]));
  }, []);

  const handleSaveTerm = async () => {
    if (!termSelect.trim()) return;
    setTermSaving(true);
    setTermSaved(false);
    try {
      await axios.post(`${API_URL}/settings/term`, { value: termSelect.trim() }, { withCredentials: true });
      setActiveTerm(termSelect.trim());
      setTermSaved(true);
      setTimeout(() => setTermSaved(false), 2500);
    } catch {
      // silently ignore
    } finally {
      setTermSaving(false);
    }
  };

  const fetchAdminAccounts = useCallback(async () => {
    setAdminLoading(true);
    setAdminError(null);
    try {
      const { data } = await axios.get(`${API_URL}/user/list`, { withCredentials: true });
      setAdminAccounts(data);
    } catch (err: unknown) {
      setAdminError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Could not load accounts.',
      );
    } finally {
      setAdminLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdminAccounts();
  }, [fetchAdminAccounts]);

  return (
    <div className="ad-shell">
      <Sidebar active="settings" />
      <main className="ad-main">
      <div className='settings-container'>
      <div className='settings-header'>
        <span>Settings</span>
      </div>

      <div className='settings-content'>

        {/* ── General System Settings ── */}
        <div className='general-settings'>
          <label>
            <img src='/globe.png' title='globe' />
            General System Settings
          </label>

          {/* Administration Term */}
          <div style={{ marginTop: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text, #374151)' }}>
                Administration Term
              </span>
              {activeTerm && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                  fontSize: '0.78rem', color: 'var(--color-success, #16a34a)', fontWeight: 600,
                }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--color-success, #16a34a)', display: 'inline-block' }} />
                  {activeTerm}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <select
                value={termSelect}
                onChange={(e) => setTermSelect(e.target.value)}
                style={{
                  padding: '0.5rem 0.75rem',
                  border: '1px solid var(--color-border, #e5e7eb)',
                  borderRadius: 6,
                  fontSize: '0.9rem',
                  minWidth: 200,
                  background: 'var(--color-surface, #fff)',
                  color: 'var(--color-text, #374151)',
                }}
              >
                <option value=''>Select a term...</option>
                {termOptions.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <button
                onClick={handleSaveTerm}
                disabled={termSaving || !termSelect.trim()}
                style={{
                  padding: '0.5rem 1.25rem',
                  background: 'var(--color-primary, #4f6ef7)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  cursor: termSaving || !termSelect.trim() ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  opacity: termSaving || !termSelect.trim() ? 0.7 : 1,
                }}
              >
                {termSaving ? 'Saving…' : 'Save'}
              </button>
              {termSaved && (
                <span style={{ color: 'var(--color-success, #16a34a)', fontSize: '0.85rem' }}>Saved ✓</span>
              )}
            </div>
            {termOptions.length === 0 && (
              <p style={{ marginTop: '0.4rem', fontSize: '0.78rem', color: 'var(--color-text-muted, #6b7280)' }}>
                No terms available. Assign term years to officers first.
              </p>
            )}
          </div>

          <div className='maintenance-divider' />

          {/* Pause access toggle */}
          <div className='maintenance-inline'>
            <span className='maintenance-label'>Pause access for students</span>
            <label className='switch'>
              <input
                type='checkbox'
                title='toggle'
                checked={pause}
                onClick={() => setPauseModal(true)}
                readOnly
              />
              <span className='slider'></span>
            </label>
          </div>
        </div>

        {/* ── Admin Accounts ── */}
        <div className='addmin-whitelist-container' style={{ marginTop: '1rem', minHeight: 'fit-content', overflow: 'visible' }}>
          <div className='whitelist-header'>
            <span>Admin Accounts</span>
          </div>
          <div className='whitelist-table-wrapper' style={{ minHeight: '60px', overflow: 'visible' }}>
            {adminLoading ? (
              <p style={{ padding: '1rem', fontSize: '0.875rem', color: '#9ca3af' }}>Loading accounts...</p>
            ) : adminError ? (
              <p style={{ padding: '1rem', fontSize: '0.875rem', color: '#dc2626' }}>
                {adminError}
              </p>
            ) : (
              <table>
                <thead>
                  <tr className='settings-thead-row'>
                    <th style={{ verticalAlign: 'middle', textAlign: 'left', padding: '0.5rem 1rem' }}>Email</th>
                    <th style={{ verticalAlign: 'middle', textAlign: 'left', padding: '0.5rem 1rem' }}>Role</th>
                    <th style={{ verticalAlign: 'middle', textAlign: 'left', padding: '0.5rem 1rem' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {adminAccounts.map((acct) => (
                    <tr key={acct.id} className='settings-table-row'>
                      <td style={{ verticalAlign: 'middle' }}><span className='email-data'>{acct.email ?? '—'}</span></td>
                      <td style={{ verticalAlign: 'middle' }}><span className='name-data'>{acct.role}</span></td>
                      <td style={{ verticalAlign: 'middle', textAlign: 'center', padding: '0.5rem' }}>
                        <button
                          type='button'
                          onClick={() => console.log('remove', acct.owner_id)}
                          style={{ background: 'none', border: '1px solid #dc2626', color: '#dc2626', borderRadius: '4px', padding: '0.25rem 0.625rem', fontSize: '0.75rem', cursor: 'pointer' }}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                  {adminAccounts.length === 0 && (
                    <tr><td colSpan={3} style={{ padding: '1rem', color: '#9ca3af', fontSize: '0.875rem' }}>No admin accounts found.</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* ── Account Security ── */}
        <div className='general-settings' style={{ marginTop: '1.5rem' }}>
          <label>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" title="security" aria-hidden="true"><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z"/><path d="m9 12 2 2 4-4"/></svg>
            Account Security
          </label>
          <div style={{ marginTop: '1rem' }}>
            <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '1rem' }}>
              Change your admin account password below. You will remain logged in after saving.
            </p>
            <PasswordForm />
          </div>
        </div>

        {/* ── About ── */}
        <div className='about-section'>
          <div>
            <span className='about-title'>About</span>
            <div className='about-details'>
              <div>Current Version: v1.2.0 (Stable)</div>
              <div>Last Updated: Jan 25, 2026</div>
            </div>
          </div>
          <button className='changelog-btn' onClick={() => setIsChangelogOpen(true)}>
            View System Changelog
          </button>
        </div>
      </div>

      {pauseModal && (
        <div className='modal-position'>
          <PauseAccessModal
            isPause={pause}
            isOpen={pauseModal}
            onClose={() => setPauseModal(!pauseModal)}
            onConfirm={() => setPause(!pause)}
          />
        </div>
      )}

      <ChangelogModal isOpen={isChangelogOpen} onClose={() => setIsChangelogOpen(false)} />
    </div>
      </main>
    </div>
  );
};

export default Settings;
