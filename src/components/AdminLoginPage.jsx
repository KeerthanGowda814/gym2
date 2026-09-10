import React, { useState, useEffect } from 'react';
import { ApexAuth } from '../services/auth';

export default function AdminLoginPage({ navigate }) {
  const [activeSessionUser, setActiveSessionUser] = useState(null);

  useEffect(() => {
    if (ApexAuth.isAuthenticated()) {
      setActiveSessionUser(ApexAuth.getCurrentUser());
    } else {
      setActiveSessionUser(null);
    }
  }, []);

  // UI states
  const [isFlipped, setIsFlipped] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  // Form states
  const [email, setEmail] = useState('adminmuscle@gmail.com');
  const [password, setPassword] = useState('admin@1234');
  const [rememberMe, setRememberMe] = useState(true);
  const [forgotEmail, setForgotEmail] = useState('');

  // Loading/Transmitting states
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [showForgotSuccess, setShowForgotSuccess] = useState(false);

  // Error states
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [forgotEmailError, setForgotEmailError] = useState('');

  const mockAdmin = {
    email: 'adminmuscle@gmail.com',
    password: 'admin@1234',
    name: 'System Admin'
  };

  const isValidEmail = (val) => {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(val);
  };

  const handleEmailChange = (val) => {
    setEmail(val);
    if (!val.trim()) {
      setEmailError('Email address is required.');
    } else if (!isValidEmail(val.trim())) {
      setEmailError('Invalid email syntax.');
    } else {
      setEmailError('');
    }
  };

  const handleEmailBlur = () => {
    if (!email.trim()) {
      setEmailError('Email address is required.');
    } else if (!isValidEmail(email.trim())) {
      setEmailError('Invalid email syntax.');
    }
  };

  const handlePasswordChange = (val) => {
    setPassword(val);
    if (!val) {
      setPasswordError('Password is required.');
    } else if (val.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
    } else {
      setPasswordError('');
    }
  };

  const handlePasswordBlur = () => {
    if (!password) {
      setPasswordError('Password is required.');
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
    }
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    let isFormValid = true;

    // Reset validations
    setEmailError('');
    setPasswordError('');

    if (!email.trim()) {
      setEmailError('Email address is required.');
      isFormValid = false;
    } else if (!isValidEmail(email.trim())) {
      setEmailError('Invalid email syntax.');
      isFormValid = false;
    }

    if (!password) {
      setPasswordError('Password is required.');
      isFormValid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      isFormValid = false;
    }

    if (!isFormValid) return;

    setIsLoggingIn(true);

    const performLocalAuthCheck = (errorMessage = 'Invalid admin credentials. Access denied.') => {
      const cleanEmail = email.trim().toLowerCase();
      const cleanPass = password.trim();

      let authenticatedUser = null;

      // Check exact admin match strictly
      if (cleanEmail === mockAdmin.email.toLowerCase() && cleanPass === mockAdmin.password) {
        authenticatedUser = {
          email: mockAdmin.email,
          name: mockAdmin.name,
          role: 'admin'
        };
      }

      if (authenticatedUser) {
        ApexAuth.authenticateUser(authenticatedUser.email, authenticatedUser.role, authenticatedUser.name, rememberMe);
        setIsLoggingIn(false);
        navigate('dashboard');
      } else {
        setIsLoggingIn(false);
        setPasswordError(errorMessage);
      }
    };

    // Authenticate via MongoDB Atlas API Backend
    fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.trim(),
        password,
        role: 'admin'
      })
    }).then(res => res.json())
      .then(data => {
        if (data.success && data.user && data.user.email.toLowerCase() === 'adminmuscle@gmail.com') {
          ApexAuth.authenticateUser(data.user.email, data.user.role, data.user.name, rememberMe);
          setIsLoggingIn(false);
          navigate('dashboard');
        } else {
          performLocalAuthCheck(data.message || 'Invalid admin credentials. Access denied.');
        }
      })
      .catch(() => {
        performLocalAuthCheck();
      });
  };

  const handleForgotSubmit = (e) => {
    e.preventDefault();
    setForgotEmailError('');

    if (!forgotEmail.trim()) {
      setForgotEmailError('Email address is required.');
      return;
    } else if (!isValidEmail(forgotEmail.trim())) {
      setForgotEmailError('Invalid email syntax.');
      return;
    }

    setIsSendingReset(true);
    setTimeout(() => {
      setIsSendingReset(false);
      setShowForgotSuccess(true);

      console.log('--- APEX ATHLETICS ADMIN RECOVERY MOCK ---');
      console.log(`Reset Request Email: ${forgotEmail.trim()}`);
      console.log('Recovery Payload: 127-OTP-BYPASS');
      console.log('Mock Dashboard Entry Key: AdminPass123!');
      console.log('------------------------------------------');
    }, 1500);
  };

  const handleResetBack = () => {
    setIsFlipped(false);
    setForgotEmail('');
    setForgotEmailError('');
    setShowForgotSuccess(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#060608', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
      
      {/* Decorative radial glows */}
      <div className="decor-glow ring-1" style={{ background: 'var(--accent-cyan)' }}></div>
      <div className="decor-glow ring-2" style={{ background: 'var(--accent-volt)' }}></div>

      {/* Return to main site back link */}
      <a href="#/" onClick={(e) => { e.preventDefault(); navigate('home'); }} className="portal-back-link" style={{ cursor: 'pointer' }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Return to Main Site
      </a>

      {/* 3D Card wrapper */}
      <div className="login-wrapper">
        <div className={`login-card ${isFlipped ? 'flipped' : ''}`} id="login-card-container">
          
          {/* FRONT PANEL: LOGIN FORM */}
          <div className="card-panel panel-front" id="login-panel-front" style={{ border: '1px solid rgba(0, 240, 255, 0.3)' }}>
            <div className="portal-header">
              <div className="logo" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center' }}>
                MUSCLE<span>HUB</span>
                <span style={{ fontSize: '0.75rem', background: 'var(--accent-cyan)', color: '#000', padding: '0.1rem 0.4rem', borderRadius: '4px', marginLeft: '0.2rem', fontWeight: 800 }}>ADMIN</span>
              </div>
              <h2>Admin Portal</h2>
              <p>System Administrator access console.</p>
            </div>

            {/* Active Session Notification Banner */}
            {activeSessionUser && (
              <div style={{
                background: 'rgba(0, 240, 255, 0.08)',
                border: '1px solid var(--accent-cyan)',
                borderRadius: '8px',
                padding: '0.8rem 1rem',
                marginBottom: '1rem',
                textAlign: 'center'
              }}>
                <p style={{ color: 'var(--text-white)', fontSize: '0.82rem', margin: '0 0 0.5rem 0' }}>
                  Currently logged in as <strong style={{ color: 'var(--accent-cyan)' }}>{activeSessionUser.name}</strong> (<span style={{ textTransform: 'capitalize' }}>{activeSessionUser.role}</span>)
                </p>
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                  <button
                    type="button"
                    className="glow-btn"
                    style={{ padding: '0.35rem 0.8rem', fontSize: '0.75rem', cursor: 'pointer', background: 'var(--accent-cyan)', boxShadow: '0 0 10px rgba(0, 240, 255, 0.4)', color: '#000' }}
                    onClick={() => navigate('dashboard')}
                  >
                    Go to Dashboard →
                  </button>
                  <button
                    type="button"
                    className="outline-btn"
                    style={{ padding: '0.35rem 0.8rem', fontSize: '0.75rem', borderColor: '#ff3e6c', color: '#ff3e6c', cursor: 'pointer' }}
                    onClick={() => {
                      ApexAuth.logout();
                      setActiveSessionUser(null);
                    }}
                  >
                    Logout / Switch
                  </button>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleLoginSubmit} id="portal-login-form">
              {/* Email input */}
              <div className="form-group">
                <label className="form-label" htmlFor="login-email">Admin Email Address</label>
                <div className="input-icon-wrapper">
                  <span className="field-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </span>
                  <input
                    type="email"
                    id="login-email"
                    className={`form-input ${emailError ? 'invalid' : ''}`}
                    placeholder="admin@apex.com"
                    value={email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    onBlur={handleEmailBlur}
                  />
                </div>
                {emailError && <div className="error-feedback" id="email-error" style={{ display: 'block' }}>{emailError}</div>}
              </div>

              {/* Password input */}
              <div className="form-group">
                <div className="form-label-row">
                  <label className="form-label" htmlFor="login-password">Password</label>
                  <button
                    type="button"
                    className="forgot-link-btn"
                    id="trigger-forgot-panel"
                    onClick={() => setIsFlipped(true)}
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="input-icon-wrapper">
                  <span className="field-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </span>
                  <input
                    type={isPasswordVisible ? 'text' : 'password'}
                    id="login-password"
                    className={`form-input ${passwordError ? 'invalid' : ''}`}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    onBlur={handlePasswordBlur}
                  />
                  <button
                    type="button"
                    className="toggle-password-btn"
                    id="toggle-password-visibility"
                    onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                  >
                    {isPasswordVisible ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {passwordError && <div className="error-feedback" id="password-error" style={{ display: 'block' }}>{passwordError}</div>}
              </div>

              {/* Options row */}
              <div className="form-options">
                <label className="remember-me-label">
                  <input
                    type="checkbox"
                    id="login-remember"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span className="checkbox-box"></span>
                  Remember Me
                </label>
                
                <div
                  className="form-credential-helper"
                  onClick={() => {
                    setEmail(mockAdmin.email);
                    setPassword(mockAdmin.password);
                  }}
                  style={{ cursor: 'pointer', background: 'rgba(0, 240, 255, 0.06)', padding: '0.3rem 0.6rem', borderRadius: '4px', border: '1px solid rgba(0, 240, 255, 0.2)' }}
                  title="Click to auto-fill credentials"
                >
                  Auto-fill: <strong style={{ color: 'var(--accent-cyan)' }}>{mockAdmin.email}</strong> ⚡
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                className="glow-btn login-submit-btn"
                id="login-submit-btn"
                style={{ background: 'var(--accent-cyan)', boxShadow: '0 0 15px rgba(0, 240, 255, 0.2)', color: '#000' }}
                disabled={isLoggingIn}
              >
                {isLoggingIn ? 'Authorizing Console...' : 'Authenticate Console'}
              </button>
            </form>

            <div className="portal-footer">
              <p>MuScLe HuB admin console. Unauthorized entry is logged.</p>
            </div>
          </div>

          {/* BACK PANEL: FORGOT PASSWORD */}
          <div className="card-panel panel-back" id="login-panel-back">
            <div className="portal-header">
              <h2>Reset Password</h2>
              <p>Enter your admin email and we'll dispatch a simulated OTP reset link to your inbox.</p>
            </div>

            <form onSubmit={handleForgotSubmit} id="portal-forgot-form">
              <div className="form-group">
                <label className="form-label" htmlFor="forgot-email">Associated Admin Email</label>
                <div className="input-icon-wrapper">
                  <span className="field-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </span>
                  <input
                    type="email"
                    id="forgot-email"
                    className={`form-input ${forgotEmailError ? 'invalid' : ''}`}
                    placeholder="admin@muscleshub.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                  />
                </div>
                {forgotEmailError && <div className="error-feedback" id="forgot-email-error" style={{ display: 'block' }}>{forgotEmailError}</div>}
              </div>

              <button
                type="submit"
                className="glow-btn login-submit-btn"
                id="forgot-submit-btn"
                style={{ background: 'var(--accent-cyan)', color: '#000' }}
                disabled={isSendingReset}
              >
                {isSendingReset ? 'Transmitting...' : 'Send Reset Instructions'}
              </button>
              
              <button
                type="button"
                className="outline-btn login-submit-btn"
                id="trigger-login-panel"
                style={{ marginTop: '1rem' }}
                onClick={handleResetBack}
              >
                Back to Sign In
              </button>
            </form>

            {/* SUCCESS STATE OVERLAY */}
            <div className={`forgot-success-state ${showForgotSuccess ? 'active' : ''}`} id="forgot-success-state">
              <div className="success-icon-wrapper" style={{ borderColor: 'var(--accent-cyan)', color: 'var(--accent-cyan)', background: 'rgba(0, 240, 255, 0.05)', boxShadow: 'var(--glow-cyan)', margin: '0 auto 1.5rem auto' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3>Instructions Dispatched</h3>
              <p>A verification bypass payload has been simulated for testing. Please check console outputs for security bypass links.</p>
              <button
                type="button"
                className="glow-btn"
                id="forgot-success-back-btn"
                style={{ width: '100%' }}
                onClick={handleResetBack}
              >
                Return
              </button>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
