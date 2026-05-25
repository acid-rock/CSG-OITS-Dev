import './splash-screen.css';

export default function SplashScreen() {
  return (
    <div className="splash-overlay">
      <div className="splash-content">
        {/* Logo — centred at top */}
        <img src="/CSG_logo.svg" alt="CSG Logo" className="splash-logo" />

        {/* Spinner + label row */}
        <div className="splash-row">
          <span className="splash-spinner" aria-hidden="true" />
          <p className="splash-label">Please wait for a moment.</p>
        </div>
      </div>
    </div>
  );
}
