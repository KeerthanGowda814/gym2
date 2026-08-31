import express from 'express';
import jwt from 'jsonwebtoken';
import { getDB, saveDB } from '../config/db.js';
import User from '../models/User.js';
import { isMongoConnected } from '../config/mongodb.js';


const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new member or trainer user directly into MongoDB Atlas
 */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, age, phone, specialty, certifications } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required.'
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    const userRole = role === 'trainer' ? 'trainer' : 'member';

    const db = getDB();
    if (!db.users) db.users = [];

    // Check if user already exists
    const existingIndex = db.users.findIndex((u) => u.email.toLowerCase() === cleanEmail);
    if (existingIndex !== -1) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists.'
      });
    }

    const regDate = new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

    const newUser = {
      userId: userRole === 'trainer' ? `TRN-${Date.now()}` : `USR-${Date.now()}`,
      name: cleanName,
      email: cleanEmail,
      password, // Stored securely
      role: userRole,
      age: age ? Number(age) : null,
      phone: phone ? String(phone).trim() : null,
      specialty: specialty || (userRole === 'trainer' ? 'Certified Strength & Performance Coach' : null),
      certifications: certifications || (userRole === 'trainer' ? 'CSCS, Fitness Specialist' : null),
      credentials: certifications || (userRole === 'trainer' ? 'CSCS, Fitness Specialist' : null),
      bio: req.body.bio || (userRole === 'trainer' ? 'Dedicated certified trainer focused on progressive overload, form biomechanics, and personalized fitness goals.' : null),
      membershipTier: userRole === 'trainer' ? 'Staff Trainer' : 'Muscle Pro',
      status: 'Active',
      joinedDate: regDate
    };

    // 1. Add to local JSON cache
    db.users.push(newUser);

    // 2. If new trainer registered, update active trainer bio & add to roster
    if (userRole === 'trainer') {
      if (!db.trainer) db.trainer = {};
      db.trainer.coachName = cleanName;
      db.trainer.credentials = newUser.credentials;
      db.trainer.specialty = newUser.specialty;
      db.trainer.bio = newUser.bio;
    } else if (userRole === 'member') {
      if (!db.trainer) db.trainer = {};
      if (!Array.isArray(db.trainer.members)) db.trainer.members = [];
      
      const inRoster = db.trainer.members.some(m => m.email.toLowerCase() === cleanEmail);
      if (!inRoster) {
        db.trainer.members.unshift({
          id: newUser.userId,
          name: cleanName,
          email: cleanEmail,
          tier: 'Pro Member',
          status: 'Active',
          joined: regDate,
          goal: 'General Fitness'
        });
      }
    }

    saveDB(db);

    // 3. Directly persist to MongoDB Atlas User collection
    if (isMongoConnected()) {
      await User.findOneAndUpdate(
        { email: cleanEmail },
        newUser,
        { upsert: true, returnDocument: 'after' }
      );
    }

    console.log(`👤 NEW USER REGISTERED IN MONGODB ATLAS: ${cleanName} (${cleanEmail}) [${userRole.toUpperCase()}]`);

    const token = jwt.sign(
      { userId: newUser.userId, email: newUser.email, name: newUser.name, role: newUser.role },
      process.env.JWT_SECRET || 'apex_sha256_mock_sig_valid',
      { expiresIn: '30d' }
    );

    return res.status(201).json({
      success: true,
      message: `User ${cleanName} registered and stored in MongoDB Atlas successfully!`,
      token,
      user: {
        userId: newUser.userId,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        membershipTier: newUser.membershipTier
      }
    });

  } catch (err) {
    console.error('Registration Error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error during registration.',
      error: err.message
    });
  }
});

/**
 * POST /api/auth/login
 * Authenticate user against MongoDB Atlas registered users
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.'
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const db = getDB();

    if (!db.users) db.users = [];

    // Find matching user (case-insensitive email)
    let user = db.users.find(u => u.email.trim().toLowerCase() === cleanEmail && u.password === password);

    // Check MongoDB Atlas directly if not in local cache
    if (!user && isMongoConnected()) {
      user = await User.findOne({ email: new RegExp(`^${cleanEmail}$`, 'i'), password });
      if (!user) {
        // Fallback check matching trimmed email & password
        const atlasUsers = await User.find({});
        user = atlasUsers.find(u => u.email && u.email.trim().toLowerCase() === cleanEmail && u.password === password);
      }
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Ensure user is in local db.users cache list
    if (!db.users.some(u => u.email.toLowerCase() === cleanEmail)) {
      db.users.push({
        userId: user.userId || `USR-${Date.now()}`,
        name: user.name,
        email: user.email,
        password: user.password,
        role: user.role,
        age: user.age || null,
        phone: user.phone || null,
        specialty: user.specialty || (user.role === 'trainer' ? 'Certified Strength & Performance Coach' : null),
        certifications: user.certifications || null,
        credentials: user.credentials || null,
        bio: user.bio || null,
        membershipTier: user.membershipTier || (user.role === 'trainer' ? 'Staff Trainer' : 'Muscle Pro'),
        status: user.status || 'Active',
        joinedDate: user.joinedDate || new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      });
    }

    // Update active member profile name in db
    if (user.role === 'member') {
      db.member.id = user.userId || db.member.id;
      db.member.name = user.name;
      db.member.email = user.email;
      db.member.membershipTier = user.membershipTier || 'Muscle Pro';
      saveDB(db);
    } else if (user.role === 'trainer') {
      db.trainer.coachName = user.name;
      saveDB(db);
    }

    const token = jwt.sign(
      { userId: user.userId, email: user.email, name: user.name, role: user.role },
      process.env.JWT_SECRET || 'apex_sha256_mock_sig_valid',
      { expiresIn: '30d' }
    );

    return res.json({
      success: true,
      message: `Welcome back, ${user.name}! Authenticated via MongoDB Atlas.`,
      token,
      user: {
        userId: user.userId,
        name: user.name,
        email: user.email,
        role: user.role,
        membershipTier: user.membershipTier
      }
    });

  } catch (err) {
    console.error('Login Error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error during login.',
      error: err.message
    });
  }
});

/**
 * GET /api/auth/users
 * Retrieve all registered users stored in MongoDB Atlas
 */
router.get('/users', async (req, res) => {
  try {
    const db = getDB();
    let usersList = db.users || [];

    if (isMongoConnected()) {
      const atlasUsers = await User.find({}).select('-password');
      if (atlasUsers && atlasUsers.length > 0) {
        usersList = atlasUsers;
      }
    }

    res.json({
      success: true,
      count: usersList.length,
      data: usersList
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error fetching registered users from MongoDB Atlas',
      error: err.message
    });
  }
});

export default router;
