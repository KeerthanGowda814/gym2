import { useState, useEffect } from 'react';

// Get initial theme from localStorage or default to dark
export const getInitialTheme = () => {
  const saved = localStorage.getItem('apex_theme');
  if (saved === 'light' || saved === 'dark') {
    return saved;
  }
  return 'dark';
};

// Set theme on DOM root and localStorage
export const applyTheme = (theme) => {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('apex_theme', theme);
  window.dispatchEvent(new CustomEvent('apex_theme_change', { detail: theme }));
};

// React hook for consuming and toggling theme in components
export const useTheme = () => {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    // Ensure initial theme is applied to DOM
    applyTheme(theme);

    const handleThemeChange = (e) => {
      setTheme(e.detail);
    };

    window.addEventListener('apex_theme_change', handleThemeChange);
    return () => window.removeEventListener('apex_theme_change', handleThemeChange);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    applyTheme(nextTheme);
  };

  return { theme, toggleTheme, setTheme: (t) => { setTheme(t); applyTheme(t); } };
};
