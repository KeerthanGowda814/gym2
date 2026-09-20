/**
  * APEX ATHLETICS - MEMBER API SERVICE CLIENT
  * Connects Member Panel components to Node.js Express backend API endpoints
  */

const API_BASE_URL = 'http://localhost:5000/api';

const getHeaders = () => {
  const token = localStorage.getItem('apex_auth_token') || sessionStorage.getItem('apex_auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

export const memberApi = {
  // --- 1. WORKOUT JOURNAL ENDPOINTS ---
  async getWorkouts() {
    try {
      const res = await fetch(`${API_BASE_URL}/member/workouts`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed to fetch workouts');
      const data = await res.json();
      return data.data;
    } catch (err) {
      console.warn('Member API Notice: Backend server offline or unreachable. Using client state.', err.message);
      return null;
    }
  },

  async addWorkout(workoutData) {
    try {
      const res = await fetch(`${API_BASE_URL}/member/workouts`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(workoutData)
      });
      if (!res.ok) throw new Error('Failed to add workout');
      const data = await res.json();
      return data.data;
    } catch (err) {
      console.warn('Member API Notice: Backend server offline. Using client state.', err.message);
      return null;
    }
  },

  // --- 2. NUTRITION ENDPOINTS ---
  async getNutrition() {
    try {
      const res = await fetch(`${API_BASE_URL}/member/nutrition`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed to fetch nutrition');
      const data = await res.json();
      return data.data;
    } catch (err) {
      return null;
    }
  },

  // --- 3. MEMBERSHIP & PROFILE ENDPOINTS ---
  async getProfile() {
    try {
      const res = await fetch(`${API_BASE_URL}/member/profile`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed to fetch profile');
      const data = await res.json();
      return data.data;
    } catch (err) {
      console.warn('Member API Notice: Profile endpoint unreachable, using client state.', err.message);
      return null;
    }
  },

  async updateProfile(profileData) {
    try {
      const res = await fetch(`${API_BASE_URL}/member/profile`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(profileData)
      });
      if (!res.ok) throw new Error('Failed to update profile');
      return await res.json();
    } catch (err) {
      console.warn('Member API Notice: Failed to sync profile with server.', err.message);
      return null;
    }
  },

  async getMembership() {
    try {
      const res = await fetch(`${API_BASE_URL}/member/membership`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed to fetch membership info');
      const data = await res.json();
      return data.data;
    } catch (err) {
      return null;
    }
  },

  async getInvoices() {
    try {
      const res = await fetch(`${API_BASE_URL}/member/invoices`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed to fetch invoices');
      const data = await res.json();
      return data.data;
    } catch (err) {
      return null;
    }
  },

  async renewMembership() {
    try {
      const res = await fetch(`${API_BASE_URL}/member/membership/renew`, {
        method: 'POST',
        headers: getHeaders()
      });
      if (!res.ok) throw new Error('Failed to renew membership');
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  async changePlan(planName) {
    try {
      const res = await fetch(`${API_BASE_URL}/member/membership/plan`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ planName })
      });
      if (!res.ok) throw new Error('Failed to change plan');
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  async setAutoRenew(autoRenew) {
    try {
      const res = await fetch(`${API_BASE_URL}/member/membership/autorenew`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ autoRenew })
      });
      if (!res.ok) throw new Error('Failed to set auto-renew');
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  // --- 4. TRAINER & CHAT ENDPOINTS ---
  async getTrainers() {
    try {
      const res = await fetch(`${API_BASE_URL}/member/trainers`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed to fetch trainers list');
      const data = await res.json();
      return data.data;
    } catch (err) {
      console.warn('Member API Notice: Failed to fetch trainers list from server.', err.message);
      return null;
    }
  },

  async selectTrainer(trainerId, trainerName) {
    try {
      const res = await fetch(`${API_BASE_URL}/member/trainer/select`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ trainerId, trainerName })
      });
      if (!res.ok) throw new Error('Failed to select trainer');
      return await res.json();
    } catch (err) {
      console.warn('Member API Notice: Failed to sync trainer selection.', err.message);
      return null;
    }
  },

  async submitTrainerRequest(requestData) {
    try {
      const res = await fetch(`${API_BASE_URL}/member/trainer/request`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(requestData)
      });
      if (!res.ok) throw new Error('Failed to submit trainer coaching request');
      return await res.json();
    } catch (err) {
      console.warn('Member API Notice: Failed to submit trainer request.', err.message);
      return null;
    }
  },

  async getTrainerRequestStatus(email, name) {
    try {
      const params = [];
      if (email) params.push(`email=${encodeURIComponent(email)}`);
      if (name) params.push(`name=${encodeURIComponent(name)}`);
      const q = params.length > 0 ? `?${params.join('&')}` : '';
      const res = await fetch(`${API_BASE_URL}/member/trainer/request-status${q}`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed to fetch request status');
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  async cancelTrainerRequest(requestId, memberEmail) {
    try {
      const res = await fetch(`${API_BASE_URL}/member/trainer/request/cancel`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ requestId, memberEmail })
      });
      if (!res.ok) throw new Error('Failed to cancel request');
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  async getTrainerInfo() {
    try {
      const res = await fetch(`${API_BASE_URL}/member/trainer/info`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed to fetch trainer info');
      const data = await res.json();
      return data.data;
    } catch (err) {
      return null;
    }
  },

  async bookSession(sessionData) {
    try {
      const res = await fetch(`${API_BASE_URL}/member/trainer/book`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(sessionData)
      });
      if (!res.ok) throw new Error('Failed to book session');
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  async getTrainerSchedule(memberName) {
    try {
      const url = memberName ? `${API_BASE_URL}/member/trainer/schedule?name=${encodeURIComponent(memberName)}` : `${API_BASE_URL}/member/trainer/schedule`;
      const res = await fetch(url, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed to fetch trainer schedule');
      const data = await res.json();
      return data.data;
    } catch (err) {
      return null;
    }
  },

  async getChatHistory(memberName, clientEmail, coachName) {
    try {
      const params = new URLSearchParams();
      if (memberName) params.append('name', memberName);
      if (clientEmail) params.append('clientEmail', clientEmail);
      if (coachName) params.append('coachName', coachName);
      const url = `${API_BASE_URL}/member/trainer/chat?${params.toString()}`;
      const res = await fetch(url, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed to fetch chat history');
      const data = await res.json();
      return data;
    } catch (err) {
      return null;
    }
  },

  async sendChatMessage(message, memberName, clientEmail, coachName) {
    try {
      const res = await fetch(`${API_BASE_URL}/member/trainer/chat`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ message, memberName, clientEmail, coachName })
      });
      if (!res.ok) throw new Error('Failed to send chat message');
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  async markChatRead(memberName, clientEmail, coachName) {
    try {
      const res = await fetch(`${API_BASE_URL}/member/trainer/chat/read`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ memberName, clientEmail, coachName })
      });
      if (!res.ok) throw new Error('Failed to mark chat as read');
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  // --- 5. ATTENDANCE & KEYCARD ENDPOINTS ---
  async getAttendanceStatus(email) {
    try {
      const url = email ? `${API_BASE_URL}/member/attendance/status?email=${encodeURIComponent(email)}` : `${API_BASE_URL}/member/attendance/status`;
      const res = await fetch(url, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed to fetch attendance status');
      const data = await res.json();
      return data.data;
    } catch (err) {
      return null;
    }
  },

  async getAttendanceHistory(email, month) {
    try {
      let url = `${API_BASE_URL}/member/attendance/history`;
      const params = new URLSearchParams();
      if (email) params.append('email', email);
      if (month) params.append('month', month);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed to fetch attendance history');
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  async getAdminAttendanceLogs() {
    try {
      const res = await fetch(`${API_BASE_URL}/member/attendance/admin/all`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed to fetch admin attendance logs');
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  async checkIn(payload) {
    try {
      const res = await fetch(`${API_BASE_URL}/member/attendance/checkin`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload || {})
      });
      if (!res.ok) throw new Error('Failed check-in');
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  async checkOut(payload) {
    try {
      const res = await fetch(`${API_BASE_URL}/member/attendance/checkout`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload || {})
      });
      if (!res.ok) throw new Error('Failed check-out');
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  async faceScanAttendance(scanData) {
    return this.checkIn(scanData);
  },

  async registerFaceProfile(regData) {
    return { success: true, message: 'Member manual keycard profile active.' };
  },

  async getRegisteredFaces() {
    return {};
  },

  // --- 6. SUPPLEMENT SHOP ENDPOINTS ---
  async getSupplementProducts() {
    try {
      const res = await fetch(`${API_BASE_URL}/member/supplements/products`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed to fetch supplement products');
      const data = await res.json();
      return data.data;
    } catch (err) {
      return null;
    }
  },

  async checkoutSupplements(cartItems, promoCode, shippingInfo = null, paymentMethod = 'Online Payment (Razorpay)', userEmail = null, userName = null, userPhone = null, receiptNumber = null, paymentId = null, paymentStatus = null) {
    try {
      const res = await fetch(`${API_BASE_URL}/member/supplements/checkout`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          cartItems,
          promoCode,
          shippingInfo,
          paymentMethod,
          userEmail,
          userName,
          userPhone,
          receiptNumber,
          paymentId,
          paymentStatus
        })
      });
      if (!res.ok) throw new Error('Failed supplement checkout');
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  async getSupplementOrders(email = null) {
    try {
      const url = email ? `${API_BASE_URL}/member/supplements/orders?email=${encodeURIComponent(email)}` : `${API_BASE_URL}/member/supplements/orders`;
      const res = await fetch(url, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed to fetch orders');
      const data = await res.json();
      return data.data;
    } catch (err) {
      return null;
    }
  },

  async updateSupplementOrderStatus(orderId, statusData) {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/supplements/orders/${orderId}/status`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(statusData)
      });
      if (!res.ok) throw new Error('Failed to update order status');
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  async addSupplementProduct(productData) {
    try {
      const res = await fetch(`${API_BASE_URL}/member/supplements/products`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(productData)
      });
      if (!res.ok) throw new Error('Failed to add product');
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  async deleteSupplementProduct(productId) {
    try {
      const res = await fetch(`${API_BASE_URL}/member/supplements/products/${productId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (!res.ok) throw new Error('Failed to delete product');
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  // --- 7. EQUIPMENT ENDPOINTS ---
  async getEquipment() {
    try {
      const res = await fetch(`${API_BASE_URL}/member/equipment`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed to fetch equipment status');
      const data = await res.json();
      return data.data;
    } catch (err) {
      return null;
    }
  },

  // --- 8. BROADCAST ALERTS ENDPOINTS ---
  async getAlerts() {
    try {
      const res = await fetch(`${API_BASE_URL}/alerts`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed to fetch alerts');
      const data = await res.json();
      return data.data;
    } catch (err) {
      return null;
    }
  },

  async addAlert(alertData) {
    try {
      const res = await fetch(`${API_BASE_URL}/alerts`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(alertData)
      });
      if (!res.ok) throw new Error('Failed to create alert');
      const data = await res.json();
      return data.data;
    } catch (err) {
      console.warn('Member API Notice: Failed to sync new alert with server.', err.message);
      return null;
    }
  },

  async deleteAlert(alertId) {
    try {
      const res = await fetch(`${API_BASE_URL}/alerts/${alertId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (!res.ok) throw new Error('Failed to delete alert');
      return await res.json();
    } catch (err) {
      console.warn('Member API Notice: Failed to delete alert on server.', err.message);
      return null;
    }
  }
};
