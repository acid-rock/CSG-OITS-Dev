import './splash-screen.css';

/**
 * MaintenanceScreen — shown when admin sets "Pause access for students"
 * in the Settings panel. Reuses the same .splash-* classes as SplashScreen
 * so the visual language is consistent.
 */
export default function MaintenanceScreen() {
  return (
    <div className="splash-overlay">
      <div className="splash-content">
        <img src="/CSG_logo.svg" alt="CSG Logo" className="splash-logo" />

        {/* Pause icon */}
        <svg
          viewBox="0 0 60 60"
          width="52"
          height="52"
          fill="none"
          aria-hidden="true"
          style={{ marginBottom: '-8px' }}
        >
          <circle cx="30" cy="30" r="28" fill="var(--color-primary-light, #c8d2ef)" />
          <rect x="20" y="18" width="7" height="24" rx="3"
            fill="var(--color-primary, #4f6fd1)" />
          <rect x="33" y="18" width="7" height="24" rx="3"
            fill="var(--color-primary, #4f6fd1)" />
        </svg>

        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <p
            style={{
              margin: 0,
              fontFamily: "var(--font-family-sans, 'Plus Jakarta Sans', system-ui, sans-serif)",
              fontSize: '17px',
              fontWeight: 700,
              color: 'var(--color-text-primary, #0f1729)',
            }}
          >
            Site temporarily unavailable
          </p>
          <p
            style={{
              margin: 0,
              fontFamily: "var(--font-family-sans, 'Plus Jakarta Sans', system-ui, sans-serif)",
              fontSize: '13px',
              fontWeight: 450,
              color: 'var(--color-text-muted, #6b7280)',
              maxWidth: '320px',
              lineHeight: 1.6,
            }}
          >
            The CSG&nbsp;OITS is currently undergoing maintenance.
            <br />
            Please check back later.
          </p>
        </div>
      </div>
    </div>
  );
}
