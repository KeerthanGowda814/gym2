import { useState, useEffect, useRef } from 'react';
import { memberApi } from '../services/memberApi';
import { trainerApi } from '../services/trainerApi';
import { CustomSwal } from '../utils/swal';

export default function TrainerPanel({ activeView, currentUser }) {
  const validTabs = ['overview', 'members', 'workouts', 'diets', 'schedule', 'attendance'];

  const getInitialTab = (view) => {
    if (!view || view === 'home' || view === 'trainer' || view === 'overview' || !validTabs.includes(view)) {
      return 'overview';
    }
    return view;
  };

  const [selectedTab, setSelectedTab] = useState(() => getInitialTab(activeView));

  useEffect(() => {
    if (activeView) {
      setSelectedTab(getInitialTab(activeView));
    }
  }, [activeView]);

  const currentTab = selectedTab;

  // Broadcast alerts states
  const [broadcastAlerts, setBroadcastAlerts] = useState([]);
  const [dismissedAlerts, setDismissedAlerts] = useState(() => {
    return JSON.parse(localStorage.getItem('dismissed_trainer_alerts') || '[]');
  });

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const data = await memberApi.getAlerts();
        if (data) {
          setBroadcastAlerts(data);
        } else {
          const localAlerts = JSON.parse(localStorage.getItem('apex_broadcast_alerts') || '[]');
          setBroadcastAlerts(localAlerts);
        }
      } catch (err) {
        console.warn("Error fetching alerts in TrainerPanel:", err);
      }
    };
    fetchAlerts();
  }, []);

  // --- STATE INITIALIZATION WITH LOCALSTORAGE PERSISTENCE ---

  const defaultMembers = [
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

  const defaultWorkouts = [
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

  const defaultDiets = [
    {
      id: 'dp-preset-1',
      name: 'Mass Gainer Bulking Protocol',
      calories: '3200 kcal',
      protein: 200,
      carbs: 380,
      fats: 90,
      desc: 'High-caloric hypertrophy diet to maximize muscle mass and strength gains.',
      goalCategory: 'Weight Gain',
      mealsSchedule: {
        morning: ['Rolled Oats with Cinnamon (80g)', 'Natural Peanut Butter (2 tbsp)', 'Fresh Ripe Bananas (2)'],
        lunch: ['Grilled Chicken Breast (200g)', 'Steamed Brown Rice (1.5 cups)', 'Fresh Sliced Avocado (1/2)'],
        preWorkout: ['Pre-Workout Energy Smoothie (400ml)', 'Whole Grain Rice Cakes (4)'],
        postWorkout: ['Post-Workout Anabolic Shake (500ml)', 'Rice Krispies & Protein Powder'],
        night: ['Baked Salmon Fillet (180g)', 'Micellar Casein Protein Pudding']
      }
    },
    {
      id: 'dp-preset-2',
      name: 'Lean Calorie Deficit Plan',
      calories: '1800 kcal',
      protein: 180,
      carbs: 130,
      fats: 50,
      desc: 'Thermic calorie deficit diet focused on fat loss while preserving lean muscle mass.',
      goalCategory: 'Weight Loss',
      mealsSchedule: {
        morning: ['Egg White Omelet (6 whites)', 'Fresh Ripe Bananas (1)'],
        lunch: ['Grilled Chicken Breast (200g)', 'Fresh Sliced Avocado (1/2)'],
        preWorkout: ['BCAA + Glutamine Drink (1 scoop)', 'Whole Grain Rice Cakes (2)'],
        postWorkout: ['Whey Protein Isolate (1 scoop)', 'Fresh Ripe Bananas (1)'],
        night: ['Low-Fat Cottage Cheese (200g)', 'Greek Yogurt & Honey']
      }
    },
    {
      id: 'dp-preset-3',
      name: 'Competition Shredded Cut',
      calories: '2200 kcal',
      protein: 220,
      carbs: 160,
      fats: 55,
      desc: 'Ultra-lean contest conditioning diet designed for peak muscular definition and vascularity.',
      goalCategory: 'Cutting',
      mealsSchedule: {
        morning: ['Egg White Omelet (6 whites)', 'Rolled Oats with Cinnamon (40g)'],
        lunch: ['Grilled Chicken Breast (220g)', 'Roasted Sweet Potato (150g)'],
        preWorkout: ['Pre-Workout Energy Smoothie (400ml)', 'BCAA + Glutamine Drink'],
        postWorkout: ['Whey Protein Isolate (2 scoops)', 'Rice Krispies & Protein Powder'],
        night: ['Baked Salmon Fillet (180g)', 'Micellar Casein Protein Pudding']
      }
    }
  ];

  const defaultAgenda = [
    {
      id: 'ag-1',
      client: 'Ethan Hunt',
      routine: 'Morning Hypertrophy Squat Block',
      objective: 'Morning Hypertrophy Squat Block',
      timeBlock: 'Today 07:00 AM',
      time: 'Today 07:00 AM',
      shiftCategory: 'Morning Shift',
      status: 'Ready'
    },
    {
      id: 'ag-2',
      client: 'Sarah Connor',
      routine: 'Morning Conditioning & Cardio Sprint',
      objective: 'Morning Conditioning & Cardio Sprint',
      timeBlock: 'Today 08:30 AM',
      time: 'Today 08:30 AM',
      shiftCategory: 'Morning Shift',
      status: 'Ready'
    },
    {
      id: 'ag-3',
      client: 'Alex Mercer',
      routine: 'Evening Deadlift & Back Power Block',
      objective: 'Evening Deadlift & Back Power Block',
      timeBlock: 'Today 05:00 PM',
      time: 'Today 05:00 PM',
      shiftCategory: 'Evening Shift',
      status: 'Ready'
    },
    {
      id: 'ag-4',
      client: 'John Wick',
      routine: 'Evening Tactical Conditioning & Core',
      objective: 'Evening Tactical Conditioning & Core',
      timeBlock: 'Today 07:30 PM',
      time: 'Today 07:30 PM',
      shiftCategory: 'Evening Shift',
      status: 'Ready'
    }
  ];

  const defaultAttendance = [
    {
      name: 'Ethan Hunt',
      code: 'MEM-10892',
      inTime: '06:52 AM',
      outTime: '--',
      duration: 'Active',
      date: 'Today',
      status: 'active',
      scanMethod: 'Manual Keycard'
    },
    {
      name: 'Sarah Connor',
      code: 'MEM-24901',
      inTime: '08:15 AM',
      outTime: '09:45 AM',
      duration: '1h 30m',
      date: 'Today',
      status: 'done',
      scanMethod: 'Manual Keycard'
    },
    {
      name: 'John Wick',
      code: 'MEM-31044',
      inTime: '05:05 PM',
      outTime: '--',
      duration: 'Active',
      date: 'Today',
      status: 'active',
      scanMethod: 'Manual Entry (Trainer)'
    }
  ];

  const getRegisteredMembers = () => {
    let baseList = [...defaultMembers];

    const saved = localStorage.getItem('apex_trainer_members');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) baseList = parsed;
      } catch (e) {
        console.error("Failed to parse apex_trainer_members:", e);
      }
    }

    const registeredUsers = JSON.parse(localStorage.getItem('apex_registered_users')) || [];
    const memberUsers = registeredUsers.filter((u) => !u.role || u.role.toLowerCase() === 'member');

    memberUsers.forEach((u) => {
      if (u.name && !baseList.some((m) => m.name.toLowerCase() === u.name.toLowerCase())) {
        baseList.push({
          id: `MEM-${10890 + baseList.length}`,
          name: u.name,
          email: u.email || 'member@apex.com',
          tier: u.membershipTier || u.plan || 'Pro Member',
          status: 'Active',
          joined: u.joined || 'Today',
          goal: u.fitnessGoal || u.goal || 'General Fitness & Performance',
          diet: u.diet || 'Prescribed Protocol',
          workout: u.workout || 'Prescribed Program',
          attendance: 100
        });
      }
    });

    return baseList;
  };

  // 1. Members List (Loaded dynamically from real registered users)
  const [members, setMembers] = useState(() => getRegisteredMembers());

  // 2. Workout Plans (Trainer-created or saved items)
  const [workoutPlans, setWorkoutPlans] = useState(() => {
    const saved = localStorage.getItem('apex_trainer_workouts');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error("Failed to parse apex_trainer_workouts:", e);
      }
    }
    return [];
  });

  // 3. Diet Plans (Trainer-created or saved items)
  const [dietPlans, setDietPlans] = useState(() => {
    const saved = localStorage.getItem('apex_trainer_diets');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error("Failed to parse apex_trainer_diets:", e);
      }
    }
    return [];
  });

  // 4. Agenda/Appointments (Schedule)
  const [agenda, setAgenda] = useState(() => {
    const saved = localStorage.getItem('apex_trainer_agenda');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error("Failed to parse apex_trainer_agenda:", e);
      }
    }
    return [];
  });

  // 5. Attendance logs
  const [attendanceLogs, setAttendanceLogs] = useState(() => {
    const saved = localStorage.getItem('apex_trainer_attendance');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error("Failed to parse apex_trainer_attendance:", e);
      }
    }
    return [];
  });

  // 6. Real-time Member Chat History State (Per-member messaging)
  const [allMemberChats, setAllMemberChats] = useState(() => {
    const saved = localStorage.getItem('apex_trainer_chat_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error("Failed to parse apex_trainer_chat_history:", e);
      }
    }
    return [];
  });

  const [selectedChatMember, setSelectedChatMember] = useState('Ethan Hunt');
  const [singleChatInput, setSingleChatInput] = useState('');
  const [memberInputs, setMemberInputs] = useState({});

  // Sync real-time member chats automatically (deduplicating local and remote)
  useEffect(() => {
    const syncChat = async () => {
      let localSaved = [];
      try {
        localSaved = JSON.parse(localStorage.getItem('apex_trainer_chat_history') || '[]');
      } catch (e) {}

      let remoteChat = [];
      try {
        const res = await trainerApi.getChatHistory();
        if (res && Array.isArray(res)) remoteChat = res;
      } catch (e) {}

      const map = new Map();
      [...localSaved, ...remoteChat].forEach((item) => {
        if (item && item.id) map.set(item.id, item);
        else if (item && item.text) map.set(item.text + (item.time || ''), item);
      });

      const combined = Array.from(map.values());
      if (combined.length > 0) {
        setAllMemberChats(combined);
        try {
          localStorage.setItem('apex_trainer_chat_history', JSON.stringify(combined));
        } catch (e) {}

        // Dynamically add any member who sent a message to the members list if not already present
        combined.forEach((msg) => {
          if (msg.memberName && msg.memberName !== 'Coach Marcus Vance') {
            setMembers((prev) => {
              if (!prev.some((m) => m.name.toLowerCase() === msg.memberName.toLowerCase())) {
                return [
                  ...prev,
                  {
                    id: `MEM-${10890 + prev.length}`,
                    name: msg.memberName,
                    email: `${msg.memberName.toLowerCase().replace(/\s+/g, '.')}@apex.com`,
                    tier: 'Pro Member',
                    status: 'Active',
                    joined: 'Today',
                    goal: 'General Fitness & Performance',
                    diet: 'Prescribed Protocol',
                    workout: 'Prescribed Program',
                    attendance: 100
                  }
                ];
              }
              return prev;
            });
          }
        });
      }
    };
    syncChat();
    const interval = setInterval(syncChat, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleSendTrainerMsgToMember = async (targetMemberName) => {
    const activeMember = targetMemberName || selectedChatMember || 'Ethan Hunt';
    const inputVal = singleChatInput.trim() || (memberInputs[activeMember] || '').trim();
    if (!inputVal) return;

    const now = new Date();
    const timeStr = now.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }) + ', ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newMsg = {
      id: `c-${Date.now()}`,
      memberName: activeMember,
      sender: 'coach',
      text: inputVal,
      time: timeStr
    };

    const updatedChats = [...allMemberChats, newMsg];
    setAllMemberChats(updatedChats);
    setSingleChatInput('');
    setMemberInputs((prev) => ({ ...prev, [activeMember]: '' }));

    try {
      localStorage.setItem('apex_trainer_chat_history', JSON.stringify(updatedChats));
    } catch (e) {
      console.warn("Storage chat sync error:", e);
    }

    await trainerApi.sendChatMessage(inputVal, 'coach', activeMember);
  };

  // --- TRAINER PANEL PAGINATION STATES ---
  const [memberPage, setMemberPage] = useState(1);
  const [workoutPlanPage, setWorkoutPlanPage] = useState(1);
  const [dietPlanPage, setDietPlanPage] = useState(1);
  const [agendaPage, setAgendaPage] = useState(1);
  const [attendanceLogPage, setAttendanceLogPage] = useState(1);
  const TRAINER_ITEMS_PER_PAGE = 5;

  const renderTrainerPagination = (currentPage, totalPages, totalItems, onPageChange, itemsPerPage = 5) => {
    if (totalItems <= itemsPerPage) return null;
    const startIdx = (currentPage - 1) * itemsPerPage + 1;
    const endIdx = Math.min(currentPage * itemsPerPage, totalItems);

    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '0.8rem', borderTop: '1px solid var(--border-color)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
        <span>Showing {startIdx}-{endIdx} of {totalItems} entries</span>
        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          <button
            type="button"
            className="outline-btn"
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
            style={{ padding: '0.25rem 0.6rem', fontSize: '0.72rem', opacity: currentPage === 1 ? 0.4 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
          >
            ← Prev
          </button>
          <span style={{ color: 'var(--text-white)', fontWeight: 700, padding: '0 0.4rem' }}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            type="button"
            className="outline-btn"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            style={{ padding: '0.25rem 0.6rem', fontSize: '0.72rem', opacity: currentPage >= totalPages ? 0.4 : 1, cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer' }}
          >
            Next →
          </button>
        </div>
      </div>
    );
  };

  // Sync state with Node.js Express backend API on mount
  useEffect(() => {
    async function loadTrainerBackendData() {
      // 1. Members Roster
      const fetchedMembers = await trainerApi.getMembers();
      if (fetchedMembers && fetchedMembers.length > 0) setMembers(fetchedMembers);

      // 2. Workout Plans
      const fetchedWorkouts = await trainerApi.getWorkouts();
      if (fetchedWorkouts && fetchedWorkouts.length > 0) setWorkoutPlans(fetchedWorkouts);

      // 3. Diet Plans
      const fetchedDiets = await trainerApi.getDiets();
      if (fetchedDiets && fetchedDiets.length > 0) setDietPlans(fetchedDiets);

      // 4. Schedule Agenda
      const fetchedAgenda = await trainerApi.getSchedule();
      if (fetchedAgenda && fetchedAgenda.length > 0) setAgenda(fetchedAgenda);

      // 5. Attendance Logs
      const fetchedAttendance = await trainerApi.getAttendance();
      if (fetchedAttendance && fetchedAttendance.length > 0) setAttendanceLogs(fetchedAttendance);
    }
    loadTrainerBackendData();
  }, []);

  // Auto-sync state edits back to localStorage
  useEffect(() => {
    localStorage.setItem('apex_trainer_members', JSON.stringify(members));
  }, [members]);

  useEffect(() => {
    localStorage.setItem('apex_trainer_workouts', JSON.stringify(workoutPlans));
  }, [workoutPlans]);

  useEffect(() => {
    localStorage.setItem('apex_trainer_diets', JSON.stringify(dietPlans));
  }, [dietPlans]);

  useEffect(() => {
    localStorage.setItem('apex_trainer_agenda', JSON.stringify(agenda));
  }, [agenda]);

  useEffect(() => {
    localStorage.setItem('apex_trainer_attendance', JSON.stringify(attendanceLogs));
  }, [attendanceLogs]);

  // --- FORM STATES ---

  // Create block form inputs (Overview & Schedule shared)
  const [client, setClient] = useState(() => {
    const saved = localStorage.getItem('apex_trainer_members');
    if (saved && saved !== '[]') {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0) return parsed[0].name;
      } catch (err) {
        console.error(err);
      }
    }
    return defaultMembers[0]?.name || 'Active Member';
  });
  const [routine, setRoutine] = useState('');
  const [timeBlock, setTimeBlock] = useState('');

  // Architect Workout Program form inputs
  const [newWorkoutName, setNewWorkoutName] = useState('');
  const [newWorkoutTarget, setNewWorkoutTarget] = useState('');
  const [newWorkoutDuration, setNewWorkoutDuration] = useState('4 weeks');
  const [newWorkoutExercises, setNewWorkoutExercises] = useState('');

  // Formulate Diet Plan form inputs
  const [newDietName, setNewDietName] = useState('');
  const [newDietCalories, setNewDietCalories] = useState('');
  const [newDietProtein, setNewDietProtein] = useState('');
  const [newDietCarbs, setNewDietCarbs] = useState('');
  const [newDietFats, setNewDietFats] = useState('');
  const [newDietDesc, setNewDietDesc] = useState('');
  const [selectedGoalCategory, setSelectedGoalCategory] = useState('Custom');
  const [activeMealSlot, setActiveMealSlot] = useState('morning');
  const [foodMenuFilter, setFoodMenuFilter] = useState('All');
  const [expandedDietId, setExpandedDietId] = useState(null);
  const [targetAssignMember, setTargetAssignMember] = useState('');

  // Schedule Shift & Time Slot States (Morning 5 AM - 10 AM, Evening 4 PM - 10 PM)
  const [scheduleShiftFilter, setScheduleShiftFilter] = useState('All'); // 'All' | 'Morning' | 'Evening'
  const [selectedShiftWindow, setSelectedShiftWindow] = useState('Morning'); // 'Morning' | 'Evening'
  const [selectedShiftDay, setSelectedShiftDay] = useState('Today'); // 'Today' | 'Tomorrow' | 'Day After'
  const [selectedShiftSlot, setSelectedShiftSlot] = useState('07:00 AM');

  // 5-Slot Meal Planner Schedule State
  const [mealSchedule, setMealSchedule] = useState({
    morning: [],
    lunch: [],
    preWorkout: [],
    postWorkout: [],
    night: []
  });

  const [customFoodInputs, setCustomFoodInputs] = useState({
    morning: '',
    lunch: '',
    preWorkout: '',
    postWorkout: '',
    night: ''
  });

  // Food Menu Catalog Items
  const FOOD_MENU_CATALOG = [
    { id: 'f1', category: 'Proteins', name: 'Grilled Chicken Breast', portion: '200g', calories: 220, protein: 42, carbs: 0, fats: 5, icon: '🍗' },
    { id: 'f2', category: 'Proteins', name: 'Egg White Omelet', portion: '6 whites', calories: 120, protein: 24, carbs: 2, fats: 1, icon: '🥚' },
    { id: 'f3', category: 'Proteins', name: 'Baked Salmon Fillet', portion: '180g', calories: 340, protein: 34, carbs: 0, fats: 20, icon: '🐟' },
    { id: 'f4', category: 'Proteins', name: 'Whey Protein Isolate', portion: '1 scoop (30g)', calories: 120, protein: 26, carbs: 1, fats: 1, icon: '🥤' },
    { id: 'f5', category: 'Proteins', name: 'Low-Fat Cottage Cheese', portion: '200g', calories: 160, protein: 24, carbs: 6, fats: 3, icon: '🧀' },

    { id: 'f6', category: 'Carbs', name: 'Steamed Brown Rice', portion: '1.5 cups', calories: 230, protein: 5, carbs: 48, fats: 2, icon: '🍚' },
    { id: 'f7', category: 'Carbs', name: 'Roasted Sweet Potato', portion: '200g', calories: 180, protein: 3, carbs: 41, fats: 0, icon: '🍠' },
    { id: 'f8', category: 'Carbs', name: 'Rolled Oats with Cinnamon', portion: '80g dry', calories: 300, protein: 11, carbs: 54, fats: 5, icon: '🥣' },
    { id: 'f9', category: 'Carbs', name: 'Whole Grain Rice Cakes', portion: '4 cakes', calories: 140, protein: 3, carbs: 30, fats: 1, icon: '🍘' },
    { id: 'f10', category: 'Carbs', name: 'Fresh Ripe Bananas', portion: '2 medium', calories: 210, protein: 2, carbs: 54, fats: 1, icon: '🍌' },

    { id: 'f11', category: 'Fats', name: 'Natural Peanut Butter', portion: '2 tbsp (32g)', calories: 190, protein: 8, carbs: 7, fats: 16, icon: '🥜' },
    { id: 'f12', category: 'Fats', name: 'Raw Whole Almonds', portion: '30g', calories: 170, protein: 6, carbs: 6, fats: 15, icon: '🌰' },
    { id: 'f13', category: 'Fats', name: 'Fresh Sliced Avocado', portion: '1/2 avocado', calories: 160, protein: 2, carbs: 9, fats: 15, icon: '🥑' },
    { id: 'f14', category: 'Fats', name: 'Extra Virgin Olive Oil', portion: '1 tbsp', calories: 120, protein: 0, carbs: 0, fats: 14, icon: '🫒' },

    { id: 'f15', category: 'Pre/Post Workout', name: 'Pre-Workout Energy Smoothie', portion: '400ml', calories: 250, protein: 15, carbs: 45, fats: 2, icon: '⚡' },
    { id: 'f16', category: 'Pre/Post Workout', name: 'Post-Workout Anabolic Shake', portion: '500ml', calories: 380, protein: 45, carbs: 40, fats: 4, icon: '💥' },
    { id: 'f17', category: 'Pre/Post Workout', name: 'BCAA + Glutamine Drink', portion: '1 scoop', calories: 30, protein: 7, carbs: 0, fats: 0, icon: '💧' },
    { id: 'f18', category: 'Pre/Post Workout', name: 'Rice Krispies & Protein Powder', portion: '1 bowl', calories: 280, protein: 25, carbs: 40, fats: 2, icon: '🥣' },

    { id: 'f19', category: 'Night', name: 'Micellar Casein Protein Pudding', portion: '1 scoop', calories: 140, protein: 28, carbs: 3, fats: 2, icon: '🌙' },
    { id: 'f20', category: 'Night', name: 'Greek Yogurt & Honey', portion: '200g', calories: 190, protein: 18, carbs: 22, fats: 2, icon: '🏺' }
  ];

  // Quick Preset Buttons Handler (Weight Gain, Weight Loss, Cutting)
  const applyDietPreset = (goalType) => {
    setSelectedGoalCategory(goalType);
    if (goalType === 'Weight Gain') {
      setNewDietName('Mass Gainer Bulking Protocol');
      setNewDietCalories('3200');
      setNewDietProtein('200');
      setNewDietCarbs('380');
      setNewDietFats('90');
      setNewDietDesc('High-caloric hypertrophy diet to maximize muscle mass and strength gains.');
      setMealSchedule({
        morning: ['Rolled Oats with Cinnamon (80g)', 'Natural Peanut Butter (2 tbsp)', 'Fresh Ripe Bananas (2)'],
        lunch: ['Grilled Chicken Breast (200g)', 'Steamed Brown Rice (1.5 cups)', 'Fresh Sliced Avocado (1/2)'],
        preWorkout: ['Pre-Workout Energy Smoothie (400ml)', 'Whole Grain Rice Cakes (4)'],
        postWorkout: ['Post-Workout Anabolic Shake (500ml)', 'Rice Krispies & Protein Powder'],
        night: ['Baked Salmon Fillet (180g)', 'Micellar Casein Protein Pudding']
      });
    } else if (goalType === 'Weight Loss') {
      setNewDietName('Lean Calorie Deficit Plan');
      setNewDietCalories('1800');
      setNewDietProtein('180');
      setNewDietCarbs('130');
      setNewDietFats('50');
      setNewDietDesc('Thermic calorie deficit diet focused on fat loss while preserving lean muscle mass.');
      setMealSchedule({
        morning: ['Egg White Omelet (6 whites)', 'Fresh Ripe Bananas (1)'],
        lunch: ['Grilled Chicken Breast (200g)', 'Fresh Sliced Avocado (1/2)'],
        preWorkout: ['BCAA + Glutamine Drink (1 scoop)', 'Whole Grain Rice Cakes (2)'],
        postWorkout: ['Whey Protein Isolate (1 scoop)', 'Fresh Ripe Bananas (1)'],
        night: ['Low-Fat Cottage Cheese (200g)', 'Greek Yogurt & Honey']
      });
    } else if (goalType === 'Cutting') {
      setNewDietName('Competition Shredded Cut');
      setNewDietCalories('2200');
      setNewDietProtein('220');
      setNewDietCarbs('160');
      setNewDietFats('55');
      setNewDietDesc('Ultra-lean contest conditioning diet designed for peak muscular definition and vascularity.');
      setMealSchedule({
        morning: ['Egg White Omelet (6 whites)', 'Rolled Oats with Cinnamon (40g)'],
        lunch: ['Grilled Chicken Breast (220g)', 'Roasted Sweet Potato (150g)'],
        preWorkout: ['Pre-Workout Energy Smoothie (400ml)', 'BCAA + Glutamine Drink'],
        postWorkout: ['Whey Protein Isolate (2 scoops)', 'Rice Krispies & Protein Powder'],
        night: ['Baked Salmon Fillet (180g)', 'Micellar Casein Protein Pudding']
      });
    }
  };

  // Add Item from Food Catalog to selected meal slot
  const addFoodItemToSlot = (foodItem, slotName = activeMealSlot) => {
    const itemString = `${foodItem.icon} ${foodItem.name} (${foodItem.portion}) - ${foodItem.calories} kcal [${foodItem.protein}P/${foodItem.carbs}C/${foodItem.fats}F]`;
    setMealSchedule((prev) => ({
      ...prev,
      [slotName]: [...(prev[slotName] || []), itemString]
    }));
  };

  // Add Custom Food Item manually to selected meal slot
  const handleAddCustomFood = (slotName) => {
    const text = customFoodInputs[slotName]?.trim();
    if (!text) return;
    setMealSchedule((prev) => ({
      ...prev,
      [slotName]: [...(prev[slotName] || []), text]
    }));
    setCustomFoodInputs((prev) => ({ ...prev, [slotName]: '' }));
  };

  // Remove Food Item from meal slot
  const removeFoodItemFromSlot = (slotName, itemIndex) => {
    setMealSchedule((prev) => ({
      ...prev,
      [slotName]: prev[slotName].filter((_, idx) => idx !== itemIndex)
    }));
  };

  // Share & Assign Diet Plan to specific athlete member
  const handleShareAndAssignDiet = (dietObj, memberNameInput) => {
    let targetName = memberNameInput || prompt(`Assign & Share "${dietObj.name}" to which member name?`);
    if (!targetName || !targetName.trim()) return;
    targetName = targetName.trim();

    // 1. Update local members roster with assigned diet
    setMembers((prev) => {
      const exists = prev.some((m) => m.name && m.name.toLowerCase() === targetName.toLowerCase());
      if (exists) {
        return prev.map((m) => (m.name && m.name.toLowerCase() === targetName.toLowerCase() ? { ...m, diet: dietObj.name } : m));
      } else {
        return [
          {
            id: `MEM-${Math.floor(10000 + Math.random() * 90000)}`,
            name: targetName,
            email: `${targetName.toLowerCase().replace(/\s+/g, '')}@apex.com`,
            tier: 'Pro Member',
            status: 'Active',
            joined: 'Today',
            goal: dietObj.goalCategory || 'Custom Diet',
            diet: dietObj.name,
            workout: 'None',
            attendance: 95
          },
          ...prev
        ];
      }
    });

    // 2. Store full structured diet plan details for this specific member in localStorage
    localStorage.setItem(`apex_member_assigned_diet_${targetName.toLowerCase()}`, JSON.stringify(dietObj));

    // 3. Call Node.js Express backend API
    trainerApi.assignDiet(dietObj.id || dietObj.name, targetName);

    if (CustomSwal) {
      CustomSwal.fire({
        icon: 'success',
        title: 'Diet Plan Assigned & Shared! 🚀',
        html: `<div style="text-align:center;color:#fff;">
          <p style="margin-bottom:0.8rem;">Plan <strong>${dietObj.name}</strong> (${dietObj.calories}) has been assigned to athlete <strong>${targetName}</strong>!</p>
          <div style="background:rgba(198,255,0,0.08);border:1px solid #c6ff00;padding:0.8rem;border-radius:6px;font-size:0.85rem;color:#c6ff00;margin-bottom:0.6rem;">
            ✓ 5-Slot Meal Schedule (Morning, Lunch, Pre/Post Workout, Night) Synced<br/>
            ✓ Member ${targetName} can now view this plan on their Member Panel -> Prescribed Diet Plan Page!
          </div>
        </div>`
      });
    }
  };

  // Manual Turnstile simulation check-in inputs
  const [attMemberName, setAttMemberName] = useState(() => {
    const saved = localStorage.getItem('apex_trainer_members');
    if (saved && saved !== '[]') {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0) return parsed[0].name;
      } catch (err) {
        console.error(err);
      }
    }
    return defaultMembers[0]?.name || 'Active Member';
  });
  const [attAction, setAttAction] = useState('check-in');
  const [attSearch, setAttSearch] = useState('');
  const [attCandidateSearchInput, setAttCandidateSearchInput] = useState('');
  const [attComparisonResult, setAttComparisonResult] = useState(null);
  const [attDate, setAttDate] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  const [attTime, setAttTime] = useState(() => {
    const today = new Date();
    const hh = String(today.getHours()).padStart(2, '0');
    const min = String(today.getMinutes()).padStart(2, '0');
    return `${hh}:${min}`;
  });

  // Roster Program Assignment state
  const [assignmentMemberId, setAssignmentMemberId] = useState(null); // id of member currently being assigned to
  const [selectedAssignedWorkout, setSelectedAssignedWorkout] = useState('');
  const [selectedAssignedDiet, setSelectedAssignedDiet] = useState('');

  // --- REAL-TIME CAMERA & BIOMETRICS REMOVED ---




  // --- EVENT HANDLERS ---

  // Handle Agenda/Schedule submission
  const handleAgendaSubmit = async (e) => {
    e.preventDefault();
    const routineText = routine.trim();
    const timeText = timeBlock.trim() || `${selectedShiftDay} ${selectedShiftSlot}`;
    if (!routineText || !timeText) return;

    const shiftCat = selectedShiftWindow === 'Morning' ? 'Morning Shift' : 'Evening Shift';

    const newItem = {
      id: `ag-${Date.now()}`,
      timeBlock: timeText,
      time: timeText,
      client: client,
      routine: routineText,
      objective: routineText,
      shiftCategory: shiftCat,
      status: 'Ready'
    };

    setAgenda((prev) => [newItem, ...prev]);
    setRoutine('');
    setTimeBlock('');

    // Call Node.js Backend API
    await trainerApi.createScheduleSession(newItem);

    // Persist schedule item and dispatch notification message to localStorage so member panel updates instantly
    try {
      const savedAgenda = JSON.parse(localStorage.getItem('apex_trainer_agenda') || '[]');
      savedAgenda.unshift(newItem);
      localStorage.setItem('apex_trainer_agenda', JSON.stringify(savedAgenda));

      const dispatchMsg = {
        id: `c-${Date.now()}`,
        sender: 'coach',
        text: `📅 [SCHEDULE DISPATCH] Coaching Session Scheduled for ${client}: "${routineText}" on ${timeText} (${shiftCat}).`,
        time: 'Just Now'
      };

      const savedChat = JSON.parse(localStorage.getItem('apex_trainer_chat_history') || '[]');
      savedChat.push(dispatchMsg);
      localStorage.setItem('apex_trainer_chat_history', JSON.stringify(savedChat));
    } catch (err) {
      console.warn("Schedule sync storage error:", err);
    }

    if (CustomSwal) {
      CustomSwal.fire({
        icon: 'success',
        title: 'Training Session Scheduled & Shared 📅',
        html: `<div style="text-align:center;color:#fff;">
          <p style="margin-bottom:0.8rem;">Session reserved for <strong>${client}</strong> during <strong>${shiftCat}</strong> (${timeText})!</p>
          <div style="background:rgba(0,240,255,0.08);border:1px solid #00f0ff;padding:0.8rem;border-radius:6px;font-size:0.85rem;color:#00f0ff;">
            ✓ Shared to Member Panel -> Trainer Block<br/>
            ✓ Schedule dispatch notification sent to ${client}'s terminal
          </div>
        </div>`
      });
    }
  };

  // Remove/Complete agenda sessions
  const handleCompleteSession = async (index, item) => {
    setAgenda((prev) =>
      prev.map((it, idx) => (idx === index ? { ...it, status: 'Completed' } : it))
    );
    if (item && item.id) {
      await trainerApi.updateScheduleStatus(item.id, 'Completed');
    }
  };

  const handleCancelSession = async (index, item) => {
    setAgenda((prev) => prev.filter((_, idx) => idx !== index));
    if (item && item.id) {
      await trainerApi.cancelScheduleSession(item.id);
    }
  };

  // Create Workout Plan
  const handleAddWorkout = async (e) => {
    e.preventDefault();
    if (!newWorkoutName.trim() || !newWorkoutExercises.trim()) return;

    const newPlan = {
      name: newWorkoutName.trim(),
      target: newWorkoutTarget.trim() || 'General Conditioning',
      duration: newWorkoutDuration,
      exercises: newWorkoutExercises.trim()
    };

    setWorkoutPlans((prev) => [...prev, newPlan]);
    setNewWorkoutName('');
    setNewWorkoutTarget('');
    setNewWorkoutExercises('');

    // Call Node.js Backend API
    await trainerApi.createWorkout(newPlan);
    CustomSwal.fire({
      icon: 'success',
      title: 'Workout Program Created',
      text: `Successfully created program: ${newPlan.name}!`
    });
  };

  // Create Diet Plan
  const handleAddDiet = async (e) => {
    e.preventDefault();
    if (!newDietName.trim()) return;

    const newPlan = {
      id: `dp-${Date.now()}`,
      name: newDietName.trim(),
      calories: parseInt(newDietCalories) || 2000,
      protein: parseInt(newDietProtein) || 150,
      carbs: parseInt(newDietCarbs) || 200,
      fats: parseInt(newDietFats) || 70,
      desc: newDietDesc.trim() || 'Custom formulated macronutrient plan.',
      goalCategory: selectedGoalCategory || 'Custom',
      mealsSchedule: mealSchedule || {
        morning: [],
        lunch: [],
        preWorkout: [],
        postWorkout: [],
        night: []
      }
    };

    setDietPlans((prev) => [newPlan, ...prev]);
    setNewDietName('');
    setNewDietCalories('');
    setNewDietProtein('');
    setNewDietCarbs('');
    setNewDietFats('');
    setNewDietDesc('');
    setSelectedGoalCategory('Custom');
    setMealSchedule({
      morning: [],
      lunch: [],
      preWorkout: [],
      postWorkout: [],
      night: []
    });

    // Call Node.js Backend API
    await trainerApi.createDiet(newPlan);

    if (targetAssignMember) {
      handleShareAndAssignDiet(newPlan, targetAssignMember);
      setTargetAssignMember('');
    } else {
      CustomSwal.fire({
        icon: 'success',
        title: 'Diet Plan Formulated 🎉',
        text: `Successfully formulated ${newPlan.goalCategory} diet: ${newPlan.name}!`
      });
    }
  };

  // Assign Plan to Athlete
  const handleAssignPlans = async (e) => {
    e.preventDefault();
    if (!assignmentMemberId) return;

    const assignedMember = members.find((m) => m.id === assignmentMemberId);

    setMembers((prev) =>
      prev.map((m) =>
        m.id === assignmentMemberId
          ? {
              ...m,
              workout: selectedAssignedWorkout || m.workout,
              diet: selectedAssignedDiet || m.diet
            }
          : m
      )
    );

    if (selectedAssignedWorkout) {
      await trainerApi.assignWorkout(selectedAssignedWorkout, assignmentMemberId);
    }
    if (selectedAssignedDiet) {
      if (assignedMember) {
        const assignedDietObj = dietPlans.find((d) => d.name === selectedAssignedDiet);
        if (assignedDietObj) {
          localStorage.setItem(`apex_member_assigned_diet_${assignedMember.name.toLowerCase()}`, JSON.stringify(assignedDietObj));
        }
      }
      await trainerApi.assignDiet(selectedAssignedDiet, assignmentMemberId);
    }

    setAssignmentMemberId(null);
    setSelectedAssignedWorkout('');
    setSelectedAssignedDiet('');
    CustomSwal.fire({
      icon: 'success',
      title: 'Plans Assigned & Shared 🚀',
      text: 'Programs successfully assigned and shared to athlete member terminals!'
    });
  };

  // Turnstile Manual Log Submission
  const handleManualTurnstileSubmit = async (e) => {
    e.preventDefault();
    const matchedUser = members.find((m) => m.name === attMemberName);
    const code = (matchedUser && matchedUser.id && matchedUser.id.includes('-')) ? `#${matchedUser.id.split('-')[1]}-MAN` : '#0000-MAN';
    
    let dateStr = 'Today';
    let timeStr = '';
    try {
      const selectedDateTime = new Date(`${attDate}T${attTime}`);
      if (!isNaN(selectedDateTime.getTime())) {
        dateStr = selectedDateTime.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
        timeStr = selectedDateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else {
        dateStr = attDate;
        timeStr = attTime;
      }
    } catch (err) {
      dateStr = attDate;
      timeStr = attTime;
    }

    if (attAction === 'check-in') {
      // Add check-in log
      const newLog = {
        name: attMemberName,
        code,
        inTime: timeStr,
        outTime: '--',
        duration: '--',
        date: dateStr,
        status: 'active'
      };

      setAttendanceLogs((prev) => [newLog, ...prev]);

      // Boost attendance score slightly for fun
      setMembers((prev) =>
        prev.map((m) =>
          m.name === attMemberName
            ? { ...m, attendance: Math.min(100, parseFloat((m.attendance + 1.2).toFixed(1))) }
            : m
        )
      );

      await trainerApi.triggerTurnstile(attMemberName, 'check-in', attDate, attTime);
      CustomSwal.fire({
        icon: 'success',
        title: 'Attendance Recorded 🔓',
        text: `Manual check-in recorded for ${attMemberName} on ${dateStr} at ${timeStr}!`
      });
    } else {
      // Complete check-out
      const activeIdx = attendanceLogs.findIndex((log) => log.name === attMemberName && log.outTime === '--');
      if (activeIdx === -1) {
        const newLog = {
          name: attMemberName,
          code,
          inTime: '09:00 AM',
          outTime: timeStr,
          duration: '1h 30m',
          date: dateStr,
          status: 'done'
        };
        setAttendanceLogs((prev) => [newLog, ...prev]);
      } else {
        setAttendanceLogs((prev) =>
          prev.map((item, idx) =>
            idx === activeIdx ? { ...item, outTime: timeStr, duration: '1h 30m', status: 'done' } : item
          )
        );
      }

      await trainerApi.triggerTurnstile(attMemberName, 'check-out', attDate, attTime);
      CustomSwal.fire({
        icon: 'success',
        title: 'Attendance Recorded',
        text: `Manual check-out recorded for ${attMemberName} on ${dateStr} at ${timeStr}!`
      });
    }
  };

  // Filtered attendance list
  const filteredAttendance = attendanceLogs.filter((log) =>
    log.name.toLowerCase().includes(attSearch.toLowerCase())
  );

  const handleResetData = () => {
    localStorage.removeItem('apex_trainer_is_cleared');
    const realMembers = getRegisteredMembers();
    setMembers(realMembers);
    setWorkoutPlans([]);
    setDietPlans([]);
    setAgenda([]);
    setAttendanceLogs([]);
    setClient(realMembers[0]?.name || '');
    setAttMemberName(realMembers[0]?.name || '');
    CustomSwal.fire({
      icon: 'info',
      title: 'Roster Synced 🔄',
      text: 'Trainer module database successfully synced with active registered member accounts!'
    });
  };

  const handleClearData = async () => {
    const res = await CustomSwal.fire({
      icon: 'warning',
      title: 'Clear All Trainer Data?',
      text: 'Are you sure you want to delete all trainer records? This will clear all members, plans, schedule blocks, and attendance logs.',
      showCancelButton: true,
      confirmButtonText: 'Yes, Clear All',
      cancelButtonText: 'Cancel'
    });
    if (!res.isConfirmed) return;

    localStorage.setItem('apex_trainer_is_cleared', 'true');
    setMembers([]);
    setWorkoutPlans([]);
    setDietPlans([]);
    setAgenda([]);
    setAttendanceLogs([]);
    setClient('');
    setAttMemberName('');
    CustomSwal.fire({
      icon: 'success',
      title: 'Data Cleared',
      text: 'Trainer module database cleared successfully!'
    });
  };


  // --- SUBVIEWS RENDERING ---

  return (
    <div>
      {/* SYSTEM HEADER BANNER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-white)' }}>
            Coaching Terminal
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Apex Master Trainer Control & Roster Dashboard</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <button
            type="button"
            className="outline-btn"
            style={{ padding: '0.4rem 0.9rem', fontSize: '0.72rem', borderColor: 'var(--accent-volt)', color: 'var(--accent-volt)', height: '32px', display: 'flex', alignItems: 'center', cursor: 'pointer', textTransform: 'uppercase' }}
            onClick={handleResetData}
          >
            Load Templates
          </button>
          <button
            type="button"
            className="outline-btn"
            style={{ padding: '0.4rem 0.9rem', fontSize: '0.72rem', borderColor: '#ff3e6c', color: '#ff3e6c', height: '32px', display: 'flex', alignItems: 'center', cursor: 'pointer', textTransform: 'uppercase' }}
            onClick={handleClearData}
          >
            Clear Data
          </button>
          <span style={{ fontSize: '0.72rem', color: 'var(--accent-volt)', border: '1px solid var(--accent-volt)', borderRadius: '4px', padding: '0.3rem 0.6rem', textTransform: 'uppercase', fontWeight: 700 }}>
            Role: Certified Coach
          </span>
        </div>
      </div>

      {/* --- TAB 1: OVERVIEW SUB-VIEW --- */}
      {currentTab === 'overview' && (
        <div style={{ animation: 'slideTimelineItem 0.4s ease forwards' }}>

          {/* BROADCASTED SYSTEM ALERTS BANNER */}
          {broadcastAlerts.filter(a => !dismissedAlerts.includes(a.id)).map((alt) => {
            const typeInfo = {
              holiday: { bg: 'rgba(255, 62, 108, 0.15)', border: '#ff3e6c', icon: '🛑' },
              event: { bg: 'rgba(0, 240, 255, 0.15)', border: '#00f0ff', icon: '🎉' },
              maintenance: { bg: 'rgba(255, 159, 0, 0.15)', border: '#ff9f00', icon: '⚙️' },
              general: { bg: 'rgba(255, 255, 255, 0.05)', border: '#8e919f', icon: '📢' }
            }[alt.type] || { bg: 'rgba(255, 255, 255, 0.05)', border: '#8e919f', icon: '📢' };

            return (
              <div key={alt.id} className="db-card member-alert-card" style={{
                background: typeInfo.bg,
                border: `1.5px solid ${typeInfo.border}`,
                boxShadow: `0 0 15px ${typeInfo.bg}`,
                marginBottom: '1.2rem',
                position: 'relative',
                padding: '1.2rem 1.5rem',
                borderRadius: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '1rem' }}>
                  <div style={{ fontSize: '1.8rem' }}>{typeInfo.icon}</div>
                  <div className="alert-details" style={{ flexGrow: 1 }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: typeInfo.border }}>{alt.type} Announcement</span>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>• {alt.date}</span>
                    </div>
                    <h4 style={{ color: 'var(--text-white)', fontWeight: 800, margin: '0.2rem 0', fontSize: '1.15rem' }}>{alt.title}</h4>
                    <p style={{ color: 'var(--text-white)', fontSize: '0.85rem', margin: 0 }}>{alt.message}</p>
                  </div>
                  <button onClick={() => {
                    const updatedDismissed = [...dismissedAlerts, alt.id];
                    setDismissedAlerts(updatedDismissed);
                    localStorage.setItem('dismissed_trainer_alerts', JSON.stringify(updatedDismissed));
                  }} style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                    alignSelf: 'flex-start',
                    padding: '0 0.5rem'
                  }}>&times;</button>
                </div>
              </div>
            );
          })}

          {/* Metrics Grid */}
          <div className="metrics-grid col-3">
            <div className="metric-card">
              <div className="metric-icon" style={{ color: 'var(--accent-cyan)', background: 'rgba(0,240,255,0.05)' }}>
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="metric-details">
                <h3>{members.length}</h3>
                <p>Assigned Client Roster</p>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon" style={{ color: 'var(--accent-volt)', background: 'rgba(198,255,0,0.05)' }}>
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="metric-details">
                <h3>{agenda.filter(a => a.status === 'Ready').length}</h3>
                <p>Appointments Scheduled Today</p>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon" style={{ color: '#ff3e6c', background: 'rgba(255,62,108,0.05)' }}>
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="metric-details">
                <h3>32.5 hrs</h3>
                <p>Coaching Hours Logged (Month)</p>
              </div>
            </div>
          </div>

          {/* Agenda & Forms Grid */}
          <div className="db-grid-row">
            {/* Today's Agenda Card */}
            <div className="db-card flex-card">
              <h4>Today's Client Agenda</h4>
              <p className="card-subtitle">Detailed roster details and fitness objectives</p>

              <ul className="agenda-list" style={{ listStyle: 'none', padding: 0 }}>
                {agenda.length === 0 ? (
                  <li style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem', padding: '2rem 1.2rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '4px' }}>
                    No coaching appointments scheduled for today.
                  </li>
                ) : (
                  agenda.map((item, idx) => (
                    <li
                      key={idx}
                      className="agenda-item"
                      style={{
                        animation: 'slideTimelineItem 0.4s ease forwards',
                        opacity: 1,
                        transform: 'translateY(0)',
                        marginBottom: '0.8rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
                        <div className="agenda-time">{(item.time || item.timeBlock || 'Today 09:00 AM').replace('Today ', '')}</div>
                        <div className="agenda-details">
                          <h5>{item.client}</h5>
                          <p>{item.objective || item.routine || 'Coaching Session'}</p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <span className={`agenda-badge check ${item.status === 'Completed' ? 'paid' : ''}`} style={{
                          background: item.status === 'Completed' ? 'rgba(0, 255, 102, 0.08)' : 'rgba(0, 240, 255, 0.08)',
                          color: item.status === 'Completed' ? '#00ff66' : 'var(--accent-cyan)',
                          border: item.status === 'Completed' ? '1px solid rgba(0, 255, 102, 0.2)' : '1px solid rgba(0, 240, 255, 0.2)'
                        }}>
                          {item.status}
                        </span>
                        {item.status === 'Ready' && (
                          <div style={{ display: 'flex', gap: '0.3rem' }}>
                            <button
                              onClick={() => handleCompleteSession(idx)}
                              style={{ cursor: 'pointer', padding: '0.2rem 0.5rem', background: 'rgba(0,255,102,0.1)', border: '1px solid rgba(0,255,102,0.2)', borderRadius: '4px', color: '#00ff66', fontSize: '0.75rem', fontWeight: 'bold' }}
                            >
                              ✓
                            </button>
                            <button
                              onClick={() => handleCancelSession(idx)}
                              style={{ cursor: 'pointer', padding: '0.2rem 0.5rem', background: 'rgba(255,62,108,0.1)', border: '1px solid rgba(255,62,108,0.2)', borderRadius: '4px', color: '#ff3e6c', fontSize: '0.75rem', fontWeight: 'bold' }}
                            >
                              &times;
                            </button>
                          </div>
                        )}
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>

            {/* Create Training Block Card */}
            <div className="db-card">
              <h4>Create Training Block</h4>
              <p className="card-subtitle">Dispatch new objectives directly to a member's terminal</p>

              <form onSubmit={handleAgendaSubmit} id="trainer-schedule-form" style={{ marginTop: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="sched-client">Client Selector</label>
                  <select
                    id="sched-client"
                    className="form-input"
                    value={client}
                    onChange={(e) => setClient(e.target.value)}
                    style={{ background: 'var(--bg-black)', border: '1px solid var(--border-color)', color: 'var(--text-white)' }}
                    required
                  >
                    {members.length === 0 ? (
                      <option value="">No registered athletes</option>
                    ) : (
                      members.map((m) => (
                        <option key={m.id} value={m.name}>{m.name} ({m.tier})</option>
                      ))
                    )}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="sched-routine">Routine / Objective</label>
                  <select
                    id="sched-routine-select"
                    className="form-input"
                    value={routine}
                    onChange={(e) => setRoutine(e.target.value)}
                    style={{ background: 'var(--bg-black)', border: '1px solid var(--border-color)', color: 'var(--text-white)', marginBottom: '0.5rem' }}
                  >
                    <option value="">-- Choose Program Template --</option>
                    {workoutPlans.map((w, idx) => (
                      <option key={idx} value={w.name}>{w.name} ({w.target})</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    id="sched-routine"
                    className="form-input"
                    placeholder="Or type custom objective..."
                    value={routine}
                    onChange={(e) => setRoutine(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="sched-time">Target Time Block</label>
                  <input
                    type="text"
                    id="sched-time"
                    className="form-input"
                    placeholder="e.g. Today 04:30 PM"
                    value={timeBlock}
                    onChange={(e) => setTimeBlock(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="glow-btn"
                  style={{ width: '100%', fontSize: '0.85rem', padding: '0.75rem' }}
                >
                  Issue Training Block
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 2: MEMBERS SUB-VIEW --- */}
      {currentTab === 'members' && (
        <div style={{ animation: 'slideTimelineItem 0.4s ease forwards' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
            {/* Client Roster Card */}
            <div className="db-card flex-card">
              <h4>Athlete Client Roster</h4>
              <p className="card-subtitle">View and manage program assignments for your roster athletes</p>

              <div className="table-wrapper">
                <table className="db-table">
                  <thead>
                    <tr>
                      <th>Athlete ID</th>
                      <th>Name</th>
                      <th>Level</th>
                      <th>Active Workout</th>
                      <th>Active Diet</th>
                      <th>Attendance</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members
                      .slice((memberPage - 1) * TRAINER_ITEMS_PER_PAGE, memberPage * TRAINER_ITEMS_PER_PAGE)
                      .map((m) => (
                        <tr key={m.id}>
                          <td style={{ fontFamily: 'monospace', color: 'var(--accent-cyan)', fontWeight: 700 }}>{m.id}</td>
                          <td><strong>{m.name}</strong><br /><span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{m.tier}</span></td>
                          <td>
                            <span style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '4px' }}>
                              {m.level}
                            </span>
                          </td>
                          <td>{m.workout !== 'None' ? <span style={{ color: 'var(--accent-volt)' }}>{m.workout}</span> : <span style={{ color: 'var(--text-dim)' }}>None</span>}</td>
                          <td>{m.diet !== 'None' ? <span style={{ color: 'var(--accent-cyan)' }}>{m.diet}</span> : <span style={{ color: 'var(--text-dim)' }}>None</span>}</td>
                          <td><strong>{m.attendance}%</strong></td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button
                                onClick={() => {
                                  setAssignmentMemberId(m.id);
                                  setSelectedAssignedWorkout(m.workout);
                                  setSelectedAssignedDiet(m.diet);
                                }}
                                className="outline-btn"
                                style={{ padding: '0.4rem 0.7rem', fontSize: '0.72rem', textTransform: 'uppercase' }}
                              >
                                Assign Program
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedChatMember(m.name);
                                  const el = document.getElementById('trainer-single-chat-terminal');
                                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                                }}
                                className="glow-btn"
                                style={{ padding: '0.4rem 0.7rem', fontSize: '0.72rem', textTransform: 'uppercase' }}
                              >
                                💬 Chat
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {renderTrainerPagination(
                memberPage,
                Math.ceil(members.length / TRAINER_ITEMS_PER_PAGE) || 1,
                members.length,
                setMemberPage,
                TRAINER_ITEMS_PER_PAGE
              )}
            </div>

            {/* SINGLE DEDICATED MEMBER COMMUNICATION TERMINAL */}
            <div className="db-card" id="trainer-single-chat-terminal" style={{ marginTop: '1.5rem', width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                <div>
                  <h4 style={{ margin: 0, textTransform: 'uppercase', fontFamily: 'var(--font-display)', fontWeight: 800 }}>
                    💬 Member Direct Communication Terminal
                  </h4>
                  <p className="card-subtitle" style={{ margin: '0.2rem 0 0 0' }}>
                    Select one registered member to view and exchange real-time messages
                  </p>
                </div>

                {/* REGISTERED MEMBER SELECTOR */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                  <label htmlFor="member-chat-select" style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                    Select Registered Member:
                  </label>
                  <select
                    id="member-chat-select"
                    className="form-input"
                    value={selectedChatMember}
                    onChange={(e) => setSelectedChatMember(e.target.value)}
                    style={{ background: 'var(--bg-black)', border: '1px solid var(--accent-cyan)', color: 'var(--text-white)', padding: '0.45rem 0.8rem', fontSize: '0.82rem', fontWeight: 700, borderRadius: '6px' }}
                  >
                    {members.map((m) => (
                      <option key={m.id} value={m.name}>
                        {m.name} ({m.tier})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* SINGLE CHAT BOX CONTAINER FOR THE SELECTED REGISTERED MEMBER */}
              {(() => {
                const currentMemberObj = members.find((m) => m.name.toLowerCase() === selectedChatMember.toLowerCase()) || {
                  id: 'MEM-10892',
                  name: selectedChatMember,
                  tier: 'Registered Member'
                };

                const memberChatHistory = allMemberChats.filter((msg) =>
                  msg.memberName && msg.memberName.toLowerCase() === selectedChatMember.toLowerCase()
                );

                return (
                  <div
                    style={{
                      background: 'rgba(255, 255, 255, 0.01)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '10px',
                      padding: '1.4rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1.2rem',
                      boxShadow: '0 0 20px rgba(0,0,0,0.25)'
                    }}
                  >
                    {/* Header bar of the active single chat box */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0, 240, 255, 0.03)', padding: '0.8rem 1.2rem', borderRadius: '8px', border: '1px solid rgba(0, 240, 255, 0.15)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'rgba(0, 240, 255, 0.15)', border: '1px solid var(--accent-cyan)', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1rem' }}>
                          {currentMemberObj.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h5 style={{ color: 'var(--text-white)', margin: 0, fontWeight: 800, fontSize: '1.05rem', textTransform: 'uppercase' }}>
                            {currentMemberObj.name}
                          </h5>
                          <span style={{ fontSize: '0.75rem', color: 'var(--accent-volt)', fontWeight: 700 }}>
                            {currentMemberObj.tier} • ID: {currentMemberObj.id}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <span style={{ fontSize: '0.7rem', background: 'rgba(0, 255, 102, 0.1)', color: '#00ff66', border: '1px solid rgba(0, 255, 102, 0.3)', padding: '0.25rem 0.6rem', borderRadius: '4px', fontWeight: 700 }}>
                          ● Live Sync Active
                        </span>
                        <span style={{ fontSize: '0.7rem', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-white)', border: '1px solid var(--border-color)', padding: '0.25rem 0.6rem', borderRadius: '4px', fontWeight: 700 }}>
                          {memberChatHistory.length} Messages
                        </span>
                      </div>
                    </div>

                    {/* Chat Scroll Viewport */}
                    <div
                      style={{
                        height: '320px',
                        overflowY: 'auto',
                        background: 'rgba(0, 0, 0, 0.35)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        padding: '1.2rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.9rem'
                      }}
                    >
                      {memberChatHistory.length === 0 ? (
                        <div style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem', margin: 'auto', padding: '2rem' }}>
                          💬 No messages exchanged with <strong>{currentMemberObj.name}</strong> yet.<br />
                          Messages sent from {currentMemberObj.name}'s Member Panel will appear here!
                        </div>
                      ) : (
                        memberChatHistory.map((bubble, idx) => {
                          const isCoach = bubble.sender === 'coach';
                          return (
                            <div
                              key={idx}
                              style={{
                                alignSelf: isCoach ? 'flex-end' : 'flex-start',
                                maxWidth: '78%',
                                background: isCoach ? 'var(--accent-volt)' : 'rgba(255, 255, 255, 0.05)',
                                color: isCoach ? 'var(--bg-black)' : 'var(--text-white)',
                                border: isCoach ? 'none' : '1px solid var(--border-color)',
                                padding: '0.75rem 1rem',
                                borderRadius: isCoach ? '12px 12px 0 12px' : '12px 12px 12px 0',
                                fontSize: '0.85rem',
                                lineHeight: 1.4,
                                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                              }}
                            >
                              <div style={{ fontSize: '0.68rem', opacity: 0.8, fontWeight: 800, marginBottom: '0.2rem', display: 'flex', justifyContent: 'space-between', gap: '0.8rem' }}>
                                <span>{isCoach ? 'Trainer (You)' : `Athlete (${currentMemberObj.name})`}</span>
                              </div>
                              <p style={{ margin: 0, fontWeight: isCoach ? 600 : 'normal' }}>{bubble.text}</p>
                              <span style={{ display: 'block', fontSize: '0.62rem', opacity: 0.6, marginTop: '0.35rem', textAlign: 'right' }}>
                                {bubble.time}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Single Member Reply Form */}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSendTrainerMsgToMember(currentMemberObj.name);
                      }}
                      style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}
                    >
                      <input
                        type="text"
                        className="form-input"
                        placeholder={`Type message to ${currentMemberObj.name}...`}
                        value={singleChatInput}
                        onChange={(e) => setSingleChatInput(e.target.value)}
                        style={{ padding: '0.7rem 1rem', fontSize: '0.85rem', flexGrow: 1, background: 'var(--bg-black)', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                      />
                      <button
                        type="submit"
                        className="glow-btn"
                        style={{ padding: '0.7rem 1.6rem', fontSize: '0.82rem', textTransform: 'uppercase', height: '44px', fontWeight: 800 }}
                      >
                        Send Message
                      </button>
                    </form>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* PROGRAM ASSIGNMENT OVERLAY MODAL */}
          {assignmentMemberId && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'rgba(5, 5, 8, 0.85)',
              backdropFilter: 'blur(8px)',
              zIndex: 99999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div style={{
                background: '#0e0e13',
                border: '1px solid var(--border-color)',
                boxShadow: '0 0 30px rgba(198, 255, 0, 0.15)',
                borderRadius: '12px',
                width: '90%',
                maxWidth: '450px',
                padding: '2.2rem',
                position: 'relative'
              }}>
                <button
                  onClick={() => setAssignmentMemberId(null)}
                  style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    fontSize: '1.8rem',
                    cursor: 'pointer'
                  }}
                >
                  &times;
                </button>

                <h3 style={{ textTransform: 'uppercase', fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--text-white)', marginBottom: '0.5rem', fontSize: '1.25rem' }}>
                  Assign Programs
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.8rem' }}>
                  Select workout and diet plans to sync to client terminal: <strong style={{ color: 'var(--accent-volt)' }}>
                    {members.find((m) => m.id === assignmentMemberId)?.name}
                  </strong>
                </p>

                <form onSubmit={handleAssignPlans}>
                  <div className="form-group" style={{ marginBottom: '1.2rem' }}>
                    <label className="form-label" style={{ fontSize: '0.78rem' }}>Workout Program Template</label>
                    <select
                      className="form-input"
                      value={selectedAssignedWorkout}
                      onChange={(e) => setSelectedAssignedWorkout(e.target.value)}
                      style={{ background: 'var(--bg-black)', border: '1px solid var(--border-color)', color: 'var(--text-white)' }}
                    >
                      <option value="None">None (Unassign Workout)</option>
                      {workoutPlans.map((w, i) => (
                        <option key={i} value={w.name}>{w.name} ({w.target})</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: '2rem' }}>
                    <label className="form-label" style={{ fontSize: '0.78rem' }}>Diet & Macros Template</label>
                    <select
                      className="form-input"
                      value={selectedAssignedDiet}
                      onChange={(e) => setSelectedAssignedDiet(e.target.value)}
                      style={{ background: 'var(--bg-black)', border: '1px solid var(--border-color)', color: 'var(--text-white)' }}
                    >
                      <option value="None">None (Unassign Diet)</option>
                      {dietPlans.map((d, i) => (
                        <option key={i} value={d.name}>{d.name} ({d.calories} kcal)</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      className="outline-btn"
                      style={{ padding: '0.5rem 1rem', fontSize: '0.75rem' }}
                      onClick={() => setAssignmentMemberId(null)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="glow-btn"
                      style={{ padding: '0.5rem 1.2rem', fontSize: '0.75rem' }}
                    >
                      Sync Terminal
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- TAB 3: WORKOUT PLANS SUB-VIEW --- */}
      {currentTab === 'workouts' && (
        <div style={{ animation: 'slideTimelineItem 0.4s ease forwards' }}>
          <div className="db-grid-row">
            {/* Workout Roster View */}
            <div className="db-card flex-card">
              <h4>Conditioning Programs</h4>
              <p className="card-subtitle">Active workout periods, target muscle split, and exercise sequencing profiles</p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.2rem', marginTop: '0.5rem' }}>
                {workoutPlans
                  .slice((workoutPlanPage - 1) * TRAINER_ITEMS_PER_PAGE, workoutPlanPage * TRAINER_ITEMS_PER_PAGE)
                  .map((w, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: 'rgba(255, 255, 255, 0.01)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        padding: '1.2rem',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                          <h5 style={{ color: 'var(--text-white)', fontWeight: 800, fontSize: '0.98rem', textTransform: 'uppercase' }}>
                            {w.name}
                          </h5>
                          <span style={{ fontSize: '0.65rem', background: 'rgba(198,255,0,0.1)', color: 'var(--accent-volt)', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: 800 }}>
                            {w.duration}
                          </span>
                        </div>
                        <p style={{ color: 'var(--accent-cyan)', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700, margin: '0.1rem 0 0.8rem 0' }}>
                          Split: {w.target}
                        </p>
                        <div style={{ background: 'rgba(0,0,0,0.1)', border: '1px solid var(--border-color)', padding: '0.8rem', borderRadius: '6px', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                          {w.exercises}
                        </div>
                      </div>

                      <div style={{ marginTop: '1.2rem', display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => {
                            const nameToFind = prompt(`Assign "${w.name}" to which member name?`);
                            if (!nameToFind) return;
                            const found = members.find(m => m.name.toLowerCase() === nameToFind.toLowerCase());
                            if (found) {
                              setMembers(prev => prev.map(m => m.id === found.id ? { ...m, workout: w.name } : m));
                              alert(`Assigned ${w.name} to ${found.name}!`);
                            } else {
                              alert(`Member "${nameToFind}" not found in current roster registry.`);
                            }
                          }}
                          className="outline-btn"
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.7rem', textTransform: 'uppercase' }}
                        >
                          Quick Assign
                        </button>
                      </div>
                    </div>
                  ))}
              </div>

              {renderTrainerPagination(
                workoutPlanPage,
                Math.ceil(workoutPlans.length / TRAINER_ITEMS_PER_PAGE) || 1,
                workoutPlans.length,
                setWorkoutPlanPage,
                TRAINER_ITEMS_PER_PAGE
              )}
            </div>

            {/* Create/Architect Program Card */}
            <div className="db-card">
              <h4>Architect Workout Program</h4>
              <p className="card-subtitle">Formulate a structured periodized exercises grid for roster assignments</p>

              <form onSubmit={handleAddWorkout} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="workout-name">Program Name</label>
                  <input
                    type="text"
                    id="workout-name"
                    className="form-input"
                    placeholder="e.g. Chest Hypertrophy, Leg Recovery"
                    value={newWorkoutName}
                    onChange={(e) => setNewWorkoutName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="workout-target">Target Muscle Groups</label>
                  <input
                    type="text"
                    id="workout-target"
                    className="form-input"
                    placeholder="e.g. Chest & Triceps, Full Body Core"
                    value={newWorkoutTarget}
                    onChange={(e) => setNewWorkoutTarget(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="workout-duration">Program Duration</label>
                  <select
                    id="workout-duration"
                    className="form-input"
                    value={newWorkoutDuration}
                    onChange={(e) => setNewWorkoutDuration(e.target.value)}
                    style={{ background: 'var(--bg-black)', border: '1px solid var(--border-color)', color: 'var(--text-white)' }}
                  >
                    <option value="4 weeks">4 Weeks Training Period</option>
                    <option value="6 weeks">6 Weeks Training Period</option>
                    <option value="8 weeks">8 Weeks Training Period</option>
                    <option value="12 weeks">12 Weeks Training Period</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="workout-exercises">Exercise Repetitions Matrix</label>
                  <textarea
                    id="workout-exercises"
                    className="form-input"
                    placeholder="Format: Exercise (sets x reps), Exercise (sets x reps)..."
                    value={newWorkoutExercises}
                    onChange={(e) => setNewWorkoutExercises(e.target.value)}
                    style={{ height: '90px', resize: 'none', background: 'var(--bg-black)', border: '1px solid var(--border-color)', color: 'var(--text-white)', padding: '0.8rem' }}
                    required
                  />
                </div>

                <button type="submit" className="glow-btn" style={{ padding: '0.8rem', fontSize: '0.85rem' }}>
                  Deploy Program Template
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 4: DIET PLANS SUB-VIEW --- */}
      {currentTab === 'diets' && (
        <div style={{ animation: 'slideTimelineItem 0.4s ease forwards' }}>
          <div className="db-grid-row" style={{ alignItems: 'start' }}>
            {/* Diet Lists and Macro Gauges Card */}
            <div className="db-card flex-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <div>
                  <h4>Macronutrient Formulations</h4>
                  <p className="card-subtitle">Prescribed diet plans, nutritional macros balance and calorie guides</p>
                </div>
                <span style={{ fontSize: '0.75rem', background: 'rgba(0, 240, 255, 0.1)', color: 'var(--accent-cyan)', padding: '0.25rem 0.6rem', borderRadius: '4px', border: '1px solid rgba(0, 240, 255, 0.2)' }}>
                  Total Plans: {dietPlans.length}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.2rem', marginTop: '0.8rem' }}>
                {dietPlans
                  .slice((dietPlanPage - 1) * TRAINER_ITEMS_PER_PAGE, dietPlanPage * TRAINER_ITEMS_PER_PAGE)
                  .map((d, idx) => {
                    const totalGrams = (parseInt(d.protein) || 0) + (parseInt(d.carbs) || 0) + (parseInt(d.fats) || 0) || 1;
                    const proteinPct = Math.round(((parseInt(d.protein) || 0) / totalGrams) * 100);
                    const carbsPct = Math.round(((parseInt(d.carbs) || 0) / totalGrams) * 100);
                    const fatsPct = Math.round(((parseInt(d.fats) || 0) / totalGrams) * 100);
                    const isExpanded = expandedDietId === (d.id || idx);

                    const categoryBadgeColor = 
                      d.goalCategory === 'Weight Gain' ? { bg: 'rgba(198,255,0,0.12)', text: 'var(--accent-volt)', border: 'var(--accent-volt)' } :
                      d.goalCategory === 'Weight Loss' ? { bg: 'rgba(255,62,108,0.12)', text: '#ff3e6c', border: '#ff3e6c' } :
                      d.goalCategory === 'Cutting' ? { bg: 'rgba(0,240,255,0.12)', text: 'var(--accent-cyan)', border: 'var(--accent-cyan)' } :
                      { bg: 'rgba(255,255,255,0.05)', text: 'var(--text-muted)', border: 'var(--border-color)' };

                    return (
                      <div
                        key={d.id || idx}
                        style={{
                          background: 'rgba(255, 255, 255, 0.015)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '10px',
                          padding: '1.2rem',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
                            <div>
                              <h5 style={{ color: 'var(--text-white)', fontWeight: 800, fontSize: '1rem', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                                {d.name}
                              </h5>
                              <span style={{ fontSize: '0.65rem', background: categoryBadgeColor.bg, color: categoryBadgeColor.text, border: `1px solid ${categoryBadgeColor.border}`, padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 800, textTransform: 'uppercase' }}>
                                {d.goalCategory || 'Custom'}
                              </span>
                            </div>
                            <span style={{ fontSize: '0.85rem', color: 'var(--accent-volt)', fontWeight: 800, background: 'rgba(198,255,0,0.08)', padding: '0.3rem 0.6rem', borderRadius: '6px', border: '1px solid rgba(198,255,0,0.2)' }}>
                              {d.calories}
                            </span>
                          </div>

                          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: 1.4, margin: '0.8rem 0 1rem 0' }}>
                            {d.desc}
                          </p>

                          {/* Macro Percent Bar visualization */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1rem', background: 'rgba(0,0,0,0.2)', padding: '0.8rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.04)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              <span>Protein ({d.protein}g)</span>
                              <span style={{ color: '#ff3e6c', fontWeight: 'bold' }}>{proteinPct}%</span>
                            </div>
                            <div style={{ width: '100%', height: '5px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px' }}>
                              <div style={{ height: '100%', width: `${proteinPct}%`, background: '#ff3e6c', borderRadius: '3px' }}></div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                              <span>Carbohydrates ({d.carbs}g)</span>
                              <span style={{ color: 'var(--accent-volt)', fontWeight: 'bold' }}>{carbsPct}%</span>
                            </div>
                            <div style={{ width: '100%', height: '5px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px' }}>
                              <div style={{ height: '100%', width: `${carbsPct}%`, background: 'var(--accent-volt)', borderRadius: '3px' }}></div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                              <span>Fats ({d.fats}g)</span>
                              <span style={{ color: 'var(--accent-cyan)', fontWeight: 'bold' }}>{fatsPct}%</span>
                            </div>
                            <div style={{ width: '100%', height: '5px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px' }}>
                              <div style={{ height: '100%', width: `${fatsPct}%`, background: 'var(--accent-cyan)', borderRadius: '3px' }}></div>
                            </div>
                          </div>

                          {/* Collapsible 5-Meal Schedule Details */}
                          {d.mealsSchedule && (
                            <div style={{ marginTop: '0.8rem' }}>
                              <button
                                type="button"
                                onClick={() => setExpandedDietId(isExpanded ? null : (d.id || idx))}
                                style={{
                                  width: '100%',
                                  padding: '0.4rem 0.6rem',
                                  fontSize: '0.72rem',
                                  background: 'rgba(255,255,255,0.03)',
                                  border: '1px solid var(--border-color)',
                                  borderRadius: '4px',
                                  color: 'var(--accent-cyan)',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  fontWeight: 700
                                }}
                              >
                                <span>📋 5-Meal Planner Schedule</span>
                                <span>{isExpanded ? '▲ Hide' : '▼ View'}</span>
                              </button>

                              {isExpanded && (
                                <div style={{ marginTop: '0.6rem', padding: '0.8rem', background: '#0a0a0f', borderRadius: '6px', border: '1px solid rgba(0, 240, 255, 0.2)', fontSize: '0.75rem' }}>
                                  {[
                                    { key: 'morning', label: '🌅 Morning', items: d.mealsSchedule.morning },
                                    { key: 'lunch', label: '🥗 Lunch', items: d.mealsSchedule.lunch },
                                    { key: 'preWorkout', label: '⚡ Pre Workout', items: d.mealsSchedule.preWorkout },
                                    { key: 'postWorkout', label: '🥤 Post Workout', items: d.mealsSchedule.postWorkout },
                                    { key: 'night', label: '🌙 Night', items: d.mealsSchedule.night }
                                  ].map((slot) => (
                                    <div key={slot.key} style={{ marginBottom: '0.6rem' }}>
                                      <strong style={{ color: 'var(--accent-volt)', fontSize: '0.72rem', textTransform: 'uppercase' }}>{slot.label}:</strong>
                                      {(!slot.items || slot.items.length === 0) ? (
                                        <div style={{ color: 'var(--text-dim)', fontStyle: 'italic', fontSize: '0.7rem', paddingLeft: '0.5rem' }}>No items scheduled</div>
                                      ) : (
                                        <ul style={{ margin: '0.2rem 0 0 0', paddingLeft: '1.2rem', color: 'var(--text-white)' }}>
                                          {slot.items.map((it, i) => (
                                            <li key={i} style={{ marginBottom: '0.15rem' }}>{it}</li>
                                          ))}
                                        </ul>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                          <button
                            onClick={() => {
                              const nameToFind = prompt(`Assign "${d.name}" to which member name?`);
                              if (!nameToFind) return;
                              const found = members.find(m => m.name.toLowerCase() === nameToFind.toLowerCase());
                              if (found) {
                                setMembers(prev => prev.map(m => m.id === found.id ? { ...m, diet: d.name } : m));
                                alert(`Assigned ${d.name} to ${found.name}!`);
                              } else {
                                alert(`Member "${nameToFind}" not found in current roster registry.`);
                              }
                            }}
                            className="outline-btn"
                            style={{ padding: '0.35rem 0.85rem', fontSize: '0.72rem', textTransform: 'uppercase', borderColor: 'var(--accent-volt)', color: 'var(--accent-volt)' }}
                          >
                            Quick Assign
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {renderTrainerPagination(
                dietPlanPage,
                Math.ceil(dietPlans.length / TRAINER_ITEMS_PER_PAGE) || 1,
                dietPlans.length,
                setDietPlanPage,
                TRAINER_ITEMS_PER_PAGE
              )}
            </div>

            {/* Diet formulator Card with Presets & 5-Slot Schedule */}
            <div className="db-card" style={{ maxWidth: '580px', width: '100%' }}>
              <h4>Create Diet Plan</h4>
              <p className="card-subtitle">Formulate meal schedule & presets for athletic conditioning</p>

              {/* 3 PRESET GOAL BUTTONS */}
              <div style={{ marginTop: '1rem', marginBottom: '1.2rem' }}>
                <label className="form-label" style={{ fontSize: '0.78rem', marginBottom: '0.5rem', display: 'block' }}>
                  Choose Preset Goal Profile:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem' }}>
                  <button
                    type="button"
                    onClick={() => applyDietPreset('Weight Gain')}
                    style={{
                      padding: '0.6rem 0.4rem',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      borderRadius: '6px',
                      cursor: 'pointer',
                      background: selectedGoalCategory === 'Weight Gain' ? 'rgba(198, 255, 0, 0.15)' : 'rgba(255,255,255,0.02)',
                      border: selectedGoalCategory === 'Weight Gain' ? '2px solid var(--accent-volt)' : '1px solid var(--border-color)',
                      color: selectedGoalCategory === 'Weight Gain' ? 'var(--accent-volt)' : 'var(--text-white)',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.2rem'
                    }}
                  >
                    <span style={{ fontSize: '1.1rem' }}>🏋️‍♂️</span>
                    <span>Weight Gain</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyDietPreset('Weight Loss')}
                    style={{
                      padding: '0.6rem 0.4rem',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      borderRadius: '6px',
                      cursor: 'pointer',
                      background: selectedGoalCategory === 'Weight Loss' ? 'rgba(255, 62, 108, 0.15)' : 'rgba(255,255,255,0.02)',
                      border: selectedGoalCategory === 'Weight Loss' ? '2px solid #ff3e6c' : '1px solid var(--border-color)',
                      color: selectedGoalCategory === 'Weight Loss' ? '#ff3e6c' : 'var(--text-white)',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.2rem'
                    }}
                  >
                    <span style={{ fontSize: '1.1rem' }}>📉</span>
                    <span>Weight Loss</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyDietPreset('Cutting')}
                    style={{
                      padding: '0.6rem 0.4rem',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      borderRadius: '6px',
                      cursor: 'pointer',
                      background: selectedGoalCategory === 'Cutting' ? 'rgba(0, 240, 255, 0.15)' : 'rgba(255,255,255,0.02)',
                      border: selectedGoalCategory === 'Cutting' ? '2px solid var(--accent-cyan)' : '1px solid var(--border-color)',
                      color: selectedGoalCategory === 'Cutting' ? 'var(--accent-cyan)' : 'var(--text-white)',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.2rem'
                    }}
                  >
                    <span style={{ fontSize: '1.1rem' }}>✂️</span>
                    <span>Cutting</span>
                  </button>
                </div>
              </div>

              <form onSubmit={handleAddDiet} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="diet-name">Diet Name / Protocol</label>
                  <input
                    type="text"
                    id="diet-name"
                    className="form-input"
                    placeholder="e.g. Mass Gainer Bulking Protocol"
                    value={newDietName}
                    onChange={(e) => setNewDietName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="diet-calories">Daily Target Calories (kcal)</label>
                  <input
                    type="number"
                    id="diet-calories"
                    className="form-input"
                    placeholder="e.g. 2800"
                    value={newDietCalories}
                    onChange={(e) => setNewDietCalories(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.8rem' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Protein (g)</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="e.g. 180"
                      value={newDietProtein}
                      onChange={(e) => setNewDietProtein(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Carbs (g)</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="e.g. 250"
                      value={newDietCarbs}
                      onChange={(e) => setNewDietCarbs(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Fats (g)</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="e.g. 70"
                      value={newDietFats}
                      onChange={(e) => setNewDietFats(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* --- 5-SLOT MEAL PLANNER SCHEDULE MODULE --- */}
                <div style={{ background: '#0a0a0f', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                    <h5 style={{ textTransform: 'uppercase', color: 'var(--accent-volt)', fontSize: '0.85rem', fontWeight: 800, margin: 0 }}>
                      Meal Planner Schedule
                    </h5>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>5 Meal Times</span>
                  </div>

                  {/* Slot selector tabs */}
                  <div style={{ display: 'flex', gap: '0.3rem', overflowX: 'auto', paddingBottom: '0.4rem', marginBottom: '0.8rem' }}>
                    {[
                      { key: 'morning', label: '🌅 Morning' },
                      { key: 'lunch', label: '🥗 Lunch' },
                      { key: 'preWorkout', label: '⚡ Pre Workout' },
                      { key: 'postWorkout', label: '🥤 Post Workout' },
                      { key: 'night', label: '🌙 Night' }
                    ].map((slot) => {
                      const itemCount = (mealSchedule[slot.key] || []).length;
                      const isActive = activeMealSlot === slot.key;
                      return (
                        <button
                          key={slot.key}
                          type="button"
                          onClick={() => setActiveMealSlot(slot.key)}
                          style={{
                            padding: '0.35rem 0.6rem',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            borderRadius: '4px',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            background: isActive ? 'var(--accent-volt)' : 'rgba(255,255,255,0.03)',
                            color: isActive ? '#000' : 'var(--text-white)',
                            border: isActive ? '1px solid var(--accent-volt)' : '1px solid var(--border-color)'
                          }}
                        >
                          {slot.label} ({itemCount})
                        </button>
                      );
                    })}
                  </div>

                  {/* Active Meal Slot Content */}
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.8rem', borderRadius: '6px', border: '1px dashed var(--border-color)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-cyan)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                      Active Slot: {
                        activeMealSlot === 'morning' ? '🌅 Morning (Breakfast)' :
                        activeMealSlot === 'lunch' ? '🥗 Lunch (Mid-day Fuel)' :
                        activeMealSlot === 'preWorkout' ? '⚡ Pre Workout (Energy)' :
                        activeMealSlot === 'postWorkout' ? '🥤 Post Workout (Recovery)' : '🌙 Night (Dinner / Bedtime)'
                      }
                    </div>

                    {/* Food list in active slot */}
                    {(mealSchedule[activeMealSlot] || []).length === 0 ? (
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontStyle: 'italic', margin: '0.4rem 0' }}>
                        No items added to this meal slot yet. Pick from the Food Items Menu below or type custom food.
                      </p>
                    ) : (
                      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 0.8rem 0' }}>
                        {mealSchedule[activeMealSlot].map((item, idx) => (
                          <li
                            key={idx}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              background: '#12121c',
                              border: '1px solid rgba(255,255,255,0.06)',
                              padding: '0.4rem 0.6rem',
                              borderRadius: '4px',
                              marginBottom: '0.35rem',
                              fontSize: '0.75rem',
                              color: 'var(--text-white)'
                            }}
                          >
                            <span>{item}</span>
                            <button
                              type="button"
                              onClick={() => removeFoodItemFromSlot(activeMealSlot, idx)}
                              style={{ background: 'none', border: 'none', color: '#ff3e6c', cursor: 'pointer', fontWeight: 800, fontSize: '0.9rem' }}
                            >
                              &times;
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* Manual add input */}
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <input
                        type="text"
                        className="form-input"
                        placeholder={`Add custom food to ${activeMealSlot}...`}
                        value={customFoodInputs[activeMealSlot] || ''}
                        onChange={(e) => setCustomFoodInputs({ ...customFoodInputs, [activeMealSlot]: e.target.value })}
                        style={{ fontSize: '0.75rem', padding: '0.35rem 0.6rem' }}
                      />
                      <button
                        type="button"
                        onClick={() => handleAddCustomFood(activeMealSlot)}
                        className="outline-btn"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.72rem', textTransform: 'uppercase', whiteSpace: 'nowrap' }}
                      >
                        + Add
                      </button>
                    </div>
                  </div>
                </div>

                {/* --- INTERACTIVE FOOD ITEMS MENU CATALOG --- */}
                <div style={{ background: '#0a0a0f', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                    <h5 style={{ textTransform: 'uppercase', color: 'var(--accent-cyan)', fontSize: '0.85rem', fontWeight: 800, margin: 0 }}>
                      Food Items Menu Catalog
                    </h5>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Click + Add to insert to {activeMealSlot}</span>
                  </div>

                  {/* Filter Pills */}
                  <div style={{ display: 'flex', gap: '0.3rem', overflowX: 'auto', paddingBottom: '0.4rem', marginBottom: '0.8rem' }}>
                    {['All', 'Proteins', 'Carbs', 'Fats', 'Pre/Post Workout', 'Night'].map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setFoodMenuFilter(cat)}
                        style={{
                          padding: '0.2rem 0.5rem',
                          fontSize: '0.68rem',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          background: foodMenuFilter === cat ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.03)',
                          color: foodMenuFilter === cat ? '#000' : 'var(--text-muted)',
                          border: 'none',
                          fontWeight: 700
                        }}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Food Items Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.5rem', maxHeight: '220px', overflowY: 'auto', paddingRight: '0.3rem' }}>
                    {FOOD_MENU_CATALOG
                      .filter((f) => foodMenuFilter === 'All' || f.category === foodMenuFilter)
                      .map((food) => (
                        <div
                          key={food.id}
                          style={{
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(255,255,255,0.05)',
                            borderRadius: '6px',
                            padding: '0.5rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <div>
                            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-white)' }}>
                              {food.icon} {food.name}
                            </div>
                            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                              {food.portion} • <span style={{ color: 'var(--accent-volt)' }}>{food.calories} kcal</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => addFoodItemToSlot(food, activeMealSlot)}
                            className="outline-btn"
                            style={{ padding: '0.2rem 0.45rem', fontSize: '0.65rem', borderColor: 'var(--accent-volt)', color: 'var(--accent-volt)', cursor: 'pointer' }}
                          >
                            + Slot
                          </button>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="diet-target-member">Assign & Share Plan to Member (Optional)</label>
                  <select
                    id="diet-target-member"
                    className="form-input"
                    value={targetAssignMember}
                    onChange={(e) => setTargetAssignMember(e.target.value)}
                    style={{ background: 'var(--bg-black)', border: '1px solid var(--border-color)', color: 'var(--text-white)' }}
                  >
                    <option value="">-- Do Not Assign Yet (Save to Templates) --</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.name}>{m.name} ({m.tier})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="diet-desc">Plan Guidelines / Notes</label>
                  <textarea
                    id="diet-desc"
                    className="form-input"
                    placeholder="Describe main meals or nutritional guidelines..."
                    value={newDietDesc}
                    onChange={(e) => setNewDietDesc(e.target.value)}
                    style={{ height: '60px', resize: 'none', background: 'var(--bg-black)', border: '1px solid var(--border-color)', color: 'var(--text-white)', padding: '0.8rem' }}
                  />
                </div>

                <button type="submit" className="glow-btn" style={{ padding: '0.85rem', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                  Deploy Diet Plan
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 5: SCHEDULE SUB-VIEW --- */}
      {currentTab === 'schedule' && (
        <div style={{ animation: 'slideTimelineItem 0.4s ease forwards' }}>
          {/* Shift Windows Overview Bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ background: 'rgba(198, 255, 0, 0.04)', border: '1px solid var(--accent-volt)', borderRadius: '10px', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <div style={{ fontSize: '2rem' }}>🌅</div>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--accent-volt)', fontWeight: 800, textTransform: 'uppercase' }}>Morning Shift Schedule</span>
                <h4 style={{ margin: '0.2rem 0 0 0', fontSize: '1.2rem', color: 'var(--text-white)', fontWeight: 800 }}>5:00 AM – 10:00 AM</h4>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  {agenda.filter(a => a.shiftCategory === 'Morning Shift' || (a.timeBlock && (a.timeBlock.includes('AM') || a.timeBlock.includes('05:') || a.timeBlock.includes('06:') || a.timeBlock.includes('07:') || a.timeBlock.includes('08:') || a.timeBlock.includes('09:') || a.timeBlock.includes('10:')))).length} Reserved Blocks
                </span>
              </div>
            </div>

            <div style={{ background: 'rgba(0, 240, 255, 0.04)', border: '1px solid var(--accent-cyan)', borderRadius: '10px', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <div style={{ fontSize: '2rem' }}>🌙</div>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', fontWeight: 800, textTransform: 'uppercase' }}>Evening Shift Schedule</span>
                <h4 style={{ margin: '0.2rem 0 0 0', fontSize: '1.2rem', color: 'var(--text-white)', fontWeight: 800 }}>4:00 PM – 10:00 PM</h4>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  {agenda.filter(a => a.shiftCategory === 'Evening Shift' || (a.timeBlock && (a.timeBlock.includes('PM') || a.timeBlock.includes('04:') || a.timeBlock.includes('05:') || a.timeBlock.includes('06:') || a.timeBlock.includes('07:') || a.timeBlock.includes('08:') || a.timeBlock.includes('09:') || a.timeBlock.includes('10:')))).length} Reserved Blocks
                </span>
              </div>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <div style={{ fontSize: '2rem' }}>⏱️</div>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>Facility Operating Windows</span>
                <h4 style={{ margin: '0.2rem 0 0 0', fontSize: '1.1rem', color: 'var(--text-white)', fontWeight: 800 }}>Dual Shift System</h4>
                <span style={{ fontSize: '0.7rem', color: '#00ff66', fontWeight: 700 }}>Active Training Dispatch</span>
              </div>
            </div>
          </div>

          <div className="db-grid-row">
            {/* Coaching appointments table */}
            <div className="db-card flex-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                <div>
                  <h4 style={{ margin: 0 }}>Coaching Schedule & Bookings</h4>
                  <p className="card-subtitle" style={{ margin: 0 }}>List of coaching blocks across Morning (5 AM - 10 AM) and Evening (4 PM - 10 PM) shifts</p>
                </div>

                {/* Shift Filter Pills */}
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  {[
                    { key: 'All', label: 'All Shifts' },
                    { key: 'Morning', label: '🌅 Morning (5-10 AM)' },
                    { key: 'Evening', label: '🌙 Evening (4-10 PM)' }
                  ].map((f) => (
                    <button
                      key={f.key}
                      type="button"
                      onClick={() => setScheduleShiftFilter(f.key)}
                      style={{
                        padding: '0.3rem 0.6rem',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        borderRadius: '4px',
                        cursor: 'pointer',
                        background: scheduleShiftFilter === f.key ? (f.key === 'Morning' ? 'var(--accent-volt)' : f.key === 'Evening' ? 'var(--accent-cyan)' : 'var(--text-white)') : 'rgba(255,255,255,0.04)',
                        color: scheduleShiftFilter === f.key ? '#000' : 'var(--text-white)',
                        border: 'none'
                      }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="table-wrapper">
                <table className="db-table">
                  <thead>
                    <tr>
                      <th>Shift Window</th>
                      <th>Time Block</th>
                      <th>Athlete Client</th>
                      <th>Objective Program</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agenda.filter(item => {
                      if (scheduleShiftFilter === 'Morning') {
                        return item.shiftCategory === 'Morning Shift' || (item.timeBlock && (item.timeBlock.includes('AM') || item.timeBlock.includes('05:') || item.timeBlock.includes('06:') || item.timeBlock.includes('07:') || item.timeBlock.includes('08:') || item.timeBlock.includes('09:') || item.timeBlock.includes('10:')));
                      }
                      if (scheduleShiftFilter === 'Evening') {
                        return item.shiftCategory === 'Evening Shift' || (item.timeBlock && (item.timeBlock.includes('PM') || item.timeBlock.includes('04:') || item.timeBlock.includes('05:') || item.timeBlock.includes('06:') || item.timeBlock.includes('07:') || item.timeBlock.includes('08:') || item.timeBlock.includes('09:') || item.timeBlock.includes('10:')));
                      }
                      return true;
                    }).length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem', padding: '2rem 1.2rem' }}>
                          No scheduled appointments found for {scheduleShiftFilter === 'All' ? 'any shift' : `${scheduleShiftFilter} Shift`}.
                        </td>
                      </tr>
                    ) : (
                      agenda
                        .filter(item => {
                          if (scheduleShiftFilter === 'Morning') {
                            return item.shiftCategory === 'Morning Shift' || (item.timeBlock && (item.timeBlock.includes('AM') || item.timeBlock.includes('05:') || item.timeBlock.includes('06:') || item.timeBlock.includes('07:') || item.timeBlock.includes('08:') || item.timeBlock.includes('09:') || item.timeBlock.includes('10:')));
                          }
                          if (scheduleShiftFilter === 'Evening') {
                            return item.shiftCategory === 'Evening Shift' || (item.timeBlock && (item.timeBlock.includes('PM') || item.timeBlock.includes('04:') || item.timeBlock.includes('05:') || item.timeBlock.includes('06:') || item.timeBlock.includes('07:') || item.timeBlock.includes('08:') || item.timeBlock.includes('09:') || item.timeBlock.includes('10:')));
                          }
                          return true;
                        })
                        .map((item, idx) => {
                          const isMorning = item.shiftCategory === 'Morning Shift' || (item.timeBlock && item.timeBlock.includes('AM'));
                          return (
                            <tr key={idx}>
                              <td>
                                <span style={{
                                  fontSize: '0.68rem',
                                  fontWeight: 800,
                                  padding: '0.2rem 0.5rem',
                                  borderRadius: '4px',
                                  background: isMorning ? 'rgba(198, 255, 0, 0.12)' : 'rgba(0, 240, 255, 0.12)',
                                  color: isMorning ? 'var(--accent-volt)' : 'var(--accent-cyan)',
                                  border: isMorning ? '1px solid var(--accent-volt)' : '1px solid var(--accent-cyan)'
                                }}>
                                  {isMorning ? '🌅 Morning (5-10 AM)' : '🌙 Evening (4-10 PM)'}
                                </span>
                              </td>
                              <td style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-white)' }}>
                                {item.timeBlock || item.time}
                              </td>
                              <td><strong>{item.client}</strong></td>
                              <td>{item.routine || item.objective}</td>
                              <td>
                                <span className={`status-badge ${item.status === 'Completed' ? 'paid' : 'pending'}`} style={{
                                  background: item.status === 'Completed' ? 'rgba(0, 255, 102, 0.05)' : 'rgba(255, 159, 0, 0.05)',
                                  borderColor: item.status === 'Completed' ? 'rgba(0, 255, 102, 0.15)' : 'rgba(255, 159, 0, 0.15)',
                                  color: item.status === 'Completed' ? '#00ff66' : '#ff9f00'
                                }}>
                                  {item.status || 'Ready'}
                                </span>
                              </td>
                              <td>
                                {item.status !== 'Completed' ? (
                                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                                    <button
                                      className="outline-btn"
                                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', borderColor: 'rgba(0,255,102,0.2)', color: '#00ff66' }}
                                      onClick={() => handleCompleteSession(idx, item)}
                                    >
                                      Complete
                                    </button>
                                    <button
                                      className="outline-btn"
                                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', borderColor: 'rgba(255,62,108,0.2)', color: '#ff3e6c' }}
                                      onClick={() => handleCancelSession(idx, item)}
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <span style={{ color: 'var(--text-dim)', fontSize: '0.72rem' }}>Done ✓</span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Schedule new slot form */}
            <div className="db-card" style={{ maxWidth: '420px', width: '100%' }}>
              <h4>Reserve Training Block</h4>
              <p className="card-subtitle">Dispatch sessions for Morning (5-10 AM) or Evening (4-10 PM) shifts</p>

              {/* SHIFT SELECTION TOGGLE */}
              <div style={{ marginTop: '0.8rem', marginBottom: '1rem' }}>
                <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '0.4rem', display: 'block' }}>
                  Select Shift Window:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedShiftWindow('Morning');
                      setSelectedShiftSlot('07:00 AM');
                      setTimeBlock(`${selectedShiftDay} 07:00 AM`);
                    }}
                    style={{
                      padding: '0.6rem 0.4rem',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      borderRadius: '6px',
                      cursor: 'pointer',
                      background: selectedShiftWindow === 'Morning' ? 'rgba(198, 255, 0, 0.15)' : 'rgba(255,255,255,0.02)',
                      border: selectedShiftWindow === 'Morning' ? '2px solid var(--accent-volt)' : '1px solid var(--border-color)',
                      color: selectedShiftWindow === 'Morning' ? 'var(--accent-volt)' : 'var(--text-white)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.15rem'
                    }}
                  >
                    <span style={{ fontSize: '1.1rem' }}>🌅</span>
                    <span>Morning Shift</span>
                    <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>5 AM – 10 AM</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedShiftWindow('Evening');
                      setSelectedShiftSlot('05:00 PM');
                      setTimeBlock(`${selectedShiftDay} 05:00 PM`);
                    }}
                    style={{
                      padding: '0.6rem 0.4rem',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      borderRadius: '6px',
                      cursor: 'pointer',
                      background: selectedShiftWindow === 'Evening' ? 'rgba(0, 240, 255, 0.15)' : 'rgba(255,255,255,0.02)',
                      border: selectedShiftWindow === 'Evening' ? '2px solid var(--accent-cyan)' : '1px solid var(--border-color)',
                      color: selectedShiftWindow === 'Evening' ? 'var(--accent-cyan)' : 'var(--text-white)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.15rem'
                    }}
                  >
                    <span style={{ fontSize: '1.1rem' }}>🌙</span>
                    <span>Evening Shift</span>
                    <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>4 PM – 10 PM</span>
                  </button>
                </div>
              </div>

              <form onSubmit={handleAgendaSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="sched-tab-client">Client Selector</label>
                  <select
                    id="sched-tab-client"
                    className="form-input"
                    value={client}
                    onChange={(e) => setClient(e.target.value)}
                    style={{ background: 'var(--bg-black)', border: '1px solid var(--border-color)', color: 'var(--text-white)' }}
                    required
                  >
                    {members.length === 0 ? (
                      <option value="">No registered athletes</option>
                    ) : (
                      members.map((m) => (
                        <option key={m.id} value={m.name}>{m.name} ({m.tier})</option>
                      ))
                    )}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="sched-tab-routine">Routine / Objective</label>
                  <select
                    id="sched-tab-routine-select"
                    className="form-input"
                    value={routine}
                    onChange={(e) => setRoutine(e.target.value)}
                    style={{ background: 'var(--bg-black)', border: '1px solid var(--border-color)', color: 'var(--text-white)', marginBottom: '0.5rem' }}
                  >
                    <option value="">-- Choose Program Template --</option>
                    {workoutPlans.map((w, idx) => (
                      <option key={idx} value={w.name}>{w.name} ({w.target})</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    id="sched-tab-routine"
                    className="form-input"
                    placeholder="Or type custom objective..."
                    value={routine}
                    onChange={(e) => setRoutine(e.target.value)}
                    required
                  />
                </div>

                {/* QUICK TIME SLOT PICKER GRID */}
                <div style={{ background: '#0a0a0f', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.8rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <label className="form-label" style={{ margin: 0, fontSize: '0.75rem', color: selectedShiftWindow === 'Morning' ? 'var(--accent-volt)' : 'var(--accent-cyan)', fontWeight: 800 }}>
                      {selectedShiftWindow === 'Morning' ? '🌅 Morning Shift Slots (5 AM - 10 AM)' : '🌙 Evening Shift Slots (4 PM - 10 PM)'}
                    </label>
                  </div>

                  {/* Day Picker Pills */}
                  <div style={{ display: 'flex', gap: '0.3rem', marginBottom: '0.6rem' }}>
                    {['Today', 'Tomorrow', 'Day After'].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => {
                          setSelectedShiftDay(d);
                          setTimeBlock(`${d} ${selectedShiftSlot}`);
                        }}
                        style={{
                          padding: '0.25rem 0.5rem',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          borderRadius: '4px',
                          cursor: 'pointer',
                          background: selectedShiftDay === d ? 'var(--text-white)' : 'rgba(255,255,255,0.03)',
                          color: selectedShiftDay === d ? '#000' : 'var(--text-muted)',
                          border: 'none'
                        }}
                      >
                        {d}
                      </button>
                    ))}
                  </div>

                  {/* Slot Buttons Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem' }}>
                    {(selectedShiftWindow === 'Morning'
                      ? ['05:00 AM', '06:00 AM', '07:00 AM', '08:00 AM', '09:00 AM', '10:00 AM']
                      : ['04:00 PM', '05:00 PM', '06:00 PM', '07:00 PM', '08:00 PM', '09:00 PM', '10:00 PM']
                    ).map((slot) => {
                      const isSelected = selectedShiftSlot === slot;
                      return (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => {
                            setSelectedShiftSlot(slot);
                            setTimeBlock(`${selectedShiftDay} ${slot}`);
                          }}
                          style={{
                            padding: '0.35rem 0.2rem',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            borderRadius: '4px',
                            cursor: 'pointer',
                            background: isSelected
                              ? (selectedShiftWindow === 'Morning' ? 'var(--accent-volt)' : 'var(--accent-cyan)')
                              : 'rgba(255,255,255,0.03)',
                            color: isSelected ? '#000' : 'var(--text-white)',
                            border: isSelected
                              ? (selectedShiftWindow === 'Morning' ? '1px solid var(--accent-volt)' : '1px solid var(--accent-cyan)')
                              : '1px solid var(--border-color)'
                          }}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="sched-tab-time">Target Time Block String</label>
                  <input
                    type="text"
                    id="sched-tab-time"
                    className="form-input"
                    placeholder="e.g. Today 07:00 AM"
                    value={timeBlock}
                    onChange={(e) => setTimeBlock(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" className="glow-btn" style={{ padding: '0.85rem', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                  Reserve {selectedShiftWindow} Shift Session 🚀
                </button>
              </form>
            </div>
          </div>
        </div>
      )}      {/* --- TAB 6: ATTENDANCE SUB-VIEW --- */}
      {currentTab === 'attendance' && (
        <div style={{ animation: 'slideTimelineItem 0.4s ease forwards' }}>
          {/* Facility Attendance Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.2rem', marginBottom: '1.8rem' }}>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '1.2rem', borderRadius: '8px' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Checked In Today</span>
              <h3 style={{ color: 'var(--accent-volt)', fontSize: '1.6rem', fontWeight: 800, marginTop: '0.2rem', margin: 0 }}>
                {attendanceLogs.filter((log) => log.date === 'Today').length} athletes
              </h3>
            </div>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '1.2rem', borderRadius: '8px' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>On Gym Floor Now</span>
              <h3 style={{ color: 'var(--accent-cyan)', fontSize: '1.6rem', fontWeight: 800, marginTop: '0.2rem', margin: 0 }}>
                {attendanceLogs.filter((log) => log.status === 'active').length} active
              </h3>
            </div>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '1.2rem', borderRadius: '8px' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Average Stay Limit</span>
              <h3 style={{ color: 'var(--text-white)', fontSize: '1.6rem', fontWeight: 800, marginTop: '0.2rem', margin: 0 }}>1h 22m</h3>
            </div>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '1.2rem', borderRadius: '8px' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Average Consistency</span>
              <h3 style={{ color: '#a855f7', fontSize: '1.6rem', fontWeight: 800, marginTop: '0.2rem', margin: 0 }}>87.6%</h3>
            </div>
          </div>

          <div className="db-grid-row">
            {/* Real-time scanner logs */}
            <div className="db-card flex-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h4>Gym Attendance Logs</h4>
                  <p className="card-subtitle" style={{ margin: 0 }}>Real-time check-in and check-out attendance records</p>
                </div>

                {/* Search bar */}
                <input
                  type="text"
                  placeholder="Search athlete check-ins..."
                  value={attSearch}
                  onChange={(e) => setAttSearch(e.target.value)}
                  className="form-input"
                  style={{ maxWidth: '240px', padding: '0.5rem 0.8rem', fontSize: '0.8rem' }}
                />
              </div>

              <div className="table-wrapper">
                <table className="db-table">
                  <thead>
                    <tr>
                      <th>Athlete Client</th>
                      <th>RFID / Code</th>
                      <th>Scan Method</th>
                      <th>Gate Entry</th>
                      <th>Gate Exit</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAttendance.length === 0 ? (
                      <tr>
                        <td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem', padding: '2rem 1.2rem' }}>
                          No attendance logs found matching parameters.
                        </td>
                      </tr>
                    ) : (
                      filteredAttendance
                        .slice((attendanceLogPage - 1) * TRAINER_ITEMS_PER_PAGE, attendanceLogPage * TRAINER_ITEMS_PER_PAGE)
                        .map((log, idx) => (
                          <tr key={idx}>
                            <td><strong>{log.name}</strong></td>
                            <td style={{ fontFamily: 'monospace', color: 'var(--accent-cyan)', fontSize: '0.8rem' }}>{log.code}</td>
                            <td>
                              <span style={{ fontSize: '0.7rem', background: log.scanMethod ? 'rgba(0, 240, 255, 0.08)' : 'rgba(255, 255, 255, 0.02)', color: log.scanMethod ? 'var(--accent-cyan)' : 'var(--text-muted)', padding: '0.15rem 0.4rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                                {log.scanMethod || 'Manual'}
                              </span>
                            </td>
                            <td>{log.inTime}</td>
                            <td>{log.outTime}</td>
                            <td>{log.date}</td>
                            <td>
                              <span className={`status-badge ${log.status === 'done' ? 'paid' : 'pending'}`} style={{
                                background: log.status === 'done' ? 'rgba(0, 255, 102, 0.05)' : 'rgba(255, 159, 0, 0.05)',
                                borderColor: log.status === 'done' ? 'rgba(0, 255, 102, 0.15)' : 'rgba(255, 159, 0, 0.15)',
                                color: log.status === 'done' ? '#00ff66' : '#ff9f00'
                              }}>
                                {log.status === 'done' ? 'Checked Out' : 'Active On Floor'}
                              </span>
                            </td>
                            <td>
                              {log.status !== 'done' ? (
                                <button
                                  type="button"
                                  className="outline-btn"
                                  style={{ padding: '0.25rem 0.6rem', fontSize: '0.72rem', borderColor: '#ff3e6c', color: '#ff3e6c', cursor: 'pointer' }}
                                  onClick={async () => {
                                    const now = new Date();
                                    const yyyy = now.getFullYear();
                                    const mm = String(now.getMonth() + 1).padStart(2, '0');
                                    const dd = String(now.getDate()).padStart(2, '0');
                                    const todayStr = `${yyyy}-${mm}-${dd}`;
                                    const hh = String(now.getHours()).padStart(2, '0');
                                    const min = String(now.getMinutes()).padStart(2, '0');
                                    const timeStr = `${hh}:${min}`;

                                    const formattedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                                    setAttendanceLogs((prev) =>
                                      prev.map((item) =>
                                        item.id === log.id || (item.name === log.name && item.status === 'active')
                                          ? { ...item, outTime: formattedTime, duration: '1h 30m', status: 'done' }
                                          : item
                                      )
                                    );

                                    await trainerApi.triggerTurnstile(log.name, 'check-out', todayStr, timeStr);
                                    CustomSwal.fire({
                                      icon: 'success',
                                      title: 'Member Checked Out',
                                      text: `${log.name} has been manually checked out at ${formattedTime}!`
                                    });
                                  }}
                                >
                                  Check Out
                                </button>
                              ) : (
                                <span style={{ color: 'var(--text-dim)', fontSize: '0.72rem' }}>--</span>
                              )}
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>

              {renderTrainerPagination(
                attendanceLogPage,
                Math.ceil(filteredAttendance.length / TRAINER_ITEMS_PER_PAGE) || 1,
                filteredAttendance.length,
                setAttendanceLogPage,
                TRAINER_ITEMS_PER_PAGE
              )}
            </div>

            {/* Record Manual Attendance card */}
            <div className="db-card">
              <h4>Record Manual Attendance</h4>
              <p className="card-subtitle">Manually record member check-in and check-out entries with custom timestamps</p>

              <form onSubmit={handleManualTurnstileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', marginTop: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="manual-att-member">Select Gym Member</label>
                  <select
                    id="manual-att-member"
                    className="form-input"
                    value={attMemberName}
                    onChange={(e) => setAttMemberName(e.target.value)}
                    style={{ background: 'var(--bg-black)', border: '1px solid var(--border-color)', color: 'var(--text-white)' }}
                    required
                  >
                    {members.length === 0 ? (
                      <option value="">No registered athletes</option>
                    ) : (
                      members.map((m) => (
                        <option key={m.id} value={m.name}>{m.name} (RFID Code: #{m.id.split('-')[1]})</option>
                      ))
                    )}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="manual-att-date">Select Date</label>
                  <input
                    type="date"
                    id="manual-att-date"
                    className="form-input"
                    value={attDate}
                    onChange={(e) => setAttDate(e.target.value)}
                    style={{ background: 'var(--bg-black)', border: '1px solid var(--border-color)', color: 'var(--text-white)' }}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="manual-att-time">Select Time</label>
                  <input
                    type="time"
                    id="manual-att-time"
                    className="form-input"
                    value={attTime}
                    onChange={(e) => setAttTime(e.target.value)}
                    style={{ background: 'var(--bg-black)', border: '1px solid var(--border-color)', color: 'var(--text-white)' }}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="manual-att-action">Select Scan Trigger</label>
                  <select
                    id="manual-att-action"
                    className="form-input"
                    value={attAction}
                    onChange={(e) => setAttAction(e.target.value)}
                    style={{ background: 'var(--bg-black)', border: '1px solid var(--border-color)', color: 'var(--text-white)' }}
                    required
                  >
                    <option value="check-in">Manual Check-In Entry</option>
                    <option value="check-out">Manual Check-Out Entry</option>
                  </select>
                </div>

                <button type="submit" className="glow-btn" style={{ padding: '0.8rem', fontSize: '0.85rem' }}>
                  Record Attendance Entry
                </button>
              </form>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
