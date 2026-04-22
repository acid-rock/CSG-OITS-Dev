import axios from 'axios';
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

const API_URL = import.meta.env.VITE_API_URL;

const config = (source: string) => {
  switch (source) {
    case "announcement":
      return {
        url: `${API_URL}/announcements/delete`,
        label: "announcement",
      }
    case "document":
      return {
        url: `${API_URL}/documents/delete`,
        label: "document",
      }
    case "settings":
      return {
        url: `${API_URL}/settings/delete`,
        label: "settings",
      }
    default:
      throw new Error("Invalid source type");
  }
}

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

  const handleConfirm = async () => {
    const response = await axios.delete(config(source).url, { data: [ id ] });
    if (response.status === 200) {
      onClose();
      if (onConfirm) {
        onConfirm();
      }
    }
  };

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
                You are deleting <strong>{config(source).label}</strong>: <em>{id}</em>
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
