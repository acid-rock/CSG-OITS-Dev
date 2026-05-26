import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import '../login/login.css';

const API_URL = import.meta.env.VITE_API_URL as string;

/* ── Icons ── */
const IconBack = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </svg>
);
const IconArrow = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);
const IconLock = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V8a4 4 0 1 1 8 0v3" />
  </svg>
);
const IconCheck = () => (
  <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" /><path d="m9 12 2 2 4-4" />
  </svg>
);

const Reset: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Supabase may deliver the token in query params or in the URL hash fragment
    let token = searchParams.get('access_token');
    if (!token && window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.slice(1));
      token = hashParams.get('access_token');
    }
    if (!token) {
      navigate('/admin/login', { replace: true });
      return;
    }
    setAccessToken(token);
  }, [searchParams, navigate]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (!/[A-Z]/.test(newPassword)) { setError('Password must contain at least one uppercase letter.'); return; }
    if (!/[0-9]/.test(newPassword)) { setError('Password must contain at least one number.'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }

    setLoading(true);
    try {
      await axios.post(`${API_URL}/user/reset-password`, {
        access_token: accessToken,
        new_password: newPassword,
      });
      setSuccess(true);
      setTimeout(() => navigate('/admin/login', { replace: true }), 2500);
    } catch (err: unknown) {
      const d = (err as { response?: { data?: { error?: string; message?: string } } })?.response?.data;
      setError(d?.error ?? d?.message ?? 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lv-glass">
      <div className="lv-glass-photo" />
      <div className="lv-glass-veil" />
      <div className="lv-grad-pattern" />

      {/* Top bar */}
      <header className="lv-glass-top">
        <div className="lv-brand-row lv-brand-row--on-dark">
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
        <Link to="/admin/login" className="lv-back lv-back--glass">
          <IconBack /> Back to Login
        </Link>
      </header>

      {/* Stage */}
      <main className="lv-glass-stage">
        {/* Left info panel */}
        <aside className="lv-glass-info" aria-hidden="true">
          <span className="lv-eyebrow lv-eyebrow--on-dark">
            <IconLock /> Set New Password
          </span>
          <h1 className="lv-display lv-display--on-dark">
            Choose a <em>strong</em> new password.
          </h1>
          <ul className="lv-bullets">
            <li><span className="lv-bullets-dot" /> At least 8 characters</li>
            <li><span className="lv-bullets-dot" /> One uppercase letter</li>
            <li><span className="lv-bullets-dot" /> One number</li>
          </ul>
        </aside>

        {/* Right glass card */}
        <section className="lv-glass-card">
          <div className="lv-glass-seal-row">
            <span className="lv-seal" style={{ width: 56, height: 56 }}>
              <img src="/CSG_logo.svg" alt="CSG" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%', display: 'block' }} />
            </span>
            <div>
              <div className="lv-glass-card-eyebrow">CSG-OITS</div>
              <div className="lv-glass-card-title-sm">
                {success ? 'Password updated' : 'Create new password'}
              </div>
            </div>
          </div>

          {success ? (
            <div className="lv-form lv-form--snug" style={{ alignItems: 'center', textAlign: 'center' }}>
              <span style={{ color: 'var(--color-primary)', display: 'block' }}>
                <IconCheck />
              </span>
              <p style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--color-text-primary)', margin: '4px 0 0' }}>
                Password updated successfully
              </p>
              <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', lineHeight: 1.55, margin: '6px 0 0', maxWidth: 280 }}>
                Redirecting you to the login page…
              </p>
              <Link to="/admin/login" className="lv-btn-primary lv-btn-primary--block" style={{ marginTop: 8 }}>
                Go to sign-in <IconArrow />
              </Link>
            </div>
          ) : (
            <form className="lv-form lv-form--snug" onSubmit={handleSubmit}>
              <p style={{ fontSize: '13.5px', color: 'var(--color-text-muted)', margin: '0 0 4px', lineHeight: 1.55 }}>
                Enter and confirm your new password below.
              </p>

              {error && <p className="lv-error">{error}</p>}

              <label className="lv-field">
                <span className="lv-field-label">New Password</span>
                <span className="lv-field-wrap">
                  <span className="lv-field-ico"><IconLock /></span>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    required
                    autoFocus
                    minLength={8}
                    autoComplete="new-password"
                  />
                </span>
              </label>

              <label className="lv-field">
                <span className="lv-field-label">Confirm Password</span>
                <span className="lv-field-wrap">
                  <span className="lv-field-ico"><IconLock /></span>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    required
                    autoComplete="new-password"
                  />
                </span>
              </label>

              <button
                type="submit"
                className="lv-btn-primary lv-btn-primary--block"
                disabled={loading}
              >
                {loading ? 'Updating…' : 'Update password'} {!loading && <IconArrow />}
              </button>
            </form>
          )}

          <p className="lv-glass-help">
            Trouble resetting?{' '}
            <a href="mailto:csg-it@cvsu.edu.ph" className="lv-link">
              csg-it@cvsu.edu.ph
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

export default Reset;
