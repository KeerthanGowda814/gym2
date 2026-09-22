/**
 * APEX ATHLETICS - COMPETITION & CERTIFICATE API SERVICE
 * Connects Member, Trainer, and Admin panels to real competition endpoints
 */

const API_BASE_URL = 'http://localhost:5000/api';

const getHeaders = () => {
  const token = localStorage.getItem('apex_auth_token') || sessionStorage.getItem('apex_auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

export const competitionApi = {
  /**
   * List competitions (filterable by status: Upcoming, Active, Completed)
   * @param {String} status
   */
  async getCompetitions(status = '') {
    try {
      const query = status ? `?status=${encodeURIComponent(status)}` : '';
      const res = await fetch(`${API_BASE_URL}/competitions${query}`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed to fetch competitions');
      const data = await res.json();
      return data.data || [];
    } catch (err) {
      console.warn('CompetitionApi getCompetitions error:', err.message);
      return [];
    }
  },

  /**
   * Get single competition details
   * @param {String} id
   */
  async getCompetitionById(id) {
    try {
      const res = await fetch(`${API_BASE_URL}/competitions/${id}`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed to fetch competition details');
      const data = await res.json();
      return data.data || null;
    } catch (err) {
      console.warn('CompetitionApi getCompetitionById error:', err.message);
      return null;
    }
  },

  /**
   * Admin: Create new competition
   * @param {Object} payload
   */
  async createCompetition(payload) {
    try {
      const res = await fetch(`${API_BASE_URL}/competitions`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to create competition');
      }
      return await res.json();
    } catch (err) {
      console.error('CompetitionApi createCompetition error:', err);
      throw err;
    }
  },

  /**
   * Admin: Update competition
   * @param {String} id
   * @param {Object} updates
   */
  async updateCompetition(id, updates) {
    try {
      const res = await fetch(`${API_BASE_URL}/competitions/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(updates)
      });
      if (!res.ok) throw new Error('Failed to update competition');
      return await res.json();
    } catch (err) {
      console.error('CompetitionApi updateCompetition error:', err);
      throw err;
    }
  },

  /**
   * Admin: Delete competition
   * @param {String} id
   */
  async deleteCompetition(id) {
    try {
      const res = await fetch(`${API_BASE_URL}/competitions/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (!res.ok) throw new Error('Failed to delete competition');
      return await res.json();
    } catch (err) {
      console.error('CompetitionApi deleteCompetition error:', err);
      throw err;
    }
  },

  /**
   * Member or Trainer registers for an event
   * @param {String} id
   * @param {Object} regData - { category, division, phone, notes }
   */
  async registerForCompetition(id, regData) {
    try {
      const res = await fetch(`${API_BASE_URL}/competitions/${id}/register`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(regData)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Registration failed');
      }
      return data;
    } catch (err) {
      console.error('CompetitionApi registerForCompetition error:', err);
      throw err;
    }
  },

  /**
   * Get participants roster for a competition
   * @param {String} id
   */
  async getParticipants(id) {
    try {
      const res = await fetch(`${API_BASE_URL}/competitions/${id}/participants`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed to fetch participants');
      const data = await res.json();
      return data.data || [];
    } catch (err) {
      console.warn('CompetitionApi getParticipants error:', err.message);
      return [];
    }
  },

  /**
   * Get registrations for current logged in user
   * @param {String} email
   */
  async getMyRegistrations(email) {
    try {
      const query = email ? `?email=${encodeURIComponent(email)}` : '';
      const res = await fetch(`${API_BASE_URL}/competitions/my-registrations${query}`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed to fetch my registrations');
      const data = await res.json();
      return data.data || [];
    } catch (err) {
      console.warn('CompetitionApi getMyRegistrations error:', err.message);
      return [];
    }
  },

  /**
   * Admin publishes results/winners podium
   * @param {String} id
   * @param {Object} resultsData - { winners: [...], summary }
   */
  async publishResults(id, resultsData) {
    try {
      const res = await fetch(`${API_BASE_URL}/competitions/${id}/results`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(resultsData)
      });
      if (!res.ok) throw new Error('Failed to publish results');
      return await res.json();
    } catch (err) {
      console.error('CompetitionApi publishResults error:', err);
      throw err;
    }
  },

  /**
   * Get results for competition
   * @param {String} id
   */
  async getResults(id) {
    try {
      const res = await fetch(`${API_BASE_URL}/competitions/${id}/results`, { headers: getHeaders() });
      if (!res.ok) return null;
      const data = await res.json();
      return data.data || null;
    } catch (err) {
      return null;
    }
  },

  /**
   * Admin generates certificates in 1 click
   * @param {String} id
   */
  async generateCertificates(id) {
    try {
      const res = await fetch(`${API_BASE_URL}/competitions/${id}/certificates/generate`, {
        method: 'POST',
        headers: getHeaders()
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to generate certificates');
      }
      return await res.json();
    } catch (err) {
      console.error('CompetitionApi generateCertificates error:', err);
      throw err;
    }
  },

  /**
   * Get certificates for current logged-in user
   * @param {String} email
   */
  async getMyCertificates(email) {
    try {
      const query = email ? `?email=${encodeURIComponent(email)}` : '';
      const res = await fetch(`${API_BASE_URL}/competitions/certificates/my${query}`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed to fetch certificates');
      const data = await res.json();
      return data.data || [];
    } catch (err) {
      console.warn('CompetitionApi getMyCertificates error:', err.message);
      return [];
    }
  },

  /**
   * Get single certificate detail for verification/rendering
   * @param {String} certId
   */
  async getCertificateById(certId) {
    try {
      const res = await fetch(`${API_BASE_URL}/competitions/certificates/${certId}`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed to retrieve certificate');
      const data = await res.json();
      return data.data || null;
    } catch (err) {
      console.warn('CompetitionApi getCertificateById error:', err.message);
      return null;
    }
  }
};
