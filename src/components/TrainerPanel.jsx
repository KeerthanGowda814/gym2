import { useState, useEffect, useRef } from 'react';
import { memberApi } from '../services/memberApi';
import { trainerApi } from '../services/trainerApi';
import { CustomSwal } from '../utils/swal';
import ReceiptModal from './ReceiptModal';

export default function TrainerPanel({ activeView, currentUser }) {
  const validTabs = ['overview', 'members', 'workouts', 'diets', 'schedule', 'attendance'];

  const [activeTrainerReceipt, setActiveTrainerReceipt] = useState(null);
  const [trainerClientPayments, setTrainerClientPayments] = useState([]);

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

  useEffect(() => {
    const fetchTrainerPayments = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/payment/receipts?type=all');
        const data = await res.json();
        if (data.success && data.receipts) {
          setTrainerClientPayments(data.receipts);
        }
      } catch (err) {
        console.warn("Could not fetch trainer receipts:", err);
      }
    };
    fetchTrainerPayments();
  }, [currentUser]);

  // Auto-sync new coaching clients from live booking receipts into Trainer roster
  useEffect(() => {
    if (trainerClientPayments && trainerClientPayments.length > 0) {
      setMembers((prev) => {
        const updated = [...prev];
        trainerClientPayments.forEach((p) => {
          const clientEmail = p.userEmail || p.memberEmail;
          const clientName = p.userName || p.memberName;
          if (clientName && !updated.some(m => m.name.toLowerCase() === clientName.toLowerCase() || (m.email && clientEmail && m.email.toLowerCase() === clientEmail.toLowerCase()))) {
            updated.unshift({
              id: p.userId || `MEM-${Math.floor(10000 + Math.random() * 90000)}`,
              name: clientName,
              email: clientEmail || 'client@apex.com',
              tier: p.metadata?.package ? `VIP Athlete (${p.metadata.package})` : 'Personal Coaching Member',
              status: 'Active',
              joined: 'Recent Booking',
              goal: 'Personal Coaching Transformation',
              diet: 'Custom Tailored Protocol',
              workout: 'Personalized Coaching Block',
              attendance: 100
            });
          }
        });
        return updated;
      });
    }
  }, [trainerClientPayments]);

  // --- STATE INITIALIZATION WITH LOCALSTORAGE PERSISTENCE ---

  const defaultMembers = [
    {
      id: 'MEM-98801',
      name: 'Jeery',
      email: 'thepcworkshop1@gmail.com',
      tier: 'Muscle Core Member',
      status: 'Active',
      joined: '01 Sep 2024',
      goal: 'Form Consultation & Baseline Testing',
      diet: 'Lean Calorie Deficit Plan',
      workout: 'Hypertrophy Split Alpha (Upper/Lower)',
      attendance: 96
    },
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
        if (Array.isArray(parsed) && parsed.length > 0) {
          parsed.forEach((m) => {
            if (m.name && !baseList.some((b) => b.name.toLowerCase() === m.name.toLowerCase())) {
              baseList.push(m);
            }
          });
        }
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

  // Helper to dynamically calculate client subscription expiry from live payment receipts
  const calculateClientExpiry = (member, receiptsList = []) => {
    if (!member) return { daysRemaining: 28, expiryDateStr: 'Oct 10, 2026' };

    if (typeof member.daysLeft === 'number') {
      const remaining = member.daysLeft;
      const expTime = Date.now() + (remaining * 24 * 60 * 60 * 1000);
      return {
        daysRemaining: remaining,
        expiryDateStr: member.expiryDate || new Date(expTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      };
    }

    const mEmail = (member.email || '').toLowerCase().trim();
    const mName = (member.name || '').toLowerCase().trim();

    const matched = (receiptsList || []).filter(r => {
      if (!r) return false;
      const rEmail = (r.userEmail || r.email || '').toLowerCase().trim();
      const rName = (r.userName || r.name || r.memberName || '').toLowerCase().trim();
      return (mEmail && rEmail && (rEmail === mEmail || rEmail.includes(mEmail))) ||
             (mName && rName && (rName === mName || rName.includes(mName)));
    });

    if (matched.length > 0) {
      matched.sort((a, b) => new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0));
      const latest = matched[0];
      const rawDate = latest.createdAt || latest.metadata?.verifiedAt || latest.date;
      const purchaseDate = rawDate ? new Date(rawDate) : null;

      if (purchaseDate && !isNaN(purchaseDate.getTime())) {
        let durationDays = 30; // 1 month default
        const text = `${latest.title || ''} ${latest.plan || ''} ${latest.metadata?.package || ''} ${latest.items?.[0]?.name || ''}`.toLowerCase();
        
        if (text.includes('quarter') || text.includes('3-month') || text.includes('3 month') || text.includes('90-day')) {
          durationDays = 90;
        } else if (text.includes('annual') || text.includes('year') || text.includes('12-month') || text.includes('365')) {
          durationDays = 365;
        } else if (text.includes('week') || text.includes('7-day')) {
          durationDays = 7;
        } else if (text.includes('monthly') || text.includes('1-month') || text.includes('1 month') || text.includes('30-day') || text.includes('muscle core') || text.includes('pro')) {
          durationDays = 30;
        }

        const expiryTime = purchaseDate.getTime() + (durationDays * 24 * 60 * 60 * 1000);
        const daysLeft = Math.ceil((expiryTime - Date.now()) / (1000 * 60 * 60 * 24));
        const expiryDateStr = new Date(expiryTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

        return {
          daysRemaining: daysLeft,
          expiryDateStr
        };
      }
    }

    if (member.joined || member.joinedDate) {
      try {
        const parsedJoined = new Date(member.joined || member.joinedDate);
        if (!isNaN(parsedJoined.getTime())) {
          const expiryTime = parsedJoined.getTime() + (30 * 24 * 60 * 60 * 1000);
          const daysLeft = Math.ceil((expiryTime - Date.now()) / (1000 * 60 * 60 * 24));
          return {
            daysRemaining: daysLeft > -300 ? daysLeft : 28,
            expiryDateStr: new Date(expiryTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          };
        }
      } catch (e) {}
    }

    const defaultExpiryTime = Date.now() + (28 * 24 * 60 * 60 * 1000);
    return {
      daysRemaining: 28,
      expiryDateStr: new Date(defaultExpiryTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };
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
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error("Failed to parse apex_trainer_diets:", e);
      }
    }
    return defaultDiets;
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
  const [unreadChatsByMember, setUnreadChatsByMember] = useState({});
  const prevTrainerChatCountRef = useRef(0);
  const trainerChatScrollRef = useRef(null);

  const currentCoachName = currentUser?.name || 'Coach Marcus Vance';

  // Mark chat as read when selecting member or on mount
  useEffect(() => {
    if (selectedChatMember) {
      const currentMemberObj = members.find((m) => m.name.toLowerCase() === selectedChatMember.toLowerCase());
      trainerApi.markChatRead(selectedChatMember, currentMemberObj?.email || '', currentCoachName);
      setUnreadChatsByMember((prev) => ({ ...prev, [selectedChatMember]: 0 }));
    }
  }, [selectedChatMember, currentCoachName]);

  // Scroll trainer chat box to bottom when member or chats change
  useEffect(() => {
    if (trainerChatScrollRef.current) {
      trainerChatScrollRef.current.scrollTop = trainerChatScrollRef.current.scrollHeight;
    }
  }, [selectedChatMember, allMemberChats]);

  // Sync real-time member chats automatically
  useEffect(() => {
    const syncChat = async () => {
      try {
        const res = await trainerApi.getChatHistory('', '', currentCoachName);
        if (res && res.success) {
          const chatData = Array.isArray(res.allHistory) ? res.allHistory : (Array.isArray(res.data) ? res.data : []);
          
          if (res.unreadByMember) {
            setUnreadChatsByMember(res.unreadByMember);
          }

          // Trigger toast alert for newly arrived athlete messages
          if (chatData.length > prevTrainerChatCountRef.current && prevTrainerChatCountRef.current > 0) {
            const newMemberMsgs = chatData.filter(m => m.sender === 'member' && !m.read);
            if (newMemberMsgs.length > 0) {
              const latest = newMemberMsgs[newMemberMsgs.length - 1];
              CustomSwal.fire({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 4500,
                timerProgressBar: true,
                icon: 'info',
                title: `💬 New Message from ${latest.memberName || 'Athlete'}`,
                text: latest.text,
                background: '#121319',
                color: '#fff'
              });
            }
          }
          prevTrainerChatCountRef.current = chatData.length;

          if (chatData.length > 0) {
            setAllMemberChats(chatData);

            // Dynamically add any member who sent a message to the members list if not already present
            chatData.forEach((msg) => {
              if (msg.memberName && !msg.memberName.toLowerCase().startsWith('coach')) {
                setMembers((prev) => {
                  if (!prev.some((m) => m.name.toLowerCase() === msg.memberName.toLowerCase())) {
                    return [
                      ...prev,
                      {
                        id: `MEM-${10890 + prev.length}`,
                        name: msg.memberName,
                        email: msg.clientEmail || `${msg.memberName.toLowerCase().replace(/\s+/g, '.')}@apex.com`,
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
        }
      } catch (e) {}
    };

    syncChat();
    const interval = setInterval(syncChat, 2000);
    return () => clearInterval(interval);
  }, [currentCoachName]);

  const handleSendTrainerMsgToMember = async (targetMemberName) => {
    const activeMember = targetMemberName || selectedChatMember || 'Ethan Hunt';
    const targetMemberObj = members.find((m) => m.name.toLowerCase() === activeMember.toLowerCase());
    const clientEmail = targetMemberObj?.email || '';
    const inputVal = singleChatInput.trim() || (memberInputs[activeMember] || '').trim();
    if (!inputVal) return;

    const now = new Date();
    const timeStr = now.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }) + ', ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newMsg = {
      id: `c-${Date.now()}`,
      memberName: activeMember,
      clientEmail: clientEmail,
      coachName: currentCoachName,
      sender: 'coach',
      text: inputVal,
      time: timeStr,
      read: false
    };

    const updatedChats = [...allMemberChats, newMsg];
    setAllMemberChats(updatedChats);
    setSingleChatInput('');
    setMemberInputs((prev) => ({ ...prev, [activeMember]: '' }));
    prevTrainerChatCountRef.current = prevTrainerChatCountRef.current + 1;

    await trainerApi.sendChatMessage(inputVal, 'coach', activeMember, clientEmail, currentCoachName);
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
      if (fetchedMembers && fetchedMembers.length > 0) {
        setMembers((prev) => {
          const merged = [...prev];
          fetchedMembers.forEach((fm) => {
            if (fm.name && !merged.some((m) => m.name.toLowerCase() === fm.name.toLowerCase())) {
              merged.push(fm);
            }
          });
          return merged;
        });
      }

      // 2. Workout Plans
      const fetchedWorkouts = await trainerApi.getWorkouts();
      if (fetchedWorkouts && fetchedWorkouts.length > 0) {
        setWorkoutPlans(fetchedWorkouts);
      } else {
        setWorkoutPlans(defaultWorkouts);
      }

      // 3. Diet Plans
      const fetchedDiets = await trainerApi.getDiets();
      if (fetchedDiets && fetchedDiets.length > 0) {
        setDietPlans(fetchedDiets);
      } else {
        setDietPlans((prev) => (prev && prev.length > 0 ? prev : defaultDiets));
      }

      // 4. Schedule Agenda
      const fetchedAgenda = await trainerApi.getSchedule();
      if (fetchedAgenda && fetchedAgenda.length > 0) setAgenda(fetchedAgenda);

      // 5. Attendance Logs
      const fetchedAttendance = await trainerApi.getAttendance();
      if (fetchedAttendance && fetchedAttendance.length > 0) setAttendanceLogs(fetchedAttendance);
    }
    loadTrainerBackendData();
  }, []);

  // Auto-sync client names from schedule agenda into members roster
  useEffect(() => {
    if (agenda && agenda.length > 0) {
      setMembers((prev) => {
        let changed = false;
        const updated = [...prev];
        agenda.forEach((item) => {
          if (item.client && !updated.some((m) => m.name.toLowerCase() === item.client.toLowerCase())) {
            updated.push({
              id: `MEM-${Math.floor(10000 + Math.random() * 90000)}`,
              name: item.client,
              email: `${item.client.toLowerCase().replace(/\s+/g, '.')}@apex.com`,
              tier: 'Pro Member',
              status: 'Active',
              joined: 'Recent Schedule',
              goal: item.objective || item.routine || 'Personal Coaching',
              diet: 'Prescribed Protocol',
              workout: item.routine || 'Custom Training Block',
              attendance: 96
            });
            changed = true;
          }
        });
        return changed ? updated : prev;
      });
    }
  }, [agenda]);

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

  // Client Expiration & 1-Week Advance Renewal Reminder State
  const [sentReminders, setSentReminders] = useState({});

  const handleSendClientRenewalReminder = async (m, daysRemaining) => {
    const daysNum = daysRemaining !== undefined ? daysRemaining : (m.daysLeft !== undefined ? m.daysLeft : 5);
    const coach = currentUser?.name || 'Coach';
    
    try {
      await fetch('http://localhost:5000/api/trainer/send-renewal-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberEmail: m.email,
          memberName: m.name,
          coachName: coach,
          daysLeft: daysNum,
          packageType: m.tier || 'Coaching Pass'
        })
      });

      setSentReminders((prev) => ({ ...prev, [m.email || m.name]: true }));

      // Append message in local chat
      setChatHistory((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}`,
          sender: 'coach',
          text: `🔔 Renewal Reminder: Hi ${m.name}! Your coaching plan expires in ${daysNum} days. Please renew to keep your coaching schedule and workouts active.`,
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        }
      ]);

      CustomSwal.fire({
        icon: 'success',
        title: 'Reminder Sent! 🔔',
        html: `<p style="color:#fff;">Automated 1-week renewal reminder dispatched to <strong>${m.name}</strong> (${m.email || 'Client'}).</p>`,
        background: '#0d0d14',
        color: '#fff',
        confirmButtonColor: '#ff5e00'
      });
    } catch (err) {
      console.warn("Could not dispatch renewal reminder:", err);
      CustomSwal.fire({
        icon: 'success',
        title: 'Reminder Dispatched! 🔔',
        text: `Renewal reminder dispatched to ${m.name}!`
      });
    }
  };

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

  // Food Menu Catalog Items State
  const initialFoodCatalog = [
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

  const [foodCatalog, setFoodCatalog] = useState(() => {
    const saved = localStorage.getItem('apex_food_menu_catalog');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return initialFoodCatalog;
  });

  useEffect(() => {
    localStorage.setItem('apex_food_menu_catalog', JSON.stringify(foodCatalog));
  }, [foodCatalog]);

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

  // Add Custom Food Item into Catalog
  const handleAddNewCatalogFood = async () => {
    const { value: formValues } = await CustomSwal.fire({
      title: 'Add New Food Item to Catalog',
      html: `
        <div style="text-align:left; color:#fff; display:flex; flex-direction:column; gap:0.6rem;">
          <div>
            <label style="font-size:0.75rem; color:#aaa; display:block; margin-bottom:0.2rem;">Food Item Name:</label>
            <input id="swal-food-name" class="swal2-input" placeholder="e.g. Quinoa Bowl" style="margin:0; width:100%; box-sizing:border-box;">
          </div>
          <div style="display:flex; gap:0.5rem;">
            <div style="flex:1;">
              <label style="font-size:0.75rem; color:#aaa; display:block; margin-bottom:0.2rem;">Category:</label>
              <select id="swal-food-cat" class="swal2-input" style="margin:0; width:100%; background:#12121c; color:#fff; box-sizing:border-box;">
                <option value="Proteins">Proteins</option>
                <option value="Carbs">Carbs</option>
                <option value="Fats">Fats</option>
                <option value="Pre/Post Workout">Pre/Post Workout</option>
                <option value="Night">Night</option>
              </select>
            </div>
            <div style="flex:1;">
              <label style="font-size:0.75rem; color:#aaa; display:block; margin-bottom:0.2rem;">Emoji Icon:</label>
              <input id="swal-food-icon" class="swal2-input" placeholder="🥗" value="🥗" style="margin:0; width:100%; box-sizing:border-box;">
            </div>
          </div>
          <div style="display:flex; gap:0.5rem;">
            <div style="flex:1;">
              <label style="font-size:0.75rem; color:#aaa; display:block; margin-bottom:0.2rem;">Portion:</label>
              <input id="swal-food-portion" class="swal2-input" placeholder="1 cup (180g)" style="margin:0; width:100%; box-sizing:border-box;">
            </div>
            <div style="flex:1;">
              <label style="font-size:0.75rem; color:#aaa; display:block; margin-bottom:0.2rem;">Calories (kcal):</label>
              <input id="swal-food-cals" type="number" class="swal2-input" placeholder="220" style="margin:0; width:100%; box-sizing:border-box;">
            </div>
          </div>
          <div style="display:flex; gap:0.5rem;">
            <div style="flex:1;">
              <label style="font-size:0.75rem; color:#aaa; display:block; margin-bottom:0.2rem;">Protein (g):</label>
              <input id="swal-food-p" type="number" class="swal2-input" placeholder="15" style="margin:0; width:100%; box-sizing:border-box;">
            </div>
            <div style="flex:1;">
              <label style="font-size:0.75rem; color:#aaa; display:block; margin-bottom:0.2rem;">Carbs (g):</label>
              <input id="swal-food-c" type="number" class="swal2-input" placeholder="30" style="margin:0; width:100%; box-sizing:border-box;">
            </div>
            <div style="flex:1;">
              <label style="font-size:0.75rem; color:#aaa; display:block; margin-bottom:0.2rem;">Fats (g):</label>
              <input id="swal-food-f" type="number" class="swal2-input" placeholder="5" style="margin:0; width:100%; box-sizing:border-box;">
            </div>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Add to Catalog 🥗',
      confirmButtonColor: '#00f0ff',
      preConfirm: () => {
        const name = document.getElementById('swal-food-name').value.trim();
        const category = document.getElementById('swal-food-cat').value;
        const icon = document.getElementById('swal-food-icon').value.trim() || '🥗';
        const portion = document.getElementById('swal-food-portion').value.trim() || '1 serving';
        const calories = parseInt(document.getElementById('swal-food-cals').value) || 150;
        const protein = parseInt(document.getElementById('swal-food-p').value) || 10;
        const carbs = parseInt(document.getElementById('swal-food-c').value) || 20;
        const fats = parseInt(document.getElementById('swal-food-f').value) || 5;

        if (!name) {
          CustomSwal.showValidationMessage('Please enter a food item name');
          return false;
        }

        return { name, category, icon, portion, calories, protein, carbs, fats };
      }
    });

    if (formValues) {
      const newItem = {
        id: `f-custom-${Date.now()}`,
        ...formValues
      };
      setFoodCatalog((prev) => [...prev, newItem]);
      CustomSwal.fire({
        icon: 'success',
        title: 'Food Item Added! 🥗',
        text: `"${formValues.name}" has been added to the Food Items Catalog!`
      });
    }
  };

  const handleDeleteCatalogFood = (foodId) => {
    setFoodCatalog((prev) => prev.filter((item) => item.id !== foodId));
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

    // 3. Dispatch chat notification to client terminal
    const targetMemberObj = members.find(m => m.name && m.name.toLowerCase() === targetName.toLowerCase());
    const clientEmail = targetMemberObj?.email || `${targetName.toLowerCase().replace(/\s+/g, '')}@apex.com`;

    const dispatchMsg = {
      id: `c-${Date.now()}`,
      sender: 'coach',
      memberName: targetName,
      clientEmail: clientEmail,
      coachName: currentCoachName,
      text: `🥗 [DIET PLAN ASSIGNED] Coach ${currentCoachName} has assigned you the nutrition protocol: "${dietObj.name}" (${dietObj.calories || 'Custom kcal'}). Check your Prescribed Diet Plan terminal!`,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      read: false
    };

    try {
      const savedChat = JSON.parse(localStorage.getItem('apex_trainer_chat_history') || '[]');
      savedChat.push(dispatchMsg);
      localStorage.setItem('apex_trainer_chat_history', JSON.stringify(savedChat));
      setAllMemberChats((prev) => [...prev, dispatchMsg]);
      trainerApi.sendChatMessage(dispatchMsg.text, 'coach', targetName, clientEmail, currentCoachName);
    } catch (e) {}

    // 4. Call Node.js Express backend API
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

  const handleDeleteDiet = async (dObj) => {
    if (!dObj) return;
    const confirmRes = await CustomSwal.fire({
      icon: 'warning',
      title: `Delete Diet Plan?`,
      html: `<span style="color:#fff;">Are you sure you want to remove <strong>${dObj.name}</strong> from nutrition protocols?</span>`,
      showCancelButton: true,
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#ff3e6c'
    });

    if (confirmRes.isConfirmed) {
      setDietPlans((prev) => prev.filter((d) => (d.id ? d.id !== dObj.id : d.name !== dObj.name)));
      if (dObj.id) {
        await trainerApi.deleteDiet(dObj.id);
      }
      CustomSwal.fire({
        icon: 'success',
        title: 'Diet Plan Deleted 🗑️',
        text: `Diet plan "${dObj.name}" has been removed.`
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

  useEffect(() => {
    if (members && members.length > 0) {
      if (!attMemberName || !members.some(m => m.name === attMemberName)) {
        setAttMemberName(members[0].name);
      }
    }
  }, [members]);

  // Roster Program Assignment state
  const [assignmentMemberId, setAssignmentMemberId] = useState(null); // id of member currently being assigned to
  const [selectedAssignedWorkout, setSelectedAssignedWorkout] = useState('');
  const [selectedAssignedDiet, setSelectedAssignedDiet] = useState('');

  // --- REAL-TIME CAMERA & BIOMETRICS REMOVED ---




  // --- EVENT HANDLERS ---

  // Handle Agenda/Schedule submission
  const handleAgendaSubmit = async (e) => {
    e.preventDefault();
    const targetClient = client || (members[0]?.name || 'Athlete');
    const routineText = routine.trim();
    const timeText = timeBlock.trim() || `${selectedShiftDay} ${selectedShiftSlot}`;
    if (!routineText || !timeText) return;

    const shiftCat = selectedShiftWindow === 'Morning' ? 'Morning Shift' : 'Evening Shift';

    const newItem = {
      id: `ag-${Date.now()}`,
      timeBlock: timeText,
      time: timeText,
      client: targetClient,
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

    // Persist schedule item and dispatch chat notification to member terminal
    try {
      const savedAgenda = JSON.parse(localStorage.getItem('apex_trainer_agenda') || '[]');
      savedAgenda.unshift(newItem);
      localStorage.setItem('apex_trainer_agenda', JSON.stringify(savedAgenda));

      const targetMemberObj = members.find(m => m.name && m.name.toLowerCase() === targetClient.toLowerCase());
      const clientEmail = targetMemberObj?.email || `${targetClient.toLowerCase().replace(/\s+/g, '')}@apex.com`;

      const dispatchMsg = {
        id: `c-${Date.now()}`,
        sender: 'coach',
        memberName: targetClient,
        clientEmail: clientEmail,
        coachName: currentCoachName,
        text: `📅 [SCHEDULE DISPATCH] Coach ${currentCoachName} scheduled session for ${targetClient}: "${routineText}" on ${timeText} (${shiftCat}). Check your Schedule & Trainer tab!`,
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        read: false
      };

      const savedChat = JSON.parse(localStorage.getItem('apex_trainer_chat_history') || '[]');
      savedChat.push(dispatchMsg);
      localStorage.setItem('apex_trainer_chat_history', JSON.stringify(savedChat));
      setAllMemberChats((prev) => [...prev, dispatchMsg]);
      trainerApi.sendChatMessage(dispatchMsg.text, 'coach', targetClient, clientEmail, currentCoachName);
    } catch (err) {
      console.warn("Schedule sync storage error:", err);
    }

    if (CustomSwal) {
      CustomSwal.fire({
        icon: 'success',
        title: 'Training Session Scheduled & Shared 📅',
        html: `<div style="text-align:center;color:#fff;">
          <p style="margin-bottom:0.8rem;">Session reserved for <strong>${targetClient}</strong> during <strong>${shiftCat}</strong> (${timeText})!</p>
          <div style="background:rgba(0,240,255,0.08);border:1px solid #00f0ff;padding:0.8rem;border-radius:6px;font-size:0.85rem;color:#00f0ff;">
            ✓ Synced to Member Panel -> Trainer & Schedule tab<br/>
            ✓ Dispatch notification sent to ${targetClient}'s terminal
          </div>
        </div>`
      });
    }
  };

  // Remove/Complete agenda sessions
  const handleCompleteSession = async (item) => {
    if (!item) return;
    const updatedAgenda = agenda.map((it) => (it.id === item.id ? { ...it, status: 'Completed' } : it));
    setAgenda(updatedAgenda);
    localStorage.setItem('apex_trainer_agenda', JSON.stringify(updatedAgenda));

    if (item.id) {
      await trainerApi.updateScheduleStatus(item.id, 'Completed');
    }

    // Notify client via chat
    const targetClient = item.client;
    const targetMemberObj = members.find(m => m.name && m.name.toLowerCase() === targetClient.toLowerCase());
    const clientEmail = targetMemberObj?.email || `${targetClient.toLowerCase().replace(/\s+/g, '')}@apex.com`;

    const dispatchMsg = {
      id: `c-${Date.now()}`,
      sender: 'coach',
      memberName: targetClient,
      clientEmail: clientEmail,
      coachName: currentCoachName,
      text: `✅ [SESSION COMPLETED] Coach ${currentCoachName} has marked your session "${item.routine || item.objective}" (${item.timeBlock || item.time}) as Completed! Great job! 💪`,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      read: false
    };

    try {
      const savedChat = JSON.parse(localStorage.getItem('apex_trainer_chat_history') || '[]');
      savedChat.push(dispatchMsg);
      localStorage.setItem('apex_trainer_chat_history', JSON.stringify(savedChat));
      setAllMemberChats((prev) => [...prev, dispatchMsg]);
      trainerApi.sendChatMessage(dispatchMsg.text, 'coach', targetClient, clientEmail, currentCoachName);
    } catch (e) {}

    CustomSwal.fire({
      icon: 'success',
      title: 'Session Marked Completed ✅',
      text: `Training session for ${targetClient} is completed!`
    });
  };

  const handleCancelSession = async (item) => {
    if (!item) return;

    const confirmRes = await CustomSwal.fire({
      icon: 'warning',
      title: `Cancel Session?`,
      html: `<span style="color:#fff;">Are you sure you want to cancel session for <strong>${item.client}</strong> (${item.timeBlock || item.time})?</span>`,
      showCancelButton: true,
      confirmButtonText: 'Yes, Cancel',
      cancelButtonText: 'No, Keep',
      confirmButtonColor: '#ff3e6c'
    });

    if (!confirmRes.isConfirmed) return;

    const updatedAgenda = agenda.filter((it) => it.id !== item.id);
    setAgenda(updatedAgenda);
    localStorage.setItem('apex_trainer_agenda', JSON.stringify(updatedAgenda));

    if (item.id) {
      await trainerApi.cancelScheduleSession(item.id);
    }

    // Notify client via chat
    const targetClient = item.client;
    const targetMemberObj = members.find(m => m.name && m.name.toLowerCase() === targetClient.toLowerCase());
    const clientEmail = targetMemberObj?.email || `${targetClient.toLowerCase().replace(/\s+/g, '')}@apex.com`;

    const dispatchMsg = {
      id: `c-${Date.now()}`,
      sender: 'coach',
      memberName: targetClient,
      clientEmail: clientEmail,
      coachName: currentCoachName,
      text: `⚠️ [SESSION CANCELLED] Session "${item.routine || item.objective}" (${item.timeBlock || item.time}) was cancelled by Coach ${currentCoachName}.`,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      read: false
    };

    try {
      const savedChat = JSON.parse(localStorage.getItem('apex_trainer_chat_history') || '[]');
      savedChat.push(dispatchMsg);
      localStorage.setItem('apex_trainer_chat_history', JSON.stringify(savedChat));
      setAllMemberChats((prev) => [...prev, dispatchMsg]);
      trainerApi.sendChatMessage(dispatchMsg.text, 'coach', targetClient, clientEmail, currentCoachName);
    } catch (e) {}

    CustomSwal.fire({
      icon: 'info',
      title: 'Session Cancelled 🗑️',
      text: `Session for ${targetClient} has been cancelled.`
    });
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

  const handleDeleteWorkout = async (wObj) => {
    if (!wObj) return;
    const confirmRes = await CustomSwal.fire({
      icon: 'warning',
      title: `Delete Workout Program?`,
      html: `<span style="color:#fff;">Are you sure you want to remove <strong>${wObj.name}</strong> from conditioning templates?</span>`,
      showCancelButton: true,
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#ff3e6c'
    });

    if (confirmRes.isConfirmed) {
      setWorkoutPlans((prev) => prev.filter((w) => (w.id ? w.id !== wObj.id : w.name !== wObj.name)));
      if (wObj.id) {
        await trainerApi.deleteWorkout(wObj.id);
      }
      CustomSwal.fire({
        icon: 'success',
        title: 'Program Deleted 🗑️',
        text: `Program "${wObj.name}" has been removed.`
      });
    }
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

          {/* BROADCASTED SYSTEM ALERTS BANNER (Compact & Non-intrusive, Same as Member Panel) */}
          {broadcastAlerts
            .filter(a => {
              if (!a || !a.id) return false;
              if (dismissedAlerts.includes(a.id)) return false;
              if (a.date) {
                const alertTime = new Date(a.date).getTime();
                if (!isNaN(alertTime) && (Date.now() - alertTime > 7 * 24 * 60 * 60 * 1000)) {
                  return false;
                }
              }
              return true;
            })
            .map((alt) => {
              const typeInfo = {
                holiday: { bg: 'rgba(255, 62, 108, 0.08)', border: '#ff3e6c', color: '#ff3e6c', label: '🏖️ Holiday Notice' },
                event: { bg: 'rgba(0, 240, 255, 0.08)', border: '#00f0ff', color: '#00f0ff', label: '🏆 Club Event' },
                maintenance: { bg: 'rgba(255, 159, 0, 0.08)', border: '#ff9f00', color: '#ff9f00', label: '⚠️ Maintenance' },
                general: { bg: 'rgba(255, 94, 0, 0.08)', border: 'var(--accent-orange, #ff5e00)', color: 'var(--accent-orange, #ff5e00)', label: '📢 Announcement' }
              }[alt.type] || { bg: 'rgba(255, 94, 0, 0.08)', border: 'var(--accent-orange, #ff5e00)', color: 'var(--accent-orange, #ff5e00)', label: '📢 Announcement' };

              return (
                <div key={alt.id} style={{
                  background: typeInfo.bg,
                  border: `1px solid ${typeInfo.border}`,
                  marginBottom: '1rem',
                  padding: '0.75rem 1.2rem',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      color: typeInfo.color,
                      padding: '0.2rem 0.55rem',
                      background: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '4px',
                      border: `1px solid ${typeInfo.border}`,
                      letterSpacing: '0.04em'
                    }}>
                      {typeInfo.label}
                    </span>
                    <span style={{ color: 'var(--text-white)', fontWeight: 800, fontSize: '0.88rem' }}>{alt.title}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem', wordBreak: 'break-word' }}>— {alt.message}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const updatedDismissed = [...dismissedAlerts, alt.id];
                      setDismissedAlerts(updatedDismissed);
                      localStorage.setItem('dismissed_trainer_alerts', JSON.stringify(updatedDismissed));
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      fontSize: '1.3rem',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      lineHeight: 1
                    }}
                  >
                    &times;
                  </button>
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

          {/* CLIENT SUBSCRIPTION EXPIRATIONS & 1-WEEK RENEWAL WATCHLIST */}
          <div className="db-card" style={{ marginBottom: '1.5rem', border: '1px solid rgba(255, 94, 0, 0.3)', background: 'var(--bg-card)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.8rem', flexWrap: 'wrap', gap: '0.8rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ fontSize: '1.4rem' }}>⏳</span>
                <div>
                  <h4 style={{ color: 'var(--text-white)', margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>Client Plan Expirations & 1-Week Renewal Watchlist</h4>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Automated tracking for clients expiring within 7 days or requiring package renewal</span>
                </div>
              </div>
              <span style={{ fontSize: '0.72rem', background: 'rgba(255, 94, 0, 0.12)', color: '#ff5e00', border: '1px solid rgba(255, 94, 0, 0.3)', padding: '0.25rem 0.7rem', borderRadius: '20px', fontWeight: 700, textTransform: 'uppercase' }}>
                🔔 7-Day Advance Alert Engine
              </span>
            </div>

            {members.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0.5rem 0' }}>No active clients assigned.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {members.map((m, idx) => {
                  const expiryInfo = calculateClientExpiry(m, trainerClientPayments);
                  const daysRemaining = expiryInfo.daysRemaining;
                  const expiryDateStr = expiryInfo.expiryDateStr;
                  const isExpiringSoon = daysRemaining <= 7 && daysRemaining > 0;
                  const isExpired = daysRemaining <= 0;
                  const isSent = sentReminders[m.email || m.name];

                  return (
                    <div
                      key={m.id || idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: isExpired ? 'rgba(239, 68, 68, 0.08)' : isExpiringSoon ? 'rgba(255, 94, 0, 0.08)' : 'var(--bg-card-hover, rgba(255, 255, 255, 0.03))',
                        border: `1px solid ${isExpired ? 'rgba(239, 68, 68, 0.3)' : isExpiringSoon ? 'rgba(255, 94, 0, 0.3)' : 'var(--border-color)'}`,
                        borderRadius: '8px',
                        padding: '0.85rem 1.1rem',
                        gap: '1rem',
                        flexWrap: 'wrap'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
                        <div style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '50%',
                          background: isExpired ? '#ef4444' : isExpiringSoon ? '#ff5e00' : 'var(--accent-volt)',
                          color: '#000',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '0.9rem'
                        }}>
                          {m.name ? m.name.charAt(0).toUpperCase() : 'A'}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.15rem' }}>
                            <strong style={{ color: 'var(--text-white)', fontSize: '0.92rem', fontWeight: 800 }}>{m.name}</strong>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>({m.email || 'client@apex.com'})</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                            <span style={{ color: 'var(--text-white)', fontWeight: 600 }}>📋 {m.tier || 'Personal Coaching Package'}</span>
                            <span>•</span>
                            <span>Expires: <strong style={{ color: 'var(--text-white)', fontWeight: 700 }}>{expiryDateStr}</strong></span>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          padding: '0.25rem 0.65rem',
                          borderRadius: '4px',
                          background: isExpired ? 'rgba(239, 68, 68, 0.15)' : isExpiringSoon ? 'rgba(255, 94, 0, 0.15)' : 'rgba(0, 255, 102, 0.1)',
                          color: isExpired ? '#ef4444' : isExpiringSoon ? '#ff5e00' : '#00ff66',
                          border: `1px solid ${isExpired ? '#ef4444' : isExpiringSoon ? '#ff5e00' : '#00ff66'}`
                        }}>
                          {isExpired ? '❌ Plan Expired' : isExpiringSoon ? `⏳ ${daysRemaining} Days Left (1-Wk Notice)` : `✓ ${daysRemaining} Days Left`}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleSendClientRenewalReminder(m, daysRemaining)}
                          disabled={isSent}
                          style={{
                            padding: '0.45rem 0.9rem',
                            fontSize: '0.76rem',
                            fontWeight: 700,
                            borderRadius: '6px',
                            background: isSent ? 'rgba(255,255,255,0.05)' : isExpired ? '#ef4444' : '#ff5e00',
                            color: isSent ? 'var(--text-muted)' : '#ffffff',
                            border: 'none',
                            cursor: isSent ? 'default' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            transition: 'all 0.2s'
                          }}
                        >
                          {isSent ? '✓ Reminder Sent' : '🔔 Send Renewal Reminder'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Agenda & Forms Grid */}
          <div className="db-grid-row">
            {/* Today's Agenda Card */}
            <div className="db-card flex-card">
              <h4>Today's Client Agenda</h4>
              <p className="card-subtitle">Detailed roster details and fitness objectives</p>

              <ul className="agenda-list" style={{ listStyle: 'none', padding: 0 }}>
                {agenda.length === 0 ? (
                  <li style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', padding: '2rem 1.2rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                    No coaching appointments scheduled for today.
                  </li>
                ) : (
                  agenda.map((item, idx) => {
                    const rawTime = item.time || item.timeBlock || '09:00 AM';
                    const isTomorrow = rawTime.toLowerCase().includes('tomorrow');
                    const cleanTime = rawTime.replace(/today\s*/i, '').replace(/tomorrow\s*/i, '').trim();
                    const isCompleted = item.status === 'Completed' || item.status === 'completed';
                    const statusText = (item.status || 'CONFIRMED').toUpperCase();

                    return (
                      <li
                        key={item.id || idx}
                        className="agenda-item"
                        style={{
                          animation: 'slideTimelineItem 0.4s ease forwards',
                          opacity: 1,
                          transform: 'translateY(0)',
                          marginBottom: '0.8rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.9rem 1.1rem',
                          background: 'var(--bg-card, rgba(255,255,255,0.02))',
                          border: isTomorrow ? '1px solid rgba(255, 159, 0, 0.3)' : '1px solid var(--border-color)',
                          borderRadius: '8px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.2rem' }}>
                            <span style={{
                              fontSize: '0.62rem',
                              fontWeight: 800,
                              textTransform: 'uppercase',
                              padding: '0.1rem 0.45rem',
                              borderRadius: '3px',
                              background: isTomorrow ? 'rgba(255, 159, 0, 0.15)' : 'rgba(0, 240, 255, 0.12)',
                              color: isTomorrow ? '#ff9f00' : 'var(--accent-cyan)',
                              border: isTomorrow ? '1px solid rgba(255, 159, 0, 0.3)' : '1px solid rgba(0, 240, 255, 0.2)'
                            }}>
                              {isTomorrow ? 'Tomorrow' : 'Today'}
                            </span>
                            <div className="agenda-time" style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-white)' }}>
                              {cleanTime}
                            </div>
                          </div>

                          <div className="agenda-details">
                            <h5 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-white)' }}>{item.client}</h5>
                            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>{item.objective || item.routine || 'Coaching Session'}</p>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <span className={`agenda-badge check ${isCompleted ? 'paid' : ''}`} style={{
                            background: isCompleted ? 'rgba(0, 255, 102, 0.1)' : isTomorrow ? 'rgba(255, 159, 0, 0.1)' : 'rgba(0, 240, 255, 0.1)',
                            color: isCompleted ? '#00ff66' : isTomorrow ? '#ff9f00' : 'var(--accent-cyan)',
                            border: isCompleted ? '1px solid rgba(0, 255, 102, 0.3)' : isTomorrow ? '1px solid rgba(255, 159, 0, 0.3)' : '1px solid rgba(0, 240, 255, 0.3)',
                            padding: '0.25rem 0.6rem',
                            borderRadius: '4px',
                            fontWeight: 800,
                            fontSize: '0.68rem',
                            letterSpacing: '0.5px'
                          }}>
                            {statusText}
                          </span>

                          {!isCompleted ? (
                            <div style={{ display: 'flex', gap: '0.35rem' }}>
                              <button
                                type="button"
                                title="Mark Session Completed"
                                onClick={() => handleCompleteSession(item)}
                                style={{
                                  cursor: 'pointer',
                                  padding: '0.3rem 0.6rem',
                                  background: 'rgba(0, 255, 102, 0.12)',
                                  border: '1px solid rgba(0, 255, 102, 0.3)',
                                  borderRadius: '5px',
                                  color: '#00ff66',
                                  fontSize: '0.78rem',
                                  fontWeight: 800,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.25rem',
                                  transition: 'all 0.2s ease'
                                }}
                              >
                                ✓ Complete
                              </button>
                              <button
                                type="button"
                                title="Cancel Session"
                                onClick={() => handleCancelSession(item)}
                                style={{
                                  cursor: 'pointer',
                                  padding: '0.3rem 0.5rem',
                                  background: 'rgba(255, 62, 108, 0.12)',
                                  border: '1px solid rgba(255, 62, 108, 0.3)',
                                  borderRadius: '5px',
                                  color: '#ff3e6c',
                                  fontSize: '0.78rem',
                                  fontWeight: 800,
                                  transition: 'all 0.2s ease'
                                }}
                              >
                                ✖
                              </button>
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.72rem', color: '#00ff66', fontWeight: 700, padding: '0 0.3rem' }}>Done ✓</span>
                          )}
                        </div>
                      </li>
                    );
                  })
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

          {/* Client Coaching Payments & Invoices Card */}
          <div className="db-card flex-card" style={{ marginTop: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '0.8rem' }}>
              <div>
                <h4 style={{ margin: 0, textTransform: 'uppercase', fontFamily: 'var(--font-display)', fontWeight: 800 }}>Client Coaching Payments & Receipts</h4>
                <p className="card-subtitle" style={{ margin: '0.2rem 0 0 0' }}>Verified 1-on-1 personal training packages and coaching invoices</p>
              </div>
              <span className="badge badge-success" style={{ background: 'rgba(0, 255, 102, 0.12)', color: '#00ff66', border: '1px solid rgba(0, 255, 102, 0.3)', padding: '0.3rem 0.7rem', borderRadius: '15px', fontWeight: 800 }}>
                ● Razorpay Payouts Linked
              </span>
            </div>

            <div className="table-wrapper">
              <table className="db-table">
                <thead>
                  <tr>
                    <th>Receipt No.</th>
                    <th>Athlete Client</th>
                    <th>Mentorship Package</th>
                    <th>Fee Paid</th>
                    <th>Payment Status</th>
                    <th>Invoice</th>
                  </tr>
                </thead>
                <tbody>
                  {trainerClientPayments.length === 0 ? (
                    // Default / fallback coaching records
                    [
                      {
                        receiptNumber: 'MH-RCP-TRN-90210',
                        orderId: 'ORD-TRN-101',
                        paymentId: 'pay_test_trn01',
                        userName: 'Ethan Hunt',
                        userEmail: 'ethan.hunt@apex.com',
                        userPhone: '+91 98765 43210',
                        title: '1-Month Personal Coaching Package',
                        amount: 5000,
                        status: 'paid',
                        createdAt: new Date().toISOString()
                      },
                      {
                        receiptNumber: 'MH-RCP-TRN-90211',
                        orderId: 'ORD-TRN-102',
                        paymentId: 'pay_test_trn02',
                        userName: 'Sarah Connor',
                        userEmail: 'sarah.connor@apex.com',
                        userPhone: '+91 98765 43211',
                        title: '3-Month Transformation Package',
                        amount: 13000,
                        status: 'paid',
                        createdAt: new Date(Date.now() - 86400000 * 3).toISOString()
                      }
                    ].map((p, idx) => (
                      <tr key={idx}>
                        <td style={{ fontFamily: 'monospace', color: 'var(--accent-cyan)', fontWeight: 700 }}>{p.receiptNumber}</td>
                        <td><strong>{p.userName}</strong><br/><span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{p.userEmail}</span></td>
                        <td>{p.title}</td>
                        <td style={{ color: 'var(--text-white)', fontWeight: 800 }}>₹{p.amount.toLocaleString('en-IN')}</td>
                        <td><span className="status-badge paid">PAID ✓</span></td>
                        <td>
                          <button
                            type="button"
                            onClick={() => setActiveTrainerReceipt(p)}
                            className="outline-btn"
                            style={{ padding: '0.3rem 0.7rem', fontSize: '0.72rem', cursor: 'pointer' }}
                          >
                            📄 Invoice
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    trainerClientPayments.map((p, idx) => (
                      <tr key={p.receiptNumber || idx}>
                        <td style={{ fontFamily: 'monospace', color: 'var(--accent-cyan)', fontWeight: 700 }}>{p.receiptNumber}</td>
                        <td><strong>{p.userName}</strong><br/><span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{p.userEmail}</span></td>
                        <td>{p.title}</td>
                        <td style={{ color: 'var(--text-white)', fontWeight: 800 }}>₹{p.amount.toLocaleString('en-IN')}</td>
                        <td><span className="status-badge paid">PAID ✓</span></td>
                        <td>
                          <button
                            type="button"
                            onClick={() => setActiveTrainerReceipt(p)}
                            className="outline-btn"
                            style={{ padding: '0.3rem 0.7rem', fontSize: '0.72rem', cursor: 'pointer' }}
                          >
                            📄 Invoice
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
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
                      <th>Name & Email</th>
                      <th>Membership Tier</th>
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
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <strong style={{ color: 'var(--text-white)' }}>{m.name}</strong>
                              {unreadChatsByMember[m.name] > 0 && (
                                <span style={{ fontSize: '0.62rem', background: 'var(--accent-volt)', color: '#000', padding: '0.1rem 0.4rem', borderRadius: '10px', fontWeight: 800 }}>
                                  {unreadChatsByMember[m.name]} new
                                </span>
                              )}
                            </div>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{m.email || 'client@apex.com'}</span>
                          </td>
                          <td>
                            <span style={{
                              fontSize: '0.72rem',
                              padding: '0.2rem 0.6rem',
                              borderRadius: '4px',
                              fontWeight: 800,
                              background: m.tier?.includes('VIP') ? 'rgba(0, 240, 255, 0.12)' : m.tier?.includes('Elite') ? 'rgba(198, 255, 0, 0.12)' : 'rgba(255, 94, 0, 0.12)',
                              color: m.tier?.includes('VIP') ? 'var(--accent-cyan)' : m.tier?.includes('Elite') ? 'var(--accent-volt)' : '#ff5e00',
                              border: `1px solid ${m.tier?.includes('VIP') ? 'var(--accent-cyan)' : m.tier?.includes('Elite') ? 'var(--accent-volt)' : '#ff5e00'}`
                            }}>
                              👑 {m.tier || 'Pro Member'}
                            </span>
                          </td>
                          <td>
                            <span style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '4px' }}>
                              {m.level || 'Intermediate'}
                            </span>
                          </td>
                          <td>{m.workout !== 'None' ? <span style={{ color: 'var(--accent-volt)', fontWeight: 700 }}>{m.workout}</span> : <span style={{ color: 'var(--text-dim)' }}>None</span>}</td>
                          <td>{m.diet !== 'None' ? <span style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>{m.diet}</span> : <span style={{ color: 'var(--text-dim)' }}>None</span>}</td>
                          <td><strong style={{ color: 'var(--text-white)' }}>{m.attendance}%</strong></td>
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
                                style={{ padding: '0.4rem 0.7rem', fontSize: '0.72rem', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                              >
                                <span>💬 Chat</span>
                                {unreadChatsByMember[m.name] > 0 && (
                                  <span style={{ background: '#000', color: '#fff', fontSize: '0.62rem', padding: '0.05rem 0.35rem', borderRadius: '8px' }}>
                                    {unreadChatsByMember[m.name]}
                                  </span>
                                )}
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
                    {members.map((m) => {
                      const unread = unreadChatsByMember[m.name] || 0;
                      return (
                        <option key={m.id} value={m.name}>
                          {m.name} ({m.tier}){unread > 0 ? ` [${unread} unread]` : ''}
                        </option>
                      );
                    })}
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
                      ref={trainerChatScrollRef}
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
                background: 'var(--bg-card)',
                color: 'var(--text-white)',
                border: '1px solid var(--border-color)',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.25)',
                borderRadius: '16px',
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <div>
                  <h4>Conditioning Programs</h4>
                  <p className="card-subtitle" style={{ margin: 0 }}>Active workout periods, target muscle split, and exercise sequencing profiles</p>
                </div>
                <span style={{ fontSize: '0.75rem', background: 'rgba(0, 240, 255, 0.1)', color: 'var(--accent-cyan)', padding: '0.25rem 0.6rem', borderRadius: '4px', border: '1px solid rgba(0, 240, 255, 0.2)' }}>
                  Total Plans: {((workoutPlans && workoutPlans.length > 0) ? workoutPlans : defaultWorkouts).length}
                </span>
              </div>

              {(() => {
                const activeList = (workoutPlans && workoutPlans.length > 0) ? workoutPlans : defaultWorkouts;
                const pagedList = activeList.slice((workoutPlanPage - 1) * TRAINER_ITEMS_PER_PAGE, workoutPlanPage * TRAINER_ITEMS_PER_PAGE);

                return (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.2rem', marginTop: '0.8rem' }}>
                      {pagedList.map((w, idx) => (
                        <div
                          key={w.id || idx}
                          style={{
                            background: 'var(--bg-card, rgba(255, 255, 255, 0.02))',
                            border: '1px solid var(--border-color)',
                            borderRadius: '8px',
                            padding: '1.2rem',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                              <h5 style={{ color: 'var(--text-white)', fontWeight: 800, fontSize: '0.98rem', textTransform: 'uppercase', margin: 0 }}>
                                {w.name}
                              </h5>
                              <span style={{ fontSize: '0.65rem', background: 'rgba(198,255,0,0.12)', color: 'var(--accent-volt)', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: 800, border: '1px solid rgba(198,255,0,0.2)' }}>
                                {w.duration || '4 weeks'}
                              </span>
                            </div>
                            <p style={{ color: 'var(--accent-cyan)', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700, margin: '0.2rem 0 0.8rem 0' }}>
                              Target Split: {w.target}
                            </p>
                            <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', padding: '0.8rem', borderRadius: '6px', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                              {w.exercises}
                            </div>
                          </div>

                          <div style={{ marginTop: '1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                            <button
                              type="button"
                              onClick={() => handleDeleteWorkout(w)}
                              style={{ background: 'rgba(255,62,108,0.1)', border: '1px solid rgba(255,62,108,0.25)', color: '#ff3e6c', padding: '0.35rem 0.6rem', borderRadius: '5px', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer' }}
                              title="Delete Program Template"
                            >
                              🗑️ Delete
                            </button>

                            <button
                              type="button"
                              onClick={async () => {
                                if (!members || members.length === 0) {
                                  CustomSwal.fire({ icon: 'warning', title: 'No Athletes Available', text: 'No registered athletes found in roster.' });
                                  return;
                                }

                                const inputOptions = {};
                                members.forEach((m) => {
                                  inputOptions[m.id || m.name] = `${m.name} (${m.tier || 'Pro Member'})`;
                                });

                                const { value: selectedMemberId } = await CustomSwal.fire({
                                  title: `Assign Program: ${w.name}`,
                                  text: 'Select an athlete from your roster to receive this program:',
                                  input: 'select',
                                  inputOptions,
                                  inputPlaceholder: '-- Select Athlete Member --',
                                  showCancelButton: true,
                                  confirmButtonText: 'Assign & Dispatch 🚀',
                                  cancelButtonText: 'Cancel',
                                  confirmButtonColor: '#ff5e00',
                                  inputValidator: (val) => !val && 'Please select a member!'
                                });

                                if (selectedMemberId) {
                                  const targetMember = members.find((m) => m.id === selectedMemberId || m.name === selectedMemberId);
                                  if (targetMember) {
                                    // 1. Update roster state
                                    setMembers((prev) => prev.map((m) => (m.id === targetMember.id ? { ...m, workout: w.name } : m)));

                                    // 2. Persist member assigned workout in localStorage for real-time synchronization
                                    localStorage.setItem(`apex_member_assigned_workout_${targetMember.name.toLowerCase()}`, JSON.stringify(w));

                                    // 3. Dispatch auto notification message into trainer/member chat
                                    const dispatchMsg = {
                                      id: `c-${Date.now()}`,
                                      sender: 'coach',
                                      memberName: targetMember.name,
                                      clientEmail: targetMember.email || '',
                                      coachName: currentCoachName,
                                      text: `🏋️‍♂️ [WORKOUT ASSIGNED] Coach ${currentCoachName} has assigned you the training program: "${w.name}" (${w.duration || '4 weeks'}). Check your Prescribed Workout Program terminal!`,
                                      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                                      read: false
                                    };

                                    const savedChat = JSON.parse(localStorage.getItem('apex_trainer_chat_history') || '[]');
                                    savedChat.push(dispatchMsg);
                                    localStorage.setItem('apex_trainer_chat_history', JSON.stringify(savedChat));
                                    setAllMemberChats((prev) => [...prev, dispatchMsg]);

                                    // 4. API sync
                                    await trainerApi.assignWorkout(w.id || w.name, targetMember.id);
                                    await trainerApi.sendChatMessage(dispatchMsg.text, 'coach', targetMember.name, targetMember.email, currentCoachName);

                                    CustomSwal.fire({
                                      icon: 'success',
                                      title: 'Program Assigned & Shared! 🚀',
                                      html: `<div style="text-align:center;color:#fff;">
                                        <p style="margin-bottom:0.8rem;">Program <strong>${w.name}</strong> assigned to athlete <strong>${targetMember.name}</strong>!</p>
                                        <div style="background:rgba(198,255,0,0.08);border:1px solid #c6ff00;padding:0.8rem;border-radius:6px;font-size:0.85rem;color:#c6ff00;">
                                          ✓ Synced to Athlete Member Terminal<br/>
                                          ✓ Program notification sent to ${targetMember.name}'s chat!
                                        </div>
                                      </div>`
                                    });
                                  }
                                }
                              }}
                              className="outline-btn"
                              style={{ padding: '0.35rem 0.75rem', fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--accent-volt)', borderColor: 'var(--accent-volt)' }}
                            >
                              Quick Assign
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {renderTrainerPagination(
                      workoutPlanPage,
                      Math.ceil(activeList.length / TRAINER_ITEMS_PER_PAGE) || 1,
                      activeList.length,
                      setWorkoutPlanPage,
                      TRAINER_ITEMS_PER_PAGE
                    )}
                  </>
                );
              })()}
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
                  Total Plans: {((dietPlans && dietPlans.length > 0) ? dietPlans : defaultDiets).length}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.2rem', marginTop: '0.8rem' }}>
                {((dietPlans && dietPlans.length > 0) ? dietPlans : defaultDiets)
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
                                <div style={{ marginTop: '0.6rem', padding: '0.8rem', background: 'var(--bg-dark, rgba(255,255,255,0.03))', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.75rem' }}>
                                  {[
                                    { key: 'morning', label: '🌅 Morning', items: d.mealsSchedule.morning },
                                    { key: 'lunch', label: '🥗 Lunch', items: d.mealsSchedule.lunch },
                                    { key: 'preWorkout', label: '⚡ Pre Workout', items: d.mealsSchedule.preWorkout },
                                    { key: 'postWorkout', label: '🥤 Post Workout', items: d.mealsSchedule.postWorkout },
                                    { key: 'night', label: '🌙 Night', items: d.mealsSchedule.night }
                                  ].map((slot) => (
                                    <div key={slot.key} style={{ marginBottom: '0.6rem' }}>
                                      <strong style={{ color: 'var(--accent-volt)', fontSize: '0.75rem', textTransform: 'uppercase' }}>{slot.label}:</strong>
                                      {(!slot.items || slot.items.length === 0) ? (
                                        <div style={{ color: 'var(--text-dim)', fontStyle: 'italic', fontSize: '0.7rem', paddingLeft: '0.5rem' }}>No items scheduled</div>
                                      ) : (
                                        <ul style={{ margin: '0.2rem 0 0 0', paddingLeft: '1.2rem', color: 'var(--text-white)' }}>
                                          {slot.items.map((it, i) => (
                                            <li key={i} style={{ marginBottom: '0.15rem', color: 'var(--text-white)' }}>{it}</li>
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

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                          <button
                            type="button"
                            onClick={async () => {
                              const memberOptions = members.map(m => `<option value="${m.name}">${m.name} (${m.tier || 'Member'})</option>`).join('');
                              const { value: selectedMember } = await CustomSwal.fire({
                                title: `Assign "${d.name}"`,
                                html: `
                                  <div style="text-align:left; color: #fff;">
                                    <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:0.8rem;">
                                      Select an athlete from the roster to assign this diet plan to:
                                    </p>
                                    <select id="swal-assign-member-select" style="width:100%; padding:0.6rem; background:rgba(0,0,0,0.5); color:#fff; border:1px solid var(--accent-volt); border-radius:6px; font-size:0.9rem;">
                                      ${memberOptions}
                                    </select>
                                  </div>
                                `,
                                showCancelButton: true,
                                confirmButtonText: 'Assign Plan 🚀',
                                confirmButtonColor: '#c6ff00',
                                preConfirm: () => {
                                  const sel = document.getElementById('swal-assign-member-select');
                                  return sel ? sel.value : null;
                                }
                              });

                              if (selectedMember) {
                                handleShareAndAssignDiet(d, selectedMember);
                              }
                            }}
                            className="outline-btn"
                            style={{ padding: '0.35rem 0.85rem', fontSize: '0.72rem', textTransform: 'uppercase', borderColor: 'var(--accent-volt)', color: 'var(--accent-volt)' }}
                          >
                            Quick Assign
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteDiet(d)}
                            className="outline-btn"
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.72rem', textTransform: 'uppercase', borderColor: '#ff3e6c', color: '#ff3e6c' }}
                            title="Delete Diet Plan"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {renderTrainerPagination(
                dietPlanPage,
                Math.ceil((((dietPlans && dietPlans.length > 0) ? dietPlans : defaultDiets).length) / TRAINER_ITEMS_PER_PAGE) || 1,
                ((dietPlans && dietPlans.length > 0) ? dietPlans : defaultDiets).length,
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

                {/* --- LIVE FORM MACRO SPLIT PREVIEW --- */}
                {((parseInt(newDietProtein) || 0) + (parseInt(newDietCarbs) || 0) + (parseInt(newDietFats) || 0)) > 0 && (() => {
                  const pGrams = parseInt(newDietProtein) || 0;
                  const cGrams = parseInt(newDietCarbs) || 0;
                  const fGrams = parseInt(newDietFats) || 0;
                  const totalG = pGrams + cGrams + fGrams || 1;
                  const pPct = Math.round((pGrams / totalG) * 100);
                  const cPct = Math.round((cGrams / totalG) * 100);
                  const fPct = Math.round((fGrams / totalG) * 100);
                  return (
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-white)', fontWeight: 700, marginBottom: '0.3rem' }}>
                        <span style={{ color: '#ff3e6c' }}>Protein: {pPct}% ({pGrams}g)</span>
                        <span style={{ color: 'var(--accent-volt)' }}>Carbs: {cPct}% ({cGrams}g)</span>
                        <span style={{ color: 'var(--accent-cyan)' }}>Fats: {fPct}% ({fGrams}g)</span>
                      </div>
                      <div style={{ display: 'flex', height: '6px', borderRadius: '3px', overflow: 'hidden', background: 'rgba(255,255,255,0.05)' }}>
                        <div style={{ width: `${pPct}%`, background: '#ff3e6c' }}></div>
                        <div style={{ width: `${cPct}%`, background: 'var(--accent-volt)' }}></div>
                        <div style={{ width: `${fPct}%`, background: 'var(--accent-cyan)' }}></div>
                      </div>
                    </div>
                  );
                })()}

                {/* --- 5-SLOT MEAL PLANNER SCHEDULE MODULE --- */}
                <div style={{ background: 'var(--bg-dark, rgba(255,255,255,0.02))', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                    <h5 style={{ textTransform: 'uppercase', color: 'var(--accent-volt)', fontSize: '0.85rem', fontWeight: 800, margin: 0 }}>
                      Meal Planner Schedule
                    </h5>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      5 Meal Times • Scheduled: {
                        Object.values(mealSchedule).reduce((total, items) => {
                          let slotCal = 0;
                          (items || []).forEach(it => {
                            const m = it.match(/- (\d+)\s*kcal/);
                            if (m) slotCal += parseInt(m[1]);
                          });
                          return total + slotCal;
                        }, 0)
                      } kcal
                    </span>
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
                            background: isActive ? 'var(--accent-volt)' : 'var(--bg-card, rgba(255,255,255,0.03))',
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
                  <div style={{ background: 'var(--bg-card, rgba(255,255,255,0.02))', padding: '0.8rem', borderRadius: '6px', border: '1px dashed var(--border-color)' }}>
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
                              background: 'var(--bg-dark, #12121c)',
                              border: '1px solid var(--border-color)',
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
                <div style={{ background: 'var(--bg-dark, rgba(255,255,255,0.02))', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                    <h5 style={{ textTransform: 'uppercase', color: 'var(--accent-cyan)', fontSize: '0.85rem', fontWeight: 800, margin: 0 }}>
                      Food Items Menu Catalog
                    </h5>
                    <button
                      type="button"
                      onClick={handleAddNewCatalogFood}
                      className="outline-btn"
                      style={{ padding: '0.25rem 0.55rem', fontSize: '0.68rem', borderColor: 'var(--accent-cyan)', color: 'var(--accent-cyan)', cursor: 'pointer' }}
                    >
                      + Custom Item
                    </button>
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
                          background: foodMenuFilter === cat ? 'var(--accent-cyan)' : 'var(--bg-card, rgba(255,255,255,0.03))',
                          color: foodMenuFilter === cat ? '#fff' : 'var(--text-muted)',
                          border: foodMenuFilter === cat ? '1px solid var(--accent-cyan)' : '1px solid var(--border-color)',
                          fontWeight: 700
                        }}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Food Items Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.5rem', maxHeight: '240px', overflowY: 'auto', paddingRight: '0.3rem' }}>
                    {foodCatalog
                      .filter((f) => foodMenuFilter === 'All' || f.category === foodMenuFilter)
                      .map((food) => (
                        <div
                          key={food.id}
                          style={{
                            background: 'var(--bg-card, rgba(255,255,255,0.02))',
                            border: '1px solid var(--border-color)',
                            borderRadius: '6px',
                            padding: '0.5rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <div>
                            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-white)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                              <span>{food.icon} {food.name}</span>
                              {food.id.startsWith('f-custom-') && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCatalogFood(food.id)}
                                  style={{ background: 'none', border: 'none', color: '#ff3e6c', cursor: 'pointer', fontSize: '0.75rem', padding: '0', opacity: 0.8 }}
                                  title="Delete Custom Item"
                                >
                                  ✕
                                </button>
                              )}
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
                    style={{ background: 'var(--bg-card, #12121c)', border: '1px solid var(--border-color)', color: 'var(--text-white)' }}
                  >
                    <option value="">-- Do Not Assign Yet (Save to Templates) --</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.name}>{m.name} ({m.tier || 'Member'})</option>
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
                    style={{ height: '60px', resize: 'none', background: 'var(--bg-card, #12121c)', border: '1px solid var(--border-color)', color: 'var(--text-white)', padding: '0.8rem' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.6rem' }}>
                  <button type="submit" className="glow-btn" style={{ flex: 2, padding: '0.85rem', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                    Deploy Diet Plan
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewDietName('');
                      setNewDietCalories('');
                      setNewDietProtein('');
                      setNewDietCarbs('');
                      setNewDietFats('');
                      setNewDietDesc('');
                      setSelectedGoalCategory('Custom');
                      setMealSchedule({ morning: [], lunch: [], preWorkout: [], postWorkout: [], night: [] });
                    }}
                    className="outline-btn"
                    style={{ flex: 1, padding: '0.85rem', fontSize: '0.75rem', textTransform: 'uppercase', borderColor: 'var(--text-muted)', color: 'var(--text-muted)' }}
                  >
                    Reset Form
                  </button>
                </div>
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
                  ].map((f) => {
                    const isActive = scheduleShiftFilter === f.key;
                    return (
                      <button
                        key={f.key}
                        type="button"
                        onClick={() => setScheduleShiftFilter(f.key)}
                        style={{
                          padding: '0.35rem 0.7rem',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          borderRadius: '6px',
                          cursor: 'pointer',
                          background: isActive
                            ? (f.key === 'Morning' ? 'var(--accent-volt)' : f.key === 'Evening' ? 'var(--accent-cyan)' : '#ff5e00')
                            : 'var(--bg-card, rgba(255,255,255,0.03))',
                          color: isActive
                            ? (f.key === 'All' ? '#ffffff' : '#000000')
                            : 'var(--text-white)',
                          border: isActive
                            ? (f.key === 'Morning' ? '1px solid var(--accent-volt)' : f.key === 'Evening' ? '1px solid var(--accent-cyan)' : '1px solid #ff5e00')
                            : '1px solid var(--border-color)',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {f.label}
                      </button>
                    );
                  })}
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
                                      onClick={() => handleCompleteSession(item)}
                                    >
                                      Complete
                                    </button>
                                    <button
                                      className="outline-btn"
                                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', borderColor: 'rgba(255,62,108,0.2)', color: '#ff3e6c' }}
                                      onClick={() => handleCancelSession(item)}
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
                    style={{ background: 'var(--bg-card, #12121c)', border: '1px solid var(--border-color)', color: 'var(--text-white)' }}
                    required
                  >
                    {members.length === 0 ? (
                      <option value="">No registered athletes</option>
                    ) : (
                      members.map((m) => (
                        <option key={m.id} value={m.name}>{m.name} ({m.tier || 'Member'})</option>
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
                    style={{ background: 'var(--bg-card, #12121c)', border: '1px solid var(--border-color)', color: 'var(--text-white)', marginBottom: '0.5rem' }}
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
                <div style={{ background: 'var(--bg-dark, rgba(255,255,255,0.02))', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.8rem' }}>
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
                          background: selectedShiftDay === d ? 'var(--accent-volt)' : 'var(--bg-card, rgba(255,255,255,0.03))',
                          color: selectedShiftDay === d ? '#000' : 'var(--text-muted)',
                          border: selectedShiftDay === d ? '1px solid var(--accent-volt)' : '1px solid var(--border-color)'
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
                            padding: '0.35rem 0.5rem',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            borderRadius: '4px',
                            cursor: 'pointer',
                            background: isSelected
                              ? (selectedShiftWindow === 'Morning' ? 'var(--accent-volt)' : 'var(--accent-cyan)')
                              : 'var(--bg-card, rgba(255,255,255,0.03))',
                            color: isSelected ? '#000' : 'var(--text-white)',
                            border: isSelected
                              ? (selectedShiftWindow === 'Morning' ? '1px solid var(--accent-volt)' : '1px solid var(--accent-cyan)')
                              : '1px solid var(--border-color)',
                            transition: 'all 0.2s'
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
                      members.map((m, idx) => {
                        const rfidCode = (m.id && typeof m.id === 'string' && m.id.includes('-')) ? m.id.split('-')[1] : (m.id ? String(m.id).slice(-5) : `90${idx + 10}`);
                        return (
                          <option key={m.id || idx} value={m.name}>
                            {m.name} (RFID Code: #{rfidCode})
                          </option>
                        );
                      })
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

      {/* Printable Receipt / Tax Invoice Modal */}
      <ReceiptModal
        receipt={activeTrainerReceipt}
        onClose={() => setActiveTrainerReceipt(null)}
      />
    </div>
  );
}
