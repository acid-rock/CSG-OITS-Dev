import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
const IconAlert = () => (
  <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" /><path d="M12 8v4M12 16h.01" />
  </svg>
);

/**
 * Read the Supabase access_token from the current URL.
 *
 * Supabase recovery emails redirect to this page via two possible formats:
 *   • Implicit flow  → /admin/reset-password#access_token=xxx&type=recovery
 *   • PKCE flow      → /admin/reset-password?code=xxx
 *
 * This function reads synchronously at component initialisation time
 * (used as a useState initialiser) so there is no async/timing gap.
 *
 * Returns the raw token string, or null if neither token nor code is present.
 * If a PKCE `code` is found it is returned with the prefix "code:" so the
 * component knows it must be exchanged for a real access_token first.
 */
function readTokenFromUrl(): string | null {
  // 1. Query-param access_token  (some flow variants)
  const qp = new URLSearchParams(window.location.search);
  const fromQuery = qp.get('access_token');
  if (fromQuery) return fromQuery;

  // 2. Hash-fragment access_token  (standard Supabase OTP / implicit flow)
  if (window.location.hash) {
    const hash = window.location.hash.startsWith('#')
      ? window.location.hash.slice(1)
      : window.location.hash;
    const hp = new URLSearchParams(hash);
    const fromHash = hp.get('access_token');
    if (fromHash) return fromHash;
  }

  // 3. PKCE code  — prefix so the component knows it needs exchange
  const code = qp.get('code');
  if (code) return `code:${code}`;

  return null;
}

const Reset: React.FC = () => {
  // Read the URL synchronously at mount — avoids any useEffect timing gap.
  const [rawToken]        = useState<string | null>(() => readTokenFromUrl());
  const [accessToken, setAccessToken] = useState<string | null>(
    rawToken && !rawToken.startsWith('code:') ? rawToken : null,
  );

  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // PKCE code exchange — fires only when a `code:` prefix token was found.
  const [exchanging, setExchanging]       = useState(false);
  const [exchangeError, setExchangeError] = useState('');

  useEffect(() => {
    if (!rawToken?.startsWith('code:')) return;
    const code = rawToken.slice(5); // strip "code:" prefix
    setExchanging(true);
    axios
      .post(`${API_URL}/user/exchange-code`, { code })
      .then(({ data }) => setAccessToken(data.access_token))
      .catch(() =>
        setExchangeError(
          'This recovery link has expired or has already been used. Please request a new one.',
        ),
      )
      .finally(() => setExchanging(false));
  }, [rawToken]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8)          { setError('Password must be at least 8 characters.'); return; }
    if (!/[A-Z]/.test(newPassword))       { setError('Password must contain at least one uppercase letter.'); return; }
    if (!/[0-9]/.test(newPassword))       { setError('Password must contain at least one number.'); return; }
    if (newPassword !== confirmPassword)  { setError('Passwords do not match.'); return; }

    setLoading(true);
    try {
      await axios.post(`${API_URL}/user/reset-password`, {
        access_token: accessToken,
        new_password: newPassword,
      });
      setSuccess(true);
    } catch (err: unknown) {
      const d = (err as { response?: { data?: { error?: string; message?: string } } })?.response?.data;
      setError(d?.error ?? d?.message ?? 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Shared chrome ── */
  const Shell = ({ children }: { children: React.ReactNode }) => (
    <div className="lv-glass">
      <div className="lv-glass-photo" />
      <div className="lv-glass-veil" />
      <div className="lv-grad-pattern" />

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

      <main className="lv-glass-stage">
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

        <section className="lv-glass-card">
          <div className="lv-glass-seal-row">
            <span className="lv-seal" style={{ width: 56, height: 56 }}>
              <img src="/CSG_logo.svg" alt="CSG" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%', display: 'block' }} />
            </span>
            <div>
              <div className="lv-glass-card-eyebrow">CSG-OITS</div>
              <div className="lv-glass-card-title-sm">Set new password</div>
            </div>
          </div>

          {children}

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

  /* ── Loading: exchanging PKCE code ── */
  if (exchanging) {
    return (
      <Shell>
        <div className="lv-form lv-form--snug" style={{ alignItems: 'center', textAlign: 'center' }}>
          <p style={{ fontSize: 14, color: 'var(--color-text-muted)', margin: 0 }}>
            Verifying recovery link…
          </p>
        </div>
      </Shell>
    );
  }

  /* ── Error: invalid / expired link ── */
  if (!accessToken || exchangeError) {
    const msg = exchangeError || 'This recovery link is invalid or has already been used.';
    return (
      <Shell>
        <div className="lv-form lv-form--snug" style={{ alignItems: 'center', textAlign: 'center' }}>
          <span style={{ color: 'var(--color-danger-text, #b91c1c)', display: 'block' }}>
            <IconAlert />
          </span>
          <p style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--color-text-primary)', margin: '4px 0 0' }}>
            Link expired
          </p>
          <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', lineHeight: 1.55, margin: '6px 0 0', maxWidth: 280 }}>
            {msg}
          </p>
          <Link
            to="/admin/forgot-password"
            className="lv-btn-primary lv-btn-primary--block"
            style={{ marginTop: 12 }}
          >
            Request a new link <IconArrow />
          </Link>
        </div>
      </Shell>
    );
  }

  /* ── Success ── */
  if (success) {
    return (
      <Shell>
        <div className="lv-form lv-form--snug" style={{ alignItems: 'center', textAlign: 'center' }}>
          <span style={{ color: 'var(--color-primary)', display: 'block' }}>
            <IconCheck />
          </span>
          <p style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--color-text-primary)', margin: '4px 0 0' }}>
            Password updated successfully
          </p>
          <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', lineHeight: 1.55, margin: '6px 0 0', maxWidth: 280 }}>
            You can now sign in with your new password.
          </p>
          <Link to="/admin/login" className="lv-btn-primary lv-btn-primary--block" style={{ marginTop: 8 }}>
            Go to sign-in <IconArrow />
          </Link>
        </div>
      </Shell>
    );
  }

  /* ── Main form ── */
  return (
    <Shell>
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
    </Shell>
  );
};

export default Reset;
