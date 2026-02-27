import PauseAccessModal from '../../components/modals/PauseAccessModal/PauseAccessModal';
import './settings.css';
import { useState } from 'react';
import SettingsForm from '../../components/settings-form/general-form/SettingsForm';
import WhitelistForm from '../../components/settings-form/whitelist-form/WhitelistForm';
import DeleteModal from '../../components/modals/deleteModal/DeleteModal';

const admins = [
  { name: 'Juan Dela Cruz', email: 'jdelacruz@cvsu.edu.ph' },
  { name: 'Maria Santos', email: 'msantos@cvsu.edu.ph' },
  { name: 'Pedro Reyes', email: 'preyes@cvsu.edu.ph' },
  { name: 'Ana Lopez', email: 'alopez@cvsu.edu.ph' },
  { name: 'Jose Ramos', email: 'jramos@cvsu.edu.ph' },
  { name: 'Pedro Reyes', email: 'preyes2@cvsu.edu.ph' },
  { name: 'Pedro Reyes', email: 'preyes3@cvsu.edu.ph' },
  { name: 'Pedro Reyes', email: 'preyes4@cvsu.edu.ph' },
  { name: 'Pedro Reyes', email: 'preyes5@cvsu.edu.ph' },
  { name: 'Pedro Reyes', email: 'preyes6@cvsu.edu.ph' },
  { name: 'Pedro Reyes', email: 'preyes7@cvsu.edu.ph' },
  { name: 'Pedro Reyes', email: 'preyes8@cvsu.edu.ph' },
];

const Settings = () => {
  const [spinning, setSpinning] = useState(false);
  const [active, setActive] = useState<string[]>([]);

  const [pauseModal, setPauseModal] = useState(false);
  const [editForm, setEditForm] = useState(false);
  const [whitelistForm, setWhitelistForm] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [pause, setPause] = useState(false);

  const handleActive = (name: string) => {
    setActive((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  const handleRefresh = () => {
    setSpinning(true);
    setTimeout(() => window.location.reload(), 600);
  };

  const handleRemoveClick = (name: string) => {
    setDeleteId(name);
    setDeleteModal(true);
  };

  return (
    <div className='settings-container'>
      <div className='settings-header'>
        <span>Settings</span>
      </div>

      <div className='settings-content'>
        {/* ── Consolidated General Settings ── */}
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
                  className={
                    spinning ? 'settings-spin refresh-img' : 'refresh-img'
                  }
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

          <div className='whitelist-table-wrapper'>
            <table>
              <colgroup>
                <col className='settings-col-name' />
                <col className='settings-col-email' />
                <col className='settings-col-actions' />
              </colgroup>
              <thead>
                <tr className='settings-thead-row'>
                  <th>Name</th>
                  <th>Email / Student ID</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {admins.map((admin, idx) => (
                  <tr
                    key={idx}
                    className={`settings-table-row ${active.includes(admin.name) ? 'settings-active' : ''}`}
                    onClick={() => handleActive(admin.name)}
                  >
                    <td>
                      <span className='name-data'>{admin.name}</span>
                    </td>
                    <td>
                      <span className='email-data'>{admin.email}</span>
                    </td>
                    <td className='settings-file-btn'>
                      <button
                        type='button'
                        className='remove-link-btn'
                        title='Remove from whitelist'
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveClick(admin.name);
                        }}
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

        {/* ── About ── */}
        <div className='about-section'>
          <div>
            <span className='about-title'>About</span>
            <div className='about-details'>
              <div>Current Version: v1.2.0 (Stable)</div>
              <div>Last Updated: Jan 25, 2026</div>
            </div>
          </div>
          <button className='changelog-btn'>View System Changelog</button>
        </div>
      </div>

      {whitelistForm && (
        <div className='modal-position'>
          <WhitelistForm close={() => setWhitelistForm(false)} />
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
            message={`Are you sure you want to remove this user from the whitelist? This action can't be undone.`}
            onClose={() => setDeleteModal(false)}
            onConfirm={() =>
              setActive((prev) => prev.filter((a) => a !== deleteId))
            }
          />
        </div>
      )}
    </div>
  );
};

export default Settings;
