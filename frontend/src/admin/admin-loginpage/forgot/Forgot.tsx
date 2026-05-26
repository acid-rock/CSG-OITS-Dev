import '../login/login.css';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL as string;

/* ── Icons (shared with Login) ───────────────────────────── */
const IconMail = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </svg>
);
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
const IconCheck = () => (
  <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);
const IconLock = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="11" width="16" height="10" rx="2" />
    <path d="M8 11V8a4 4 0 1 1 8 0v3" />
  </svg>
);

// Simplified flow: email entry → confirmation
// Supabase sends the OTP/magic-link email; we never expose whether the address exists.
const Forgot: React.FC = () => {
  const [step, setStep] = useState<'email' | 'confirmation'>('email');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API_URL}/user/forgot-password`, { email });
    } finally {
      // Always advance to confirmation — avoids leaking whether email exists
      setLoading(false);
      setStep('confirmation');
    }
  };

  return (
    <div className="lv-glass">
      <div className="lv-glass-photo" />
      <div className="lv-glass-veil" />
      <div className="lv-grad-pattern" />

      {/* ── Top bar ── */}
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

      {/* ── Stage ── */}
      <main className="lv-glass-stage">
        {/* Left info panel */}
        <aside className="lv-glass-info" aria-hidden="true">
          <span className="lv-eyebrow lv-eyebrow--on-dark">
            <IconLock /> Account Recovery
          </span>
          <h1 className="lv-display lv-display--on-dark">
            Regain access to your <em>account</em>.
          </h1>
          <ul className="lv-bullets">
            <li><span className="lv-bullets-dot" /> Enter your CvSU email address</li>
            <li><span className="lv-bullets-dot" /> Check your inbox for a reset link</li>
            <li><span className="lv-bullets-dot" /> Follow the link to create a new password</li>
          </ul>
        </aside>

        {/* Right glass card */}
        <section className="lv-glass-card">
          {/* Card header — logo + title */}
          <div className="lv-glass-seal-row">
            <span className="lv-seal" style={{ width: 56, height: 56 }}>
              <img src="/CSG_logo.svg" alt="CSG" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%', display: 'block' }} />
            </span>
            <div>
              <div className="lv-glass-card-eyebrow">CSG-OITS</div>
              <div className="lv-glass-card-title-sm">
                {step === 'email' ? 'Reset password' : 'Check your email'}
              </div>
            </div>
          </div>

          {/* ── Step: email entry ── */}
          {step === 'email' && (
            <form className="lv-form lv-form--snug" onSubmit={handleSendReset}>
              <p style={{ fontSize: '13.5px', color: 'var(--color-text-muted)', margin: '0 0 4px', lineHeight: 1.55 }}>
                Enter the CvSU email linked to your officer account and we'll send a reset link.
              </p>
              <label className="lv-field">
                <span className="lv-field-label">CvSU Email</span>
                <span className="lv-field-wrap">
                  <span className="lv-field-ico"><IconMail /></span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@cvsu.edu.ph"
                    required
                    autoFocus
                    autoComplete="email"
                  />
                </span>
              </label>
              <button
                type="submit"
                className="lv-btn-primary lv-btn-primary--block"
                disabled={loading}
              >
                {loading ? 'Sending…' : 'Send reset link'} {!loading && <IconArrow />}
              </button>
            </form>
          )}

          {/* ── Step: confirmation ── */}
          {step === 'confirmation' && (
            <div className="lv-form lv-form--snug" style={{ alignItems: 'center', textAlign: 'center' }}>
              <span style={{ color: 'var(--color-primary)', display: 'block' }}>
                <IconCheck />
              </span>
              <p style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--color-text-primary)', margin: '4px 0 0' }}>
                Reset link sent
              </p>
              <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', lineHeight: 1.55, margin: '6px 0 0', maxWidth: 280 }}>
                If <strong>{email}</strong> is linked to an officer account, you'll receive a reset link shortly. Check your spam folder if it doesn't arrive.
              </p>
              <Link to="/admin/login" className="lv-btn-primary lv-btn-primary--block" style={{ marginTop: 8 }}>
                Back to sign-in <IconArrow />
              </Link>
            </div>
          )}

          <p className="lv-glass-help">
            Still stuck? Contact{' '}
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

export default Forgot;
