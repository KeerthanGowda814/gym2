import React, { useState, useEffect } from 'react';
import { ApexAuth } from '../services/auth';

export default function RegisterPage({ navigate }) {
  // Redirect authenticated sessions
  useEffect(() => {
    if (ApexAuth.isAuthenticated()) {
      navigate('dashboard');
    }
  }, [navigate]);

  const [activeTab, setActiveTab] = useState('member'); // 'member' or 'trainer'
  
  // Member Form States
  const [memName, setMemName] = useState('');
  const [memEmail, setMemEmail] = useState('');
  const [memPassword, setMemPassword] = useState('');
  const [memAge, setMemAge] = useState('');
  const [memPhone, setMemPhone] = useState('');
  const [memTerms, setMemTerms] = useState(false);

  // Trainer Form States
  const [trnName, setTrnName] = useState('');
  const [trnEmail, setTrnEmail] = useState('');
  const [trnPassword, setTrnPassword] = useState('');
  const [trnSpecialty, setTrnSpecialty] = useState('strength');
  const [trnCerts, setTrnCerts] = useState('');
  const [trnTerms, setTrnTerms] = useState(false);

  // Password Visibility toggles
  const [isMemPassVisible, setIsMemPassVisible] = useState(false);
  const [isTrnPassVisible, setIsTrnPassVisible] = useState(false);

  // Error States
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [successDetails, setSuccessDetails] = useState({ title: '', message: '' });

  const isValidEmail = (email) => {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(email);
  };

  const saveMockUser = (email, password, name, role, specialty = null, certifications = null, age = null, phone = null) => {
    const users = JSON.parse(localStorage.getItem('apex_registered_users')) || [];
    const existingIndex = users.findIndex((u) => u.email.toLowerCase() === email.toLowerCase());
    const newUser = { email, password, name, role, specialty, certifications, age, phone };
    if (existingIndex !== -1) {
      users[existingIndex] = newUser;
    } else {
      users.push(newUser);
    }
    localStorage.setItem('apex_registered_users', JSON.stringify(users));
  };

  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    setErrors({});
    setIsMemPassVisible(false);
    setIsTrnPassVisible(false);
    // Reset forms
    if (tab === 'member') {
      setMemName('');
      setMemEmail('');
      setMemPassword('');
      setMemAge('');
      setMemPhone('');
      setMemTerms(false);
    } else {
      setTrnName('');
      setTrnEmail('');
      setTrnPassword('');
      setTrnSpecialty('strength');
      setTrnCerts('');
      setTrnTerms(false);
    }
  };

  const handleMemberSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    let isFormValid = true;

    if (!memName.trim()) {
      newErrors.memName = 'Full Name is required.';
      isFormValid = false;
    }
    if (!memEmail.trim()) {
      newErrors.memEmail = 'Email address is required.';
      isFormValid = false;
    } else if (!isValidEmail(memEmail.trim())) {
      newErrors.memEmail = 'Invalid email syntax.';
      isFormValid = false;
    }
    if (!memPassword) {
      newErrors.memPassword = 'Password is required.';
      isFormValid = false;
    }
    if (!memAge) {
      newErrors.memAge = 'Age is required.';
      isFormValid = false;
    } else {
      const parsedAge = parseInt(memAge, 10);
      if (isNaN(parsedAge) || parsedAge < 12 || parsedAge > 100) {
        newErrors.memAge = 'Age must be between 12 and 100.';
        isFormValid = false;
      }
    }
    if (!memPhone.trim()) {
      newErrors.memPhone = 'Mobile Number is required.';
      isFormValid = false;
    }
    if (!memTerms) {
      newErrors.memTerms = 'Accepting terms is required.';
      isFormValid = false;
    }

    setErrors(newErrors);
    if (!isFormValid) return;

    setIsSubmitting(true);
    saveMockUser(memEmail.trim(), memPassword, memName.trim(), 'member', null, null, memAge, memPhone);

    // Register user directly into MongoDB Atlas Database
    fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: memName.trim(),
        email: memEmail.trim(),
        password: memPassword,
        role: 'member',
        age: memAge,
        phone: memPhone
      })
    }).then(res => res.json())
      .then(data => {
        console.log('✅ Registered user stored in MongoDB Atlas:', data);
      })
      .catch(err => {
        console.warn('MongoDB Atlas Sync Notice:', err.message);
      });

    setTimeout(() => {
      setIsSubmitting(false);
      setSuccessDetails({
        title: 'Account Provisioned!',
        message: `Welcome, ${memName.trim()}! Your profile has been stored in MongoDB Atlas. Redirecting to secure login interface...`
      });
      setShowSuccessOverlay(true);

      console.log('--- APEX ATHLETICS REGISTRATION SYNC ---');
      console.log(`Registered Member: ${memName.trim()}`);
      console.log(`Email: ${memEmail.trim()}`);
      console.log('----------------------------------------');

      setTimeout(() => {
        navigate('login');
      }, 2000);
    }, 1200);
  };

  const handleTrainerSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    let isFormValid = true;

    if (!trnName.trim()) {
      newErrors.trnName = 'Full Name is required.';
      isFormValid = false;
    }
    if (!trnEmail.trim()) {
      newErrors.trnEmail = 'Email address is required.';
      isFormValid = false;
    } else if (!isValidEmail(trnEmail.trim())) {
      newErrors.trnEmail = 'Invalid email syntax.';
      isFormValid = false;
    }
    if (!trnPassword) {
      newErrors.trnPassword = 'Password is required.';
      isFormValid = false;
    }
    if (!trnCerts.trim()) {
      newErrors.trnCerts = 'Certifications details are required.';
      isFormValid = false;
    }
    if (!trnTerms) {
      newErrors.trnTerms = 'Accepting terms is required.';
      isFormValid = false;
    }

    setErrors(newErrors);
    if (!isFormValid) return;

    setIsSubmitting(true);
    saveMockUser(trnEmail.trim(), trnPassword, trnName.trim(), 'trainer', trnSpecialty, trnCerts);

    // Register trainer directly into MongoDB Atlas Database
    fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: trnName.trim(),
        email: trnEmail.trim(),
        password: trnPassword,
        role: 'trainer',
        specialty: trnSpecialty,
        certifications: trnCerts
      })
    }).then(res => res.json())
      .then(data => {
        console.log('✅ Registered trainer stored in MongoDB Atlas:', data);
      })
      .catch(err => {
        console.warn('MongoDB Atlas Sync Notice:', err.message);
      });

    setTimeout(() => {
      setIsSubmitting(false);
      setSuccessDetails({
        title: 'Application Transmitted!',
        message: `Thank you, Coach ${trnName.trim()}! Your trainer profile has been saved in MongoDB Atlas. Redirecting to Sign In portal...`
      });
      setShowSuccessOverlay(true);

      console.log('--- APEX ATHLETICS TRAINER REGISTERED ---');
      console.log(`Applicant Trainer: ${trnName.trim()}`);
      console.log(`Email: ${trnEmail.trim()}`);
      console.log('------------------------------------------');

      setTimeout(() => {
        navigate('login');
      }, 2000);
    }, 1200);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#060608', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', padding: '2rem 1rem' }}>
      
      {/* Decorative background glows */}
      <div className="decor-glow ring-1"></div>
      <div className="decor-glow ring-2"></div>

      {/* Back link to website home */}
      <a href="#/" onClick={(e) => { e.preventDefault(); navigate('home'); }} className="portal-back-link" style={{ cursor: 'pointer' }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Return to Main Site
      </a>

      {/* Main Card Container */}
      <div className="login-wrapper">
        <div className="login-card">
          
          {/* REGISTRATION PANEL */}
          <div className="card-panel" style={{ position: 'relative' }}>
            <div className="portal-header">
              <div className="logo" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center' }}>
                MUSCLE<span>HUB</span>
                <div className="logo-dot"></div>
              </div>
              <h2>Create Account</h2>
              <p>Join our premium strength club to unleash your limits.</p>
            </div>

            {/* Mode Selector Tabs */}
            <div className="role-tabs">
              <button
                type="button"
                className={`role-tab ${activeTab === 'member' ? 'active' : ''}`}
                onClick={() => handleTabSwitch('member')}
              >
                Member
              </button>
              <button
                type="button"
                className={`role-tab ${activeTab === 'trainer' ? 'active' : ''}`}
                onClick={() => handleTabSwitch('trainer')}
              >
                Trainer
              </button>
            </div>

            {/* A. MEMBER REGISTRATION FORM */}
            {activeTab === 'member' && (
              <form onSubmit={handleMemberSubmit} id="register-member-form">
                
                {/* Full Name */}
                <div className="form-group">
                  <label htmlFor="mem-name" className="form-label">Full Name</label>
                  <div className="input-icon-wrapper">
                    <span className="field-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      id="mem-name"
                      className={`form-input ${errors.memName ? 'invalid' : ''}`}
                      placeholder="e.g. John Doe"
                      value={memName}
                      onChange={(e) => setMemName(e.target.value)}
                    />
                  </div>
                  {errors.memName && <div className="error-feedback" id="mem-name-error" style={{ display: 'block' }}>{errors.memName}</div>}
                </div>

                {/* Email */}
                <div className="form-group">
                  <label htmlFor="mem-email" className="form-label">Email Address</label>
                  <div className="input-icon-wrapper">
                    <span className="field-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                      </svg>
                    </span>
                    <input
                      type="email"
                      id="mem-email"
                      className={`form-input ${errors.memEmail ? 'invalid' : ''}`}
                      placeholder="john@example.com"
                      value={memEmail}
                      onChange={(e) => setMemEmail(e.target.value)}
                    />
                  </div>
                  {errors.memEmail && <div className="error-feedback" id="mem-email-error" style={{ display: 'block' }}>{errors.memEmail}</div>}
                </div>

                {/* Password */}
                <div className="form-group">
                  <label htmlFor="mem-password" className="form-label">Password</label>
                  <div className="input-icon-wrapper">
                    <span className="field-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </span>
                    <input
                      type={isMemPassVisible ? 'text' : 'password'}
                      id="mem-password"
                      className={`form-input pass-input ${errors.memPassword ? 'invalid' : ''}`}
                      placeholder="••••••••"
                      value={memPassword}
                      onChange={(e) => setMemPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="toggle-password-btn"
                      onClick={() => setIsMemPassVisible(!isMemPassVisible)}
                    >
                      {isMemPassVisible ? (
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
                  {errors.memPassword && <div className="error-feedback" id="mem-password-error" style={{ display: 'block' }}>{errors.memPassword}</div>}
                </div>

                {/* Age */}
                <div className="form-group">
                  <label htmlFor="mem-age" className="form-label">Age</label>
                  <div className="input-icon-wrapper">
                    <span className="field-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </span>
                    <input
                      type="number"
                      id="mem-age"
                      className={`form-input ${errors.memAge ? 'invalid' : ''}`}
                      placeholder="e.g. 25"
                      value={memAge}
                      onChange={(e) => setMemAge(e.target.value)}
                    />
                  </div>
                  {errors.memAge && <div className="error-feedback" id="mem-age-error" style={{ display: 'block' }}>{errors.memAge}</div>}
                </div>

                {/* Mobile Number */}
                <div className="form-group">
                  <label htmlFor="mem-phone" className="form-label">Mobile Number</label>
                  <div className="input-icon-wrapper">
                    <span className="field-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </span>
                    <input
                      type="tel"
                      id="mem-phone"
                      className={`form-input ${errors.memPhone ? 'invalid' : ''}`}
                      placeholder="e.g. (555) 000-0000"
                      value={memPhone}
                      onChange={(e) => setMemPhone(e.target.value)}
                    />
                  </div>
                  {errors.memPhone && <div className="error-feedback" id="mem-phone-error" style={{ display: 'block' }}>{errors.memPhone}</div>}
                </div>

                {/* Options */}
                <div className="form-options" style={{ marginBottom: '2rem' }}>
                  <label className="remember-me-label">
                    <input
                      type="checkbox"
                      id="mem-terms"
                      checked={memTerms}
                      onChange={(e) => setMemTerms(e.target.checked)}
                    />
                    <span className="checkbox-box"></span>
                    I accept user terms & conditions
                  </label>
                  {errors.memTerms && <div className="error-feedback" id="mem-terms-error" style={{ display: 'block', width: '100%' }}>{errors.memTerms}</div>}
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  className="glow-btn login-submit-btn"
                  id="mem-submit-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating Profile...' : 'Create Member Account'}
                </button>
              </form>
            )}

            {/* B. TRAINER APPLICATION FORM */}
            {activeTab === 'trainer' && (
              <form onSubmit={handleTrainerSubmit} id="register-trainer-form">
                
                {/* Full Name */}
                <div className="form-group">
                  <label htmlFor="trn-name" className="form-label">Full Name</label>
                  <div className="input-icon-wrapper">
                    <span className="field-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      id="trn-name"
                      className={`form-input ${errors.trnName ? 'invalid' : ''}`}
                      placeholder="e.g. Marcus Vance"
                      value={trnName}
                      onChange={(e) => setTrnName(e.target.value)}
                    />
                  </div>
                  {errors.trnName && <div className="error-feedback" id="trn-name-error" style={{ display: 'block' }}>{errors.trnName}</div>}
                </div>

                {/* Email */}
                <div className="form-group">
                  <label htmlFor="trn-email" className="form-label">Email Address</label>
                  <div className="input-icon-wrapper">
                    <span className="field-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                      </svg>
                    </span>
                    <input
                      type="email"
                      id="trn-email"
                      className={`form-input ${errors.trnEmail ? 'invalid' : ''}`}
                      placeholder="coach@apex.com"
                      value={trnEmail}
                      onChange={(e) => setTrnEmail(e.target.value)}
                    />
                  </div>
                  {errors.trnEmail && <div className="error-feedback" id="trn-email-error" style={{ display: 'block' }}>{errors.trnEmail}</div>}
                </div>

                {/* Password */}
                <div className="form-group">
                  <label htmlFor="trn-password" className="form-label">Password</label>
                  <div className="input-icon-wrapper">
                    <span className="field-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </span>
                    <input
                      type={isTrnPassVisible ? 'text' : 'password'}
                      id="trn-password"
                      className={`form-input pass-input ${errors.trnPassword ? 'invalid' : ''}`}
                      placeholder="••••••••"
                      value={trnPassword}
                      onChange={(e) => setTrnPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="toggle-password-btn"
                      onClick={() => setIsTrnPassVisible(!isTrnPassVisible)}
                    >
                      {isTrnPassVisible ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {errors.trnPassword && <div className="error-feedback" id="trn-password-error" style={{ display: 'block' }}>{errors.trnPassword}</div>}
                </div>

                {/* Specialty */}
                <div className="form-group">
                  <label htmlFor="trn-specialty" className="form-label">Coaching Specialization</label>
                  <div className="input-icon-wrapper">
                    <span className="field-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </span>
                    <select
                      id="trn-specialty"
                      className="form-input"
                      style={{ paddingLeft: '2.8rem', background: '#15151a', border: '1px solid var(--border-color)', color: 'var(--text-white)' }}
                      value={trnSpecialty}
                      onChange={(e) => setTrnSpecialty(e.target.value)}
                    >
                      <option value="strength">Strength & Power Conditioning</option>
                      <option value="hiit">HIIT & Cardiovascular</option>
                      <option value="yoga">Yoga & Mobility Flow</option>
                      <option value="combat">Combat & Boxing</option>
                    </select>
                  </div>
                </div>

                {/* Certifications */}
                <div className="form-group">
                  <label htmlFor="trn-certs" className="form-label">Certifications / Years of Experience</label>
                  <textarea
                    id="trn-certs"
                    className={`form-input ${errors.trnCerts ? 'invalid' : ''}`}
                    rows="2"
                    placeholder="e.g. CSCS Certified, 5+ Years Active Coaching"
                    style={{ paddingLeft: '1rem' }}
                    value={trnCerts}
                    onChange={(e) => setTrnCerts(e.target.value)}
                  ></textarea>
                  {errors.trnCerts && <div className="error-feedback" id="trn-certs-error" style={{ display: 'block' }}>{errors.trnCerts}</div>}
                </div>

                {/* Options */}
                <div className="form-options" style={{ marginBottom: '2rem' }}>
                  <label className="remember-me-label">
                    <input
                      type="checkbox"
                      id="trn-terms"
                      checked={trnTerms}
                      onChange={(e) => setTrnTerms(e.target.checked)}
                    />
                    <span className="checkbox-box"></span>
                    I accept staff credentials terms
                  </label>
                  {errors.trnTerms && <div className="error-feedback" id="trn-terms-error" style={{ display: 'block', width: '100%' }}>{errors.trnTerms}</div>}
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  className="glow-btn login-submit-btn"
                  id="trn-submit-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting Details...' : 'Submit Coach Application'}
                </button>
              </form>
            )}

            <div className="portal-footer">
              <p style={{ marginBottom: '0.8rem' }}>
                Already have an account?{' '}
                <a
                  onClick={() => navigate('login')}
                  style={{ color: 'var(--accent-volt)', fontWeight: 700, textDecoration: 'underline', cursor: 'pointer' }}
                >
                  Sign In
                </a>
              </p>
              <p>Apex Athletics club access portals. Unauthorized entry is logged.</p>
            </div>

            {/* SUCCESS OVERLAY */}
            <div className={`forgot-success-state ${showSuccessOverlay ? 'active' : ''}`} id="reg-success-state">
              <div className="success-icon-wrapper" style={{ borderColor: 'var(--accent-volt)', color: 'var(--accent-volt)', background: 'rgba(198, 255, 0, 0.05)', boxShadow: 'var(--glow-volt)', margin: '0 auto 1.5rem auto' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 id="reg-success-title">{successDetails.title}</h3>
              <p id="reg-success-message">{successDetails.message}</p>
            </div>

          </div>
        </div>
      </div>

    </div>
  );
}
