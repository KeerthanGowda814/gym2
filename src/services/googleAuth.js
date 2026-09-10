import { ApexAuth } from './auth';

export const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '273972686831-4pkpicq6o7ie7ms4m7a6apvmir194uqu.apps.googleusercontent.com';


const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Safely decodes a JWT token payload on the client
 */
export const parseJwtPayload = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Error decoding JWT payload:', e);
    return null;
  }
};

/**
 * Loads the Google Identity Services SDK script dynamically if not already loaded
 */
export const loadGoogleScript = () => {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      return resolve(window.google.accounts.id);
    }

    const existingScript = document.getElementById('google-gsi-client');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(window.google?.accounts?.id));
      existingScript.addEventListener('error', (err) => reject(err));
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-gsi-client';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      resolve(window.google?.accounts?.id);
    };
    script.onerror = (err) => {
      console.warn('Failed to load Google Identity Services SDK:', err);
      reject(err);
    };
    document.head.appendChild(script);
  });
};

/**
 * Authenticates user via Google credential with backend or client fallback
 */
export const processGoogleCredential = async (credential, targetRole = 'member') => {
  const decoded = parseJwtPayload(credential);
  if (!decoded || !decoded.email) {
    throw new Error('Invalid Google credential payload.');
  }

  const cleanEmail = decoded.email.trim().toLowerCase();
  const userName = decoded.name || cleanEmail.split('@')[0];
  const userPicture = decoded.picture || null;

  try {
    // 1. Send credential to backend Express API
    const response = await fetch(`${API_BASE_URL}/auth/google`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        credential,
        role: targetRole
      })
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.user) {
        ApexAuth.authenticateUser(data.user.email, data.user.role, data.user.name, true);
        return {
          success: true,
          user: data.user,
          token: data.token
        };
      }
    }
  } catch (err) {
    console.warn('Backend server offline during Google Auth. Using client session fallback:', err.message);
  }

  // 2. Client-side fallback authentication if backend is offline
  const registeredUsers = JSON.parse(localStorage.getItem('apex_registered_users') || '[]');
  let existing = registeredUsers.find((u) => u.email && u.email.toLowerCase() === cleanEmail);

  if (!existing) {
    existing = {
      email: cleanEmail,
      name: userName,
      role: targetRole,
      picture: userPicture,
      membershipTier: targetRole === 'trainer' ? 'Staff Trainer' : (targetRole === 'admin' ? 'System Admin' : 'Muscle Pro'),
      joinedDate: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      authProvider: 'google'
    };
    registeredUsers.push(existing);
    localStorage.setItem('apex_registered_users', JSON.stringify(registeredUsers));
  }

  ApexAuth.authenticateUser(existing.email, existing.role || targetRole, existing.name, true);

  return {
    success: true,
    user: existing
  };
};

/**
 * Initializes and renders a Google Sign-In button into a DOM container
 */
export const renderGoogleSignInButton = async (containerElement, {
  role = 'member',
  onSuccess,
  onError,
  text = 'signin_with',
  theme = 'filled_black',
  size = 'large',
  width = 320
} = {}) => {
  try {
    await loadGoogleScript();

    if (!window.google?.accounts?.id || !containerElement) return;

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: async (response) => {
        try {
          if (!response.credential) {
            throw new Error('No credential returned from Google.');
          }
          const result = await processGoogleCredential(response.credential, role);
          if (onSuccess) onSuccess(result.user);
        } catch (err) {
          console.error('Google Sign In callback error:', err);
          if (onError) onError(err);
        }
      },
      auto_select: false,
      cancel_on_tap_outside: true
    });

    containerElement.innerHTML = '';
    window.google.accounts.id.renderButton(containerElement, {
      type: 'standard',
      theme,
      size,
      text,
      shape: 'rectangular',
      logo_alignment: 'left',
      width: width || containerElement.offsetWidth || 300
    });
  } catch (err) {
    console.error('Failed to initialize Google Sign In button:', err);
    if (onError) onError(err);
  }
};
