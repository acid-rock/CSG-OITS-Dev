import React, { useState } from 'react';
import './forgotPassword.css';
import CSGLogo from '../../../assets/CSG_logo.svg';
import Typography from '../../../components/typography/Typography';
import { MdEmail, MdLockOutline } from 'react-icons/md';
import { LuShieldCheck } from "react-icons/lu"; 

const ForgotPassword: React.FC = () => {

    const [step, setStep] = useState<'email' | '2fa' | 'newPassword' | 'success'>('email');

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
            setErrorMessage("Passwords do not match!");
            return;
        }

        setErrorMessage('');
        setStep('success');
    };

    if (step === 'success') {
        return (
            <div className="forgotPassword-container">
                <div className='success-modal'>
                    <div className='success-icon-circle'>
                        <LuShieldCheck size={50} color="white" />
                    </div>
                    <Typography size='text-lg' color='text-dark'>
                        Success!
                    </Typography>
                    <p className="success-subtext">
                        Password Changed Successfully
                    </p>
                    <button className="send-2fa-button" onClick={() => window.location.href = '/bin'}>
                        Close
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="forgotPassword-container">
            <div className='forgotPassword-layout'>
                <div className="logo-wrapper">
                    <div className="logo-circle">
                        <img src={CSGLogo} alt="CSG Logo" className="logo-img" />
                    </div>
                </div>

                <div className='forgotPassword-text'>
                    <Typography size='text-md' color='text-dark'>
                        Online Information Transparency System
                    </Typography>
                </div>

                <div className='forgotPassword-content'>
                    {step === 'email' && (
                        <form onSubmit={handleSend2FA}>
                            <p className='input-label'>Recover Account</p>
                            <div className="input-group">
                                <MdEmail className="input-icon" size={20} />
                                <input type="email" placeholder="Email" className="input-field" required />
                            </div>
                            <button type="submit" className="send-2fa-button">Send 2FA</button>
                        </form>
                    )}

                    {step === '2fa' && (
                        <form onSubmit={handleVerify}>
                            <p className='input-label'>Verification Code</p>
                            <div className="input-group">
                                <MdEmail className="input-icon" size={20} />
                                <input type="number" placeholder="Enter Code" className="input-field" required />
                            </div>
                            <button type="submit" className="send-2fa-button">Verify</button>
                        </form>
                    )}

                    {step === 'newPassword' && (
                        <form onSubmit={handleChangePassword}>
                            <p className='input-label'>Enter New Password</p>
                            
                            <div className="input-group">
                                <MdLockOutline className="input-icon" size={20} />
                                <input 
                                    type="password" 
                                    placeholder="New Password" 
                                    className="input-field" 
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required 
                                />
                            </div>

                            <div className="input-group">
                                <MdLockOutline className="input-icon" size={20} />
                                <input 
                                    type="password" 
                                    placeholder="Confirm Password" 
                                    className="input-field" 
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required 
                                />
                            </div>

                            {errorMessage && <p className="error-text">{errorMessage}</p>}

                            <button type="submit" className="send-2fa-button">
                                Change Password
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;