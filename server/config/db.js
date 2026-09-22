import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import GymDataModel from '../models/GymData.js';
import User from '../models/User.js';
import Member from '../models/Member.js';
import Workout from '../models/Workout.js';
import { Supplement, SupplementOrder } from '../models/Supplement.js';
import TrainerData from '../models/TrainerData.js';
import Attendance from '../models/Attendance.js';
import MemberProgress from '../models/MemberProgress.js';
import ProgressPhoto from '../models/ProgressPhoto.js';
import Competition from '../models/Competition.js';
import CompetitionRegistration from '../models/CompetitionRegistration.js';
import CompetitionResult from '../models/CompetitionResult.js';
import Certificate from '../models/Certificate.js';
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
  if (!cachedData.memberProgress) cachedData.memberProgress = [];
  if (!cachedData.progressPhotos) cachedData.progressPhotos = [];
  if (!cachedData.competitions) cachedData.competitions = [];
  if (!cachedData.competitionRegistrations) cachedData.competitionRegistrations = [];
  if (!cachedData.competitionResults) cachedData.competitionResults = [];
  if (!cachedData.certificates) cachedData.certificates = [];
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

    // Only seed initial default users on brand new database setup
    if (!cachedData.users) cachedData.users = [];
    if (cachedData.users.length === 0) {
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
      cachedData.users = defaultUsers;
    } else {
      // Ensure at least one admin account exists so admin is never locked out
      const hasAdmin = cachedData.users.some(u => u.role === 'admin');
      if (!hasAdmin) {
        cachedData.users.unshift({
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
        });
      }
    }



    // Ensure initial competition data exists
    if (!cachedData.competitions || cachedData.competitions.length === 0) {
      cachedData.competitions = [
        {
          id: "COMP-2026-01",
          title: "Apex National Powerlifting Showdown 2026",
          description: "The premier national barbell showdown. Athletes compete across Squat, Bench Press, and Deadlift for the ultimate total and the Apex Heavyweight Gold Trophy.",
          bannerImage: "assets/images/gallery_weights.png",
          category: "Powerlifting",
          categories: [
            { id: "cat-1", name: "Men Open Heavyweight (90kg+)", description: "Elite open class powerlifting division", gender: "Male", maxWeightKg: 120, criteria: "Raw with wraps or sleeves" },
            { id: "cat-2", name: "Men Middleweight (Under 80kg)", description: "Competitive middleweight division", gender: "Male", maxWeightKg: 80, criteria: "Raw standard" },
            { id: "cat-3", name: "Women Open Powerlifting", description: "All weight classes women's combined Wilks score", gender: "Female", maxWeightKg: 85, criteria: "IPF standard" }
          ],
          schedule: [
            { time: "08:00 AM - 09:30 AM", event: "Athlete Weigh-in & Gear Inspection", stage: "Locker Hall A", description: "Official scale verification and equipment safety approval." },
            { time: "10:00 AM - 12:30 PM", event: "Flight A & B Barbell Squat Session", stage: "Main Stage Platform 1", description: "3 attempts per athlete under IPF depth rules." },
            { time: "01:30 PM - 03:30 PM", event: "Bench Press Maximum Exhibition", stage: "Main Stage Platform 1", description: "Pause on chest required before press command." },
            { time: "04:00 PM - 06:30 PM", event: "Deadlift Finals & Elimination", stage: "Center Arena Stage", description: "Final deadlift showdown determining total champion." },
            { time: "07:00 PM - 08:00 PM", event: "Podium Ceremony & Trophy Presentation", stage: "Apex Main Podium", description: "Medals, certificates, and ₹75,000 cash prize pool distributed." }
          ],
          rules: [
            "Athletes must wear compliant lifting singlet and approved powerlifting belt.",
            "Squat hip crease must clearly pass below the top of the knee surface.",
            "Bench press bar must come to a motionless pause on the chest before press command.",
            "Deadlift lockout requires knees and hips locked with shoulders erect (no hitching)."
          ],
          entryFee: 1500,
          startDate: "2026-10-15",
          endDate: "2026-10-16",
          registrationDeadline: "2026-10-10",
          venue: "Apex Athletics Grand Arena, Hall 1",
          maxParticipants: 60,
          status: "Active",
          prizePool: "₹75,000 Cash Pool + Gold Cup",
          allowMemberRegistration: true,
          allowTrainerRegistration: true,
          createdAt: new Date().toISOString()
        },
        {
          id: "COMP-2026-02",
          title: "Apex All-Star Physique & Fitness Championship 2026",
          description: "A celebration of aesthetics, symmetry, and peak muscular definition. Features Men's Classic Physique and Women's Bikini Fitness divisions.",
          bannerImage: "assets/images/gallery_cardio.png",
          category: "Bodybuilding & Physique",
          categories: [
            { id: "cat-4", name: "Men's Classic Physique", description: "Focus on classical proportions, vacuum poses, and aesthetic balance", gender: "Male", maxWeightKg: 95, criteria: "Mandatory classic poses" },
            { id: "cat-5", name: "Women's Bikini Fitness", description: "Overall muscle tone, stage presentation, and poise", gender: "Female", maxWeightKg: 65, criteria: "Quarter turns and posing" },
            { id: "cat-6", name: "Men's Athletic Boardshort", description: "Beach body conditioning and athletic muscularity", gender: "Male", maxWeightKg: 85, criteria: "Front and back turns" }
          ],
          schedule: [
            { time: "09:00 AM - 10:30 AM", event: "Athlete Registration & Tanning Check", stage: "Backstage Area", description: "Stage lighting check and tan application." },
            { time: "11:00 AM - 02:00 PM", event: "Symmetry Rounds & Quarter Turns", stage: "Main Stage Light Deck", description: "Judges comparison callouts and symmetry scoring." },
            { time: "03:30 PM - 05:30 PM", event: "60-Second Individual Choreographed Routines", stage: "Main Stage Light Deck", description: "Individual athletic posing to athlete music." },
            { time: "06:30 PM - 07:30 PM", event: "Final Awards & Pro Card Induction", stage: "Apex Main Podium", description: "Overalls winner awarded official Apex National Pro Card." }
          ],
          rules: [
            "NPC / IFBB compliant posing attire required for respective divisions.",
            "Tanning products must not smudge or soil facility mats.",
            "Individual posing routines strictly limited to 60 seconds."
          ],
          entryFee: 2000,
          startDate: "2026-11-20",
          endDate: "2026-11-21",
          registrationDeadline: "2026-11-15",
          venue: "Apex Grand Auditorium",
          maxParticipants: 80,
          status: "Upcoming",
          prizePool: "₹1,00,000 + National Pro Card",
          allowMemberRegistration: true,
          allowTrainerRegistration: true,
          createdAt: new Date().toISOString()
        },
        {
          id: "COMP-2026-03",
          title: "Apex Functional Endurance Gauntlet",
          description: "The ultimate test of VO2 Max, functional stamina, sprint power, and high-intensity metabolic conditioning.",
          bannerImage: "assets/images/gallery_yoga.png",
          category: "Functional Fitness",
          categories: [
            { id: "cat-7", name: "Individual RX Men", description: "Standard elite weights and high-skill gymnastics", gender: "Male", maxWeightKg: 90, criteria: "Unscaled standard" },
            { id: "cat-8", name: "Individual RX Women", description: "Standard elite weights for female athletes", gender: "Female", maxWeightKg: 75, criteria: "Unscaled standard" },
            { id: "cat-9", name: "Mixed Duo Team Challenge", description: "1 Male + 1 Female teammate functional team relay", gender: "All", maxWeightKg: null, criteria: "Team relay" }
          ],
          schedule: [
            { time: "07:00 AM - 08:00 AM", event: "Workout Briefing & Standards Review", stage: "Outdoor Turf Arena", description: "Movement standard demonstrations." },
            { time: "08:30 AM - 11:30 AM", event: "Workout 1: 5K Row + 100 Burpee Box Jumps", stage: "Outdoor Turf Arena", description: "Aerobic endurance test." },
            { time: "01:00 PM - 03:00 PM", event: "Workout 2: Thruster & Muscle-Up Ladder", stage: "Rig Station 4", description: "Heavy barbell and gymnastic capacity." },
            { time: "04:30 PM - 06:00 PM", event: "The Eliminator Obstacle Final", stage: "Apex Spartan Track", description: "Top 5 finalists race for the crown." },
            { time: "06:30 PM - 07:15 PM", event: "Awarding Ceremony & Spartan Shield", stage: "Apex Main Podium", description: "Shield presentation to overall champions." }
          ],
          rules: [
            "All reps must achieve full standard extension to count towards score.",
            "Judges hold final authority on rep validity and time stops."
          ],
          entryFee: 0,
          startDate: "2026-08-10",
          endDate: "2026-08-11",
          registrationDeadline: "2026-08-05",
          venue: "Apex Spartan Outdoor Turf",
          maxParticipants: 50,
          status: "Completed",
          prizePool: "₹50,000 + Apex Spartan Shield",
          allowMemberRegistration: true,
          allowTrainerRegistration: true,
          createdAt: new Date().toISOString()
        }
      ];
    }

    // Seed registrations
    if (!cachedData.competitionRegistrations || cachedData.competitionRegistrations.length === 0) {
      cachedData.competitionRegistrations = [
        {
          id: "REG-101",
          competitionId: "COMP-2026-01",
          competitionTitle: "Apex National Powerlifting Showdown 2026",
          participantId: "MEM-90210",
          participantName: "Ethan Hunt",
          participantEmail: "member@apex.com",
          participantPhone: "+1 (555) 777-7777",
          role: "member",
          category: "Men Open Heavyweight (90kg+)",
          division: "Raw Open",
          bibNumber: "APX-101",
          registrationDate: "2026-09-01",
          status: "Confirmed",
          paymentStatus: "Paid",
          paymentId: "pay_comp_101",
          score: null,
          notes: "Focusing on 600kg total target.",
          createdAt: new Date().toISOString()
        },
        {
          id: "REG-102",
          competitionId: "COMP-2026-03",
          competitionTitle: "Apex Functional Endurance Gauntlet",
          participantId: "MEM-90210",
          participantName: "Ethan Hunt",
          participantEmail: "member@apex.com",
          participantPhone: "+1 (555) 777-7777",
          role: "member",
          category: "Individual RX Men",
          division: "RX Pro",
          bibNumber: "APX-088",
          registrationDate: "2026-08-01",
          status: "Attended",
          paymentStatus: "Free",
          paymentId: null,
          score: "18 mins 24 secs (1st Place)",
          notes: "Completed all 3 gauntlet rounds.",
          createdAt: new Date().toISOString()
        },
        {
          id: "REG-103",
          competitionId: "COMP-2026-03",
          competitionTitle: "Apex Functional Endurance Gauntlet",
          participantId: "TRN-SHRAVAN",
          participantName: "Coach Shravan",
          participantEmail: "trainer@apex.com",
          participantPhone: "+1 (555) 123-4567",
          role: "trainer",
          category: "Individual RX Men",
          division: "Coach Masters",
          bibNumber: "APX-007",
          registrationDate: "2026-08-02",
          status: "Attended",
          paymentStatus: "Free",
          paymentId: null,
          score: "19 mins 10 secs (2nd Place)",
          notes: "Coach division exhibition run.",
          createdAt: new Date().toISOString()
        }
      ];
    }

    // Seed competition results
    if (!cachedData.competitionResults || cachedData.competitionResults.length === 0) {
      cachedData.competitionResults = [
        {
          id: "RES-COMP-2026-03",
          competitionId: "COMP-2026-03",
          competitionTitle: "Apex Functional Endurance Gauntlet",
          published: true,
          publishedDate: "2026-08-12",
          summary: "Official verified tournament final standings for the 2026 Endurance Gauntlet.",
          winners: [
            {
              rank: 1,
              awardTitle: "Gold Champion 🥇",
              participantId: "MEM-90210",
              participantName: "Ethan Hunt",
              participantEmail: "member@apex.com",
              category: "Individual RX Men",
              bibNumber: "APX-088",
              score: "18m 24s Final Split",
              photo: "assets/images/gallery_weights.png"
            },
            {
              rank: 2,
              awardTitle: "Silver Runner Up 🥈",
              participantId: "TRN-SHRAVAN",
              participantName: "Coach Shravan",
              participantEmail: "trainer@apex.com",
              category: "Individual RX Men",
              bibNumber: "APX-007",
              score: "19m 10s Final Split",
              photo: "assets/images/gallery_cardio.png"
            },
            {
              rank: 3,
              awardTitle: "Bronze 3rd Place 🥉",
              participantId: "MEM-70312",
              participantName: "Marcus Wright",
              participantEmail: "marcus@apex.com",
              category: "Individual RX Men",
              bibNumber: "APX-045",
              score: "20m 05s Final Split",
              photo: "assets/images/gallery_yoga.png"
            }
          ],
          createdAt: new Date().toISOString()
        }
      ];
    }

    // Seed certificates
    if (!cachedData.certificates || cachedData.certificates.length === 0) {
      cachedData.certificates = [
        {
          id: "CERT-APX-2026-001",
          competitionId: "COMP-2026-03",
          competitionTitle: "Apex Functional Endurance Gauntlet",
          participantId: "MEM-90210",
          participantName: "Ethan Hunt",
          participantEmail: "member@apex.com",
          participantRole: "member",
          category: "Individual RX Men",
          type: "Winner",
          rank: 1,
          awardTitle: "Gold Champion 🥇 - 1st Place",
          issueDate: "August 12, 2026",
          verificationCode: "APX-VER-8890210-GOLD",
          issuedBy: "Apex Athletics Tournament Committee",
          directorSignature: "Apex Master Director",
          createdAt: new Date().toISOString()
        },
        {
          id: "CERT-APX-2026-002",
          competitionId: "COMP-2026-03",
          competitionTitle: "Apex Functional Endurance Gauntlet",
          participantId: "TRN-SHRAVAN",
          participantName: "Coach Shravan",
          participantEmail: "trainer@apex.com",
          participantRole: "trainer",
          category: "Individual RX Men",
          type: "RunnerUp",
          rank: 2,
          awardTitle: "Silver Runner Up 🥈 - 2nd Place",
          issueDate: "August 12, 2026",
          verificationCode: "APX-VER-7712345-SILV",
          issuedBy: "Apex Athletics Tournament Committee",
          directorSignature: "Apex Master Director",
          createdAt: new Date().toISOString()
        }
      ];
    }

    // Seed realistic Member Progress records spanning 12 months for Ethan Hunt
    if (!cachedData.memberProgress || cachedData.memberProgress.length === 0) {
      cachedData.memberProgress = [
        {
          id: "PROG-101",
          memberId: "MEM-90210",
          memberName: "Ethan Hunt",
          memberEmail: "member@apex.com",
          trainerId: "TRN-SHRAVAN",
          trainerName: "Coach Shravan",
          trainerEmail: "trainer@apex.com",
          date: "2026-09-21",
          workoutTitle: "Heavy Barbell Squat & Posterior Chain Hypertrophy",
          category: "Strength Training",
          targetWorkouts: 5,
          completedWorkouts: 5,
          durationMinutes: 75,
          caloriesBurned: 620,
          intensity: "Extreme",
          exercises: [
            { name: "Barbell Back Squat", sets: 4, reps: 6, weight: "315 lbs", completed: true },
            { name: "Romanian Deadlift", sets: 3, reps: 8, weight: "275 lbs", completed: true },
            { name: "Bulgarian Split Squat", sets: 3, reps: 10, weight: "60 lbs DBs", completed: true },
            { name: "Standing Calf Raises", sets: 4, reps: 15, weight: "200 lbs", completed: true },
            { name: "Hanging Leg Raises", sets: 3, reps: 15, weight: "Bodyweight", completed: true }
          ],
          workoutPhoto: "assets/images/legs_workout.png",
          notes: "Hit 315 lbs for all 4 sets with great depth! Knees felt completely healthy. Ready for next week's progressive overload jump.",
          trainerFeedback: {
            comment: "Outstanding form Ethan! Depth was well below parallel and hip drive was explosive. Keep this intensity for peak week.",
            rating: 5,
            feedbackDate: "2026-09-21",
            trainerName: "Coach Shravan"
          },
          createdAt: new Date("2026-09-21T10:30:00Z")
        },
        {
          id: "PROG-102",
          memberId: "MEM-90210",
          memberName: "Ethan Hunt",
          memberEmail: "member@apex.com",
          trainerId: "TRN-SHRAVAN",
          trainerName: "Coach Shravan",
          trainerEmail: "trainer@apex.com",
          date: "2026-09-19",
          workoutTitle: "Chest Hypertrophy & Triceps Mass",
          category: "Hypertrophy",
          targetWorkouts: 5,
          completedWorkouts: 5,
          durationMinutes: 65,
          caloriesBurned: 540,
          intensity: "High",
          exercises: [
            { name: "Incline Barbell Bench Press", sets: 4, reps: 8, weight: "225 lbs", completed: true },
            { name: "Flat Dumbbell Press", sets: 4, reps: 10, weight: "85 lbs DBs", completed: true },
            { name: "Cable Crossovers", sets: 3, reps: 12, weight: "40 lbs", completed: true },
            { name: "Dips (Weighted)", sets: 3, reps: 10, weight: "+45 lbs", completed: true },
            { name: "Overhead Rope Triceps Extension", sets: 3, reps: 12, weight: "65 lbs", completed: true }
          ],
          workoutPhoto: "assets/images/chest_workout.png",
          notes: "Pump was crazy today. Incline bench felt solid with 2-second pause at chest.",
          trainerFeedback: {
            comment: "Solid chest workout! Controlled eccentrics are clearly paying off in upper chest density.",
            rating: 5,
            feedbackDate: "2026-09-19",
            trainerName: "Coach Shravan"
          },
          createdAt: new Date("2026-09-19T11:00:00Z")
        },
        {
          id: "PROG-103",
          memberId: "MEM-90210",
          memberName: "Ethan Hunt",
          memberEmail: "member@apex.com",
          trainerId: "TRN-SHRAVAN",
          trainerName: "Coach Shravan",
          trainerEmail: "trainer@apex.com",
          date: "2026-09-16",
          workoutTitle: "Back Thickness & Lat Pulldown Ladder",
          category: "Strength Training",
          targetWorkouts: 6,
          completedWorkouts: 6,
          durationMinutes: 70,
          caloriesBurned: 580,
          intensity: "High",
          exercises: [
            { name: "Barbell Deadlift", sets: 4, reps: 5, weight: "405 lbs", completed: true },
            { name: "Chest Supported T-Bar Row", sets: 4, reps: 8, weight: "180 lbs", completed: true },
            { name: "Wide Grip Lat Pulldown", sets: 3, reps: 10, weight: "190 lbs", completed: true },
            { name: "Seated Cable Row", sets: 3, reps: 12, weight: "170 lbs", completed: true },
            { name: "Incline DB Biceps Curl", sets: 3, reps: 12, weight: "35 lbs DBs", completed: true },
            { name: "Hammer Curls", sets: 3, reps: 12, weight: "40 lbs DBs", completed: true }
          ],
          workoutPhoto: "assets/images/back_workout.png",
          notes: "Deadlifts moved fast today. Kept spine neutral and lats engaged throughout.",
          trainerFeedback: {
            comment: "405 lbs for reps clean! You're ready to test 455 lbs next month.",
            rating: 5,
            feedbackDate: "2026-09-16",
            trainerName: "Coach Shravan"
          },
          createdAt: new Date("2026-09-16T17:00:00Z")
        },
        {
          id: "PROG-104",
          memberId: "MEM-90210",
          memberName: "Ethan Hunt",
          memberEmail: "member@apex.com",
          trainerId: "TRN-SHRAVAN",
          trainerName: "Coach Shravan",
          trainerEmail: "trainer@apex.com",
          date: "2026-08-25",
          workoutTitle: "Deltoid Cap Builder & Overhead Press",
          category: "Hypertrophy",
          targetWorkouts: 5,
          completedWorkouts: 5,
          durationMinutes: 60,
          caloriesBurned: 490,
          intensity: "High",
          exercises: [
            { name: "Overhead Military Press", sets: 4, reps: 6, weight: "155 lbs", completed: true },
            { name: "Dumbbell Lateral Raise", sets: 4, reps: 15, weight: "30 lbs DBs", completed: true },
            { name: "Rear Delt Reverse Pec Deck", sets: 4, reps: 15, weight: "120 lbs", completed: true },
            { name: "Cable Front Raise", sets: 3, reps: 12, weight: "30 lbs", completed: true },
            { name: "Barbell Shrugs", sets: 4, reps: 12, weight: "275 lbs", completed: true }
          ],
          workoutPhoto: "assets/images/shoulder_workout.png",
          notes: "Shoulders feeling fully capped and stable. Strict military press felt very smooth.",
          trainerFeedback: {
            comment: "Great lateral delt work! Overhead lockout was crisp.",
            rating: 5,
            feedbackDate: "2026-08-25",
            trainerName: "Coach Shravan"
          },
          createdAt: new Date("2026-08-25T16:30:00Z")
        },
        {
          id: "PROG-105",
          memberId: "MEM-90210",
          memberName: "Ethan Hunt",
          memberEmail: "member@apex.com",
          trainerId: "TRN-SHRAVAN",
          trainerName: "Coach Shravan",
          trainerEmail: "trainer@apex.com",
          date: "2026-07-18",
          workoutTitle: "Arm Day Hypertrophy & Forearm Circuit",
          category: "Hypertrophy",
          targetWorkouts: 6,
          completedWorkouts: 6,
          durationMinutes: 55,
          caloriesBurned: 440,
          intensity: "Moderate",
          exercises: [
            { name: "Preacher Curl EZ-Bar", sets: 4, reps: 10, weight: "85 lbs", completed: true },
            { name: "Skull Crushers", sets: 4, reps: 10, weight: "95 lbs", completed: true },
            { name: "Spider Curls", sets: 3, reps: 12, weight: "30 lbs DBs", completed: true },
            { name: "Close Grip Bench Press", sets: 3, reps: 8, weight: "185 lbs", completed: true },
            { name: "Cable Wrist Curls", sets: 3, reps: 20, weight: "50 lbs", completed: true }
          ],
          workoutPhoto: "assets/images/biceps_workout.png",
          notes: "Solid arm isolation session. Hit a nice peak contraction on every rep.",
          trainerFeedback: {
            comment: "Excellent arm vascularity and control. Keep up the high volume work!",
            rating: 5,
            feedbackDate: "2026-07-18",
            trainerName: "Coach Shravan"
          },
          createdAt: new Date("2026-07-18T14:00:00Z")
        },
        {
          id: "PROG-106",
          memberId: "MEM-90210",
          memberName: "Ethan Hunt",
          memberEmail: "member@apex.com",
          trainerId: "TRN-SHRAVAN",
          trainerName: "Coach Shravan",
          trainerEmail: "trainer@apex.com",
          date: "2026-05-10",
          workoutTitle: "High-Intensity Functional Circuit & Sprints",
          category: "HIIT",
          targetWorkouts: 5,
          completedWorkouts: 5,
          durationMinutes: 50,
          caloriesBurned: 600,
          intensity: "Extreme",
          exercises: [
            { name: "Kettlebell Swings", sets: 5, reps: 20, weight: "32 kg", completed: true },
            { name: "Burpee Box Jump Overs", sets: 5, reps: 15, weight: "24 inch box", completed: true },
            { name: "Assault AirBike Sprints", sets: 5, reps: 60, weight: "Max Effort (secs)", completed: true },
            { name: "Battle Ropes Waves", sets: 4, reps: 45, weight: "High Velocity (secs)", completed: true }
          ],
          workoutPhoto: "assets/images/gallery_weights.png",
          notes: "Max heart rate session. VO2 max test felt strong.",
          trainerFeedback: {
            comment: "Unreal aerobic engine Ethan. Conditioning is world class.",
            rating: 5,
            feedbackDate: "2026-05-10",
            trainerName: "Coach Shravan"
          },
          createdAt: new Date("2026-05-10T09:00:00Z")
        }
      ];
    }

    // Seed realistic Weekly Progress Photos for Ethan Hunt (Front, Side, Back, Before vs Current)
    if (!cachedData.progressPhotos || cachedData.progressPhotos.length === 0) {
      cachedData.progressPhotos = [
        {
          id: "PHOTO-WEEK-1",
          memberId: "MEM-90210",
          memberEmail: "member@apex.com",
          memberName: "Ethan Hunt",
          date: "2026-05-01",
          weekNumber: "Week 1",
          isBefore: true,
          isCurrent: false,
          frontPhoto: "assets/images/chest_workout.png",
          sidePhoto: "assets/images/shoulder_workout.png",
          backPhoto: "assets/images/back_workout.png",
          bodyWeight: 195,
          weightUnit: "lbs",
          bodyFatPercentage: 22.5,
          measurements: {
            chest: "41.5 in",
            waist: "36.0 in",
            arms: "15.0 in",
            thighs: "23.5 in"
          },
          notes: "Initial baseline Day 1 before transformation photo. Goal: cut body fat to 12% while maintaining strength.",
          createdAt: new Date("2026-05-01T08:00:00Z")
        },
        {
          id: "PHOTO-WEEK-8",
          memberId: "MEM-90210",
          memberEmail: "member@apex.com",
          memberName: "Ethan Hunt",
          date: "2026-07-01",
          weekNumber: "Week 8",
          isBefore: false,
          isCurrent: false,
          frontPhoto: "assets/images/gallery_weights.png",
          sidePhoto: "assets/images/triceps_workout.png",
          backPhoto: "assets/images/back_workout.png",
          bodyWeight: 184,
          weightUnit: "lbs",
          bodyFatPercentage: 17.2,
          measurements: {
            chest: "42.0 in",
            waist: "33.5 in",
            arms: "15.5 in",
            thighs: "24.0 in"
          },
          notes: "Mid-cycle check in. Down 11 lbs with visible upper ab definition and improved lat width.",
          createdAt: new Date("2026-07-01T08:00:00Z")
        },
        {
          id: "PHOTO-WEEK-16",
          memberId: "MEM-90210",
          memberEmail: "member@apex.com",
          memberName: "Ethan Hunt",
          date: "2026-09-20",
          weekNumber: "Week 16",
          isBefore: false,
          isCurrent: true,
          frontPhoto: "assets/images/biceps_workout.png",
          sidePhoto: "assets/images/legs_workout.png",
          backPhoto: "assets/images/gallery_cardio.png",
          bodyWeight: 175,
          weightUnit: "lbs",
          bodyFatPercentage: 12.0,
          measurements: {
            chest: "43.5 in",
            waist: "31.0 in",
            arms: "16.2 in",
            thighs: "24.8 in"
          },
          notes: "Current status: Peak conditioning achieved! Down 20 lbs pure fat, waist down 5 inches, arms up 1.2 inches. Competition ready.",
          createdAt: new Date("2026-09-20T08:00:00Z")
        }
      ];
    }

    // Seed realistic Gym Pickup orders for Ethan Hunt (member@apex.com)
    if (!cachedData.supplements) cachedData.supplements = {};
    if (!cachedData.supplements.orders || cachedData.supplements.orders.length === 0) {
      cachedData.supplements.orders = [
        {
          orderId: "ORD-APX-8801",
          txId: "TX-9201",
          receiptNumber: "MH-RCP-2026-8801",
          userEmail: "member@apex.com",
          userName: "Ethan Hunt",
          userPhone: "+1 (555) 777-7777",
          items: [
            {
              id: "muscleblaze-biozyme",
              name: "MuscleBlaze Biozyme Performance Whey",
              price: 2799,
              quantity: 1,
              image: "assets/images/muscleblaze_whey.png",
              category: "protein"
            },
            {
              id: "wellcore-creatine",
              name: "Wellcore Pure Micronized Creatine Powder",
              price: 1299,
              quantity: 1,
              image: "assets/images/wellcore_creatine.png",
              category: "strength"
            }
          ],
          itemsSummary: "1x MuscleBlaze Biozyme Performance Whey, 1x Wellcore Pure Micronized Creatine Powder",
          subtotal: 4098,
          memberDiscount: 409.8,
          promoDiscount: 0,
          shippingFee: 0,
          total: 3688.2,
          totalAmount: 3688.2,
          deliveryType: "gym_pickup",
          pickupLocation: "Apex Athletics Front Desk & Nutrition Bar",
          pickupDesk: "Reception Desk - Counter 1",
          pickupTimePreference: "Today Evening Workout",
          pickupNotes: "Please keep in front desk pickup shelf #4.",
          readyForPickupAt: "Sep 22, 2026, 04:30 PM",
          collectedAt: "",
          collectedByAdmin: "",
          shippingInfo: {
            fullName: "Ethan Hunt",
            phone: "+1 (555) 777-7777",
            address: "Apex Athletics Front Desk & Nutrition Bar",
            city: "Bangalore",
            state: "Karnataka",
            pincode: "560001",
            deliveryType: "gym_pickup"
          },
          paymentMethod: "Online Payment (Razorpay)",
          paymentStatus: "Paid",
          courierName: "Gym Desk Collection",
          trackingNumber: "PICKUP-ORD-APX-8801",
          estimatedDelivery: "Ready for Collection at Desk",
          status: "Ready for Pickup",
          statusTimeline: [
            {
              status: "Pending Confirmation",
              timestamp: "Sep 22, 2026, 02:15 PM",
              note: "Payment received & verified via Razorpay. Order placed for Gym Pickup at Apex Athletics Front Desk."
            },
            {
              status: "Preparing Order",
              timestamp: "Sep 22, 2026, 03:00 PM",
              note: "Gym staff assembled and checked products from store inventory."
            },
            {
              status: "Ready for Pickup",
              timestamp: "Sep 22, 2026, 04:30 PM",
              note: "Your order has been assembled and is READY FOR PICKUP at the Gym Desk (Reception Desk - Counter 1)! Please collect during gym hours (6 AM - 10 PM)."
            }
          ],
          date: "Sep 22, 2026, 02:15 PM"
        },
        {
          orderId: "ORD-APX-8802",
          txId: "TX-9202",
          receiptNumber: "MH-RCP-DESK-8802",
          userEmail: "member@apex.com",
          userName: "Ethan Hunt",
          userPhone: "+1 (555) 777-7777",
          items: [
            {
              id: "pre-ignite",
              name: "Apex Pre-Workout Ignite",
              price: 1699,
              quantity: 1,
              image: "assets/images/pre_workout.png",
              category: "energy"
            }
          ],
          itemsSummary: "1x Apex Pre-Workout Ignite",
          subtotal: 1699,
          memberDiscount: 169.9,
          promoDiscount: 0,
          shippingFee: 0,
          total: 1529.1,
          totalAmount: 1529.1,
          deliveryType: "gym_pickup",
          pickupLocation: "Apex Athletics Front Desk & Nutrition Bar",
          pickupDesk: "Reception Desk - Counter 1",
          pickupTimePreference: "Tomorrow Morning",
          pickupNotes: "Will pay via UPI at desk upon collection.",
          readyForPickupAt: "",
          collectedAt: "",
          collectedByAdmin: "",
          shippingInfo: {
            fullName: "Ethan Hunt",
            phone: "+1 (555) 777-7777",
            address: "Apex Athletics Front Desk & Nutrition Bar",
            city: "Bangalore",
            state: "Karnataka",
            pincode: "560001",
            deliveryType: "gym_pickup"
          },
          paymentMethod: "Pay at Gym Desk (Cash/Card/UPI)",
          paymentStatus: "Pending (Pay at Gym Desk)",
          courierName: "Gym Desk Collection",
          trackingNumber: "PICKUP-ORD-APX-8802",
          estimatedDelivery: "Ready for Collection within 2-4 Hours",
          status: "Preparing Order",
          statusTimeline: [
            {
              status: "Pending Confirmation",
              timestamp: "Sep 22, 2026, 05:00 PM",
              note: "Order placed for Gym Pickup. Payment of ₹1,529.10 due upon collection at Gym Reception Desk."
            },
            {
              status: "Preparing Order",
              timestamp: "Sep 22, 2026, 05:30 PM",
              note: "Gym staff is assembling and packaging your supplement products at the inventory store."
            }
          ],
          date: "Sep 22, 2026, 05:00 PM"
        },
        {
          orderId: "ORD-APX-8750",
          txId: "TX-9150",
          receiptNumber: "MH-RCP-2026-8750",
          userEmail: "member@apex.com",
          userName: "Ethan Hunt",
          userPhone: "+1 (555) 777-7777",
          items: [
            {
              id: "multivitamin",
              name: "Apex Sports Multivitamin",
              price: 799,
              quantity: 2,
              image: "assets/images/gallery_yoga.png",
              category: "strength"
            }
          ],
          itemsSummary: "2x Apex Sports Multivitamin",
          subtotal: 1598,
          memberDiscount: 159.8,
          promoDiscount: 0,
          shippingFee: 0,
          total: 1438.2,
          totalAmount: 1438.2,
          deliveryType: "gym_pickup",
          pickupLocation: "Apex Athletics Front Desk & Nutrition Bar",
          pickupDesk: "Reception Desk - Counter 1",
          pickupTimePreference: "Past Visit",
          pickupNotes: "Collected at morning session.",
          readyForPickupAt: "Sep 15, 2026, 11:00 AM",
          collectedAt: "Sep 15, 2026, 01:20 PM",
          collectedByAdmin: "System Admin",
          shippingInfo: {
            fullName: "Ethan Hunt",
            phone: "+1 (555) 777-7777",
            address: "Apex Athletics Front Desk & Nutrition Bar",
            city: "Bangalore",
            state: "Karnataka",
            pincode: "560001",
            deliveryType: "gym_pickup"
          },
          paymentMethod: "Online Payment (Razorpay)",
          paymentStatus: "Paid",
          courierName: "Gym Desk Collection",
          trackingNumber: "PICKUP-ORD-APX-8750",
          estimatedDelivery: "Collected",
          status: "Collected",
          statusTimeline: [
            {
              status: "Pending Confirmation",
              timestamp: "Sep 15, 2026, 10:00 AM",
              note: "Payment received & verified via Razorpay. Order placed for Gym Pickup."
            },
            {
              status: "Ready for Pickup",
              timestamp: "Sep 15, 2026, 11:00 AM",
              note: "Order ready at Front Desk Counter 1."
            },
            {
              status: "Collected",
              timestamp: "Sep 15, 2026, 01:20 PM",
              note: "Order handed over to member at the Gym Desk. Collection completed."
            }
          ],
          date: "Sep 15, 2026, 10:00 AM"
        }
      ];
    }

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

    if (data.supplements && Array.isArray(data.supplements.orders)) {
      for (const ord of data.supplements.orders) {
        await SupplementOrder.findOneAndUpdate(
          { orderId: ord.orderId },
          ord,
          { upsert: true, returnDocument: 'after' }
        ).catch(() => {});
      }
    }

    if (Array.isArray(data.memberProgress)) {
      for (const prog of data.memberProgress) {
        await MemberProgress.findOneAndUpdate(
          { id: prog.id },
          prog,
          { upsert: true, returnDocument: 'after' }
        ).catch(() => {});
      }
    }

    if (Array.isArray(data.progressPhotos)) {
      for (const photo of data.progressPhotos) {
        await ProgressPhoto.findOneAndUpdate(
          { id: photo.id },
          photo,
          { upsert: true, returnDocument: 'after' }
        ).catch(() => {});
      }
    }

    if (Array.isArray(data.competitions)) {
      for (const comp of data.competitions) {
        await Competition.findOneAndUpdate(
          { id: comp.id },
          comp,
          { upsert: true, returnDocument: 'after' }
        ).catch(() => {});
      }
    }

    if (Array.isArray(data.competitionRegistrations)) {
      for (const reg of data.competitionRegistrations) {
        await CompetitionRegistration.findOneAndUpdate(
          { id: reg.id },
          reg,
          { upsert: true, returnDocument: 'after' }
        ).catch(() => {});
      }
    }

    if (Array.isArray(data.competitionResults)) {
      for (const resDoc of data.competitionResults) {
        await CompetitionResult.findOneAndUpdate(
          { id: resDoc.id },
          resDoc,
          { upsert: true, returnDocument: 'after' }
        ).catch(() => {});
      }
    }

    if (Array.isArray(data.certificates)) {
      for (const cert of data.certificates) {
        await Certificate.findOneAndUpdate(
          { id: cert.id },
          cert,
          { upsert: true, returnDocument: 'after' }
        ).catch(() => {});
      }
    }
  } catch (err) {
    console.error('Error persisting to MongoDB Atlas:', err.message);
  }
}
