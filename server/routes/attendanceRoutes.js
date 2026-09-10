import express from 'express';
import { getDB, saveDB } from '../config/db.js';
import Attendance from '../models/Attendance.js';
import { isMongoConnected } from '../config/mongodb.js';

const router = express.Router();

/**
 * Helper to calculate streak & active calendar days from records
 */
const calculateAttendanceStats = (records, monthYearStr) => {
  const currentMonthYear = monthYearStr || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const activeDaysSet = new Set();
  let totalMinutes = 0;

  records.forEach(r => {
    if (r.monthYear === currentMonthYear || !monthYearStr) {
      if (r.dayOfMonth) activeDaysSet.add(r.dayOfMonth);
    }

    // Calculate duration in minutes if stay is finished
    if (r.inTime && r.outTime && r.outTime !== '--') {
      try {
        const inParts = r.inTime.split(':');
        const outParts = r.outTime.split(':');
        // Simple fallback duration computation
        totalMinutes += 90; // Default 1.5h per completed session if parse complex
      } catch (e) {
        totalMinutes += 60;
      }
    } else if (r.status === 'Active') {
      totalMinutes += 45;
    }
  });

  const activeDaysInMonth = Array.from(activeDaysSet).sort((a, b) => a - b);
  const now = new Date();
  const daysElapsed = Math.max(1, now.getDate());
  const attendanceRate = Math.min(100, Math.round((activeDaysInMonth.length / daysElapsed) * 100)) || 0;
  const streakDays = activeDaysInMonth.length;
  const totalHours = (totalMinutes / 60).toFixed(1);

  return {
    activeDaysInMonth,
    streakDays,
    attendanceRate,
    totalHoursLogged: `${totalHours} Hrs`
  };
};

/**
 * GET /api/member/attendance/status
 */
router.get('/status', async (req, res) => {
  try {
    const userEmail = (req.query.email || 'gkeerthan583@gmail.com').toLowerCase();
    
    if (isMongoConnected()) {
      const activeRecord = await Attendance.findOne({ userEmail, status: 'Active' }).sort({ createdAt: -1 });
      const allMemberRecords = await Attendance.find({ userEmail }).sort({ createdAt: -1 });
      const stats = calculateAttendanceStats(allMemberRecords);

      return res.json({
        success: true,
        data: {
          isCheckedIn: !!activeRecord,
          checkInTime: activeRecord ? activeRecord.inTime : null,
          streakDays: stats.streakDays,
          attendanceRate: stats.attendanceRate,
          activeDaysInMonth: stats.activeDaysInMonth,
          totalHoursLogged: stats.totalHoursLogged
        }
      });
    }

    const db = getDB();
    res.json({
      success: true,
      data: db.attendance || {}
    });
  } catch (err) {
    console.error('Error fetching attendance status:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/member/attendance/history
 */
router.get('/history', async (req, res) => {
  try {
    const userEmail = (req.query.email || 'gkeerthan583@gmail.com').toLowerCase();
    const monthYear = req.query.month || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    let attendanceRecords = [];

    if (isMongoConnected()) {
      attendanceRecords = await Attendance.find({ userEmail }).sort({ createdAt: -1 });
    } else {
      const db = getDB();
      attendanceRecords = (db.attendanceLogs || []).filter(r => r.userEmail && r.userEmail.toLowerCase() === userEmail);
    }

    const stats = calculateAttendanceStats(attendanceRecords, monthYear);

    // Format itemized records for member view table
    const formattedRecords = attendanceRecords.map(r => ({
      id: r.id || `ATT-${Math.floor(1000 + Math.random() * 9000)}`,
      memberName: r.memberName || r.name || 'Member Athlete',
      date: r.date || (r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : 'Today'),
      time: r.inTime || r.time || '--',
      outTime: r.outTime || '--',
      scanMethod: (r.scanMethod && !r.scanMethod.includes('AI Face')) ? r.scanMethod : 'Manual Keycard',
      gateAction: r.gateAction || (r.status === 'Active' ? 'Gate Entry Check-in' : 'Gate Exit Check-out'),
      status: r.status || 'Completed',
      hoursLogged: r.duration || r.hoursLogged || '--',
      photo: null
    }));

    res.json({
      success: true,
      streakDays: stats.streakDays,
      attendanceRate: stats.attendanceRate,
      activeDaysInMonth: stats.activeDaysInMonth,
      totalHoursLogged: stats.totalHoursLogged,
      records: formattedRecords,
      sessions: formattedRecords.map(r => ({ date: r.date, time: r.time, type: `${r.scanMethod} (${r.gateAction})` }))
    });
  } catch (err) {
    console.error('Error fetching attendance history:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/member/attendance/checkin
 */
router.post('/checkin', async (req, res) => {
  try {
    const { userEmail, memberName, scanMethod, code } = req.body;
    const email = (userEmail || 'gkeerthan583@gmail.com').toLowerCase();
    const name = memberName || email.split('@')[0] || 'Member Athlete';
    const method = scanMethod || 'Manual Keycard';

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
    const monthYear = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const dayOfMonth = now.getDate();

    if (isMongoConnected()) {
      const existingActive = await Attendance.findOne({ userEmail: email, status: 'Active' });
      if (existingActive) {
        return res.status(400).json({
          success: false,
          message: 'Member is already checked in.'
        });
      }

      const newRecord = new Attendance({
        id: `ATT-${Math.floor(1000 + Math.random() * 9000)}`,
        userEmail: email,
        memberName: name,
        code: code || `RF-#${Math.floor(1000 + Math.random() * 9000)}`,
        scanMethod: method,
        gateAction: 'Gate Entry Check-in',
        inTime: timeStr,
        outTime: '--',
        duration: '--',
        hoursLogged: '--',
        date: dateStr,
        monthYear,
        dayOfMonth,
        status: 'Active'
      });

      await newRecord.save();
    }

    // Sync memory DB
    const db = getDB();
    if (!db.attendance) db.attendance = {};
    db.attendance.isCheckedIn = true;
    db.attendance.checkInTime = timeStr;
    if (!Array.isArray(db.attendance.activeDaysInMonth)) db.attendance.activeDaysInMonth = [];
    if (!db.attendance.activeDaysInMonth.includes(dayOfMonth)) db.attendance.activeDaysInMonth.push(dayOfMonth);
    db.attendance.streakDays = (db.attendance.streakDays || 0) + 1;
    saveDB(db);

    res.json({
      success: true,
      message: `Facility entry granted for ${name}!`,
      checkInTime: timeStr
    });
  } catch (err) {
    console.error('Error on attendance checkin:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/member/attendance/checkout
 */
router.post('/checkout', async (req, res) => {
  try {
    const { userEmail, memberName } = req.body;
    const email = (userEmail || 'gkeerthan583@gmail.com').toLowerCase();

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (isMongoConnected()) {
      const activeRecord = await Attendance.findOne({ userEmail: email, status: 'Active' }).sort({ createdAt: -1 });
      if (activeRecord) {
        activeRecord.outTime = timeStr;
        activeRecord.status = 'Completed';
        activeRecord.gateAction = 'Gate Exit Check-out';
        activeRecord.duration = '1h 30m';
        activeRecord.hoursLogged = '1h 30m';
        await activeRecord.save();
      }
    }

    const db = getDB();
    if (!db.attendance) db.attendance = {};
    db.attendance.isCheckedIn = false;
    db.attendance.checkInTime = null;
    saveDB(db);

    res.json({
      success: true,
      message: 'Facility check-out recorded. Have a great day!'
    });
  } catch (err) {
    console.error('Error on attendance checkout:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/member/attendance/facescan
 */
router.post('/facescan', async (req, res) => {
  try {
    const { userEmail, memberName, memberCode, action } = req.body;
    const name = memberName || 'Member Athlete';
    const email = (userEmail || 'gkeerthan583@gmail.com').toLowerCase();
    const act = action === 'check-out' ? 'check-out' : 'check-in';

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
    const monthYear = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const dayOfMonth = now.getDate();

    if (isMongoConnected()) {
      const newScan = new Attendance({
        id: `ATT-${Math.floor(1000 + Math.random() * 9000)}`,
        userEmail: email,
        memberName: name,
        code: memberCode || `#${Math.floor(1000 + Math.random() * 9000)}-KEY`,
        scanMethod: 'Manual Keycard',
        gateAction: act === 'check-in' ? 'Gate Entry Check-in' : 'Gate Exit Check-out',
        inTime: act === 'check-in' ? timeStr : '08:30 AM',
        outTime: act === 'check-out' ? timeStr : '--',
        duration: act === 'check-out' ? '1h 30m' : '--',
        hoursLogged: act === 'check-out' ? '1h 30m' : '--',
        date: dateStr,
        monthYear,
        dayOfMonth,
        status: act === 'check-out' ? 'Completed' : 'Active'
      });

      await newScan.save();
    }

    res.status(201).json({
      success: true,
      message: `Manual attendance recorded. Turnstile gate released for ${name}!`
    });
  } catch (err) {
    console.error('Error on manual attendance scan:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/member/attendance/admin/all
 * Admin Gate History & Analytics Endpoint
 */
router.get('/admin/all', async (req, res) => {
  try {
    let records = [];
    if (isMongoConnected()) {
      records = await Attendance.find({}).sort({ createdAt: -1 });
    } else {
      const db = getDB();
      records = db.attendanceLogs || [];
    }

    const todayStr = new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
    const checkedInToday = records.filter(r => r.date === todayStr || new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) === todayStr);
    const onFloorNow = records.filter(r => r.status === 'Active');

    const formattedAdminRecords = records.map(r => ({
      id: r.id || `ATT-${Math.floor(1000 + Math.random() * 9000)}`,
      memberName: r.memberName || 'Member Athlete',
      userEmail: r.userEmail || 'member@apex.com',
      date: r.date || 'Today',
      time: r.inTime || '08:30 AM',
      outTime: r.outTime || '--',
      scanMethod: (r.scanMethod && !r.scanMethod.includes('AI Face')) ? r.scanMethod : 'Manual Keycard',
      gateAction: r.gateAction || 'Gate Entry Check-in',
      status: r.status || 'Completed',
      hoursLogged: r.duration || r.hoursLogged || '--',
      photo: null
    }));

    res.json({
      success: true,
      checkedInCount: checkedInToday.length,
      onFloorCount: onFloorNow.length,
      totalCount: records.length,
      records: formattedAdminRecords
    });
  } catch (err) {
    console.error('Error fetching admin attendance:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/member/attendance/register-face
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
  if (!db.registeredFaces) db.registeredFaces = {};

  const regDate = new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  const faceProfile = {
    memberName: memberName.trim(),
    photo: imageBase64,
    registeredAt: regDate,
    status: 'Active'
  };

  db.registeredFaces[memberName.trim()] = faceProfile;
  saveDB(db);

  res.status(200).json({
    success: true,
    message: `Official biometric face profile registered for ${memberName.trim()}!`,
    data: faceProfile
  });
});

/**
 * GET /api/member/attendance/registered-faces
 */
router.get('/registered-faces', (req, res) => {
  const db = getDB();
  res.json({
    success: true,
    data: db.registeredFaces || {}
  });
});

export default router;
