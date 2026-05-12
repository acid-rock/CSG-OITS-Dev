import './deleteModal.css';
import axios from 'axios';
import { useLockBodyScroll } from '../../../../hooks/useLockBodyScroll';

const API_URL = import.meta.env.VITE_API_URL as string;

// TASK 2: added 'event' source; settings endpoint placeholder for Wave 3
type DeleteSource = 'announcement' | 'document' | 'event' | 'settings' | 'officer' | 'committee';

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  source: DeleteSource;
  id: string | null;
  name?: string | null; // file_path — required for document deletions
  title?: string;
  message?: string;
}

// TASK 2: restructured from URL-in-path to body-based axios.delete
// Each backend delete endpoint expects a specific body shape:
//   announcement: DELETE /announcements/delete body=[{id}]
//   document:     DELETE /documents/delete    body=[{id, name}]
//   event:        DELETE /events/delete       body={id}
//   settings:     DELETE /user/whitelist      body={id}  (Wave 3 endpoint)
const sourceConfig: Record<
  DeleteSource,
  {
    endpoint: string;
    buildBody: (id: string, name?: string | null) => unknown;
    label: string;
  }
> = {
  announcement: {
    endpoint: `${API_URL}/announcements/delete`,
    buildBody: (id) => [{ id }],
    label: 'announcement',
  },
  document: {
    endpoint: `${API_URL}/documents/delete`,
    buildBody: (id, name) => [{ id, name: name ?? id }],
    label: 'document',
  },
  event: {
    endpoint: `${API_URL}/events/delete`,
    buildBody: (id) => ({ id }),
    label: 'event',
  },
  settings: {
    endpoint: `${API_URL}/user/whitelist`,
    buildBody: (id) => ({ id }),
    label: 'user from whitelist',
  },
  officer: {
    endpoint: `${API_URL}/officers/delete`,
    buildBody: (id) => [id],
    label: 'officer',
  },
  committee: {
    endpoint: `${API_URL}/committees/delete`,
    buildBody: (id) => ({ id: parseInt(id) }),
    label: 'committee',
  },
};

const DeleteModal = ({
  isOpen,
  onClose,
  onConfirm,
  source,
  id,
  name,
  title = 'Delete',
  message = "This action can't be undone. Please confirm if you want to proceed.",
}: DeleteModalProps) => {
  useLockBodyScroll(isOpen);
  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!id) return;

    const config = sourceConfig[source];
    const body = config.buildBody(id, name);

    axios
      .delete(config.endpoint, { data: body, withCredentials: true })
      .then(() => {
        onConfirm?.();
        onClose();
      })
      .catch((err) => {
        console.error(`Delete [${source}] error:`, err);
      });
  };

  const config = sourceConfig[source];

  return (
    <div className='admin-delete-overlay' onClick={onClose}>
      <div
        className='admin-delete-container'
        onClick={(e) => e.stopPropagation()}
      >
        <div className='admin-delete-content'>
          <div className='admin-delete-icon'>
            <svg width='60' height='60' viewBox='0 0 60 60' fill='none'>
              <path
                d='M30 5L5 50H55L30 5Z'
                fill='#FF9F66'
                stroke='#FF9F66'
                strokeWidth='2'
              />
              <path
                d='M30 20V32M30 38V40'
                stroke='white'
                strokeWidth='3'
                strokeLinecap='round'
              />
            </svg>
          </div>

          <h2 className='admin-delete-title'>{title}</h2>

          <p className='admin-delete-message'>
            {message}
            {id && (
              <span className='admin-delete-target'>
                {' '}
                You are deleting <strong>{config.label}</strong>: <em>{id}</em>
              </span>
            )}
          </p>

          <div className='admin-delete-actions'>
            <button
              className='admin-delete-btn admin-delete-btn--confirm'
              onClick={handleConfirm}
              disabled={!id}
            >
              Delete
            </button>
            <button
              className='admin-delete-btn admin-delete-btn--cancel'
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteModal;
