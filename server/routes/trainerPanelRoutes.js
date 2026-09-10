import express from 'express';
import { getDB, saveDB } from '../config/db.js';

const router = express.Router();

const defaultTrainerMembers = [
  {
    id: 'MEM-10892',
    name: 'Ethan Hunt',
    email: 'ethan.hunt@apex.com',
    tier: 'Pro Member',
    status: 'Active',
    joined: '12 Jan 2024',
    goal: 'Hypertrophy & Powerlifting',
    diet: 'Mass Gainer Bulking Protocol',
    workout: 'Hypertrophy Split Alpha (Upper/Lower)',
    attendance: 98
  },
  {
    id: 'MEM-24901',
    name: 'Sarah Connor',
    email: 'sarah.c@apex.com',
    tier: 'VIP Athlete',
    status: 'Active',
    joined: '05 Mar 2024',
    goal: 'Lean Calorie Deficit & Conditioning',
    diet: 'Lean Calorie Deficit Plan',
    workout: 'High-Intensity Tactical Conditioning',
    attendance: 94
  },
  {
    id: 'MEM-31044',
    name: 'John Wick',
    email: 'john.wick@apex.com',
    tier: 'Elite Athlete',
    status: 'Active',
    joined: '20 Feb 2024',
    goal: 'Competition Shredded Cut',
    diet: 'Competition Shredded Cut',
    workout: 'Olympic Weightlifting & Power Block',
    attendance: 100
  },
  {
    id: 'MEM-45812',
    name: 'Alex Mercer',
    email: 'alex.m@apex.com',
    tier: 'Pro Member',
    status: 'Active',
    joined: '18 Apr 2024',
    goal: 'Mass Gainer Bulking',
    diet: 'Mass Gainer Bulking Protocol',
    workout: 'Hypertrophy Split Alpha (Upper/Lower)',
    attendance: 91
  }
];

const defaultWorkoutPlans = [
  {
    id: 'wp-1',
    name: 'Hypertrophy Split Alpha (Upper/Lower)',
    target: 'Muscle Mass & Strength',
    duration: '60 mins',
    exercises: 'Bench Press (4x8), Barbell Rows (4x10), Overhead Press (3x10), Incline Dumbbell Flyes (3x12)'
  },
  {
    id: 'wp-2',
    name: 'High-Intensity Tactical Conditioning',
    target: 'Fat Loss & Stamina',
    duration: '45 mins',
    exercises: 'Kettlebell Swings (4x20), Assault Bike Sprints (5x30s), Box Jumps (4x15), Burpees (4x15)'
  },
  {
    id: 'wp-3',
    name: 'Olympic Weightlifting & Power Block',
    target: 'Explosive Power & Speed',
    duration: '75 mins',
    exercises: 'Clean & Jerk (5x3), Barbell Back Squat (5x5), Roman Deadlifts (4x8), Pull-ups (4x10)'
  }
];
const defaultDietPlans = [
  {
    id: 'dp-preset-1',
    name: 'Mass Gainer Bulking Protocol',
    calories: '3200 kcal',
    protein: '200g',
    carbs: '380g',
    fats: '90g',
    desc: 'High-caloric hypertrophy diet to maximize muscle mass and strength gains.',
    goalCategory: 'Weight Gain',
    mealsSchedule: {
      morning: ['Rolled Oats with Cinnamon (80g)', 'Natural Peanut Butter (2 tbsp)', 'Fresh Ripe Bananas (2)'],
      lunch: ['Grilled Chicken Breast (200g)', 'Steamed Brown Rice (1.5 cups)', 'Fresh Sliced Avocado (1/2)'],
      preWorkout: ['Pre-Workout Energy Smoothie (400ml)', 'Whole Grain Rice Cakes (4)'],
      postWorkout: ['Post-Workout Anabolic Shake (500ml)', 'Rice Krispies & Protein Powder'],
      night: ['Baked Salmon Fillet (180g)', 'Micellar Casein Protein Pudding']
    },
    clientsAssigned: 0
  },
  {
    id: 'dp-preset-2',
    name: 'Lean Calorie Deficit Plan',
    calories: '1800 kcal',
    protein: '180g',
    carbs: '130g',
    fats: '50g',
    desc: 'Thermic calorie deficit diet focused on fat loss while preserving lean muscle mass.',
    goalCategory: 'Weight Loss',
    mealsSchedule: {
      morning: ['Egg White Omelet (6 whites)', 'Fresh Ripe Bananas (1)'],
      lunch: ['Grilled Chicken Breast (200g)', 'Fresh Sliced Avocado (1/2)'],
      preWorkout: ['BCAA + Glutamine Drink (1 scoop)', 'Whole Grain Rice Cakes (2)'],
      postWorkout: ['Whey Protein Isolate (1 scoop)', 'Fresh Ripe Bananas (1)'],
      night: ['Low-Fat Cottage Cheese (200g)', 'Greek Yogurt & Honey']
    },
    clientsAssigned: 0
  },
  {
    id: 'dp-preset-3',
    name: 'Competition Shredded Cut',
    calories: '2200 kcal',
    protein: '220g',
    carbs: '160g',
    fats: '55g',
    desc: 'Ultra-lean contest conditioning diet designed for peak muscular definition and vascularity.',
    goalCategory: 'Cutting',
    mealsSchedule: {
      morning: ['Egg White Omelet (6 whites)', 'Rolled Oats with Cinnamon (40g)'],
      lunch: ['Grilled Chicken Breast (220g)', 'Roasted Sweet Potato (150g)'],
      preWorkout: ['Pre-Workout Energy Smoothie (400ml)', 'BCAA + Glutamine Drink'],
      postWorkout: ['Whey Protein Isolate (2 scoops)', 'Rice Krispies & Protein Powder'],
      night: ['Baked Salmon Fillet (180g)', 'Micellar Casein Protein Pudding']
    },
    clientsAssigned: 0
  }
];
const defaultAgenda = [
  {
    id: 'ag-1',
    client: 'Ethan Hunt',
    routine: 'Morning Hypertrophy Squat Block',
    timeBlock: 'Today 07:00 AM',
    shiftCategory: 'Morning Shift',
    status: 'Ready'
  },
  {
    id: 'ag-2',
    client: 'Sarah Connor',
    routine: 'Morning Conditioning & Cardio Sprint',
    timeBlock: 'Today 08:30 AM',
    shiftCategory: 'Morning Shift',
    status: 'Ready'
  },
  {
    id: 'ag-3',
    client: 'Alex Mercer',
    routine: 'Evening Deadlift & Back Power Block',
    timeBlock: 'Today 05:00 PM',
    shiftCategory: 'Evening Shift',
    status: 'Ready'
  },
  {
    id: 'ag-4',
    client: 'John Wick',
    routine: 'Evening Tactical Conditioning & Core',
    timeBlock: 'Today 07:30 PM',
    shiftCategory: 'Evening Shift',
    status: 'Ready'
  }
];
const defaultAttendanceLogs = [];

// Helper to ensure trainer db structure exists
function ensureTrainerDB(db) {
  if (!db.trainer) db.trainer = {};
  if (!Array.isArray(db.trainer.members)) db.trainer.members = defaultTrainerMembers;
  if (!Array.isArray(db.trainer.workoutPlans)) db.trainer.workoutPlans = defaultWorkoutPlans;
  if (!Array.isArray(db.trainer.dietPlans)) db.trainer.dietPlans = defaultDietPlans;
  if (!Array.isArray(db.trainer.agenda)) db.trainer.agenda = defaultAgenda;
  if (!Array.isArray(db.trainer.attendanceLogs)) db.trainer.attendanceLogs = defaultAttendanceLogs;
  return db;
}

/**
 * --- 1. CLIENT ROSTER ENDPOINTS ---
 */

// GET /api/trainer/members - Get client roster
router.get('/members', (req, res) => {
  let db = getDB();
  db = ensureTrainerDB(db);
  saveDB(db);
  res.json({ success: true, data: db.trainer.members });
});

// POST /api/trainer/members - Add new client to roster
router.post('/members', (req, res) => {
  const { name, email, tier, goal } = req.body;
  if (!name || !email) {
    return res.status(400).json({ success: false, message: 'Name and email are required' });
  }

  let db = getDB();
  db = ensureTrainerDB(db);

  const newMember = {
    id: `MEM-${Math.floor(10000 + Math.random() * 90000)}`,
    name: name.trim(),
    email: email.trim(),
    tier: tier || 'Pro Member',
    status: 'Active',
    joined: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    goal: goal || 'General Fitness'
  };

  db.trainer.members.unshift(newMember);
  saveDB(db);

  res.status(201).json({
    success: true,
    message: `Client ${newMember.name} added to roster successfully!`,
    data: newMember,
    members: db.trainer.members
  });
});

// DELETE /api/trainer/members/:id - Remove client from roster
router.delete('/members/:id', (req, res) => {
  const { id } = req.params;
  let db = getDB();
  db = ensureTrainerDB(db);

  db.trainer.members = db.trainer.members.filter(m => m.id !== id);
  saveDB(db);

  res.json({
    success: true,
    message: 'Client removed from trainer roster',
    members: db.trainer.members
  });
});

// POST /api/trainer/send-renewal-reminder - Send automated renewal reminder to a client
router.post('/send-renewal-reminder', (req, res) => {
  const { memberEmail, memberName, coachName, daysLeft, packageType } = req.body;
  
  if (!memberEmail) {
    return res.status(400).json({ success: false, message: 'Member email is required' });
  }

  let db = getDB();
  db = ensureTrainerDB(db);

  const daysNum = Number(daysLeft) || 0;
  const daysText = daysNum <= 0 ? 'has expired' : `expires in ${daysNum} day${daysNum === 1 ? '' : 's'}`;
  const reminderText = `🔔 Coaching Renewal Reminder: Hi ${memberName || 'Athlete'}! Your personal coaching plan with Coach ${coachName || 'Trainer'} ${daysText}. Please renew your subscription to maintain uninterrupted coaching and workouts.`;

  // 1. Add to trainer chat history
  if (!db.trainer.chatHistory) db.trainer.chatHistory = [];
  db.trainer.chatHistory.push({
    id: `msg-${Date.now()}`,
    sender: 'coach',
    text: reminderText,
    time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  });

  // 2. Add to alerts
  if (!db.alerts) db.alerts = [];
  db.alerts.unshift({
    id: `alt-renewal-${Date.now()}`,
    title: `Coaching Plan Renewal: ${daysText.toUpperCase()}`,
    message: reminderText,
    type: 'renewal_reminder',
    targetEmail: memberEmail,
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
    active: true
  });

  saveDB(db);

  res.json({
    success: true,
    message: `Renewal reminder successfully sent to ${memberName || memberEmail}!`,
    reminderText
  });
});

/**
 * --- 2. WORKOUT PLANS ARCHITECT ENDPOINTS ---
 */

// GET /api/trainer/workouts - Get workout plans
router.get('/workouts', (req, res) => {
  let db = getDB();
  db = ensureTrainerDB(db);
  saveDB(db);
  res.json({ success: true, data: db.trainer.workoutPlans });
});

// POST /api/trainer/workouts - Architect new workout plan
router.post('/workouts', (req, res) => {
  const { name, target, duration, exercises } = req.body;
  if (!name || !exercises) {
    return res.status(400).json({ success: false, message: 'Workout name and exercises list are required' });
  }

  let db = getDB();
  db = ensureTrainerDB(db);

  const newPlan = {
    id: `wp-${Date.now()}`,
    name: name.trim(),
    target: target || 'General Fitness',
    duration: duration || '4 weeks',
    exercises: exercises.trim(),
    clientsAssigned: 0,
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
  };

  db.trainer.workoutPlans.unshift(newPlan);
  saveDB(db);

  res.status(201).json({
    success: true,
    message: `Workout program '${newPlan.name}' architected successfully!`,
    data: newPlan,
    workoutPlans: db.trainer.workoutPlans
  });
});

// POST /api/trainer/workouts/assign - Assign workout plan to client
router.post('/workouts/assign', (req, res) => {
  const { planId, memberId } = req.body;
  let db = getDB();
  db = ensureTrainerDB(db);

  const plan = db.trainer.workoutPlans.find(p => p.id === planId);
  if (plan) {
    plan.clientsAssigned = (plan.clientsAssigned || 0) + 1;
    saveDB(db);
  }

  res.json({
    success: true,
    message: 'Workout plan assigned to athlete',
    workoutPlans: db.trainer.workoutPlans
  });
});

// DELETE /api/trainer/workouts/:id - Delete workout plan
router.delete('/workouts/:id', (req, res) => {
  const { id } = req.params;
  let db = getDB();
  db = ensureTrainerDB(db);

  db.trainer.workoutPlans = db.trainer.workoutPlans.filter(p => p.id !== id);
  saveDB(db);

  res.json({
    success: true,
    message: 'Workout program deleted',
    workoutPlans: db.trainer.workoutPlans
  });
});

/**
 * --- 3. DIET & MACRO PLANS ARCHITECT ENDPOINTS ---
 */

// GET /api/trainer/diets - Get diet plans
router.get('/diets', (req, res) => {
  let db = getDB();
  db = ensureTrainerDB(db);
  saveDB(db);
  res.json({ success: true, data: db.trainer.dietPlans });
});

// POST /api/trainer/diets - Formulate new diet plan
router.post('/diets', (req, res) => {
  const { name, calories, protein, carbs, fats, desc, goalCategory, mealsSchedule } = req.body;
  if (!name || !calories) {
    return res.status(400).json({ success: false, message: 'Diet plan name and caloric target are required' });
  }

  let db = getDB();
  db = ensureTrainerDB(db);

  const newDiet = {
    id: `dp-${Date.now()}`,
    name: name.trim(),
    calories: String(calories).includes('kcal') ? String(calories) : `${calories} kcal`,
    protein: protein ? (String(protein).includes('g') ? String(protein) : `${protein}g`) : '180g',
    carbs: carbs ? (String(carbs).includes('g') ? String(carbs) : `${carbs}g`) : '250g',
    fats: fats ? (String(fats).includes('g') ? String(fats) : `${fats}g`) : '70g',
    desc: desc || 'Custom nutrition plan',
    goalCategory: goalCategory || 'Custom',
    mealsSchedule: mealsSchedule || {
      morning: [],
      lunch: [],
      preWorkout: [],
      postWorkout: [],
      night: []
    },
    clientsAssigned: 0
  };

  db.trainer.dietPlans.unshift(newDiet);
  saveDB(db);

  res.status(201).json({
    success: true,
    message: `Diet plan '${newDiet.name}' formulated successfully!`,
    data: newDiet,
    dietPlans: db.trainer.dietPlans
  });
});

// POST /api/trainer/diets/assign - Assign diet plan to client
router.post('/diets/assign', (req, res) => {
  const { dietId, memberId } = req.body;
  let db = getDB();
  db = ensureTrainerDB(db);

  const diet = db.trainer.dietPlans.find(d => d.id === dietId);
  if (diet) {
    diet.clientsAssigned = (diet.clientsAssigned || 0) + 1;
    saveDB(db);
  }

  res.json({
    success: true,
    message: 'Diet plan assigned to athlete',
    dietPlans: db.trainer.dietPlans
  });
});

// DELETE /api/trainer/diets/:id - Delete diet plan
router.delete('/diets/:id', (req, res) => {
  const { id } = req.params;
  let db = getDB();
  db = ensureTrainerDB(db);

  db.trainer.dietPlans = db.trainer.dietPlans.filter(d => d.id !== id);
  saveDB(db);

  res.json({
    success: true,
    message: 'Diet plan deleted',
    dietPlans: db.trainer.dietPlans
  });
});

/**
 * --- 4. SCHEDULE & SESSIONS AGENDA ENDPOINTS ---
 */

// GET /api/trainer/schedule - Get sessions agenda
router.get('/schedule', (req, res) => {
  let db = getDB();
  db = ensureTrainerDB(db);
  saveDB(db);
  res.json({ success: true, data: db.trainer.agenda });
});

// POST /api/trainer/schedule - Create training session block
router.post('/schedule', (req, res) => {
  const { client, routine, timeBlock, status, shiftCategory } = req.body;
  if (!client || !routine || !timeBlock) {
    return res.status(400).json({ success: false, message: 'Client name, routine, and time block are required' });
  }

  let db = getDB();
  db = ensureTrainerDB(db);

  const newSession = {
    id: `ag-${Date.now()}`,
    client: client.trim(),
    routine: routine.trim(),
    timeBlock: timeBlock.trim(),
    shiftCategory: shiftCategory || 'Morning Shift',
    status: status || 'Ready'
  };

  db.trainer.agenda.push(newSession);

  // Auto-dispatch schedule notification message into trainer chat history for member panel
  if (!Array.isArray(db.trainer.chatHistory)) {
    db.trainer.chatHistory = [];
  }
  const now = new Date();
  const timeStr = now.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }) + ', ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  db.trainer.chatHistory.push({
    id: `c-${Date.now()}`,
    sender: 'coach',
    text: `📅 [SCHEDULE DISPATCH] Coaching Session Scheduled for ${newSession.client}: "${newSession.routine}" on ${newSession.timeBlock} (${newSession.shiftCategory}).`,
    time: timeStr
  });

  saveDB(db);

  res.status(201).json({
    success: true,
    message: `Training session scheduled for ${newSession.client}!`,
    data: newSession,
    agenda: db.trainer.agenda
  });
});

// PUT /api/trainer/schedule/:id - Update session status
router.put('/schedule/:id', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  let db = getDB();
  db = ensureTrainerDB(db);

  const session = db.trainer.agenda.find(s => s.id === id);
  if (session) {
    session.status = status || session.status;
    saveDB(db);
  }

  res.json({
    success: true,
    message: 'Session status updated',
    agenda: db.trainer.agenda
  });
});

// DELETE /api/trainer/schedule/:id - Cancel session block
router.delete('/schedule/:id', (req, res) => {
  const { id } = req.params;
  let db = getDB();
  db = ensureTrainerDB(db);

  db.trainer.agenda = db.trainer.agenda.filter(s => s.id !== id);
  saveDB(db);

  res.json({
    success: true,
    message: 'Training session cancelled',
    agenda: db.trainer.agenda
  });
});

/**
 * --- 5. TURNSTILE ATTENDANCE ENDPOINTS ---
 */

// GET /api/trainer/attendance - Get turnstile logs
router.get('/attendance', (req, res) => {
  let db = getDB();
  db = ensureTrainerDB(db);
  saveDB(db);
  res.json({ success: true, data: db.trainer.attendanceLogs });
});

// POST /api/trainer/attendance/turnstile - Manual turnstile release trigger
router.post('/attendance/turnstile', (req, res) => {
  const { memberName, action, date, time } = req.body;
  if (!memberName) {
    return res.status(400).json({ success: false, message: 'Member name required' });
  }

  let db = getDB();
  db = ensureTrainerDB(db);

  const matchedUser = db.trainer.members.find(m => m.name === memberName) || { id: 'MEM-90210' };
  const code = matchedUser.id ? `#${matchedUser.id.split('-')[1] || '90210'}-CARD` : '#8092-CARD';
  
  const now = new Date();
  const defaultTimeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const defaultDateStr = now.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });

  let inputDateStr = defaultDateStr;
  let inputTimeStr = defaultTimeStr;

  if (date) {
    try {
      const parsedDate = new Date(date);
      if (!isNaN(parsedDate.getTime())) {
        inputDateStr = parsedDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
      } else {
        inputDateStr = date;
      }
    } catch (e) {
      inputDateStr = date;
    }
  }

  if (time) {
    try {
      const [hours, minutes] = time.split(':');
      const tempDate = new Date();
      tempDate.setHours(parseInt(hours, 10));
      tempDate.setMinutes(parseInt(minutes, 10));
      inputTimeStr = tempDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      inputTimeStr = time;
    }
  }

  const act = action === 'check-out' ? 'check-out' : 'check-in';

  let newLog;
  if (act === 'check-in') {
    newLog = {
      id: `att-${Date.now()}`,
      name: memberName.trim(),
      code,
      scanMethod: 'Manual Entry (Trainer)',
      inTime: inputTimeStr,
      outTime: '--',
      duration: '--',
      date: inputDateStr,
      status: 'active'
    };
    db.trainer.attendanceLogs.unshift(newLog);
  } else {
    // Complete check-out
    const activeLog = db.trainer.attendanceLogs.find(log => log.name === memberName.trim() && log.outTime === '--');
    if (activeLog) {
      activeLog.outTime = inputTimeStr;
      activeLog.status = 'done';
      activeLog.duration = '1h 30m';
      newLog = activeLog;
    } else {
      newLog = {
        id: `att-${Date.now()}`,
        name: memberName.trim(),
        code,
        scanMethod: 'Manual Entry (Trainer)',
        inTime: '09:00 AM',
        outTime: inputTimeStr,
        duration: '1h 30m',
        date: inputDateStr,
        status: 'done'
      };
      db.trainer.attendanceLogs.unshift(newLog);
    }
  }

  // Sync to db.attendance so the member can see it in their history
  if (!db.attendance) {
    db.attendance = {
      isCheckedIn: false,
      checkInTime: null,
      streakDays: 0,
      attendanceRate: 100,
      activeDaysInMonth: [],
      sessions: []
    };
  }

  if (act === 'check-in') {
    db.attendance.isCheckedIn = true;
    db.attendance.checkInTime = inputTimeStr;
    db.attendance.streakDays = (db.attendance.streakDays || 0) + 1;
    
    try {
      const parsedDate = date ? new Date(date) : now;
      if (!isNaN(parsedDate.getTime())) {
        const dayOfMonth = parsedDate.getDate();
        if (!db.attendance.activeDaysInMonth.includes(dayOfMonth)) {
          db.attendance.activeDaysInMonth.push(dayOfMonth);
        }
      }
    } catch (e) {}
  } else {
    db.attendance.isCheckedIn = false;
    db.attendance.checkInTime = null;
  }

  db.attendance.sessions.unshift({
    date: inputDateStr,
    time: inputTimeStr,
    type: `Manual Trainer (${act === 'check-in' ? 'Check-in' : 'Check-out'})`
  });

  saveDB(db);

  res.status(201).json({
    success: true,
    message: `Manual turnstile release triggered for ${memberName} (${act})!`,
    data: newLog,
    attendanceLogs: db.trainer.attendanceLogs
  });
});

/**
 * --- 6. CLIENT CHAT ENDPOINTS ---
 */

// GET /api/trainer/chat - Get trainer chat history
router.get('/chat', (req, res) => {
  let db = getDB();
  db = ensureTrainerDB(db);
  saveDB(db);
  const memberName = req.query.memberName || req.query.name;
  let history = db.trainer.chatHistory || [];
  if (memberName) {
    history = history.filter(m => !m.memberName || m.memberName.toLowerCase() === memberName.toLowerCase());
  }
  res.json({ success: true, data: history });
});

// POST /api/trainer/chat - Trainer sends message to client
router.post('/chat', (req, res) => {
  const { text, sender, memberName } = req.body;
  if (!text) {
    return res.status(400).json({ success: false, message: 'Message text is required' });
  }

  let db = getDB();
  db = ensureTrainerDB(db);
  if (!db.trainer.chatHistory) db.trainer.chatHistory = [];

  const now = new Date();
  const timeStr = now.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }) + ', ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const targetMember = memberName || 'Ethan Hunt';

  const newMsg = {
    id: `c-${Date.now()}`,
    memberName: targetMember,
    sender: sender || 'coach',
    text: text.trim(),
    time: timeStr
  };

  db.trainer.chatHistory.push(newMsg);
  saveDB(db);

  const memberHistory = db.trainer.chatHistory.filter(m => !m.memberName || m.memberName.toLowerCase() === targetMember.toLowerCase());

  res.status(201).json({
    success: true,
    message: `Message sent to ${targetMember}`,
    data: newMsg,
    chatHistory: memberHistory
  });
});

export default router;
