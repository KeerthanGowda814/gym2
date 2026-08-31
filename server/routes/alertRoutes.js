import express from 'express';
import { getDB, saveDB } from '../config/db.js';
import { sendBroadcastEmail } from '../config/emailService.js';
import User from '../models/User.js';
import { isMongoConnected } from '../config/mongodb.js';

const router = express.Router();

/**
 * GET /api/alerts
 * Retrieve all broadcast alerts
 */
router.get('/', (req, res) => {
  const db = getDB();
  res.json({
    success: true,
    count: db.alerts.length,
    data: db.alerts
  });
});

/**
 * POST /api/alerts
 * Broadcast a new alert (Sudden holiday, event, maintenance, etc.)
 */
router.post('/', async (req, res) => {
  const { title, message, type } = req.body;

  if (!title || !message) {
    return res.status(400).json({
      success: false,
      message: 'Please provide alert title and message content.'
    });
  }

  const db = getDB();
  const newAlert = {
    id: `alt-${Date.now()}`,
    title: title.trim(),
    message: message.trim(),
    type: type || 'general', // 'holiday', 'event', 'maintenance', 'general'
    date: new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }),
    active: true
  };

  db.alerts.unshift(newAlert); // Newest at top
  saveDB(db);

  // Retrieve emails of all registered users
  let recipientEmails = [];
  if (isMongoConnected()) {
    try {
      const dbUsers = await User.find({}).select('email');
      recipientEmails = dbUsers.filter((u) => u.email).map((u) => u.email.trim());
    } catch (err) {
      console.error('[AlertRoutes] Error fetching users from MongoDB:', err.message);
    }
  }

  // Fallback to local DB cache if MongoDB returned no emails or is not connected
  if (recipientEmails.length === 0) {
    recipientEmails = Array.isArray(db.users)
      ? db.users.filter((u) => u.email).map((u) => u.email.trim())
      : [];
  }

  // Deduplicate emails
  recipientEmails = [...new Set(recipientEmails)];

  // Async dispatch email notifications to all members/users
  sendBroadcastEmail(newAlert.title, newAlert.message, recipientEmails)
    .catch((err) => console.error('[AlertRoutes] Email broadcast error:', err.message));

  res.status(201).json({
    success: true,
    message: 'Alert broadcasted and emailed successfully.',
    data: newAlert
  });
});

/**
 * DELETE /api/alerts/:id
 * Remove a broadcasted alert
 */
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const db = getDB();

  const initialLength = db.alerts.length;
  db.alerts = db.alerts.filter((a) => a.id !== id);

  if (db.alerts.length === initialLength) {
    return res.status(404).json({
      success: false,
      message: 'Alert not found.'
    });
  }

  saveDB(db);

  res.json({
    success: true,
    message: 'Alert successfully deleted and withdrawn.'
  });
});

/**
 * GET /api/alerts/members
 * Retrieve all registered member users from db.users
 */
router.get('/members', (req, res) => {
  const db = getDB();
  const members = Array.isArray(db.users)
    ? db.users.filter((u) => u.role === 'member' || !u.role)
    : [];
  res.json({
    success: true,
    data: members
  });
});

/**
 * DELETE /api/alerts/members/:email
 * Remove a registered member completely from the database (db.users)
 */
router.delete('/members/:email', (req, res) => {
  const { email } = req.params;
  const db = getDB();

  if (!Array.isArray(db.users)) {
    return res.status(404).json({ success: false, message: 'Users table not found.' });
  }

  const initialLength = db.users.length;
  db.users = db.users.filter((u) => !u.email || u.email.toLowerCase() !== email.toLowerCase());

  if (db.users.length === initialLength) {
    return res.status(404).json({
      success: false,
      message: 'Member user not found in database.'
    });
  }

  // Also remove from trainer client roster if they are there
  if (db.trainer && Array.isArray(db.trainer.members)) {
    db.trainer.members = db.trainer.members.filter((m) => !m.email || m.email.toLowerCase() !== email.toLowerCase());
  }

  saveDB(db);

  res.json({
    success: true,
    message: `Member with email ${email} successfully deleted from backend database.`
  });
});

export default router;
