import './login.css';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import axios from 'axios';
import { setCsrfToken } from '../../../config/axiosSetup';

/* ── Inline SVG icons ────────────────────────────────────── */
const IconMail = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </svg>
);
const IconLock = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="11" width="16" height="10" rx="2" />
    <path d="M8 11V8a4 4 0 1 1 8 0v3" />
  </svg>
);
const IconAlert = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8v4M12 16h.01" />
  </svg>
);
const IconArrow = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);
const IconBack = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </svg>
);
const IconShield = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

/* ── Error banner ────────────────────────────────────────── */
function ErrorBanner({ children }: { children: React.ReactNode }) {
  return (
    <div className="lv-error">
      <IconAlert />
      <span>{children}</span>
    </div>
  );
}

/* ── Field component ─────────────────────────────────────── */
interface FieldProps {
  label: string;
  type: string;
  icon?: React.ReactNode;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  autoFocus?: boolean;
  error?: boolean;
  trailing?: React.ReactNode;
}

function Field({ label, type, icon, value, onChange, placeholder, autoFocus, error, trailing }: FieldProps) {
  return (
    <label className="lv-field">
      <span className="lv-field-label">{label}</span>
      <span className={`lv-field-wrap${error ? ' has-error' : ''}`}>
        {icon && <span className="lv-field-ico">{icon}</span>}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoFocus={autoFocus}
          autoComplete={type === 'password' ? 'current-password' : 'email'}
        />
        {trailing && <span className="lv-field-trail">{trailing}</span>}
      </span>
    </label>
  );
}

/* ── Login page ──────────────────────────────────────────── */
const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/user/login`,
        { email, password },
        { withCredentials: true },
      );
      // Store the CSRF token returned by login so writes work immediately
      // (frontend JS can't read the cross-site csrf_token cookie).
      setCsrfToken(res.data?.csrfToken ?? null);
      navigate('/admin');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Login failed. Check your credentials.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lv-glass">
      <div className="lv-glass-photo" />
      <div className="lv-glass-veil" />
      <div className="lv-grad-pattern" />

      <header className="lv-glass-top">
        <div className="lv-brand-row lv-brand-row--on-dark">
          {/* CSG logo in top-left brand mark */}
          <span className="lv-brand-mark" style={{ width: 40, height: 40 }}>
            <img src="/CSG_logo.svg" alt="CSG" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%', display: 'block' }} />
          </span>
          <div className="lv-brand-text">
            <div className="lv-brand-name" style={{ color: '#fff' }}>CSG-OITS</div>
            <div className="lv-brand-sub" style={{ color: 'rgba(255,255,255,0.72)' }}>
              Cavite State University — Imus
            </div>
          </div>
        </div>
        <Link to="/" className="lv-back lv-back--glass">
          <IconBack /> Back to Home
        </Link>
      </header>

      <main className="lv-glass-stage">
        <aside className="lv-glass-info" aria-hidden="true">
          <span className="lv-eyebrow lv-eyebrow--on-dark">
            <IconShield /> Admin Console
          </span>
          <h1 className="lv-display lv-display--on-dark">
            For the officers who keep CSG <em>running</em>.
          </h1>
          <ul className="lv-bullets">
            <li><span className="lv-bullets-dot" /> Publish bulletins and pin urgent notices</li>
            <li><span className="lv-bullets-dot" /> Approve borrow requests and track inventory</li>
            <li><span className="lv-bullets-dot" /> File resolutions, memos, and reports</li>
          </ul>
        </aside>

        <section className="lv-glass-card">
          <div className="lv-glass-seal-row">
            {/* CSG logo in card header */}
            <span className="lv-seal" style={{ width: 56, height: 56 }}>
              <img src="/CSG_logo.svg" alt="CSG" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%', display: 'block' }} />
            </span>
            <div>
              <div className="lv-glass-card-eyebrow">CSG-OITS</div>
              <div className="lv-glass-card-title-sm">Officer sign-in</div>
            </div>
          </div>

          <form className="lv-form lv-form--snug" onSubmit={handleSubmit}>
            {error && <ErrorBanner>{error}</ErrorBanner>}
            <Field
              label="CvSU Email"
              type="email"
              icon={<IconMail />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@cvsu.edu.ph"
              autoFocus
            />
            <Field
              label="Password"
              type="password"
              icon={<IconLock />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              error={!!error}
              trailing={
                <Link to="/admin/forgot-password" className="lv-link lv-link--mini">
                  Forgot?
                </Link>
              }
            />
            <button
              type="submit"
              className="lv-btn-primary lv-btn-primary--block"
              disabled={loading}
            >
              {loading ? 'Signing in…' : 'Sign in'} <IconArrow />
            </button>
          </form>

          <p className="lv-glass-help">
            Locked out? Contact{' '}
            <a href="mailto:csg.imus@cvsu.edu.ph" className="lv-link">
              csg.imus@cvsu.edu.ph
            </a>
          </p>
        </section>
      </main>

      <footer className="lv-glass-foot">
        © 2026 Central Student Government — Cavite State University, Imus Campus
      </footer>
    </div>
  );
};

export default Login;
