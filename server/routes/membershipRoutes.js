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
  const userEmail = req.user?.email ? req.user.email.toLowerCase() : '';
  const user = db.users?.find(u => u.email && u.email.toLowerCase() === userEmail);

  const memberData = user ? {
    id: user.userId || db.member?.id || 'MEM-LOGGED-IN',
    name: user.name || db.member?.name,
    email: user.email,
    role: user.role || 'member',
    membershipTier: user.membershipTier || 'Muscle Pro',
    autoRenew: true,
    daysLeft: 30,
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    nextChargeDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    renewed: false,
    attendanceStreak: 0,
    attendanceRate: 100
  } : db.member;

  res.json({
    success: true,
    data: memberData
  });
});

/**
 * GET /api/member/invoices
 * Retrieve payment invoice history for the authenticated user
 */
router.get('/invoices', (req, res) => {
  const db = getDB();
  const userEmail = req.user?.email ? req.user.email.toLowerCase() : '';
  
  // Filter invoices for current user, or return user's invoices
  const userInvoices = (db.invoices || []).filter(inv => {
    if (!inv) return false;
    if (inv.userEmail) {
      return inv.userEmail.toLowerCase() === userEmail;
    }
    return userEmail === 'member@apex.com';
  });

  res.json({
    success: true,
    count: userInvoices.length,
    data: userInvoices
  });
});

/**
 * POST /api/member/membership/renew
 * Renew active pass subscription
 */
router.post('/membership/renew', (req, res) => {
  const db = getDB();
  const userEmail = req.user?.email || db.member?.email || 'member@apex.com';
  const user = db.users?.find(u => u.email && u.email.toLowerCase() === userEmail.toLowerCase());
  const tier = user?.membershipTier || db.member?.membershipTier || 'Muscle Pro';

  const txId = 'TX-' + Math.floor(1000 + Math.random() * 9000);
  const planPrice = PLANS[tier] ? PLANS[tier].price : 3500.0;

  const newInvoice = {
    txId,
    userEmail: userEmail.toLowerCase(),
    plan: `${tier} Subscription`,
    amount: planPrice,
    status: 'paid',
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  };

  if (!db.invoices) db.invoices = [];
  db.invoices.unshift(newInvoice);
  saveDB(db);

  res.json({
    success: true,
    message: `Membership ${tier} pass successfully renewed.`,
    invoice: newInvoice
  });
});

/**
 * PUT /api/member/membership/plan
 * Upgrade or switch pass tier (Muscle Core, Pro, Elite)
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
  const userEmail = req.user?.email || db.member?.email || 'member@apex.com';
  const user = db.users?.find(u => u.email && u.email.toLowerCase() === userEmail.toLowerCase());
  const oldPlan = user?.membershipTier || db.member?.membershipTier || 'Muscle Pro';

  if (user) {
    user.membershipTier = planName;
  }
  if (db.member) {
    db.member.membershipTier = planName;
  }

  const txId = 'TX-' + Math.floor(1000 + Math.random() * 9000);
  const newInvoice = {
    txId,
    userEmail: userEmail.toLowerCase(),
    plan: `${planName} Subscription`,
    amount: PLANS[planName].price,
    status: 'paid',
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  };

  if (!db.invoices) db.invoices = [];
  db.invoices.unshift(newInvoice);
  saveDB(db);

  res.json({
    success: true,
    message: `Plan changed from ${oldPlan} to ${planName}. Invoice ${txId} generated.`,
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

  if (db.member) {
    db.member.autoRenew = Boolean(autoRenew);
    saveDB(db);
  }

  res.json({
    success: true,
    message: `Auto-renew updated.`,
    autoRenew: Boolean(autoRenew)
  });
});

/**
 * GET /api/member/profile
 * Retrieve full member profile details for authenticated user
 */
router.get('/profile', (req, res) => {
  const db = getDB();
  const userEmail = req.user?.email ? req.user.email.toLowerCase() : '';
  const user = db.users?.find(u => u.email && u.email.toLowerCase() === userEmail);

  if (user) {
    return res.json({
      success: true,
      data: {
        id: user.userId || user.id || `USR-${Date.now()}`,
        name: user.name || 'Member',
        email: user.email,
        phone: user.phone && user.phone !== '0' ? user.phone : '',
        age: user.age && user.age !== '0' && user.age !== 0 ? user.age : '',
        gender: user.gender && user.gender !== '0' ? user.gender : 'Male',
        height: user.height && user.height !== '0' ? user.height : '',
        weight: user.weight && user.weight !== '0' && user.weight !== '0 lbs' ? user.weight : '',
        targetWeight: user.targetWeight && user.targetWeight !== '0' && user.targetWeight !== '0 lbs' ? user.targetWeight : '',
        fitnessGoal: user.fitnessGoal && user.fitnessGoal !== '0' ? user.fitnessGoal : 'Hypertrophy & Max Strength',
        emergencyContact: user.emergencyContact && user.emergencyContact !== '0' ? user.emergencyContact : '',
        address: user.address && user.address !== '0' ? user.address : '',
        bio: user.bio && user.bio !== '0' ? user.bio : '',
        membershipTier: user.membershipTier || 'Muscle Pro',
        autoRenew: true,
        daysLeft: 30,
        joinedDate: user.joinedDate || 'Sep 2026',
        profileImage: user.picture || user.profileImage || null
      }
    });
  }

  const currentJoinDate = new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  const fallbackMember = {
    ...(db.member || {}),
    joinedDate: (db.member?.joinedDate && db.member.joinedDate !== 'May 2026' && db.member.joinedDate !== 'July 2026')
      ? db.member.joinedDate
      : currentJoinDate
  };

  res.json({
    success: true,
    data: fallbackMember
  });
});


/**
 * PUT /api/member/profile
 * Update member profile details
 */
router.put('/profile', (req, res) => {
  const db = getDB();
  const updates = req.body || {};

  const allowedFields = [
    'name', 'email', 'phone', 'age', 'gender', 'height', 'weight',
    'targetWeight', 'fitnessGoal', 'emergencyContact', 'address', 'bio', 'profileImage'
  ];

  if (!db.member) db.member = {};

  allowedFields.forEach((field) => {
    if (updates[field] !== undefined) {
      db.member[field] = updates[field];
    }
  });

  // Also sync with db.users collection
  const targetEmail = (req.user?.email || updates.email || db.member?.email || '').toLowerCase();
  if (targetEmail) {
    if (!Array.isArray(db.users)) db.users = [];
    let userIdx = db.users.findIndex(u => u.email && u.email.toLowerCase() === targetEmail);
    if (userIdx === -1) {
      const newUser = {
        userId: `USR-${Date.now()}`,
        name: updates.name || 'Member',
        email: targetEmail,
        role: 'member',
        status: 'Active',
        membershipTier: updates.membershipTier || 'Muscle Pro',
        joinedDate: updates.joinedDate || 'Sep 2026'
      };
      db.users.push(newUser);
      userIdx = db.users.length - 1;
    }

    allowedFields.forEach((field) => {
      if (updates[field] !== undefined) {
        db.users[userIdx][field] = updates[field];
      }
    });
    if (updates.profileImage) {
      db.users[userIdx].picture = updates.profileImage;
      db.users[userIdx].profileImage = updates.profileImage;
    }
  }

  // Also update corresponding trainer's client entry if present
  if (db.trainer && Array.isArray(db.trainer.members)) {
    const clientIdx = db.trainer.members.findIndex(m => (m.email && m.email.toLowerCase() === targetEmail) || m.id === db.member.id);
    if (clientIdx !== -1) {
      if (updates.name) db.trainer.members[clientIdx].name = updates.name;
      if (updates.email) db.trainer.members[clientIdx].email = updates.email;
      if (updates.fitnessGoal) db.trainer.members[clientIdx].goal = updates.fitnessGoal;
    }
  }

  saveDB(db);

  res.json({
    success: true,
    message: 'Profile details and avatar saved successfully.',
    data: db.member
  });
});

export default router;
