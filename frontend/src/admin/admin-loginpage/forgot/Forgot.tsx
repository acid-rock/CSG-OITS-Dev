import React, { useState } from 'react';
import './forgot.css';

const Forgot: React.FC = () => {
  const [step, setStep] = useState<'email' | '2fa' | 'newPassword' | 'success'>(
    'email'
  );

  const handleSend2FA = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('2fa');
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('newPassword');
  };

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match!');
      return;
    }

    setErrorMessage('');
    setStep('success');
  };

  if (step === 'success') {
    return (
      <div className='forgotPassword-container'>
        <div className='success-modal'>
          <div className='success-icon-circle'>
            <svg
              width='50'
              height='50'
              viewBox='0 0 24 24'
              fill='none'
              xmlns='http://www.w3.org/2000/svg'
            >
              <path
                d='M12 2C10.0222 2 8.08879 2.58649 6.4443 3.6853C4.79981 4.78412 3.51809 6.3459 2.76121 8.17317C2.00433 10.0004 1.8063 12.0111 2.19215 13.9509C2.578 15.8907 3.53041 17.6725 4.92894 19.0711C6.32746 20.4696 8.10929 21.422 10.0491 21.8079C11.9889 22.1937 13.9996 21.9957 15.8268 21.2388C17.6541 20.4819 19.2159 19.2002 20.3147 17.5557C21.4135 15.9112 22 13.9778 22 12C22 10.6868 21.7413 9.38642 21.2388 8.17317C20.7363 6.95991 19.9997 5.85752 19.0711 4.92893C18.1425 4.00035 17.0401 3.26375 15.8268 2.7612C14.6136 2.25866 13.3132 2 12 2ZM16.707 9.707L11.414 15L8.707 12.293C8.5184 12.1108 8.4105 11.8618 8.4077 11.6018C8.4049 11.3418 8.5075 11.0906 8.6923 10.9042C8.8771 10.7178 9.1281 10.6126 9.3881 10.6098C9.6481 10.607 9.9007 10.7068 10.09 10.893L11.414 12.207L15.293 8.293C15.4816 8.11084 15.7342 8.01005 15.9964 8.01233C16.2586 8.0146 16.5094 8.11977 16.6948 8.30518C16.8802 8.49059 16.9854 8.7414 16.9877 9.00362C16.99 9.26584 16.8892 9.51838 16.707 9.707Z'
                fill='white'
              />
            </svg>
          </div>
          <h2 className='success-title'>Success!</h2>
          <p className='success-subtext'>Password Changed Successfully</p>
          <button
            className='send-2fa-button'
            onClick={() => (window.location.href = '/bin')}
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='forgotPassword-container'>
      <div className='forgotPassword-layout'>
        <div className='logo-wrapper'>
          <div className='logo-circle'>
            <img src='/CSG_logo.svg' alt='CSG Logo' className='logo-img' />
          </div>
        </div>

        <div className='forgotPassword-text'>
          <h2 className='forgotPassword-title'>
            Online Information Transparency System
          </h2>
        </div>

        <div className='forgotPassword-content'>
          {step === 'email' && (
            <form onSubmit={handleSend2FA}>
              <p className='input-label'>Recover Account</p>
              <div className='input-group'>
                <svg
                  className='input-icon'
                  width='20'
                  height='20'
                  viewBox='0 0 24 24'
                  fill='none'
                  xmlns='http://www.w3.org/2000/svg'
                >
                  <path
                    d='M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  />
                  <path
                    d='M22 6L12 13L2 6'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  />
                </svg>
                <input
                  type='email'
                  placeholder='Email'
                  className='input-field'
                  required
                />
              </div>
              <button type='submit' className='send-2fa-button'>
                Send 2FA
              </button>
            </form>
          )}

          {step === '2fa' && (
            <form onSubmit={handleVerify}>
              <p className='input-label'>Verification Code</p>
              <div className='input-group'>
                <svg
                  className='input-icon'
                  width='20'
                  height='20'
                  viewBox='0 0 24 24'
                  fill='none'
                  xmlns='http://www.w3.org/2000/svg'
                >
                  <path
                    d='M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  />
                  <path
                    d='M22 6L12 13L2 6'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  />
                </svg>
                <input
                  type='number'
                  placeholder='Enter Code'
                  className='input-field'
                  required
                />
              </div>
              <button type='submit' className='send-2fa-button'>
                Verify
              </button>
            </form>
          )}

          {step === 'newPassword' && (
            <form onSubmit={handleChangePassword}>
              <p className='input-label'>Enter New Password</p>

              <div className='input-group'>
                <svg
                  className='input-icon'
                  width='20'
                  height='20'
                  viewBox='0 0 24 24'
                  fill='none'
                  xmlns='http://www.w3.org/2000/svg'
                >
                  <path
                    d='M19 11H5C3.89543 11 3 11.8954 3 13V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V13C21 11.8954 20.1046 11 19 11Z'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  />
                  <path
                    d='M7 11V7C7 5.67392 7.52678 4.40215 8.46447 3.46447C9.40215 2.52678 10.6739 2 12 2C13.3261 2 14.5979 2.52678 15.5355 3.46447C16.4732 4.40215 17 5.67392 17 7V11'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  />
                </svg>
                <input
                  type='password'
                  placeholder='New Password'
                  className='input-field'
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>

              <div className='input-group'>
                <svg
                  className='input-icon'
                  width='20'
                  height='20'
                  viewBox='0 0 24 24'
                  fill='none'
                  xmlns='http://www.w3.org/2000/svg'
                >
                  <path
                    d='M19 11H5C3.89543 11 3 11.8954 3 13V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V13C21 11.8954 20.1046 11 19 11Z'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  />
                  <path
                    d='M7 11V7C7 5.67392 7.52678 4.40215 8.46447 3.46447C9.40215 2.52678 10.6739 2 12 2C13.3261 2 14.5979 2.52678 15.5355 3.46447C16.4732 4.40215 17 5.67392 17 7V11'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  />
                </svg>
                <input
                  type='password'
                  placeholder='Confirm Password'
                  className='input-field'
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              {errorMessage && <p className='error-text'>{errorMessage}</p>}

              <button type='submit' className='send-2fa-button'>
                Change Password
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Forgot;
