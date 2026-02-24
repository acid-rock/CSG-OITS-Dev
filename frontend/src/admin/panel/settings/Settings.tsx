import PauseAccessModal from '../../components/modals/PauseAccessModal/PauseAccessModal';
import './settings.css';
import { useState } from 'react';
import SettingsForm from '../../components/settings-form/general-form/SettingsForm';
import WhitelistForm from '../../components/settings-form/whitelist-form/WhitelistForm';

const admins = [
  { name: 'Juan Dela Cruz' },
  { name: 'Maria Santos' },
  { name: 'Pedro Reyes' },
  { name: 'Ana Lopez' },
  { name: 'Jose Ramos' },
  { name: 'Pedro Reyes' },
  { name: 'Pedro Reyes' },
  { name: 'Pedro Reyes' },
  { name: 'Pedro Reyes' },
  { name: 'Pedro Reyes' },
  { name: 'Pedro Reyes' },
  { name: 'Pedro Reyes' },
];

const Settings = () => {
  const [spinning, setSpinning] = useState(false);
  const [active, setActive] = useState<string[]>([]);

  /*modals*/
  const [pauseModal, setPauseModal] = useState(false);
  const [editForm, setEditForm] = useState(false);
  const [whitelistForm, setWhitelistForm] = useState(false);

  /*state for changes*/
  const [pause, setPause] = useState(false);

  const handleActive = (fileName: string) => {
    setActive((prev) =>
      prev.includes(fileName)
        ? prev.filter((name) => name !== fileName)
        : [...prev, fileName]
    );
  };

  const handleRefresh = () => {
    setSpinning(true);
    setTimeout(() => {
      window.location.reload();
    }, 600);
  };

  const handlePause = () => {
    //*logic fetch to backend
  };

  return (
    <div className='settings-container'>
      <div className='settings-header'>
        <span>Settings</span>
        <p>
          {new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </p>
      </div>
      <div>
        <div className='general-settings'>
          <label htmlFor=''>
            <img src='/globe.png' title='globe' /> General System Settings
            <img
              src='/edit.png'
              title='edit'
              onClick={() => setEditForm(true)}
            />
          </label>
          <div className='general-settings-data'>
            <span className='system-name'>
              System Name: <p>Online Transparency System</p>
            </span>
            <span className='system-logo'>
              System Logo:
              <img src='/vite.svg' width={25} alt='' />
            </span>
          </div>
        </div>

        <div className='maintenance-settings'>
          <label htmlFor=''>
            <img src='/settings.png' title='globe' /> General System Settings
          </label>
          <div className='maintenace-settings-data'>
            <span className='maintenance-toggle'>
              Pause access for students:
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
            </span>
          </div>
        </div>

        <div className='addmin-whitelist-container'>
          <div className='whitelist-header'>
            <span>Whitelist</span>
            <button
              type='button'
              onClick={() => setWhitelistForm(!whitelistForm)}
            >
              Add Whitelist
            </button>
          </div>
          <table>
            <thead>
              <tr className='settings-thead-row'>
                <td colSpan={2} className='settings-thead-cell'>
                  <div className='settings-table-actions'>
                    <button
                      className='settings-refresh-btn'
                      title='Refresh'
                      onClick={handleRefresh}
                    >
                      <img
                        src='/refresh.png'
                        alt='refresh'
                        className={spinning ? 'settings-spin' : ''}
                        style={{ width: 18, height: 18 }}
                      />
                    </button>
                  </div>
                </td>
              </tr>
            </thead>
            <tbody>
              {admins.map((file, idx) => (
                <tr
                  key={idx}
                  className={`settings-table-row ${active.includes(file.name) ? 'settings-active' : ''}`}
                >
                  <td>
                    <span className='name-data'>{file.name}</span>
                  </td>
                  <td className='settings-file-btn'>
                    <img src='/remove.png' alt='' />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className='about-section'>
          <div>
            <span className='about-title'>
              <img src='/info.png' alt='about' />
              About
            </span>
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
    </div>
  );
};

export default Settings;
