import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL as string;

/**
 * Protects /committee/admin.
 *
 * Checks sessionStorage for a valid committee session AND validates the
 * stored nonce against the server. A new sign-in on any browser/device
 * generates a fresh nonce, invalidating all prior sessions for that role.
 */
const CommitteeProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();

  const session = sessionStorage.getItem('committee_session') === '1';
  const role    = sessionStorage.getItem('committee_role');
  const nonce   = sessionStorage.getItem('committee_nonce');

  // null = still checking, true = valid, false = invalid
  const [valid, setValid] = useState<boolean | null>(session ? null : false);

  useEffect(() => {
    if (!session || !role || !nonce) {
      setValid(false);
      return;
    }

    axios
      .post(`${API}/committee-pins/validate-session`, { role, nonce })
      .then(() => setValid(true))
      .catch(() => {
        // Nonce mismatch — another device has signed in; clear local session
        sessionStorage.removeItem('committee_session');
        sessionStorage.removeItem('committee_role');
        sessionStorage.removeItem('committee_label');
        sessionStorage.removeItem('committee_nonce');
        setValid(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (valid === null) {
    // Brief loading state while the nonce is being validated
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f4f6fd',
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
          color: '#6b7280',
          fontSize: '0.9rem',
        }}
      >
        Verifying session…
      </div>
    );
  }

  if (!valid) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          background: '#f4f6fd',
          padding: '2rem',
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        }}
      >
        <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#4f6fd1"
          strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="11" width="16" height="10" rx="2" />
          <path d="M8 11V8a4 4 0 1 1 8 0v3" />
        </svg>
        <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: '#0f1729' }}>
          Committee Access Required
        </h2>
        <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem', textAlign: 'center', maxWidth: 360 }}>
          Please sign in with your committee PIN to access this portal.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
          <button
            onClick={() => navigate('/committee/login')}
            style={{
              padding: '0.6rem 1.5rem',
              background: '#4f6fd1',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.9rem',
              fontFamily: 'inherit',
            }}
          >
            Sign In
          </button>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '0.6rem 1.5rem',
              background: '#fff',
              color: '#374151',
              border: '1.5px solid #e5e7eb',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.9rem',
              fontFamily: 'inherit',
            }}
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default CommitteeProtectedRoute;
