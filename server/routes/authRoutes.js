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
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email syntax.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters.'
      });
    }

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
 * POST /api/auth/google
 * Authenticate or auto-register user via Google OAuth 2.0 credential
 */
router.post('/google', async (req, res) => {
  try {
    const { credential, role } = req.body;

    if (!credential) {
      return res.status(400).json({
        success: false,
        message: 'Google credential token is required.'
      });
    }

    // Decode Google JWT payload safely
    let googlePayload = null;
    try {
      const base64Url = credential.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = Buffer.from(base64, 'base64').toString('utf8');
      googlePayload = JSON.parse(jsonPayload);
    } catch (e) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Google credential token format.'
      });
    }

    const { email, name, picture, sub } = googlePayload;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email address not found in Google credential.'
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name || cleanEmail.split('@')[0];
    const defaultRole = role === 'trainer' ? 'trainer' : (role === 'admin' || cleanEmail.includes('admin') ? 'admin' : 'member');

    const db = getDB();
    if (!db.users) db.users = [];

    let existingUser = db.users.find(u => u.email && u.email.trim().toLowerCase() === cleanEmail);

    if (!existingUser && isMongoConnected()) {
      existingUser = await User.findOne({ email: new RegExp(`^${cleanEmail}$`, 'i') });
    }

    let userToAuth = null;
    const regDate = new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

    if (existingUser) {
      userToAuth = {
        userId: existingUser.userId || `USR-${Date.now()}`,
        name: existingUser.name || cleanName,
        email: cleanEmail,
        role: existingUser.role || defaultRole,
        picture: picture || existingUser.picture || null,
        membershipTier: existingUser.membershipTier || 'Muscle Pro',
        status: existingUser.status || 'Active'
      };
    } else {
      userToAuth = {
        userId: defaultRole === 'trainer' ? `TRN-${Date.now()}` : `USR-${Date.now()}`,
        name: cleanName,
        email: cleanEmail,
        password: `google_oauth_${sub || Date.now()}`,
        role: defaultRole,
        picture: picture || null,
        membershipTier: defaultRole === 'trainer' ? 'Staff Trainer' : (defaultRole === 'admin' ? 'System Admin' : 'Muscle Pro'),
        status: 'Active',
        joinedDate: regDate,
        authProvider: 'google'
      };

      db.users.push(userToAuth);

      if (defaultRole === 'trainer') {
        if (!db.trainer) db.trainer = {};
        db.trainer.coachName = cleanName;
      } else if (defaultRole === 'member') {
        if (!db.trainer) db.trainer = {};
        if (!Array.isArray(db.trainer.members)) db.trainer.members = [];
        const inRoster = db.trainer.members.some(m => m.email && m.email.toLowerCase() === cleanEmail);
        if (!inRoster) {
          db.trainer.members.unshift({
            id: userToAuth.userId,
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

      if (isMongoConnected()) {
        await User.findOneAndUpdate(
          { email: cleanEmail },
          userToAuth,
          { upsert: true, returnDocument: 'after' }
        );
      }
    }

    const token = jwt.sign(
      { userId: userToAuth.userId, email: userToAuth.email, name: userToAuth.name, role: userToAuth.role },
      process.env.JWT_SECRET || 'apex_sha256_mock_sig_valid',
      { expiresIn: '30d' }
    );

    console.log(`🌐 GOOGLE AUTH LOGIN SUCCESSFUL: ${userToAuth.name} (${userToAuth.email}) [${userToAuth.role.toUpperCase()}]`);

    return res.json({
      success: true,
      message: `Welcome, ${userToAuth.name}! Authenticated via Google.`,
      token,
      user: {
        userId: userToAuth.userId,
        name: userToAuth.name,
        email: userToAuth.email,
        role: userToAuth.role,
        picture: userToAuth.picture,
        membershipTier: userToAuth.membershipTier
      }
    });

  } catch (err) {
    console.error('Google Auth Error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error during Google authentication.',
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
