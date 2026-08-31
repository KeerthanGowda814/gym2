import express from 'express';
import { getDB, saveDB } from '../config/db.js';

const router = express.Router();

const PLANS = {
  'Muscle Core': { price: 800.0, period: 'month', level: 1 },
  'Muscle Pro': { price: 3500.0, period: '6 months', level: 2 },
  'Muscle Elite': { price: 7500.0, period: 'year', level: 3 },
  'MaSuLe Core': { price: 800.0, period: 'month', level: 1 },
  'MaSuLe Pro': { price: 3500.0, period: '6 months', level: 2 },
  'MaSuLe Elite': { price: 7500.0, period: 'year', level: 3 }
};

/**
 * GET /api/member/membership
 * Retrieve membership pass details & autorenew status
 */
router.get('/membership', (req, res) => {
  const db = getDB();
  res.json({
    success: true,
    data: db.member
  });
});

/**
 * GET /api/member/invoices
 * Retrieve payment invoice history
 */
router.get('/invoices', (req, res) => {
  const db = getDB();
  res.json({
    success: true,
    count: db.invoices.length,
    data: db.invoices
  });
});

/**
 * POST /api/member/membership/renew
 * Renew active pass subscription
 */
router.post('/membership/renew', (req, res) => {
  const db = getDB();

  db.member.renewed = true;
  db.member.daysLeft = 30;

  const txId = 'TX-' + Math.floor(1000 + Math.random() * 9000);
  const planPrice = PLANS[db.member.membershipTier] ? PLANS[db.member.membershipTier].price : 3500.0;

  const newInvoice = {
    txId,
    plan: `${db.member.membershipTier} Subscription`,
    amount: planPrice,
    status: 'paid',
    date: 'Today'
  };

  db.invoices.unshift(newInvoice);
  saveDB(db);

  res.json({
    success: true,
    message: `Membership ${db.member.membershipTier} pass successfully renewed.`,
    member: db.member,
    invoice: newInvoice
  });
});

/**
 * PUT /api/member/membership/plan
 * Upgrade or switch pass tier (MaSuLe Core, Pro, Elite)
 */
router.put('/membership/plan', (req, res) => {
  const { planName } = req.body;

  if (!planName || !PLANS[planName]) {
    return res.status(400).json({
      success: false,
      message: 'Invalid plan selected. Choose Muscle Core, Muscle Pro, or Muscle Elite.'
    });
  }

  const db = getDB();
  const oldPlan = db.member.membershipTier;
  db.member.membershipTier = planName;

  const txId = 'TX-' + Math.floor(1000 + Math.random() * 9000);
  const newInvoice = {
    txId,
    plan: `${planName} Subscription`,
    amount: PLANS[planName].price,
    status: 'paid',
    date: 'Today'
  };

  db.invoices.unshift(newInvoice);
  saveDB(db);

  res.json({
    success: true,
    message: `Plan changed from ${oldPlan} to ${planName}. Invoice ${txId} generated.`,
    member: db.member,
    invoice: newInvoice
  });
});

/**
 * PUT /api/member/membership/autorenew
 * Toggle membership auto-renew setting
 */
router.put('/membership/autorenew', (req, res) => {
  const { autoRenew } = req.body;
  const db = getDB();

  db.member.autoRenew = Boolean(autoRenew);
  saveDB(db);

  res.json({
    success: true,
    message: `Auto-renew turned ${db.member.autoRenew ? 'ON' : 'OFF'}.`,
    autoRenew: db.member.autoRenew
  });
});

/**
 * GET /api/member/profile
 * Retrieve full member profile details
 */
router.get('/profile', (req, res) => {
  const db = getDB();
  const defaultProfile = {
    id: "MEM-90210",
    name: "Ethan Hunt",
    email: "ethan@apex.com",
    phone: "+1 (555) 234-5678",
    age: 28,
    gender: "Male",
    height: "5' 11\"",
    weight: "175 lbs",
    targetWeight: "185 lbs",
    fitnessGoal: "Hypertrophy & Max Strength",
    emergencyContact: "Julia Meade (+1 555-999-8888)",
    address: "742 Evergreen Terrace, Sector 4",
    bio: "Dedicated athlete training 5 days a week. Focusing on progressive overload and powerlifting metrics.",
    membershipTier: "Muscle Pro",
    autoRenew: true,
    daysLeft: 5,
    joinedDate: "May 2026",
    profileImage: null
  };

  const profileData = { ...defaultProfile, ...db.member };
  res.json({
    success: true,
    data: profileData
  });
});

/**
 * PUT /api/member/profile
 * Update member profile details
 */
router.put('/profile', (req, res) => {
  const db = getDB();
  const updates = req.body;

  const allowedFields = [
    'name', 'email', 'phone', 'age', 'gender', 'height', 'weight',
    'targetWeight', 'fitnessGoal', 'emergencyContact', 'address', 'bio', 'profileImage'
  ];

  allowedFields.forEach((field) => {
    if (updates[field] !== undefined) {
      db.member[field] = updates[field];
    }
  });

  // Also update corresponding trainer's client entry if present
  if (db.trainer && Array.isArray(db.trainer.members)) {
    const clientIdx = db.trainer.members.findIndex(m => m.id === db.member.id || m.email === db.member.email);
    if (clientIdx !== -1) {
      if (updates.name) db.trainer.members[clientIdx].name = updates.name;
      if (updates.email) db.trainer.members[clientIdx].email = updates.email;
      if (updates.fitnessGoal) db.trainer.members[clientIdx].goal = updates.fitnessGoal;
    }
  }

  saveDB(db);

  res.json({
    success: true,
    message: 'Profile details updated successfully.',
    data: db.member
  });
});

export default router;
