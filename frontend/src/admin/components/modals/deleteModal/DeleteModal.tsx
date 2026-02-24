import './deleteModal.css';

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
}

const DeleteModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Delete',
  message = "This action can't be undone. Please confirm if you want you proceed.",
}: DeleteModalProps) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div className='modal-overlay' onClick={onClose}>
      <div className='modal-container' onClick={(e) => e.stopPropagation()}>
        <div className='modal-content'>
          <div className='modal-icon'>
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

          <h2 className='modal-title'>{title}</h2>

          <p className='modal-message'>{message}</p>

          <div className='modal-actions'>
            <button className='btn btn-delete' onClick={handleConfirm}>
              Delete
            </button>
            <button className='btn btn-cancel' onClick={onClose}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteModal;
