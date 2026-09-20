/**
 * APEX ATHLETICS - TRAINER PANEL API SERVICE CLIENT
 * Connects Trainer Panel components to Node.js Express backend API endpoints
 */

const API_BASE_URL = 'http://localhost:5000/api/trainer';

const getHeaders = () => {
  const token = localStorage.getItem('apex_auth_token') || sessionStorage.getItem('apex_auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

export const trainerApi = {
  // --- 0. COACHING REQUESTS & APPROVAL ENDPOINTS ---
  async getTrainerRequests(coachName) {
    try {
      const q = coachName ? `?coachName=${encodeURIComponent(coachName)}` : '';
      const res = await fetch(`${API_BASE_URL}/requests${q}`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed fetching coaching requests');
      const data = await res.json();
      return data.data;
    } catch (err) {
      console.warn('Trainer API Notice: Failed fetching requests.', err);
      return null;
    }
  },

  async acceptTrainerRequest(requestId) {
    try {
      const res = await fetch(`${API_BASE_URL}/requests/${requestId}/accept`, {
        method: 'POST',
        headers: getHeaders()
      });
      if (!res.ok) throw new Error('Failed accepting coaching request');
      return await res.json();
    } catch (err) {
      console.warn('Trainer API Notice: Failed accepting request.', err);
      return null;
    }
  },

  async rejectTrainerRequest(requestId, reason) {
    try {
      const res = await fetch(`${API_BASE_URL}/requests/${requestId}/reject`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ reason })
      });
      if (!res.ok) throw new Error('Failed rejecting coaching request');
      return await res.json();
    } catch (err) {
      console.warn('Trainer API Notice: Failed rejecting request.', err);
      return null;
    }
  },

  // --- 1. CLIENT ROSTER ENDPOINTS ---
  async getMembers() {
    try {
      const res = await fetch(`${API_BASE_URL}/members`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed fetching trainer members');
      const data = await res.json();
      return data.data;
    } catch (err) {
      return null;
    }
  },

  async addMember(memberData) {
    try {
      const res = await fetch(`${API_BASE_URL}/members`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(memberData)
      });
      if (!res.ok) throw new Error('Failed adding member to roster');
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  async deleteMember(memberId) {
    try {
      const res = await fetch(`${API_BASE_URL}/members/${memberId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (!res.ok) throw new Error('Failed deleting member');
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  // --- 2. WORKOUT PLANS ENDPOINTS ---
  async getWorkouts() {
    try {
      const res = await fetch(`${API_BASE_URL}/workouts`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed fetching workout plans');
      const data = await res.json();
      return data.data;
    } catch (err) {
      return null;
    }
  },

  async createWorkout(workoutData) {
    try {
      const res = await fetch(`${API_BASE_URL}/workouts`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(workoutData)
      });
      if (!res.ok) throw new Error('Failed creating workout plan');
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  async assignWorkout(planId, memberId, memberName = '', memberEmail = '') {
    try {
      const res = await fetch(`${API_BASE_URL}/workouts/assign`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ planId, memberId, memberName, memberEmail })
      });
      if (!res.ok) throw new Error('Failed assigning workout plan');
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  async deleteWorkout(planId) {
    try {
      const res = await fetch(`${API_BASE_URL}/workouts/${planId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (!res.ok) throw new Error('Failed deleting workout plan');
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  // --- 3. DIET PLANS ENDPOINTS ---
  async getDiets() {
    try {
      const res = await fetch(`${API_BASE_URL}/diets`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed fetching diet plans');
      const data = await res.json();
      return data.data;
    } catch (err) {
      return null;
    }
  },

  async createDiet(dietData) {
    try {
      const res = await fetch(`${API_BASE_URL}/diets`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(dietData)
      });
      if (!res.ok) throw new Error('Failed creating diet plan');
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  async assignDiet(dietId, memberId, memberName = '', memberEmail = '') {
    try {
      const res = await fetch(`${API_BASE_URL}/diets/assign`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ dietId, memberId, memberName, memberEmail })
      });
      if (!res.ok) throw new Error('Failed assigning diet plan');
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  async deleteDiet(dietId) {
    try {
      const res = await fetch(`${API_BASE_URL}/diets/${dietId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (!res.ok) throw new Error('Failed deleting diet plan');
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  // --- 4. SCHEDULE & AGENDA ENDPOINTS ---
  async getSchedule() {
    try {
      const res = await fetch(`${API_BASE_URL}/schedule`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed fetching schedule agenda');
      const data = await res.json();
      return data.data;
    } catch (err) {
      return null;
    }
  },

  async createScheduleSession(sessionData) {
    try {
      const res = await fetch(`${API_BASE_URL}/schedule`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(sessionData)
      });
      if (!res.ok) throw new Error('Failed creating schedule session');
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  async updateScheduleStatus(sessionId, status) {
    try {
      const res = await fetch(`${API_BASE_URL}/schedule/${sessionId}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error('Failed updating schedule status');
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  async cancelScheduleSession(sessionId) {
    try {
      const res = await fetch(`${API_BASE_URL}/schedule/${sessionId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (!res.ok) throw new Error('Failed cancelling session');
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  // --- 5. TURNSTILE ATTENDANCE ENDPOINTS ---
  async getAttendance() {
    try {
      const res = await fetch(`${API_BASE_URL}/attendance`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed fetching attendance logs');
      const data = await res.json();
      return data.data;
    } catch (err) {
      return null;
    }
  },

  async triggerTurnstile(memberName, action, date, time) {
    try {
      const res = await fetch(`${API_BASE_URL}/attendance/turnstile`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ memberName, action, date, time })
      });
      if (!res.ok) throw new Error('Failed triggering turnstile release');
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  // --- 6. CLIENT CHAT ENDPOINTS ---
  async getChatHistory(memberName, clientEmail, coachName) {
    try {
      const params = new URLSearchParams();
      if (memberName) params.append('memberName', memberName);
      if (clientEmail) params.append('clientEmail', clientEmail);
      if (coachName) params.append('coachName', coachName);
      const url = `${API_BASE_URL}/chat?${params.toString()}`;
      const res = await fetch(url, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed fetching chat history');
      const data = await res.json();
      return data;
    } catch (err) {
      return null;
    }
  },

  async sendChatMessage(text, sender = 'coach', memberName = '', clientEmail = '', coachName = '') {
    try {
      const res = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ text, sender, memberName, clientEmail, coachName })
      });
      if (!res.ok) throw new Error('Failed sending chat message');
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  async markChatRead(memberName, clientEmail, coachName) {
    try {
      const res = await fetch(`${API_BASE_URL}/chat/read`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ memberName, clientEmail, coachName })
      });
      if (!res.ok) throw new Error('Failed marking chat read');
      return await res.json();
    } catch (err) {
      return null;
    }
  }
};
