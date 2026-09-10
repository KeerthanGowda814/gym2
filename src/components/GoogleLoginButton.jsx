import React, { useEffect, useRef, useState } from 'react';
import { renderGoogleSignInButton } from '../services/googleAuth';

export default function GoogleLoginButton({
  role = 'member',
  onSuccess,
  onError,
  buttonText = 'signin_with',
  label = 'Continue with Google'
}) {
  const containerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    if (containerRef.current) {
      renderGoogleSignInButton(containerRef.current, {
        role,
        text: buttonText,
        theme: 'filled_black',
        size: 'large',
        onSuccess: (user) => {
          if (isMounted && onSuccess) {
            onSuccess(user);
          }
        },
        onError: (err) => {
          if (isMounted) {
            setHasError(true);
            setLoading(false);
            if (onError) onError(err);
          }
        }
      }).then(() => {
        if (isMounted) setLoading(false);
      }).catch(() => {
        if (isMounted) {
          setHasError(true);
          setLoading(false);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [role, buttonText, onSuccess, onError]);

  return (
    <div className="google-auth-container" style={{ width: '100%', margin: '1rem 0' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.8rem',
          margin: '0.8rem 0 1rem 0'
        }}
      >
        <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.12)' }}></div>
        <span
          style={{
            color: 'var(--text-dim, #8e919f)',
            fontSize: '0.72rem',
            textTransform: 'uppercase',
            letterSpacing: '1.2px',
            fontWeight: 600
          }}
        >
          OR
        </span>
        <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.12)' }}></div>
      </div>

      <div
        style={{
          minHeight: '44px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          position: 'relative'
        }}
      >
        {/* Google GSI Target Container */}
        <div
          ref={containerRef}
          id={`google-signin-btn-${role}`}
          style={{
            display: 'flex',
            justifyContent: 'center',
            width: '100%',
            borderRadius: '6px',
            overflow: 'hidden'
          }}
        ></div>

        {/* Fallback visual placeholder when script is loading or rendering */}
        {loading && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '42px',
              background: '#131314',
              border: '1px solid #303030',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.8rem',
              color: '#ffffff',
              fontSize: '0.85rem',
              fontWeight: 500,
              pointerEvents: 'none'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{label}</span>
          </div>
        )}
      </div>
    </div>
  );
}
