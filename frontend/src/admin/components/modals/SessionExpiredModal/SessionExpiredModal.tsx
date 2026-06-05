import "./SessionExpiredModal.css";
import { useLockBodyScroll } from "../../../../hooks/useLockBodyScroll";

interface SessionExpiredModalProps {
  isOpen: boolean;
}

const SessionExpiredModal = ({ isOpen }: SessionExpiredModalProps) => {
  useLockBodyScroll(isOpen);

  if (!isOpen) return null;

  const handleGoToLogin = () => {
    window.location.href = "/admin/login";
  };

  return (
    <div className="session-expired-overlay">
      <div className="session-expired-modal">
        <h2 className="session-expired-title">Session Expired</h2>
        <p className="session-expired-message">
          Your session has expired. Please log in again to continue.
        </p>
        <button className="session-expired-btn" onClick={handleGoToLogin}>
          Go to Login
        </button>
      </div>
    </div>
  );
};

export default SessionExpiredModal;
