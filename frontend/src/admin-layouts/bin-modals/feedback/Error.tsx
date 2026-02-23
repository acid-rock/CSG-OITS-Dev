import React from 'react';
import './feedback.css';

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  buttonText?: string;
}

const ErrorModal: React.FC<ErrorModalProps> = ({
  isOpen,
  onClose,
  title = "Error",
  message = "There was an error processing your request",
  buttonText = "OK"
}) => {
  if (!isOpen) return null;

  return (
    <div className="feedback-modal-backdrop active" onClick={onClose}>
      <div 
        className="feedback-modal error-modal" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="feedback-icon error-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
            <path 
              d="M18 6L6 18" 
              stroke="white" 
              strokeWidth="3" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
            <path 
              d="M6 6L18 18" 
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
          className="btn-feedback error-btn"
          onClick={onClose}
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
};

export default ErrorModal;