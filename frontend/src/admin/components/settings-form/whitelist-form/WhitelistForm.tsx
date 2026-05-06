import './whitelistform.css';
import { useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL as string;

interface WhitelistProps {
  close: () => void;
  onSuccess?: () => void;
}

const WhitelistForm = ({ close, onSuccess }: WhitelistProps) => {
  const [fullName, setFullName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() && !studentId.trim()) {
      setError('Please provide at least an email address or student ID.');
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(
        `${API_URL}/user/whitelist`,
        {
          full_name: fullName.trim() || undefined,
          student_id: studentId.trim() || undefined,
          email: email.trim() || undefined,
        },
        { withCredentials: true },
      );
      setFullName('');
      setStudentId('');
      setEmail('');
      onSuccess?.();
      close();
    } catch (err: unknown) {
      const raw =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        (err instanceof Error ? err.message : '') ?? '';
      const friendly = raw.includes('row-level security')
        ? 'Permission denied. Contact your system administrator.'
        : raw || 'Failed to add whitelist entry.';
      setError(friendly);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div onClick={close} className='whitelist-overlay'>
      <div
        className='whitelist-form-container'
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ margin: '0 0 1.25rem', fontSize: '1.1rem', fontWeight: 600 }}>Add to Whitelist</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
          <div className='input-container'>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.35rem', color: '#555' }}>Full Name</label>
            <input
              type='text'
              placeholder='e.g. Juan Dela Cruz'
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <div className='input-container'>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.35rem', color: '#555' }}>Student ID</label>
            <input
              type='text'
              placeholder='e.g. 2021-00123'
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
            />
          </div>
          <div className='input-container'>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.35rem', color: '#555' }}>Email Address</label>
            <input
              type='email'
              placeholder='example@cvsu.edu.ph'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          {error && (
            <p style={{ color: '#dc2626', fontSize: '0.8rem', margin: '0 0 0.5rem' }}>{error}</p>
          )}
          <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem' }}>
            <button type='submit' disabled={submitting} style={{ flex: 1, padding: '0.5rem 0.75rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 500, fontSize: '0.9rem' }}>
              {submitting ? 'Adding...' : 'Add'}
            </button>
            <button type='button' onClick={close} style={{ flex: 1, padding: '0.5rem 0.75rem', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 6, cursor: 'pointer', fontSize: '0.9rem' }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WhitelistForm;
