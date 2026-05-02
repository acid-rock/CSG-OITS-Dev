import { useState } from 'react';
import axios from 'axios';
import { Eye, EyeOff } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL as string;

const PasswordForm = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [errors, setErrors] = useState<{ current?: string; new?: string; confirm?: string }>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const e: typeof errors = {};
    if (!currentPassword) e.current = 'Current password is required.';
    if (!newPassword) e.new = 'New password is required.';
    else if (newPassword.length < 8) e.new = 'Must be at least 8 characters.';
    if (!confirmPassword) e.confirm = 'Please confirm your new password.';
    else if (confirmPassword !== newPassword) e.confirm = 'Passwords do not match.';
    return e;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setApiError(null);
    setSuccess(false);

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    setSubmitting(true);

    try {
      await axios.post(
        `${API_URL}/user/change-password`,
        { current_password: currentPassword, new_password: newPassword, confirm_password: confirmPassword },
        { withCredentials: true },
      );
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccess(true);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to change password.';
      setApiError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const fieldStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  };

  const inputWrap: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    border: '1px solid #d1d5db',
    borderRadius: 6,
    overflow: 'hidden',
  };

  const inputStyle: React.CSSProperties = {
    flex: 1,
    padding: '0.45rem 0.6rem',
    border: 'none',
    outline: 'none',
    fontSize: '0.875rem',
  };

  const eyeBtn: React.CSSProperties = {
    background: 'none',
    border: 'none',
    padding: '0 0.5rem',
    cursor: 'pointer',
    color: '#9ca3af',
    display: 'flex',
    alignItems: 'center',
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 400 }}>
      {apiError && (
        <p style={{ color: '#dc2626', fontSize: '0.875rem', margin: 0, background: '#fee2e2', padding: '0.5rem 0.75rem', borderRadius: 6 }}>
          {apiError}
        </p>
      )}
      {success && (
        <p style={{ color: '#16a34a', fontSize: '0.875rem', margin: 0, background: '#dcfce7', padding: '0.5rem 0.75rem', borderRadius: 6 }}>
          Password changed successfully.
        </p>
      )}

      <div style={fieldStyle}>
        <label style={{ fontSize: '0.85rem', fontWeight: 500, color: '#374151' }}>Current Password</label>
        <div style={inputWrap}>
          <input
            type={showCurrent ? 'text' : 'password'}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            style={inputStyle}
            placeholder='Enter current password'
          />
          <button type='button' style={eyeBtn} onClick={() => setShowCurrent(!showCurrent)} aria-label='Toggle visibility'>
            {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {errors.current && <span style={{ color: '#dc2626', fontSize: '0.78rem' }}>{errors.current}</span>}
      </div>

      <div style={fieldStyle}>
        <label style={{ fontSize: '0.85rem', fontWeight: 500, color: '#374151' }}>New Password</label>
        <div style={inputWrap}>
          <input
            type={showNew ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            style={inputStyle}
            placeholder='At least 8 characters'
          />
          <button type='button' style={eyeBtn} onClick={() => setShowNew(!showNew)} aria-label='Toggle visibility'>
            {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {errors.new && <span style={{ color: '#dc2626', fontSize: '0.78rem' }}>{errors.new}</span>}
      </div>

      <div style={fieldStyle}>
        <label style={{ fontSize: '0.85rem', fontWeight: 500, color: '#374151' }}>Confirm New Password</label>
        <div style={inputWrap}>
          <input
            type={showConfirm ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            style={inputStyle}
            placeholder='Repeat new password'
          />
          <button type='button' style={eyeBtn} onClick={() => setShowConfirm(!showConfirm)} aria-label='Toggle visibility'>
            {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {errors.confirm && <span style={{ color: '#dc2626', fontSize: '0.78rem' }}>{errors.confirm}</span>}
      </div>

      <button
        type='button'
        disabled={submitting}
        onClick={() => handleSubmit()}
        style={{ padding: '0.5rem 1.5rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 500, fontSize: '0.9rem', alignSelf: 'flex-start' }}
      >
        {submitting ? 'Saving...' : 'Change Password'}
      </button>
    </form>
  );
};

export default PasswordForm;
