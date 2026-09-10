import React, { useState, useEffect } from 'react';
import { ApexAuth } from '../services/auth';

export default function LoginPage({ navigate }) {
  const [activeSessionUser, setActiveSessionUser] = useState(null);

  useEffect(() => {
    if (ApexAuth.isAuthenticated()) {
      setActiveSessionUser(ApexAuth.getCurrentUser());
    } else {
      setActiveSessionUser(null);
    }
  }, []);

  // Tab and UI states
  const [activeRole, setActiveRole] = useState('member');
  const [isFlipped, setIsFlipped] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  const mockDatabases = {
    member: {
      email: 'member@apex.com',
      password: 'MemberPass123!',
      name: 'Ethan Hunt'
    },
    trainer: {
      email: 'trainer@apex.com',
      password: 'TrainerPass123!',
      name: 'Marcus Vance'
    }
  };

  const handleRoleSwitch = (role) => {
    setActiveRole(role);
    const preset = mockDatabases[role];
    if (preset) {
      setEmail(preset.email);
      setPassword(preset.password);
    }
    setEmailError('');
    setPasswordError('');
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

    const performLocalAuthCheck = (errorMessage = 'Invalid email or password.') => {
      const mockUser = mockDatabases[activeRole] || mockDatabases.trainer;
      const registeredUsers = JSON.parse(localStorage.getItem('apex_registered_users')) || [];

      const cleanEmail = email.trim().toLowerCase();
      const cleanPass = password.trim();

      // Match registered user by email (case-insensitive)
      const matchedRegisteredUser = registeredUsers.find(
        (u) => u.email && u.email.trim().toLowerCase() === cleanEmail
      );

      let authenticatedUser = null;

      // 1. Check exact mock database match
      if (cleanEmail === mockUser.email.toLowerCase() && cleanPass === mockUser.password) {
        authenticatedUser = {
          email: mockUser.email,
          name: mockUser.name,
          role: activeRole
        };
      }
      // 2. Registered users match (strictly matching password)
      else if (matchedRegisteredUser && matchedRegisteredUser.password === cleanPass) {
        authenticatedUser = {
          email: matchedRegisteredUser.email,
          name: matchedRegisteredUser.name,
          role: matchedRegisteredUser.role || activeRole
        };
      }
      // 3. Check alternative role's mock database
      else {
        const altRole = activeRole === 'trainer' ? 'member' : 'trainer';
        const altMockUser = mockDatabases[altRole];
        if (cleanEmail === altMockUser.email.toLowerCase() && cleanPass === altMockUser.password) {
          authenticatedUser = {
            email: altMockUser.email,
            name: altMockUser.name,
            role: altRole
          };
        }
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
        role: activeRole
      })
    }).then(res => res.json())
      .then(data => {
        if (data.success && data.user) {
          ApexAuth.authenticateUser(data.user.email, data.user.role, data.user.name, rememberMe);
          setIsLoggingIn(false);
          navigate('dashboard');
        } else {
          performLocalAuthCheck(data.message || 'Invalid email or password.');
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

      // Inject debug recovery code in console for user review
      console.log('--- APEX ATHLETICS RECOVERY MOCK ---');
      console.log(`Reset Request Email: ${forgotEmail.trim()}`);
      console.log('Recovery Payload: 127-OTP-BYPASS');
      console.log('Mock Dashboard Entry Key: TrainerPass123!');
      console.log('------------------------------------');
    }, 1500);
  };

  const handleResetBack = () => {
    setIsFlipped(false);
    setForgotEmail('');
    setForgotEmailError('');
    setShowForgotSuccess(false);
  };


  const currentHelper = mockDatabases[activeRole];

  return (
    <div style={{ minHeight: '100vh', background: '#060608', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
      
      {/* Decorative radial glows */}
      <div className="decor-glow ring-1"></div>
      <div className="decor-glow ring-2"></div>

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
          <div className="card-panel panel-front" id="login-panel-front">
            <div className="portal-header">
              <div className="logo" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center' }}>
                MUSCLE<span>HUB</span>
                <div className="logo-dot"></div>
              </div>
              <h2>Portal Login</h2>
              <p>Access your training metrics and scheduling dashboard.</p>
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
                  Currently logged in as <strong style={{ color: 'var(--accent-volt)' }}>{activeSessionUser.name}</strong> (<span style={{ textTransform: 'capitalize' }}>{activeSessionUser.role}</span>)
                </p>
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                  <button
                    type="button"
                    className="glow-btn"
                    style={{ padding: '0.35rem 0.8rem', fontSize: '0.75rem', cursor: 'pointer' }}
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
                    Switch Account / Logout
                  </button>
                </div>
              </div>
            )}

            {/* Role selector tabs */}
            <div className="role-tabs" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
              <button
                type="button"
                className={`role-tab ${activeRole === 'member' ? 'active' : ''}`}
                onClick={() => handleRoleSwitch('member')}
              >
                Member
              </button>
              <button
                type="button"
                className={`role-tab ${activeRole === 'trainer' ? 'active' : ''}`}
                onClick={() => handleRoleSwitch('trainer')}
              >
                Trainer
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleLoginSubmit} id="portal-login-form">
              {/* Email input */}
              <div className="form-group">
                <label className="form-label" htmlFor="login-email">Email Address</label>
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
                    placeholder="Enter your email"
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

              {/* Options row: remember checkbox and help tip wrapper */}
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
                    setEmail(currentHelper.email);
                    setPassword(currentHelper.password);
                  }}
                  style={{ cursor: 'pointer', background: 'rgba(198,255,0,0.06)', padding: '0.3rem 0.6rem', borderRadius: '4px', border: '1px solid rgba(198,255,0,0.2)' }}
                  title="Click to auto-fill credentials"
                >
                  Click to Auto-fill: <strong style={{ color: 'var(--accent-volt)' }}>{currentHelper.email}</strong> / <strong style={{ color: 'var(--accent-cyan)' }}>{currentHelper.password}</strong> ⚡
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                className="glow-btn login-submit-btn"
                id="login-submit-btn"
                disabled={isLoggingIn}
              >
                {isLoggingIn ? 'Authorizing...' : 'Authenticate'}
              </button>
            </form>

            <div className="portal-footer">
              <p style={{ marginBottom: '0.8rem' }}>
                New to MuScLe HuB?{' '}
                <a
                  onClick={() => navigate('register')}
                  style={{ color: 'var(--accent-cyan)', fontWeight: 700, textDecoration: 'underline', cursor: 'pointer' }}
                >
                  Register here
                </a>
              </p>
              <p>MuScLe HuB club access portals. Unauthorized entry is logged.</p>
            </div>
          </div>

          {/* BACK PANEL: FORGOT PASSWORD */}
          <div className="card-panel panel-back" id="login-panel-back">
            <div className="portal-header">
              <h2>Reset Password</h2>
              <p>Enter your email and we'll dispatch a simulated OTP reset link to your inbox.</p>
            </div>

            <form onSubmit={handleForgotSubmit} id="portal-forgot-form">
              <div className="form-group">
                <label className="form-label" htmlFor="forgot-email">Associated Email Address</label>
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
                    placeholder="e.g. john@muscleshub.com"
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
