import React from 'react';
import './feedback.css';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  buttonText?: string;
}

const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  onClose,
  title = "Success!",
  message = "Operation completed successfully",
  buttonText = "Close"
}) => {
  if (!isOpen) return null;

  return (
    <div className="feedback-modal-backdrop active" onClick={onClose}>
      <div 
        className="feedback-modal success-modal" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="feedback-icon success-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
            <path 
              d="M20 6L9 17L4 12" 
              stroke="white" 
              strokeWidth="3" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h2 className="feedback-title">{title}</h2>
        <p className="feedback-message">{message}</p>
        <button 
          className="btn-feedback success-btn"
          onClick={onClose}
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
};

export default SuccessModal;