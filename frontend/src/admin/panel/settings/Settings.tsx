import PauseAccessModal from '../../components/modals/PauseAccessModal/PauseAccessModal';
import './settings.css';
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import SettingsForm from '../../components/settings-form/general-form/SettingsForm';
import ChangelogModal from '../../components/modals/changelogModal/ChangelogModal';
import PasswordForm from '../../components/settings-form/password-form/PasswordForm';

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
  const [editForm, setEditForm] = useState(false);
  const [isChangelogOpen, setIsChangelogOpen] = useState(false);

  const [pause, setPause] = useState(false);

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
            <img
              src='/edit.png'
              title='Edit'
              className='edit-icon'
              onClick={() => setEditForm(true)}
            />
          </label>

          <div className='general-settings-data'>
            <span className='system-name'>
              System Name: <p>Online Transparency System</p>
            </span>
            <span className='system-logo'>
              System Logo:
              <img src='/vite.svg' className='system-logo-img' alt='' />
            </span>
          </div>

          <div className='maintenance-divider' />

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
            <img src='/user-solid.png' title='security' style={{ width: 18, height: 18 }} />
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

      {editForm && (
        <div className='modal-position'>
          <SettingsForm setEdit={setEditForm} />
        </div>
      )}
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
  );
};

export default Settings;
