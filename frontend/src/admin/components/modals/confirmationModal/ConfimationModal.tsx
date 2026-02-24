import './confirmationModal.css';

interface confirmationProps {
  onClose: () => void;
  onConfirm: () => void;
}

const ConfimationModal = ({ onConfirm, onClose }: confirmationProps) => {
  return (
    <div className='confirmation-container-overlay'>
      <div className='confirmation-container'>
        <h2 className='confirmation-title'>
          Confirm System Information Update
        </h2>
        <p className='confirmation-modal-message'>
          You’re about to change system information. Please review the details
          carefully before confirming. These changes will take effect
          immediately.
        </p>
        <div className='confirmation-modal-actions'>
          <button
            className='confirmation-btn confirmation-btn-confirm'
            onClick={onConfirm}
          >
            Confirm
          </button>
          <button
            className='confirmation-btn confirmation-btn-cancel'
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
