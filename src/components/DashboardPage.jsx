import React, { useState, useEffect } from 'react';
import { ApexAuth } from '../services/auth';
import TrainerPanel from './TrainerPanel';
import MemberPanel from './MemberPanel';
import AdminPanel from './AdminPanel';
import CustomSwal from '../utils/swal';
import SupplementShop from './SupplementShop';
import { memberApi } from '../services/memberApi';
import ThemeToggle from './ThemeToggle';

class WorkspaceErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Workspace Crash Caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '3rem', textAlign: 'center', background: 'rgba(255,62,108,0.05)', border: '1px solid #ff3e6c', borderRadius: '12px', margin: '2rem' }}>
          <h2 style={{ color: '#ff3e6c', textTransform: 'uppercase', fontFamily: 'var(--font-display)', marginBottom: '0.8rem' }}>
            ⚡ Workspace Session Reset
          </h2>
          <p style={{ color: 'var(--text-white)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            A local data mismatch was detected: <code style={{ color: 'var(--accent-volt)' }}>{this.state.error?.message}</code>
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button
              className="glow-btn"
              style={{ padding: '0.6rem 1.4rem', cursor: 'pointer' }}
              onClick={() => {
                localStorage.removeItem('apex_trainer_agenda');
                localStorage.removeItem('apex_trainer_members');
                localStorage.removeItem('apex_trainer_workouts');
                localStorage.removeItem('apex_trainer_diets');
                localStorage.removeItem('apex_trainer_attendance');
                window.location.reload();
              }}
            >
              Reset Session Cache & Reload Terminal
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function DashboardPage({ navigate }) {
  // Check authenticated routing guard
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    if (!ApexAuth.isAuthenticated()) {
      if (window.location.hash.includes('admin')) {
        ApexAuth.authenticateUser('admin@apex.com', 'admin', 'System Admin', true);
        setCurrentUser(ApexAuth.getCurrentUser());
      } else if (window.location.hash.includes('trainer') || window.location.hash.includes('coaching')) {
        ApexAuth.authenticateUser('trainer@apex.com', 'trainer', 'Coach Marcus Vance', true);
        setCurrentUser(ApexAuth.getCurrentUser());
      } else {
        ApexAuth.logout();
        navigate('login');
      }
    } else {
      const authUser = ApexAuth.getCurrentUser();
      if (authUser) {
        // Sync custom profile name/photo if member updated their profile details
        const memberKey = authUser.email
          ? authUser.email.toLowerCase().replace(/[^a-z0-9]/g, '_')
          : (authUser.name ? authUser.name.toLowerCase().replace(/[^a-z0-9]/g, '_') : 'member_user');
        const savedProfile = localStorage.getItem(`apex_member_profile_${memberKey}`) || (authUser.name ? localStorage.getItem(`apex_member_profile_${authUser.name}`) : null);
        if (savedProfile) {
          try {
            const parsed = JSON.parse(savedProfile);
            if (parsed.name) authUser.name = parsed.name;
            if (parsed.profileImage) authUser.profileImage = parsed.profileImage;
          } catch (e) {}
        }
        
        // Fetch real profile from backend API to ensure live real name sync
        if (authUser.role === 'member') {
          memberApi.getProfile().then(res => {
            if (res && res.name) {
              setCurrentUser(prev => prev ? { ...prev, name: res.name, profileImage: res.profileImage || prev.profileImage } : prev);
            }
          }).catch(() => {});
        }
      }
      setCurrentUser(authUser);
    }
  }, [navigate]);

  // Subview states
  const [activeSubView, setActiveSubView] = useState('home');
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Shared recent activities state (so check-ins in MemberPanel update AdminPanel logs immediately)
  const [activities, setActivities] = useState([]);

  const addActivity = (text, color = 'volt') => {
    setActivities((prev) => [
      { text, time: 'Just Now', color },
      ...prev
    ]);
  };

  // Notification center state
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadTrainerChatCount, setUnreadTrainerChatCount] = useState(0);
  const [alerts, setAlerts] = useState([]);
  const [notifFilter, setNotifFilter] = useState('all');

  const userNotifKey = currentUser?.email
    ? currentUser.email.toLowerCase().replace(/[^a-z0-9]/g, '_')
    : (currentUser?.name ? currentUser.name.toLowerCase().replace(/[^a-z0-9]/g, '_') : 'member_user');

  const [dismissedAlertIds, setDismissedAlertIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(`dismissed_alerts_${userNotifKey}`) || localStorage.getItem('dismissed_alerts') || '[]');
    } catch (e) {
      return [];
    }
  });

  const [seenAlertIds, setSeenAlertIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(`seen_alerts_${userNotifKey}`) || localStorage.getItem('seen_alerts') || '[]');
    } catch (e) {
      return [];
    }
  });

  // Fetch alerts dynamically
  const fetchAlerts = async () => {
    try {
      const data = await memberApi.getAlerts();
      const rawAlerts = data || JSON.parse(localStorage.getItem('apex_broadcast_alerts') || '[]');
      if (Array.isArray(rawAlerts)) {
        setAlerts(rawAlerts);
        const savedSeen = JSON.parse(localStorage.getItem(`seen_alerts_${userNotifKey}`) || localStorage.getItem('seen_alerts') || '[]');
        const savedDismissed = JSON.parse(localStorage.getItem(`dismissed_alerts_${userNotifKey}`) || localStorage.getItem('dismissed_alerts') || '[]');
        const activeUnseen = rawAlerts.filter(a => a && !savedDismissed.includes(a.id) && !savedSeen.includes(a.id));
        setUnreadCount(activeUnseen.length);
      }
    } catch (e) {
      console.warn("Alerts fetch error:", e);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 8000);
    return () => clearInterval(interval);
  }, [userNotifKey]);

  // Poll for unread trainer messages when user is a member
  useEffect(() => {
    if (currentUser?.role === 'member') {
      const checkCoachChat = async () => {
        try {
          const res = await memberApi.getChatHistory(currentUser.name, currentUser.email);
          if (res && res.unreadCount !== undefined) {
            setUnreadTrainerChatCount(res.unreadCount);
          }
        } catch (e) {}
      };
      checkCoachChat();
      const interval = setInterval(checkCoachChat, 4000);
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  const handleToggleNotifDropdown = () => {
    setShowNotifDropdown(!showNotifDropdown);
  };

  const handleMarkAllRead = (e) => {
    e.stopPropagation();
    const allIds = alerts.map(a => a.id);
    const updatedSeen = Array.from(new Set([...seenAlertIds, ...allIds]));
    setSeenAlertIds(updatedSeen);
    localStorage.setItem(`seen_alerts_${userNotifKey}`, JSON.stringify(updatedSeen));
    localStorage.setItem('seen_alerts', JSON.stringify(updatedSeen));
    setUnreadCount(0);
  };

  const handleDismissAlert = (e, alertId) => {
    e.stopPropagation();
    const nextDismissed = Array.from(new Set([...dismissedAlertIds, alertId]));
    setDismissedAlertIds(nextDismissed);
    localStorage.setItem(`dismissed_alerts_${userNotifKey}`, JSON.stringify(nextDismissed));
    localStorage.setItem('dismissed_alerts', JSON.stringify(nextDismissed));

    // Update unread count
    const remainingUnseen = alerts.filter(a => a && !nextDismissed.includes(a.id) && !seenAlertIds.includes(a.id));
    setUnreadCount(remainingUnseen.length);
  };

  const handleClearAllAlerts = (e) => {
    e.stopPropagation();
    const allIds = alerts.map(a => a.id);
    setDismissedAlertIds(allIds);
    localStorage.setItem(`dismissed_alerts_${userNotifKey}`, JSON.stringify(allIds));
    localStorage.setItem('dismissed_alerts', JSON.stringify(allIds));
    setUnreadCount(0);
  };

  // Admin Plan and Modal State
  const [adminPlan, setAdminPlan] = useState(() => localStorage.getItem('apex_admin_plan') || 'Basic');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const notificationsList = [
    { id: 1, title: '🏋️ Trainer Assigned', text: 'Coach Keerthu was assigned as your personal strength coach!', time: '10m ago' },
    { id: 2, title: '💳 Keycard Active', text: 'Biometric RFID gate pass verified for July 2026 session.', time: '1h ago' },
    { id: 3, title: '📦 Supp Store Order', text: 'MuscleBlaze Biozyme & GNC Whey order processed successfully!', time: '3h ago' }
  ];

  const handleLogout = () => {
    ApexAuth.logout();
    navigate('login');
  };

  if (!currentUser) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-white)' }}>
        Loading Session Workspace...
      </div>
    );
  }

  // Initials creator helper
  const userName = currentUser?.name || 'Coach Marcus Vance';
  const nameParts = userName.split(' ');
  const initials = nameParts.map((part) => part[0]).join('').toUpperCase().substring(0, 2);

  // Date format options
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const formattedToday = new Date().toLocaleDateString('en-US', options);

  return (
    <div className="db-layout admin-theme">
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="db-sidebar">
        <div className="sidebar-header">
          <a onClick={() => navigate('home')} className="admin-sidebar-logo" style={{ cursor: 'pointer' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: 'var(--accent-volt)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Muscle<span>Hub</span>
          </a>
        </div>
        
        {/* User Info Card - Hiden for admin since profile is in the header */}
        {currentUser.role !== 'admin' && (
          <div
            className="sidebar-profile"
            onClick={() => {
              if (currentUser.role === 'member') {
                setActiveSubView('profile');
              }
            }}
            title={currentUser.role === 'member' ? "Click to view & edit your profile" : "Logged in user profile"}
            style={{ cursor: currentUser.role === 'member' ? 'pointer' : 'default' }}
          >
            <div className="profile-avatar" id="user-avatar-initials">
              {currentUser.profileImage ? (
                <img src={currentUser.profileImage} alt={currentUser.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                initials
              )}
            </div>
            <div className="profile-details">
              <h3 id="user-display-name">{currentUser.name}</h3>
              <span className="role-badge" id="user-display-role">{currentUser.role}</span>
            </div>
          </div>
        )}

        {/* Dynamic Navigation Sidebar */}
        <nav className="sidebar-nav">
          <ul className="sidebar-nav-menu">
            {/* Dashboard / Home Link */}
            <li>
              <a
                onClick={() => setActiveSubView('home')}
                className={`sidebar-nav-link ${activeSubView === 'home' ? 'active' : ''}`}
                style={{ cursor: 'pointer' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
                </svg>
                Dashboard
              </a>
            </li>

            {/* Member Profile view link (Member Only) */}
            {currentUser.role === 'member' && (
              <li>
                <a
                  onClick={() => setActiveSubView('profile')}
                  className={`sidebar-nav-link ${activeSubView === 'profile' ? 'active' : ''}`}
                  style={{ cursor: 'pointer' }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Profile
                </a>
              </li>
            )}

            {/* Member Equipment page (Member Only) */}
            {currentUser.role === 'member' && (
              <li>
                <a
                  onClick={() => setActiveSubView('equipment')}
                  className={`sidebar-nav-link ${activeSubView === 'equipment' ? 'active' : ''}`}
                  style={{ cursor: 'pointer' }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Equipment
                </a>
              </li>
            )}

            {/* Member trainer coaching subview (Member Only) */}
            {currentUser.role === 'member' && (
              <li>
                <a
                  onClick={() => {
                    setActiveSubView('trainer');
                    setUnreadTrainerChatCount(0);
                  }}
                  className={`sidebar-nav-link ${activeSubView === 'trainer' ? 'active' : ''}`}
                  style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>Trainer</span>
                  </div>
                  {unreadTrainerChatCount > 0 && (
                    <span style={{ background: 'var(--accent-volt)', color: '#000', fontSize: '0.65rem', fontWeight: 800, padding: '0.1rem 0.45rem', borderRadius: '10px' }}>
                      {unreadTrainerChatCount}
                    </span>
                  )}
                </a>
              </li>
            )}

            {/* Attendance (Member and Trainer shared) */}
            {(currentUser.role === 'member' || currentUser.role === 'trainer') && (
              <li>
                <a
                  onClick={() => setActiveSubView('attendance')}
                  className={`sidebar-nav-link ${activeSubView === 'attendance' ? 'active' : ''}`}
                  style={{ cursor: 'pointer' }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  Attendance
                </a>
              </li>
            )}

            {/* Member supplements shop view (Member Only) */}
            {currentUser.role === 'member' && (
              <>
                <li>
                  <a
                    onClick={() => setActiveSubView('supplements')}
                    className={`sidebar-nav-link ${activeSubView === 'supplements' ? 'active' : ''}`}
                    style={{ cursor: 'pointer' }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    Supplements
                  </a>
                </li>
                <li>
                  <a
                    onClick={() => setActiveSubView('orders')}
                    className={`sidebar-nav-link ${activeSubView === 'orders' || activeSubView === 'order-tracking' ? 'active' : ''}`}
                    style={{ cursor: 'pointer' }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1m-4 0h1" />
                    </svg>
                    My Orders
                  </a>
                </li>
              </>

            )}

            {/* Member membership status and pass view (Member Only) */}
            {currentUser.role === 'member' && (
              <li>
                <a
                  onClick={() => setActiveSubView('membership')}
                  className={`sidebar-nav-link ${activeSubView === 'membership' ? 'active' : ''}`}
                  style={{ cursor: 'pointer' }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                  Membership
                </a>
              </li>
            )}

            {/* Trainer only navigations */}
            {currentUser.role === 'trainer' && (
              <>
                <li>
                  <a
                    onClick={() => setActiveSubView('members')}
                    className={`sidebar-nav-link ${activeSubView === 'members' ? 'active' : ''}`}
                    style={{ cursor: 'pointer' }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Members
                  </a>
                </li>
                <li>
                  <a
                    onClick={() => setActiveSubView('workouts')}
                    className={`sidebar-nav-link ${activeSubView === 'workouts' ? 'active' : ''}`}
                    style={{ cursor: 'pointer' }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" />
                    </svg>
                    Workout Plans
                  </a>
                </li>
                <li>
                  <a
                    onClick={() => setActiveSubView('diets')}
                    className={`sidebar-nav-link ${activeSubView === 'diets' ? 'active' : ''}`}
                    style={{ cursor: 'pointer' }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    Diet Plans
                  </a>
                </li>
                <li>
                  <a
                    onClick={() => setActiveSubView('schedule')}
                    className={`sidebar-nav-link ${activeSubView === 'schedule' ? 'active' : ''}`}
                    style={{ cursor: 'pointer' }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Schedule
                  </a>
                </li>
              </>
            )}

            {/* Admin only corrected navigations (matching design mockup exactly) */}
            {currentUser.role === 'admin' && (
              <>
                <li>
                  <a
                    onClick={() => setActiveSubView('members')}
                    className={`sidebar-nav-link ${activeSubView === 'members' ? 'active' : ''}`}
                    style={{ cursor: 'pointer' }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Member
                  </a>
                </li>

                <li>
                  <a
                    onClick={() => setActiveSubView('equipment')}
                    className={`sidebar-nav-link ${activeSubView === 'equipment' ? 'active' : ''}`}
                    style={{ cursor: 'pointer' }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Gallery
                  </a>
                </li>
                <li>
                  <a
                    onClick={() => setActiveSubView('attendance')}
                    className={`sidebar-nav-link ${activeSubView === 'attendance' ? 'active' : ''}`}
                    style={{ cursor: 'pointer' }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Attendance Board
                  </a>
                </li>
                <li>
                  <a
                    onClick={() => setActiveSubView('trainers')}
                    className={`sidebar-nav-link ${activeSubView === 'trainers' ? 'active' : ''}`}
                    style={{ cursor: 'pointer' }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Trainer List
                  </a>
                </li>
                <li>
                  <a
                    onClick={() => setActiveSubView('payments')}
                    className={`sidebar-nav-link ${activeSubView === 'payments' ? 'active' : ''}`}
                    style={{ cursor: 'pointer' }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M12 16v1m-4-6h8" />
                    </svg>
                    Billing Info
                  </a>
                </li>
                <li>
                  <a
                    onClick={() => setActiveSubView('orders')}
                    className={`sidebar-nav-link ${activeSubView === 'orders' || activeSubView === 'supplement-orders' ? 'active' : ''}`}
                    style={{ cursor: 'pointer' }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1m-4 0h1" />
                    </svg>
                    Supplement Orders
                  </a>
                </li>

                <li>
                  <a
                    onClick={() => setActiveSubView('alerts')}
                    className={`sidebar-nav-link ${activeSubView === 'alerts' ? 'active' : ''}`}
                    style={{ cursor: 'pointer' }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    Broadcast Alerts
                  </a>
                </li>
                <li>
                  <a
                    onClick={() => setActiveSubView('analytics')}
                    className={`sidebar-nav-link ${activeSubView === 'analytics' ? 'active' : ''}`}
                    style={{ cursor: 'pointer' }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Report
                  </a>
                </li>
                <li>
                  <a
                    onClick={() => setActiveSubView('supplements')}
                    className={`sidebar-nav-link ${activeSubView === 'supplements' ? 'active' : ''}`}
                    style={{ cursor: 'pointer' }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    Supplements
                  </a>
                </li>

                

              </>
            )}
          </ul>
        </nav>



        {/* LOGOUT */}
        <div className="sidebar-footer">
          <button onClick={handleLogout} className="outline-btn logout-btn" id="portal-logout-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </aside>

      {/* RIGHT WORKSPACE WRAPPER */}
      <div className="db-content-wrapper">
        {/* Render top floating header bar for all roles */}
        {currentUser.role && (
          <header className="admin-header">
            {/* Header Left: Search (admin) or Breadcrumbs (member/trainer) */}
            <div className="db-header-left">
              {currentUser.role === 'admin' ? (
                <div className="admin-search-wrapper">
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#8E919F" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input type="text" placeholder="Search members, coaches, equipment..." />
                </div>
              ) : (
                <div className="db-breadcrumb">
                  <span className="breadcrumb-sub">{currentUser.role === 'trainer' ? 'Coach Portal' : 'Athlete Portal'}</span>
                  <span className="breadcrumb-sep">/</span>
                  <span className="breadcrumb-main">{activeSubView.toUpperCase()}</span>
                </div>
              )}
            </div>

            {/* Header Right Actions */}
            <div className="admin-header-actions" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {/* Theme Toggle Button */}
              <ThemeToggle />

              {/* Notification icon & dynamic dropdown */}
              <div className="admin-action-icon" style={{ position: 'relative' }} onClick={handleToggleNotifDropdown}>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{ cursor: 'pointer' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="dot" title={`${unreadCount} unread announcements`}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}

                {/* Dropdown Menu */}
                {showNotifDropdown && (
                  <div className="notif-dropdown-menu" onClick={(e) => e.stopPropagation()}>
                    <div className="notif-dropdown-header">
                      <div>
                        <h4>
                          <span>🔔</span>
                          <span>Club Announcements</span>
                        </h4>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                          {unreadCount > 0 ? `${unreadCount} unread alert${unreadCount > 1 ? 's' : ''}` : 'All caught up'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        {unreadCount > 0 && (
                          <button
                            type="button"
                            onClick={handleMarkAllRead}
                            style={{
                              background: 'rgba(255, 94, 0, 0.1)',
                              border: '1px solid rgba(255, 94, 0, 0.3)',
                              color: 'var(--accent-volt, #ff5e00)',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              padding: '0.2rem 0.5rem',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                            title="Mark all as read"
                          >
                            ✓ Read
                          </button>
                        )}
                        {alerts.filter(a => !dismissedAlertIds.includes(a.id)).length > 0 && (
                          <button
                            type="button"
                            onClick={handleClearAllAlerts}
                            style={{
                              background: 'transparent',
                              border: '1px solid var(--border-color)',
                              color: 'var(--text-dim)',
                              fontSize: '0.7rem',
                              padding: '0.2rem 0.5rem',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                            title="Clear all alerts"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Filter Tabs */}
                    <div style={{ display: 'flex', gap: '0.4rem', padding: '0.4rem 0.8rem', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-card-hover, rgba(255,255,255,0.01))' }}>
                      <button
                        type="button"
                        onClick={() => setNotifFilter('all')}
                        style={{
                          background: notifFilter === 'all' ? 'var(--accent-volt, #ff5e00)' : 'transparent',
                          color: notifFilter === 'all' ? '#000000' : 'var(--text-muted)',
                          border: 'none',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '12px',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        All ({alerts.filter(a => !dismissedAlertIds.includes(a.id)).length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setNotifFilter('unread')}
                        style={{
                          background: notifFilter === 'unread' ? 'var(--accent-volt, #ff5e00)' : 'transparent',
                          color: notifFilter === 'unread' ? '#000000' : 'var(--text-muted)',
                          border: 'none',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '12px',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Unread ({unreadCount})
                      </button>
                    </div>

                    {/* Notification Body List */}
                    <div className="notif-dropdown-body">
                      {(() => {
                        const visibleAlerts = alerts.filter(a => a && !dismissedAlertIds.includes(a.id));
                        const filtered = notifFilter === 'unread'
                          ? visibleAlerts.filter(a => !seenAlertIds.includes(a.id))
                          : visibleAlerts;

                        if (filtered.length === 0) {
                          return (
                            <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                              <span style={{ fontSize: '1.8rem' }}>🎉</span>
                              <h5 style={{ margin: '0.5rem 0 0.15rem 0', color: 'var(--text-white)', fontWeight: 700, fontSize: '0.88rem' }}>
                                {notifFilter === 'unread' ? 'No unread notifications' : 'No active announcements'}
                              </h5>
                              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                                You are all up to date with club broadcasts.
                              </p>
                            </div>
                          );
                        }

                        return filtered.map((alt) => {
                          const isUnread = !seenAlertIds.includes(alt.id);
                          const typeConfig = {
                            holiday: { icon: '🏖️', label: 'Holiday', className: 'holiday' },
                            event: { icon: '🏆', label: 'Event', className: 'event' },
                            maintenance: { icon: '⚠️', label: 'Maintenance', className: 'maintenance' },
                            general: { icon: '📢', label: 'Announcement', className: 'general' },
                            membership: { icon: '⚡', label: 'Pass Alert', className: 'general' },
                            deal: { icon: '🏷️', label: 'Special Offer', className: 'general' }
                          }[alt.type] || { icon: '📢', label: 'Announcement', className: 'general' };

                          return (
                            <div key={alt.id} className={`notif-item ${typeConfig.className} ${isUnread ? 'unread' : ''}`}>
                              <div className="notif-item-top">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                  <span className={`notif-badge ${typeConfig.className}`}>
                                    <span>{typeConfig.icon}</span>
                                    <span>{typeConfig.label}</span>
                                  </span>
                                  {isUnread && (
                                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-volt, #ff5e00)' }} title="Unread"></span>
                                  )}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                  <span className="notif-time">{alt.date}</span>
                                  <button
                                    type="button"
                                    className="notif-item-dismiss"
                                    onClick={(e) => handleDismissAlert(e, alt.id)}
                                    title="Dismiss this alert"
                                  >
                                    ✕
                                  </button>
                                </div>
                              </div>

                              <h5 className="notif-title">{alt.title}</h5>
                              <p className="notif-msg">{alt.message}</p>
                            </div>
                          );
                        });
                      })()}
                    </div>

                    {/* Footer */}
                    <div className="notif-dropdown-footer">
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                        MuscleHub Live Broadcasts
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowNotifDropdown(false)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--accent-volt, #ff5e00)', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
                      >
                        Close ✕
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* User Profile Info with Portal Switcher Dropdown */}
              <div style={{ position: 'relative' }}>
                <div
                  className="admin-header-profile"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  style={{ cursor: 'pointer' }}
                >
                  {currentUser.picture || currentUser.profileImage ? (
                    <img
                      src={currentUser.picture || currentUser.profileImage}
                      alt={currentUser.name}
                      style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <div className="header-avatar-badge">
                      {initials}
                    </div>
                  )}
                  <div className="admin-profile-info">
                    <h4>{currentUser.name || 'User'}</h4>
                    <span>{currentUser.role === 'admin' ? 'Club Owner' : (currentUser.role === 'trainer' ? 'Certified Coach' : 'Gym Athlete')}</span>
                  </div>
                  <span className="admin-profile-arrow">▼</span>
                </div>

                {/* Clean User Profile Dropdown Menu (No Role Switcher) */}
                {showUserMenu && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 8px)',
                      right: 0,
                      width: '240px',
                      background: 'var(--bg-dark, #12121c)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '10px',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                      padding: '0.8rem',
                      zIndex: 999
                    }}
                  >
                    <div style={{ paddingBottom: '0.6rem', borderBottom: '1px solid var(--border-color)', marginBottom: '0.6rem' }}>
                      <strong style={{ color: 'var(--text-white)', display: 'block', fontSize: '0.88rem' }}>
                        {currentUser.name || 'User'}
                      </strong>
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)', display: 'block', wordBreak: 'break-all', marginTop: '0.15rem' }}>
                        {currentUser.email || ''}
                      </span>
                      <span style={{ display: 'inline-block', marginTop: '0.4rem', fontSize: '0.68rem', padding: '0.15rem 0.5rem', borderRadius: '4px', background: 'rgba(0, 240, 255, 0.1)', color: 'var(--accent-cyan)', fontWeight: 700, border: '1px solid rgba(0, 240, 255, 0.3)' }}>
                        {currentUser.role === 'admin' ? 'Club Owner (Admin)' : (currentUser.role === 'trainer' ? 'Personal Coach' : 'Gym Athlete')}
                      </span>
                    </div>

                    {currentUser.role === 'member' && (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveSubView('profile');
                          setShowUserMenu(false);
                        }}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '0.55rem 0.6rem',
                          fontSize: '0.82rem',
                          color: 'var(--text-white)',
                          background: 'transparent',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          marginBottom: '0.3rem'
                        }}
                      >
                        👤 View &amp; Edit Profile
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleLogout}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '0.55rem 0.6rem',
                        fontSize: '0.82rem',
                        color: '#ff3e6c',
                        background: 'rgba(255, 62, 108, 0.08)',
                        border: '1px solid rgba(255, 62, 108, 0.2)',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontWeight: 700
                      }}
                    >
                      🚪 Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>
        )}

        {/* MAIN WORKSPACE CONTENT */}
        <main className="db-main-content">
          <div className="db-workspace-container">
            <WorkspaceErrorBoundary>
            {currentUser.role && currentUser.role.toLowerCase() === 'admin' ? (
              activeSubView === 'trainer-module' ? (
                <div>
                  <div style={{
                    background: 'rgba(198, 255, 0, 0.15)',
                    border: '1px solid var(--accent-volt)',
                    color: 'var(--text-white)',
                    padding: '0.8rem 1.5rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1.2rem',
                    borderRadius: '8px',
                    boxShadow: '0 0 15px rgba(198, 255, 0, 0.1)'
                  }}>
                    <span style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      ⚡ <strong>ADMIN PREVIEW MODE:</strong> You are currently viewing the <strong>Trainer Panel</strong> module.
                    </span>
                    <button
                      className="glow-btn"
                      style={{ padding: '0.45rem 1.2rem', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer', background: 'var(--accent-volt)', color: '#000' }}
                      onClick={() => setActiveSubView('home')}
                    >
                      Return to Admin Dashboard
                    </button>
                  </div>
                  <TrainerPanel activeView="overview" currentUser={{ ...currentUser, role: 'trainer', name: 'Coach Marcus Vance (Admin Preview)' }} />
                </div>
              ) : activeSubView === 'member-module' ? (
                <div>
                  <div style={{
                    background: 'rgba(0, 240, 255, 0.15)',
                    border: '1px solid var(--accent-cyan)',
                    color: 'var(--text-white)',
                    padding: '0.8rem 1.5rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1.2rem',
                    borderRadius: '8px',
                    boxShadow: '0 0 15px rgba(0, 240, 255, 0.1)'
                  }}>
                    <span style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      ⚡ <strong>ADMIN PREVIEW MODE:</strong> You are currently viewing the <strong>Member Panel</strong> module.
                    </span>
                    <button
                      className="glow-btn"
                      style={{ padding: '0.45rem 1.2rem', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer', background: 'var(--accent-cyan)', color: '#000', boxShadow: 'var(--glow-cyan)' }}
                      onClick={() => setActiveSubView('home')}
                    >
                      Return to Admin Dashboard
                    </button>
                  </div>
                  <MemberPanel
                    activeView="home"
                    currentUser={{ ...currentUser, role: 'member', name: 'Ethan Hunt' }}
                    addActivity={addActivity}
                    onUpdateUser={(updatedData) => setCurrentUser((prev) => ({ ...prev, ...updatedData }))}
                    onNavigateSubView={(view) => setActiveSubView(view)}
                  />
                </div>
              ) : activeSubView === 'supplements' ? (
                <div>
                  <div style={{
                    background: 'rgba(255, 94, 0, 0.15)',
                    border: '1px solid var(--accent-volt)',
                    color: 'var(--text-white)',
                    padding: '0.8rem 1.5rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1.2rem',
                    borderRadius: '8px',
                    boxShadow: '0 0 15px rgba(255, 94, 0, 0.1)'
                  }}>
                    <span style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      🛒 <strong>SUPPLEMENT STORE:</strong> You are currently viewing the <strong>Supplement Store</strong>.
                    </span>
                    <button
                      className="glow-btn"
                      style={{ padding: '0.45rem 1.2rem', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer', background: 'var(--accent-volt)', color: '#fff' }}
                      onClick={() => setActiveSubView('home')}
                    >
                      Return to Admin Dashboard
                    </button>
                  </div>
                  <SupplementShop isAdmin={true} onCheckoutSuccess={(detail) => {
                    addActivity(`Supplements Purchase: Admin ordered [${detail.itemsSummary}] (₹${detail.total.toFixed(2)})`, 'cyan');
                    CustomSwal.fire({
                      title: 'Purchase Successful! 🛒',
                      text: `Admin transaction completed for ${detail.itemsSummary}.`,
                      icon: 'success'
                    });
                  }} />
                </div>
              ) : (
                <AdminPanel
                  activeView={activeSubView}
                  currentUser={currentUser}
                  activities={activities}
                  addActivity={addActivity}
                  onNavigateSubView={setActiveSubView}
                />
              )
            ) : currentUser.role && currentUser.role.toLowerCase() === 'member' ? (
              <MemberPanel
                activeView={activeSubView}
                currentUser={currentUser}
                addActivity={addActivity}
                onUpdateUser={(updatedData) => setCurrentUser((prev) => ({ ...prev, ...updatedData }))}
                onNavigateSubView={(view) => setActiveSubView(view)}
              />
            ) : (
              <TrainerPanel activeView={activeSubView} currentUser={currentUser} />
            )}
          </WorkspaceErrorBoundary>
        </div>
      </main>
    </div>

      {showUpgradeModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(5, 5, 8, 0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            background: 'var(--bg-card, #ffffff)',
            border: '1px solid var(--border-color)',
            boxShadow: '0 0 35px rgba(255, 94, 0, 0.15), 0 10px 40px rgba(0,0,0,0.5)',
            borderRadius: '12px',
            width: '90%',
            maxWidth: '850px',
            padding: '2.5rem',
            position: 'relative',
            fontFamily: 'var(--font-body, sans-serif)',
            color: 'var(--text-white)'
          }}>
            {/* Close Button */}
            <button
              onClick={() => setShowUpgradeModal(false)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1.2rem',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted, #8E919F)',
                fontSize: '2rem',
                cursor: 'pointer',
                transition: 'color 0.2s',
                lineHeight: 1
              }}
              onMouseEnter={(e) => e.target.style.color = '#ff3e6c'}
              onMouseLeave={(e) => e.target.style.color = 'var(--text-muted, #8E919F)'}
            >
              &times;
            </button>

            {/* Modal Header */}
            <div style={{ marginBottom: '2rem', textAlign: 'left' }}>
              <h3 style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                fontSize: '1.65rem',
                color: 'var(--text-white)',
                textTransform: 'uppercase',
                margin: 0,
                letterSpacing: '0.02em'
              }}>
                Upgrade Gym Subscription Plan
              </h3>
              <p style={{ color: 'var(--text-muted, #8E919F)', fontSize: '0.88rem', marginTop: '0.4rem', lineHeight: '1.4' }}>
                Select a higher tier workspace subscription plan to unlock more member slots, detailed high-performance analytics, and advanced coaching features.
              </p>
            </div>

            {/* Plan Options Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '1rem' }}>
              {[
                {
                  name: 'Basic',
                  price: 49,
                  limit: '10 Member Slots',
                  features: [
                    'Standard Dashboard Analytics',
                    'Biometric RFID Gate Support',
                    'Standard Equipment Tracking',
                    'Standard Support Channels'
                  ],
                  badge: 'Current Tier'
                },
                {
                  name: 'Growth Pro',
                  price: 99,
                  limit: '100 Member Slots',
                  features: [
                    'Advanced Analytics & Reports',
                    'Priority Email & Chat Support',
                    'Gym Scheduling Systems',
                    'Assigned Coach Workflows',
                    'Full Interactive Shop Access'
                  ],
                  badge: 'Most Popular'
                },
                {
                  name: 'Ultimate Elite',
                  price: 199,
                  limit: 'Unlimited Slots',
                  features: [
                    'Unlimited Member Slots',
                    '24/7 Dedicated Account Manager',
                    'Manual Keycard & Turnstile Attendance',
                    'Custom Branding & Subdomain',
                    'Advanced Billing Audit Logs'
                  ],
                  badge: 'Best Value'
                }
              ].map((plan) => {
                const isCurrent = adminPlan === plan.name || (adminPlan === 'Basic' && plan.name === 'Basic') || ((adminPlan === 'Pro' || adminPlan === 'Growth Pro') && plan.name === 'Growth Pro') || ((adminPlan === 'Elite' || adminPlan === 'Ultimate Elite') && plan.name === 'Ultimate Elite');
                
                return (
                  <div
                    key={plan.name}
                    style={{
                      background: 'var(--bg-dark, rgba(255, 255, 255, 0.03))',
                      border: isCurrent ? '1.5px solid var(--accent-volt, #FF5E00)' : '1px solid var(--border-color)',
                      borderRadius: '10px',
                      padding: '1.8rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      minHeight: '380px',
                      transition: 'all 0.3s ease',
                      boxShadow: isCurrent ? '0 0 20px rgba(255, 94, 0, 0.1)' : 'none',
                      position: 'relative'
                    }}
                    className="plan-selector-card"
                  >
                    {/* Badge */}
                    {isCurrent && (
                      <span style={{
                        position: 'absolute',
                        top: '-12px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: '#FF5E00',
                        color: '#fff',
                        fontSize: '0.65rem',
                        fontWeight: 800,
                        padding: '0.25rem 0.75rem',
                        borderRadius: '20px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        boxShadow: '0 0 10px rgba(255, 94, 0, 0.4)'
                      }}>
                        {plan.badge}
                      </span>
                    )}

                    <div>
                      <h4 style={{ color: 'var(--text-white)', fontWeight: 800, fontSize: '1.25rem', margin: '0 0 0.25rem 0', textTransform: 'uppercase' }}>
                        {plan.name}
                      </h4>
                      <p style={{ color: '#FF5E00', fontWeight: 'bold', fontSize: '0.8rem', margin: '0 0 1.2rem 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {plan.limit}
                      </p>
                      
                      {/* Features List */}
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {plan.features.map((feat, idx) => (
                          <li key={idx} style={{ fontSize: '0.78rem', color: 'var(--text-muted, #8E919F)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span style={{ color: '#FF5E00', fontSize: '0.9rem' }}>✓</span> {feat}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div style={{ marginTop: '2rem' }}>
                      <div style={{ marginBottom: '1.2rem' }}>
                        <span style={{ fontSize: '2rem', color: 'var(--text-white)', fontWeight: 800 }}>₹{plan.price}</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted, #8E919F)' }}> / month</span>
                      </div>
                      
                      <button
                        onClick={() => {
                          if (isCurrent) return;
                          localStorage.setItem('apex_admin_plan', plan.name);
                          setAdminPlan(plan.name);
                          setShowUpgradeModal(false);
                          
                          // Log Activity
                          addActivity(`Club Owner upgraded subscription workspace to ${plan.name} Plan`, 'orange');
                          
                          // Fire SweetAlert
                          CustomSwal.fire({
                            title: 'Plan Upgraded! ⚡',
                            text: `Successfully upgraded to the ${plan.name} subscription tier. Your new limits are active now!`,
                            icon: 'success',
                            confirmButtonText: 'PROCEED TO WORKSPACE'
                          });
                        }}
                        disabled={isCurrent}
                        className={isCurrent ? 'outline-btn' : 'glow-btn'}
                        style={{
                          width: '100%',
                          padding: '0.8rem',
                          fontSize: '0.85rem',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          cursor: isCurrent ? 'default' : 'pointer',
                          opacity: isCurrent ? 0.6 : 1,
                          border: isCurrent ? '1px solid rgba(255,255,255,0.08)' : 'none',
                          background: isCurrent ? 'rgba(255,255,255,0.02)' : '#FF5E00',
                          color: isCurrent ? 'var(--text-muted)' : '#fff',
                          borderRadius: '6px',
                          letterSpacing: '0.03em',
                          transition: 'all 0.25s'
                        }}
                      >
                        {isCurrent ? 'Active Plan' : 'Select Plan'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
