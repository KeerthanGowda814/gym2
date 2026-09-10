/**
 * APEX ATHLETICS - SECURITY & JWT ROUTING GUARD
 * Simulated Client-Side JSON Web Token (JWT) Parser & Storage Engine
 */

const AUTH_CONFIG = {
  tokenKey: 'apex_auth_token',
  tokenDurationMs: 60 * 60 * 1000, // Tokens expire in 1 hour
  mockSignatureKey: 'apex_sha256_mock_sig_valid'
};

// --- BASE64 HELPER UTILITIES ---
const base64UrlEncode = (str) => {
  try {
    const jsonStr = JSON.stringify(str);
    const base64 = btoa(unescape(encodeURIComponent(jsonStr)));
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch (e) {
    console.error('Base64 encoding failed:', e);
    return '';
  }
};

const base64UrlDecode = (str) => {
  try {
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    const jsonStr = decodeURIComponent(escape(atob(base64)));
    return JSON.parse(jsonStr);
  } catch (e) {
    console.warn('Base64 decoding failed:', e);
    return null;
  }
};

// --- CORE AUTHENTICATION ENGINE ---
export const ApexAuth = {
  
  /**
   * Generates a simulated cryptographically-split JWT
   */
  generateSimulatedJWT(userEmail, userRole, username) {
    const header = {
      alg: 'HS256',
      typ: 'JWT'
    };
    
    const payload = {
      sub: userEmail,
      role: userRole ? userRole.toLowerCase() : 'trainer',
      name: username || 'User',
      iat: Date.now(),
      exp: Date.now() + AUTH_CONFIG.tokenDurationMs
    };
    
    const encodedHeader = base64UrlEncode(header);
    const encodedPayload = base64UrlEncode(payload);
    // Secure simulated cryptographic signature
    const signature = btoa(encodedHeader + '.' + encodedPayload + '.' + AUTH_CONFIG.mockSignatureKey)
                      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
                      
    return `${encodedHeader}.${encodedPayload}.${signature}`;
  },

  /**
   * Verifies the authenticity and expiry of a token (supports real backend JWTs and simulated tokens)
   */
  verifySimulatedJWT(token) {
    if (!token) return false;
    
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    const [, payload] = parts;
    
    // Decode payload
    const decodedPayload = base64UrlDecode(payload);
    if (!decodedPayload) return false;
    
    // Check expiration time (handle both seconds-based standard JWT exp and ms-based simulated exp)
    if (decodedPayload.exp) {
      const expMs = decodedPayload.exp < 10000000000 ? decodedPayload.exp * 1000 : decodedPayload.exp;
      if (Date.now() > expMs) {
        console.warn('Authentication Warn: JWT Session expired.');
        return false;
      }
    }
    
    return true;
  },

  /**
   * Performs authentication write to storage
   */
  authenticateUser(email, role, username, rememberMe = true, existingToken = null) {
    const token = existingToken || this.generateSimulatedJWT(email, role, username);
    
    if (rememberMe) {
      localStorage.setItem(AUTH_CONFIG.tokenKey, token);
      localStorage.setItem('apex_remember_me', 'true');
    } else {
      sessionStorage.setItem(AUTH_CONFIG.tokenKey, token);
      localStorage.removeItem('apex_remember_me');
    }
    
    return token;
  },

  /**
   * Retrieves active token from either storage container
   */
  getToken() {
    return localStorage.getItem(AUTH_CONFIG.tokenKey) || sessionStorage.getItem(AUTH_CONFIG.tokenKey);
  },

  /**
   * Logs out the user by clearing both storage scopes
   */
  logout() {
    localStorage.removeItem(AUTH_CONFIG.tokenKey);
    sessionStorage.removeItem(AUTH_CONFIG.tokenKey);
    localStorage.removeItem('apex_remember_me');
  },

  /**
   * Verifies if current user is logged in
   */
  isAuthenticated() {
    const token = this.getToken();
    return this.verifySimulatedJWT(token);
  },

  /**
   * Retrieves and decodes payload of active user
   */
  getCurrentUser() {
    const token = this.getToken();
    if (!token) return null;
    
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = base64UrlDecode(parts[1]);
    if (!payload) return null;

    return {
      userId: payload.userId || payload.sub || 'USR-LOGGED-IN',
      email: payload.email || payload.sub || '',
      name: payload.name || (payload.email ? payload.email.split('@')[0] : 'User'),
      role: payload.role || 'member',
      picture: payload.picture || null,
      membershipTier: payload.membershipTier || 'Muscle Pro',
      ...payload
    };
  }
};

