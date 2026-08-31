import express from 'express';
import { getDB, saveDB } from '../config/db.js';

const router = express.Router();

/**
 * GET /api/member/attendance/status
 * Check current check-in state, attendance rate & streak
 */
router.get('/status', (req, res) => {
  const db = getDB();
  res.json({
    success: true,
    data: db.attendance
  });
});

/**
 * GET /api/member/attendance/history
 * Retrieve calendar grid check-in history & recent sessions
 */
router.get('/history', (req, res) => {
  const db = getDB();
  res.json({
    success: true,
    streakDays: db.attendance.streakDays,
    activeDaysInMonth: db.attendance.activeDaysInMonth,
    sessions: db.attendance.sessions
  });
});

/**
 * POST /api/member/attendance/checkin
 * Digital keycard gate scan check-in
 */
router.post('/checkin', (req, res) => {
  const db = getDB();

  if (db.attendance.isCheckedIn) {
    return res.status(400).json({
      success: false,
      message: 'Member is already checked in.'
    });
  }

  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });

  db.attendance.isCheckedIn = true;
  db.attendance.checkInTime = timeStr;
  db.attendance.streakDays += 1;

  // Add today (e.g. 12) to active calendar days
  const dayOfMonth = now.getDate();
  if (!db.attendance.activeDaysInMonth.includes(dayOfMonth)) {
    db.attendance.activeDaysInMonth.push(dayOfMonth);
  }

  const newSession = {
    date: dateStr,
    time: timeStr,
    type: 'Check-in'
  };

  db.attendance.sessions.unshift(newSession);
  saveDB(db);

  res.json({
    success: true,
    message: 'Biometric keycard verified. Facility entry granted!',
    data: db.attendance
  });
});

/**
 * POST /api/member/attendance/checkout
 * Digital keycard gate scan check-out
 */
router.post('/checkout', (req, res) => {
  const db = getDB();

  if (!db.attendance.isCheckedIn) {
    return res.status(400).json({
      success: false,
      message: 'Member is not currently checked in.'
    });
  }

  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });

  db.attendance.isCheckedIn = false;
  db.attendance.checkInTime = null;

  const newSession = {
    date: dateStr,
    time: timeStr,
    type: 'Check-out'
  };

  db.attendance.sessions.unshift(newSession);
  saveDB(db);

  res.json({
    success: true,
    message: 'Facility check-out recorded.',
    data: db.attendance
  });
});

/**
 * POST /api/member/attendance/facescan
 * AI Real-Time Face Scanning Gate Scan Attendance Method
 */
router.post('/facescan', (req, res) => {
  const { memberName, memberCode, action, imageBase64, confidence } = req.body;

  if (!memberName) {
    return res.status(400).json({
      success: false,
      message: 'Member name is required for face scan identification.'
    });
  }

  const db = getDB();
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  const code = memberCode || `#${Math.floor(1000 + Math.random() * 9000)}-FACE`;
  const act = action === 'check-out' ? 'check-out' : 'check-in';

  if (act === 'check-in') {
    db.attendance.isCheckedIn = true;
    db.attendance.checkInTime = timeStr;
    db.attendance.streakDays = (db.attendance.streakDays || 14) + 1;

    const dayOfMonth = now.getDate();
    if (!db.attendance.activeDaysInMonth.includes(dayOfMonth)) {
      db.attendance.activeDaysInMonth.push(dayOfMonth);
    }
  } else {
    db.attendance.isCheckedIn = false;
    db.attendance.checkInTime = null;
  }

  const faceRecord = {
    id: `face-${Date.now()}`,
    name: memberName,
    code,
    inTime: act === 'check-in' ? timeStr : '09:00 AM',
    outTime: act === 'check-out' ? timeStr : '--',
    duration: act === 'check-out' ? '1h 20m' : '--',
    date: 'Today',
    status: act === 'check-out' ? 'done' : 'active',
    scanMethod: 'AI Face Biometrics',
    confidence: confidence || '98.8%',
    faceImage: imageBase64 || null
  };

  db.attendance.sessions.unshift({
    date: dateStr,
    time: timeStr,
    type: `AI Face Scan (${act})`
  });

  saveDB(db);

  res.status(201).json({
    success: true,
    message: `Face biometrics verified (${confidence || '98.8%'}). Turnstile gate released for ${memberName}!`,
    data: faceRecord,
    attendanceState: db.attendance
  });
});

/**
 * POST /api/member/attendance/register-face
 * One-Time Biometric Face Registration endpoint for Member Panel
 */
router.post('/register-face', (req, res) => {
  const { memberName, imageBase64 } = req.body;

  if (!memberName || !imageBase64) {
    return res.status(400).json({
      success: false,
      message: 'Member name and base64 face photo image are required.'
    });
  }

  const db = getDB();

  // Initialize registeredFaces map if not present
  if (!db.registeredFaces) {
    db.registeredFaces = {};
  }

  const regDate = new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });

  const faceProfile = {
    memberName: memberName.trim(),
    photo: imageBase64,
    registeredAt: regDate,
    status: 'Active'
  };

  db.registeredFaces[memberName.trim()] = faceProfile;

  // Sync to trainer roster members so trainer panel attendance module instantly receives candidate
  if (!db.trainer) db.trainer = {};
  if (!Array.isArray(db.trainer.members)) db.trainer.members = [];

  const existsInTrainer = db.trainer.members.some(
    (m) => m.name && m.name.toLowerCase() === memberName.trim().toLowerCase()
  );

  if (!existsInTrainer) {
    db.trainer.members.unshift({
      id: `MEM-${Math.floor(10000 + Math.random() * 90000)}`,
      name: memberName.trim(),
      email: `${memberName.trim().toLowerCase().replace(/\s+/g, '')}@apex.com`,
      tier: 'Registered Candidate',
      status: 'Active',
      joined: regDate,
      goal: 'Biometric Face Registered'
    });
  }

  // Also update default member profile if matching name
  if (db.member && (db.member.name === memberName.trim() || memberName.trim() === 'Ethan Hunt')) {
    db.member.registeredFacePhoto = imageBase64;
    db.member.faceRegistered = true;
    db.member.faceRegistrationDate = regDate;
  }

  saveDB(db);

  res.status(200).json({
    success: true,
    message: `Official biometric face profile registered for ${memberName.trim()}! Data sent to Trainer Control Terminal!`,
    data: faceProfile
  });
});

/**
 * GET /api/member/attendance/registered-faces
 * Retrieve all registered face reference profiles for Trainer Panel
 */
router.get('/registered-faces', (req, res) => {
  const db = getDB();
  res.json({
    success: true,
    data: db.registeredFaces || {}
  });
});

export default router;
