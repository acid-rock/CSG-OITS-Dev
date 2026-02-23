import React from 'react';
import './login.css';
import { User, Lock } from 'lucide-react'; 
import { Link } from 'react-router-dom';
import CSGLogo from '../../../assets/CSG_logo.svg';
import Typography from '../../../components/typography/Typography.tsx';

const Login: React.FC = () => {
  return (
    <div className="login-container">
      <div className="login-layout">

        <div className="logo-wrapper">
          <div className="logo-circle">
            <img src={CSGLogo} alt="CSG Logo" className="logo-img" />
          </div>
        </div>

        <div className="login-text">
          <Typography size='text-md' color='text-dark'>
            Online Information Transparency System
          </Typography>
          <div className='login-sub-text'>
            <Typography size='text-sm' color='text-nonbold'>
              Account Login
            </Typography>
          </div>
        </div>

        <div className="login-content">
          <form onSubmit={(e) => e.preventDefault()}>
            <div className="input-group">
              <User className="input-icon" size={20} />
              <input type="email" placeholder="Cvsu Email" className="input-field" />
            </div>

            <div className="input-group">
              <Lock className="input-icon" size={20} />
              <input type="password" placeholder="Password" className="input-field" />
            </div>

            <div className="form-footer">
              <Link to="/forgotPassword" color="primary" className="forgot-link">
                Forgot Password?
              </Link>
            </div>

            <button type="submit" className="sign-in-button">
              Sign In
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;