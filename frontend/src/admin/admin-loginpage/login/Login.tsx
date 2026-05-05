import './login.css';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import axios from 'axios';

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
      await axios.post(
        `${import.meta.env.VITE_API_URL}/user/login`,
        { email, password },
        { withCredentials: true },
      );
      localStorage.setItem('admin_authenticated', '1');
      navigate('/admin');
    } catch (err: any) {
      const message =
        err?.response?.data?.message || 'Login failed. Check your credentials.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='login-container'>
      <div className='login-card'>
        <Link
          to='/'
          style={{
            fontSize: '0.85rem',
            color: '#555',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            marginBottom: '1.5rem',
            textDecoration: 'none',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
          onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
        >
          ← Back to Home
        </Link>
        {/* Logo — centered above card */}
        <div className='logo-wrapper'>
          <img src='/CSG_logo.svg' alt='CSG Logo' className='logo-img' />
        </div>

        {/* Header — centered */}
        <div className='login-header'>
          <h2 className='login-title'>
            Online Information Transparency System
          </h2>
          <p className='login-subtitle'>Account Login</p>
        </div>

        {/* Form */}
        <form className='login-form' onSubmit={handleSubmit}>
          {error && <p className='login-error'>{error}</p>}

          <div className='input-group'>
            <img src='/user-login.png' alt='User' className='input-icon' />
            <input
              type='email'
              placeholder='CvSU Email'
              className='input-field'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className='input-group'>
            <img src='/padlock.png' alt='Lock' className='input-icon' />
            <input
              type='password'
              placeholder='Password'
              className='input-field'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className='form-footer'>
            <Link to='/admin/forgot-password' className='forgot-link'>
              Forgot Password?
            </Link>
          </div>

          <button type='submit' className='sign-in-button' disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
