import express from 'express';
import { getDB, saveDB } from '../config/db.js';
import User from '../models/User.js';
import TrainerData from '../models/TrainerData.js';
import { isMongoConnected } from '../config/mongodb.js';

const router = express.Router();

/**
 * GET /api/member/trainers & GET /api/member/trainer
 * Retrieve list of all registered trainers stored in MongoDB Atlas
 */
const getTrainersHandler = async (req, res) => {
  try {
    const db = getDB();
    let trainersList = (db.users || []).filter(u => u.role === 'trainer');

    if (isMongoConnected()) {
      const atlasTrainers = await User.find({ role: 'trainer' }).select('-password');
      if (atlasTrainers && atlasTrainers.length > 0) {
        trainersList = atlasTrainers;
      }
    }

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
};

router.get('/', getTrainersHandler);
router.get('/trainers', getTrainersHandler);

/**
 * POST /api/member/trainer/select
 * Assign member selected personal coach
 */
router.post('/select', (req, res) => {
  const { trainerId, trainerName, trainerEmail, trainerSpecialty, trainerCredentials, trainerBio } = req.body;
  const db = getDB();

  if (!db.member) db.member = {};
  db.member.selectedTrainer = {
    id: trainerId || `TRN-${Date.now()}`,
    name: trainerName || 'Coach Keerthu',
    email: trainerEmail || 'coach@apex.com',
    specialty: trainerSpecialty || 'Strength & Conditioning',
    credentials: trainerCredentials || 'CSCS Certified',
    bio: trainerBio || '',
    assignedDate: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
  };

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
 * POST /api/member/trainer/request
 * Submit member coaching application (goal, medical certificate, description, coach, package, paymentId)
 */
router.post('/request', (req, res) => {
  const {
    memberId,
    memberName,
    memberEmail,
    memberPhone,
    trainerId,
    trainerName,
    goal,
    medicalCertificate,
    medicalCertName,
    description,
    package: coachPackage,
    packageName,
    packagePrice,
    paymentId
  } = req.body;

  const db = getDB();
  if (!Array.isArray(db.trainerRequests)) {
    db.trainerRequests = [];
  }

  const newRequest = {
    id: `REQ-${Date.now()}`,
    memberId: memberId || req.user?.userId || 'MEM-' + Date.now(),
    memberName: memberName || req.user?.name || 'Athlete Member',
    memberEmail: memberEmail || req.user?.email || 'member@apex.com',
    memberPhone: memberPhone || '+91 98765 43210',
    trainerId: trainerId || 'TRN-1',
    trainerName: trainerName || 'Coach',
    goal: goal || 'Hypertrophy & Max Strength',
    medicalCertificate: medicalCertificate || null,
    medicalCertName: medicalCertName || 'Medical_Clearance_Cert.pdf',
    description: description || 'Member enrolled in personal coaching program.',
    package: coachPackage || 'monthly',
    packageName: packageName || '1-Month Personal Coaching',
    packagePrice: packagePrice || 5000,
    paymentId: paymentId || `pay_${Date.now()}`,
    status: 'pending', // 'pending' | 'accepted' | 'rejected'
    createdAt: new Date().toISOString()
  };

  // Remove previous pending request for this member if any
  db.trainerRequests = db.trainerRequests.filter(r => 
    !(r.memberEmail && newRequest.memberEmail && r.memberEmail.toLowerCase() === newRequest.memberEmail.toLowerCase() && r.status === 'pending')
  );

  db.trainerRequests.unshift(newRequest);
  saveDB(db);

  res.status(201).json({
    success: true,
    message: `Coaching request submitted to ${newRequest.trainerName}. Awaiting trainer acceptance.`,
    data: newRequest
  });
});

/**
 * GET /api/member/trainer/request-status
 * Check current coaching request status for logged-in member
 */
router.get('/request-status', (req, res) => {
  const db = getDB();
  const email = (req.query.email || req.query.memberEmail || req.user?.email || '').toLowerCase().trim();
  const name = (req.query.name || req.query.memberName || req.user?.name || '').toLowerCase().trim();

  const requests = Array.isArray(db.trainerRequests) ? db.trainerRequests : [];
  const memberRequest = requests.find(r => 
    (email && r.memberEmail && r.memberEmail.toLowerCase().trim() === email) ||
    (name && r.memberName && r.memberName.toLowerCase().trim() === name)
  );

  res.json({
    success: true,
    request: memberRequest || null
  });
});

/**
 * POST /api/member/trainer/request/cancel
 * Cancel a pending coaching request
 */
router.post('/request/cancel', (req, res) => {
  const { requestId, memberEmail } = req.body;
  const db = getDB();
  if (Array.isArray(db.trainerRequests)) {
    db.trainerRequests = db.trainerRequests.filter(r => 
      !(requestId && r.id === requestId) && !(memberEmail && r.memberEmail?.toLowerCase() === memberEmail.toLowerCase() && r.status === 'pending')
    );
    saveDB(db);
  }
  res.json({ success: true, message: 'Request cancelled successfully.' });
});

/**
 * GET /api/member/trainer/info
 * Fetch assigned trainer bio and credentials
 */
router.get('/info', (req, res) => {
  const db = getDB();
  res.json({
    success: true,
    data: db.member?.selectedTrainer || db.trainer
  });
});

/**
 * POST /api/member/trainer/book
 * Schedule a 1-on-1 coaching session request
 */
router.post('/book', (req, res) => {
  const { date, time, note, trainerName } = req.body;
  const db = getDB();

  const newBooking = {
    id: `b-${Date.now()}`,
    date: date || 'Upcoming Session',
    time: time || '10:00 AM',
    status: 'Requested',
    coachName: trainerName || db.member?.selectedTrainer?.name || 'Coach',
    note: note || '1-on-1 Conditioning session'
  };

  if (!db.trainer) db.trainer = {};
  if (!db.trainer.bookings) db.trainer.bookings = [];
  db.trainer.bookings.unshift(newBooking);
  saveDB(db);

  res.status(201).json({
    success: true,
    message: `Coaching session request submitted successfully to ${newBooking.coachName}.`,
    data: newBooking
  });
});

/**
 * GET /api/member/trainer/schedule
 * Fetch member's assigned workout sessions / agenda
 */
router.get('/schedule', async (req, res) => {
  const db = getDB();
  let agenda = db.trainer?.agenda || [];

  if (isMongoConnected()) {
    try {
      const trainerDoc = await TrainerData.findOne();
      if (trainerDoc && Array.isArray(trainerDoc.agenda) && trainerDoc.agenda.length > 0) {
        const map = new Map();
        [...agenda, ...trainerDoc.agenda].forEach(item => {
          if (item && item.id) map.set(item.id, item);
        });
        agenda = Array.from(map.values());
      }
    } catch (e) {}
  }

  const memberName = req.query.name || req.query.memberName;
  if (memberName) {
    agenda = agenda.filter(a => !a.client || a.client.toLowerCase().trim() === memberName.toLowerCase().trim() || a.client === 'All Members');
  }

  res.json({
    success: true,
    data: agenda
  });
});

/**
 * Helper to filter chat strictly for a member & coach
 */
const filterChatForMember = (history, memberName, clientEmail, coachName) => {
  if (!Array.isArray(history)) return [];
  return history.filter(m => {
    if (!m) return false;

    const emailMatch = clientEmail && m.clientEmail && m.clientEmail.toLowerCase() === clientEmail.toLowerCase();
    const nameMatch = memberName && m.memberName && m.memberName.toLowerCase() === memberName.toLowerCase();
    
    const isClient = emailMatch || nameMatch || (!m.clientEmail && !m.memberName && !clientEmail && !memberName);
    if (!isClient) return false;

    if (coachName && m.coachName) {
      if (m.coachName.toLowerCase() !== coachName.toLowerCase()) {
        return false;
      }
    }

    return true;
  });
};

/**
 * GET /api/member/trainer/chat
 * Fetch chat history strictly with assigned coach for this specific member
 */
router.get('/chat', async (req, res) => {
  const db = getDB();
  const targetMember = req.query.name || req.query.memberName || req.user?.name;
  const clientEmail = req.query.email || req.query.clientEmail || req.query.memberEmail || req.user?.email;
  const coachName = req.query.coachName || req.query.trainerName || db.member?.selectedTrainer?.name;

  let chat = db.trainer?.chatHistory || [];

  if (isMongoConnected()) {
    try {
      const trainerDoc = await TrainerData.findOne();
      if (trainerDoc && Array.isArray(trainerDoc.chatHistory) && trainerDoc.chatHistory.length > 0) {
        const map = new Map();
        [...chat, ...trainerDoc.chatHistory].forEach(item => {
          const key = item.id || (item.text + (item.time || ''));
          map.set(key, item);
        });
        chat = Array.from(map.values());
      }
    } catch (e) {
      console.warn("MongoDB chat fetch fallback to local DB:", e);
    }
  }

  const filteredChat = filterChatForMember(chat, targetMember, clientEmail, coachName);
  const unreadCoachMessages = filteredChat.filter(m => m.sender === 'coach' && !m.read).length;

  res.json({
    success: true,
    count: filteredChat.length,
    unreadCount: unreadCoachMessages,
    data: filteredChat
  });
});

/**
 * POST /api/member/trainer/chat
 * Send a message to assigned coach
 */
router.post('/chat', async (req, res) => {
  const { message, text, memberName: bodyMemberName, clientEmail: bodyClientEmail, coachName: bodyCoachName } = req.body;
  const messageText = (text || message || '').trim();

  if (!messageText) {
    return res.status(400).json({
      success: false,
      message: 'Message text cannot be empty.'
    });
  }

  const db = getDB();
  if (!db.trainer) db.trainer = {};
  if (!Array.isArray(db.trainer.chatHistory)) db.trainer.chatHistory = [];

  const activeMember = bodyMemberName || req.user?.name || db.member?.name || 'Athlete Member';
  const activeEmail = bodyClientEmail || req.user?.email || db.member?.email || '';
  const activeCoach = bodyCoachName || db.member?.selectedTrainer?.name || db.trainer?.coachName || 'Coach';

  const now = new Date();
  const timeStr = now.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }) + ', ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const userMsg = {
    id: `c-${Date.now()}`,
    memberName: activeMember,
    clientEmail: activeEmail,
    memberEmail: activeEmail,
    coachName: activeCoach,
    sender: 'member',
    text: messageText,
    time: timeStr,
    read: false,
    createdAt: new Date().toISOString()
  };

  db.trainer.chatHistory.push(userMsg);
  saveDB(db);

  if (isMongoConnected()) {
    try {
      await TrainerData.findOneAndUpdate(
        {},
        { $push: { chatHistory: userMsg } },
        { upsert: true, new: true }
      );
    } catch (e) {
      console.warn("MongoDB chat update error:", e);
    }
  }

  const memberHistory = filterChatForMember(db.trainer.chatHistory, activeMember, activeEmail, activeCoach);

  res.status(201).json({
    success: true,
    message: 'Message dispatched to coach',
    data: userMsg,
    chatHistory: memberHistory
  });
});

/**
 * POST /api/member/trainer/chat/read
 * Mark all incoming coach messages as read for this member
 */
router.post('/chat/read', async (req, res) => {
  const { memberName, clientEmail, coachName } = req.body;
  const db = getDB();
  if (!db.trainer || !Array.isArray(db.trainer.chatHistory)) {
    return res.json({ success: true, updated: 0 });
  }

  let updated = 0;
  db.trainer.chatHistory.forEach(m => {
    if (m.sender === 'coach' && !m.read) {
      const matchClient = (clientEmail && m.clientEmail && m.clientEmail.toLowerCase() === clientEmail.toLowerCase()) ||
                          (memberName && m.memberName && m.memberName.toLowerCase() === memberName.toLowerCase()) ||
                          (!m.clientEmail && !m.memberName);
      const matchCoach = !coachName || !m.coachName || m.coachName.toLowerCase() === coachName.toLowerCase();
      if (matchClient && matchCoach) {
        m.read = true;
        updated++;
      }
    }
  });

  if (updated > 0) {
    saveDB(db);
    if (isMongoConnected()) {
      try {
        await TrainerData.findOneAndUpdate(
          {},
          { $set: { "chatHistory.$[elem].read": true } },
          { arrayFilters: [{ "elem.sender": "coach" }] }
        );
      } catch (e) {}
    }
  }

  res.json({ success: true, updated });
});

export default router;
