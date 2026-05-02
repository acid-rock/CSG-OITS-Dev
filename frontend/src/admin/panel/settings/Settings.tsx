import PauseAccessModal from '../../components/modals/PauseAccessModal/PauseAccessModal';
import './settings.css';
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import SettingsForm from '../../components/settings-form/general-form/SettingsForm';
import WhitelistForm from '../../components/settings-form/whitelist-form/WhitelistForm';
import DeleteModal from '../../components/modals/deleteModal/DeleteModal';
import ChangelogModal from '../../components/modals/changelogModal/ChangelogModal';
import PasswordForm from '../../components/settings-form/password-form/PasswordForm';

const API_URL = import.meta.env.VITE_API_URL as string;

interface WhitelistEntry {
  id: string;
  full_name?: string | null;
  email?: string | null;
  student_id?: string | null;
  created_at: string;
}

const Settings = () => {
  const [spinning, setSpinning] = useState(false);

  const [pauseModal, setPauseModal] = useState(false);
  const [editForm, setEditForm] = useState(false);
  const [whitelistForm, setWhitelistForm] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isChangelogOpen, setIsChangelogOpen] = useState(false);

  const [pause, setPause] = useState(false);

  // Real whitelist data
  const [whitelist, setWhitelist] = useState<WhitelistEntry[]>([]);
  const [whitelistLoading, setWhitelistLoading] = useState(true);
  const [whitelistError, setWhitelistError] = useState<string | null>(null);

  const fetchWhitelist = useCallback(async () => {
    setWhitelistLoading(true);
    setWhitelistError(null);
    try {
      const { data } = await axios.get(`${API_URL}/user/whitelist`, { withCredentials: true });
      setWhitelist(data);
    } catch {
      setWhitelistError('Failed to load whitelist.');
    } finally {
      setWhitelistLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWhitelist();
  }, [fetchWhitelist]);

  const handleRefresh = () => {
    setSpinning(true);
    fetchWhitelist().finally(() => setTimeout(() => setSpinning(false), 600));
  };

  const handleRemoveClick = (id: string) => {
    setDeleteId(id);
    setDeleteModal(true);
  };

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

        {/* ── Whitelist ── */}
        <div className='addmin-whitelist-container'>
          <div className='whitelist-header'>
            <span>Whitelist</span>
            <div className='whitelist-toolbar-actions'>
              <button
                className='settings-refresh-btn'
                title='Refresh'
                onClick={handleRefresh}
              >
                <img
                  src='/refresh.png'
                  alt='refresh'
                  className={spinning ? 'settings-spin refresh-img' : 'refresh-img'}
                />
              </button>
              <button
                type='button'
                className='whitelist-add-btn'
                onClick={() => setWhitelistForm(!whitelistForm)}
              >
                Add Whitelist
              </button>
            </div>
          </div>

          {whitelistError && (
            <p style={{ color: '#dc2626', fontSize: '0.85rem', padding: '0.5rem 0' }}>{whitelistError}</p>
          )}

          <div className='whitelist-table-wrapper'>
            <table>
              <colgroup>
                <col className='settings-col-name' />
                <col className='settings-col-email' />
                <col style={{ width: '140px' }} />
                <col className='settings-col-actions' />
              </colgroup>
              <thead>
                <tr className='settings-thead-row'>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Student ID</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {whitelistLoading && (
                  <tr><td colSpan={4} style={{ padding: '1rem', color: '#9ca3af', fontSize: '0.875rem' }}>Loading...</td></tr>
                )}
                {!whitelistLoading && whitelist.length === 0 && (
                  <tr><td colSpan={4} style={{ padding: '1rem', color: '#9ca3af', fontSize: '0.875rem' }}>No whitelist entries yet.</td></tr>
                )}
                {whitelist.map((entry) => (
                  <tr key={entry.id} className='settings-table-row'>
                    <td><span className='name-data'>{entry.full_name ?? '—'}</span></td>
                    <td><span className='email-data'>{entry.email ?? '—'}</span></td>
                    <td><span className='email-data'>{entry.student_id ?? '—'}</span></td>
                    <td className='settings-file-btn'>
                      <button
                        type='button'
                        className='remove-link-btn'
                        title='Remove from whitelist'
                        onClick={() => handleRemoveClick(entry.id)}
                      >
                        <img src='./bin.png' alt='Remove' />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

      {whitelistForm && (
        <div className='modal-position'>
          <WhitelistForm
            close={() => setWhitelistForm(false)}
            onSuccess={fetchWhitelist}
          />
        </div>
      )}
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
      {deleteModal && (
        <div className='modal-position'>
          <DeleteModal
            isOpen={deleteModal}
            source='settings'
            id={deleteId}
            title='Remove from Whitelist'
            message="Are you sure you want to remove this entry from the whitelist? This action can't be undone."
            onClose={() => setDeleteModal(false)}
            onConfirm={fetchWhitelist}
          />
        </div>
      )}

      <ChangelogModal isOpen={isChangelogOpen} onClose={() => setIsChangelogOpen(false)} />
    </div>
  );
};

export default Settings;
