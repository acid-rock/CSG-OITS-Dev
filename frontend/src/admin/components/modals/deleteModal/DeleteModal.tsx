import './deleteModal.css';

type DeleteSource = 'announcement' | 'document' | 'settings';

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void; // optional: called after successful delete
  source: DeleteSource;
  id: string | null;
  title?: string;
  message?: string;
}

const sourceConfig: Record<
  DeleteSource,
  { endpoint: (id: string) => string; label: string }
> = {
  announcement: {
    endpoint: (id) => `/api/announcement/delete/${id}`,
    label: 'announcement',
  },
  document: {
    endpoint: (id) => `/api/document/delete/${id}`,
    label: 'document',
  },
  settings: {
    endpoint: (id) => `/api/whitelist/delete/${id}`,
    label: 'user from whitelist',
  },
};

const DeleteModal = ({
  isOpen,
  onClose,
  onConfirm,
  source,
  id,
  title = 'Delete',
  message = "This action can't be undone. Please confirm if you want to proceed.",
}: DeleteModalProps) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!id) return;

    const { endpoint } = sourceConfig[source];

    fetch(endpoint(id), { method: 'DELETE' })
      .then((res) => res.json())
      .then((data) => {
        console.log(`Delete [${source}] success:`, data);
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
