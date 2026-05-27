import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './committee-login.css';

const API = import.meta.env.VITE_API_URL as string;

const ROLE_LABELS: Record<string, string> = {
  publication: 'Publication Committee',
  secretariat: 'Secretariat Committee',
  finance:     'Finance Committee',
};

/* ── inline icons ── */
const IconLock = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="11" width="16" height="10" rx="2"/>
    <path d="M8 11V8a4 4 0 1 1 8 0v3"/>
  </svg>
);
const IconAlert = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9"/>
    <path d="M12 8v4M12 16h.01"/>
  </svg>
);
const IconArrow = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M13 6l6 6-6 6"/>
  </svg>
);
const IconBack = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M11 6l-6 6 6 6"/>
  </svg>
);
const IconShield = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z"/>
    <path d="m9 12 2 2 4-4"/>
  </svg>
);

export default function CommitteeLogin() {
  const navigate = useNavigate();

  const [pin, setPin]         = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) return;
    setError('');
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/committee-pins/verify`, { pin: pin.trim() });
      sessionStorage.setItem('committee_role',    data.role);
      sessionStorage.setItem('committee_label',   ROLE_LABELS[data.role] ?? data.role);
      sessionStorage.setItem('committee_session', '1');
      navigate('/committee/admin');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })
        ?.response?.data?.error ?? 'Invalid PIN. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cl-glass">
      <div className="cl-glass-photo" />
      <div className="cl-glass-veil" />
      <div className="cl-grad-pattern" />

      <header className="cl-glass-top">
        <div className="cl-brand-row">
          <span className="cl-brand-mark">
            <img src="/CSG_logo.svg" alt="CSG"
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
          </span>
          <div className="cl-brand-text">
            <div className="cl-brand-name">CSG-OITS</div>
            <div className="cl-brand-sub">Cavite State University — Imus</div>
          </div>
        </div>
        <Link to="/" className="cl-back">
          <IconBack /> Back to Home
        </Link>
      </header>

      <main className="cl-glass-stage">
        <aside className="cl-glass-info" aria-hidden="true">
          <span className="cl-eyebrow">
            <IconShield /> Committee Portal
          </span>
          <h1 className="cl-display">
            Committee access for the officers who <em>run</em> the work.
          </h1>
          <ul className="cl-bullets">
            <li><span className="cl-bullet-dot" /> Publication — Announcements &amp; Events</li>
            <li><span className="cl-bullet-dot" /> Secretariat — Documents</li>
            <li><span className="cl-bullet-dot" /> Finance — Equipment &amp; Finance</li>
          </ul>
        </aside>

        <section className="cl-glass-card">
          <div className="cl-seal-row">
            <span className="cl-seal">
              <img src="/CSG_logo.svg" alt="CSG"
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
            </span>
            <div>
              <div className="cl-card-eyebrow">CSG-OITS</div>
              <div className="cl-card-title-sm">Committee sign-in</div>
            </div>
          </div>

          <form className="cl-form" onSubmit={handleSubmit}>
            {error && (
              <div className="cl-error">
                <IconAlert />
                <span>{error}</span>
              </div>
            )}

            <label className="cl-field">
              <span className="cl-field-label">Committee PIN</span>
              <span className={`cl-field-wrap${error ? ' has-error' : ''}`}>
                <span className="cl-field-ico"><IconLock /></span>
                <input
                  type={showPin ? 'text' : 'password'}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Enter your committee PIN"
                  autoFocus
                  autoComplete="off"
                />
                <button
                  type="button"
                  className="cl-show-toggle"
                  onClick={() => setShowPin((v) => !v)}
                  tabIndex={-1}
                >
                  {showPin ? 'Hide' : 'Show'}
                </button>
              </span>
            </label>

            <button
              type="submit"
              className="cl-btn-primary"
              disabled={loading || !pin.trim()}
            >
              {loading ? 'Verifying…' : 'Access Portal'} <IconArrow />
            </button>
          </form>

          <p className="cl-help">
            Forgot your PIN? Contact the{' '}
            <a href="mailto:csg.imus@cvsu.edu.ph" className="cl-link">CSG Admin</a> to reset it.
          </p>
        </section>
      </main>

      <footer className="cl-foot">
        © 2026 Central Student Government — Cavite State University, Imus Campus
      </footer>
    </div>
  );
}
