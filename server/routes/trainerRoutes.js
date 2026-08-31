import express from 'express';
import { getDB, saveDB } from '../config/db.js';

const router = express.Router();

import User from '../models/User.js';
import { isMongoConnected } from '../config/mongodb.js';

/**
 * GET /api/member/trainers
 * Retrieve list of all registered trainers stored in MongoDB Atlas
 */
router.get('/trainers', async (req, res) => {
  try {
    const db = getDB();
    let trainersList = (db.users || []).filter(u => u.role === 'trainer');

    // Query MongoDB directly if connected
    if (isMongoConnected()) {
      const atlasTrainers = await User.find({ role: 'trainer' }).select('-password');
      if (atlasTrainers && atlasTrainers.length > 0) {
        trainersList = atlasTrainers;
      }
    }

    // Default template trainers if list is empty
    if (trainersList.length === 0) {
      trainersList = [
        {
          userId: 'TRN-KEERTHU',
          name: 'Coach Keerthu',
          email: 'keerthu@apex.com',
          phone: '+91 98765 11111',
          specialty: 'Barbell Biomechanics, Strength & Hypertrophy Master',
          credentials: 'CSCS, Master of Sports Physiology',
          bio: 'Master strength coach specializing in periodized hypertrophy, powerlifting biomechanics, and elite athletic performance.'
        },
        {
          userId: 'TRN-VISHWAMBHARA',
          name: 'Coach Vishwambhara',
          email: 'vishwambhara@apex.com',
          phone: '+91 98765 22222',
          specialty: 'HIIT, Functional Endurance & Combat Conditioning',
          credentials: 'NASM-CPT, Kettlebell & Functional Master',
          bio: 'High-performance conditioning specialist focusing on athletic VO2 max, functional core strength, and mobility.'
        }
      ];
    }

    res.json({
      success: true,
      count: trainersList.length,
      data: trainersList
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching trainers from MongoDB', error: err.message });
  }
});

/**
 * POST /api/member/trainer/select
 * Assign member selected personal coach
 */
router.post('/select', (req, res) => {
  const { trainerId, trainerName } = req.body;
  const db = getDB();

  if (!db.member) db.member = {};
  db.member.selectedTrainer = {
    id: trainerId || `TRN-${Date.now()}`,
    name: trainerName || 'Coach Shravan',
    assignedDate: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
  };

  // Sync back to db.users list so that the member's personal trainer displays correctly in the Admin Panel
  if (Array.isArray(db.users)) {
    const userIdx = db.users.findIndex((u) => u.email === db.member.email || u.userId === db.member.id);
    if (userIdx !== -1) {
      db.users[userIdx].trainer = trainerName;
    }
  }

  saveDB(db);

  res.json({
    success: true,
    message: `Successfully selected ${trainerName} as your personal coach!`,
    selectedTrainer: db.member.selectedTrainer
  });
});

/**
 * GET /api/member/trainer/info
 * Fetch assigned trainer bio and credentials
 */
router.get('/info', (req, res) => {
  const db = getDB();
  res.json({
    success: true,
    data: db.trainer
  });
});

/**
 * POST /api/member/trainer/book
 * Schedule a 1-on-1 coaching session request
 */
router.post('/book', (req, res) => {
  const { date, time, note } = req.body;
  const db = getDB();

  const newBooking = {
    id: `b-${Date.now()}`,
    date: date || 'Upcoming Session',
    time: time || '10:00 AM',
    status: 'Requested',
    note: note || '1-on-1 Conditioning session'
  };

  db.trainer.bookings.unshift(newBooking);
  saveDB(db);

  res.status(201).json({
    success: true,
    message: 'Coaching session request submitted successfully to Coach Shravan.',
    data: newBooking
  });
});
/**
 * GET /api/member/trainer/schedule
 * Fetch scheduled sessions assigned to member
 */
router.get('/schedule', (req, res) => {
  const db = getDB();
  let dbTrainer = db.trainer || {};
  let agenda = dbTrainer.agenda || [];
  const memberName = req.query.name || req.user?.name || '';
  if (memberName) {
    agenda = agenda.filter(a => !a.client || a.client.toLowerCase() === memberName.toLowerCase() || a.client === 'All Members');
  }
  res.json({
    success: true,
    data: agenda
  });
});

/**
 * GET /api/member/trainer/chat
 * Fetch chat history with assigned coach
 */
router.get('/chat', (req, res) => {
  const db = getDB();
  const targetMember = req.query.name || req.query.memberName || req.user?.name;
  let chat = db.trainer.chatHistory || [];
  if (targetMember) {
    chat = chat.filter(m => !m.memberName || m.memberName.toLowerCase() === targetMember.toLowerCase());
  }
  res.json({
    success: true,
    count: chat.length,
    data: chat
  });
});

/**
 * POST /api/member/trainer/chat
 * Send a message to coach and get automated fitness response
 */
router.post('/chat', (req, res) => {
  const { message, memberName: bodyMemberName } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Message text cannot be empty.'
    });
  }

  const db = getDB();
  const activeMember = bodyMemberName || req.user?.name || db.member?.name || 'Ethan Hunt';
  const timeStr = new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit' }) + ', ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const userMsg = {
    id: `c-${Date.now()}`,
    memberName: activeMember,
    sender: 'member',
    text: message.trim(),
    time: timeStr
  };

  db.trainer.chatHistory.push(userMsg);
  saveDB(db);

  res.status(201).json({
    success: true,
    message: 'Message dispatched',
    data: userMsg,
    chatHistory: db.trainer.chatHistory.filter(m => !m.memberName || m.memberName.toLowerCase() === activeMember.toLowerCase())
  });
});

export default router;
