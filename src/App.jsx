import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import DashboardPage from './components/DashboardPage';
import AdminLoginPage from './components/AdminLoginPage';
import { getInitialTheme, applyTheme } from './utils/theme';

// Import CSS Stylesheets
import './styles/style.css';
import './styles/login.css';
import './styles/register.css';
import './styles/dashboard.css';

export default function App() {
  const [currentHash, setCurrentHash] = useState(window.location.hash || '#/');

  useEffect(() => {
    applyTheme(getInitialTheme());

    const handleHashChange = () => {
      setCurrentHash(window.location.hash || '#/');
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Simple state router helper
  const navigate = (page) => {
    if (page === 'home') {
      window.location.hash = '#/';
    } else {
      window.location.hash = `#/${page}`;
    }
  };

  // Render components based on hash routing
  const renderPage = () => {
    switch (currentHash) {
      case '#/':
      case '#/home':
        return <LandingPage navigate={navigate} />;
      case '#/login':
        return <LoginPage navigate={navigate} />;
      case '#/admin-login':
        return <AdminLoginPage navigate={navigate} />;
      case '#/register':
        return <RegisterPage navigate={navigate} />;
      case '#/dashboard':
      case '#/trainer':
      case '#/trainer-dashboard':
      case '#/trainer_dashboard':
      case '#/trainerpanel':
      case '#/coaching':
      case '#/admin':
      case '#/admin-dashboard':
      case '#/admin_dashboard':
      case '#/adminpanel':
        return <DashboardPage navigate={navigate} />;
      default:
        if (currentHash.startsWith('#/trainer') || currentHash.startsWith('#/dashboard') || currentHash.startsWith('#/admin')) {
          return <DashboardPage navigate={navigate} />;
        }
        return <LandingPage navigate={navigate} />;
    }
  };

  return (
    <div className="app-container">
      {renderPage()}
    </div>
  );
}
