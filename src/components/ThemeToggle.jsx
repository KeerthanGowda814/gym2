import React from 'react';
import { useTheme } from '../utils/theme';

export default function ThemeToggle({ style, className = '' }) {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === 'light';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`theme-toggle-btn ${className}`}
      title={isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
      aria-label={isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
      style={{
        background: isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)',
        border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '50px',
        padding: '0.4rem 0.75rem',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.45rem',
        cursor: 'pointer',
        color: isLight ? '#0f172a' : '#ffffff',
        fontSize: '0.8rem',
        fontWeight: 600,
        fontFamily: 'var(--font-body)',
        transition: 'all 0.25s ease',
        ...style
      }}
    >
      {isLight ? (
        <>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#ff5e00" strokeWidth="2.2">
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Light</span>
        </>
      ) : (
        <>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#c6ff00" strokeWidth="2.2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Dark</span>
        </>
      )}
    </button>
  );
}
