import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import GymDataModel from '../models/GymData.js';
import User from '../models/User.js';
import Member from '../models/Member.js';
import Workout from '../models/Workout.js';
import { Supplement } from '../models/Supplement.js';
import TrainerData from '../models/TrainerData.js';
import Attendance from '../models/Attendance.js';
import { isMongoConnected } from './mongodb.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, '../data/db.json');

// Default initial database state with seed data
const initialData = {
  users: [
    {
      userId: "ADM-SUPER",
      name: "System Admin",
      email: "admin@apex.com",
      password: "AdminPass123!",
      role: "admin",
      phone: "+1 (555) 999-0000",
      specialty: "Facility Operations & Analytics Director",
      credentials: "Apex Master Admin",
      certifications: "System Director",
      bio: "Master administrator overseeing member analytics, payment billing, equipment diagnostics, and master attendance.",
      membershipTier: "System Admin",
      status: "Active",
      joinedDate: "July 2026"
    },
    {
      userId: "TRN-KEERTHU",
      name: "Coach Keerthu",
      email: "keerthu@apex.com",
      password: "TrainerPass123!",
      role: "trainer",
      phone: "+91 98765 11111",
      specialty: "Barbell Biomechanics, Strength & Hypertrophy Master",
      credentials: "CSCS, Master of Sports Physiology",
      certifications: "CSCS, Master of Sports Physiology",
      bio: "Master strength coach specializing in periodized hypertrophy, powerlifting biomechanics, and elite athletic performance.",
      membershipTier: "Staff Trainer",
      status: "Active",
      joinedDate: "July 2026"
    },
    {
      userId: "TRN-VISHWAMBHARA",
      name: "Coach Vishwambhara",
      email: "vishwambhara@apex.com",
      password: "TrainerPass123!",
      role: "trainer",
      phone: "+91 98765 22222",
      specialty: "HIIT, Functional Endurance & Combat Conditioning",
      credentials: "NASM-CPT, Kettlebell & Functional Master",
      certifications: "NASM-CPT, Kettlebell & Functional Master",
      bio: "High-performance conditioning specialist focusing on athletic VO2 max, functional core strength, and mobility.",
      membershipTier: "Staff Trainer",
      status: "Active",
      joinedDate: "July 2026"
    }
  ],
  member: {
    id: "MEM-LOGGED-IN",
    name: "Registered Member",
    email: "member@apex.com",
    role: "member",
    membershipTier: "Muscle Pro",
    autoRenew: true,
    daysLeft: 30,
    expiryDate: "August 24, 2026",
    nextChargeDate: "August 24, 2026",
    renewed: false,
    attendanceStreak: 0,
    attendanceRate: 100
  },
  workouts: [],
  nutrition: {
    protein: { current: 150, target: 200, unit: "g" },
    carbs: { current: 180, target: 250, unit: "g" },
    fats: { current: 55, target: 75, unit: "g" }
  },
  invoices: [],
  trainer: {
    coachName: "Certified Gym Coach",
    credentials: "CSCS, M.Sc. Sports Physiology",
    specialty: "Barbell Biomechanics & Hypertrophy",
    bio: "Certified fitness & performance coach dedicated to athletic programming.",
    bookings: [],
    chatHistory: [],
    members: [],
    workoutPlans: [],
    dietPlans: [],
    agenda: [],
    attendanceLogs: []
  },
  attendance: {
    isCheckedIn: false,
    checkInTime: null,
    streakDays: 0,
    attendanceRate: 0,
    activeDaysInMonth: [],
    sessions: []
  },
  supplements: {
    products: [
      {
        id: "muscleblaze-biozyme",
        name: "MuscleBlaze Biozyme Performance Whey",
        category: "protein",
        price: 2799,
        origPrice: 3499,
        rating: 4.9,
        reviews: 2450,
        tag: "50% Absorbability",
        tagClass: "best-seller",
        image: "assets/images/muscleblaze_whey.png",
        desc: "Clinically tested 50% higher protein absorption rate. Biozyme Performance Whey with Enhanced Absorption Formula (EAF). Rich Chocolate, 2.0kg tub.",
        specs: {
          "Weight": "2.0 kg (4.4 lbs)",
          "Protein / Serving": "25g",
          "EAF Absorbability": "50% Higher",
          "Flavor": "Rich Milk Chocolate",
          "Servings": "50"
        }
      },
      {
        id: "gnc-whey-pro",
        name: "GNC Pro Performance 100% Whey",
        category: "protein",
        price: 3199,
        origPrice: 3999,
        rating: 4.8,
        reviews: 1890,
        tag: "Official Brand",
        tagClass: "best-seller",
        image: "assets/images/gnc_whey.png",
        desc: "Instantized 100% Whey Protein with 24g ultra-pure protein and 5.5g BCAAs per scoop. Fast absorbing muscle recovery blend. Chocolate Fudge flavor.",
        specs: {
          "Weight": "2.0 kg (4.4 lbs)",
          "Protein / Serving": "24g",
          "BCAAs": "5.5g",
          "Flavor": "Chocolate Fudge",
          "Servings": "57"
        }
      },
      {
        id: "wellcore-creatine",
        name: "Wellcore Pure Micronized Creatine Powder",
        category: "strength",
        price: 1299,
        origPrice: 1699,
        rating: 4.9,
        reviews: 3120,
        tag: "Best Seller",
        tagClass: "best-seller",
        image: "assets/images/wellcore_creatine.png",
        desc: "100% Pure Unflavored Micronized Creatine Monohydrate. Rapid ATP synthesis, uncompromised purity for explosive strength & muscular endurance.",
        specs: {
          "Weight": "250g Jar",
          "Serving Size": "3g",
          "Purity": "100% Micronized",
          "Flavor": "Unflavored",
          "Servings": "83"
        }
      },
      {
        id: "whey-isolate",
        name: "Apex Whey Protein Isolate",
        category: "protein",
        price: 2999.00,
        origPrice: 3799.00,
        rating: 4.8,
        reviews: 1248,
        tag: "Best Seller",
        tagClass: "best-seller",
        image: "assets/images/whey_protein.png",
        desc: "100% Pure cross-flow microfiltered isolate. Chocolate flavor, 2.2 lbs tub. Yields 25g protein per serving.",
        specs: {
          "Weight": "2.2 lbs",
          "Protein / Serving": "25g",
          "BCAAs / Serving": "5.5g",
          "Flavor": "Double Rich Chocolate",
          "Servings": "30"
        }
      },
      {
        id: "creatine-mono",
        name: "Apex Micronized Creatine",
        category: "strength",
        price: 1199.00,
        origPrice: 1599.00,
        rating: 4.9,
        reviews: 842,
        tag: "ATP Power",
        tagClass: "best-seller",
        image: "assets/images/creatine.png",
        desc: "Premium 200-mesh micronized creatine monohydrate. 500g bag. Promotes ATP regeneration and cellular hydration.",
        specs: {
          "Weight": "500g",
          "Serving Size": "5g",
          "Purity": "99.9% Monohydrate",
          "Flavor": "Unflavored",
          "Servings": "100"
        }
      },
      {
        id: "pre-ignite",
        name: "Apex Pre-Workout Ignite",
        category: "energy",
        price: 1699.00,
        origPrice: 2199.00,
        rating: 4.7,
        reviews: 612,
        tag: "High Energy",
        tagClass: "",
        image: "assets/images/pre_workout.png",
        desc: "Sour Apple focus blend. 30 servings. Formulated with L-Citrulline, Beta-Alanine, and caffeine anhydrous.",
        specs: {
          "Weight": "300g",
          "Servings": "30",
          "Caffeine": "250mg",
          "L-Citrulline": "6000mg",
          "Beta-Alanine": "3200mg",
          "Flavor": "Sour Green Apple"
        }
      },
      {
        id: "mass-gainer",
        name: "Apex Hydro Mass Gainer",
        category: "protein",
        price: 3499.00,
        origPrice: 4299.00,
        rating: 4.6,
        reviews: 340,
        tag: "Mass Builder",
        tagClass: "",
        image: "assets/images/gallery_weights.png",
        desc: "High calorie complex carbohydrate and whey isolate formula. Premium Vanilla flavor, 6 lbs bag.",
        specs: {
          "Weight": "6.0 lbs",
          "Calories": "1250 kcal",
          "Protein": "50g",
          "Carbohydrates": "250g",
          "Flavor": "Vanilla Ice Cream"
        }
      },
      {
        id: "bcaa-recovery",
        name: "Apex BCAA Recovery",
        category: "energy",
        price: 1399.00,
        origPrice: 1799.00,
        rating: 4.8,
        reviews: 480,
        tag: "Intra-Workout",
        tagClass: "best-seller",
        image: "assets/images/gallery_cardio.png",
        desc: "Optimal 2:1:1 ratio BCAAs for intra-workout muscle preservation and recovery. Blue Raspberry flavor.",
        specs: {
          "Weight": "350g",
          "Servings": "30",
          "BCAA Ratio": "2:1:1 (7g)",
          "Electrolytes": "1000mg",
          "Flavor": "Blue Raspberry"
        }
      },
      {
        id: "multivitamin",
        name: "Apex Sports Multivitamin",
        category: "strength",
        price: 799.00,
        origPrice: 999.00,
        rating: 4.5,
        reviews: 215,
        tag: "Daily Health",
        tagClass: "",
        image: "assets/images/gallery_yoga.png",
        desc: "Clinically formulated daily multivitamin pack optimized for athletes. Contains 90 active tablets.",
        specs: {
          "Tablets": "90 Tablets",
          "Supply": "30 Days",
          "Target": "Athletes",
          "Ingredients": "25+ active vitamins"
        }
      }
    ],
    orders: []
  },
  equipment: [
    {
      id: "chest-station",
      name: "Chest Workout Station",
      status: "Active & Available",
      category: "Chest",
      image: "assets/images/chest_workout.png",
      specs: [
        "Equipped with: 3 Incline Bench Presses, 2 Flat Bench Presses, 2 Pec Dec Fly machines",
        "Features: Adjustable seat alignments, commercial-grade weight stacks",
        "Rules: Wipe down pads after use. Use safety catches on barbell benches",
        "Peak Hours: 5:00 PM - 8:00 PM",
        "Target Muscles: Pectoralis Major, Anterior Deltoids, Triceps"
      ]
    },
    {
      id: "back-station",
      name: "Back Workout Station",
      status: "Active & Available",
      category: "Back",
      image: "assets/images/back_workout.png",
      specs: [
        "Equipped with: 4 Lat Pulldown towers, 3 Seated Cable Row machines, 2 T-Bar Row platforms",
        "Features: Ergonomic multi-grip pulldown attachments, steel cables",
        "Rules: Control the eccentric phase of lifting (do not slam weights)",
        "Peak Hours: 6:00 PM - 8:00 PM",
        "Target Muscles: Latissimus Dorsi, Rhomboids, Trapezius"
      ]
    },
    {
      id: "biceps-station",
      name: "Biceps Workout Station",
      status: "Active & Available",
      category: "Biceps",
      image: "assets/images/biceps_workout.png",
      specs: [
        "Equipped with: 2 Preacher Curl Benches, 3 EZ-Bar racks, Dumbbells from 5 to 100 lbs",
        "Features: Padded arm support setups, heavy-duty frames",
        "Rules: Re-rack dumbbells in correct weight sequence after curls",
        "Peak Hours: 5:00 PM - 7:00 PM",
        "Target Muscles: Biceps Brachii, Brachialis, Brachioradialis"
      ]
    },
    {
      id: "triceps-station",
      name: "Triceps Workout Station",
      status: "Active & Available",
      category: "Triceps",
      image: "assets/images/triceps_workout.png",
      specs: [
        "Equipped with: 3 Cable crossover towers, overhead triceps machines, dip handles",
        "Features: Dual pulley pulleys, adjustable heights, attachment storage rack",
        "Rules: Return attachments (ropes, V-bars, straight bars) to storage rack",
        "Peak Hours: 4:30 PM - 7:30 PM",
        "Target Muscles: Triceps Brachii (Lateral, Long, and Medial Heads)"
      ]
    },
    {
      id: "shoulder-station",
      name: "Shoulder Workout Station",
      status: "Active & Available",
      category: "Shoulder",
      image: "assets/images/shoulder_workout.png",
      specs: [
        "Equipped with: 2 Seated Shoulder Press racks, 2 lateral raise stations, overhead press cage",
        "Features: Counterbalanced press arms, adjustable seat safety configurations",
        "Rules: Use a spotter when lifting heavy dumbbells overhead on incline benches",
        "Peak Hours: 5:00 PM - 8:00 PM",
        "Target Muscles: Anterior Deltoids, Lateral Deltoids, Posterior Deltoids, Trapezius"
      ]
    },
    {
      id: "legs-station",
      name: "Legs Workout Station",
      status: "Active & Available",
      category: "Legs",
      image: "assets/images/legs_workout.png",
      specs: [
        "Equipped with: 3 Squat Racks, 2 Leg Press machines, 2 Leg Extension/Curl benches",
        "Features: Angled linear sleds, heavy-duty footplates, safety locking pegs",
        "Rules: Lock squat bar hooks after loading. Remove plates after completing reps",
        "Peak Hours: 6:00 PM - 8:30 PM",
        "Target Muscles: Quadriceps, Gluteus Maximus, Hamstrings, Gastrocnemius (Calves)"
      ]
    }
  ]
};

// Ensure data directory exists
const dataDir = path.dirname(DATA_FILE);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Ensure database JSON file exists
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
}

// In-memory cache for rapid synchronous operations
let cachedData = null;

function loadLocalFileDB() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading JSON DB file:', err);
    return initialData;
  }
}

cachedData = loadLocalFileDB();

export function getDB() {
  if (!cachedData) {
    cachedData = loadLocalFileDB();
  }
  if (!cachedData.alerts) {
    cachedData.alerts = [];
  }
  return cachedData;
}

export function saveDB(data) {
  cachedData = data;

  // 1. Synchronously persist locally
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving to JSON DB file:', err);
  }

  // 2. Asynchronously sync to MongoDB Atlas if connected
  saveToMongoDB(data).catch((err) => {
    console.error('MongoDB Async Save Error:', err.message);
  });

  return true;
}

/**
 * Synchronize in-memory/file data state with MongoDB Atlas on server startup
 */
export async function syncWithMongoDB() {
  if (!isMongoConnected()) return;

  try {
    const existingDoc = await GymDataModel.findOne({ key: 'main_db' });

    if (existingDoc && existingDoc.data) {
      console.log('📦 HYDRATING APEX ATHLETICS DATABASE STATE FROM MONGODB ATLAS...');
      cachedData = existingDoc.data;
      // Reset legacy dummy attendance data in hydrated state
      cachedData.attendance = {
        isCheckedIn: false,
        checkInTime: null,
        streakDays: 0,
        attendanceRate: 0,
        activeDaysInMonth: [],
        sessions: []
      };
    } else {
      console.log('🌱 INITIALIZING BRAND NEW MONGODB ATLAS DATABASE COLLECTIONS...');
    }

    // Ensure the 3 trainers & default users are always present in the users list
    if (!cachedData.users) cachedData.users = [];
    const defaultUsers = [
      {
        userId: "ADM-SUPER",
        name: "System Admin",
        email: "admin@apex.com",
        password: "AdminPass123!",
        role: "admin",
        phone: "+1 (555) 999-0000",
        specialty: "Facility Operations & Analytics Director",
        credentials: "Apex Master Admin",
        certifications: "System Director",
        bio: "Master administrator overseeing member analytics, payment billing, equipment diagnostics, and master attendance.",
        membershipTier: "System Admin",
        status: "Active",
        joinedDate: "July 2026"
      },
      {
        userId: "TRN-SHRAVAN",
        name: "Coach Shravan",
        email: "trainer@apex.com",
        password: "TrainerPass123!",
        role: "trainer",
        phone: "+1 (555) 123-4567",
        specialty: "Functional Bodybuilding & Posture Alignment",
        credentials: "Certified Fitness Trainer, Posture Specialist",
        certifications: "Certified Fitness Trainer, Posture Specialist",
        bio: "Shravan is an elite strength coach and personal trainer specializing in functional bodybuilding, posture correction, and competition conditioning.",
        membershipTier: "Staff Trainer",
        status: "Active",
        joinedDate: "July 2026"
      },
      {
        userId: "TRN-KEERTHU",
        name: "Coach Keerthu",
        email: "keerthu@apex.com",
        password: "TrainerPass123!",
        role: "trainer",
        phone: "+91 98765 11111",
        specialty: "Barbell Biomechanics, Strength & Hypertrophy Master",
        credentials: "CSCS, Master of Sports Physiology",
        certifications: "CSCS, Master of Sports Physiology",
        bio: "Master strength coach specializing in periodized hypertrophy, powerlifting biomechanics, and elite athletic performance.",
        membershipTier: "Staff Trainer",
        status: "Active",
        joinedDate: "July 2026"
      },
      {
        userId: "TRN-VISHWAMBHARA",
        name: "Coach Vishwambhara",
        email: "vishwambhara@apex.com",
        password: "TrainerPass123!",
        role: "trainer",
        phone: "+91 98765 22222",
        specialty: "HIIT, Functional Endurance & Combat Conditioning",
        credentials: "NASM-CPT, Kettlebell & Functional Master",
        certifications: "NASM-CPT, Kettlebell & Functional Master",
        bio: "High-performance conditioning specialist focusing on athletic VO2 max, functional core strength, and mobility.",
        membershipTier: "Staff Trainer",
        status: "Active",
        joinedDate: "July 2026"
      },
      {
        userId: "MEM-90210",
        name: "Ethan Hunt",
        email: "member@apex.com",
        password: "MemberPass123!",
        role: "member",
        age: 32,
        phone: "+1 (555) 777-7777",
        specialty: null,
        credentials: null,
        certifications: null,
        bio: null,
        membershipTier: "Muscle Pro",
        status: "Active",
        joinedDate: "May 2026"
      }
    ];

    let hasUpdates = false;
    for (const defU of defaultUsers) {
      const exists = cachedData.users.some(u => u.email.toLowerCase() === defU.email.toLowerCase());
      if (!exists) {
        cachedData.users.push(defU);
        hasUpdates = true;
      }
    }

    // Ensure realistic TrainerData is seeded for all 3 trainers in MongoDB
    const trainersSeed = [
      {
        coachName: "Coach Shravan",
        credentials: "Certified Fitness Trainer, Posture Specialist",
        specialty: "Functional Bodybuilding & Posture Alignment",
        bio: "Shravan is an elite strength coach and personal trainer specializing in functional bodybuilding, posture correction, and competition conditioning.",
        bookings: [
          {
            id: "b-101",
            date: "July 24, 2026",
            time: "10:00 AM",
            status: "Confirmed",
            note: "Squat form check and peak week strategy"
          }
        ],
        chatHistory: [
          {
            id: "c-1",
            sender: "coach",
            text: "Hey Ethan! Welcome to your apex conditioning portal. Let me know if you need macro tweaks or routine adjustments.",
            time: "July 10, 09:00 AM"
          }
        ],
        members: [
          { id: "MEM-90210", name: "Ethan Hunt", email: "ethan@apex.com", tier: "Pro Member", status: "Active", joined: "May 2026", goal: "Hypertrophy & Strength" },
          { id: "MEM-80411", name: "Sarah Connor", email: "sarah@apex.com", tier: "Elite Member", status: "Active", joined: "June 2026", goal: "Conditioning & Endurance" }
        ],
        workoutPlans: [
          { id: "wp-1", name: "Hypertrophy Upper/Lower Split", target: "Muscle Mass", duration: "6 weeks", exercises: "Bench Press, Bent Rows, Overhead Press, Incline DB Press", clientsAssigned: 3, date: "Jul 15, 2026" }
        ],
        dietPlans: [
          { id: "dp-1", name: "High-Protein Bulking Plan", calories: "3,200 kcal", protein: "220g", carbs: "350g", fats: "85g", desc: "Optimal caloric surplus for lean muscle mass accretion.", clientsAssigned: 2 }
        ],
        agenda: [
          { id: "ag-1", client: "Ethan Hunt", routine: "Heavy Squats & Lower Body", timeBlock: "09:00 AM - 10:30 AM", status: "confirmed" }
        ],
        attendanceLogs: []
      },
      {
        coachName: "Coach Keerthu",
        credentials: "CSCS, Master of Sports Physiology",
        specialty: "Barbell Biomechanics, Strength & Hypertrophy Master",
        bio: "Master strength coach specializing in periodized hypertrophy, powerlifting biomechanics, and elite athletic performance.",
        bookings: [],
        chatHistory: [],
        members: [
          { id: "MEM-70312", name: "Marcus Wright", email: "marcus@apex.com", tier: "Core Member", status: "Active", joined: "July 2026", goal: "Fat Loss & Athleticism" }
        ],
        workoutPlans: [
          { id: "wp-2", name: "Powerlifting Peak Block", target: "Max Strength", duration: "4 weeks", exercises: "Barbell Squats, Deadlifts, Competition Bench, Deficit Pulls", clientsAssigned: 1, date: "Jul 18, 2026" }
        ],
        dietPlans: [
          { id: "dp-2", name: "Competition Cutting Macro Protocol", calories: "2,100 kcal", protein: "240g", carbs: "160g", fats: "55g", desc: "Aggressive fat loss with lean tissue preservation.", clientsAssigned: 1 }
        ],
        agenda: [
          { id: "ag-2", client: "Marcus Wright", routine: "Deadlift Form and Conditioning", timeBlock: "05:00 PM - 06:00 PM", status: "confirmed" }
        ],
        attendanceLogs: []
      },
      {
        coachName: "Coach Vishwambhara",
        credentials: "NASM-CPT, Kettlebell & Functional Master",
        specialty: "HIIT, Functional Endurance & Combat Conditioning",
        bio: "High-performance conditioning specialist focusing on athletic VO2 max, functional core strength, and mobility.",
        bookings: [],
        chatHistory: [],
        members: [
          { id: "MEM-10892", name: "Alex Mercer", email: "alex@apex.com", tier: "Pro Member", status: "Active", joined: "18 Apr 2024", goal: "Conditioning & Stamina" }
        ],
        workoutPlans: [
          { id: "wp-3", name: "High-Intensity Tactical Conditioning", target: "Fat Loss & Stamina", duration: "45 mins", exercises: "Kettlebell Swings, Burpees, Box Jumps", clientsAssigned: 1, date: "Jul 19, 2026" }
        ],
        dietPlans: [
          { id: "dp-3", name: "Lean Calorie Deficit Plan", calories: "1,800 kcal", protein: "180g", carbs: "130g", fats: "50g", desc: "Thermic calorie deficit diet focused on fat loss while preserving lean muscle mass.", clientsAssigned: 1 }
        ],
        agenda: [
          { id: "ag-3", client: "Alex Mercer", routine: "Tactical Cardio Sprints", timeBlock: "11:00 AM - 12:00 PM", status: "confirmed" }
        ],
        attendanceLogs: []
      }
    ];

    for (const coach of trainersSeed) {
      await TrainerData.findOneAndUpdate(
        { coachName: coach.coachName },
        coach,
        { upsert: true, returnDocument: 'after' }
      ).catch(() => {});
    }

    // Purge legacy dummy attendance records from MongoDB Atlas
    await Attendance.deleteMany({
      $or: [
        { memberName: 'Ethan Hunt' },
        { date: 'Jul 22, 2026' },
        { date: 'July 11, 2026' },
        { date: 'July 10, 2026' },
        { date: 'July 09, 2026' }
      ]
    }).catch(() => {});

    // Write back and save
    fs.writeFileSync(DATA_FILE, JSON.stringify(cachedData, null, 2), 'utf-8');
    await saveToMongoDB(cachedData);

    console.log('✅ DATABASE STATE FULLY SYNCHRONIZED AND SEEDED TO MONGODB ATLAS!');
  } catch (err) {
    console.error('⚠️ Error syncing with MongoDB Atlas:', err.message);
  }
}

/**
 * Persist changes to MongoDB Atlas collections
 */
export async function saveToMongoDB(data) {
  if (!isMongoConnected()) return;

  try {
    // 1. Update overall Master Document in MongoDB Atlas
    await GymDataModel.findOneAndUpdate(
      { key: 'main_db' },
      { data },
      { upsert: true, returnDocument: 'after' }
    );

    // 2. Update individual collection models in MongoDB Atlas for structured queries
    if (Array.isArray(data.users)) {
      for (const u of data.users) {
        await User.findOneAndUpdate(
          { email: u.email },
          u,
          { upsert: true, returnDocument: 'after' }
        ).catch(() => {});
      }
    }

    if (data.member) {
      await Member.findOneAndUpdate(
        { email: data.member.email },
        data.member,
        { upsert: true, returnDocument: 'after' }
      ).catch(() => {});
    }

    if (data.trainer) {
      await TrainerData.findOneAndUpdate(
        { coachName: data.trainer.coachName },
        data.trainer,
        { upsert: true, returnDocument: 'after' }
      ).catch(() => {});
    }

    if (Array.isArray(data.workouts)) {
      for (const w of data.workouts) {
        await Workout.findOneAndUpdate(
          { id: w.id },
          { ...w, memberName: data.member?.name || 'Ethan Hunt' },
          { upsert: true, returnDocument: 'after' }
        ).catch(() => {});
      }
    }

    if (data.supplements && Array.isArray(data.supplements.products)) {
      for (const p of data.supplements.products) {
        await Supplement.findOneAndUpdate(
          { id: p.id },
          p,
          { upsert: true, returnDocument: 'after' }
        ).catch(() => {});
      }
    }
  } catch (err) {
    console.error('Error persisting to MongoDB Atlas:', err.message);
  }
}
