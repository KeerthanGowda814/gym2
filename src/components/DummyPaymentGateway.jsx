import React, { useState, useEffect } from 'react';

/**
 * Interactive Premium Dummy Payment Gateway
 * Supports Credit Card (interactive card layout), UPI (scan QR simulation), NetBanking, and Desk Cash.
 * Simulates bank processing and OTP entry prior to triggering backend state updates.
 */
export default function DummyPaymentGateway({ amount, title, onPaymentSuccess, onClose }) {
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [paymentStep, setPaymentStep] = useState('input'); // 'input' | 'processing' | 'otp' | 'success'
  
  // Card states
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardFocused, setCardFocused] = useState(false); // flip card if CVV is focused
  
  // UPI states
  const [upiId, setUpiId] = useState('');

  // Netbanking state
  const [selectedBank, setSelectedBank] = useState('SBI');

  // OTP state
  const [otpVal, setOtpVal] = useState('');
  const [otpError, setOtpError] = useState('');

  // Loader Text
  const [loaderStatus, setLoaderStatus] = useState('Initializing secure token exchange...');

  // Format Card Number (adds spaces every 4 digits)
  const handleCardNumberChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 16) value = value.slice(0, 16);
    const formatted = value.match(/.{1,4}/g)?.join(' ') || value;
    setCardNumber(formatted);
  };

  // Format Expiry (MM/YY)
  const handleCardExpiryChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 4) value = value.slice(0, 4);
    if (value.length >= 2) {
      value = value.slice(0, 2) + '/' + value.slice(2);
    }
    setCardExpiry(value);
  };

  // Format CVV
  const handleCardCvvChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 3) value = value.slice(0, 3);
    setCardCvv(value);
  };

  // Card Brand Detector
  const getCardBrand = () => {
    const cleanNum = cardNumber.replace(/\s/g, '');
    if (cleanNum.startsWith('4')) return 'Visa';
    if (cleanNum.startsWith('5')) return 'Mastercard';
    if (cleanNum.startsWith('6')) return 'RuPay';
    return 'Card';
  };

  // Simulate Loader Status texts
  useEffect(() => {
    if (paymentStep === 'processing') {
      const messages = [
        'Connecting to 3D-Secure server...',
        'Encrypting card details (AES-256)...',
        'Requesting OTP authorization code from bank...',
      ];
      let idx = 0;
      const interval = setInterval(() => {
        if (idx < messages.length) {
          setLoaderStatus(messages[idx]);
          idx++;
        } else {
          clearInterval(interval);
          setPaymentStep('otp');
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [paymentStep]);

  const handlePaySubmit = (e) => {
    e.preventDefault();
    if (paymentMethod === 'card') {
      if (cardNumber.replace(/\s/g, '').length < 16) {
        alert('Please enter a valid 16-digit card number.');
        return;
      }
      if (cardExpiry.length < 5) {
        alert('Please enter a valid expiry date (MM/YY).');
        return;
      }
      if (cardCvv.length < 3) {
        alert('Please enter a valid 3-digit CVV.');
        return;
      }
    } else if (paymentMethod === 'upi') {
      if (!upiId.includes('@')) {
        alert('Please enter a valid UPI ID (e.g. name@bank).');
        return;
      }
    }
    setPaymentStep('processing');
  };

  const handleOtpVerify = (e) => {
    e.preventDefault();
    if (otpVal === '1234' || otpVal.trim() !== '') {
      setPaymentStep('success');
      setTimeout(() => {
        const txId = 'TX-GATEWAY-' + Math.floor(100000 + Math.random() * 900000);
        onPaymentSuccess({ txId, amount, method: paymentMethod });
      }, 1500);
    } else {
      setOtpError('Invalid OTP code. Try entering 1234 or any number.');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(5, 5, 8, 0.94)',
      backdropFilter: 'blur(12px)',
      zIndex: 9999999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
      color: 'var(--text-white, #fff)',
      fontFamily: "'Outfit', 'Inter', sans-serif"
    }}>
      <div style={{
        background: 'rgba(18, 18, 26, 0.95)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '560px',
        padding: '2.5rem',
        boxShadow: '0 0 50px rgba(0, 240, 255, 0.15)',
        position: 'relative',
        boxSizing: 'border-box'
      }}>
        {/* Header */}
        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '1rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '0.65rem', background: 'rgba(0, 240, 255, 0.1)', color: 'var(--accent-cyan, #00f0ff)', padding: '0.2rem 0.6rem', borderRadius: '4px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Apex Secure Checkout
            </span>
            <h3 style={{ margin: '0.4rem 0 0 0', fontWeight: 800, fontSize: '1.3rem', textTransform: 'uppercase' }}>
              {title || 'Dummy Payment Gateway'}
            </h3>
          </div>
          {paymentStep !== 'success' && (
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '1.8rem', cursor: 'pointer', transition: 'color 0.2s' }}
              onMouseEnter={(e) => e.target.style.color = '#fff'}
              onMouseLeave={(e) => e.target.style.color = 'rgba(255,255,255,0.4)'}
            >
              &times;
            </button>
          )}
        </div>

        {/* INPUT STEP */}
        {paymentStep === 'input' && (
          <form onSubmit={handlePaySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            {/* Amount Banner */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '0.8rem 1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>Amount Payable:</span>
              <strong style={{ color: 'var(--accent-volt, #c6ff00)', fontSize: '1.4rem', fontWeight: 800 }}>
                ₹{amount.toLocaleString('en-IN')}
              </strong>
            </div>

            {/* Methods Selection */}
            <div>
              <label style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)', fontWeight: 700, display: 'block', marginBottom: '0.5rem' }}>
                PAYMENT METHODS
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.6rem' }}>
                {[
                  { id: 'card', label: '💳 Card' },
                  { id: 'upi', label: '📱 UPI / QR' },
                  { id: 'netbank', label: '🏛️ NetBanking' }
                ].map((method) => (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setPaymentMethod(method.id)}
                    style={{
                      padding: '0.7rem',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      borderRadius: '8px',
                      background: paymentMethod === method.id ? 'var(--accent-cyan, #00f0ff)' : 'rgba(255,255,255,0.02)',
                      color: paymentMethod === method.id ? '#000' : '#fff',
                      border: paymentMethod === method.id ? 'none' : '1px solid rgba(255,255,255,0.1)',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {method.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamic Forms */}
            {paymentMethod === 'card' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Visual interactive Credit Card */}
                <div style={{
                  background: 'linear-gradient(135deg, #1f1c2c 0%, #928dab 100%)',
                  borderRadius: '12px',
                  padding: '1.2rem',
                  height: '160px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  transform: cardFocused ? 'rotateY(180deg)' : 'none',
                  transition: 'transform 0.6s'
                }}>
                  {/* Decorative background circles */}
                  <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }}></div>
                  
                  {!cardFocused ? (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: '1.4rem' }}>💎</span>
                        <strong style={{ fontStyle: 'italic', fontSize: '1rem', color: 'rgba(255,255,255,0.8)' }}>
                          {getCardBrand()}
                        </strong>
                      </div>
                      <div style={{ fontSize: '1.2rem', fontFamily: 'monospace', letterSpacing: '0.15em', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', margin: '0.8rem 0' }}>
                        {cardNumber || '•••• •••• •••• ••••'}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' }}>
                        <div>
                          <span style={{ fontSize: '0.55rem', display: 'block', color: 'rgba(255,255,255,0.4)' }}>Card Holder</span>
                          <strong>{cardName || 'ATHLETE MEMBER'}</strong>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '0.55rem', display: 'block', color: 'rgba(255,255,255,0.4)' }}>Expires</span>
                          <strong>{cardExpiry || 'MM/YY'}</strong>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div style={{ transform: 'rotateY(180deg)', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
                      <div style={{ height: '35px', background: '#000', margin: '0 -1.2rem', width: 'calc(100% + 2.4rem)' }}></div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.1)', padding: '0.4rem', borderRadius: '4px' }}>
                        <span style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.6)' }}>CVV</span>
                        <strong style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>{cardCvv || '•••'}</strong>
                      </div>
                      <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
                        Secured transactions monitored by Apex Gateway Services.
                      </div>
                    </div>
                  )}
                </div>

                {/* Form Fields */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.8rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      <label style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)' }}>Cardholder Name</label>
                      <input
                        type="text"
                        placeholder="e.g. John Doe"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        required
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '0.6rem 0.8rem', color: '#fff', fontSize: '0.85rem' }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      <label style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)' }}>Card Number</label>
                      <input
                        type="text"
                        placeholder="4111 2222 3333 4444"
                        value={cardNumber}
                        onChange={handleCardNumberChange}
                        required
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '0.6rem 0.8rem', color: '#fff', fontSize: '0.85rem', fontFamily: 'monospace' }}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      <label style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)' }}>Expiry Date</label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        value={cardExpiry}
                        onChange={handleCardExpiryChange}
                        required
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '0.6rem 0.8rem', color: '#fff', fontSize: '0.85rem' }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      <label style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)' }}>CVV Code</label>
                      <input
                        type="password"
                        placeholder="123"
                        value={cardCvv}
                        onChange={handleCardCvvChange}
                        onFocus={() => setCardFocused(true)}
                        onBlur={() => setCardFocused(false)}
                        required
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '0.6rem 0.8rem', color: '#fff', fontSize: '0.85rem' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === 'upi' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
                <div style={{
                  background: '#fff',
                  padding: '1rem',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '3px solid var(--accent-cyan, #00f0ff)',
                  boxShadow: '0 0 20px rgba(0, 240, 255, 0.2)',
                  position: 'relative'
                }}>
                  {/* Fake QR Image */}
                  <img
                    src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=apexathletics@axis&pn=Apex%20Athletics&am=1&cu=INR"
                    alt="Scan UPI QR"
                    style={{ width: '130px', height: '130px' }}
                    onError={(e) => {
                      e.target.src = 'https://picsum.photos/150/150';
                    }}
                  />
                  <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '3px', background: 'var(--accent-volt, #c6ff00)', animation: 'qrScanLine 2s infinite linear' }}></div>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>
                  Scan the QR code with any UPI app (GPay, PhonePe, Paytm) to pay instantly.
                </span>

                <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.08)', margin: '0.5rem 0' }}></div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', width: '100%' }}>
                  <label style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)' }}>Or enter UPI ID *</label>
                  <input
                    type="text"
                    placeholder="e.g. member@okaxis"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '0.6rem 0.8rem', color: '#fff', fontSize: '0.85rem' }}
                  />
                </div>
              </div>
            )}

            {paymentMethod === 'netbank' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  <label style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)' }}>Select Your Bank</label>
                  <select
                    value={selectedBank}
                    onChange={(e) => setSelectedBank(e.target.value)}
                    style={{ background: '#12121a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '0.6rem 0.8rem', color: '#fff', fontSize: '0.85rem', cursor: 'pointer' }}
                  >
                    <option value="SBI">State Bank of India (SBI)</option>
                    <option value="HDFC">HDFC Bank</option>
                    <option value="ICICI">ICICI Bank</option>
                    <option value="AXIS">Axis Bank</option>
                    <option value="PNB">Punjab National Bank</option>
                  </select>
                </div>
                <div style={{ background: 'rgba(0, 240, 255, 0.03)', border: '1px solid rgba(0, 240, 255, 0.1)', borderRadius: '6px', padding: '0.8rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.4 }}>
                  🏛️ You will be redirected to the secure NetBanking credentials dashboard of <strong>{selectedBank}</strong> to complete the transaction.
                </div>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              className="glow-btn"
              style={{
                marginTop: '0.8rem',
                padding: '0.85rem',
                fontSize: '0.9rem',
                fontWeight: 800,
                letterSpacing: '0.05em',
                width: '100%',
                background: 'var(--accent-volt, #c6ff00)',
                color: '#000',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                boxShadow: '0 0 15px rgba(198, 255, 0, 0.25)'
              }}
            >
              Securely Pay ₹{amount.toLocaleString('en-IN')} →
            </button>
          </form>
        )}

        {/* PROCESSING STEP */}
        {paymentStep === 'processing' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center', padding: '2rem 0', textAlign: 'center' }}>
            <div className="gateway-spinner" style={{
              width: '55px',
              height: '55px',
              border: '4px solid rgba(0, 240, 255, 0.1)',
              borderTop: '4px solid var(--accent-cyan, #00f0ff)',
              borderRadius: '50%',
              animation: 'spin 1s infinite linear'
            }}></div>
            <div>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: 800 }}>Securing Connection...</h4>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', margin: 0 }}>{loaderStatus}</p>
            </div>
          </div>
        )}

        {/* OTP VERIFICATION STEP */}
        {paymentStep === 'otp' && (
          <form onSubmit={handleOtpVerify} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', padding: '1rem 0' }}>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '1.6rem' }}>🔒</span>
              <h4 style={{ margin: '0.5rem 0 0.2rem 0', fontSize: '1.1rem', fontWeight: 800 }}>Enter Security Passcode</h4>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.78rem', margin: 0 }}>
                We sent a 4-digit verification code via mock SMS to your registered device.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Enter 1234 or any code"
                maxLength="6"
                value={otpVal}
                onChange={(e) => setOtpVal(e.target.value)}
                required
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '6px',
                  padding: '0.8rem 1.2rem',
                  color: '#fff',
                  fontSize: '1.2rem',
                  fontFamily: 'monospace',
                  letterSpacing: '0.2em',
                  textAlign: 'center',
                  width: '180px'
                }}
              />
              {otpError && <span style={{ color: '#ff3e6c', fontSize: '0.72rem', fontWeight: 700 }}>{otpError}</span>}
              <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.4rem' }}>
                Test Gateway Hint: Type <strong>1234</strong> to simulate instant verification success.
              </span>
            </div>

            <button
              type="submit"
              className="glow-btn"
              style={{
                padding: '0.8rem',
                fontSize: '0.85rem',
                fontWeight: 800,
                width: '100%',
                background: 'var(--accent-cyan, #00f0ff)',
                color: '#000',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Verify OTP & Finish Payment ✓
            </button>
          </form>
        )}

        {/* SUCCESS STEP */}
        {paymentStep === 'success' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', alignItems: 'center', padding: '1.5rem 0', textAlign: 'center' }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'rgba(0, 255, 102, 0.1)',
              border: '2px solid #00ff66',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#00ff66',
              boxShadow: '0 0 25px rgba(0, 255, 102, 0.25)'
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h3 style={{ margin: '0 0 0.2rem 0', fontSize: '1.3rem', fontWeight: 800, color: '#00ff66' }}>
                PAYMENT COMPLETED!
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', margin: 0 }}>
                Bank authorization verified. Updating database records...
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Embedded CSS Animations */}
      <style>{`
        @keyframes qrScanLine {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
