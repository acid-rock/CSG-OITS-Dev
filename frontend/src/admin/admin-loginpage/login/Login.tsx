import './login.css';
import { Link } from 'react-router-dom';

const Login = () => {
  return (
    <div className='login-container'>
      <div className='login-card'>
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
        <form className='login-form' onSubmit={(e) => e.preventDefault()}>
          <div className='input-group'>
            <img src='/user-login.png' alt='User' className='input-icon' />
            <input
              type='email'
              placeholder='CvSU Email'
              className='input-field'
            />
          </div>

          <div className='input-group'>
            <img src='/padlock.png' alt='Lock' className='input-icon' />
            <input
              type='password'
              placeholder='Password'
              className='input-field'
            />
          </div>

          <div className='form-footer'>
            <Link to='/admin/forgot-password' className='forgot-link'>
              Forgot Password?
            </Link>
          </div>

          <button type='submit' className='sign-in-button'>
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
