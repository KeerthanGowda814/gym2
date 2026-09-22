/**
 * APEX ATHLETICS - MEMBER & TRAINER PROGRESS API SERVICE
 * Connects frontend panels to real MongoDB Atlas & Express progress endpoints
 */

const API_BASE_URL = 'http://localhost:5000/api';

const getHeaders = () => {
  const token = localStorage.getItem('apex_auth_token') || sessionStorage.getItem('apex_auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

export const progressApi = {
  /**
   * Fetch daily workout activity logs
   * @param {Object} params - { memberEmail, trainerEmail, timeframe }
   */
  async getDailyActivities(params = {}) {
    try {
      const query = new URLSearchParams();
      if (params.memberEmail) query.append('memberEmail', params.memberEmail);
      if (params.trainerEmail) query.append('trainerEmail', params.trainerEmail);
      if (params.timeframe) query.append('timeframe', params.timeframe);

      const url = `${API_BASE_URL}/member/progress/daily?${query.toString()}`;
      const res = await fetch(url, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed to fetch activities');
      const data = await res.json();
      return data.data || [];
    } catch (err) {
      console.warn('ProgressApi getDailyActivities fallback:', err.message);
      return [];
    }
  },

  /**
   * Log daily activity & workout photo to share with assigned trainer
   * @param {Object} payload - { workoutTitle, category, targetWorkouts, completedWorkouts, durationMinutes, caloriesBurned, intensity, exercises, workoutPhoto, notes, date, trainerName, trainerEmail }
   */
  async logDailyActivity(payload) {
    try {
      const res = await fetch(`${API_BASE_URL}/member/progress/daily`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to save daily activity');
      }
      return await res.json();
    } catch (err) {
      console.error('ProgressApi logDailyActivity error:', err);
      throw err;
    }
  },

  /**
   * Trainer leaves feedback & rating on a member's daily workout log
   * @param {String} progressId
   * @param {Object} feedbackData - { comment, rating, trainerName }
   */
  async submitTrainerFeedback(progressId, feedbackData) {
    try {
      const res = await fetch(`${API_BASE_URL}/member/progress/feedback/${progressId}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(feedbackData)
      });
      if (!res.ok) throw new Error('Failed to submit feedback');
      return await res.json();
    } catch (err) {
      console.error('ProgressApi submitTrainerFeedback error:', err);
      throw err;
    }
  },

  /**
   * Fetch progress photos (Front, Side, Back, Before vs Current)
   * @param {String} memberEmail
   */
  async getProgressPhotos(memberEmail) {
    try {
      const query = memberEmail ? `?memberEmail=${encodeURIComponent(memberEmail)}` : '';
      const res = await fetch(`${API_BASE_URL}/member/progress/photos${query}`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed to fetch progress photos');
      const data = await res.json();
      return data.data || [];
    } catch (err) {
      console.warn('ProgressApi getProgressPhotos fallback:', err.message);
      return [];
    }
  },

  /**
   * Upload weekly progress photos (Front, Side, Back, weight, before/current flag)
   * @param {Object} payload
   */
  async uploadProgressPhotos(payload) {
    try {
      const res = await fetch(`${API_BASE_URL}/member/progress/photos`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to upload progress photos');
      }
      return await res.json();
    } catch (err) {
      console.error('ProgressApi uploadProgressPhotos error:', err);
      throw err;
    }
  },

  /**
   * Fetch 1mo, 3mo, 6mo, 1yr progress report metrics & timelines
   * @param {String} memberEmail
   * @param {String} period - '1m' | '3m' | '6m' | '1y'
   */
  async getProgressReport(memberEmail, period = '1m') {
    try {
      const query = new URLSearchParams({ period });
      if (memberEmail) query.append('memberEmail', memberEmail);

      const res = await fetch(`${API_BASE_URL}/member/progress/reports?${query.toString()}`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed to fetch progress report');
      return await res.json();
    } catch (err) {
      console.warn('ProgressApi getProgressReport fallback:', err.message);
      return null;
    }
  }
};
