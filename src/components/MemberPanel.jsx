import React, { useState, useEffect, useRef } from 'react';
import SupplementShop from './SupplementShop';
import DummyPaymentGateway from './DummyPaymentGateway';
import { memberApi } from '../services/memberApi';
import { CustomSwal } from '../utils/swal';


// Helper to parse weight strings (e.g., "175 lbs", "80 kg", "150")
const parseWeight = (weightStr) => {
  if (!weightStr) return { value: 160, unit: 'lbs' };
  const matches = String(weightStr).match(/(\d+(?:\.\d+)?)\s*(lbs|kg)?/i);
  if (matches) {
    return {
      value: parseFloat(matches[1]),
      unit: matches[2]?.toLowerCase() === 'kg' ? 'kg' : 'lbs'
    };
  }
  return { value: 160, unit: 'lbs' };
};

// Helper to parse height strings (e.g., "5' 11\"", "180 cm", "0")
const parseHeight = (heightStr) => {
  if (!heightStr) return { feet: 5, inches: 9, cm: 175, type: 'ft' };
  const ftInMatch = String(heightStr).match(/(\d+)\s*(?:'|ft)?\s*(\d+)?\s*(?:"|in)?/i);
  const cmMatch = String(heightStr).match(/(\d+)\s*cm/i);

  if (cmMatch) {
    const cmVal = parseInt(cmMatch[1]);
    const totalInches = cmVal / 2.54;
    return {
      feet: Math.floor(totalInches / 12),
      inches: Math.round(totalInches % 12),
      cm: cmVal,
      type: 'cm'
    };
  } else if (ftInMatch) {
    const feet = parseInt(ftInMatch[1]);
    const inches = ftInMatch[2] ? parseInt(ftInMatch[2]) : 0;
    const cm = Math.round((feet * 12 + inches) * 2.54);
    return {
      feet,
      inches,
      cm,
      type: 'ft'
    };
  }
  return { feet: 5, inches: 9, cm: 175, type: 'ft' };
};

export default function MemberPanel({ activeView, currentUser, addActivity, onUpdateUser, onNavigateSubView }) {
  // Member Profile states
  const memberKey = currentUser?.name || 'member_user';
  const [profileData, setProfileData] = useState(() => {
    const saved = localStorage.getItem(`apex_member_profile_${memberKey}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }

    const userEmail = currentUser?.email || currentUser?.sub || '';
    const isDefaultMockMember = userEmail.toLowerCase() === 'member@apex.com' || (currentUser?.name && currentUser.name.toLowerCase() === 'ethan hunt');

    if (!isDefaultMockMember) {
      const registeredUsers = JSON.parse(localStorage.getItem('apex_registered_users') || '[]');
      const registeredUser = registeredUsers.find(
        (u) => u.email && u.email.toLowerCase() === userEmail.toLowerCase()
      );

      return {
        name: registeredUser?.name || currentUser?.name || 'Registered Member',
        email: registeredUser?.email || userEmail || 'member@apex.com',
        phone: registeredUser?.phone || '0',
        age: registeredUser?.age || 0,
        gender: '0',
        height: '0',
        weight: '0 lbs',
        targetWeight: '0 lbs',
        fitnessGoal: '0',
        emergencyContact: '0',
        address: '0',
        bio: '0',
        membershipTier: currentUser?.membershipTier || 'Muscle Pro',
        joinedDate: 'July 2026',
        profileImage: null
      };
    }

    return {
      name: currentUser?.name || 'Ethan Hunt',
      email: userEmail || 'member@apex.com',
      phone: '+91 98765 43210',
      age: 26,
      gender: 'Athlete',
      height: "5' 11\"",
      weight: '175 lbs',
      targetWeight: '185 lbs',
      fitnessGoal: 'Hypertrophy & Max Strength',
      emergencyContact: 'Emergency Contact (+91 98765 43210)',
      address: 'Apex Fitness Member Residence',
      bio: 'Dedicated athlete focusing on progressive overload and powerlifting metrics.',
      membershipTier: currentUser?.membershipTier || 'Muscle Pro',
      joinedDate: 'July 2026',
      profileImage: null
    };
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState(profileData);
  const [profileToast, setProfileToast] = useState(null);

  // Broadcast alerts states
  const [broadcastAlerts, setBroadcastAlerts] = useState([]);
  const [dismissedAlerts, setDismissedAlerts] = useState(() => {
    return JSON.parse(localStorage.getItem('dismissed_alerts') || '[]');
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
        console.warn("Error fetching alerts in MemberPanel:", err);
      }
    };
    fetchAlerts();
  }, []);

  // Workout Journal states
  const [workoutJournal, setWorkoutJournal] = useState([]);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [modalViewMode, setModalViewMode] = useState('photo'); // 'photo' or 'specs'
  const [dashboardPlanTab, setDashboardPlanTab] = useState('beginner'); // 'beginner', 'pro', or 'both'
  const [chestPhotoIndex, setChestPhotoIndex] = useState(0);
  const [isChestFullScreen, setIsChestFullScreen] = useState(false);
  const [backPhotoIndex, setBackPhotoIndex] = useState(0);
  const [isBackFullScreen, setIsBackFullScreen] = useState(false);
  const [bicepsPhotoIndex, setBicepsPhotoIndex] = useState(0);
  const [isBicepsFullScreen, setIsBicepsFullScreen] = useState(false);
  const [tricepsPhotoIndex, setTricepsPhotoIndex] = useState(0);
  const [isTricepsFullScreen, setIsTricepsFullScreen] = useState(false);
  const [shoulderPhotoIndex, setShoulderPhotoIndex] = useState(0);
  const [isShoulderFullScreen, setIsShoulderFullScreen] = useState(false);
  const [legsPhotoIndex, setLegsPhotoIndex] = useState(0);
  const [isLegsFullScreen, setIsLegsFullScreen] = useState(false);
  const [logExercise, setLogExercise] = useState('');
  const [logWeight, setLogWeight] = useState('');
  const [logReps, setLogReps] = useState('');

  // Billing states
  const [membershipTier, setMembershipTier] = useState('Muscle Pro');
  const [autoRenew, setAutoRenew] = useState(true);
  const [billingInvoices, setBillingInvoices] = useState([
    {
      txId: 'TX-8392',
      plan: 'Muscle Pro Subscription',
      amount: 3500.0,
      status: 'paid',
      date: 'June 10, 2026'
    }
  ]);
  const [renewed, setRenewed] = useState(false);
  const [daysLeft, setDaysLeft] = useState(5);

  // Chat states
  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const chatHistoryRef = useRef(null);

  // Dynamic Registered Trainers Selection State (MongoDB Atlas Linked)
  const [availableTrainers, setAvailableTrainers] = useState([]);
  const [selectedTrainer, setSelectedTrainer] = useState(() => {
    const saved = localStorage.getItem(`apex_selected_trainer_${memberKey}`);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { }
    }
    return null;
  });
  const [trainerTabMode, setTrainerTabMode] = useState('assigned'); // 'assigned' | 'select'
  const [isTrainerPaid, setIsTrainerPaid] = useState(() => {
    const paid = localStorage.getItem(`apex_trainer_paid_${memberKey}`);
    if (paid) return paid === 'true';
    const savedTrainer = localStorage.getItem(`apex_selected_trainer_${memberKey}`);
    return !!savedTrainer;
  });
  const [showTrainerSelection, setShowTrainerSelection] = useState(false);
  const [isMembershipPaid, setIsMembershipPaid] = useState(() => {
    const paid = localStorage.getItem(`apex_membership_paid_${memberKey}`);
    if (paid) return paid === 'true';
    const savedPlan = localStorage.getItem(`apex_selected_plan_${memberKey}`);
    if (savedPlan) return true;
    return false;
  });
  const [showMembershipSelection, setShowMembershipSelection] = useState(false);

  // Prescribed Diet Plan Modal States & Dynamic Refresh
  const [showDietModal, setShowDietModal] = useState(false);
  const [hasProceededToMembership, setHasProceededToMembership] = useState(false);

  const [calcInputs, setCalcInputs] = useState(() => {
    const saved = localStorage.getItem(`apex_calories_calc_${memberKey}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    // Parse defaults from profileData
    const parsedW = parseWeight(profileData?.weight);
    const parsedH = parseHeight(profileData?.height);
    const initialAge = typeof profileData?.age === 'number' ? profileData.age : parseInt(profileData?.age) || 25;
    const initialGender = String(profileData?.gender || '').toLowerCase() === 'female' ? 'female' : 'male';
    const initialGoal = String(profileData?.fitnessGoal || '').toLowerCase().includes('loss') || String(profileData?.fitnessGoal || '').toLowerCase().includes('conditioning')
      ? 'lose'
      : String(profileData?.fitnessGoal || '').toLowerCase().includes('gain') || String(profileData?.fitnessGoal || '').toLowerCase().includes('hypertrophy') || String(profileData?.fitnessGoal || '').toLowerCase().includes('strength')
      ? 'gain'
      : 'maintain';
      
    return {
      weight: parsedW.value || 160,
      weightUnit: parsedW.unit || 'lbs',
      heightType: parsedH.type || 'ft',
      heightFeet: parsedH.feet || 5,
      heightInches: parsedH.inches || 9,
      heightCm: parsedH.cm || 175,
      age: initialAge || 25,
      gender: initialGender || 'male',
      activity: '1.55', // Moderately active
      goal: initialGoal === 'lose' ? '-500' : initialGoal === 'gain' ? '500' : '0',
      isCalculated: false
    };
  });

  const loadAssignedDietPlan = () => {
    try {
      const memberNameKey = (currentUser?.name || '').toLowerCase().trim();

      // 1. Direct assigned diet specifically for this member
      if (memberNameKey) {
        const directSaved = localStorage.getItem(`apex_member_assigned_diet_${memberNameKey}`);
        if (directSaved) {
          return JSON.parse(directSaved);
        }
      }

      // 2. Member record in trainer roster
      const trainerMembers = JSON.parse(localStorage.getItem('apex_trainer_members') || '[]');
      const memberRecord = trainerMembers.find((m) => m.name && currentUser?.name && m.name.toLowerCase().trim() === currentUser.name.toLowerCase().trim());
      const assignedDietName = memberRecord?.diet;

      const trainerDiets = JSON.parse(localStorage.getItem('apex_trainer_diets') || '[]');
      if (assignedDietName && assignedDietName !== 'None') {
        const match = trainerDiets.find((d) => d.name === assignedDietName);
        if (match) return match;
      }

      if (trainerDiets.length > 0) return trainerDiets[0];
    } catch (err) {
      console.warn("Diet lookup error:", err);
    }

    return {
      name: 'Mass Gainer Bulking Protocol',
      calories: '3200 kcal',
      protein: 200,
      carbs: 380,
      fats: 90,
      goalCategory: 'Weight Gain',
      desc: 'High-caloric hypertrophy diet prescribed by your Personal Coach to maximize muscle mass and strength gains.',
      mealsSchedule: {
        morning: ['Rolled Oats with Cinnamon (80g)', 'Natural Peanut Butter (2 tbsp)', 'Fresh Ripe Bananas (2)'],
        lunch: ['Grilled Chicken Breast (200g)', 'Steamed Brown Rice (1.5 cups)', 'Fresh Sliced Avocado (1/2)'],
        preWorkout: ['Pre-Workout Energy Smoothie (400ml)', 'Whole Grain Rice Cakes (4)'],
        postWorkout: ['Post-Workout Anabolic Shake (500ml)', 'Rice Krispies & Protein Powder'],
        night: ['Baked Salmon Fillet (180g)', 'Micellar Casein Protein Pudding']
      }
    };
  };

  const [memberDietPlan, setMemberDietPlan] = useState(loadAssignedDietPlan);

  const handleOpenDietModal = () => {
    const latestPlan = loadAssignedDietPlan();
    setMemberDietPlan(latestPlan);
    setShowDietModal(true);
  };

  useEffect(() => {
    async function fetchRegisteredTrainers() {
      // 1. Remote trainers from MongoDB Atlas API
      const remote = await memberApi.getTrainers();

      // 2. Local registered trainers from localStorage
      const localUsers = JSON.parse(localStorage.getItem('apex_registered_users')) || [];
      const localTrainers = localUsers
        .filter((u) => u.role === 'trainer')
        .map((u) => ({
          userId: u.userId || `TRN-${u.email}`,
          name: u.name ? (u.name.startsWith('Coach') ? u.name : `Coach ${u.name}`) : 'Coach Trainer',
          email: u.email,
          specialty: u.specialty || 'Certified Strength & Performance Coach',
          credentials: u.certifications || 'CSCS, Fitness Specialist',
          bio: u.bio || 'Dedicated certified trainer focused on progressive overload, form biomechanics, and personalized fitness goals.'
        }));

      // Combine both sources, deduplicating by email
      const combined = [];
      const emailSet = new Set();

      if (Array.isArray(remote)) {
        for (const t of remote) {
          if (t.email && !emailSet.has(t.email.toLowerCase())) {
            emailSet.add(t.email.toLowerCase());
            combined.push({
              ...t,
              name: t.name ? (t.name.startsWith('Coach') ? t.name : `Coach ${t.name}`) : 'Coach Trainer'
            });
          }
        }
      }

      for (const t of localTrainers) {
        if (t.email && !emailSet.has(t.email.toLowerCase())) {
          emailSet.add(t.email.toLowerCase());
          combined.push(t);
        }
      }

      if (combined.length > 0) {
        setAvailableTrainers(combined);
      }
    }
    fetchRegisteredTrainers();
  }, [memberKey]);

  // Trainer Hire Payment Modal states
  const [trainerToHire, setTrainerToHire] = useState(null);
  const [trainerPackage, setTrainerPackage] = useState('monthly');
  const [trainerPaymentMethod, setTrainerPaymentMethod] = useState('card');
  const [trainerCardName, setTrainerCardName] = useState('');
  const [trainerCardNum, setTrainerCardNum] = useState('');
  const [trainerCardExp, setTrainerCardExp] = useState('');
  const [trainerCardCvv, setTrainerCardCvv] = useState('');
  const [isProcessingTrainerPayment, setIsProcessingTrainerPayment] = useState(false);
  const [showTrainerGateway, setShowTrainerGateway] = useState(false);

  const handleOpenTrainerPayment = (trainer) => {
    setTrainerToHire(trainer);
    setTrainerCardName(currentUser?.name || 'Member Athlete');
    setTrainerCardNum('');
    setTrainerCardExp('');
    setTrainerCardCvv('');
    setTrainerPackage('monthly');
  };

  const handleConfirmTrainerPayment = async (e) => {
    if (e) e.preventDefault();
    if (!trainerToHire) return;
    setShowTrainerGateway(true);
  };

  const handleTrainerPaymentSuccess = async (paymentDetail) => {
    setShowTrainerGateway(false);
    
    const packageDetails = {
      monthly: { name: '1-Month Personal Coaching', price: 5000 },
      '3month': { name: '3-Month Transformation Package', price: 13000 },
      '6month': { name: '6-Month VIP Elite Mentorship', price: 23000 }
    }[trainerPackage] || { name: '1-Month Personal Coaching', price: 5000 };

    const txId = paymentDetail.txId || 'TX-TRN-' + Math.floor(1000 + Math.random() * 9000);
    const newInvoice = {
      txId,
      plan: `Personal Coaching - ${trainerToHire.name} (${packageDetails.name})`,
      amount: packageDetails.price,
      status: 'paid',
      date: 'Today'
    };

    setBillingInvoices((prev) => [newInvoice, ...prev]);

    setSelectedTrainer(trainerToHire);
    localStorage.setItem(`apex_selected_trainer_${memberKey}`, JSON.stringify(trainerToHire));
    setIsTrainerPaid(true);
    localStorage.setItem(`apex_trainer_paid_${memberKey}`, 'true');
    setTrainerTabMode('assigned');
    await memberApi.selectTrainer(trainerToHire.userId || trainerToHire.id, trainerToHire.name);

    if (addActivity) {
      addActivity(`Hired ${trainerToHire.name} (₹${packageDetails.price} - ${packageDetails.name}, Receipt ${txId})`, 'volt');
    }

    CustomSwal.fire({
      icon: 'success',
      title: 'Payment Successful! 🎉',
      html: `<p style="font-size:1rem;color:#fff;"><strong>${trainerToHire.name}</strong> is now your official Personal Coach!</p><div style="margin-top:0.8rem;padding:0.6rem;background:rgba(198,255,0,0.06);border:1px solid #c6ff00;border-radius:6px;font-family:monospace;font-size:0.85rem;"><span style="color:#c6ff00;">Receipt ID: ${txId}</span><br/><span style="color:#fff;">Amount Paid: ₹${packageDetails.price.toLocaleString('en-IN')}</span></div>`
    });
    setTrainerToHire(null);
  };


  const handleSwitchTrainer = async (trainer) => {
    if (!trainer) return;

    CustomSwal.fire({
      title: 'Confirm Coach Switch 🔄',
      html: `<span style="color:#fff;">Are you sure you want to switch your Personal Coach to <strong>${trainer.name}</strong>?</span>`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Switch Coach',
      cancelButtonText: 'Cancel',
      background: '#0d0d14',
      color: '#fff',
      confirmButtonColor: '#c6ff00',
      cancelButtonColor: '#ff3e6c'
    }).then(async (result) => {
      if (result.isConfirmed) {
        setSelectedTrainer(trainer);
        localStorage.setItem(`apex_selected_trainer_${memberKey}`, JSON.stringify(trainer));
        try {
          await memberApi.selectTrainer(trainer.userId || trainer.id, trainer.name);
        } catch (e) {
          console.warn("Error calling selectTrainer API:", e);
        }

        if (addActivity) {
          addActivity(`Switched coach to ${trainer.name}`, 'volt');
        }

        CustomSwal.fire({
          icon: 'success',
          title: 'Coach Switched! 🎉',
          html: `<span style="color:#fff;"><strong>${trainer.name}</strong> is now your assigned Personal Coach.</span>`,
          timer: 2000,
          showConfirmButton: false,
          background: '#0d0d14',
          color: '#fff'
        });
      }
    });
  };

  const handleSelectCoach = async (trainer) => {
    handleOpenTrainerPayment(trainer);
  };

  // Attendance states
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState('');
  const [attendanceStreak, setAttendanceStreak] = useState(14);
  const [sessions, setSessions] = useState([
    { date: 'July 12, 2026', time: '08:30 AM', type: 'AI Face Check-in' },
    { date: 'July 11, 2026', time: '09:15 AM', type: 'Check-in Gate Entry' },
    { date: 'July 10, 2026', time: '08:00 AM', type: 'Check-in Gate Entry' },
    { date: 'July 09, 2026', time: '05:45 PM', type: 'Check-out Exit' },
    { date: 'July 07, 2026', time: '08:15 AM', type: 'Check-in Gate Entry' },
    { date: 'July 06, 2026', time: '07:30 AM', type: 'AI Face Check-in' },
    { date: 'July 05, 2026', time: '06:00 PM', type: 'Check-in Gate Entry' },
    { date: 'July 03, 2026', time: '08:45 AM', type: 'Check-in Gate Entry' },
    { date: 'July 02, 2026', time: '09:00 AM', type: 'AI Face Check-in' },
    { date: 'July 01, 2026', time: '07:15 AM', type: 'Check-in Gate Entry' }
  ]);
  const [attendanceRate, setAttendanceRate] = useState(92);
  const [activeDays, setActiveDays] = useState([2, 3, 5, 6, 7, 9, 10, 11]);

  // --- ATTENDANCE MODULE DETAILED RECORDS, SUMMARY, REPORT & HISTORY STATES ---
  const [selectedAttMonth, setSelectedAttMonth] = useState('August 2026');
  const [attRecordSearch, setAttRecordSearch] = useState('');
  const [attRecordFilter, setAttRecordFilter] = useState('all');
  const [attRecordPage, setAttRecordPage] = useState(1);
  const [attendanceRecords, setAttendanceRecords] = useState([
    { id: 'ATT-1092', memberName: currentUser?.name || 'Member Athlete', date: 'July 12, 2026', time: '08:30 AM', scanMethod: 'AI Face Biometrics', gateAction: 'Gate Entry Check-in', status: 'Active', hoursLogged: '1h 45m', photo: null },
    { id: 'ATT-1091', memberName: currentUser?.name || 'Member Athlete', date: 'July 11, 2026', time: '09:15 AM', scanMethod: 'RFID Turnstile Gate', gateAction: 'Gate Entry Check-in', status: 'Completed', hoursLogged: '2h 10m', photo: null },
    { id: 'ATT-1090', memberName: currentUser?.name || 'Member Athlete', date: 'July 10, 2026', time: '08:00 AM', scanMethod: 'AI Face Biometrics', gateAction: 'Gate Entry Check-in', status: 'Completed', hoursLogged: '1h 50m', photo: null },
    { id: 'ATT-1089', memberName: currentUser?.name || 'Member Athlete', date: 'July 09, 2026', time: '05:45 PM', scanMethod: 'RFID Turnstile Gate', gateAction: 'Gate Exit Check-out', status: 'Completed', hoursLogged: '1h 30m', photo: null },
    { id: 'ATT-1088', memberName: currentUser?.name || 'Member Athlete', date: 'July 07, 2026', time: '08:15 AM', scanMethod: 'AI Face Biometrics', gateAction: 'Gate Entry Check-in', status: 'Completed', hoursLogged: '2h 00m', photo: null },
    { id: 'ATT-1087', memberName: currentUser?.name || 'Member Athlete', date: 'July 06, 2026', time: '07:30 AM', scanMethod: 'AI Face Biometrics', gateAction: 'Gate Entry Check-in', status: 'Completed', hoursLogged: '1h 40m', photo: null },
    { id: 'ATT-1086', memberName: currentUser?.name || 'Member Athlete', date: 'July 05, 2026', time: '06:00 PM', scanMethod: 'RFID Turnstile Gate', gateAction: 'Gate Entry Check-in', status: 'Completed', hoursLogged: '1h 20m', photo: null },
    { id: 'ATT-1085', memberName: currentUser?.name || 'Member Athlete', date: 'July 03, 2026', time: '08:45 AM', scanMethod: 'AI Face Biometrics', gateAction: 'Gate Entry Check-in', status: 'Completed', hoursLogged: '2h 15m', photo: null },
    { id: 'ATT-1084', memberName: currentUser?.name || 'Member Athlete', date: 'July 02, 2026', time: '09:00 AM', scanMethod: 'AI Face Biometrics', gateAction: 'Gate Entry Check-in', status: 'Completed', hoursLogged: '1h 35m', photo: null },
    { id: 'ATT-1083', memberName: currentUser?.name || 'Member Athlete', date: 'July 01, 2026', time: '07:15 AM', scanMethod: 'RFID Turnstile Gate', gateAction: 'Gate Entry Check-in', status: 'Completed', hoursLogged: '2h 05m', photo: null }
  ]);

  const handleDownloadAttReport = (format) => {
    if (CustomSwal) {
      CustomSwal.fire({
        icon: 'success',
        title: `Generating ${format.toUpperCase()} Attendance Report 📄`,
        html: `<p style="font-size:0.9rem;color:#fff;">Downloading official biometric attendance summary report for <strong>${currentUser?.name || 'Member'}</strong> (${selectedAttMonth}).</p><div style="margin-top:0.8rem;padding:0.6rem;background:rgba(0,255,102,0.06);border:1px solid #00ff66;border-radius:6px;font-family:monospace;font-size:0.82rem;color:#00ff66;">Report Reference: REP-ATT-${Math.floor(1000 + Math.random() * 9000)}<br/>Period: ${selectedAttMonth}<br/>Format: ${format.toUpperCase()} Document</div>`
      });
    }
  };

  // --- MEMBER PANEL PAGINATION STATES ---
  const [workoutPage, setWorkoutPage] = useState(1);
  const [sessionPage, setSessionPage] = useState(1);
  const [trainerGridPage, setTrainerGridPage] = useState(1);
  const [memberSchedulePage, setMemberSchedulePage] = useState(1);
  const [homeInvoicePage, setHomeInvoicePage] = useState(1);
  const [membershipInvoicePage, setMembershipInvoicePage] = useState(1);
  const [equipmentPage, setEquipmentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;
  const GRID_ITEMS_PER_PAGE = 6;

  const renderPaginationBar = (currentPage, totalPages, totalItems, onPageChange, itemsPerPage = 5) => {
    if (totalItems <= itemsPerPage) return null;
    const startIdx = (currentPage - 1) * itemsPerPage + 1;
    const endIdx = Math.min(currentPage * itemsPerPage, totalItems);

    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '0.8rem', borderTop: '1px solid var(--border-color)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
        <span style={{ fontWeight: 600 }}>Showing {startIdx}-{endIdx} of {totalItems} entries</span>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            type="button"
            className="outline-btn"
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
            style={{ padding: '0.35rem 0.8rem', fontSize: '0.75rem', opacity: currentPage === 1 ? 0.4 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer', borderRadius: '4px' }}
          >
            ← Previous
          </button>
          <span style={{ color: 'var(--accent-volt)', fontWeight: 800, padding: '0.2rem 0.6rem', background: 'rgba(198, 255, 0, 0.08)', borderRadius: '4px', border: '1px solid rgba(198, 255, 0, 0.2)', fontSize: '0.75rem' }}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            type="button"
            className="outline-btn"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            style={{ padding: '0.35rem 0.8rem', fontSize: '0.75rem', opacity: currentPage >= totalPages ? 0.4 : 1, cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer', borderRadius: '4px' }}
          >
            Next →
          </button>
        </div>
      </div>
    );
  };

  // --- MEMBER REAL-TIME PHOTO BIOMETRIC REGISTRATION FORM STATES & REFS ---
  const memberVideoRef = useRef(null);
  const memberCanvasRef = useRef(null);
  const [attFormName, setAttFormName] = useState(currentUser?.name || 'New Candidate');
  const [isAttCamOn, setIsAttCamOn] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [attFormSuccess, setAttFormSuccess] = useState(null);
  const [memberLightboxPhoto, setMemberLightboxPhoto] = useState(null);

  // One-time registration states bound strictly to logged-in user
  const [isFaceRegistered, setIsFaceRegistered] = useState(() => {
    const savedByKey = localStorage.getItem(`apex_face_registered_${memberKey}`);
    const savedByName = localStorage.getItem(`apex_face_registered_${currentUser?.name || ''}`);
    return savedByKey === 'true' || savedByName === 'true';
  });
  const [registeredFacePhoto, setRegisteredFacePhoto] = useState(() => {
    return localStorage.getItem(`apex_face_photo_${memberKey}`) || localStorage.getItem(`apex_face_photo_${currentUser?.name || ''}`) || null;
  });
  const [registeredDate, setRegisteredDate] = useState(() => {
    return localStorage.getItem(`apex_face_date_${memberKey}`) || 'July 2026';
  });

  const [isRegistrationFormHidden, setIsRegistrationFormHidden] = useState(() => {
    const savedByKey = localStorage.getItem(`apex_face_registered_${memberKey}`);
    const savedByName = localStorage.getItem(`apex_face_registered_${currentUser?.name || ''}`);
    return savedByKey === 'true' || savedByName === 'true';
  });
  const [showCandidateTrainerSelection, setShowCandidateTrainerSelection] = useState(false);

  const handleCandidateSelectTrainer = async (trainer) => {
    setSelectedTrainer(trainer);
    localStorage.setItem(`apex_selected_trainer_${memberKey}`, JSON.stringify(trainer));
    setTrainerTabMode('assigned');
    try {
      await memberApi.selectTrainer(trainer.userId || trainer.id, trainer.name);
    } catch (err) {
      console.warn("Select trainer API error:", err);
    }

    if (addActivity) {
      addActivity(`Candidate ${attFormName || currentUser?.name || 'Athlete'} selected coach ${trainer.name}`, 'volt');
    }

    setShowCandidateTrainerSelection(false);
    setIsRegistrationFormHidden(true);

    if (CustomSwal) {
      CustomSwal.fire({
        icon: 'success',
        title: 'Trainer Selected! 🎉',
        html: `<p style="color:#fff;"><strong>${trainer.name}</strong> is now your official Personal Coach!</p><p style="color:#00ff66;font-size:0.85rem;margin-top:0.5rem;">Registration section hidden. Navigating to Trainer Page...</p>`,
        timer: 1800,
        showConfirmButton: false
      });
    }

    if (onNavigateSubView) {
      onNavigateSubView('trainer');
    }
  };

  // Automatically check if currently logged-in user has completed 1-time face & name registration
  useEffect(() => {
    const isReg = localStorage.getItem(`apex_face_registered_${memberKey}`) === 'true' ||
      (currentUser?.name && localStorage.getItem(`apex_face_registered_${currentUser.name}`) === 'true');
    setIsFaceRegistered(!!isReg);
    setIsRegistrationFormHidden(!!isReg);
    if (currentUser?.name) {
      setAttFormName(currentUser.name);
      const photo = localStorage.getItem(`apex_face_photo_${currentUser.name}`) || localStorage.getItem(`apex_face_photo_${memberKey}`);
      if (photo) setRegisteredFacePhoto(photo);
    }
  }, [memberKey, currentUser]);

  // Start Member Webcam Feed
  const startMemberCam = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }
        });
        if (memberVideoRef.current) {
          memberVideoRef.current.srcObject = stream;
          memberVideoRef.current.play();
        }
      }
      setIsAttCamOn(true);
    } catch (err) {
      console.warn("Member webcam stream warning:", err);
      setIsAttCamOn(true);
    }
  };

  // Stop Member Webcam Feed
  const stopMemberCam = () => {
    if (memberVideoRef.current && memberVideoRef.current.srcObject) {
      const stream = memberVideoRef.current.srcObject;
      stream.getTracks().forEach((track) => track.stop());
      memberVideoRef.current.srcObject = null;
    }
    setIsAttCamOn(false);
  };

  // Snap Real-time Photo Frame
  const captureMemberPhoto = () => {
    try {
      const canvas = memberCanvasRef.current || document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');

      if (memberVideoRef.current && memberVideoRef.current.readyState === 4) {
        ctx.drawImage(memberVideoRef.current, 0, 0, 640, 480);
      } else {
        // High-tech fallback image frame
        ctx.fillStyle = '#06060c';
        ctx.fillRect(0, 0, 640, 480);
        ctx.strokeStyle = '#c6ff00';
        ctx.lineWidth = 3;
        ctx.strokeRect(160, 80, 320, 320);

        ctx.fillStyle = '#141424';
        ctx.beginPath();
        ctx.arc(320, 210, 75, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#c6ff00';
        ctx.font = 'bold 18px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`MEMBER SNAP: ${attFormName.toUpperCase()}`, 320, 350);
      }

      const imgData = canvas.toDataURL('image/png');
      setCapturedPhoto(imgData);
    } catch (err) {
      console.error("Member frame capture error:", err);
    }
  };

  // Handle Candidate Biometric Face Profile Registration Submit
  const handleRegisterFaceProfile = async (e) => {
    if (e) e.preventDefault();
    const candidateName = attFormName.trim();
    if (!candidateName) return;

    let photoToSave = capturedPhoto;
    if (!photoToSave) {
      const canvas = memberCanvasRef.current || document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#080812';
      ctx.fillRect(0, 0, 640, 480);
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 3;
      ctx.strokeRect(160, 80, 320, 320);
      ctx.fillStyle = '#00f0ff';
      ctx.font = 'bold 18px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`REGISTERED FACE: ${candidateName.toUpperCase()}`, 320, 250);
      photoToSave = canvas.toDataURL('image/png');
      setCapturedPhoto(photoToSave);
    }

    const regDateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });

    setIsFaceRegistered(true);
    setRegisteredFacePhoto(photoToSave);
    setRegisteredDate(regDateStr);

    // Save to localStorage for instant local client persistence
    localStorage.setItem(`apex_face_registered_${candidateName}`, 'true');
    localStorage.setItem(`apex_face_photo_${candidateName}`, photoToSave);
    localStorage.setItem(`apex_face_date_${candidateName}`, regDateStr);

    // Save to global apex_registered_faces map in localStorage
    try {
      const existingFaces = JSON.parse(localStorage.getItem('apex_registered_faces') || '{}');
      existingFaces[candidateName] = {
        memberName: candidateName,
        photo: photoToSave,
        registeredAt: regDateStr,
        status: 'Active'
      };
      localStorage.setItem('apex_registered_faces', JSON.stringify(existingFaces));

      // Sync to local apex_trainer_members roster so Trainer Panel Attendance module sees new candidate
      const trainerMembers = JSON.parse(localStorage.getItem('apex_trainer_members') || '[]');
      if (!trainerMembers.some((m) => m.name && m.name.toLowerCase() === candidateName.toLowerCase())) {
        trainerMembers.unshift({
          id: `MEM-${Math.floor(10000 + Math.random() * 90000)}`,
          name: candidateName,
          email: `${candidateName.toLowerCase().replace(/\s+/g, '')}@apex.com`,
          tier: 'Registered Candidate',
          status: 'Active',
          joined: regDateStr,
          goal: 'Biometric Face Registered'
        });
        localStorage.setItem('apex_trainer_members', JSON.stringify(trainerMembers));
      }
    } catch (err) {
      console.warn("Local storage sync error:", err);
    }

    stopMemberCam();

    // Register with Node.js Express Backend
    const backendRes = await memberApi.registerFaceProfile({
      memberName: candidateName,
      imageBase64: photoToSave
    });

    setAttFormSuccess({
      name: candidateName,
      action: 'Biometric Face Registered',
      time: regDateStr,
      photo: photoToSave,
      msg: backendRes?.message || `Official face profile registered for ${candidateName}. Data sent to Trainer Panel Attendance Module!`
    });

    // Show candidate trainer selection step
    setShowCandidateTrainerSelection(true);

    if (CustomSwal) {
      CustomSwal.fire({
        icon: 'success',
        title: 'Registration Submitted! 🎉',
        html: `<p style="color:#fff;">Candidate <strong>${candidateName}</strong> biometrics registered successfully!</p><p style="color:#c6ff00;font-size:0.88rem;margin-top:0.5rem;font-weight:bold;">Step 2: Select your Personal Trainer below to open your Trainer Page.</p>`
      });
    }
  };

  // Member Schedule Dispatches from Trainer
  const [memberSchedules, setMemberSchedules] = useState([]);

  const loadMemberSchedules = async () => {
    try {
      const currentName = currentUser?.name || profileData?.name || '';
      const remoteSchedules = await memberApi.getTrainerSchedule(currentName);
      const localAgenda = JSON.parse(localStorage.getItem('apex_trainer_agenda') || '[]');
      
      const combined = [...(remoteSchedules || []), ...localAgenda];
      const map = new Map();
      for (const item of combined) {
        if (item.id && !map.has(item.id)) {
          if (!currentName || !item.client || item.client.toLowerCase().trim() === currentName.toLowerCase().trim() || item.client === 'All Members') {
            map.set(item.id, item);
          }
        }
      }
      setMemberSchedules(Array.from(map.values()));
    } catch (err) {
      console.warn("Error loading member schedules:", err);
    }
  };

  // Fetch initial data from Node.js backend & setup live sync polling
  useEffect(() => {
    async function loadBackendData() {
      // 1. Workouts
      const workouts = await memberApi.getWorkouts();
      if (workouts) setWorkoutJournal(workouts);

      // 2. Membership & Invoices
      const memberInfo = await memberApi.getMembership();
      if (memberInfo) {
        if (memberInfo.membershipTier) setMembershipTier(memberInfo.membershipTier);
        if (memberInfo.autoRenew !== undefined) setAutoRenew(memberInfo.autoRenew);
        if (memberInfo.renewed !== undefined) setRenewed(memberInfo.renewed);
        if (memberInfo.daysLeft !== undefined) setDaysLeft(memberInfo.daysLeft);
      }

      const invoices = await memberApi.getInvoices();
      if (invoices) setBillingInvoices(invoices);

      // 3. Trainer, Chat & Dispatched Schedules
      const activeMemberName = profileData?.name || currentUser?.name || 'Ethan Hunt';

      const syncMemberChat = async () => {
        let localSaved = [];
        try {
          localSaved = JSON.parse(localStorage.getItem('apex_trainer_chat_history') || '[]');
        } catch (e) {}

        let remoteChat = [];
        try {
          const res = await memberApi.getChatHistory(activeMemberName);
          if (res && Array.isArray(res)) remoteChat = res;
        } catch (e) {}

        const map = new Map();
        [...localSaved, ...remoteChat].forEach((item) => {
          if (item && item.id) map.set(item.id, item);
          else if (item && item.text) map.set(item.text + (item.time || ''), item);
        });

        const combined = Array.from(map.values());
        const filteredForMember = combined.filter((m) =>
          !m.memberName || m.memberName.toLowerCase() === activeMemberName.toLowerCase()
        );

        setChatHistory(filteredForMember);
      };

      await syncMemberChat();
      await loadMemberSchedules();

      // 4. Attendance
      try {
        const attStatus = await memberApi.getAttendanceStatus();
        if (attStatus) {
          setIsCheckedIn(attStatus.isCheckedIn || false);
          setCheckInTime(attStatus.checkInTime || '');
          setAttendanceStreak(attStatus.streakDays || 0);
          setAttendanceRate(attStatus.attendanceRate || 100);
        }

        const attHistory = await memberApi.getAttendanceHistory();
        if (attHistory) {
          if (Array.isArray(attHistory.sessions)) {
            setSessions(attHistory.sessions);

            const mappedRecords = attHistory.sessions.map((sess, idx) => {
              const isCheckIn = sess.type && sess.type.toLowerCase().includes('check-in');
              const isManual = sess.type && sess.type.toLowerCase().includes('manual');
              const scanMethodStr = isManual ? "Manual (Trainer)" : (sess.type && sess.type.toLowerCase().includes('face') ? "AI Face Biometrics" : "RFID Turnstile Gate");
              return {
                id: `ATT-${1092 + idx}`,
                memberName: currentUser?.name || 'Ethan Hunt',
                date: sess.date,
                time: sess.time,
                scanMethod: scanMethodStr,
                gateAction: isCheckIn ? 'Gate Entry Check-in' : 'Gate Exit Check-out',
                status: isCheckIn ? 'Active' : 'Completed',
                hoursLogged: isCheckIn ? '--' : '1h 30m',
                photo: null
              };
            });
            setAttendanceRecords(mappedRecords);
          }
          if (Array.isArray(attHistory.activeDaysInMonth)) {
            setActiveDays(attHistory.activeDaysInMonth);
          }
        }
      } catch (err) {
        console.warn("Error loading attendance statistics:", err);
      }

      // 5. Member Profile
      const userEmail = currentUser?.email || currentUser?.sub || '';
      const isDefaultMockMember = userEmail.toLowerCase() === 'member@apex.com' || (currentUser?.name && currentUser.name.toLowerCase() === 'ethan hunt');

      if (!isDefaultMockMember) {
        const savedLocally = localStorage.getItem(`apex_member_profile_${memberKey}`);
        if (savedLocally) {
          try {
            const parsed = JSON.parse(savedLocally);
            setProfileData((prev) => ({ ...prev, ...parsed }));
            setProfileForm((prev) => ({ ...prev, ...parsed }));
          } catch (e) {
            console.warn("Could not parse saved profile", e);
          }
        } else {
          const registeredUsers = JSON.parse(localStorage.getItem('apex_registered_users') || '[]');
          const registeredUser = registeredUsers.find(
            (u) => u.email && u.email.toLowerCase() === userEmail.toLowerCase()
          );
          
          const initialNewProfile = {
            name: registeredUser?.name || currentUser?.name || 'Registered Member',
            email: registeredUser?.email || userEmail || 'member@apex.com',
            phone: registeredUser?.phone || '0',
            age: registeredUser?.age || 0,
            gender: '0',
            height: '0',
            weight: '0 lbs',
            targetWeight: '0 lbs',
            fitnessGoal: '0',
            emergencyContact: '0',
            address: '0',
            bio: '0',
            membershipTier: currentUser?.membershipTier || 'Muscle Pro',
            joinedDate: 'July 2026',
            profileImage: null
          };

          setProfileData(initialNewProfile);
          setProfileForm(initialNewProfile);
          localStorage.setItem(`apex_member_profile_${memberKey}`, JSON.stringify(initialNewProfile));
        }
      } else {
        const fetchedProfile = await memberApi.getProfile();
        if (fetchedProfile) {
          setProfileData((prev) => ({ ...prev, ...fetchedProfile }));
          setProfileForm((prev) => ({ ...prev, ...fetchedProfile }));
        } else {
          const savedLocally = localStorage.getItem(`apex_member_profile_${memberKey}`);
          if (savedLocally) {
            try {
              const parsed = JSON.parse(savedLocally);
              setProfileData((prev) => ({ ...prev, ...parsed }));
              setProfileForm((prev) => ({ ...prev, ...parsed }));
            } catch (e) {}
          }
        }
      }
    }

    loadBackendData();

    const interval = setInterval(async () => {
      loadMemberSchedules();
      const activeMemberName = profileData?.name || currentUser?.name || 'Ethan Hunt';
      let localSaved = [];
      try {
        localSaved = JSON.parse(localStorage.getItem('apex_trainer_chat_history') || '[]');
      } catch (e) {}

      let remoteChat = [];
      try {
        const res = await memberApi.getChatHistory(activeMemberName);
        if (res && Array.isArray(res)) remoteChat = res;
      } catch (e) {}

      const map = new Map();
      [...localSaved, ...remoteChat].forEach((item) => {
        if (item && item.id) map.set(item.id, item);
        else if (item && item.text) map.set(item.text + (item.time || ''), item);
      });

      const combined = Array.from(map.values());
      const filteredForMember = combined.filter((m) =>
        !m.memberName || m.memberName.toLowerCase() === activeMemberName.toLowerCase()
      );

      setChatHistory(filteredForMember);
    }, 2000);

    return () => clearInterval(interval);
  }, [memberKey, currentUser]);

  // Profile Edit Handlers
  const handleEditProfileClick = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setProfileForm({ ...profileData });
    setIsEditingProfile(true);

    setTimeout(() => {
      const editElem = document.getElementById('member-profile-edit-card');
      if (editElem) editElem.scrollIntoView({ behavior: 'smooth' });
    }, 100);

    if (CustomSwal) {
      CustomSwal.fire({
        icon: 'info',
        title: 'Profile Edit Mode Activated ✏️',
        text: 'You can now modify your personal details, body metrics, and profile avatar below.',
        timer: 2200,
        showConfirmButton: false
      });
    }
  };

  const handleProfileFormChange = (field, value) => {
    setProfileForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAvatarFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileForm((prev) => ({ ...prev, profileImage: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUseFacePhotoForAvatar = () => {
    if (registeredFacePhoto) {
      setProfileForm((prev) => ({ ...prev, profileImage: registeredFacePhoto }));
    }
  };

  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    if (!profileForm.name.trim()) return;

    setProfileData(profileForm);
    setIsEditingProfile(false);

    // Save to localStorage for instant local persistence
    localStorage.setItem(`apex_member_profile_${memberKey}`, JSON.stringify(profileForm));

    // Call Node.js Express backend API
    await memberApi.updateProfile(profileForm);

    // Trigger parent currentUser state update (for sidebar & top bar sync)
    if (onUpdateUser) {
      onUpdateUser({
        name: profileForm.name,
        email: profileForm.email,
        profileImage: profileForm.profileImage
      });
    }

    if (addActivity) {
      addActivity(`Member ${profileForm.name} updated profile details`, 'volt');
    }

    setProfileToast('Member profile successfully updated & synced!');
    setTimeout(() => setProfileToast(null), 4000);
  };

  const handleCancelEdit = () => {
    setProfileForm(profileData);
    setIsEditingProfile(false);
  };

  // Scroll chat to bottom on updates
  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [chatHistory]);

  // Workout Journal Logger
  const handleWorkoutSubmit = async (e) => {
    e.preventDefault();
    if (!logExercise.trim() || !logWeight.trim() || !logReps) return;

    const newLog = {
      exercise: logExercise.trim(),
      weight: logWeight.trim(),
      reps: logReps,
      time: 'Just Now'
    };

    // Update local state immediately
    setWorkoutJournal((prev) => [newLog, ...prev]);
    setLogExercise('');
    setLogWeight('');
    setLogReps('');

    // Sync with Node.js Express backend
    await memberApi.addWorkout(newLog);
  };

  // Renew membership action
  const handleRenew = () => {
    const planObj = plans[membershipTier] || plans['Muscle Core'];
    handleOpenMembershipPayment(planObj);
  };

  const plans = {
    'Muscle Core': {
      price: 800.0,
      name: 'Muscle Core',
      level: 1,
      period: 'month',
      desc: 'Monthly membership plan - Gym floor access, locker access, complimentary Wi-Fi'
    },
    'MuSuLe Core': {
      price: 800.0,
      name: 'Muscle Core',
      level: 1,
      period: 'month',
      desc: 'Monthly membership plan - Gym floor access, locker access, complimentary Wi-Fi'
    },
    'MaSuLe Core': {
      price: 800.0,
      name: 'Muscle Core',
      level: 1,
      period: 'month',
      desc: 'Monthly membership plan - Gym floor access, locker access, complimentary Wi-Fi'
    },
    'Muscle Pro': {
      price: 3500.0,
      name: 'Muscle Pro',
      level: 2,
      period: '6 months',
      desc: '6 Month membership plan - All Core features, groups inclusion, sauna/cold plunges, nutrition check-ins'
    },
    'MuSuLe Pro': {
      price: 3500.0,
      name: 'Muscle Pro',
      level: 2,
      period: '6 months',
      desc: '6 Month membership plan - All Core features, groups inclusion, sauna/cold plunges, nutrition check-ins'
    },
    'MaSuLe Pro': {
      price: 3500.0,
      name: 'Muscle Pro',
      level: 2,
      period: '6 months',
      desc: '6 Month membership plan - All Core features, groups inclusion, sauna/cold plunges, nutrition check-ins'
    },
    'Muscle Elite': {
      price: 7500.0,
      name: 'Muscle Elite',
      level: 3,
      period: 'year',
      desc: 'Yearly pass membership plan - 24/7 VIP keycard access, unlimited guests, dedicated master coach'
    },
    'MuSuLe Elite': {
      price: 7500.0,
      name: 'Muscle Elite',
      level: 3,
      period: 'year',
      desc: 'Yearly pass membership plan - 24/7 VIP keycard access, unlimited guests, dedicated master coach'
    },
    'MaSuLe Elite': {
      price: 7500.0,
      name: 'Muscle Elite',
      level: 3,
      period: 'year',
      desc: 'Yearly pass membership plan - 24/7 VIP keycard access, unlimited guests, dedicated master coach'
    },
    'Staff Trainer': {
      price: 0.0,
      name: 'Staff Trainer',
      level: 3,
      period: 'staff',
      desc: 'Staff Certified Trainer Membership Pass - Full facility access & client roster portal'
    }
  };

  // Membership Plan Payment Modal states
  const [planToPurchase, setPlanToPurchase] = useState(null);
  const [membershipPaymentMethod, setMembershipPaymentMethod] = useState('card');
  const [membershipCardName, setMembershipCardName] = useState('');
  const [membershipCardNum, setMembershipCardNum] = useState('');
  const [membershipCardExp, setMembershipCardExp] = useState('');
  const [membershipCardCvv, setMembershipCardCvv] = useState('');
  const [isProcessingMembershipPayment, setIsProcessingMembershipPayment] = useState(false);
  const [showMembershipGateway, setShowMembershipGateway] = useState(false);

  const handleOpenMembershipPayment = (planObj) => {
    setPlanToPurchase(planObj);
    setMembershipCardName(currentUser?.name || 'Member Athlete');
    setMembershipCardNum('');
    setMembershipCardExp('');
    setMembershipCardCvv('');
  };

  const handleConfirmMembershipPayment = async (e) => {
    if (e) e.preventDefault();
    if (!planToPurchase) return;
    setShowMembershipGateway(true);
  };

  const handleMembershipPaymentSuccess = async (paymentDetail) => {
    setShowMembershipGateway(false);
    
    const oldPlan = membershipTier;
    const newPlan = planToPurchase.name;
    const planPrice = planToPurchase.price;
    const txId = paymentDetail.txId || 'TX-MEM-' + Math.floor(1000 + Math.random() * 9000);

    const newInvoice = {
      txId,
      plan: `${newPlan} Subscription Pass`,
      amount: planPrice,
      status: 'paid',
      date: 'Today'
    };

    setBillingInvoices((prev) => [newInvoice, ...prev]);
    setMembershipTier(newPlan);
    setRenewed(true);
    setIsMembershipPaid(true);
    localStorage.setItem(`apex_membership_paid_${memberKey}`, 'true');
    localStorage.setItem(`apex_selected_plan_${memberKey}`, newPlan);

    if (onUpdateUser) {
      onUpdateUser({ membershipTier: newPlan });
    }

    await memberApi.changePlan(newPlan);

    if (addActivity) {
      addActivity(`Member ${currentUser.name} purchased ${newPlan} subscription pass (Paid ₹${planPrice}, Invoice ${txId})`, 'cyan');
    }

    CustomSwal.fire({
      icon: 'success',
      title: 'Membership Activated! 🎉',
      html: `<p style="font-size:1rem;color:#fff;">Your membership pass has been updated to <strong>${newPlan}</strong>!</p><div style="margin-top:0.8rem;padding:0.6rem;background:rgba(198,255,0,0.06);border:1px solid #c6ff00;border-radius:6px;font-family:monospace;font-size:0.85rem;"><span style="color:#c6ff00;">Receipt ID: ${txId}</span><br/><span style="color:#fff;">Amount Paid: ₹${planPrice.toLocaleString('en-IN')}</span></div>`
    });
    setPlanToPurchase(null);
  };


  const handlePlanChange = (planName) => {
    const targetPlanObj = plans[planName] || plans['Muscle Core'];
    if (targetPlanObj) {
      handleOpenMembershipPayment(targetPlanObj);
    }
  };

  // Coach communication chat log
  const handleChatSubmit = async (e) => {
    e.preventDefault();
    const textToSend = chatInput.trim();
    if (!textToSend) return;

    const currentMemberName = profileData?.name || currentUser?.name || 'Ethan Hunt';
    const now = new Date();
    const timeStr = now.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }) + ', ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userMessage = {
      id: `c-${Date.now()}`,
      memberName: currentMemberName,
      sender: 'member',
      text: textToSend,
      time: timeStr
    };

    setChatHistory((prev) => [...prev, userMessage]);
    setChatInput('');

    // Persist to local storage for real-time trainer panel sync
    try {
      const savedChat = JSON.parse(localStorage.getItem('apex_trainer_chat_history') || '[]');
      savedChat.push(userMessage);
      localStorage.setItem('apex_trainer_chat_history', JSON.stringify(savedChat));
    } catch (err) {
      console.warn("Storage sync error:", err);
    }

    // Backend sync
    await memberApi.sendChatMessage(textToSend, currentMemberName);
  };

  // Schedule coaching session
  const handleBookSession = async (e) => {
    const btn = e.target;
    btn.textContent = 'Requested';
    btn.disabled = true;
    btn.style.background = 'rgba(0, 240, 255, 0.05)';
    btn.style.color = 'var(--accent-cyan)';
    btn.style.borderColor = 'rgba(0, 240, 255, 0.15)';

    await memberApi.bookSession({ date: 'July 24, 2026', time: '10:00 AM', note: '1-on-1 Session Request' });

    CustomSwal.fire({
      icon: 'info',
      title: 'Session Requested',
      text: 'Session request dispatched to your personal coach! You will receive a mobile verification notification shortly.'
    });
  };

  // Supplement shop success handler
  const handleCheckoutSuccess = (detail) => {
    const newInvoice = {
      txId: detail.txId,
      plan: 'Supp Store Purchase',
      amount: detail.total,
      status: 'paid',
      date: 'Today'
    };

    setBillingInvoices((prev) => [newInvoice, ...prev]);
    addActivity(`Supplements Purchase: ${profileData.name} ordered [${detail.itemsSummary}] (₹${detail.total.toFixed(2)})`, 'cyan');
  };

  // Render Calendar Grid Days helper
  const renderCalendarGrid = () => {
    const days = [];
    const currentRealMonth = new Date().toLocaleString('default', { month: 'long' }) + ' ' + new Date().getFullYear();
    const isCurrentMonthSelected = selectedAttMonth.toLowerCase() === currentRealMonth.toLowerCase();

    const checkInDays = isCurrentMonthSelected ? [...activeDays] : [2, 3, 5, 6, 7, 9, 10, 11];
    if (isCheckedIn && isCurrentMonthSelected) {
      const todayDay = new Date().getDate();
      if (!checkInDays.includes(todayDay)) {
        checkInDays.push(todayDay);
      }
    }

    for (let i = 1; i <= 31; i++) {
      const active = checkInDays.includes(i);
      const isToday = i === new Date().getDate();

      days.push(
        <div
          key={i}
          className="calendar-day"
          title={active ? (isToday ? 'Checked in Today' : 'Attended Session') : 'Rest Day'}
          style={{
            background: active ? 'rgba(198,255,0,0.1)' : 'rgba(255,255,255,0.01)',
            border: active ? '1px solid var(--accent-volt)' : '1px solid var(--border-color)',
            color: active ? 'var(--accent-volt)' : 'var(--text-dim)',
            borderRadius: '4px',
            padding: '0.4rem 0',
            fontWeight: active ? 'bold' : 'normal',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '28px'
          }}
        >
          {active ? '✓' : i}
        </div>
      );
    }
    return days;
  };

  return (
    <div>
      {/* 0. MEMBER PROFILE VIEW */}
      {activeView === 'profile' && (
        <div className="member-sub-view" id="member-subview-profile" style={{ display: 'block' }}>

          {/* SUCCESS TOAST NOTIFICATION */}
          {profileToast && (
            <div style={{
              background: 'rgba(0, 255, 102, 0.08)',
              border: '1px solid #00ff66',
              color: '#00ff66',
              padding: '0.9rem 1.4rem',
              borderRadius: '8px',
              marginBottom: '1.8rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontWeight: 700,
              boxShadow: '0 0 20px rgba(0, 255, 102, 0.15)',
              fontSize: '0.9rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ fontSize: '1.2rem' }}>✓</span>
                <span>{profileToast}</span>
              </div>
              <button
                onClick={() => setProfileToast(null)}
                style={{ background: 'none', border: 'none', color: '#00ff66', cursor: 'pointer', fontSize: '1.2rem', padding: 0 }}
              >
                &times;
              </button>
            </div>
          )}

          {/* PROFILE HEADER BANNER */}
          <div className="db-card" style={{
            minHeight: 'auto',
            padding: '1.2rem 1.8rem',
            marginBottom: '1.2rem',
            background: 'linear-gradient(135deg, rgba(20, 20, 28, 0.95) 0%, rgba(10, 10, 15, 0.95) 100%)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Background cyber accent glow */}
            <div style={{
              position: 'absolute',
              top: '-40px',
              right: '-40px',
              width: '180px',
              height: '180px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(0, 240, 255, 0.15) 0%, transparent 70%)',
              pointerEvents: 'none'
            }}></div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
                {/* Avatar Frame */}
                <div style={{ position: 'relative', width: '75px', height: '75px', flexShrink: 0 }}>
                  {profileData.profileImage ? (
                    <img
                      src={profileData.profileImage}
                      alt={profileData.name}
                      style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--accent-volt)', boxShadow: '0 0 15px rgba(198, 255, 0, 0.3)' }}
                    />
                  ) : (
                    <div style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, var(--accent-volt) 0%, var(--accent-cyan) 100%)',
                      color: 'var(--bg-black)',
                      fontFamily: 'var(--font-display)',
                      fontWeight: 800,
                      fontSize: '1.8rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 0 15px rgba(198, 255, 0, 0.3)'
                    }}>
                      {profileData.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                    </div>
                  )}
                  <span style={{
                    position: 'absolute',
                    bottom: '2px',
                    right: '2px',
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    background: '#00ff66',
                    border: '2px solid var(--bg-card)',
                    boxShadow: '0 0 6px #00ff66'
                  }} title="Active Session"></span>
                </div>

                {/* Profile Meta Details */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.5rem', color: 'var(--text-white)', margin: 0, textTransform: 'uppercase', lineHeight: 1.1 }}>
                      {profileData.name}
                    </h2>
                    <span className="role-badge" style={{ background: 'var(--accent-volt)', color: '#000', fontWeight: 800, fontSize: '0.68rem', padding: '0.2rem 0.5rem' }}>
                      ATHLETE MEMBER
                    </span>
                    <span className="status-badge paid" style={{ fontSize: '0.68rem', padding: '0.2rem 0.5rem' }}>
                      {profileData.membershipTier} Tier
                    </span>

                    {/* EDIT PROFILE BUTTON MOVED RIGHT BESIDE TIER BADGE */}
                    {!isEditingProfile ? (
                      <button
                        type="button"
                        onClick={(e) => handleEditProfileClick(e)}
                        className="glow-btn"
                        id="btn-edit-member-profile"
                        style={{
                          padding: '0.4rem 1rem',
                          fontSize: '0.78rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          marginLeft: '0.6rem',
                          cursor: 'pointer',
                          position: 'relative',
                          zIndex: 10
                        }}
                      >
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        Edit Profile
                      </button>
                    ) : (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginLeft: '0.6rem' }}>
                        <button
                          type="button"
                          onClick={handleSaveProfile}
                          className="glow-btn"
                          style={{ padding: '0.4rem 0.9rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer' }}
                        >
                          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="outline-btn"
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', cursor: 'pointer' }}
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '0.3rem', margin: 0 }}>
                    {profileData.email} &bull; Member since <strong>{profileData.joinedDate}</strong>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* VIEW MODE: PROFILE DATA CARDS */}
          {!isEditingProfile ? (
            <div>
              {/* Quick Metrics Header Grid */}
              <div className="metrics-grid col-4" style={{ marginBottom: '1.8rem' }}>
                <div className="metric-card">
                  <div className="metric-icon" style={{ color: 'var(--accent-volt)', background: 'rgba(198,255,0,0.05)' }}>
                    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div className="metric-details">
                    <h3>{attendanceStreak} Days</h3>
                    <p>Training Streak</p>
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-icon" style={{ color: 'var(--accent-cyan)', background: 'rgba(0,240,255,0.05)' }}>
                    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5 5 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5 5 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                    </svg>
                  </div>
                  <div className="metric-details">
                    <h3>{profileData.weight}</h3>
                    <p>Current Weight ({profileData.targetWeight} target)</p>
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-icon" style={{ color: '#00ff66', background: 'rgba(0,255,102,0.05)' }}>
                    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </div>
                  <div className="metric-details">
                    <h3>{isFaceRegistered ? 'Verified' : 'Pending'}</h3>
                    <p>Biometric Face Profile</p>
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-icon" style={{ color: '#ff3e6c', background: 'rgba(255,62,108,0.05)' }}>
                    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="metric-details">
                    <h3>{attendanceRate}%</h3>
                    <p>Gym Attendance Rate</p>
                  </div>
                </div>
              </div>

              {/* 2x2 Information Grid */}
              <div className="db-grid-row" style={{ gridTemplateColumns: '1fr 1fr', gap: '1.8rem' }}>

                {/* CARD 1: PERSONAL INFORMATION */}
                <div className="db-card" style={{ minHeight: 'auto' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                    <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="var(--accent-volt)" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Personal Details
                    </h4>
                    <span className="status-badge paid" style={{ fontSize: '0.7rem' }}>Active Member</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.2rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '0.6rem' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Full Name</span>
                      <strong style={{ color: 'var(--text-white)', fontSize: '0.9rem' }}>{profileData.name}</strong>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '0.6rem' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Email Address</span>
                      <strong style={{ color: 'var(--accent-cyan)', fontSize: '0.9rem' }}>{profileData.email}</strong>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '0.6rem' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Phone Number</span>
                      <strong style={{ color: 'var(--text-white)', fontSize: '0.9rem' }}>{profileData.phone}</strong>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '0.6rem' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Age / Gender</span>
                      <strong style={{ color: 'var(--text-white)', fontSize: '0.9rem' }}>{profileData.age} Yrs &bull; {profileData.gender}</strong>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '0.6rem' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Address</span>
                      <strong style={{ color: 'var(--text-white)', fontSize: '0.9rem' }}>{profileData.address}</strong>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Joined Date</span>
                      <strong style={{ color: 'var(--accent-volt)', fontSize: '0.9rem' }}>{profileData.joinedDate}</strong>
                    </div>
                  </div>
                </div>

                {/* CARD 2: PHYSICAL METRICS & FITNESS GOALS */}
                <div className="db-card" style={{ minHeight: 'auto' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                    <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="var(--accent-cyan)" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Fitness & Body Metrics
                    </h4>
                    <span className="status-badge paid" style={{ background: 'rgba(0,240,255,0.1)', color: 'var(--accent-cyan)', borderColor: 'rgba(0,240,255,0.2)', fontSize: '0.7rem' }}>
                      Progressing
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.2rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '0.6rem' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Height</span>
                      <strong style={{ color: 'var(--text-white)', fontSize: '0.9rem' }}>{profileData.height}</strong>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '0.6rem' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Current Weight</span>
                      <strong style={{ color: 'var(--text-white)', fontSize: '0.9rem' }}>{profileData.weight}</strong>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '0.6rem' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Target Weight</span>
                      <strong style={{ color: 'var(--accent-volt)', fontSize: '0.9rem' }}>{profileData.targetWeight}</strong>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '0.6rem' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Primary Goal</span>
                      <strong style={{ color: 'var(--text-white)', fontSize: '0.9rem' }}>{profileData.fitnessGoal}</strong>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Assigned Coach</span>
                      <strong style={{ color: 'var(--accent-cyan)', fontSize: '0.9rem' }}>Coach Marcus Vance (CSCS)</strong>
                    </div>
                  </div>
                </div>

                {/* CARD 3: EMERGENCY & HEALTH */}
                <div className="db-card" style={{ minHeight: 'auto' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                    <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#ff3e6c" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      Emergency Contact & Medical
                    </h4>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.2rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '0.6rem' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Emergency Contact</span>
                      <strong style={{ color: 'var(--text-white)', fontSize: '0.9rem' }}>{profileData.emergencyContact}</strong>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Medical Clearances</span>
                      <span style={{ color: '#00ff66', fontSize: '0.85rem', fontWeight: 600 }}>Active Powerlifting & HIIT Clearance</span>
                    </div>
                  </div>
                </div>

                {/* CARD 4: ATHLETE BIO & SECURITY */}
                <div className="db-card" style={{ minHeight: 'auto' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                    <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#00ff66" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      Account Security & Bio
                    </h4>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.2rem' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Athlete Bio & Notes</span>
                      <p style={{ color: 'var(--text-white)', fontSize: '0.88rem', lineHeight: 1.5, marginTop: '0.3rem', background: 'rgba(255,255,255,0.01)', padding: '0.8rem', borderRadius: '6px', border: '1px solid var(--border-color)', margin: '0.4rem 0 0 0' }}>
                        {profileData.bio}
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                      <span className="status-badge paid" style={{ fontSize: '0.7rem' }}>
                        ✓ JWT Signed Session
                      </span>
                      <span className="status-badge paid" style={{ background: 'rgba(198,255,0,0.1)', color: 'var(--accent-volt)', borderColor: 'rgba(198,255,0,0.2)', fontSize: '0.7rem' }}>
                        ✓ Biometrics Synced
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          ) : (
            /* EDIT MODE: INTERACTIVE PROFILE EDITING FORM */
            <div className="db-card" id="member-profile-edit-card" style={{ padding: '2.5rem' }}>
              <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1.2rem', marginBottom: '2rem' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.4rem', color: 'var(--text-white)', margin: 0, textTransform: 'uppercase' }}>
                  Edit Member Profile Information
                </h3>
                <p className="card-subtitle" style={{ margin: '0.3rem 0 0 0' }}>Update your personal contact details, physical metrics, and avatar image</p>
              </div>

              <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                {/* 1. AVATAR & PHOTO SELECTION */}
                <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', padding: '1.5rem', borderRadius: '8px' }}>
                  <h4 style={{ fontSize: '0.95rem', color: 'var(--accent-volt)', margin: '0 0 1rem 0' }}>1. Profile Avatar & Photo</h4>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--accent-volt)', flexShrink: 0 }}>
                      {profileForm.profileImage ? (
                        <img src={profileForm.profileImage} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, var(--accent-volt), var(--accent-cyan))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 800, fontSize: '1.8rem' }}>
                          {profileForm.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                      <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Upload New Avatar Image</label>
                      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarFileChange}
                          id="profile-avatar-file-input"
                          style={{ display: 'none' }}
                        />
                        <label
                          htmlFor="profile-avatar-file-input"
                          className="outline-btn"
                          style={{ cursor: 'pointer', padding: '0.5rem 1rem', fontSize: '0.8rem' }}
                        >
                          📷 Choose File...
                        </label>

                        {registeredFacePhoto && (
                          <button
                            type="button"
                            onClick={handleUseFacePhotoForAvatar}
                            className="outline-btn"
                            style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', color: 'var(--accent-cyan)', borderColor: 'rgba(0, 240, 255, 0.3)' }}
                          >
                            Use Registered Biometric Face Photo
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. PERSONAL DETAILS GRID */}
                <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', padding: '1.5rem', borderRadius: '8px' }}>
                  <h4 style={{ fontSize: '0.95rem', color: 'var(--accent-volt)', margin: '0 0 1.2rem 0' }}>2. Personal & Contact Information</h4>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.2rem' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Full Name</label>
                      <input
                        type="text"
                        className="form-input"
                        value={profileForm.name}
                        onChange={(e) => handleProfileFormChange('name', e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Email Address</label>
                      <input
                        type="email"
                        className="form-input"
                        value={profileForm.email}
                        onChange={(e) => handleProfileFormChange('email', e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Phone Number</label>
                      <input
                        type="text"
                        className="form-input"
                        value={profileForm.phone}
                        onChange={(e) => handleProfileFormChange('phone', e.target.value)}
                      />
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Age</label>
                      <input
                        type="number"
                        className="form-input"
                        value={profileForm.age}
                        onChange={(e) => handleProfileFormChange('age', e.target.value)}
                      />
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Gender</label>
                      <select
                        className="form-input"
                        value={profileForm.gender}
                        onChange={(e) => handleProfileFormChange('gender', e.target.value)}
                        style={{ background: 'var(--bg-black)' }}
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Non-Binary">Non-Binary</option>
                        <option value="Prefer Not to Say">Prefer Not to Say</option>
                      </select>
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Emergency Contact Name & Phone</label>
                      <input
                        type="text"
                        className="form-input"
                        value={profileForm.emergencyContact}
                        onChange={(e) => handleProfileFormChange('emergencyContact', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginTop: '1.2rem', marginBottom: 0 }}>
                    <label className="form-label">Home Address</label>
                    <input
                      type="text"
                      className="form-input"
                      value={profileForm.address}
                      onChange={(e) => handleProfileFormChange('address', e.target.value)}
                    />
                  </div>
                </div>

                {/* 3. PHYSICAL METRICS & FITNESS GOALS */}
                <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', padding: '1.5rem', borderRadius: '8px' }}>
                  <h4 style={{ fontSize: '0.95rem', color: 'var(--accent-volt)', margin: '0 0 1.2rem 0' }}>3. Physical Metrics & Fitness Target</h4>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.2rem' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Height (e.g. 5' 11")</label>
                      <input
                        type="text"
                        className="form-input"
                        value={profileForm.height}
                        onChange={(e) => handleProfileFormChange('height', e.target.value)}
                      />
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Current Weight (e.g. 175 lbs)</label>
                      <input
                        type="text"
                        className="form-input"
                        value={profileForm.weight}
                        onChange={(e) => handleProfileFormChange('weight', e.target.value)}
                      />
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Target Weight (e.g. 185 lbs)</label>
                      <input
                        type="text"
                        className="form-input"
                        value={profileForm.targetWeight}
                        onChange={(e) => handleProfileFormChange('targetWeight', e.target.value)}
                      />
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Primary Fitness Goal</label>
                      <select
                        className="form-input"
                        value={profileForm.fitnessGoal}
                        onChange={(e) => handleProfileFormChange('fitnessGoal', e.target.value)}
                        style={{ background: 'var(--bg-black)' }}
                      >
                        <option value="Hypertrophy & Max Strength">Hypertrophy & Max Strength</option>
                        <option value="Fat Loss & Conditioning">Fat Loss & Conditioning</option>
                        <option value="Athletic Performance">Athletic Performance</option>
                        <option value="Body Recomposition">Body Recomposition</option>
                        <option value="General Fitness & Health">General Fitness & Health</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 4. BIO & NOTES */}
                <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', padding: '1.5rem', borderRadius: '8px' }}>
                  <h4 style={{ fontSize: '0.95rem', color: 'var(--accent-volt)', margin: '0 0 1.2rem 0' }}>4. Athlete Bio & Notes</h4>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Bio Summary</label>
                    <textarea
                      rows="3"
                      className="form-input"
                      value={profileForm.bio}
                      onChange={(e) => handleProfileFormChange('bio', e.target.value)}
                      style={{ resize: 'vertical', fontFamily: 'inherit' }}
                    />
                  </div>
                </div>

                {/* FORM ACTION BUTTONS */}
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                  <button type="button" onClick={handleCancelEdit} className="outline-btn" style={{ padding: '0.8rem 2rem', fontSize: '0.9rem' }}>
                    Cancel
                  </button>
                  <button type="submit" className="glow-btn" style={{ padding: '0.8rem 2.5rem', fontSize: '0.9rem' }}>
                    Save Profile Changes
                  </button>
                </div>

              </form>
            </div>
          )}

        </div>
      )}

      {/* 1. MEMBER HOME DASHBOARD VIEW */}
      {activeView === 'home' && (
        <div className="member-sub-view" id="member-subview-home" style={{ display: 'block' }}>

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
                    localStorage.setItem('dismissed_alerts', JSON.stringify(updatedDismissed));
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

          {/* EXPIRY ALERT BANNER */}
          {billingInvoices.length > 0 && (daysLeft <= 10 || !renewed) && (
            <div className="db-card member-alert-card" id="member-expiry-alert-box" style={{ display: 'block', marginBottom: '1.8rem' }}>
              <div className="member-alert-content" style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '1rem' }}>
                <div className="alert-icon-box" style={{ color: '#ff9f00' }}>
                  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="alert-details">
                  <h4>Membership Expiration Alert</h4>
                  <p>
                    {renewed ? (
                      <span>Thank you! Your <strong>{membershipTier} Pass</strong> has been successfully renewed. Session keycard active. Next charge date: <strong>August 10, 2026</strong>.</span>
                    ) : (
                      <span>Your <strong>{membershipTier} Pass</strong> will expire in <span id="member-days-left">{daysLeft}</span> days on <span id="member-expiry-date">July 17, 2026</span>. Please renew to avoid keycard lookup lockouts.</span>
                    )}
                  </p>
                </div>
                {!renewed && (
                  <button onClick={handleRenew} className="glow-btn" id="member-renew-btn" style={{ padding: '0.6rem 1.4rem', fontSize: '0.8rem', marginLeft: 'auto' }}>
                    Renew Now
                  </button>
                )}
              </div>
            </div>
          )}

          {/* METRIC CARDS */}
          <div className="metrics-grid col-3">
            <div className="metric-card">
              <div className="metric-icon" style={{ color: 'var(--accent-volt)', background: 'rgba(198,255,0,0.05)' }}>
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <div className="metric-details">
                <h3 id="member-active-tier">{billingInvoices.length === 0 ? '' : membershipTier}</h3>
                <p>Active Pass Membership</p>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon" style={{ color: 'var(--accent-cyan)', background: 'rgba(0,240,255,0.05)' }}>
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" />
                </svg>
              </div>
              <div className="metric-details">
                <h3 id="member-home-att-pct">{attendanceRate}%</h3>
                <p>Attendance Consistency</p>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon" style={{ color: '#ff3e6c', background: 'rgba(255,62,108,0.05)' }}>
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="metric-details">
                <h3 id="member-home-att-streak">{attendanceStreak} Days</h3>
                <p>Active Training Streak</p>
              </div>
            </div>
          </div>

          {/* WORKOUT TRAINING PLANS & MACRO METRICS */}
          <div className="db-grid-row">
            <div className="db-card flex-card" style={{ flex: 2 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <h4 style={{ margin: 0 }}>Workout Training Plans</h4>
                  <p className="card-subtitle" style={{ margin: '0.2rem 0 0 0' }}>Master training routines & daily target splits</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    className="outline-btn"
                    style={{
                      padding: '0.4rem 0.8rem',
                      fontSize: '0.75rem',
                      textTransform: 'uppercase',
                      background: dashboardPlanTab === 'beginner' ? 'rgba(0, 240, 255, 0.2)' : 'rgba(255, 255, 255, 0.02)',
                      color: dashboardPlanTab === 'beginner' ? '#00f0ff' : 'var(--text-white)',
                      borderColor: dashboardPlanTab === 'beginner' ? '#00f0ff' : 'var(--border-color)',
                      boxShadow: dashboardPlanTab === 'beginner' ? '0 0 12px rgba(0, 240, 255, 0.3)' : 'none',
                      fontWeight: 700,
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                    onClick={() => setDashboardPlanTab('beginner')}
                  >
                    🟢 Beginner Plan
                  </button>
                  <button
                    className="outline-btn"
                    style={{
                      padding: '0.4rem 0.8rem',
                      fontSize: '0.75rem',
                      textTransform: 'uppercase',
                      background: dashboardPlanTab === 'pro' ? 'rgba(255, 0, 85, 0.2)' : 'rgba(255, 255, 255, 0.02)',
                      color: dashboardPlanTab === 'pro' ? '#ff0055' : 'var(--text-white)',
                      borderColor: dashboardPlanTab === 'pro' ? '#ff0055' : 'var(--border-color)',
                      boxShadow: dashboardPlanTab === 'pro' ? '0 0 12px rgba(255, 0, 85, 0.3)' : 'none',
                      fontWeight: 700,
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                    onClick={() => setDashboardPlanTab('pro')}
                  >
                    🔥 Pro Plan
                  </button>
                  <button
                    className="outline-btn"
                    style={{
                      padding: '0.4rem 0.8rem',
                      fontSize: '0.75rem',
                      textTransform: 'uppercase',
                      background: dashboardPlanTab === 'both' ? 'rgba(198, 255, 0, 0.2)' : 'rgba(255, 255, 255, 0.02)',
                      color: dashboardPlanTab === 'both' ? 'var(--accent-volt)' : 'var(--text-white)',
                      borderColor: dashboardPlanTab === 'both' ? 'var(--accent-volt)' : 'var(--border-color)',
                      boxShadow: dashboardPlanTab === 'both' ? 'var(--glow-volt)' : 'none',
                      fontWeight: 700,
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                    onClick={() => setDashboardPlanTab('both')}
                  >
                    ⚡ View Both Plans
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                {(dashboardPlanTab === 'beginner' || dashboardPlanTab === 'both') && (
                  <div style={{
                    background: 'rgba(255,255,255,0.01)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '1.2rem',
                    maxHeight: '340px',
                    overflowY: 'auto'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <h4 style={{ color: '#00f0ff', fontWeight: 800, fontSize: '0.9rem', textTransform: 'uppercase', margin: 0, letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.1rem' }}>🟢</span> 1. Beginner Workout Table
                      </h4>
                      <span style={{ fontSize: '0.72rem', background: 'rgba(0, 240, 255, 0.1)', color: '#00f0ff', border: '1px solid rgba(0, 240, 255, 0.3)', padding: '0.2rem 0.6rem', borderRadius: '12px', fontWeight: 700 }}>
                        Single Muscle Focus Routine
                      </span>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)' }}>
                          <th style={{ padding: '0.6rem 0.8rem', fontWeight: 700 }}>DAY</th>
                          <th style={{ padding: '0.6rem 0.8rem', fontWeight: 700 }}>TARGET WORKOUT</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <td style={{ padding: '0.6rem 0.8rem', fontWeight: 700, color: 'var(--text-white)' }}>Monday</td>
                          <td style={{ padding: '0.6rem 0.8rem' }}><span style={{ background: 'rgba(0, 240, 255, 0.15)', color: '#00f0ff', padding: '0.25rem 0.6rem', borderRadius: '4px', fontWeight: 700 }}>Chest</span></td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <td style={{ padding: '0.6rem 0.8rem', fontWeight: 700, color: 'var(--text-white)' }}>Tuesday</td>
                          <td style={{ padding: '0.6rem 0.8rem' }}><span style={{ background: 'rgba(198, 255, 0, 0.15)', color: '#c6ff00', padding: '0.25rem 0.6rem', borderRadius: '4px', fontWeight: 700 }}>Back</span></td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <td style={{ padding: '0.6rem 0.8rem', fontWeight: 700, color: 'var(--text-white)' }}>Wednesday</td>
                          <td style={{ padding: '0.6rem 0.8rem' }}><span style={{ background: 'rgba(255, 204, 0, 0.15)', color: '#ffcc00', padding: '0.25rem 0.6rem', borderRadius: '4px', fontWeight: 700 }}>Biceps</span></td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <td style={{ padding: '0.6rem 0.8rem', fontWeight: 700, color: 'var(--text-white)' }}>Thursday</td>
                          <td style={{ padding: '0.6rem 0.8rem' }}><span style={{ background: 'rgba(170, 0, 255, 0.15)', color: '#d070ff', padding: '0.25rem 0.6rem', borderRadius: '4px', fontWeight: 700 }}>Triceps</span></td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <td style={{ padding: '0.6rem 0.8rem', fontWeight: 700, color: 'var(--text-white)' }}>Friday</td>
                          <td style={{ padding: '0.6rem 0.8rem' }}><span style={{ background: 'rgba(255, 128, 0, 0.15)', color: '#ff8000', padding: '0.25rem 0.6rem', borderRadius: '4px', fontWeight: 700 }}>Shoulder</span></td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <td style={{ padding: '0.6rem 0.8rem', fontWeight: 700, color: 'var(--text-white)' }}>Saturday</td>
                          <td style={{ padding: '0.6rem 0.8rem' }}><span style={{ background: 'rgba(255, 0, 85, 0.15)', color: '#ff0055', padding: '0.25rem 0.6rem', borderRadius: '4px', fontWeight: 700 }}>Leg</span></td>
                        </tr>
                        <tr>
                          <td style={{ padding: '0.6rem 0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>Sunday</td>
                          <td style={{ padding: '0.6rem 0.8rem' }}><span style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-muted)', padding: '0.25rem 0.6rem', borderRadius: '4px', fontWeight: 600 }}>Rest / Active Recovery</span></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {(dashboardPlanTab === 'pro' || dashboardPlanTab === 'both') && (
                  <div style={{
                    background: 'rgba(255,255,255,0.01)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '1.2rem',
                    maxHeight: '340px',
                    overflowY: 'auto'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <h4 style={{ color: '#ff0055', fontWeight: 800, fontSize: '0.9rem', textTransform: 'uppercase', margin: 0, letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.1rem' }}>🔥</span> 2. Pro Workout Table
                      </h4>
                      <span style={{ fontSize: '0.72rem', background: 'rgba(255, 0, 85, 0.1)', color: '#ff0055', border: '1px solid rgba(255, 0, 85, 0.3)', padding: '0.2rem 0.6rem', borderRadius: '12px', fontWeight: 700 }}>
                        Push-Pull-Legs Dual Target Split
                      </span>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)' }}>
                          <th style={{ padding: '0.6rem 0.8rem', fontWeight: 700 }}>DAY</th>
                          <th style={{ padding: '0.6rem 0.8rem', fontWeight: 700 }}>TARGET WORKOUT</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <td style={{ padding: '0.6rem 0.8rem', fontWeight: 700, color: 'var(--text-white)' }}>Monday</td>
                          <td style={{ padding: '0.6rem 0.8rem' }}>
                            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
                              <span style={{ background: 'rgba(0, 240, 255, 0.15)', color: '#00f0ff', padding: '0.25rem 0.6rem', borderRadius: '4px', fontWeight: 700 }}>Chest</span>
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>&</span>
                              <span style={{ background: 'rgba(170, 0, 255, 0.15)', color: '#d070ff', padding: '0.25rem 0.6rem', borderRadius: '4px', fontWeight: 700 }}>Triceps</span>
                            </div>
                          </td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <td style={{ padding: '0.6rem 0.8rem', fontWeight: 700, color: 'var(--text-white)' }}>Tuesday</td>
                          <td style={{ padding: '0.6rem 0.8rem' }}>
                            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
                              <span style={{ background: 'rgba(198, 255, 0, 0.15)', color: '#c6ff00', padding: '0.25rem 0.6rem', borderRadius: '4px', fontWeight: 700 }}>Back</span>
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>&</span>
                              <span style={{ background: 'rgba(255, 204, 0, 0.15)', color: '#ffcc00', padding: '0.25rem 0.6rem', borderRadius: '4px', fontWeight: 700 }}>Biceps</span>
                            </div>
                          </td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <td style={{ padding: '0.6rem 0.8rem', fontWeight: 700, color: 'var(--text-white)' }}>Wednesday</td>
                          <td style={{ padding: '0.6rem 0.8rem' }}>
                            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
                              <span style={{ background: 'rgba(255, 0, 85, 0.15)', color: '#ff0055', padding: '0.25rem 0.6rem', borderRadius: '4px', fontWeight: 700 }}>Leg</span>
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>&</span>
                              <span style={{ background: 'rgba(255, 128, 0, 0.15)', color: '#ff8000', padding: '0.25rem 0.6rem', borderRadius: '4px', fontWeight: 700 }}>Shoulder</span>
                            </div>
                          </td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <td style={{ padding: '0.6rem 0.8rem', fontWeight: 700, color: 'var(--text-white)' }}>Thursday</td>
                          <td style={{ padding: '0.6rem 0.8rem' }}>
                            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
                              <span style={{ background: 'rgba(0, 240, 255, 0.15)', color: '#00f0ff', padding: '0.25rem 0.6rem', borderRadius: '4px', fontWeight: 700 }}>Chest</span>
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>&</span>
                              <span style={{ background: 'rgba(170, 0, 255, 0.15)', color: '#d070ff', padding: '0.25rem 0.6rem', borderRadius: '4px', fontWeight: 700 }}>Triceps</span>
                            </div>
                          </td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <td style={{ padding: '0.6rem 0.8rem', fontWeight: 700, color: 'var(--text-white)' }}>Friday</td>
                          <td style={{ padding: '0.6rem 0.8rem' }}>
                            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
                              <span style={{ background: 'rgba(198, 255, 0, 0.15)', color: '#c6ff00', padding: '0.25rem 0.6rem', borderRadius: '4px', fontWeight: 700 }}>Back</span>
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>&</span>
                              <span style={{ background: 'rgba(255, 204, 0, 0.15)', color: '#ffcc00', padding: '0.25rem 0.6rem', borderRadius: '4px', fontWeight: 700 }}>Biceps</span>
                            </div>
                          </td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <td style={{ padding: '0.6rem 0.8rem', fontWeight: 700, color: 'var(--text-white)' }}>Saturday</td>
                          <td style={{ padding: '0.6rem 0.8rem' }}>
                            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
                              <span style={{ background: 'rgba(255, 0, 85, 0.15)', color: '#ff0055', padding: '0.25rem 0.6rem', borderRadius: '4px', fontWeight: 700 }}>Leg</span>
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>&</span>
                              <span style={{ background: 'rgba(255, 128, 0, 0.15)', color: '#ff8000', padding: '0.25rem 0.6rem', borderRadius: '4px', fontWeight: 700 }}>Shoulder</span>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td style={{ padding: '0.6rem 0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>Sunday</td>
                          <td style={{ padding: '0.6rem 0.8rem' }}><span style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-muted)', padding: '0.25rem 0.6rem', borderRadius: '4px', fontWeight: 600 }}>Rest / Active Recovery</span></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {(() => {
              // 1. Convert weight to kg
              const weightVal = parseFloat(calcInputs.weight) || 160;
              const weightKg = calcInputs.weightUnit === 'lbs' ? weightVal * 0.45359237 : weightVal;
              
              // 2. Convert height to cm
              let cm = 175;
              if (calcInputs.heightType === 'ft') {
                const ft = parseInt(calcInputs.heightFeet) || 5;
                const inches = parseInt(calcInputs.heightInches) || 0;
                cm = (ft * 12 + inches) * 2.54;
              } else {
                cm = parseFloat(calcInputs.heightCm) || 175;
              }

              // 3. Mifflin-St Jeor BMR
              const ageVal = parseInt(calcInputs.age) || 25;
              let bmr = 0;
              if (calcInputs.gender === 'female') {
                bmr = 10 * weightKg + 6.25 * cm - 5 * ageVal - 161;
              } else {
                bmr = 10 * weightKg + 6.25 * cm - 5 * ageVal + 5;
              }

              // 4. TDEE
              const activityMultiplier = parseFloat(calcInputs.activity) || 1.55;
              const tdee = bmr * activityMultiplier;

              // 5. Target Calories
              const goalOffset = parseFloat(calcInputs.goal) || 0;
              const targetCalories = Math.max(1200, Math.round(tdee + goalOffset));

              // 6. Macros Split (based on goal)
              // Lose: 40% P, 35% C, 25% F
              // Gain: 30% P, 45% C, 25% F
              // Maintain: 30% P, 40% C, 30% F
              let pPct = 30, cPct = 40, fPct = 30;
              if (goalOffset < 0) {
                pPct = 40;
                cPct = 35;
                fPct = 25;
              } else if (goalOffset > 0) {
                pPct = 30;
                cPct = 45;
                fPct = 25;
              }

              const proteinGrams = Math.round((targetCalories * (pPct / 100)) / 4);
              const carbsGrams = Math.round((targetCalories * (cPct / 100)) / 4);
              const fatsGrams = Math.round((targetCalories * (fPct / 100)) / 9);

              const results = {
                bmr: Math.round(bmr),
                tdee: Math.round(tdee),
                targetCalories,
                proteinGrams,
                carbsGrams,
                fatsGrams,
                pPct,
                cPct,
                fPct
              };

              return !calcInputs.isCalculated ? (
                <div className="db-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '430px', padding: '2rem' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                      <h4 style={{ margin: 0, textTransform: 'uppercase', fontFamily: 'var(--font-display)', fontWeight: 800 }}>Calories Calculator</h4>
                      <span style={{ fontSize: '0.72rem', background: 'rgba(198, 255, 0, 0.1)', color: 'var(--accent-volt)', border: '1px solid rgba(198, 255, 0, 0.2)', padding: '0.2rem 0.6rem', borderRadius: '12px', fontWeight: 700 }}>
                        Mifflin-St Jeor
                      </span>
                    </div>
                    <p className="card-subtitle" style={{ margin: '0 0 1.2rem 0', fontSize: '0.8rem' }}>Calculate dynamic daily caloric & macronutrient targets</p>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                      {/* Gender & Age */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                        <div>
                          <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '0.3rem', display: 'block', color: 'var(--text-muted)' }}>Gender</label>
                          <select 
                            className="form-input" 
                            value={calcInputs.gender}
                            onChange={(e) => setCalcInputs({ ...calcInputs, gender: e.target.value })}
                            style={{ padding: '0.45rem 0.6rem', fontSize: '0.8rem', background: 'var(--bg-black)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-white)', width: '100%' }}
                          >
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                          </select>
                        </div>
                        <div>
                          <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '0.3rem', display: 'block', color: 'var(--text-muted)' }}>Age (Years)</label>
                          <input 
                            type="number" 
                            className="form-input"
                            value={calcInputs.age}
                            onChange={(e) => setCalcInputs({ ...calcInputs, age: parseInt(e.target.value) || 0 })}
                            style={{ padding: '0.45rem 0.6rem', fontSize: '0.8rem', background: 'var(--bg-black)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-white)', width: '100%' }}
                          />
                        </div>
                      </div>

                      {/* Weight Input */}
                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.8rem' }}>
                        <div>
                          <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '0.3rem', display: 'block', color: 'var(--text-muted)' }}>Weight</label>
                          <input 
                            type="number" 
                            className="form-input"
                            value={calcInputs.weight}
                            onChange={(e) => setCalcInputs({ ...calcInputs, weight: parseFloat(e.target.value) || 0 })}
                            style={{ padding: '0.45rem 0.6rem', fontSize: '0.8rem', background: 'var(--bg-black)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-white)', width: '100%' }}
                          />
                        </div>
                        <div>
                          <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '0.3rem', display: 'block', color: 'var(--text-muted)' }}>Unit</label>
                          <select 
                            className="form-input"
                            value={calcInputs.weightUnit}
                            onChange={(e) => setCalcInputs({ ...calcInputs, weightUnit: e.target.value })}
                            style={{ padding: '0.45rem 0.6rem', fontSize: '0.8rem', background: 'var(--bg-black)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-white)', width: '100%' }}
                          >
                            <option value="lbs">lbs</option>
                            <option value="kg">kg</option>
                          </select>
                        </div>
                      </div>

                      {/* Height Input */}
                      <div>
                        <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '0.3rem', display: 'block', color: 'var(--text-muted)' }}>Height</label>
                        <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                          <select 
                            className="form-input"
                            value={calcInputs.heightType}
                            onChange={(e) => setCalcInputs({ ...calcInputs, heightType: e.target.value })}
                            style={{ padding: '0.45rem 0.6rem', fontSize: '0.8rem', background: 'var(--bg-black)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-white)', width: '80px' }}
                          >
                            <option value="ft">ft/in</option>
                            <option value="cm">cm</option>
                          </select>

                          {calcInputs.heightType === 'ft' ? (
                            <div style={{ display: 'flex', gap: '0.4rem', flexGrow: 1 }}>
                              <input 
                                type="number" 
                                placeholder="ft"
                                className="form-input"
                                value={calcInputs.heightFeet}
                                onChange={(e) => setCalcInputs({ ...calcInputs, heightFeet: parseInt(e.target.value) || 0 })}
                                style={{ padding: '0.45rem 0.6rem', fontSize: '0.8rem', background: 'var(--bg-black)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-white)', flex: 1 }}
                              />
                              <input 
                                type="number" 
                                placeholder="in"
                                className="form-input"
                                value={calcInputs.heightInches}
                                onChange={(e) => setCalcInputs({ ...calcInputs, heightInches: parseInt(e.target.value) || 0 })}
                                style={{ padding: '0.45rem 0.6rem', fontSize: '0.8rem', background: 'var(--bg-black)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-white)', flex: 1 }}
                              />
                            </div>
                          ) : (
                            <input 
                              type="number" 
                              placeholder="cm"
                              className="form-input"
                              value={calcInputs.heightCm}
                              onChange={(e) => setCalcInputs({ ...calcInputs, heightCm: parseInt(e.target.value) || 0 })}
                              style={{ padding: '0.45rem 0.6rem', fontSize: '0.8rem', background: 'var(--bg-black)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-white)', flexGrow: 1 }}
                            />
                          )}
                        </div>
                      </div>

                      {/* Activity & Goal */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                        <div>
                          <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '0.3rem', display: 'block', color: 'var(--text-muted)' }}>Activity</label>
                          <select 
                            className="form-input"
                            value={calcInputs.activity}
                            onChange={(e) => setCalcInputs({ ...calcInputs, activity: e.target.value })}
                            style={{ padding: '0.45rem 0.6rem', fontSize: '0.8rem', background: 'var(--bg-black)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-white)', width: '100%' }}
                          >
                            <option value="1.2">Sedentary</option>
                            <option value="1.375">Light</option>
                            <option value="1.55">Moderate</option>
                            <option value="1.725">Active</option>
                            <option value="1.9">Extreme</option>
                          </select>
                        </div>
                        <div>
                          <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '0.3rem', display: 'block', color: 'var(--text-muted)' }}>Goal</label>
                          <select 
                            className="form-input"
                            value={calcInputs.goal}
                            onChange={(e) => setCalcInputs({ ...calcInputs, goal: e.target.value })}
                            style={{ padding: '0.45rem 0.6rem', fontSize: '0.8rem', background: 'var(--bg-black)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-white)', width: '100%' }}
                          >
                            <option value="-500">Weight Loss (-500 kcal)</option>
                            <option value="-250">Mild Loss (-250 kcal)</option>
                            <option value="0">Maintenance</option>
                            <option value="250">Mild Gain (+250 kcal)</option>
                            <option value="500">Weight Gain (+500 kcal)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button 
                    className="glow-btn"
                    onClick={() => {
                      const updated = { ...calcInputs, isCalculated: true };
                      setCalcInputs(updated);
                      localStorage.setItem(`apex_calories_calc_${memberKey}`, JSON.stringify(updated));
                    }}
                    style={{ width: '100%', padding: '0.65rem', fontSize: '0.85rem', marginTop: '1.2rem', cursor: 'pointer' }}
                  >
                    Calculate Targets ⚡
                  </button>
                </div>
              ) : (
                <div className="db-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '430px', padding: '2rem' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                      <h4 style={{ margin: 0, textTransform: 'uppercase', fontFamily: 'var(--font-display)', fontWeight: 800 }}>Caloric Target</h4>
                      <span style={{ fontSize: '0.72rem', background: 'rgba(0, 240, 255, 0.1)', color: 'var(--accent-cyan)', border: '1px solid rgba(0, 240, 255, 0.2)', padding: '0.2rem 0.6rem', borderRadius: '12px', fontWeight: 700 }}>
                        {calcInputs.goal === '0' ? 'Maintain' : parseFloat(calcInputs.goal) < 0 ? 'Deficit' : 'Surplus'}
                      </span>
                    </div>
                    <p className="card-subtitle" style={{ margin: '0 0 1.2rem 0', fontSize: '0.8rem' }}>Based on Mifflin-St Jeor formulas</p>

                    {/* Target Calories Big Display */}
                    <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px', marginBottom: '1.2rem' }}>
                      <span style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--accent-volt)', fontFamily: 'var(--font-display)', display: 'block', textShadow: '0 0 15px rgba(198, 255, 0, 0.3)' }}>
                        {results.targetCalories} <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-muted)' }}>kcal/day</span>
                      </span>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '0.4rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        <span>BMR: <strong>{results.bmr} kcal</strong></span>
                        <span>•</span>
                        <span>TDEE: <strong>{results.tdee} kcal</strong></span>
                      </div>
                    </div>

                    {/* Macro Breakdown */}
                    <div className="macro-ratios" style={{ marginTop: '0.8rem' }}>
                      <div className="macro-item">
                        <div className="macro-circle" style={{ '--percent': results.pPct, '--color': '#ff3e6c', width: '76px', height: '76px' }}>
                          <span style={{ fontSize: '0.95rem' }}>{results.pPct}%</span>
                        </div>
                        <h5 style={{ fontSize: '0.85rem', margin: '0.4rem 0 0.15rem 0' }}>Protein</h5>
                        <p style={{ fontSize: '0.72rem' }}>{results.proteinGrams}g</p>
                      </div>
                      <div className="macro-item">
                        <div className="macro-circle" style={{ '--percent': results.cPct, '--color': 'var(--accent-volt)', width: '76px', height: '76px' }}>
                          <span style={{ fontSize: '0.95rem' }}>{results.cPct}%</span>
                        </div>
                        <h5 style={{ fontSize: '0.85rem', margin: '0.4rem 0 0.15rem 0' }}>Carbs</h5>
                        <p style={{ fontSize: '0.72rem' }}>{results.carbsGrams}g</p>
                      </div>
                      <div className="macro-item">
                        <div className="macro-circle" style={{ '--percent': results.fPct, '--color': 'var(--accent-cyan)', width: '76px', height: '76px' }}>
                          <span style={{ fontSize: '0.95rem' }}>{results.fPct}%</span>
                        </div>
                        <h5 style={{ fontSize: '0.85rem', margin: '0.4rem 0 0.15rem 0' }}>Fats</h5>
                        <p style={{ fontSize: '0.72rem' }}>{results.fatsGrams}g</p>
                      </div>
                    </div>
                  </div>

                  <button 
                    className="outline-btn"
                    onClick={() => {
                      setCalcInputs({ ...calcInputs, isCalculated: false });
                    }}
                    style={{ width: '100%', padding: '0.5rem', fontSize: '0.8rem', marginTop: '1.2rem', cursor: 'pointer', borderStyle: 'dashed' }}
                  >
                    ⚙️ Recalculate / Edit Inputs
                  </button>
                </div>
              );
            })()}
          </div>

          {/* BILLING HISTORY & GOALS STATUS */}
          <div className="db-grid-row" style={{ marginTop: '1.8rem' }}>
            <div className="db-card flex-card">
              <h4>My Invoices & Payment History</h4>
              <p className="card-subtitle">Recent transactions and subscription billing statements</p>
              <div className="table-wrapper" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                <table className="db-table" id="member-payments-table">
                  <thead>
                    <tr>
                      <th>Invoice ID</th>
                      <th>Plan Tier</th>
                      <th>Amount Charged</th>
                      <th>Payment Status</th>
                      <th>Billing Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {billingInvoices.length === 0 ? (
                      <tr className="empty-pay-row">
                        <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem', padding: '1.2rem' }}>
                          No invoices logged.
                        </td>
                      </tr>
                    ) : (
                      billingInvoices
                        .slice((homeInvoicePage - 1) * ITEMS_PER_PAGE, homeInvoicePage * ITEMS_PER_PAGE)
                        .map((inv, idx) => (
                          <tr key={idx}>
                            <td style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--accent-cyan)' }}>{inv.txId}</td>
                            <td>{inv.plan}</td>
                            <td><strong>${inv.amount.toFixed(2)}</strong></td>
                            <td><span className="status-badge paid">{inv.status}</span></td>
                            <td>{inv.date}</td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>

              {renderPaginationBar(
                homeInvoicePage,
                Math.ceil(billingInvoices.length / ITEMS_PER_PAGE) || 1,
                billingInvoices.length,
                setHomeInvoicePage,
                ITEMS_PER_PAGE
              )}
            </div>

            <div className="db-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '380px' }}>
              {selectedTrainer ? (
                <>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                      <div>
                        <h4 style={{ margin: 0 }}>Personal Trainer</h4>
                        <p className="card-subtitle" style={{ margin: '0.2rem 0 0 0' }}>Your assigned fitness & conditioning coach</p>
                      </div>
                      <span className="status-badge paid" style={{ fontSize: '0.7rem' }}>
                        Assigned
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px', marginBottom: '1.2rem' }}>
                      <div style={{
                        width: '54px',
                        height: '54px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--accent-volt) 0%, var(--accent-cyan) 100%)',
                        color: 'var(--bg-black)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: 'var(--font-display)',
                        fontWeight: 800,
                        fontSize: '1.2rem',
                        boxShadow: 'var(--glow-volt)',
                        flexShrink: 0
                      }}>
                        {selectedTrainer.name ? selectedTrainer.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'PT'}
                      </div>
                      <div>
                        <h5 style={{ color: 'var(--text-white)', fontWeight: 800, fontSize: '1rem', margin: 0 }}>
                          {selectedTrainer.name}
                        </h5>
                        <span style={{ color: 'var(--accent-volt)', fontSize: '0.78rem', fontWeight: 700, display: 'block', marginTop: '0.15rem' }}>
                          {selectedTrainer.specialty || 'Certified Strength & Performance Coach'}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.5rem' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                        <strong style={{ color: 'var(--text-white)' }}>Credentials:</strong> {selectedTrainer.credentials || 'CSCS, Fitness Specialist'}
                      </div>
                      
                      <div style={{ background: 'rgba(0,0,0,0.15)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.8rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        <div style={{ marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" style={{ color: 'var(--accent-cyan)' }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <strong>Email:</strong> {selectedTrainer.email || 'coach@apex.com'}
                        </div>
                        {selectedTrainer.phone && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" style={{ color: 'var(--accent-cyan)' }}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            <strong>Phone:</strong> {selectedTrainer.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (onNavigateSubView) onNavigateSubView('trainer');
                      setTrainerTabMode('assigned');
                    }}
                    className="glow-btn"
                    style={{ width: '100%', padding: '0.75rem', fontSize: '0.82rem', cursor: 'pointer' }}
                  >
                    Manage Coaching & Booking →
                  </button>
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
                  <div>
                    <h4 style={{ margin: 0 }}>Personal Trainer</h4>
                    <p className="card-subtitle" style={{ margin: '0.2rem 0 0 0' }}>No trainer assigned yet</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.5', marginTop: '1.5rem' }}>
                      Assign a certified personal trainer to design custom training modules, prescribe dietary plans, and accelerate your overall progress.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (onNavigateSubView) onNavigateSubView('trainer');
                      setTrainerTabMode('select');
                    }}
                    className="glow-btn"
                    style={{ width: '100%', padding: '0.75rem', fontSize: '0.82rem', marginTop: '2rem', cursor: 'pointer' }}
                  >
                    Select a Personal Trainer Now →
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* 2. DEDICATED COACH / TRAINER VIEW */}
      {activeView === 'trainer' && (
        <div className="member-sub-view" id="member-subview-trainer" style={{ display: 'block' }}>

          {!isTrainerPaid ? (
            !showTrainerSelection ? (
              /* GATE STEP 1: ONE FORM WITH ONE BUTTON "SELECT YOUR TRAINER" */
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center', padding: '2rem' }}>
                <div className="db-card" style={{ maxWidth: '500px', width: '100%', padding: '3rem', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'rgba(14,14,18,0.85)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)' }}>
                  <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-volt) 0%, var(--accent-cyan) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', margin: '0 auto 1.5rem auto', boxShadow: 'var(--glow-volt)' }}>
                    🏋️‍♂️
                  </div>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.8rem', color: 'var(--text-white)', textTransform: 'uppercase', marginBottom: '0.8rem', letterSpacing: '0.03em' }}>
                    Personal Coaching
                  </h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '2.5rem' }}>
                    Hire a certified personal trainer to design custom training programs, prescribe custom dietary plans, and chat 1-on-1 in real-time.
                  </p>
                  <form onSubmit={(e) => { e.preventDefault(); setShowTrainerSelection(true); }}>
                    <button type="submit" className="glow-btn" style={{ width: '100%', padding: '1rem', fontSize: '1rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer' }}>
                      Select Your Trainer
                    </button>
                  </form>
                </div>
              </div>
            ) : (
              /* GATE STEP 2: SHOW TRAINERS TO SELECT & CONTINUE TO PAYMENT */
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.8rem' }}>
                  <div>
                    <h3 style={{ color: 'var(--text-white)', fontSize: '1.25rem', margin: 0, textTransform: 'uppercase', fontFamily: 'var(--font-display)', fontWeight: 800 }}>
                      Choose Your Coach
                    </h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '0.2rem' }}>
                      Select a trainer below to continue to the payment process and activate your coaching portal.
                    </p>
                  </div>
                  <button
                    className="outline-btn"
                    onClick={() => setShowTrainerSelection(false)}
                    style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', cursor: 'pointer' }}
                  >
                    ← Back
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                  {availableTrainers
                    .slice((trainerGridPage - 1) * GRID_ITEMS_PER_PAGE, trainerGridPage * GRID_ITEMS_PER_PAGE)
                    .map((t, idx) => {
                      const initials = t.name ? t.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'CT';

                      return (
                        <div
                          key={t.userId || t._id || idx}
                          className="db-card"
                          style={{
                            border: '1px solid var(--border-color)',
                            background: 'var(--bg-card)',
                            padding: '1.5rem',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            position: 'relative'
                          }}
                        >
                          <div>
                            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-cyan) 0%, var(--accent-volt) 100%)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.4rem', marginBottom: '1rem' }}>
                              {initials}
                            </div>

                            <h4 style={{ color: 'var(--text-white)', margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>{t.name}</h4>
                            <span style={{ color: 'var(--accent-cyan)', fontSize: '0.78rem', fontWeight: 700, display: 'block', margin: '0.2rem 0 0.8rem 0' }}>
                              {t.specialty || 'Certified Strength & Performance Coach'}
                            </span>

                            <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.8rem', marginBottom: '1rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                              <div style={{ marginBottom: '0.3rem' }}><strong style={{ color: 'var(--text-white)' }}>Credentials:</strong> {t.credentials || 'CSCS, Fitness Specialist'}</div>
                              <div><strong style={{ color: 'var(--text-white)' }}>Contact:</strong> {t.email} {t.phone ? `(${t.phone})` : ''}</div>
                            </div>

                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4, marginBottom: '1.5rem' }}>
                              {t.bio || 'Dedicated certified trainer focused on progressive overload, form biomechanics, and personalized fitness goals.'}
                            </p>
                          </div>

                          <button
                            className="glow-btn"
                            onClick={() => handleSelectCoach(t)}
                            style={{ width: '100%', padding: '0.75rem', fontSize: '0.82rem', cursor: 'pointer' }}
                          >
                            Choose {t.name} & Pay →
                          </button>
                        </div>
                      );
                    })}
                </div>

                {renderPaginationBar(
                  trainerGridPage,
                  Math.ceil(availableTrainers.length / GRID_ITEMS_PER_PAGE) || 1,
                  availableTrainers.length,
                  setTrainerGridPage,
                  GRID_ITEMS_PER_PAGE
                )}
              </div>
            )
          ) : (
            /* PAID FLOW: DEDICATED COACH VIEWS - 3-COLUMN LAYOUT */
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr 0.9fr', gap: '1.5rem', alignItems: 'stretch' }}>
                
                {/* COLUMN 1: ASSIGNED PERSONAL COACH DETAILS */}
                <div className="db-card" style={{ minHeight: 'auto', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div>
                      <h4 style={{ margin: 0, textTransform: 'uppercase', fontFamily: 'var(--font-display)', fontWeight: 800 }}>Assigned Personal Coach</h4>
                      <p className="card-subtitle" style={{ margin: '0.2rem 0 1.2rem 0', fontSize: '0.8rem' }}>Trainer credentials & availability</p>
                    </div>

                    <div className="trainer-full-bio" style={{ textAlign: 'center', marginTop: '1rem' }}>
                      <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-cyan) 0%, var(--accent-volt) 100%)', color: 'var(--bg-black)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '2rem', margin: '0 auto 1.2rem auto', boxShadow: 'var(--glow-cyan)' }}>
                        {selectedTrainer?.name ? selectedTrainer.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'MV'}
                      </div>
                      <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.25rem', color: 'var(--text-white)', margin: 0 }}>
                        {selectedTrainer?.name || 'Coach Marcus Vance'}
                      </h3>
                      <p style={{ color: 'var(--accent-volt)', fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', marginTop: '0.15rem', marginBottom: '1.2rem' }}>
                        {selectedTrainer?.specialty || 'Strength & Conditioning Master'}
                      </p>

                      <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.8rem', textAlign: 'left', marginBottom: '1.2rem' }}>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.45, margin: 0 }}>
                          {selectedTrainer?.bio || 'Certified fitness & performance coach dedicated to periodized athletic training and biomechanics.'}
                        </p>
                      </div>

                      <div style={{ background: 'rgba(0,0,0,0.15)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.8rem', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'left', marginBottom: '1.2rem' }}>
                        <div style={{ marginBottom: '0.3rem' }}><strong style={{ color: 'var(--text-white)' }}>Credentials:</strong> {selectedTrainer?.credentials || 'CSCS, Fitness Specialist'}</div>
                        <div><strong style={{ color: 'var(--text-white)' }}>Email:</strong> {selectedTrainer?.email || 'coach@apex.com'}</div>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1rem', flexDirection: 'column' }}>
                    <button
                      onClick={handleOpenDietModal}
                      className="outline-btn"
                      id="btn-member-view-diet"
                      style={{ width: '100%', padding: '0.8rem', fontSize: '0.85rem', borderColor: 'var(--accent-volt)', color: 'var(--accent-volt)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontWeight: 800, cursor: 'pointer' }}
                    >
                      🥗 View Prescribed Diet Plan
                    </button>
                  </div>
                </div>

                {/* COLUMN 2: TRAINER COMMUNICATION LOG */}
                <div className="db-card flex-card" style={{ minHeight: 'auto', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <h4 style={{ margin: 0, textTransform: 'uppercase', fontFamily: 'var(--font-display)', fontWeight: 800 }}>Trainer Communication Log</h4>
                    <p className="card-subtitle" style={{ margin: '0.2rem 0 1.2rem 0', fontSize: '0.8rem' }}>Direct chat channel with {selectedTrainer?.name || 'Coach'}</p>
                  </div>

                  <div className="coach-portal-widget" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '380px' }}>
                    <div
                      className="coach-chat-box"
                      id="subview-chat-history"
                      ref={chatHistoryRef}
                      style={{ flexGrow: 1, overflowY: 'auto', background: 'rgba(0,0,0,0.15)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '1rem' }}
                    >
                      {chatHistory.length === 0 ? (
                        <div style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem', padding: '2rem 1.2rem', margin: 'auto' }}>
                          No chat history with {selectedTrainer?.name || 'Coach'}. Type below to send a direct message.
                        </div>
                      ) : (
                        chatHistory.map((bubble, idx) => {
                          const isScheduleMsg = bubble.text && (bubble.text.includes('[SCHEDULE DISPATCH]') || bubble.text.includes('Scheduled for'));
                          return (
                            <div
                              key={idx}
                              className={`chat-bubble ${bubble.sender}`}
                              style={{
                                alignSelf: bubble.sender === 'member' ? 'flex-end' : 'flex-start',
                                maxWidth: isScheduleMsg ? '92%' : '85%',
                                background: isScheduleMsg ? 'rgba(0, 240, 255, 0.08)' : (bubble.sender === 'member' ? 'var(--accent-volt)' : 'rgba(255,255,255,0.03)'),
                                color: bubble.sender === 'member' ? 'var(--bg-black)' : 'var(--text-white)',
                                border: isScheduleMsg ? '1px solid var(--accent-cyan)' : (bubble.sender === 'member' ? 'none' : '1px solid var(--border-color)'),
                                padding: '0.8rem 1rem',
                                borderRadius: bubble.sender === 'member' ? '8px 8px 0 8px' : '8px 8px 8px 0',
                                fontSize: '0.85rem',
                                lineHeight: 1.4,
                                boxShadow: isScheduleMsg ? '0 0 15px rgba(0, 240, 255, 0.15)' : 'none'
                              }}
                            >
                              {isScheduleMsg && (
                                <div style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                  <span>📅 TRAINER SCHEDULE DISPATCH</span>
                                  <span style={{ fontSize: '0.62rem', background: 'rgba(0, 240, 255, 0.2)', padding: '0.1rem 0.4rem', borderRadius: '3px' }}>SYNCED</span>
                                </div>
                              )}
                              <p style={{ fontWeight: bubble.sender === 'member' ? 600 : 'normal', margin: 0 }}>
                                {bubble.text}
                              </p>
                              <span style={{ display: 'block', fontSize: '0.65rem', color: bubble.sender === 'member' ? 'rgba(8,8,10,0.6)' : 'var(--text-dim)', marginTop: '0.4rem', textAlign: 'right' }}>
                                {bubble.time}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>

                    <form onSubmit={handleChatSubmit} id="subview-chat-form" style={{ display: 'flex', gap: '0.6rem' }}>
                      <input
                        type="text"
                        id="subview-chat-input"
                        placeholder={`Type message to ${selectedTrainer?.name || 'Coach'}...`}
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        className="form-input"
                        style={{ padding: '0.8rem', fontSize: '0.88rem', flexGrow: 1 }}
                        required
                      />
                      <button type="submit" className="glow-btn" style={{ padding: '0 1.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                        Send
                      </button>
                    </form>
                  </div>
                </div>

                {/* COLUMN 3: SWITCH COACH SIDEBAR */}
                <div className="db-card" style={{ minHeight: 'auto', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div>
                      <h4 style={{ margin: 0, textTransform: 'uppercase', fontFamily: 'var(--font-display)', fontWeight: 800 }}>Gym Coaches</h4>
                      <p className="card-subtitle" style={{ margin: '0.2rem 0 1.2rem 0', fontSize: '0.8rem' }}>Switch trainer anytime</p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', maxHeight: '420px', overflowY: 'auto', paddingRight: '0.2rem' }}>
                      {availableTrainers
                        .filter(t => t.name !== selectedTrainer?.name && t.userId !== selectedTrainer?.userId)
                        .map((t, idx) => {
                          const initials = t.name ? t.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'CT';
                          return (
                            <div
                              key={t.userId || t._id || idx}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.8rem',
                                padding: '0.8rem',
                                background: 'rgba(255, 255, 255, 0.01)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '8px',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <div style={{
                                width: '42px',
                                height: '42px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, var(--accent-cyan) 0%, var(--accent-volt) 100%)',
                                color: '#000',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontFamily: 'var(--font-display)',
                                fontWeight: 800,
                                fontSize: '0.95rem',
                                flexShrink: 0
                              }}>
                                {initials}
                              </div>
                              <div style={{ flexGrow: 1, minWidth: 0 }}>
                                <h5 style={{ color: 'var(--text-white)', fontWeight: 700, fontSize: '0.88rem', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {t.name}
                                </h5>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {t.specialty || 'Gym Coach'}
                                </span>
                              </div>
                              <button
                                type="button"
                                className="outline-btn"
                                onClick={() => handleSwitchTrainer(t)}
                                style={{
                                  padding: '0.35rem 0.6rem',
                                  fontSize: '0.7rem',
                                  borderColor: 'var(--accent-volt)',
                                  color: 'var(--accent-volt)',
                                  flexShrink: 0,
                                  cursor: 'pointer'
                                }}
                              >
                                Switch
                              </button>
                            </div>
                          );
                        })}
                      {availableTrainers.filter(t => t.name !== selectedTrainer?.name && t.userId !== selectedTrainer?.userId).length === 0 && (
                        <div style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.75rem', padding: '1rem' }}>
                          No other coaches available.
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.8rem', fontSize: '0.72rem', color: 'var(--text-dim)', textAlign: 'center' }}>
                    Clicking Switch will re-assign your personal coach and load their routines.
                  </div>
                </div>

              </div>

              {/* PRESCRIBED DIET PLAN MODAL OVERLAY */}
              {showDietModal && (
                <div style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  background: 'rgba(5, 5, 8, 0.88)',
                  backdropFilter: 'blur(10px)',
                  zIndex: 999999,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '1rem'
                }}>
                  <div style={{
                    background: '#0d0d14',
                    border: '1px solid var(--accent-volt)',
                    boxShadow: '0 0 35px rgba(198, 255, 0, 0.2)',
                    borderRadius: '14px',
                    width: '100%',
                    maxWidth: '650px',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    padding: '2rem',
                    position: 'relative',
                    color: 'var(--text-white)'
                  }}>
                    <button
                      type="button"
                      onClick={() => setShowDietModal(false)}
                      style={{
                        position: 'absolute',
                        top: '1.2rem',
                        right: '1.2rem',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        fontSize: '1.8rem',
                        cursor: 'pointer'
                      }}
                    >
                      &times;
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '1.8rem' }}>🥗</span>
                      <div>
                        <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.35rem', color: 'var(--text-white)', margin: 0, textTransform: 'uppercase' }}>
                          Prescribed Diet & Meal Plan
                        </h3>
                        <p style={{ color: 'var(--accent-volt)', fontSize: '0.78rem', margin: 0, fontWeight: 700 }}>
                          Prescribed by {selectedTrainer?.name || 'Personal Coach'}
                        </p>
                      </div>
                    </div>

                    {memberDietPlan ? (
                      <div style={{ marginTop: '1.2rem' }}>
                        {/* Plan Title & Goal Badge */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '0.9rem', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '1.2rem' }}>
                          <div>
                            <h4 style={{ color: 'var(--text-white)', fontWeight: 800, fontSize: '1.1rem', margin: 0, textTransform: 'uppercase' }}>
                              {memberDietPlan.name}
                            </h4>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '0.2rem 0 0 0' }}>
                              {memberDietPlan.desc}
                            </p>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: '0.7rem', background: 'rgba(198,255,0,0.12)', color: 'var(--accent-volt)', border: '1px solid var(--accent-volt)', padding: '0.2rem 0.6rem', borderRadius: '4px', fontWeight: 800, textTransform: 'uppercase' }}>
                              {memberDietPlan.goalCategory || 'Custom'}
                            </span>
                            <div style={{ color: 'var(--accent-cyan)', fontSize: '0.95rem', fontWeight: 800, marginTop: '0.3rem' }}>
                              {memberDietPlan.calories}
                            </div>
                          </div>
                        </div>

                        {/* Macros Distribution */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.8rem', marginBottom: '1.5rem' }}>
                          <div style={{ background: '#12121e', padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(255,62,108,0.3)', textAlign: 'center' }}>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>PROTEIN</span>
                            <strong style={{ color: '#ff3e6c', fontSize: '1.2rem' }}>{memberDietPlan.protein}g</strong>
                          </div>
                          <div style={{ background: '#12121e', padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(198,255,0,0.3)', textAlign: 'center' }}>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>CARBS</span>
                            <strong style={{ color: 'var(--accent-volt)', fontSize: '1.2rem' }}>{memberDietPlan.carbs}g</strong>
                          </div>
                          <div style={{ background: '#12121e', padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(0,240,255,0.3)', textAlign: 'center' }}>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>FATS</span>
                            <strong style={{ color: 'var(--accent-cyan)', fontSize: '1.2rem' }}>{memberDietPlan.fats}g</strong>
                          </div>
                        </div>

                        {/* 5-Slot Meal Planner Schedule */}
                        <h4 style={{ color: 'var(--accent-volt)', fontSize: '0.9rem', textTransform: 'uppercase', marginBottom: '0.8rem', fontWeight: 800 }}>
                          📋 Daily 5-Meal Planner Schedule
                        </h4>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                          {[
                            { key: 'morning', title: '🌅 Morning (Breakfast)', items: memberDietPlan.mealsSchedule?.morning },
                            { key: 'lunch', title: '🥗 Lunch (Mid-day Fuel)', items: memberDietPlan.mealsSchedule?.lunch },
                            { key: 'preWorkout', title: '⚡ Pre Workout (Energy)', items: memberDietPlan.mealsSchedule?.preWorkout },
                            { key: 'postWorkout', title: '🥤 Post Workout (Recovery)', items: memberDietPlan.mealsSchedule?.postWorkout },
                            { key: 'night', title: '🌙 Night (Dinner / Bedtime)', items: memberDietPlan.mealsSchedule?.night }
                          ].map((slot) => (
                            <div key={slot.key} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.8rem' }}>
                              <strong style={{ color: 'var(--accent-cyan)', fontSize: '0.8rem', display: 'block', marginBottom: '0.4rem' }}>
                                {slot.title}
                              </strong>
                              {(!slot.items || slot.items.length === 0) ? (
                                <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem', fontStyle: 'italic' }}>No items scheduled</span>
                              ) : (
                                <ul style={{ margin: 0, paddingLeft: '1.2rem', color: 'var(--text-white)', fontSize: '0.8rem' }}>
                                  {slot.items.map((it, idx) => (
                                    <li key={idx} style={{ marginBottom: '0.2rem' }}>{it}</li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p style={{ color: 'var(--text-muted)' }}>No diet plan found.</p>
                    )}

                    <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                      <button
                        type="button"
                        className="outline-btn"
                        style={{ padding: '0.6rem 1.2rem', fontSize: '0.8rem' }}
                        onClick={() => setShowDietModal(false)}
                      >
                        Close
                      </button>
                      <button
                        type="button"
                        className="glow-btn"
                        style={{ padding: '0.6rem 1.2rem', fontSize: '0.8rem' }}
                        onClick={() => {
                          setShowDietModal(false);
                          setChatInput(`Hi ${selectedTrainer?.name || 'Coach'}, can we adjust my daily macro targets or meal items in my ${memberDietPlan?.name || 'diet plan'}?`);
                        }}
                      >
                        💬 Request Diet Revision from Coach
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* PRESCRIBED COACHING SCHEDULE & SHIFT DISPATCHES CARD */}
              <div className="db-card" style={{ marginTop: '1.5rem', width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.8rem' }}>
                  <div>
                    <h4 style={{ margin: 0, textTransform: 'uppercase', fontFamily: 'var(--font-display)', fontWeight: 800 }}>
                      📅 Prescribed Schedule & Coaching Sessions Dispatch
                    </h4>
                    <p className="card-subtitle" style={{ margin: '0.2rem 0 0 0' }}>
                      Live training sessions dispatched from Trainer Panel Schedule Module for {profileData?.name || currentUser?.name || 'Athlete'}
                    </p>
                  </div>
                  <span style={{ fontSize: '0.72rem', background: 'rgba(0, 255, 102, 0.1)', color: '#00ff66', border: '1px solid rgba(0, 255, 102, 0.3)', padding: '0.3rem 0.7rem', borderRadius: '4px', fontWeight: 800, textTransform: 'uppercase' }}>
                    ✓ Live Dispatch Connected
                  </span>
                </div>

                {memberSchedules.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem', padding: '2.5rem 1.2rem', background: 'rgba(0,0,0,0.15)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                    📅 No active coaching sessions dispatched yet. When your Personal Coach ({selectedTrainer?.name || 'Trainer'}) reserves a shift in the Trainer Panel Schedule Module, it will automatically populate here in real-time!
                  </div>
                ) : (
                  <div className="table-wrapper">
                    <table className="db-table">
                      <thead>
                        <tr>
                          <th>Shift Window</th>
                          <th>Target Time Block</th>
                          <th>Assigned Objective / Routine</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {memberSchedules
                          .slice((memberSchedulePage - 1) * ITEMS_PER_PAGE, memberSchedulePage * ITEMS_PER_PAGE)
                          .map((item, idx) => {
                          const isMorning = item.shiftCategory === 'Morning Shift' || (item.timeBlock && item.timeBlock.includes('AM'));
                          return (
                            <tr key={item.id || idx}>
                              <td>
                                <span style={{
                                  fontSize: '0.7rem',
                                  fontWeight: 800,
                                  padding: '0.25rem 0.55rem',
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
                              <td style={{ fontWeight: 600, color: 'var(--accent-volt)' }}>
                                {item.routine || item.objective}
                              </td>
                              <td>
                                <span className={`status-badge ${item.status === 'Completed' ? 'paid' : 'pending'}`} style={{
                                  background: item.status === 'Completed' ? 'rgba(0, 255, 102, 0.08)' : 'rgba(0, 240, 255, 0.08)',
                                  borderColor: item.status === 'Completed' ? 'rgba(0, 255, 102, 0.3)' : 'rgba(0, 240, 255, 0.3)',
                                  color: item.status === 'Completed' ? '#00ff66' : 'var(--accent-cyan)'
                                }}>
                                  {item.status || 'Ready'}
                                </span>
                              </td>
                              <td>
                                <button
                                  type="button"
                                  className="outline-btn"
                                  style={{ padding: '0.3rem 0.7rem', fontSize: '0.72rem', borderColor: 'var(--accent-volt)', color: 'var(--accent-volt)', cursor: 'pointer' }}
                                  onClick={() => {
                                    if (CustomSwal) {
                                      CustomSwal.fire({
                                        icon: 'info',
                                        title: 'Session Details 📅',
                                        html: `<div style="text-align:left;color:#fff;font-size:0.88rem;">
                                          <p><strong>Routine:</strong> ${item.routine || item.objective}</p>
                                          <p><strong>Time:</strong> ${item.timeBlock || item.time}</p>
                                          <p><strong>Shift:</strong> ${item.shiftCategory || 'Coaching Shift'}</p>
                                          <p><strong>Status:</strong> ${item.status || 'Ready'}</p>
                                          <p><strong>Coach:</strong> ${selectedTrainer?.name || 'Personal Coach'}</p>
                                        </div>`
                                      });
                                    }
                                  }}
                                >
                                  View Details
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {renderPaginationBar(
                  memberSchedulePage,
                  Math.ceil(memberSchedules.length / ITEMS_PER_PAGE) || 1,
                  memberSchedules.length,
                  setMemberSchedulePage,
                  ITEMS_PER_PAGE
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. DEDICATED KEYCARD ATTENDANCE GATE SCAN & ANALYTICS VIEW */}
      {activeView === 'attendance' && (
        <div className="member-sub-view" id="member-subview-attendance" style={{ display: 'block' }}>

          {/* 1. MONTHLY ATTENDANCE SUMMARY METRICS BAR */}
          <div className="metrics-grid col-3" style={{ marginBottom: '1.8rem' }}>
            <div className="metric-card">
              <div className="metric-icon" style={{ color: 'var(--accent-volt)', background: 'rgba(198,255,0,0.05)' }}>
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <div className="metric-details">
                <h3>{attendanceRate}%</h3>
                <p>Monthly Consistency Rate ({selectedAttMonth})</p>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon" style={{ color: 'var(--accent-cyan)', background: 'rgba(0,240,255,0.05)' }}>
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="metric-details">
                <h3>36.5 Hrs</h3>
                <p>Total Gym Floor Hours Logged</p>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon" style={{ color: '#ff3e6c', background: 'rgba(255,62,108,0.05)' }}>
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="metric-details">
                <h3>{attendanceStreak} Days 🔥</h3>
                <p>Active Consecutive Training Streak</p>
              </div>
            </div>
          </div>

          <div className="db-grid-row" style={{ gridTemplateColumns: (!isRegistrationFormHidden) ? '1fr 1.2fr' : '1fr', gap: '1.5rem', marginBottom: '1.8rem' }}>

            {/* CANDIDATE BIOMETRIC REGISTRATION & TRAINER SELECTION PANEL */}
            {!isRegistrationFormHidden && (
              <div className="db-card flex-card" style={{ border: '1px solid var(--accent-volt)', boxShadow: '0 0 20px rgba(198, 255, 0, 0.1)' }}>
                {!showCandidateTrainerSelection ? (
                  /* STEP 1: BIOMETRIC FACE REGISTRATION FORM */
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                      <div>
                        <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                          <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: isAttCamOn ? '#00ff66' : 'var(--text-dim)', boxShadow: isAttCamOn ? '0 0 8px #00ff66' : 'none' }}></span>
                          New Candidate Biometric Face Registration Form
                        </h4>
                        <p className="card-subtitle" style={{ margin: '0.2rem 0 0 0' }}>Step 1: 1-Time registration for new members.</p>
                      </div>
                    </div>

                    <form onSubmit={handleRegisterFaceProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                      {/* Candidate Name Input Field */}
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.78rem' }}>Candidate Full Name</label>
                        <input
                          type="text"
                          className="form-input"
                          value={attFormName}
                          onChange={(e) => setAttFormName(e.target.value)}
                          placeholder="Enter candidate full name..."
                          required
                          style={{ background: 'var(--bg-black)', border: '1px solid var(--border-color)', color: 'var(--accent-volt)', fontWeight: 700 }}
                        />
                      </div>

                      {/* Real-time Camera Viewport & Capture Box */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                        <label className="form-label" style={{ fontSize: '0.78rem', margin: 0 }}>Snap Reference Face Photo</label>

                        <div style={{
                          position: 'relative',
                          width: '100%',
                          height: '200px',
                          background: '#07070c',
                          border: '1px solid var(--border-color)',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <video
                            ref={memberVideoRef}
                            playsInline
                            muted
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              display: isAttCamOn ? 'block' : 'none'
                            }}
                          />
                          <canvas ref={memberCanvasRef} style={{ display: 'none' }} />

                          {!isAttCamOn && (
                            <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-dim)' }}>
                              <p style={{ fontSize: '0.8rem', margin: '0 0 0.8rem 0' }}>Webcam camera standby</p>
                              <button
                                type="button"
                                onClick={startMemberCam}
                                className="glow-btn"
                                style={{ padding: '0.4rem 1rem', fontSize: '0.75rem' }}
                              >
                                Activate Camera Feed
                              </button>
                            </div>
                          )}

                          {isAttCamOn && (
                            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                              <div style={{ position: 'absolute', top: '10px', left: '10px', width: '20px', height: '20px', borderTop: '2px solid var(--accent-volt)', borderLeft: '2px solid var(--accent-volt)' }}></div>
                              <div style={{ position: 'absolute', top: '10px', right: '10px', width: '20px', height: '20px', borderTop: '2px solid var(--accent-volt)', borderRight: '2px solid var(--accent-volt)' }}></div>
                              <div style={{ position: 'absolute', bottom: '10px', left: '10px', width: '20px', height: '20px', borderBottom: '2px solid var(--accent-volt)', borderLeft: '2px solid var(--accent-volt)' }}></div>
                              <div style={{ position: 'absolute', bottom: '10px', right: '10px', width: '20px', height: '20px', borderBottom: '2px solid var(--accent-volt)', borderRight: '2px solid var(--accent-volt)' }}></div>
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: '0.6rem' }}>
                          {isAttCamOn && (
                            <>
                              <button
                                type="button"
                                onClick={captureMemberPhoto}
                                className="outline-btn"
                                style={{ flex: 1, padding: '0.5rem', fontSize: '0.78rem', borderColor: 'var(--accent-volt)', color: 'var(--accent-volt)' }}
                              >
                                📸 Snap Reference Face Photo
                              </button>
                              <button
                                type="button"
                                onClick={stopMemberCam}
                                className="outline-btn"
                                style={{ padding: '0.5rem 0.8rem', fontSize: '0.78rem', borderColor: '#ff3e6c', color: '#ff3e6c' }}
                              >
                                Close
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Captured Photo Preview Thumbnail */}
                      {capturedPhoto && (
                        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', padding: '0.8rem', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <img
                            src={capturedPhoto}
                            alt="Captured Frame"
                            onClick={() => setMemberLightboxPhoto(capturedPhoto)}
                            style={{ width: '50px', height: '50px', borderRadius: '6px', objectFit: 'cover', border: '2px solid var(--accent-volt)', cursor: 'pointer' }}
                          />
                          <div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--accent-volt)', fontWeight: 'bold', display: 'block' }}>Reference Photo Ready ✓</span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Click preview to enlarge</span>
                          </div>
                        </div>
                      )}

                      {/* Submit Registration Button */}
                      <button
                        type="submit"
                        className="glow-btn"
                        style={{ padding: '0.85rem', fontSize: '0.85rem', width: '100%', marginTop: '0.5rem' }}
                      >
                        Next Step: Select Trainer ➔
                      </button>
                    </form>
                  </div>
                ) : (
                  /* STEP 2: TRAINER SELECTION FOR REGISTERED CANDIDATE */
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.6rem' }}>
                      <div>
                        <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, color: 'var(--accent-volt)' }}>
                          <span>🏋️</span> Step 2: Select Your Personal Trainer
                        </h4>
                        <p className="card-subtitle" style={{ margin: '0.2rem 0 0 0' }}>
                          Candidate <strong>{attFormName}</strong> registered! Select a coach below to open your Trainer Page.
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.9rem', maxHeight: '420px', overflowY: 'auto', paddingRight: '0.3rem' }}>
                      {availableTrainers.map((t, idx) => {
                        const initials = t.name ? t.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'CT';
                        return (
                          <div
                            key={t.userId || t._id || idx}
                            style={{
                              background: 'var(--bg-black)',
                              border: '1px solid var(--border-color)',
                              borderRadius: '8px',
                              padding: '1rem',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '0.6rem'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                              <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, var(--accent-volt), #00f0ff)',
                                color: '#000',
                                fontWeight: 900,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.85rem'
                              }}>
                                {initials}
                              </div>
                              <div style={{ flex: 1 }}>
                                <h5 style={{ margin: 0, color: 'var(--text-white)', fontSize: '0.95rem' }}>{t.name}</h5>
                                <span style={{ fontSize: '0.72rem', color: 'var(--accent-volt)', display: 'block' }}>{t.specialty || 'Certified Strength Coach'}</span>
                              </div>
                            </div>

                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                              {t.bio || t.credentials || 'Dedicated certified coach available for personal workout & nutrition guidance.'}
                            </p>

                            <button
                              type="button"
                              onClick={() => handleCandidateSelectTrainer(t)}
                              className="glow-btn"
                              style={{ width: '100%', padding: '0.55rem', fontSize: '0.78rem', marginTop: '0.2rem', cursor: 'pointer' }}
                            >
                              Select {t.name.split(' ')[0]} & Open Trainer Page ➔
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 2. MONTHLY ATTENDANCE CALENDAR & HISTORY GRID CARD */}
            <div className="db-card flex-card" style={{ height: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h4>Monthly Attendance Calendar & History</h4>
                  <p className="card-subtitle" style={{ margin: 0 }}>Visual streak tracking & monthly consistency log</p>
                </div>

                {/* MONTH SELECTOR DROPDOWN */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Select Month:</label>
                  <select
                    className="form-input"
                    value={selectedAttMonth}
                    onChange={(e) => setSelectedAttMonth(e.target.value)}
                    style={{ background: 'var(--bg-black)', border: '1px solid var(--border-color)', color: 'var(--accent-volt)', padding: '0.35rem 0.8rem', fontSize: '0.78rem', fontWeight: 700 }}
                  >
                    <option value="August 2026">August 2026</option>
                    <option value="July 2026">July 2026</option>
                    <option value="June 2026">June 2026</option>
                    <option value="May 2026">May 2026</option>
                    <option value="April 2026">April 2026</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '1.5rem', marginTop: '1.5rem' }}>
                <div>
                  <h5 style={{ color: 'var(--text-white)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.8rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{selectedAttMonth} Calendar Grid</span>
                    <span style={{ color: 'var(--accent-volt)' }}>{activeDays.length} / 31 Days Active</span>
                  </h5>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.4rem', textAlign: 'center', fontSize: '0.72rem' }}>
                    {renderCalendarGrid()}
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '0.8rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><span style={{ width: '8px', height: '8px', background: 'var(--accent-volt)', borderRadius: '2px' }}></span> Checked In</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><span style={{ width: '8px', height: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', borderRadius: '2px' }}></span> Rest Day</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '0.8rem' }}>
                  <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', padding: '0.75rem 0.9rem', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'block' }}>Streak Duration</span>
                      <strong style={{ color: 'var(--accent-volt)', fontSize: '1rem' }}>{attendanceStreak} Days 🔥</strong>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'block' }}>Avg Check-in Time</span>
                      <strong style={{ color: 'var(--accent-cyan)', fontSize: '0.9rem' }}>08:30 AM</strong>
                    </div>
                  </div>

                  <h5 style={{ color: 'var(--text-white)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.4rem' }}>
                    Recent Gate Check-in History
                  </h5>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', minHeight: '160px' }}>
                    {sessions.length === 0 ? (
                      <div style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.75rem', padding: '1rem', border: '1px dashed var(--border-color)', borderRadius: '4px' }}>
                        No attendance history logged.
                      </div>
                    ) : (
                      sessions
                        .slice((sessionPage - 1) * ITEMS_PER_PAGE, sessionPage * ITEMS_PER_PAGE)
                        .map((sess, idx) => (
                          <div
                            key={idx}
                            className="session-list-item"
                            style={{
                              background: 'rgba(255,255,255,0.01)',
                              border: '1px solid var(--border-color)',
                              padding: '0.4rem 0.6rem',
                              borderRadius: '4px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              fontSize: '0.75rem'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                              {sess.photo && (
                                <img
                                  src={sess.photo}
                                  alt="Snap"
                                  onClick={() => setMemberLightboxPhoto(sess.photo)}
                                  style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--accent-volt)', cursor: 'pointer' }}
                                />
                              )}
                              <span style={{ color: 'var(--text-white)' }}>{sess.date}</span>
                            </div>
                            <span style={{ color: 'var(--text-muted)' }}>{sess.time}</span>
                            <span
                              style={{
                                color: sess.type && sess.type.includes('Check-in') ? '#00ff66' : '#ff5e00',
                                fontWeight: 'bold',
                                fontSize: '0.7rem',
                                textTransform: 'uppercase'
                              }}
                            >
                              {sess.type}
                            </span>
                          </div>
                        ))
                    )}
                  </div>

                  {renderPaginationBar(
                    sessionPage,
                    Math.ceil(sessions.length / ITEMS_PER_PAGE) || 1,
                    sessions.length,
                    setSessionPage,
                    ITEMS_PER_PAGE
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* 3. ATTENDANCE REPORT & ANALYTICS SUMMARY CARD */}
          <div className="db-card" style={{ marginBottom: '1.8rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.2rem' }}>
              <div>
                <h4 style={{ margin: 0, color: 'var(--text-white)' }}>Official Biometric Attendance Report</h4>
                <p className="card-subtitle" style={{ margin: '0.2rem 0 0 0' }}>Generate & export certified attendance statements for training verification</p>
              </div>

              <div style={{ display: 'flex', gap: '0.8rem' }}>
                <button
                  type="button"
                  onClick={() => handleDownloadAttReport('pdf')}
                  className="glow-btn"
                  style={{ padding: '0.45rem 1.1rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  📄 Download PDF Report
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadAttReport('csv')}
                  className="outline-btn"
                  style={{ padding: '0.45rem 1.1rem', fontSize: '0.78rem', borderColor: 'var(--accent-cyan)', color: 'var(--accent-cyan)' }}
                >
                  📊 Export CSV Log
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.2rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', padding: '1rem', borderRadius: '6px' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Report Period</span>
                <h5 style={{ color: 'var(--text-white)', margin: '0.2rem 0 0 0', fontWeight: 800 }}>{selectedAttMonth}</h5>
                <span style={{ fontSize: '0.72rem', color: 'var(--accent-volt)' }}>31 Total Calendar Days</span>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', padding: '1rem', borderRadius: '6px' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Peak Workout Window</span>
                <h5 style={{ color: 'var(--text-white)', margin: '0.2rem 0 0 0', fontWeight: 800 }}>08:15 AM - 10:00 AM</h5>
                <span style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)' }}>Morning Training Bias</span>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', padding: '1rem', borderRadius: '6px' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Biometric Scan Method</span>
                <h5 style={{ color: 'var(--text-white)', margin: '0.2rem 0 0 0', fontWeight: 800 }}>AI Face & RFID Gate</h5>
                <span style={{ fontSize: '0.72rem', color: '#00ff66' }}>100% Identity Verified ✓</span>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', padding: '1rem', borderRadius: '6px' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Attendance Compliance</span>
                <h5 style={{ color: '#00ff66', margin: '0.2rem 0 0 0', fontWeight: 800 }}>EXCELLENT (Tier 1)</h5>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Eligible for VIP Perks</span>
              </div>
            </div>
          </div>

          {/* 4. DETAILED ATTENDANCE RECORDS & HISTORY TABLE */}
          <div className="db-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.2rem' }}>
              <div>
                <h4 style={{ margin: 0, color: 'var(--text-white)' }}>Official Member Attendance Records & Gate History</h4>
                <p className="card-subtitle" style={{ margin: '0.2rem 0 0 0' }}>Complete audit trail of all gate check-in & check-out logs</p>
              </div>

              <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
                {/* Search Input */}
                <input
                  type="text"
                  placeholder="Search date, time, status..."
                  value={attRecordSearch}
                  onChange={(e) => { setAttRecordSearch(e.target.value); setAttRecordPage(1); }}
                  className="form-input"
                  style={{ width: '210px', padding: '0.45rem 0.8rem', fontSize: '0.78rem' }}
                />

                {/* Filter Selector */}
                <select
                  value={attRecordFilter}
                  onChange={(e) => { setAttRecordFilter(e.target.value); setAttRecordPage(1); }}
                  className="form-input"
                  style={{ background: 'var(--bg-black)', border: '1px solid var(--border-color)', color: 'var(--text-white)', padding: '0.45rem 0.8rem', fontSize: '0.78rem' }}
                >
                  <option value="all">All Gate Records</option>
                  <option value="facescan">AI Face Biometrics</option>
                  <option value="rfid">RFID Turnstile Gate</option>
                  <option value="manual">Manual (Trainer)</option>
                  <option value="entry">Gate Entries Only</option>
                  <option value="exit">Gate Exits Only</option>
                </select>
              </div>
            </div>

            {/* Attendance Records Table */}
            {(() => {
              const filteredRecords = attendanceRecords.filter((rec) => {
                const matchesSearch = rec.date.toLowerCase().includes(attRecordSearch.toLowerCase()) ||
                  rec.time.toLowerCase().includes(attRecordSearch.toLowerCase()) ||
                  rec.scanMethod.toLowerCase().includes(attRecordSearch.toLowerCase()) ||
                  rec.id.toLowerCase().includes(attRecordSearch.toLowerCase());

                if (!matchesSearch) return false;

                if (attRecordFilter === 'facescan') return rec.scanMethod.includes('AI Face');
                if (attRecordFilter === 'rfid') return rec.scanMethod.includes('RFID');
                if (attRecordFilter === 'manual') return rec.scanMethod.includes('Manual');
                if (attRecordFilter === 'entry') return rec.gateAction.includes('Entry');
                if (attRecordFilter === 'exit') return rec.gateAction.includes('Exit');
                return true;
              });

              const totalPages = Math.ceil(filteredRecords.length / ITEMS_PER_PAGE) || 1;
              const paginatedRecords = filteredRecords.slice((attRecordPage - 1) * ITEMS_PER_PAGE, attRecordPage * ITEMS_PER_PAGE);

              return (
                <div>
                  <div className="table-wrapper">
                    <table className="db-table">
                      <thead>
                        <tr>
                          <th>Record ID</th>
                          <th>Athlete Member</th>
                          <th>Date & Time</th>
                          <th>Scan Method</th>
                          <th>Gate Action</th>
                          <th>Hours Logged</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedRecords.length === 0 ? (
                          <tr>
                            <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '1.8rem', fontSize: '0.82rem' }}>
                              No attendance records found matching search parameters.
                            </td>
                          </tr>
                        ) : (
                          paginatedRecords.map((rec) => (
                            <tr key={rec.id}>
                              <td style={{ fontFamily: 'monospace', color: 'var(--accent-cyan)', fontWeight: 700 }}>{rec.id}</td>
                              <td><strong>{rec.memberName}</strong></td>
                              <td>{rec.date} <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>({rec.time})</span></td>
                              <td>
                                <span style={{ fontSize: '0.7rem', background: rec.scanMethod.includes('AI Face') ? 'rgba(0, 255, 102, 0.08)' : 'rgba(0, 240, 255, 0.08)', color: rec.scanMethod.includes('AI Face') ? '#00ff66' : 'var(--accent-cyan)', padding: '0.15rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', fontWeight: 600 }}>
                                  {rec.scanMethod}
                                </span>
                              </td>
                              <td><strong style={{ color: rec.gateAction.includes('Entry') ? 'var(--text-white)' : '#ff9f00' }}>{rec.gateAction}</strong></td>
                              <td>{rec.hoursLogged}</td>
                              <td>
                                <span className={`status-badge ${rec.status === 'Active' ? 'pending' : 'paid'}`} style={{ fontSize: '0.68rem', padding: '0.2rem 0.5rem' }}>
                                  {rec.status.toUpperCase()} {rec.status === 'Active' ? '⚡' : '✓'}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {renderPaginationBar(
                    attRecordPage,
                    totalPages,
                    filteredRecords.length,
                    setAttRecordPage,
                    ITEMS_PER_PAGE
                  )}
                </div>
              );
            })()}

          </div>

          {/* MEMBER LIGHTBOX MODAL FOR CAPTURED PHOTO */}
          {memberLightboxPhoto && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              background: 'rgba(5, 5, 8, 0.92)',
              backdropFilter: 'blur(10px)',
              zIndex: 999999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2rem'
            }}>
              <div style={{ position: 'relative', textAlign: 'center' }}>
                <button
                  onClick={() => setMemberLightboxPhoto(null)}
                  style={{
                    position: 'absolute',
                    top: '-40px',
                    right: 0,
                    background: 'none',
                    border: 'none',
                    color: '#ff3e6c',
                    fontSize: '2rem',
                    cursor: 'pointer'
                  }}
                >
                  &times;
                </button>
                <img
                  src={memberLightboxPhoto}
                  alt="Captured Attendance Real-Time Photo"
                  style={{
                    maxWidth: '85vw',
                    maxHeight: '80vh',
                    borderRadius: '12px',
                    border: '2px solid var(--accent-volt)',
                    boxShadow: '0 0 40px rgba(198, 255, 0, 0.3)'
                  }}
                />
                <p style={{ color: 'var(--accent-volt)', fontFamily: 'monospace', fontWeight: 'bold', marginTop: '1rem' }}>
                  REAL-TIME ATTENDANCE CAPTURED PHOTO VERIFICATION
                </p>
              </div>
            </div>
          )}

        </div>
      )}

      {/* 4. DEDICATED SUPPLEMENTS SHOP VIEW */}
      {activeView === 'supplements' && (
        <div className="member-sub-view" id="member-subview-supplements" style={{ display: 'block' }}>
          <SupplementShop onCheckoutSuccess={handleCheckoutSuccess} />
        </div>
      )}

      {/* 6. DEDICATED MEMBERSHIP VIEW */}
      {activeView === 'membership' && (
        <div className="member-sub-view" id="member-subview-membership" style={{ display: 'block' }}>

          {!isMembershipPaid ? (
            !showMembershipSelection ? (
              /* GATE STEP 1: ONE FORM WITH ONE BUTTON "SELECT YOUR PLAN" */
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center', padding: '2rem' }}>
                <div className="db-card" style={{ maxWidth: '500px', width: '100%', padding: '3rem', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'rgba(14,14,18,0.85)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)' }}>
                  <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(198, 255, 0, 0.05)', border: '1px solid var(--accent-volt)', color: 'var(--accent-volt)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', margin: '0 auto 1.5rem auto', boxShadow: 'var(--glow-volt)' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                    </svg>
                  </div>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.8rem', color: 'var(--text-white)', textTransform: 'uppercase', marginBottom: '0.8rem', letterSpacing: '0.03em' }}>
                    Gym Membership
                  </h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '2.5rem' }}>
                    Select a certified gym membership plan to activate your digital biometric pass keycard and unlock all premium gym access privileges.
                  </p>
                  <form onSubmit={(e) => { e.preventDefault(); setShowMembershipSelection(true); }}>
                    <button type="submit" className="glow-btn" style={{ width: '100%', padding: '1rem', fontSize: '1rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer' }}>
                      Select Your Plan
                    </button>
                  </form>
                </div>
              </div>
            ) : (
              /* GATE STEP 2: SHOW MEMBERSHIP PLANS TO CHOOSE & PAY */
              <div className="db-card" style={{ maxWidth: '850px', margin: '1rem auto', padding: '2.5rem' }}>
                <style>{`
                  .plan-selector-card {
                    transition: all 0.3s ease;
                  }
                  .plan-selector-card:hover {
                    border-color: var(--accent-volt) !important;
                    background: rgba(198, 255, 0, 0.02) !important;
                    box-shadow: 0 4px 20px rgba(198, 255, 0, 0.05);
                    transform: translateY(-2px);
                  }
                `}</style>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                  <div style={{ textAlign: 'left' }}>
                    <h3 style={{
                      fontFamily: 'var(--font-display)',
                      fontWeight: 800,
                      fontSize: '1.5rem',
                      color: 'var(--text-white)',
                      textTransform: 'uppercase',
                      margin: 0
                    }}>
                      Select Your Membership Plan
                    </h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.3rem' }}>
                      Select a membership tier to continue to the checkout and activate your account.
                    </p>
                  </div>
                  <button
                    className="outline-btn"
                    onClick={() => setShowMembershipSelection(false)}
                    style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', cursor: 'pointer' }}
                  >
                    ← Back
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
                  {[plans['Muscle Core'], plans['Muscle Pro'], plans['Muscle Elite']].map((plan) => {
                    return (
                      <div
                        key={plan.name}
                        style={{
                          background: 'rgba(255,255,255,0.01)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '10px',
                          padding: '1.8rem',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          minHeight: '280px'
                        }}
                        className="plan-selector-card"
                      >
                        <div>
                          <h4 style={{ color: 'var(--text-white)', fontWeight: 800, fontSize: '1.1rem', margin: '0 0 0.5rem 0' }}>{plan.name}</h4>
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', lineHeight: '1.4', margin: '0 0 1.5rem 0' }}>{plan.desc}</p>
                        </div>

                        <div>
                          <div style={{ marginBottom: '1.5rem' }}>
                            <span style={{ fontSize: '1.8rem', color: 'var(--text-white)', fontWeight: 800 }}>₹{plan.price}</span>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}> /{plan.period || 'month'}</span>
                          </div>
                          <button
                            onClick={() => handlePlanChange(plan.name)}
                            className="glow-btn"
                            style={{
                              width: '100%',
                              padding: '0.75rem',
                              fontSize: '0.85rem',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              cursor: 'pointer'
                            }}
                          >
                            Select plan
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )
          ) : (
            /* PAID VIEW: KEYCARD PASS & SUBSCRIPTION MANAGEMENT */
            <>
              <div className="db-grid-row membership-layout-row" style={{ gridTemplateColumns: '1fr 1.2fr', gap: '1.8rem' }}>
                {/* Left: Digital Pass Card */}
                <div className="db-card pass-card-container" style={{ minHeight: 'auto', display: 'flex', flexDirection: 'column' }}>
                  <h4>Digital Keycard Pass</h4>
                  <p className="card-subtitle">Biometric VIP keycard pass for scanner terminals</p>

                  <div className="digital-pass-card-wrapper" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '2rem 0' }}>
                    <div className={`digital-pass-card ${membershipTier.replace(/\s+/g, '-').toLowerCase()}`}>
                      <div className="pass-card-glow"></div>
                      <div className="pass-card-inner">
                        <div className="pass-card-header">
                          <span className="pass-brand">MUSCLE <span>HUB</span></span>
                          <span className="pass-badge">ACTIVE PASS</span>
                        </div>

                        <div className="pass-card-chip-row">
                          <div className="pass-chip">
                            <div className="pass-chip-grid"></div>
                          </div>
                          <span className="pass-tier-label">{membershipTier}</span>
                        </div>

                        <div className="pass-card-details">
                          <div className="pass-detail-col">
                            <span className="pass-label">MEMBER</span>
                            <span className="pass-value">{currentUser.name}</span>
                          </div>
                          <div className="pass-detail-col" style={{ textAlign: 'right' }}>
                            <span className="pass-label">MEMBER ID</span>
                            <span className="pass-value" style={{ fontFamily: 'monospace' }}>MEM-90210</span>
                          </div>
                        </div>

                        <div className="pass-card-footer">
                          <div className="pass-barcode-container">
                            <div className="pass-barcode">
                              <span className="barcode-bar"></span>
                              <span className="barcode-bar"></span>
                              <span className="barcode-bar"></span>
                              <span className="barcode-bar"></span>
                              <span className="barcode-bar"></span>
                              <span className="barcode-bar"></span>
                              <span className="barcode-bar"></span>
                              <span className="barcode-bar"></span>
                              <span className="barcode-bar"></span>
                              <span className="barcode-bar"></span>
                              <span className="barcode-bar"></span>
                              <span className="barcode-bar"></span>
                              <span className="barcode-bar"></span>
                              <span className="barcode-bar"></span>
                            </div>
                            <span className="barcode-text">9021083921038</span>
                          </div>
                          <div className="pass-expiry-container" style={{ textAlign: 'right' }}>
                            <span className="pass-label">EXPIRES</span>
                            <span className="pass-value">07/17/2026</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: 'auto', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                    <p>Interact with the holographic keycard to view dynamic lighting.</p>
                  </div>
                </div>

                {/* Right: Subscription Management */}
                <div className="db-card subscription-card" style={{ minHeight: 'auto' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                    <div>
                      <h4>Subscription Management</h4>
                      <p className="card-subtitle" style={{ marginBottom: 0 }}>Configure renewals and select membership levels</p>
                    </div>
                    <span className="status-badge paid" style={{ padding: '0.3rem 0.6rem', fontSize: '0.72rem' }}>Status: Active</span>
                  </div>

                  <div className="sub-settings-list" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', padding: '1rem', borderRadius: '6px' }}>
                      <div>
                        <h5 style={{ color: 'var(--text-white)', fontWeight: 700, margin: 0, fontSize: '0.88rem' }}>Membership Autorenewal</h5>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', margin: 0, marginTop: '0.15rem' }}>Auto-charge billing cards on expiration</p>
                      </div>
                      <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '42px', height: '20px' }}>
                        <input
                          type="checkbox"
                          checked={autoRenew}
                          onChange={(e) => {
                            setAutoRenew(e.target.checked);
                            addActivity(`Member ${currentUser.name} turned ${e.target.checked ? 'ON' : 'OFF'} auto-renew for membership`, e.target.checked ? 'green' : 'orange');
                          }}
                          style={{ opacity: 0, width: 0, height: 0 }}
                        />
                        <span className="slider round" style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: '20px', transition: '.3s', border: '1px solid var(--border-color)' }}></span>
                      </label>
                    </div>
                  </div>

                  <h5 style={{ color: 'var(--text-white)', textTransform: 'uppercase', fontSize: '0.78rem', letterSpacing: '0.05em', marginBottom: '1rem' }}>Available Membership Options</h5>
                  <div className="plan-upgrade-grid" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {[plans['Muscle Core'], plans['Muscle Pro'], plans['Muscle Elite']].map((plan) => {
                      const isCurrent = plan.name === membershipTier || (membershipTier === 'Muscle Pro' && plan.name === 'Muscle Pro');
                      const activePlanObj = plans[membershipTier] || plans['Muscle Pro'];
                      const currentLvl = activePlanObj ? activePlanObj.level : 2;
                      const planLvl = plan.level;
                      const btnText = isCurrent ? 'Active Plan' : planLvl > currentLvl ? `Upgrade Tier` : `Switch Plan`;

                      return (
                        <div
                          key={plan.name}
                          className={`plan-upgrade-card ${isCurrent ? 'active' : ''}`}
                          style={{
                            background: 'rgba(255,255,255,0.01)',
                            border: isCurrent ? '1px solid var(--accent-volt)' : '1px solid var(--border-color)',
                            borderRadius: '8px',
                            padding: '1.2rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            transition: 'all 0.25s ease'
                          }}
                        >
                          <div style={{ flex: 1, paddingRight: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                              <h5 style={{ color: 'var(--text-white)', fontWeight: 800, margin: 0, fontSize: '0.92rem' }}>{plan.name}</h5>
                              {isCurrent && (
                                <span style={{ fontSize: '0.62rem', background: 'rgba(198,255,0,0.1)', color: 'var(--accent-volt)', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 800, textTransform: 'uppercase' }}>
                                  Current
                                </span>
                              )}
                            </div>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.76rem', margin: '0.2rem 0 0 0', lineHeight: 1.3 }}>{plan.desc}</p>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
                            <div style={{ textAlign: 'right' }}>
                              <span style={{ fontSize: '1.15rem', color: 'var(--text-white)', fontWeight: 800 }}>₹{plan.price}</span>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>/{plan.period || 'month'}</span>
                            </div>
                            <button
                              onClick={() => handlePlanChange(plan.name)}
                              disabled={isCurrent}
                              className={isCurrent ? 'outline-btn' : 'glow-btn'}
                              style={{
                                padding: '0.5rem 1rem',
                                fontSize: '0.72rem',
                                cursor: isCurrent ? 'default' : 'pointer',
                                opacity: isCurrent ? 0.5 : 1,
                                minWidth: '110px',
                                height: '35px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                textTransform: 'uppercase'
                              }}
                            >
                              {btnText}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* BILLING & INVOICES HISTORY TABLE */}
              <div className="db-card" style={{ marginTop: '1.8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                  <div>
                    <h4 style={{ margin: 0, color: 'var(--text-white)' }}>Billing & Payment Receipts History</h4>
                    <p className="card-subtitle" style={{ margin: '0.2rem 0 0 0' }}>Transaction statements for pass renewals and supplement purchases</p>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{billingInvoices.length} Total Receipts</span>
                </div>

                <div className="table-wrapper">
                  <table className="db-table">
                    <thead>
                      <tr>
                        <th>Receipt ID</th>
                        <th>Description</th>
                        <th>Amount Paid</th>
                        <th>Payment Date</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {billingInvoices.length === 0 ? (
                        <tr>
                          <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '1.5rem', fontSize: '0.82rem' }}>
                            No billing history recorded.
                          </td>
                        </tr>
                      ) : (
                        billingInvoices
                          .slice((membershipInvoicePage - 1) * ITEMS_PER_PAGE, membershipInvoicePage * ITEMS_PER_PAGE)
                          .map((inv, idx) => (
                            <tr key={idx}>
                              <td style={{ fontFamily: 'monospace', color: 'var(--accent-cyan)', fontWeight: 700 }}>{inv.txId}</td>
                              <td><strong>{inv.plan}</strong></td>
                              <td style={{ color: 'var(--text-white)', fontWeight: 800 }}>${Number(inv.amount).toFixed(2)}</td>
                              <td>{inv.date || 'Today'}</td>
                              <td>
                                <span className="status-badge paid" style={{ fontSize: '0.68rem', padding: '0.2rem 0.5rem' }}>
                                  {inv.status ? inv.status.toUpperCase() : 'PAID'} ✓
                                </span>
                              </td>
                              <td>
                                <button
                                  type="button"
                                  onClick={() => alert(`Downloading Official PDF Receipt for Invoice ${inv.txId}...`)}
                                  className="outline-btn"
                                  style={{ padding: '0.3rem 0.7rem', fontSize: '0.7rem' }}
                                >
                                  Receipt PDF 📄
                                </button>
                              </td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>

                {renderPaginationBar(
                  membershipInvoicePage,
                  Math.ceil(billingInvoices.length / ITEMS_PER_PAGE) || 1,
                  billingInvoices.length,
                  setMembershipInvoicePage,
                  ITEMS_PER_PAGE
                )}
              </div>
            </>
          )}

        </div>
      )}

      {/* 5. MEMBER GYM EQUIPMENT VIEW */}
      {activeView === 'equipment' && (
        <div className="member-sub-view" id="member-subview-equipment" style={{ display: 'block' }}>
          <div className="db-card" style={{ marginBottom: '1.8rem' }}>
            <h4>Gym Floor Equipment Status</h4>
            <p className="card-subtitle">Real-time usage and servicing updates for MuScLe HuB floor machines</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginTop: '1.5rem' }}>
              {[
                {
                  id: 'chest',
                  name: 'Chest Station',
                  desc: 'Chest press machines & bench presses',
                  image: 'assets/images/chest_workout.png',
                  status: 'Active',
                  specs: [
                    'Equipped with: 3 Incline Bench Presses, 2 Flat Bench Presses, 2 Pec Dec Fly machines',
                    'Features: Adjustable seat alignments, commercial-grade weight stacks',
                    'Rules: Wipe down pads after use. Use safety catches on barbell benches',
                    'Peak Hours: 5:00 PM - 8:00 PM',
                    'Target Muscles: Pectoralis Major, Anterior Deltoids, Triceps'
                  ]
                },
                {
                  id: 'back',
                  name: 'Back Station',
                  desc: 'Lat pulldown machines & rowing stations',
                  image: 'assets/images/back_workout.png',
                  status: 'Active',
                  specs: [
                    'Equipped with: 4 Lat Pulldown towers, 3 Seated Cable Row machines, 2 T-Bar Row platforms',
                    'Features: Ergonomic multi-grip pulldown attachments, steel cables',
                    'Rules: Control the eccentric phase of lifting (do not slam weights)',
                    'Peak Hours: 6:00 PM - 8:00 PM',
                    'Target Muscles: Latissimus Dorsi, Rhomboids, Trapezius'
                  ]
                },
                {
                  id: 'biceps',
                  name: 'Biceps Station',
                  desc: 'Dumbbells curls & preacher curl benches',
                  image: 'assets/images/biceps_workout.png',
                  status: 'Active',
                  specs: [
                    'Equipped with: 2 Preacher Curl Benches, 3 EZ-Bar racks, Dumbbells from 5 to 100 lbs',
                    'Features: Padded arm support setups, heavy-duty frames',
                    'Rules: Re-rack dumbbells in correct weight sequence after curls',
                    'Peak Hours: 5:00 PM - 7:00 PM',
                    'Target Muscles: Biceps Brachii, Brachialis, Brachioradialis'
                  ]
                },
                {
                  id: 'triceps',
                  name: 'Triceps Station',
                  desc: 'Cable rope pushdowns & overhead extensions',
                  image: 'assets/images/triceps_workout.png',
                  status: 'Active',
                  specs: [
                    'Equipped with: 3 Cable crossover towers, overhead triceps machines, dip handles',
                    'Features: Dual pulley pulleys, adjustable heights, attachment storage rack',
                    'Rules: Return attachments (ropes, V-bars, straight bars) to storage rack',
                    'Peak Hours: 4:30 PM - 7:30 PM',
                    'Target Muscles: Triceps Brachii (Lateral, Long, and Medial Heads)'
                  ]
                },
                {
                  id: 'shoulder',
                  name: 'Shoulder Station',
                  desc: 'Dumbbell overhead presses & lateral raises',
                  image: 'assets/images/shoulder_workout.png',
                  status: 'Active',
                  specs: [
                    'Equipped with: 2 Seated Shoulder Press racks, 2 lateral raise stations, overhead press cage',
                    'Features: Counterbalanced press arms, adjustable seat safety configurations',
                    'Rules: Use a spotter when lifting heavy dumbbells overhead on incline benches',
                    'Peak Hours: 5:00 PM - 8:00 PM',
                    'Target Muscles: Anterior Deltoids, Lateral Deltoids, Posterior Deltoids, Trapezius'
                  ]
                },
                {
                  id: 'legs',
                  name: 'Legs Station',
                  desc: 'Barbell squats & leg press machines',
                  image: 'assets/images/legs_workout.png',
                  status: 'Active',
                  specs: [
                    'Equipped with: 3 Squat Racks, 2 Leg Press machines, 2 Leg Extension/Curl benches',
                    'Features: Angled linear sleds, heavy-duty footplates, safety locking pegs',
                    'Rules: Lock squat bar hooks after loading. Remove plates after completing reps',
                    'Peak Hours: 6:00 PM - 8:30 PM',
                    'Target Muscles: Quadriceps, Gluteus Maximus, Hamstrings, Gastrocnemius (Calves)'
                  ]
                }
              ]
                .slice((equipmentPage - 1) * 3, equipmentPage * 3)
                .map((eq) => (
                  <div key={eq.id} className="equipment-card" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s' }}>
                    <div style={{ height: '140px', background: '#0a0a0f', borderBottom: '1px solid var(--border-color)', overflow: 'hidden' }}>
                      <img src={eq.image} alt={eq.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.8rem', flexGrow: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h5 style={{ color: 'var(--text-white)', fontWeight: 700, margin: 0 }}>{eq.name}</h5>
                        <span style={{ fontSize: '0.72rem', color: 'var(--accent-volt)', fontWeight: 800, background: 'rgba(198,255,0,0.08)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>{eq.status}</span>
                      </div>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', margin: 0 }}>{eq.desc}</p>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'auto' }}>
                        <button className="outline-btn" style={{ padding: '0.3rem 0.6rem', fontSize: '0.7rem' }} onClick={() => {
                          setSelectedEquipment({
                            name: eq.name + ' Workout Station',
                            status: 'Active & Available',
                            image: eq.image,
                            specs: eq.specs
                          });
                          setModalViewMode('photo');
                          if (eq.id === 'chest') setChestPhotoIndex(0);
                        }}>Details</button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            {renderPaginationBar(
              equipmentPage,
              Math.ceil(6 / 3) || 1,
              6,
              setEquipmentPage,
              3
            )}
          </div>
        </div>
      )}

      {/* EQUIPMENT DETAIL MODAL */}
      {selectedEquipment && (
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
            boxShadow: '0 0 35px rgba(0, 240, 255, 0.18)',
            borderRadius: '12px',
            width: '90%',
            maxWidth: '680px',
            padding: '2rem',
            position: 'relative'
          }}>
            <button
              onClick={() => setSelectedEquipment(null)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '1.8rem',
                cursor: 'pointer',
                transition: 'color 0.2s',
                padding: '0.2rem',
                lineHeight: 1
              }}
              onMouseEnter={(e) => e.target.style.color = '#ff3e6c'}
              onMouseLeave={(e) => e.target.style.color = 'var(--text-muted)'}
            >
              &times;
            </button>

            <h3 style={{ textTransform: 'uppercase', fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--text-white)', margin: '0 0 0.5rem 0', fontSize: '1.4rem' }}>
              {selectedEquipment.name}
            </h3>
            <p style={{ color: 'var(--text-muted)', margin: '0 0 1.5rem 0', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Status: <span style={{ color: 'var(--accent-volt)', fontWeight: 'bold' }}>{selectedEquipment.status}</span>
            </p>

            {/* TAB BUTTONS (2 Buttons: Photo, Specs) */}
            <div style={{ display: 'flex', gap: '0.6rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              <button
                className={`glow-btn`}
                style={{
                  padding: '0.5rem 1rem',
                  fontSize: '0.78rem',
                  textTransform: 'uppercase',
                  background: modalViewMode === 'photo' ? 'var(--accent-volt)' : 'rgba(255, 255, 255, 0.02)',
                  color: modalViewMode === 'photo' ? 'var(--bg-black)' : 'var(--text-white)',
                  border: '1px solid',
                  borderColor: modalViewMode === 'photo' ? 'var(--accent-volt)' : 'var(--border-color)',
                  boxShadow: modalViewMode === 'photo' ? 'var(--glow-volt)' : 'none',
                  cursor: 'pointer',
                  fontWeight: 700,
                  borderRadius: '4px',
                  transition: 'all 0.2s'
                }}
                onClick={() => setModalViewMode('photo')}
              >
                Photo
              </button>
              <button
                className={`outline-btn`}
                style={{
                  padding: '0.5rem 1rem',
                  fontSize: '0.78rem',
                  textTransform: 'uppercase',
                  background: modalViewMode === 'specs' ? 'var(--accent-cyan)' : 'rgba(255, 255, 255, 0.02)',
                  color: modalViewMode === 'specs' ? 'var(--bg-black)' : 'var(--text-white)',
                  border: '1px solid',
                  borderColor: modalViewMode === 'specs' ? 'var(--accent-cyan)' : 'var(--border-color)',
                  boxShadow: modalViewMode === 'specs' ? 'var(--glow-cyan)' : 'none',
                  cursor: 'pointer',
                  fontWeight: 700,
                  borderRadius: '4px',
                  transition: 'all 0.2s'
                }}
                onClick={() => setModalViewMode('specs')}
              >
                Specs & Info
              </button>
            </div>

            {/* CONTENT AREA */}
            <div style={{ minHeight: '220px' }}>
              {modalViewMode === 'photo' ? (
                selectedEquipment.name.toLowerCase().includes('chest') ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', width: '100%' }}>
                    <div
                      onClick={() => setIsChestFullScreen(true)}
                      title="Click to view full screen"
                      style={{
                        width: '100%',
                        height: '240px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        background: '#07070a',
                        border: '1px solid var(--border-color)',
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{
                        position: 'absolute',
                        top: '10px',
                        left: '10px',
                        background: 'rgba(0,0,0,0.7)',
                        padding: '0.4rem 0.6rem',
                        borderRadius: '4px',
                        color: 'var(--text-white)',
                        fontSize: '0.72rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        border: '1px solid rgba(255,255,255,0.1)',
                        zIndex: 5
                      }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                        </svg>
                        <span>Click Full Screen</span>
                      </div>
                      <img
                        src={[
                          'assets/images/bench_press.png',
                          'assets/images/incline_press.png',
                          'assets/images/decline_press.png',
                          'assets/images/cable_crossover.png',
                          'assets/images/dumbbell_press.png',
                          'assets/images/pec_dec_fly.png',
                          'assets/images/chest_dips.png',
                          'assets/images/dumbbell_fly.png',
                          'assets/images/hammer_strength.png',
                          'assets/images/pushups.png'
                        ][chestPhotoIndex]}
                        alt="Chest Workout"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />

                      <button
                        onClick={(e) => { e.stopPropagation(); setChestPhotoIndex((prev) => (prev - 1 + 10) % 10); }}
                        style={{
                          position: 'absolute',
                          left: '10px',
                          background: 'rgba(0,0,0,0.6)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          color: 'var(--text-white)',
                          borderRadius: '50%',
                          width: '32px',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          fontSize: '1rem',
                          transition: 'background 0.2s',
                          lineHeight: 1,
                          zIndex: 6
                        }}
                      >
                        &lsaquo;
                      </button>

                      <button
                        onClick={(e) => { e.stopPropagation(); setChestPhotoIndex((prev) => (prev + 1) % 10); }}
                        style={{
                          position: 'absolute',
                          right: '10px',
                          background: 'rgba(0,0,0,0.6)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          color: 'var(--text-white)',
                          borderRadius: '50%',
                          width: '32px',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          fontSize: '1rem',
                          transition: 'background 0.2s',
                          lineHeight: 1,
                          zIndex: 6
                        }}
                      >
                        &rsaquo;
                      </button>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-white)', fontWeight: 700 }}>
                        {[
                          '1. Flat Barbell Bench Press',
                          '2. Incline Barbell Bench Press',
                          '3. Decline Barbell Bench Press',
                          '4. Cable Chest Crossovers (Extension)',
                          '5. Flat Dumbbell Chest Press',
                          '6. Pec Dec Machine Flyes',
                          '7. Parallel Bar Chest Dips',
                          '8. Flat Dumbbell Chest Flyes',
                          '9. Hammer Strength Plate-Loaded Press',
                          '10. Classic Chest Pushups'
                        ][chestPhotoIndex]}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {chestPhotoIndex + 1} / 10
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.3rem' }}>
                      {[
                        'assets/images/bench_press.png',
                        'assets/images/incline_press.png',
                        'assets/images/decline_press.png',
                        'assets/images/cable_crossover.png',
                        'assets/images/dumbbell_press.png',
                        'assets/images/pec_dec_fly.png',
                        'assets/images/chest_dips.png',
                        'assets/images/dumbbell_fly.png',
                        'assets/images/hammer_strength.png',
                        'assets/images/pushups.png'
                      ].map((src, idx) => (
                        <button
                          key={idx}
                          onClick={() => setChestPhotoIndex(idx)}
                          style={{
                            width: '45px',
                            height: '35px',
                            borderRadius: '4px',
                            overflow: 'hidden',
                            border: chestPhotoIndex === idx ? '2px solid var(--accent-volt)' : '1px solid var(--border-color)',
                            padding: 0,
                            flexShrink: 0,
                            cursor: 'pointer',
                            background: 'none'
                          }}
                        >
                          <img src={src} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </button>
                      ))}
                    </div>
                  </div>
                ) : selectedEquipment.name.toLowerCase().includes('back') ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', width: '100%' }}>
                    <div
                      onClick={() => setIsBackFullScreen(true)}
                      title="Click to view full screen"
                      style={{
                        width: '100%',
                        height: '240px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        background: '#07070a',
                        border: '1px solid var(--border-color)',
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{
                        position: 'absolute',
                        top: '10px',
                        left: '10px',
                        background: 'rgba(0,0,0,0.7)',
                        padding: '0.4rem 0.6rem',
                        borderRadius: '4px',
                        color: 'var(--text-white)',
                        fontSize: '0.72rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        border: '1px solid rgba(255,255,255,0.1)',
                        zIndex: 5
                      }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                        </svg>
                        <span>Click Full Screen</span>
                      </div>
                      <img
                        src={[
                          'assets/images/deadlift.png',
                          'assets/images/pull_up.png',
                          'assets/images/lat_pulldown.png',
                          'assets/images/barbell_row.png',
                          'assets/images/tbar_row.png',
                          'assets/images/seated_cable_row.png',
                          'assets/images/single_arm_dumbbell_row.png',
                          'assets/images/chest_supported_row.png',
                          'assets/images/straight_arm_pulldown.png',
                          'assets/images/face_pull.png'
                        ][backPhotoIndex]}
                        alt="Back Workout"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />

                      <button
                        onClick={(e) => { e.stopPropagation(); setBackPhotoIndex((prev) => (prev - 1 + 10) % 10); }}
                        style={{
                          position: 'absolute',
                          left: '10px',
                          background: 'rgba(0,0,0,0.6)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          color: 'var(--text-white)',
                          borderRadius: '50%',
                          width: '32px',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          fontSize: '1rem',
                          transition: 'background 0.2s',
                          lineHeight: 1,
                          zIndex: 6
                        }}
                      >
                        &lsaquo;
                      </button>

                      <button
                        onClick={(e) => { e.stopPropagation(); setBackPhotoIndex((prev) => (prev + 1) % 10); }}
                        style={{
                          position: 'absolute',
                          right: '10px',
                          background: 'rgba(0,0,0,0.6)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          color: 'var(--text-white)',
                          borderRadius: '50%',
                          width: '32px',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          fontSize: '1rem',
                          transition: 'background 0.2s',
                          lineHeight: 1,
                          zIndex: 6
                        }}
                      >
                        &rsaquo;
                      </button>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-white)', fontWeight: 700 }}>
                        {[
                          '1. Conventional Barbell Deadlift',
                          '2. Wide-Grip Bodyweight Pull-Up',
                          '3. Wide-Grip Lat Pulldown',
                          '4. Bent-Over Barbell Row',
                          '5. Landmine T-Bar Row',
                          '6. Seated Cable Row (V-Bar Grip)',
                          '7. Single-Arm Dumbbell Row',
                          '8. Incline Chest-Supported Dumbbell Row',
                          '9. Standing Straight-Arm Cable Pulldown',
                          '10. High Cable Face Pull (Rope Attachment)'
                        ][backPhotoIndex]}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {backPhotoIndex + 1} / 10
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.3rem' }}>
                      {[
                        'assets/images/deadlift.png',
                        'assets/images/pull_up.png',
                        'assets/images/lat_pulldown.png',
                        'assets/images/barbell_row.png',
                        'assets/images/tbar_row.png',
                        'assets/images/seated_cable_row.png',
                        'assets/images/single_arm_dumbbell_row.png',
                        'assets/images/chest_supported_row.png',
                        'assets/images/straight_arm_pulldown.png',
                        'assets/images/face_pull.png'
                      ].map((src, idx) => (
                        <button
                          key={idx}
                          onClick={() => setBackPhotoIndex(idx)}
                          style={{
                            width: '45px',
                            height: '35px',
                            borderRadius: '4px',
                            overflow: 'hidden',
                            border: backPhotoIndex === idx ? '2px solid var(--accent-volt)' : '1px solid var(--border-color)',
                            padding: 0,
                            flexShrink: 0,
                            cursor: 'pointer',
                            background: 'none'
                          }}
                        >
                          <img src={src} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </button>
                      ))}
                    </div>
                  </div>
                ) : selectedEquipment.name.toLowerCase().includes('bicep') ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', width: '100%' }}>
                    <div
                      onClick={() => setIsBicepsFullScreen(true)}
                      title="Click to view full screen"
                      style={{
                        width: '100%',
                        height: '240px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        background: '#07070a',
                        border: '1px solid var(--border-color)',
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{
                        position: 'absolute',
                        top: '10px',
                        left: '10px',
                        background: 'rgba(0,0,0,0.7)',
                        padding: '0.4rem 0.6rem',
                        borderRadius: '4px',
                        color: 'var(--text-white)',
                        fontSize: '0.72rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        border: '1px solid rgba(255,255,255,0.1)',
                        zIndex: 5
                      }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                        </svg>
                        <span>Click Full Screen</span>
                      </div>
                      <img
                        src={[
                          'assets/images/barbell_curl.png',
                          'assets/images/dumbbell_curl.png',
                          'assets/images/hammer_curl.png',
                          'assets/images/concentration_curl.png',
                          'assets/images/preacher_curl.png',
                          'assets/images/incline_dumbbell_curl.png',
                          'assets/images/cable_curl.png',
                          'assets/images/ez_bar_curl.png',
                          'assets/images/spider_curl.png',
                          'assets/images/chin_up_curl.png'
                        ][bicepsPhotoIndex]}
                        alt="Biceps Workout"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />

                      <button
                        onClick={(e) => { e.stopPropagation(); setBicepsPhotoIndex((prev) => (prev - 1 + 10) % 10); }}
                        style={{
                          position: 'absolute',
                          left: '10px',
                          background: 'rgba(0,0,0,0.6)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          color: 'var(--text-white)',
                          borderRadius: '50%',
                          width: '32px',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          fontSize: '1rem',
                          transition: 'background 0.2s',
                          lineHeight: 1,
                          zIndex: 6
                        }}
                      >
                        &lsaquo;
                      </button>

                      <button
                        onClick={(e) => { e.stopPropagation(); setBicepsPhotoIndex((prev) => (prev + 1) % 10); }}
                        style={{
                          position: 'absolute',
                          right: '10px',
                          background: 'rgba(0,0,0,0.6)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          color: 'var(--text-white)',
                          borderRadius: '50%',
                          width: '32px',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          fontSize: '1rem',
                          transition: 'background 0.2s',
                          lineHeight: 1,
                          zIndex: 6
                        }}
                      >
                        &rsaquo;
                      </button>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-white)', fontWeight: 700 }}>
                        {[
                          '1. Barbell Curl',
                          '2. Dumbbell Bicep Curl',
                          '3. Hammer Curl',
                          '4. Concentration Curl',
                          '5. Preacher Curl',
                          '6. Incline Dumbbell Curl',
                          '7. Cable Bicep Curl',
                          '8. EZ-Bar Curl',
                          '9. Spider Curl',
                          '10. Chin-Up (underhand grip)'
                        ][bicepsPhotoIndex]}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {bicepsPhotoIndex + 1} / 10
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.3rem' }}>
                      {[
                        'assets/images/barbell_curl.png',
                        'assets/images/dumbbell_curl.png',
                        'assets/images/hammer_curl.png',
                        'assets/images/concentration_curl.png',
                        'assets/images/preacher_curl.png',
                        'assets/images/incline_dumbbell_curl.png',
                        'assets/images/cable_curl.png',
                        'assets/images/ez_bar_curl.png',
                        'assets/images/spider_curl.png',
                        'assets/images/chin_up_curl.png'
                      ].map((src, idx) => (
                        <button
                          key={idx}
                          onClick={() => setBicepsPhotoIndex(idx)}
                          style={{
                            width: '45px',
                            height: '35px',
                            borderRadius: '4px',
                            overflow: 'hidden',
                            border: bicepsPhotoIndex === idx ? '2px solid var(--accent-volt)' : '1px solid var(--border-color)',
                            padding: 0,
                            flexShrink: 0,
                            cursor: 'pointer',
                            background: 'none'
                          }}
                        >
                          <img src={src} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </button>
                      ))}
                    </div>
                  </div>
                ) : selectedEquipment.name.toLowerCase().includes('tricep') ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', width: '100%' }}>
                    <div
                      onClick={() => setIsTricepsFullScreen(true)}
                      title="Click to view full screen"
                      style={{
                        width: '100%',
                        height: '240px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        background: '#07070a',
                        border: '1px solid var(--border-color)',
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{
                        position: 'absolute',
                        top: '10px',
                        left: '10px',
                        background: 'rgba(0,0,0,0.7)',
                        padding: '0.4rem 0.6rem',
                        borderRadius: '4px',
                        color: 'var(--text-white)',
                        fontSize: '0.72rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        border: '1px solid rgba(255,255,255,0.1)',
                        zIndex: 5
                      }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                        </svg>
                        <span>Click Full Screen</span>
                      </div>
                      <img
                        src={[
                          'assets/images/close_grip_bench_press.png',
                          'assets/images/triceps_pushdown.png',
                          'assets/images/overhead_triceps_extension.png',
                          'assets/images/skull_crusher.png',
                          'assets/images/triceps_dips.png',
                          'assets/images/rope_pushdown.png',
                          'assets/images/single_arm_cable_pushdown.png',
                          'assets/images/dumbbell_kickback.png',
                          'assets/images/bench_dips.png',
                          'assets/images/jm_press.png'
                        ][tricepsPhotoIndex]}
                        alt="Triceps Workout"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />

                      <button
                        onClick={(e) => { e.stopPropagation(); setTricepsPhotoIndex((prev) => (prev - 1 + 10) % 10); }}
                        style={{
                          position: 'absolute',
                          left: '10px',
                          background: 'rgba(0,0,0,0.6)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          color: 'var(--text-white)',
                          borderRadius: '50%',
                          width: '32px',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          fontSize: '1rem',
                          transition: 'background 0.2s',
                          lineHeight: 1,
                          zIndex: 6
                        }}
                      >
                        &lsaquo;
                      </button>

                      <button
                        onClick={(e) => { e.stopPropagation(); setTricepsPhotoIndex((prev) => (prev + 1) % 10); }}
                        style={{
                          position: 'absolute',
                          right: '10px',
                          background: 'rgba(0,0,0,0.6)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          color: 'var(--text-white)',
                          borderRadius: '50%',
                          width: '32px',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          fontSize: '1rem',
                          transition: 'background 0.2s',
                          lineHeight: 1,
                          zIndex: 6
                        }}
                      >
                        &rsaquo;
                      </button>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-white)', fontWeight: 700 }}>
                        {[
                          '1. Close-Grip Barbell Bench Press',
                          '2. Straight-Bar Triceps Pushdown',
                          '3. Overhead Cable Triceps Extension',
                          '4. Lying L-Bar Skull Crusher',
                          '5. Parallel Bar Triceps Dips',
                          '6. High Pulley Rope Triceps Pushdown',
                          '7. Single-Arm Cable Triceps Pushdown',
                          '8. Bent-Over Dumbbell Triceps Kickback',
                          '9. Seated Bench Dips',
                          '10. Hybrid JM Barbell Press'
                        ][tricepsPhotoIndex]}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {tricepsPhotoIndex + 1} / 10
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.3rem' }}>
                      {[
                        'assets/images/close_grip_bench_press.png',
                        'assets/images/triceps_pushdown.png',
                        'assets/images/overhead_triceps_extension.png',
                        'assets/images/skull_crusher.png',
                        'assets/images/triceps_dips.png',
                        'assets/images/rope_pushdown.png',
                        'assets/images/single_arm_cable_pushdown.png',
                        'assets/images/dumbbell_kickback.png',
                        'assets/images/bench_dips.png',
                        'assets/images/jm_press.png'
                      ].map((src, idx) => (
                        <button
                          key={idx}
                          onClick={() => setTricepsPhotoIndex(idx)}
                          style={{
                            width: '45px',
                            height: '35px',
                            borderRadius: '4px',
                            overflow: 'hidden',
                            border: tricepsPhotoIndex === idx ? '2px solid var(--accent-volt)' : '1px solid var(--border-color)',
                            padding: 0,
                            flexShrink: 0,
                            cursor: 'pointer',
                            background: 'none'
                          }}
                        >
                          <img src={src} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </button>
                      ))}
                    </div>
                  </div>
                ) : selectedEquipment.name.toLowerCase().includes('shoulder') ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', width: '100%' }}>
                    <div
                      onClick={() => setIsShoulderFullScreen(true)}
                      title="Click to view full screen"
                      style={{
                        width: '100%',
                        height: '240px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        background: '#07070a',
                        border: '1px solid var(--border-color)',
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{
                        position: 'absolute',
                        top: '10px',
                        left: '10px',
                        background: 'rgba(0,0,0,0.7)',
                        padding: '0.4rem 0.6rem',
                        borderRadius: '4px',
                        color: 'var(--text-white)',
                        fontSize: '0.72rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        border: '1px solid rgba(255,255,255,0.1)',
                        zIndex: 5
                      }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                        </svg>
                        <span>Click Full Screen</span>
                      </div>
                      <img
                        src={[
                          'assets/images/overhead_press.png',
                          'assets/images/arnold_press.png',
                          'assets/images/dumbbell_shoulder_press.png',
                          'assets/images/lateral_raise.png',
                          'assets/images/cable_lateral_raise.png',
                          'assets/images/front_raise.png',
                          'assets/images/rear_delt_fly.png',
                          'assets/images/shoulder_face_pull.png',
                          'assets/images/upright_row.png',
                          'assets/images/shrugs.png'
                        ][shoulderPhotoIndex]}
                        alt="Shoulder Workout"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />

                      <button
                        onClick={(e) => { e.stopPropagation(); setShoulderPhotoIndex((prev) => (prev - 1 + 10) % 10); }}
                        style={{
                          position: 'absolute',
                          left: '10px',
                          background: 'rgba(0,0,0,0.6)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          color: 'var(--text-white)',
                          borderRadius: '50%',
                          width: '32px',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          fontSize: '1rem',
                          transition: 'background 0.2s',
                          lineHeight: 1,
                          zIndex: 6
                        }}
                      >
                        &lsaquo;
                      </button>

                      <button
                        onClick={(e) => { e.stopPropagation(); setShoulderPhotoIndex((prev) => (prev + 1) % 10); }}
                        style={{
                          position: 'absolute',
                          right: '10px',
                          background: 'rgba(0,0,0,0.6)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          color: 'var(--text-white)',
                          borderRadius: '50%',
                          width: '32px',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          fontSize: '1rem',
                          transition: 'background 0.2s',
                          lineHeight: 1,
                          zIndex: 6
                        }}
                      >
                        &rsaquo;
                      </button>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-white)', fontWeight: 700 }}>
                        {[
                          '1. Standing Barbell Overhead Press (OHP)',
                          '2. Seated Arnold Dumbbell Press',
                          '3. Seated Dumbbell Shoulder Press',
                          '4. Standing Dumbbell Lateral Raise',
                          '5. Low Cable Side Lateral Raise',
                          '6. Standing Dumbbell Front Raise',
                          '7. Rear Delt Reverse Flyes',
                          '8. High Pulley Rope Face Pull',
                          '9. Barbell Upright Row',
                          '10. Heavy Dumbbell Trap Shrugs'
                        ][shoulderPhotoIndex]}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {shoulderPhotoIndex + 1} / 10
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.3rem' }}>
                      {[
                        'assets/images/overhead_press.png',
                        'assets/images/arnold_press.png',
                        'assets/images/dumbbell_shoulder_press.png',
                        'assets/images/lateral_raise.png',
                        'assets/images/cable_lateral_raise.png',
                        'assets/images/front_raise.png',
                        'assets/images/rear_delt_fly.png',
                        'assets/images/shoulder_face_pull.png',
                        'assets/images/upright_row.png',
                        'assets/images/shrugs.png'
                      ].map((src, idx) => (
                        <button
                          key={idx}
                          onClick={() => setShoulderPhotoIndex(idx)}
                          style={{
                            width: '45px',
                            height: '35px',
                            borderRadius: '4px',
                            overflow: 'hidden',
                            border: shoulderPhotoIndex === idx ? '2px solid var(--accent-volt)' : '1px solid var(--border-color)',
                            padding: 0,
                            flexShrink: 0,
                            cursor: 'pointer',
                            background: 'none'
                          }}
                        >
                          <img src={src} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </button>
                      ))}
                    </div>
                  </div>
                ) : selectedEquipment.name.toLowerCase().includes('leg') ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', width: '100%' }}>
                    <div
                      onClick={() => setIsLegsFullScreen(true)}
                      title="Click to view full screen"
                      style={{
                        width: '100%',
                        height: '240px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        background: '#07070a',
                        border: '1px solid var(--border-color)',
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{
                        position: 'absolute',
                        top: '10px',
                        left: '10px',
                        background: 'rgba(0,0,0,0.7)',
                        padding: '0.4rem 0.6rem',
                        borderRadius: '4px',
                        color: 'var(--text-white)',
                        fontSize: '0.72rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        border: '1px solid rgba(255,255,255,0.1)',
                        zIndex: 5
                      }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                        </svg>
                        <span>Click Full Screen</span>
                      </div>
                      <img
                        src={[
                          'assets/images/back_squat.png',
                          'assets/images/front_squat.png',
                          'assets/images/romanian_deadlift.png',
                          'assets/images/leg_press.png',
                          'assets/images/walking_lunges.png',
                          'assets/images/bulgarian_split_squat.png',
                          'assets/images/leg_extension.png',
                          'assets/images/leg_curl.png',
                          'assets/images/standing_calf_raise.png',
                          'assets/images/seated_calf_raise.png'
                        ][legsPhotoIndex]}
                        alt="Leg Workout"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />

                      <button
                        onClick={(e) => { e.stopPropagation(); setLegsPhotoIndex((prev) => (prev - 1 + 10) % 10); }}
                        style={{
                          position: 'absolute',
                          left: '10px',
                          background: 'rgba(0,0,0,0.6)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          color: 'var(--text-white)',
                          borderRadius: '50%',
                          width: '32px',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          fontSize: '1rem',
                          transition: 'background 0.2s',
                          lineHeight: 1,
                          zIndex: 6
                        }}
                      >
                        &lsaquo;
                      </button>

                      <button
                        onClick={(e) => { e.stopPropagation(); setLegsPhotoIndex((prev) => (prev + 1) % 10); }}
                        style={{
                          position: 'absolute',
                          right: '10px',
                          background: 'rgba(0,0,0,0.6)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          color: 'var(--text-white)',
                          borderRadius: '50%',
                          width: '32px',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          fontSize: '1rem',
                          transition: 'background 0.2s',
                          lineHeight: 1,
                          zIndex: 6
                        }}
                      >
                        &rsaquo;
                      </button>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-white)', fontWeight: 700 }}>
                        {[
                          '1. Heavy Barbell Back Squat',
                          '2. Clean Grip Barbell Front Squat',
                          '3. Romanian Barbell Deadlift (RDL)',
                          '4. 45-Degree Incline Leg Press Machine',
                          '5. Dumbbell Walking Lunges',
                          '6. Bench-Elevated Bulgarian Split Squat',
                          '7. Seated Quad Leg Extension Machine',
                          '8. Lying Hamstring Leg Curl Machine',
                          '9. Standing Machine Calf Raise',
                          '10. Seated Soleus Calf Raise Machine'
                        ][legsPhotoIndex]}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {legsPhotoIndex + 1} / 10
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.3rem' }}>
                      {[
                        'assets/images/back_squat.png',
                        'assets/images/front_squat.png',
                        'assets/images/romanian_deadlift.png',
                        'assets/images/leg_press.png',
                        'assets/images/walking_lunges.png',
                        'assets/images/bulgarian_split_squat.png',
                        'assets/images/leg_extension.png',
                        'assets/images/leg_curl.png',
                        'assets/images/standing_calf_raise.png',
                        'assets/images/seated_calf_raise.png'
                      ].map((src, idx) => (
                        <button
                          key={idx}
                          onClick={() => setLegsPhotoIndex(idx)}
                          style={{
                            width: '45px',
                            height: '35px',
                            borderRadius: '4px',
                            overflow: 'hidden',
                            border: legsPhotoIndex === idx ? '2px solid var(--accent-volt)' : '1px solid var(--border-color)',
                            padding: 0,
                            flexShrink: 0,
                            cursor: 'pointer',
                            background: 'none'
                          }}
                        >
                          <img src={src} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{
                    width: '100%',
                    height: '220px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    background: '#07070a',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <img
                      src={selectedEquipment.image}
                      alt={selectedEquipment.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => { e.target.src = 'assets/images/gallery_weights.png'; }}
                    />
                  </div>
                )
              ) : (
                <div style={{
                  background: 'rgba(255,255,255,0.01)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '1.2rem',
                  maxHeight: '260px',
                  overflowY: 'auto'
                }}>
                  <h4 style={{ color: 'var(--text-white)', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '0.8rem', letterSpacing: '0.05em' }}>
                    Zone Specifications & Guidelines
                  </h4>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {selectedEquipment.specs.map((spec, idx) => (
                      <li key={idx} style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                        <span style={{ color: 'var(--accent-volt)', marginTop: '0.1rem' }}>▶</span>
                        <span>{spec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                className="outline-btn"
                onClick={() => setSelectedEquipment(null)}
                style={{ padding: '0.6rem 1.5rem', fontSize: '0.8rem' }}
              >
                Close details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHEST FULL SCREEN LIGHTBOX */}
      {isChestFullScreen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(5, 5, 8, 0.98)',
          zIndex: 999999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem'
        }}>
          {/* Close button */}
          <button
            onClick={() => setIsChestFullScreen(false)}
            style={{
              position: 'absolute',
              top: '2rem',
              right: '2rem',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-white)',
              borderRadius: '50%',
              width: '50px',
              height: '50px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '2rem',
              zIndex: 10,
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.background = 'rgba(255,62,108,0.2)'}
            onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.03)'}
          >&times;</button>

          {/* Main Image */}
          <div style={{ position: 'relative', width: '90%', height: '80%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img
              src={[
                'assets/images/bench_press.png',
                'assets/images/incline_press.png',
                'assets/images/decline_press.png',
                'assets/images/cable_crossover.png',
                'assets/images/dumbbell_press.png',
                'assets/images/pec_dec_fly.png',
                'assets/images/chest_dips.png',
                'assets/images/dumbbell_fly.png',
                'assets/images/hammer_strength.png',
                'assets/images/pushups.png'
              ][chestPhotoIndex]}
              alt="Chest Workout Full Screen"
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '8px', border: '1px solid var(--border-color)', boxShadow: '0 0 40px rgba(0, 240, 255, 0.2)' }}
            />

            {/* Left Nav Arrow */}
            <button
              onClick={() => setChestPhotoIndex((prev) => (prev - 1 + 10) % 10)}
              style={{
                position: 'absolute',
                left: '20px',
                background: 'rgba(0,0,0,0.7)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'var(--text-white)',
                borderRadius: '50%',
                width: '56px',
                height: '56px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '2rem',
                lineHeight: 1,
                transition: 'background 0.2s',
                zIndex: 11
              }}
              onMouseEnter={(e) => e.target.style.background = 'var(--accent-volt)'}
              onMouseLeave={(e) => e.target.style.background = 'rgba(0,0,0,0.7)'}
            >
              &lsaquo;
            </button>

            {/* Right Nav Arrow */}
            <button
              onClick={() => setChestPhotoIndex((prev) => (prev + 1) % 10)}
              style={{
                position: 'absolute',
                right: '20px',
                background: 'rgba(0,0,0,0.7)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'var(--text-white)',
                borderRadius: '50%',
                width: '56px',
                height: '56px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '2rem',
                lineHeight: 1,
                transition: 'background 0.2s',
                zIndex: 11
              }}
              onMouseEnter={(e) => e.target.style.background = 'var(--accent-volt)'}
              onMouseLeave={(e) => e.target.style.background = 'rgba(0,0,0,0.7)'}
            >
              &rsaquo;
            </button>
          </div>

          {/* Label and Count */}
          <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <h4 style={{ color: 'var(--text-white)', margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800 }}>
              {[
                '1. Flat Barbell Bench Press',
                '2. Incline Barbell Bench Press',
                '3. Decline Barbell Bench Press',
                '4. Cable Chest Crossovers (Extension)',
                '5. Flat Dumbbell Chest Press',
                '6. Pec Dec Machine Flyes',
                '7. Parallel Bar Chest Dips',
                '8. Flat Dumbbell Chest Flyes',
                '9. Hammer Strength Plate-Loaded Press',
                '10. Classic Chest Pushups'
              ][chestPhotoIndex]}
            </h4>
            <span style={{ color: 'var(--accent-volt)', fontWeight: 'bold', fontSize: '1.1rem' }}>
              {chestPhotoIndex + 1} / 10
            </span>
          </div>
        </div>
      )}

      {/* BACK FULL SCREEN LIGHTBOX */}
      {isBackFullScreen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(5, 5, 8, 0.98)',
          zIndex: 999999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem'
        }}>
          {/* Close button */}
          <button
            onClick={() => setIsBackFullScreen(false)}
            style={{
              position: 'absolute',
              top: '2rem',
              right: '2rem',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-white)',
              borderRadius: '50%',
              width: '50px',
              height: '50px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '2rem',
              zIndex: 10,
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.background = 'rgba(255,62,108,0.2)'}
            onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.03)'}
          >&times;</button>

          {/* Main Image */}
          <div style={{ position: 'relative', width: '90%', height: '80%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img
              src={[
                'assets/images/deadlift.png',
                'assets/images/pull_up.png',
                'assets/images/lat_pulldown.png',
                'assets/images/barbell_row.png',
                'assets/images/tbar_row.png',
                'assets/images/seated_cable_row.png',
                'assets/images/single_arm_dumbbell_row.png',
                'assets/images/chest_supported_row.png',
                'assets/images/straight_arm_pulldown.png',
                'assets/images/face_pull.png'
              ][backPhotoIndex]}
              alt="Back Workout Full Screen"
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '8px', border: '1px solid var(--border-color)', boxShadow: '0 0 40px rgba(0, 240, 255, 0.2)' }}
            />

            {/* Left Nav Arrow */}
            <button
              onClick={() => setBackPhotoIndex((prev) => (prev - 1 + 10) % 10)}
              style={{
                position: 'absolute',
                left: '20px',
                background: 'rgba(0,0,0,0.7)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'var(--text-white)',
                borderRadius: '50%',
                width: '56px',
                height: '56px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '2rem',
                lineHeight: 1,
                transition: 'background 0.2s',
                zIndex: 11
              }}
              onMouseEnter={(e) => e.target.style.background = 'var(--accent-volt)'}
              onMouseLeave={(e) => e.target.style.background = 'rgba(0,0,0,0.7)'}
            >
              &lsaquo;
            </button>

            {/* Right Nav Arrow */}
            <button
              onClick={() => setBackPhotoIndex((prev) => (prev + 1) % 10)}
              style={{
                position: 'absolute',
                right: '20px',
                background: 'rgba(0,0,0,0.7)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'var(--text-white)',
                borderRadius: '50%',
                width: '56px',
                height: '56px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '2rem',
                lineHeight: 1,
                transition: 'background 0.2s',
                zIndex: 11
              }}
              onMouseEnter={(e) => e.target.style.background = 'var(--accent-volt)'}
              onMouseLeave={(e) => e.target.style.background = 'rgba(0,0,0,0.7)'}
            >
              &rsaquo;
            </button>
          </div>

          {/* Label and Count */}
          <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <h4 style={{ color: 'var(--text-white)', margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800 }}>
              {[
                '1. Conventional Barbell Deadlift',
                '2. Wide-Grip Bodyweight Pull-Up',
                '3. Wide-Grip Lat Pulldown',
                '4. Bent-Over Barbell Row',
                '5. Landmine T-Bar Row',
                '6. Seated Cable Row (V-Bar Grip)',
                '7. Single-Arm Dumbbell Row',
                '8. Incline Chest-Supported Dumbbell Row',
                '9. Standing Straight-Arm Cable Pulldown',
                '10. High Cable Face Pull (Rope Attachment)'
              ][backPhotoIndex]}
            </h4>
            <span style={{ color: 'var(--accent-volt)', fontWeight: 'bold', fontSize: '1.1rem' }}>
              {backPhotoIndex + 1} / 10
            </span>
          </div>
        </div>
      )}

      {/* BICEPS FULL SCREEN LIGHTBOX */}
      {isBicepsFullScreen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(5, 5, 8, 0.98)',
          zIndex: 999999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem'
        }}>
          {/* Close button */}
          <button
            onClick={() => setIsBicepsFullScreen(false)}
            style={{
              position: 'absolute',
              top: '2rem',
              right: '2rem',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-white)',
              borderRadius: '50%',
              width: '50px',
              height: '50px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '2rem',
              zIndex: 10,
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.background = 'rgba(255,62,108,0.2)'}
            onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.03)'}
          >&times;</button>

          {/* Main Image */}
          <div style={{ position: 'relative', width: '90%', height: '80%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img
              src={[
                'assets/images/barbell_curl.png',
                'assets/images/dumbbell_curl.png',
                'assets/images/hammer_curl.png',
                'assets/images/concentration_curl.png',
                'assets/images/preacher_curl.png',
                'assets/images/incline_dumbbell_curl.png',
                'assets/images/cable_curl.png',
                'assets/images/ez_bar_curl.png',
                'assets/images/spider_curl.png',
                'assets/images/chin_up_curl.png'
              ][bicepsPhotoIndex]}
              alt="Biceps Workout Full Screen"
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '8px', border: '1px solid var(--border-color)', boxShadow: '0 0 40px rgba(0, 240, 255, 0.2)' }}
            />

            {/* Left Nav Arrow */}
            <button
              onClick={() => setBicepsPhotoIndex((prev) => (prev - 1 + 10) % 10)}
              style={{
                position: 'absolute',
                left: '20px',
                background: 'rgba(0,0,0,0.7)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'var(--text-white)',
                borderRadius: '50%',
                width: '56px',
                height: '56px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '2rem',
                lineHeight: 1,
                transition: 'background 0.2s',
                zIndex: 11
              }}
              onMouseEnter={(e) => e.target.style.background = 'var(--accent-volt)'}
              onMouseLeave={(e) => e.target.style.background = 'rgba(0,0,0,0.7)'}
            >
              &lsaquo;
            </button>

            {/* Right Nav Arrow */}
            <button
              onClick={() => setBicepsPhotoIndex((prev) => (prev + 1) % 10)}
              style={{
                position: 'absolute',
                right: '20px',
                background: 'rgba(0,0,0,0.7)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'var(--text-white)',
                borderRadius: '50%',
                width: '56px',
                height: '56px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '2rem',
                lineHeight: 1,
                transition: 'background 0.2s',
                zIndex: 11
              }}
              onMouseEnter={(e) => e.target.style.background = 'var(--accent-volt)'}
              onMouseLeave={(e) => e.target.style.background = 'rgba(0,0,0,0.7)'}
            >
              &rsaquo;
            </button>
          </div>

          {/* Label and Count */}
          <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <h4 style={{ color: 'var(--text-white)', margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800 }}>
              {[
                '1. Barbell Curl',
                '2. Dumbbell Bicep Curl',
                '3. Hammer Curl',
                '4. Concentration Curl',
                '5. Preacher Curl',
                '6. Incline Dumbbell Curl',
                '7. Cable Bicep Curl',
                '8. EZ-Bar Curl',
                '9. Spider Curl',
                '10. Chin-Up (underhand grip)'
              ][bicepsPhotoIndex]}
            </h4>
            <span style={{ color: 'var(--accent-volt)', fontWeight: 'bold', fontSize: '1.1rem' }}>
              {bicepsPhotoIndex + 1} / 10
            </span>
          </div>
        </div>
      )}

      {/* TRICEPS FULL SCREEN LIGHTBOX */}
      {isTricepsFullScreen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(5, 5, 8, 0.98)',
          zIndex: 999999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem'
        }}>
          {/* Close button */}
          <button
            onClick={() => setIsTricepsFullScreen(false)}
            style={{
              position: 'absolute',
              top: '2rem',
              right: '2rem',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-white)',
              borderRadius: '50%',
              width: '50px',
              height: '50px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '2rem',
              zIndex: 10,
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.background = 'rgba(255,62,108,0.2)'}
            onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.03)'}
          >&times;</button>

          {/* Main Image */}
          <div style={{ position: 'relative', width: '90%', height: '80%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img
              src={[
                'assets/images/close_grip_bench_press.png',
                'assets/images/triceps_pushdown.png',
                'assets/images/overhead_triceps_extension.png',
                'assets/images/skull_crusher.png',
                'assets/images/triceps_dips.png',
                'assets/images/rope_pushdown.png',
                'assets/images/single_arm_cable_pushdown.png',
                'assets/images/dumbbell_kickback.png',
                'assets/images/bench_dips.png',
                'assets/images/jm_press.png'
              ][tricepsPhotoIndex]}
              alt="Triceps Workout Full Screen"
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '8px', border: '1px solid var(--border-color)', boxShadow: '0 0 40px rgba(0, 240, 255, 0.2)' }}
            />

            {/* Left Nav Arrow */}
            <button
              onClick={() => setTricepsPhotoIndex((prev) => (prev - 1 + 10) % 10)}
              style={{
                position: 'absolute',
                left: '20px',
                background: 'rgba(0,0,0,0.7)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'var(--text-white)',
                borderRadius: '50%',
                width: '56px',
                height: '56px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '2rem',
                lineHeight: 1,
                transition: 'background 0.2s',
                zIndex: 11
              }}
              onMouseEnter={(e) => e.target.style.background = 'var(--accent-volt)'}
              onMouseLeave={(e) => e.target.style.background = 'rgba(0,0,0,0.7)'}
            >
              &lsaquo;
            </button>

            {/* Right Nav Arrow */}
            <button
              onClick={() => setTricepsPhotoIndex((prev) => (prev + 1) % 10)}
              style={{
                position: 'absolute',
                right: '20px',
                background: 'rgba(0,0,0,0.7)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'var(--text-white)',
                borderRadius: '50%',
                width: '56px',
                height: '56px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '2rem',
                lineHeight: 1,
                transition: 'background 0.2s',
                zIndex: 11
              }}
              onMouseEnter={(e) => e.target.style.background = 'var(--accent-volt)'}
              onMouseLeave={(e) => e.target.style.background = 'rgba(0,0,0,0.7)'}
            >
              &rsaquo;
            </button>
          </div>

          {/* Label and Count */}
          <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <h4 style={{ color: 'var(--text-white)', margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800 }}>
              {[
                '1. Close-Grip Barbell Bench Press',
                '2. Straight-Bar Triceps Pushdown',
                '3. Overhead Cable Triceps Extension',
                '4. Lying L-Bar Skull Crusher',
                '5. Parallel Bar Triceps Dips',
                '6. High Pulley Rope Triceps Pushdown',
                '7. Single-Arm Cable Triceps Pushdown',
                '8. Bent-Over Dumbbell Triceps Kickback',
                '9. Seated Bench Dips',
                '10. Hybrid JM Barbell Press'
              ][tricepsPhotoIndex]}
            </h4>
            <span style={{ color: 'var(--accent-volt)', fontWeight: 'bold', fontSize: '1.1rem' }}>
              {tricepsPhotoIndex + 1} / 10
            </span>
          </div>
        </div>
      )}

      {/* SHOULDER FULL SCREEN LIGHTBOX */}
      {isShoulderFullScreen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(5, 5, 8, 0.98)',
          zIndex: 999999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem'
        }}>
          {/* Close button */}
          <button
            onClick={() => setIsShoulderFullScreen(false)}
            style={{
              position: 'absolute',
              top: '2rem',
              right: '2rem',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-white)',
              borderRadius: '50%',
              width: '50px',
              height: '50px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '2rem',
              zIndex: 10,
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.background = 'rgba(255,62,108,0.2)'}
            onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.03)'}
          >&times;</button>

          {/* Main Image */}
          <div style={{ position: 'relative', width: '90%', height: '80%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img
              src={[
                'assets/images/overhead_press.png',
                'assets/images/arnold_press.png',
                'assets/images/dumbbell_shoulder_press.png',
                'assets/images/lateral_raise.png',
                'assets/images/cable_lateral_raise.png',
                'assets/images/front_raise.png',
                'assets/images/rear_delt_fly.png',
                'assets/images/shoulder_face_pull.png',
                'assets/images/upright_row.png',
                'assets/images/shrugs.png'
              ][shoulderPhotoIndex]}
              alt="Shoulder Workout Full Screen"
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '8px', border: '1px solid var(--border-color)', boxShadow: '0 0 40px rgba(0, 240, 255, 0.2)' }}
            />

            {/* Left Nav Arrow */}
            <button
              onClick={() => setShoulderPhotoIndex((prev) => (prev - 1 + 10) % 10)}
              style={{
                position: 'absolute',
                left: '20px',
                background: 'rgba(0,0,0,0.7)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'var(--text-white)',
                borderRadius: '50%',
                width: '56px',
                height: '56px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '2rem',
                lineHeight: 1,
                transition: 'background 0.2s',
                zIndex: 11
              }}
              onMouseEnter={(e) => e.target.style.background = 'var(--accent-volt)'}
              onMouseLeave={(e) => e.target.style.background = 'rgba(0,0,0,0.7)'}
            >
              &lsaquo;
            </button>

            {/* Right Nav Arrow */}
            <button
              onClick={() => setShoulderPhotoIndex((prev) => (prev + 1) % 10)}
              style={{
                position: 'absolute',
                right: '20px',
                background: 'rgba(0,0,0,0.7)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'var(--text-white)',
                borderRadius: '50%',
                width: '56px',
                height: '56px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '2rem',
                lineHeight: 1,
                transition: 'background 0.2s',
                zIndex: 11
              }}
              onMouseEnter={(e) => e.target.style.background = 'var(--accent-volt)'}
              onMouseLeave={(e) => e.target.style.background = 'rgba(0,0,0,0.7)'}
            >
              &rsaquo;
            </button>
          </div>

          {/* Label and Count */}
          <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <h4 style={{ color: 'var(--text-white)', margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800 }}>
              {[
                '1. Standing Barbell Overhead Press (OHP)',
                '2. Seated Arnold Dumbbell Press',
                '3. Seated Dumbbell Shoulder Press',
                '4. Standing Dumbbell Lateral Raise',
                '5. Low Cable Side Lateral Raise',
                '6. Standing Dumbbell Front Raise',
                '7. Rear Delt Reverse Flyes',
                '8. High Pulley Rope Face Pull',
                '9. Barbell Upright Row',
                '10. Heavy Dumbbell Trap Shrugs'
              ][shoulderPhotoIndex]}
            </h4>
            <span style={{ color: 'var(--accent-volt)', fontWeight: 'bold', fontSize: '1.1rem' }}>
              {shoulderPhotoIndex + 1} / 10
            </span>
          </div>
        </div>
      )}

      {/* LEGS FULL SCREEN LIGHTBOX */}
      {isLegsFullScreen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(5, 5, 8, 0.98)',
          zIndex: 999999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem'
        }}>
          {/* Close button */}
          <button
            onClick={() => setIsLegsFullScreen(false)}
            style={{
              position: 'absolute',
              top: '2rem',
              right: '2rem',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-white)',
              borderRadius: '50%',
              width: '50px',
              height: '50px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '2rem',
              zIndex: 10,
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.background = 'rgba(255,62,108,0.2)'}
            onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.03)'}
          >&times;</button>

          {/* Main Image */}
          <div style={{ position: 'relative', width: '90%', height: '80%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img
              src={[
                'assets/images/back_squat.png',
                'assets/images/front_squat.png',
                'assets/images/romanian_deadlift.png',
                'assets/images/leg_press.png',
                'assets/images/walking_lunges.png',
                'assets/images/bulgarian_split_squat.png',
                'assets/images/leg_extension.png',
                'assets/images/leg_curl.png',
                'assets/images/standing_calf_raise.png',
                'assets/images/seated_calf_raise.png'
              ][legsPhotoIndex]}
              alt="Leg Workout Full Screen"
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '8px', border: '1px solid var(--border-color)', boxShadow: '0 0 40px rgba(0, 240, 255, 0.2)' }}
            />

            {/* Left Nav Arrow */}
            <button
              onClick={() => setLegsPhotoIndex((prev) => (prev - 1 + 10) % 10)}
              style={{
                position: 'absolute',
                left: '20px',
                background: 'rgba(0,0,0,0.7)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'var(--text-white)',
                borderRadius: '50%',
                width: '56px',
                height: '56px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '2rem',
                lineHeight: 1,
                transition: 'background 0.2s',
                zIndex: 11
              }}
              onMouseEnter={(e) => e.target.style.background = 'var(--accent-volt)'}
              onMouseLeave={(e) => e.target.style.background = 'rgba(0,0,0,0.7)'}
            >
              &lsaquo;
            </button>

            {/* Right Nav Arrow */}
            <button
              onClick={() => setLegsPhotoIndex((prev) => (prev + 1) % 10)}
              style={{
                position: 'absolute',
                right: '20px',
                background: 'rgba(0,0,0,0.7)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'var(--text-white)',
                borderRadius: '50%',
                width: '56px',
                height: '56px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '2rem',
                lineHeight: 1,
                transition: 'background 0.2s',
                zIndex: 11
              }}
              onMouseEnter={(e) => e.target.style.background = 'var(--accent-volt)'}
              onMouseLeave={(e) => e.target.style.background = 'rgba(0,0,0,0.7)'}
            >
              &rsaquo;
            </button>
          </div>

          {/* Label and Count */}
          <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <h4 style={{ color: 'var(--text-white)', margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800 }}>
              {[
                '1. Heavy Barbell Back Squat',
                '2. Clean Grip Barbell Front Squat',
                '3. Romanian Barbell Deadlift (RDL)',
                '4. 45-Degree Incline Leg Press Machine',
                '5. Dumbbell Walking Lunges',
                '6. Bench-Elevated Bulgarian Split Squat',
                '7. Seated Quad Leg Extension Machine',
                '8. Lying Hamstring Leg Curl Machine',
                '9. Standing Machine Calf Raise',
                '10. Seated Soleus Calf Raise Machine'
              ][legsPhotoIndex]}
            </h4>
            <span style={{ color: 'var(--accent-volt)', fontWeight: 'bold', fontSize: '1.1rem' }}>
              {legsPhotoIndex + 1} / 10
            </span>
          </div>
        </div>
      )}

      {/* PERSONAL TRAINER HIRE & PAYMENT MODAL OVERLAY */}
      {trainerToHire && !showTrainerGateway && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(5, 5, 8, 0.92)',
          backdropFilter: 'blur(10px)',
          zIndex: 999999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem'
        }}>
          <div className="db-card" style={{ width: '100%', maxWidth: '520px', padding: '2rem', position: 'relative', border: '1px solid var(--accent-volt)', boxShadow: '0 0 40px rgba(198, 255, 0, 0.2)', maxHeight: '90vh', overflowY: 'auto' }}>

            {/* Close Modal Button */}
            <button
              type="button"
              onClick={() => setTrainerToHire(null)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '1.6rem',
                cursor: 'pointer'
              }}
            >
              &times;
            </button>

            <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '55px', height: '55px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-volt))', color: '#000', fontWeight: 800, fontSize: '1.3rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {trainerToHire.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 style={{ margin: 0, color: 'var(--text-white)', fontSize: '1.2rem', fontWeight: 800 }}>
                    Hire {trainerToHire.name}
                  </h3>
                  <span style={{ color: 'var(--accent-volt)', fontSize: '0.78rem', fontWeight: 700, display: 'block', marginTop: '0.1rem' }}>
                    {trainerToHire.specialty || 'Certified Personal Strength & Conditioning Coach'}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {trainerToHire.credentials || 'CSCS Certified'} • {trainerToHire.email}
                  </span>
                </div>
              </div>
            </div>

            <form onSubmit={handleConfirmTrainerPayment} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>

              {/* 1. PACKAGE SELECTION */}
              <div>
                <label className="form-label" style={{ fontSize: '0.78rem', color: 'var(--accent-volt)' }}>Select Personal Training Package</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {[
                    { id: 'monthly', name: '1-Month Personal Coaching', price: 5000, period: 'month', detail: 'Weekly 1-on-1 workouts, custom diet plan & 24/7 coach chat' },
                    { id: '3month', name: '3-Month Transformation Package', price: 13000, period: '3 months', detail: 'Save ₹2,000! Periodization training & bi-weekly form review' },
                    { id: '6month', name: '6-Month VIP Elite Mentorship', price: 23000, period: '6 months', detail: 'Save ₹7,000! 1-on-1 priority scheduling & custom stack' }
                  ].map((pkg) => (
                    <div
                      key={pkg.id}
                      onClick={() => setTrainerPackage(pkg.id)}
                      style={{
                        background: trainerPackage === pkg.id ? 'rgba(198, 255, 0, 0.06)' : 'rgba(255, 255, 255, 0.01)',
                        border: trainerPackage === pkg.id ? '1px solid var(--accent-volt)' : '1px solid var(--border-color)',
                        borderRadius: '6px',
                        padding: '0.8rem 1rem',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div>
                        <strong style={{ color: 'var(--text-white)', fontSize: '0.86rem', display: 'block' }}>{pkg.name}</strong>
                        <span style={{ fontSize: '0.71rem', color: 'var(--text-muted)' }}>{pkg.detail}</span>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0, paddingLeft: '0.8rem' }}>
                        <span style={{ color: 'var(--accent-volt)', fontWeight: 800, fontSize: '1.05rem' }}>₹{pkg.price.toLocaleString('en-IN')}</span>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', display: 'block' }}>/{pkg.period}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* PROCEED TO GATEWAY BUTTON */}
              <button
                type="submit"
                className="glow-btn"
                style={{ padding: '0.85rem', fontSize: '0.9rem', width: '100%', marginTop: '0.5rem' }}
              >
                Proceed to Secure Gateway →
              </button>

            </form>
          </div>
        </div>
      )}

      {showTrainerGateway && trainerToHire && (
        <DummyPaymentGateway
          amount={{ monthly: 5000, '3month': 13000, '6month': 23000 }[trainerPackage] || 5000}
          title={`Hire Coach: ${trainerToHire.name}`}
          onPaymentSuccess={handleTrainerPaymentSuccess}
          onClose={() => setShowTrainerGateway(false)}
        />
      )}

      {/* MEMBERSHIP SUBSCRIPTION PLAN CHECKOUT & PAYMENT MODAL OVERLAY */}
      {planToPurchase && !showMembershipGateway && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(5, 5, 8, 0.92)',
          backdropFilter: 'blur(10px)',
          zIndex: 999999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem'
        }}>
          <div className="db-card" style={{ width: '100%', maxWidth: '520px', padding: '2rem', position: 'relative', border: '1px solid var(--accent-volt)', boxShadow: '0 0 40px rgba(198, 255, 0, 0.2)', maxHeight: '90vh', overflowY: 'auto' }}>

            {/* Close Modal Button */}
            <button
              type="button"
              onClick={() => setPlanToPurchase(null)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '1.6rem',
                cursor: 'pointer'
              }}
            >
              &times;
            </button>

            <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, color: 'var(--text-white)', fontSize: '1.25rem', fontWeight: 800, textTransform: 'uppercase', fontFamily: 'var(--font-display)' }}>
                Membership Subscription Checkout
              </h3>
              <p style={{ margin: '0.2rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                Activate your official keycard pass for gym access & facility privileges
              </p>
            </div>

            {/* Selected Plan Summary Card */}
            <div style={{ background: 'rgba(198, 255, 0, 0.06)', border: '1px solid var(--accent-volt)', borderRadius: '8px', padding: '1.2rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.65rem', background: 'rgba(198,255,0,0.15)', color: 'var(--accent-volt)', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 800, textTransform: 'uppercase' }}>
                  Selected Plan
                </span>
                <h4 style={{ margin: '0.4rem 0 0 0', color: 'var(--text-white)', fontSize: '1.1rem', fontWeight: 800 }}>
                  {planToPurchase.name} Pass
                </h4>
                <p style={{ margin: '0.2rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.76rem', lineHeight: 1.3 }}>
                  {planToPurchase.desc}
                </p>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0, paddingLeft: '1rem' }}>
                <span style={{ color: 'var(--accent-volt)', fontWeight: 800, fontSize: '1.3rem' }}>
                  ₹{planToPurchase.price.toLocaleString('en-IN')}
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', display: 'block' }}>
                  /{planToPurchase.period || 'month'}
                </span>
              </div>
            </div>

            <form onSubmit={handleConfirmMembershipPayment} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              {/* PROCEED TO GATEWAY BUTTON */}
              <button
                type="submit"
                className="glow-btn"
                style={{ padding: '0.85rem', fontSize: '0.9rem', width: '100%', marginTop: '0.5rem' }}
              >
                {isProcessingMembershipPayment
                  ? 'Authorizing Bank Payment...'
                  : `Confirm & Pay ₹${planToPurchase.price.toLocaleString('en-IN')} to Activate Pass →`}
              </button>
            </form>
          </div>
        </div>
      )}

      {showMembershipGateway && planToPurchase && (
        <DummyPaymentGateway
          amount={planToPurchase.price}
          title={`Membership Checkout: ${planToPurchase.name}`}
          onPaymentSuccess={handleMembershipPaymentSuccess}
          onClose={() => setShowMembershipGateway(false)}
        />
      )}
    </div>

  );
}
