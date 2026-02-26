import './confirmationModal.css';

interface confirmationProps {
  onClose: () => void;
  onConfirm: () => void;
}

const ConfimationModal = ({ onConfirm, onClose }: confirmationProps) => {
  return (
    <div className='admin-confirm-overlay'>
      <div className='admin-confirm-container'>
        <h2 className='admin-confirm-title'>
          Confirm System Information Update
        </h2>
        <p className='admin-confirm-message'>
          You're about to change system information. Please review the details
          carefully before confirming. These changes will take effect
          immediately.
        </p>
        <div className='admin-confirm-actions'>
          <button
            className='admin-confirm-btn admin-confirm-btn--confirm'
            onClick={onConfirm}
          >
            Confirm
          </button>
          <button
            className='admin-confirm-btn admin-confirm-btn--cancel'
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfimationModal;
