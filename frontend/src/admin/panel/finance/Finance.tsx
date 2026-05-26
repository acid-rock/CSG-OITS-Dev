import '../_shared/admin-list.css';
import Sidebar from '../_shared/Sidebar';
import { PageHead } from '../_shared/chrome';

const Finance = () => (
  <div className="ad-shell">
    <Sidebar active="finance" />
    <main className="ad-main">
      <PageHead
        title="Finance"
        subtitle="Financial records and budget management"
      />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          gap: '16px',
          color: 'var(--color-text-muted, #6b7280)',
          fontFamily: 'var(--font-family-mono, monospace)',
        }}
      >
        <span style={{ fontSize: '2.5rem' }}>🚧</span>
        <p style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>
          === To Be Developed ===
        </p>
        <p style={{ fontSize: '0.875rem', margin: 0, textAlign: 'center', maxWidth: 360 }}>
          The Finance module is currently under development.
          Check back in a future release.
        </p>
      </div>
    </main>
  </div>
);

export default Finance;
