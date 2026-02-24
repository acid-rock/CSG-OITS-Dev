import './pauseAccessModal.css';

interface PauseAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  isPause: boolean;
}

const PauseAccessModal = ({
  isPause,
  isOpen,
  onClose,
  onConfirm,
  title = 'Pause Access',
}: PauseAccessModalProps) => {
  if (!isOpen) return null;

  const message = isPause ? (
    <>
      This will <strong style={{ color: 'black' }}>ENABLE</strong> guest access
      to the page. Users will be able to view content until access is restricted
      again.
    </>
  ) : (
    <>
      This will temporarily <strong style={{ color: 'black' }}>DISABLE</strong>{' '}
      guest access to the page. Users won't be able to view content until access
      is restored.
    </>
  );

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div className='pause-modal-overlay' onClick={onClose}>
      <div
        className='pause-modal-container'
        onClick={(e) => e.stopPropagation()}
      >
        <div className='pause-modal-content'>
          <div className='pause-modal-icon'>
            <svg width='60' height='60' viewBox='0 0 60 60' fill='none'>
              <circle cx='30' cy='30' r='25' fill='#FFA726' />
              <rect x='22' y='18' width='6' height='24' rx='2' fill='white' />
              <rect x='32' y='18' width='6' height='24' rx='2' fill='white' />
            </svg>
          </div>

          <h2 className='pause-modal-title'>{title}</h2>

          <p className='pause-modal-message'>{message}</p>

          <div className='pause-modal-actions'>
            <button
              className='pause-btn pause-btn-confirm'
              onClick={handleConfirm}
            >
              Confirm
            </button>
            <button className='pause-btn pause-btn-cancel' onClick={onClose}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PauseAccessModal;
