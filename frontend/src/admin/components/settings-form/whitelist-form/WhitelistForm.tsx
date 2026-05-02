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
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to add whitelist entry.';
      setError(msg);
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
        <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 600 }}>Add to Whitelist</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div className='input-container'>
            <label style={{ fontSize: '0.8rem', color: '#6b7280' }}>Full Name</label>
            <input
              type='text'
              placeholder='e.g. Juan Dela Cruz'
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <div className='input-container'>
            <label style={{ fontSize: '0.8rem', color: '#6b7280' }}>Student ID</label>
            <input
              type='text'
              placeholder='e.g. 2021-00123'
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
            />
          </div>
          <div className='input-container'>
            <label style={{ fontSize: '0.8rem', color: '#6b7280' }}>Email Address</label>
            <input
              type='email'
              placeholder='example@cvsu.edu.ph'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          {error && (
            <p style={{ color: '#dc2626', fontSize: '0.8rem', margin: 0 }}>{error}</p>
          )}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type='submit' disabled={submitting} style={{ flex: 1, padding: '0.45rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 500 }}>
              {submitting ? 'Adding...' : 'Add'}
            </button>
            <button type='button' onClick={close} style={{ flex: 1, padding: '0.45rem', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 6, cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WhitelistForm;
