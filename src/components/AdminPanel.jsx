import React, { useState, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import { memberApi } from '../services/memberApi';
import ReceiptModal from './ReceiptModal';

export default function AdminPanel({ activeView, activities, addActivity, onNavigateSubView }) {
  // Financial Accounts & Razorpay Transaction States
  const [accountsSummary, setAccountsSummary] = useState({
    totalRevenue: 0,
    membershipRevenue: 0,
    supplementRevenue: 0,
    trainerRevenue: 0,
    totalGstCollected: 0,
    transactionCount: 0,
    averageOrderValue: 0
  });
  const [adminTransactions, setAdminTransactions] = useState([]);
  const [activeAdminReceipt, setActiveAdminReceipt] = useState(null);
  const [paymentCategoryFilter, setPaymentCategoryFilter] = useState('all');
  const [paymentSearchQuery, setPaymentSearchQuery] = useState('');
  const [isAccountsLoading, setIsAccountsLoading] = useState(false);

  // Expiry alerts mock list
  const [expiryAlerts, setExpiryAlerts] = useState([]);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [modalViewMode, setModalViewMode] = useState('photo'); // 'photo' or 'diagnostics'
  const [chestPhotoIndex, setChestPhotoIndex] = useState(0);
  const [isChestFullScreen, setIsChestFullScreen] = useState(false);
  const [backPhotoIndex, setBackPhotoIndex] = useState(0);
  const [isBackFullScreen, setIsBackFullScreen] = useState(false);

  // Dynamic equipment management states (Admin Exclusive)
  const defaultEquipmentList = [
    {
      id: 'eq-1',
      name: 'Chest Workout Station',
      status: '100% Active',
      image: 'assets/images/chest_workout.png',
      type: 'chest',
      subtitle: 'Chest press machines & bench presses',
      diagnostics: [
        'Safety Catch Integrity: 100% (Solid)',
        'Bench Padding Level: Wear 5% (Good)',
        'Visual Weld Inspection: Pass',
        'Scheduled Maintenance: September 10, 2026'
      ]
    },
    {
      id: 'eq-2',
      name: 'Back Workout Station',
      status: '100% Active',
      image: 'assets/images/back_workout.png',
      type: 'back',
      subtitle: 'Lat pulldown machines & rowing stations',
      diagnostics: [
        'Lat Pulldown Cable Tension: 95% (Excellent)',
        'Guide Rod Lubrication: 100% (Sufficient)',
        'Pulley Smoothness test: Pass',
        'Last Maintenance: July 1, 2026'
      ]
    },
    {
      id: 'eq-3',
      name: 'Biceps Workout Station',
      status: '100% Active',
      image: 'assets/images/biceps_workout.png',
      type: 'biceps',
      subtitle: 'Dumbbell curls & preacher curl benches',
      diagnostics: [
        'EZ-Bar Racks Stand Alignment: Align ok',
        'Dumbbell Weight Check: 100% (All pairs accounted)',
        'Rack Safety Pads: Pass',
        'Last Inspection: Today 08:00 AM'
      ]
    },
    {
      id: 'eq-4',
      name: 'Triceps Workout Station',
      status: '100% Active',
      image: 'assets/images/triceps_workout.png',
      type: 'triceps',
      subtitle: 'Cable rope pushdowns & overhead extensions',
      diagnostics: [
        'Pulley Bearings Friction: Low (Optimal)',
        'Rope Attachment Grip Wear: Minimal',
        'Weight Selector Pin Lock: Secure',
        'Last Cable Visual Scan: Pass'
      ]
    },
    {
      id: 'eq-5',
      name: 'Shoulder Workout Station',
      status: '100% Active',
      image: 'assets/images/shoulder_workout.png',
      type: 'shoulder',
      subtitle: 'Dumbbell overhead presses & lateral raises',
      diagnostics: [
        'Dumbbell Press Backrest Adjuster: Visual ok',
        'Frame Bolting Integrity: 45 Nm (Secure)',
        'Safety Lock pins: Operational',
        'Last Certified safety check: June 20, 2026'
      ]
    },
    {
      id: 'eq-6',
      name: 'Legs Workout Station',
      status: '100% Active',
      image: 'assets/images/legs_workout.png',
      type: 'legs',
      subtitle: 'Barbell squats & leg press machines',
      diagnostics: [
        'Leg Press Slide Bearings: Smooth (98%)',
        'Squat Rack Uprights Torque: 50 Nm (Inspected)',
        'Safety Spotter arms test: Pass',
        'Linear sled locking mechanism: Operational'
      ]
    }
  ];

  const [equipmentList, setEquipmentList] = useState(() => {
    const saved = localStorage.getItem('apex_equipment_list');
    return saved ? JSON.parse(saved) : defaultEquipmentList;
  });

  const [isAddEquipmentOpen, setIsAddEquipmentOpen] = useState(false);
  const [newEqName, setNewEqName] = useState('');
  const [newEqSubtitle, setNewEqSubtitle] = useState('');
  const [newEqType, setNewEqType] = useState('chest');
  const [newEqStatus, setNewEqStatus] = useState('100% Active');
  const [newEqImage, setNewEqImage] = useState('assets/images/gallery_weights.png');
  const [newEqDiagnostics, setNewEqDiagnostics] = useState('Safety catch inspection: Pass\nCable tension test: 100% (Optimal)\nGeneral maintenance: Up to date');

  // Station Photos & Titles State (persisted in localStorage)
  const defaultChestPhotos = [
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
  ];
  const defaultChestTitles = [
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
  ];

  const defaultBackPhotos = [
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
  ];
  const defaultBackTitles = [
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
  ];

  const defaultBicepsPhotos = [
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
  ];

  const defaultTricepsPhotos = [
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
  ];

  const defaultShoulderPhotos = [
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
  ];

  const defaultLegsPhotos = [
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
  ];

  const [chestPhotos, setChestPhotos] = useState(() => JSON.parse(localStorage.getItem('apex_chest_photos')) || defaultChestPhotos);
  const [chestTitles, setChestTitles] = useState(() => JSON.parse(localStorage.getItem('apex_chest_titles')) || defaultChestTitles);

  const [backPhotos, setBackPhotos] = useState(() => JSON.parse(localStorage.getItem('apex_back_photos')) || defaultBackPhotos);
  const [backTitles, setBackTitles] = useState(() => JSON.parse(localStorage.getItem('apex_back_titles')) || defaultBackTitles);

  const [bicepsPhotos, setBicepsPhotos] = useState(() => JSON.parse(localStorage.getItem('apex_biceps_photos')) || defaultBicepsPhotos);
  const [tricepsPhotos, setTricepsPhotos] = useState(() => JSON.parse(localStorage.getItem('apex_triceps_photos')) || defaultTricepsPhotos);
  const [shoulderPhotos, setShoulderPhotos] = useState(() => JSON.parse(localStorage.getItem('apex_shoulder_photos')) || defaultShoulderPhotos);
  const [legsPhotos, setLegsPhotos] = useState(() => JSON.parse(localStorage.getItem('apex_legs_photos')) || defaultLegsPhotos);

  const handleAddEquipmentSubmit = (e) => {
    e.preventDefault();
    if (!newEqName.trim()) {
      alert('Please enter Workout Name!');
      return;
    }
    const imageUrl = newEqImage.trim() || 'assets/images/gallery_weights.png';
    const cat = (newEqType || 'chest').toLowerCase();
    let targetStationName = 'Chest Workout Station';

    if (cat.includes('chest')) {
      targetStationName = 'Chest Workout Station';
      const updatedP = [...chestPhotos, imageUrl];
      const updatedT = [...chestTitles, `${chestPhotos.length + 1}. ${newEqName.trim()}`];
      setChestPhotos(updatedP);
      setChestTitles(updatedT);
      localStorage.setItem('apex_chest_photos', JSON.stringify(updatedP));
      localStorage.setItem('apex_chest_titles', JSON.stringify(updatedT));
      setChestPhotoIndex(updatedP.length - 1);
    } else if (cat.includes('back')) {
      targetStationName = 'Back Workout Station';
      const updatedP = [...backPhotos, imageUrl];
      const updatedT = [...backTitles, `${backPhotos.length + 1}. ${newEqName.trim()}`];
      setBackPhotos(updatedP);
      setBackTitles(updatedT);
      localStorage.setItem('apex_back_photos', JSON.stringify(updatedP));
      localStorage.setItem('apex_back_titles', JSON.stringify(updatedT));
      setBackPhotoIndex(updatedP.length - 1);
    } else if (cat.includes('bicep')) {
      targetStationName = 'Biceps Workout Station';
      const updatedP = [...bicepsPhotos, imageUrl];
      setBicepsPhotos(updatedP);
      localStorage.setItem('apex_biceps_photos', JSON.stringify(updatedP));
    } else if (cat.includes('tricep')) {
      targetStationName = 'Triceps Workout Station';
      const updatedP = [...tricepsPhotos, imageUrl];
      setTricepsPhotos(updatedP);
      localStorage.setItem('apex_triceps_photos', JSON.stringify(updatedP));
    } else if (cat.includes('shoulder')) {
      targetStationName = 'Shoulder Workout Station';
      const updatedP = [...shoulderPhotos, imageUrl];
      setShoulderPhotos(updatedP);
      localStorage.setItem('apex_shoulder_photos', JSON.stringify(updatedP));
    } else { // legs, cardio, functional
      targetStationName = 'Legs Workout Station';
      const updatedP = [...legsPhotos, imageUrl];
      setLegsPhotos(updatedP);
      localStorage.setItem('apex_legs_photos', JSON.stringify(updatedP));
    }

    setIsAddEquipmentOpen(false);
    setNewEqName('');
    setNewEqSubtitle('');
    setNewEqImage('');

    // Immediately open that station's photo gallery modal to view the newly added workout image
    setSelectedEquipment({
      name: targetStationName,
      status: newEqStatus || '100% Active',
      image: imageUrl,
      type: cat
    });
    setModalViewMode('photo');

    alert(`Workout image "${newEqName.trim()}" added directly to ${targetStationName} photo gallery!`);
  };

  const handleDeleteEquipmentCard = (id, name) => {
    if (confirm(`Are you sure you want to delete equipment "${name}"?`)) {
      const updated = equipmentList.filter(item => item.id !== id);
      setEquipmentList(updated);
      localStorage.setItem('apex_equipment_list', JSON.stringify(updated));
      alert(`Equipment "${name}" removed from diagnostics.`);
    }
  };

  const handleDeleteStationImage = (stationKey, photoIndex) => {
    if (confirm(`Remove separate image #${photoIndex + 1} from this station gallery?`)) {
      if (stationKey === 'chest' || stationKey.toLowerCase().includes('chest')) {
        const updatedP = chestPhotos.filter((_, i) => i !== photoIndex);
        const updatedT = chestTitles.filter((_, i) => i !== photoIndex);
        setChestPhotos(updatedP);
        setChestTitles(updatedT);
        localStorage.setItem('apex_chest_photos', JSON.stringify(updatedP));
        localStorage.setItem('apex_chest_titles', JSON.stringify(updatedT));
        if (chestPhotoIndex >= updatedP.length) setChestPhotoIndex(Math.max(0, updatedP.length - 1));
      } else if (stationKey === 'back' || stationKey.toLowerCase().includes('back')) {
        const updatedP = backPhotos.filter((_, i) => i !== photoIndex);
        const updatedT = backTitles.filter((_, i) => i !== photoIndex);
        setBackPhotos(updatedP);
        setBackTitles(updatedT);
        localStorage.setItem('apex_back_photos', JSON.stringify(updatedP));
        localStorage.setItem('apex_back_titles', JSON.stringify(updatedT));
        if (backPhotoIndex >= updatedP.length) setBackPhotoIndex(Math.max(0, updatedP.length - 1));
      }
      alert('Separate image removed successfully!');
    }
  };

  // Gym Members Management State (persisted in localStorage)
  // Function to load exclusively real registered members from localStorage
  const getRegisteredOnlyMembers = () => {
    const savedAdminMembers = JSON.parse(localStorage.getItem('apex_admin_members')) || [];
    const registeredUsers = JSON.parse(localStorage.getItem('apex_registered_users')) || [];

    // Get real registered trainers list
    const realTrainers = registeredUsers
      .filter(u => u.role === 'trainer' && u.name)
      .map(u => u.name);

    const combinedMap = new Map();

    // 1. Add admin registered members
    savedAdminMembers.forEach(m => combinedMap.set(m.email.toLowerCase(), m));

    // 2. Add real registered members from site registration form
    registeredUsers
      .filter(u => u.role === 'member' || !u.role)
      .forEach((u, index) => {
        if (!combinedMap.has(u.email.toLowerCase())) {
          // Assigned real trainer if taken by member
          let memberTrainer = u.trainer || u.coachingTrainer || u.assignedTrainer || 'No Trainer Assigned';

          combinedMap.set(u.email.toLowerCase(), {
            id: 'reg-' + index + '-' + u.email,
            name: u.name || u.email.split('@')[0],
            email: u.email,
            phone: u.phone || '+1 (555) 019-2831',
            plan: u.plan || 'Pro Apex Tier',
            price: u.price || '₹2,999/mo',
            status: 'Active',
            joinDate: new Date().toISOString().split('T')[0],
            trainer: memberTrainer,
            rfid: 'RF-' + (8000 + index)
          });
        }
      });

    return Array.from(combinedMap.values());
  };

  // Registered trainers list - strictly from registered user accounts (no dummy names)
  const registeredTrainers = (() => {
    const registeredUsers = JSON.parse(localStorage.getItem('apex_registered_users')) || [];
    return registeredUsers
      .filter(u => u.role === 'trainer' && u.name)
      .map(u => u.name);
  })();

  const [membersList, setMembersList] = useState(getRegisteredOnlyMembers);

  const getRegisteredTrainers = () => {
    const registeredUsers = JSON.parse(localStorage.getItem('apex_registered_users')) || [];
    const trainers = registeredUsers.filter(u => u.role === 'trainer');
    
    // Seed default trainers if none exist (for demo purposes)
    if (trainers.length === 0) {
      const defaultTrainers = [
        {
          name: 'Marcus Vance',
          email: 'trainer@apex.com',
          role: 'trainer',
          specialty: 'strength',
          certifications: 'CSCS Certified, 8+ Years Experience'
        },
        {
          name: 'Sarah Connor',
          email: 'sarah.c@apex.com',
          role: 'trainer',
          specialty: 'hiit',
          certifications: 'NASM-CPT, Kettlebell Level 2'
        },
        {
          name: 'David Goggins',
          email: 'goggins@apex.com',
          role: 'trainer',
          specialty: 'combat',
          certifications: 'Ex-Navy SEAL, Ultra-endurance Coach'
        }
      ];
      
      const updatedUsers = [...registeredUsers, ...defaultTrainers];
      localStorage.setItem('apex_registered_users', JSON.stringify(updatedUsers));
      return defaultTrainers;
    }
    
    return trainers;
  };

  const [trainersList, setTrainersList] = useState(getRegisteredTrainers);

  const fetchDbMembers = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/alerts/members', {
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('apex_auth_token') ? { Authorization: `Bearer ${localStorage.getItem('apex_auth_token')}` } : {})
        }
      });
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data) {
          const dbMembers = result.data.map((u, index) => {
            return {
              id: u.userId || `db-${index}-${u.email}`,
              name: u.name || u.email.split('@')[0],
              email: u.email,
              phone: u.phone || '+1 (555) 019-2831',
              plan: u.membershipTier || 'Pro Apex Tier',
              price: u.price || '₹2,999/mo',
              status: u.status || 'Active',
              joinDate: u.joinedDate || new Date().toISOString().split('T')[0],
              trainer: u.trainer || u.coachingTrainer || u.assignedTrainer || 'No Trainer Assigned',
              rfid: u.rfid || 'RF-' + (8000 + index)
            };
          });
          
          const savedAdminMembers = JSON.parse(localStorage.getItem('apex_admin_members')) || [];
          const combinedMap = new Map();
          
          dbMembers.forEach(m => combinedMap.set(m.email.toLowerCase(), m));
          
          savedAdminMembers.forEach(m => {
            const emailKey = m.email.toLowerCase();
            if (!combinedMap.has(emailKey)) {
              combinedMap.set(emailKey, m);
            } else {
              const dbMem = combinedMap.get(emailKey);
              if (m.phone && !m.phone.includes('(555)') && m.phone !== '0') {
                dbMem.phone = m.phone;
              }
              combinedMap.set(emailKey, dbMem);
            }
          });
          
          setMembersList(Array.from(combinedMap.values()));
          return;
        }
      }
    } catch (err) {
      console.warn("Failed to fetch database members:", err);
    }
    setMembersList(getRegisteredOnlyMembers());
  };

  // Keep registered member and trainer names in sync live
  useEffect(() => {
    const syncRegisteredUsers = () => {
      fetchDbMembers();
      setTrainersList(getRegisteredTrainers());
    };

    syncRegisteredUsers();
    window.addEventListener('storage', syncRegisteredUsers);
    return () => window.removeEventListener('storage', syncRegisteredUsers);
  }, []);

  const fetchFinancialAccounts = async () => {
    setIsAccountsLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/payment/admin/accounts');
      const data = await res.json();
      if (data.success) {
        setAccountsSummary(data.summary || {});
        setAdminTransactions(data.transactions || []);
      }
    } catch (err) {
      console.warn('Could not fetch financial accounts from backend:', err);
    } finally {
      setIsAccountsLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancialAccounts();
  }, [activeView]);

  useEffect(() => {
    const paymentRecords = membersList.map((m, idx) => {
      const priceVal = m.price ? parseFloat(m.price.replace(/[^0-9.]/g, '')) : 79.00;
      return {
        txId: m.rfid ? 'TX-' + m.rfid.replace(/[^0-9]/g, '') : 'TX-' + (1000 + idx),
        name: m.name,
        plan: m.plan || 'Pro Apex Tier',
        amount: priceVal,
        status: 'paid',
        date: m.joinDate || 'Today'
      };
    });
    setPayments(paymentRecords);
  }, [membersList]);

  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [filterPlan, setFilterPlan] = useState('All');
  const [trainerSearchQuery, setTrainerSearchQuery] = useState('');

  const handleDeleteTrainer = (email, name) => {
    if (confirm(`Are you sure you want to remove trainer "${name}"?`)) {
      const registeredUsers = JSON.parse(localStorage.getItem('apex_registered_users')) || [];
      const updated = registeredUsers.filter(u => !(u.role === 'trainer' && u.email.toLowerCase() === email.toLowerCase()));
      localStorage.setItem('apex_registered_users', JSON.stringify(updated));
      
      setTrainersList(updated.filter(u => u.role === 'trainer'));
      addActivity(`Removed trainer <strong>${name}</strong> from database`, 'orange');
      alert(`Trainer "${name}" removed successfully.`);
    }
  };

  // New Member Form States
  const [newMemName, setNewMemName] = useState('');
  const [newMemEmail, setNewMemEmail] = useState('');
  const [newMemPhone, setNewMemPhone] = useState('');
  const [newMemPlan, setNewMemPlan] = useState('Pro Apex Tier');
  const [newMemStatus, setNewMemStatus] = useState('Active');
  const [newMemTrainer, setNewMemTrainer] = useState('Coach Marcus');
  const [newMemRfid, setNewMemRfid] = useState('RF-' + Math.floor(1000 + Math.random() * 9000));

  const handleAddMemberSubmit = (e) => {
    e.preventDefault();
    if (!newMemName.trim() || !newMemEmail.trim()) {
      alert('Please enter member full name and email address!');
      return;
    }

    const priceMap = {
      'Pro Apex Tier': '₹2,999/mo',
      'Basic Gym Tier': '₹1,499/mo',
      'VIP Elite Athlete': '₹4,999/mo'
    };

    const newMember = {
      id: 'mem-' + Date.now(),
      name: newMemName.trim(),
      email: newMemEmail.trim(),
      phone: newMemPhone.trim() || '+1 (555) 000-0000',
      plan: newMemPlan,
      price: priceMap[newMemPlan] || '₹2,999/mo',
      status: newMemStatus,
      joinDate: new Date().toISOString().split('T')[0],
      trainer: newMemTrainer,
      rfid: newMemRfid.trim() || ('RF-' + Math.floor(1000 + Math.random() * 9000))
    };

    const updated = [newMember, ...membersList];
    setMembersList(updated);
    localStorage.setItem('apex_admin_members', JSON.stringify(updated));

    setIsAddMemberOpen(false);
    setNewMemName('');
    setNewMemEmail('');
    setNewMemPhone('');
    setNewMemRfid('RF-' + Math.floor(1000 + Math.random() * 9000));

    addActivity(`Registered new gym member <strong>${newMember.name}</strong> (${newMember.plan})`, 'volt');
    alert(`Member "${newMember.name}" registered successfully!`);
  };

  const handleDeleteMember = async (id, name, email) => {
    if (confirm(`Are you sure you want to remove member "${name}"? This will permanently delete their account from the database.`)) {
      if (email) {
        try {
          const res = await fetch(`http://localhost:5000/api/alerts/members/${encodeURIComponent(email)}`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              ...(localStorage.getItem('apex_auth_token') ? { Authorization: `Bearer ${localStorage.getItem('apex_auth_token')}` } : {})
            }
          });
          if (!res.ok) {
            throw new Error('Failed to delete member from backend database.');
          }
        } catch (err) {
          console.warn("Backend member deletion failed:", err);
        }
      }

      // Filter local state
      const updated = membersList.filter(m => m.email.toLowerCase() !== email.toLowerCase());
      setMembersList(updated);

      // Clean up localStorage
      const savedAdminMembers = JSON.parse(localStorage.getItem('apex_admin_members')) || [];
      const updatedAdmin = savedAdminMembers.filter(m => m.email.toLowerCase() !== email.toLowerCase());
      localStorage.setItem('apex_admin_members', JSON.stringify(updatedAdmin));

      const registeredUsers = JSON.parse(localStorage.getItem('apex_registered_users')) || [];
      const updatedRegistered = registeredUsers.filter(u => u.email.toLowerCase() !== email.toLowerCase());
      localStorage.setItem('apex_registered_users', JSON.stringify(updatedRegistered));

      addActivity(`Removed member <strong>${name}</strong> from database`, 'orange');
      alert(`Member "${name}" removed from database.`);
    }
  };

  // Payments mock list
  const [payments, setPayments] = useState([]);

  // Attendance states
  const [attReportType, setAttReportType] = useState('daily'); // 'daily' or 'monthly'
  const [simMember, setSimMember] = useState('Ethan Hunt');
  const [simAction, setSimAction] = useState('check-in');

  const [dailyAttendance, setDailyAttendance] = useState([]);

  const [monthlyAttendance, setMonthlyAttendance] = useState([]);

  const [checkedInCount, setCheckedInCount] = useState(0);
  const [onFloorCount, setOnFloorCount] = useState(0);

  // Chart canvas references
  const growthCanvasRef = useRef(null);
  const revCanvasRef = useRef(null);
  const attCanvasRef = useRef(null);
  const statusReportCanvasRef = useRef(null);
  const targetCanvasRef = useRef(null);

  // Broadcast alerts states
  const [broadcastAlerts, setBroadcastAlerts] = useState([]);
  const [newAlertTitle, setNewAlertTitle] = useState('');
  const [newAlertMessage, setNewAlertMessage] = useState('');
  const [newAlertType, setNewAlertType] = useState('general');

  const fetchBroadcastAlerts = async () => {
    try {
      const data = await memberApi.getAlerts();
      if (data) {
        setBroadcastAlerts(data);
      } else {
        const localAlerts = JSON.parse(localStorage.getItem('apex_broadcast_alerts') || '[]');
        setBroadcastAlerts(localAlerts);
      }
    } catch (e) {
      console.warn("Error fetching broadcast alerts:", e);
    }
  };

  useEffect(() => {
    if (activeView === 'alerts') {
      fetchBroadcastAlerts();
    }
  }, [activeView]);

  const handleCreateAlert = async (e) => {
    e.preventDefault();
    if (!newAlertTitle.trim() || !newAlertMessage.trim()) {
      alert("Please enter alert title and description.");
      return;
    }

    const newAlert = {
      title: newAlertTitle.trim(),
      message: newAlertMessage.trim(),
      type: newAlertType
    };

    const res = await memberApi.addAlert(newAlert);
    
    if (!res) {
      const localAlerts = JSON.parse(localStorage.getItem('apex_broadcast_alerts') || '[]');
      const localNewAlert = {
        id: `alt-${Date.now()}`,
        title: newAlertTitle.trim(),
        message: newAlertMessage.trim(),
        type: newAlertType,
        date: new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        active: true
      };
      localAlerts.unshift(localNewAlert);
      localStorage.setItem('apex_broadcast_alerts', JSON.stringify(localAlerts));
      setBroadcastAlerts(localAlerts);
    } else {
      await fetchBroadcastAlerts();
    }

    addActivity(`Broadcasted alert <strong>${newAlertTitle}</strong> (${newAlertType})`, 'orange');
    alert("Alert broadcasted successfully!");

    setNewAlertTitle('');
    setNewAlertMessage('');
    setNewAlertType('general');
  };

  const handleDeleteAlert = async (id, title) => {
    if (confirm(`Are you sure you want to withdraw the alert: "${title}"?`)) {
      const success = await memberApi.deleteAlert(id);
      if (!success) {
        const localAlerts = JSON.parse(localStorage.getItem('apex_broadcast_alerts') || '[]');
        const updated = localAlerts.filter(a => a.id !== id);
        localStorage.setItem('apex_broadcast_alerts', JSON.stringify(updated));
        setBroadcastAlerts(updated);
      } else {
        await fetchBroadcastAlerts();
      }
      addActivity(`Withdrew broadcast alert <strong>${title}</strong>`, 'orange');
      alert("Alert successfully withdrawn.");
    }
  };

  // Supplement Orders Management States (Admin)
  const [adminOrders, setAdminOrders] = useState([]);
  const [adminOrderFilter, setAdminOrderFilter] = useState('All');
  const [adminOrderSearch, setAdminOrderSearch] = useState('');
  const [selectedAdminOrder, setSelectedAdminOrder] = useState(null);
  const [editingOrderModal, setEditingOrderModal] = useState(null);
  const [editStatus, setEditStatus] = useState('Confirmed');
  const [editCourier, setEditCourier] = useState('Apex Express Logistics');
  const [editTracking, setEditTracking] = useState('');
  const [editEstDelivery, setEditEstDelivery] = useState('2-3 Business Days');
  const [editNote, setEditNote] = useState('');

  const fetchAdminOrders = async () => {
    try {
      const serverOrders = await memberApi.getSupplementOrders();
      let localOrders = [];
      try {
        localOrders = JSON.parse(localStorage.getItem('apex_supplement_orders') || '[]');
      } catch (e) {}

      const map = new Map();
      [...(localOrders || []), ...(serverOrders || [])].forEach((o) => {
        if (o && (o.orderId || o.txId)) {
          map.set(o.orderId || o.txId, o);
        }
      });
      setAdminOrders(Array.from(map.values()));
    } catch (err) {
      console.warn("Error fetching admin orders:", err);
    }
  };

  useEffect(() => {
    fetchAdminOrders();
    window.addEventListener('storage', fetchAdminOrders);
    return () => window.removeEventListener('storage', fetchAdminOrders);
  }, []);

  const handleAdminConfirmOrder = async (order) => {
    await memberApi.updateSupplementOrderStatus(order.orderId, {
      status: 'Confirmed',
      note: 'Order confirmed by Admin'
    });

    try {
      const localOrders = JSON.parse(localStorage.getItem('apex_supplement_orders') || '[]');
      const idx = localOrders.findIndex(o => o.orderId === order.orderId || o.txId === order.txId);
      if (idx !== -1) {
        localOrders[idx].status = 'Confirmed';
        if (!localOrders[idx].statusTimeline) localOrders[idx].statusTimeline = [];
        localOrders[idx].statusTimeline.push({
          status: 'Confirmed',
          timestamp: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
          note: 'Order confirmed by Admin'
        });
        localStorage.setItem('apex_supplement_orders', JSON.stringify(localOrders));
        window.dispatchEvent(new Event('storage'));
      }
    } catch (e) {}

    await fetchAdminOrders();
    if (addActivity) {
      addActivity(`Admin confirmed supplement order <strong>${order.orderId}</strong> (${order.userName})`, 'green');
    }
    alert(`Order ${order.orderId} confirmed successfully!`);
  };

  const handleAdminSaveOrderStatus = async (e) => {
    e.preventDefault();
    if (!editingOrderModal) return;

    await memberApi.updateSupplementOrderStatus(editingOrderModal.orderId, {
      status: editStatus,
      courierName: editCourier,
      trackingNumber: editTracking,
      estimatedDelivery: editEstDelivery,
      note: editNote || `Status updated to ${editStatus} by Admin`
    });

    try {
      const localOrders = JSON.parse(localStorage.getItem('apex_supplement_orders') || '[]');
      const idx = localOrders.findIndex(o => o.orderId === editingOrderModal.orderId || o.txId === editingOrderModal.txId);
      if (idx !== -1) {
        localOrders[idx].status = editStatus;
        if (editCourier) localOrders[idx].courierName = editCourier;
        if (editTracking) localOrders[idx].trackingNumber = editTracking;
        if (editEstDelivery) localOrders[idx].estimatedDelivery = editEstDelivery;
        if (!localOrders[idx].statusTimeline) localOrders[idx].statusTimeline = [];
        localOrders[idx].statusTimeline.push({
          status: editStatus,
          timestamp: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
          note: editNote || `Status updated to ${editStatus} by Admin`
        });
        localStorage.setItem('apex_supplement_orders', JSON.stringify(localOrders));
        window.dispatchEvent(new Event('storage'));
      }
    } catch (e) {}

    await fetchAdminOrders();
    if (addActivity) {
      addActivity(`Admin updated order <strong>${editingOrderModal.orderId}</strong> status to ${editStatus}`, 'volt');
    }
    alert(`Order ${editingOrderModal.orderId} updated to ${editStatus}!`);
    setEditingOrderModal(null);
  };

  // Handle Notify Expiry
  const handleNotifyAlert = (idx, name) => {
    setExpiryAlerts((prev) =>
      prev.map((alert, i) => (i === idx ? { ...alert, notified: true } : alert))
    );
    addActivity(`Dispatched expiry alert reminder message to <strong>${name}</strong>`, 'orange');
  };

  // Run Chart.js initializations inside useEffect
  useEffect(() => {
    let growthChart, revChart, attChart;
    let statusReportChart, targetChart;

    const getGrowthData = () => {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const labels = [];
      const data = [];
      const now = new Date();
      
      const months = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({
          year: d.getFullYear(),
          month: d.getMonth(),
          label: monthNames[d.getMonth()]
        });
      }
      
      let baseOffset = 15;
      months.forEach((m, idx) => {
        labels.push(m.label);
        
        const dbCount = membersList.filter((member) => {
          if (!member.joinDate) return false;
          const jd = new Date(member.joinDate);
          const jdVal = jd.getFullYear() * 12 + jd.getMonth();
          const bucketVal = m.year * 12 + m.month;
          return jdVal <= bucketVal;
        }).length;
        
        data.push(baseOffset + (idx * 5) + dbCount);
      });
      
      return { labels, data };
    };

    const getRevenueData = () => {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const labels = [];
      const data = [];
      const now = new Date();
      
      const months = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({
          year: d.getFullYear(),
          month: d.getMonth(),
          label: monthNames[d.getMonth()]
        });
      }
      
      let baseRevenueOffset = 1800;
      months.forEach((m, idx) => {
        labels.push(m.label);
        
        const monthlySum = membersList.reduce((sum, member) => {
          if (!member.joinDate) return sum;
          const jd = new Date(member.joinDate);
          const jdVal = jd.getFullYear() * 12 + jd.getMonth();
          const bucketVal = m.year * 12 + m.month;
          
          if (jdVal <= bucketVal) {
            const priceVal = member.price ? parseFloat(member.price.replace(/[^0-9.]/g, '')) : 79.00;
            return sum + priceVal;
          }
          return sum;
        }, 0);
        
        data.push(baseRevenueOffset + (idx * 350) + monthlySum);
      });
      
      return { labels, data };
    };

    const getStatusReportData = () => {
      const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const now = new Date();
      const currentYear = now.getFullYear();
      
      const proData = [];
      const eliteData = [];
      const basicData = [];
      
      const basePro = [45, 52, 58, 62, 70, 78, 85, 92, 98, 105, 112, 120];
      const baseElite = [25, 29, 32, 38, 42, 48, 52, 58, 63, 68, 72, 78];
      const baseBasic = [65, 72, 78, 85, 90, 98, 104, 110, 116, 122, 128, 135];
      
      for (let m = 0; m < 12; m++) {
        const countByPlan = (planName) => {
          return membersList.filter((member) => {
            if (!member.joinDate) return false;
            const planMatches = member.plan && member.plan.toLowerCase() === planName.toLowerCase();
            if (!planMatches) return false;
            
            const jd = new Date(member.joinDate);
            const jdYear = jd.getFullYear();
            const jdMonth = jd.getMonth();
            
            if (jdYear < currentYear) return true;
            if (jdYear === currentYear && jdMonth <= m) return true;
            return false;
          }).length;
        };
        
        proData.push(basePro[m] + countByPlan('Pro Apex Tier'));
        eliteData.push(baseElite[m] + countByPlan('Elite Titan Tier'));
        basicData.push(baseBasic[m] + countByPlan('Basic Core Tier'));
      }
      
      return { labels, proData, eliteData, basicData };
    };

    // Helper to create neon gradient
    const createNeonGradient = (ctx, colorStart, colorEnd) => {
      const gradient = ctx.createLinearGradient(0, 0, 0, 180);
      gradient.addColorStop(0, colorStart);
      gradient.addColorStop(1, colorEnd);
      return gradient;
    };

    if (activeView === 'home') {
      // 1. Membership Status Report (Line Chart)
      if (statusReportCanvasRef.current) {
        const ctx = statusReportCanvasRef.current.getContext('2d');
        const grad1 = createNeonGradient(ctx, 'rgba(255, 94, 0, 0.18)', 'rgba(255, 94, 0, 0)');
        const grad2 = createNeonGradient(ctx, 'rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0)');
        const grad3 = createNeonGradient(ctx, 'rgba(16, 185, 129, 0.12)', 'rgba(16, 185, 129, 0)');

        const statusReportData = getStatusReportData();
        statusReportChart = new Chart(ctx, {
          type: 'line',
          data: {
            labels: statusReportData.labels,
            datasets: [
              {
                label: 'Gold (Pro)',
                data: statusReportData.proData,
                borderColor: '#FF5E00',
                borderWidth: 3,
                backgroundColor: grad1,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#FF5E00',
                pointRadius: 3,
                pointHoverRadius: 6
              },
              {
                label: 'Silver (Basic)',
                data: statusReportData.basicData,
                borderColor: '#E2E8F0',
                borderWidth: 2,
                backgroundColor: grad2,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#E2E8F0',
                pointRadius: 2,
                pointHoverRadius: 5
              },
              {
                label: 'VIP (Elite)',
                data: statusReportData.eliteData,
                borderColor: '#10B981',
                borderWidth: 3,
                backgroundColor: grad3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#10B981',
                pointRadius: 3,
                pointHoverRadius: 6
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: true,
                position: 'top',
                align: 'end',
                labels: { boxWidth: 8, boxHeight: 8, color: '#8E919F', padding: 15, font: { size: 10, weight: 600 } }
              }
            },
            scales: {
              x: { grid: { display: false }, ticks: { color: '#8E919F', font: { size: 9 } } },
              y: { grid: { color: 'rgba(255, 255, 255, 0.02)' }, ticks: { color: '#8E919F', font: { size: 9 } } }
            }
          }
        });
      }

      // 2. Membership Target (Semi-Doughnut)
      if (targetCanvasRef.current) {
        const ctx = targetCanvasRef.current.getContext('2d');
        targetChart = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: ['Achieved', 'Remaining'],
            datasets: [
              {
                data: [75.59, 24.41],
                backgroundColor: [
                  createNeonGradient(ctx, '#FF5E00', '#FFB200'),
                  'rgba(255, 255, 255, 0.03)'
                ],
                borderWidth: 0,
                cutout: '80%'
              }
            ]
          },
          options: {
            rotation: -90,
            circumference: 180,
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } }
          }
        });
      }
    }

    if (activeView === 'analytics') {
      // 1. Membership Growth
      if (growthCanvasRef.current) {
        const ctx = growthCanvasRef.current.getContext('2d');
        const gradient = createNeonGradient(ctx, 'rgba(255, 94, 0, 0.25)', 'rgba(255, 94, 0, 0)');
        const growthInfo = getGrowthData();
        growthChart = new Chart(ctx, {
          type: 'line',
          data: {
            labels: growthInfo.labels,
            datasets: [
              {
                label: 'Total Members',
                data: growthInfo.data,
                borderColor: '#FF5E00',
                borderWidth: 3,
                backgroundColor: gradient,
                fill: true,
                tension: 0.35,
                pointBackgroundColor: '#FF5E00',
                pointBorderColor: 'rgba(8, 8, 10, 0.8)',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: { grid: { display: false }, ticks: { color: '#9595a6' } },
              y: { grid: { color: 'rgba(255, 255, 255, 0.03)' }, ticks: { color: '#9595a6' } }
            }
          }
        });
      }

      // 2. Revenue Streams
      if (revCanvasRef.current) {
        const ctx = revCanvasRef.current.getContext('2d');
        const gradient = createNeonGradient(ctx, 'rgba(255, 94, 0, 0.3)', 'rgba(255, 94, 0, 0.02)');
        const revInfo = getRevenueData();
        revChart = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: revInfo.labels,
            datasets: [
              {
                label: 'Monthly Income',
                data: revInfo.data,
                backgroundColor: gradient,
                borderColor: '#FF5E00',
                borderWidth: 1.5,
                borderRadius: 4,
                hoverBackgroundColor: '#FF5E00',
                hoverBorderColor: '#ffffff'
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: { grid: { display: false }, ticks: { color: '#9595a6' } },
              y: { grid: { color: 'rgba(255, 255, 255, 0.03)' }, ticks: { color: '#9595a6' } }
            }
          }
        });
      }

      // 3. Attendance Peaks
      if (attCanvasRef.current) {
        const ctx = attCanvasRef.current.getContext('2d');
        const gradient = createNeonGradient(ctx, 'rgba(255, 94, 0, 0.25)', 'rgba(255, 94, 0, 0)');
        attChart = new Chart(ctx, {
          type: 'line',
          data: {
            labels: ['6am', '8am', '10am', '12pm', '2pm', '4pm', '6pm', '8pm', '10pm'],
            datasets: [
              {
                label: 'Athletes On-site',
                data: [35, 92, 70, 45, 60, 98, 134, 88, 30],
                borderColor: '#FF5E00',
                borderWidth: 3,
                backgroundColor: gradient,
                fill: true,
                tension: 0.35,
                pointBackgroundColor: '#FF5E00',
                pointBorderColor: 'rgba(8, 8, 10, 0.8)',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: { grid: { display: false }, ticks: { color: '#9595a6' } },
              y: { grid: { color: 'rgba(255, 255, 255, 0.03)' }, ticks: { color: '#9595a6' } }
            }
          }
        });
      }
    }

    return () => {
      if (statusReportChart) statusReportChart.destroy();
      if (targetChart) targetChart.destroy();
      if (growthChart) growthChart.destroy();
      if (revChart) revChart.destroy();
      if (attChart) attChart.destroy();
    };
  }, [activeView, membersList]);

  const fetchAdminAttendanceLogs = async () => {
    try {
      const data = await memberApi.getAdminAttendanceLogs();
      if (data && data.success) {
        if (Array.isArray(data.records)) setDailyAttendance(data.records);
        if (data.checkedInCount !== undefined) setCheckedInCount(data.checkedInCount);
        if (data.onFloorCount !== undefined) setOnFloorCount(data.onFloorCount);
      }
    } catch (e) {
      console.warn("Error fetching admin attendance logs:", e);
    }
  };

  useEffect(() => {
    if (activeView === 'attendance') {
      fetchAdminAttendanceLogs();
    }
  }, [activeView]);

  // Handle Mock RFID Gate Scan Simulation Submit
  const handleSimulateScanSubmit = async (e) => {
    e.preventDefault();

    const memberIds = {
      'Ethan Hunt': '#8092-PRO',
      'Luther Stickell': '#5021-REG',
      'Benji Dunn': '#4032-HIIT',
      'Ilsa Faust': '#1092-PRO',
      'William Brandt': '#6014-REG'
    };

    const code = memberIds[simMember] || '#0000-MOCK';
    const email = `${simMember.toLowerCase().replace(/\s+/g, '')}@apex.com`;

    if (simAction === 'check-in') {
      const res = await memberApi.checkIn({
        userEmail: email,
        memberName: simMember,
        scanMethod: 'RFID Turnstile Gate',
        code
      });

      if (res && res.success) {
        addActivity(`Member <strong>${simMember}</strong> checked in via RFID Card Scan`, 'volt');
        fetchAdminAttendanceLogs();
      } else {
        alert(res?.message || `${simMember} check-in failed.`);
      }
    } else {
      // Check-out
      const res = await memberApi.checkOut({
        userEmail: email,
        memberName: simMember
      });

      if (res && res.success) {
        addActivity(`Member <strong>${simMember}</strong> checked out via RFID Card Scan`, 'orange');
        fetchAdminAttendanceLogs();
      } else {
        alert(res?.message || `${simMember} check-out failed.`);
      }
    }
  };

  return (
    <div>
      {/* 1. ADMIN HOME VIEW */}
      {activeView === 'home' && (
        <div className="admin-sub-view" id="admin-subview-home" style={{ display: 'block' }}>
          
          {/* Row 1: Welcome Banner & Activity concentric bubbles */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.35fr 0.65fr', gap: '1.8rem', marginBottom: '1.8rem' }}>
            {/* Welcome Banner */}
            <div className="admin-welcome-banner">
              <div className="banner-content">
                <h2>Welcome Back, Ethan</h2>
                <p>Ready to set up your club's Loyalty Card?</p>
                <button type="button" onClick={() => alert("Launching Loyalty Card portal...")}>Setup</button>
              </div>
              <img className="banner-image" src="assets/images/about_athlete.png" alt="Athlete" onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=600&auto=format&fit=crop"; }} />
            </div>

            {/* Member Activity overlapping bubbles */}
            <div className="admin-activity-card">
              <h4>Member Activity</h4>
              <div className="admin-activity-circles-container">
                <div className="admin-activity-circle c1">50%<span>06:00-10:00</span></div>
                <div className="admin-activity-circle c2">25%<span>10:00-14:00</span></div>
                <div className="admin-activity-circle c3">17%<span>15:00-18:00</span></div>
                <div className="admin-activity-circle c4">8%<span>19:00-24:00</span></div>
              </div>
              <div className="admin-activity-legend">
                <div className="legend-item"><span className="legend-dot orange"></span>06:00-10:00</div>
                <div className="legend-item"><span className="legend-dot yellow"></span>10:00-14:00</div>
                <div className="legend-item"><span className="legend-dot green"></span>15:00-18:00</div>
                <div className="legend-item"><span className="legend-dot blue"></span>19:00-24:00</div>
              </div>
            </div>
          </div>

          {/* Row 2: Three Styled Metrics Cards with Sparklines */}
          <div className="admin-metrics-row">
            {/* Card 1: Total Members */}
            <div className="admin-metric-card-styled">
              <div className="card-header-styled">
                <h4>Total Members</h4>
                <div className="icon-wrapper">
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
              <div className="card-body-styled">
                <div>
                  <h3 className="value">{membersList.length}</h3>
                  <div className="trend-box">
                    <span className="trend-percentage">▲ +{membersList.length > 0 ? "100" : "0"}%</span>
                    <span className="trend-period">({membersList.length})</span>
                  </div>
                </div>
                {/* Sparkline SVG */}
                <div className="sparkline-container">
                  <svg width="100%" height="100%" viewBox="0 0 100 40">
                    <path d="M 0,35 Q 15,20 30,28 T 60,10 T 90,5 T 100,2" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Card 2: Current Members */}
            <div className="admin-metric-card-styled">
              <div className="card-header-styled">
                <h4>Current Members</h4>
                <div className="icon-wrapper">
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
              </div>
              <div className="card-body-styled">
                <div>
                  <h3 className="value">{onFloorCount}</h3>
                  <div className="trend-box">
                    <span className="trend-percentage">▲ +{onFloorCount > 0 ? "100" : "0"}%</span>
                    <span className="trend-period">({onFloorCount})</span>
                  </div>
                </div>
                {/* Sparkline SVG */}
                <div className="sparkline-container">
                  <svg width="100%" height="100%" viewBox="0 0 100 40">
                    <path d="M 0,32 Q 20,25 40,30 T 70,12 T 95,8 T 100,5" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Card 3: Today Visitor */}
            <div className="admin-metric-card-styled">
              <div className="card-header-styled">
                <h4>Today Visitor</h4>
                <div className="icon-wrapper">
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
              </div>
              <div className="card-body-styled">
                <div>
                  <h3 className="value">{dailyAttendance.length}</h3>
                  <div className="trend-box">
                    <span className="trend-percentage">▲ +{dailyAttendance.length > 0 ? "100" : "0"}%</span>
                    <span className="trend-period">({dailyAttendance.length})</span>
                  </div>
                </div>
                {/* Sparkline SVG */}
                <div className="sparkline-container">
                  <svg width="100%" height="100%" viewBox="0 0 100 40">
                    <path d="M 0,38 Q 25,30 50,35 T 75,20 T 90,15 T 100,12" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Row 3: Two Chart Cards (Membership Report & Membership Target Gauge) */}
          <div className="admin-charts-grid">
            {/* Membership Status Report (Line Chart) */}
            <div className="admin-chart-card">
              <h4>Membership Status Report</h4>
              <p className="card-subtitle">Detailed breakdown of membership tiers</p>
              <div className="chart-container" style={{ position: 'relative', height: '220px', width: '100%' }}>
                <canvas ref={statusReportCanvasRef} id="chart-membership-status-report"></canvas>
              </div>
            </div>

            {/* Membership Target (Semi-Doughnut) */}
            <div className="admin-chart-card">
              <h4>Membership Target</h4>
              <p className="card-subtitle">Gold tier goal progression</p>
              <div className="admin-gauge-container">
                <canvas ref={targetCanvasRef} id="chart-membership-target" width="160" height="100"></canvas>
                <div className="gauge-center-text">
                  <span className="percent">75.59%</span>
                  <span className="label">Gold Tier</span>
                </div>
              </div>
              <div className="admin-gauge-stats">
                <div className="stat-box">
                  <span className="title">Target</span>
                  <span className="val"><span className="bullet orange"></span>200</span>
                </div>
                <div className="stat-box">
                  <span className="title">Visitor</span>
                  <span className="val"><span className="bullet cyan"></span>250</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sleek divider for simulation controls */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', margin: '2.5rem 0 1.5rem 0' }}></div>

          {/* Facility Utilities & Logs (Ex-metrics grids elements kept at the bottom for functionality) */}
          <div className="db-bottom-grid" style={{ gridTemplateColumns: '1.25fr 0.75fr', marginTop: '1.8rem' }}>
            <div className="db-bottom-left">
              {/* Expiry alerts list */}
              <div className="db-card alert-card" style={{ height: '100%', minHeight: '300px' }}>
                <div className="card-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <div>
                    <h4 style={{ textTransform: 'uppercase', fontSize: '1.1rem', fontWeight: 800 }}>Membership Expiry Alerts</h4>
                    <p className="card-subtitle" style={{ margin: 0 }}>Members with passes expiring within 7 days</p>
                  </div>
                  <span className="badge badge-warning">{expiryAlerts.filter((a) => !a.notified).length} Alerts</span>
                </div>
                
                <div className="expiry-alerts-list" id="admin-expiry-alerts">
                  {expiryAlerts.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem', padding: '2rem 1.2rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                      No active membership expiry warnings.
                    </div>
                  ) : (
                    expiryAlerts.map((alert, idx) => (
                      <div key={idx} className={`expiry-alert-item ${alert.urgent ? 'urgent' : ''}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.9rem 1.2rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '6px', marginBottom: '0.8rem' }}>
                        <div className="alert-user-details">
                          <h5 style={{ fontWeight: 700, margin: 0 }}>{alert.name}</h5>
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>{alert.plan} • Expires in <strong style={{ color: alert.urgent ? '#ff3e6c' : '#ff9f00' }}>{alert.daysLeft} days</strong> ({alert.date})</p>
                        </div>
                        <button
                          className="alert-action-btn"
                          onClick={() => handleNotifyAlert(idx, alert.name)}
                          disabled={alert.notified}
                          style={{
                            background: alert.notified ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.03)',
                            borderColor: alert.notified ? 'rgba(255,255,255,0.03)' : 'var(--border-color)',
                            color: alert.notified ? '#5c5c6e' : 'var(--text-white)'
                          }}
                        >
                          {alert.notified ? 'Notified' : 'Notify'}
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="db-bottom-right">
              {/* Facility Activity Timeline */}
              <div className="db-card logs-card" style={{ height: '100%', minHeight: '300px' }}>
                <h4 style={{ textTransform: 'uppercase', fontSize: '1.1rem', fontWeight: 800 }}>Recent Activities</h4>
                <p className="card-subtitle">Real-time facility logs & staff activity feed</p>
                <div className="activities-timeline" id="admin-activities-timeline" style={{ maxHeight: '230px', overflowY: 'auto' }}>
                  {activities.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem', padding: '2rem 1.2rem' }}>
                      No facility activities logged today.
                    </div>
                  ) : (
                    activities.map((act, idx) => (
                      <div key={idx} className="timeline-item" style={{ animationDelay: `${idx * 0.08}s` }}>
                        <div className={`timeline-dot ${act.color}`}></div>
                        <div className="timeline-content">
                          <p dangerouslySetInnerHTML={{ __html: act.text }} style={{ margin: 0 }}></p>
                          <span>{act.time}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. ADMIN ANALYTICS (CHARTS) VIEW */}
      {activeView === 'analytics' && (
        <div className="admin-sub-view" id="admin-subview-analytics" style={{ display: 'block' }}>
          <div className="db-charts-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.8rem', marginBottom: '2.5rem' }}>
            <div className="db-card chart-card" style={{ padding: '1.8rem', minHeight: 'auto', display: 'flex', flexDirection: 'column' }}>
              <div className="chart-header">
                <h4 style={{ fontSize: '1.1rem', fontWeight: 800, textTransform: 'uppercase' }}>Membership Growth</h4>
                <p className="card-subtitle">Year-to-date registration volume</p>
              </div>
              <div className="chart-container" style={{ position: 'relative', height: '230px', width: '100%', marginTop: '1rem' }}>
                <canvas ref={growthCanvasRef} id="chart-membership-growth"></canvas>
              </div>
            </div>
            
            <div className="db-card chart-card" style={{ padding: '1.8rem', minHeight: 'auto', display: 'flex', flexDirection: 'column' }}>
              <div className="chart-header">
                <h4 style={{ fontSize: '1.1rem', fontWeight: 800, textTransform: 'uppercase' }}>Revenue Streams</h4>
                <p className="card-subtitle">Monthly transaction values in USD</p>
              </div>
              <div className="chart-container" style={{ position: 'relative', height: '230px', width: '100%', marginTop: '1rem' }}>
                <canvas ref={revCanvasRef} id="chart-revenue-streams"></canvas>
              </div>
            </div>

            <div className="db-card chart-card" style={{ padding: '1.8rem', minHeight: 'auto', display: 'flex', flexDirection: 'column' }}>
              <div className="chart-header">
                <h4 style={{ fontSize: '1.1rem', fontWeight: 800, textTransform: 'uppercase' }}>Attendance Peaks</h4>
                <p className="card-subtitle">Hourly gym floor headcount today</p>
              </div>
              <div className="chart-container" style={{ position: 'relative', height: '230px', width: '100%', marginTop: '1rem' }}>
                <canvas ref={attCanvasRef} id="chart-attendance-peaks"></canvas>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. ADMIN FINANCIAL ACCOUNTS & LEDGER VIEW */}
      {activeView === 'payments' && (
        <div className="admin-sub-view" id="admin-subview-payments" style={{ display: 'block' }}>
          
          {/* Header Banner */}
          <div className="db-card" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, rgba(20, 20, 28, 0.95) 0%, rgba(10, 10, 15, 0.95) 100%)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.5rem 1.8rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>💳</span>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.3rem', color: 'var(--text-white)', margin: 0, textTransform: 'uppercase' }}>
                    Club Financial Accounts & Revenue Ledger
                  </h3>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: '0.3rem 0 0 0' }}>
                  Real-time transaction tracking, Razorpay payment verification, tax invoices, and accounting records.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', background: 'rgba(0, 255, 102, 0.12)', color: '#00ff66', border: '1px solid rgba(0, 255, 102, 0.3)', padding: '0.35rem 0.8rem', borderRadius: '20px', fontWeight: 800 }}>
                  ● Razorpay Gateway Active
                </span>
                <button
                  type="button"
                  onClick={fetchFinancialAccounts}
                  className="outline-btn"
                  style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  ↻ Refresh Ledger
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const csvRows = [
                      ['Receipt ID', 'Member Name', 'Email', 'Category', 'Description', 'Amount (INR)', 'Payment ID', 'Order ID', 'Status', 'Date'],
                      ...((adminTransactions.length > 0 ? adminTransactions : payments).map((p) => [
                        p.receiptNumber || p.txId || '',
                        p.userName || p.name || '',
                        p.userEmail || '',
                        p.paymentType || 'membership',
                        p.title || p.plan || '',
                        p.amount || 0,
                        p.paymentId || '',
                        p.orderId || '',
                        p.status || 'paid',
                        p.createdAt ? new Date(p.createdAt).toLocaleDateString() : p.date || ''
                      ]))
                    ];
                    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map(e => e.join(',')).join('\n');
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement('a');
                    link.setAttribute('href', encodedUri);
                    link.setAttribute('download', `MuScLeHuB_Financial_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="glow-btn"
                  style={{ padding: '0.5rem 1.2rem', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer' }}
                >
                  📥 Export CSV
                </button>
              </div>
            </div>
          </div>

          {/* Financial KPI Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.2rem', marginBottom: '1.5rem' }}>
            <div className="db-card" style={{ padding: '1.4rem', borderLeft: '4px solid var(--accent-volt)' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Total Gross Revenue</span>
              <h3 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-white)', margin: '0.3rem 0 0 0' }}>
                ₹{((accountsSummary?.totalRevenue || 0) + payments.reduce((acc, p) => acc + (p.amount || 0), 0)).toLocaleString('en-IN')}
              </h3>
              <span style={{ fontSize: '0.72rem', color: '#10b981', marginTop: '0.2rem', display: 'block' }}>
                ✓ Verified collections across all portals
              </span>
            </div>

            <div className="db-card" style={{ padding: '1.4rem', borderLeft: '4px solid var(--accent-cyan)' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Membership Subscriptions</span>
              <h3 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-white)', margin: '0.3rem 0 0 0' }}>
                ₹{((accountsSummary?.membershipRevenue || 0) + payments.reduce((acc, p) => acc + (p.amount || 0), 0)).toLocaleString('en-IN')}
              </h3>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'block' }}>
                Keycard passes & renewals
              </span>
            </div>

            <div className="db-card" style={{ padding: '1.4rem', borderLeft: '4px solid #f59e0b' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Supplement Store Sales</span>
              <h3 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-white)', margin: '0.3rem 0 0 0' }}>
                ₹{(accountsSummary?.supplementRevenue || 0).toLocaleString('en-IN')}
              </h3>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'block' }}>
                Protein, Creatine & Stack orders
              </span>
            </div>

            <div className="db-card" style={{ padding: '1.4rem', borderLeft: '4px solid #8b5cf6' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Personal Coach Bookings</span>
              <h3 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-white)', margin: '0.3rem 0 0 0' }}>
                ₹{(accountsSummary?.trainerRevenue || 0).toLocaleString('en-IN')}
              </h3>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'block' }}>
                1-on-1 coaching mentorships
              </span>
            </div>
          </div>

          {/* Transaction Ledger Card */}
          <div className="db-card flex-card">
            {/* Filter and Search Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.2rem' }}>
              {/* Category Filter Tabs */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {[
                  { id: 'all', label: 'All Transactions' },
                  { id: 'membership', label: '🏷️ Memberships' },
                  { id: 'supplement_order', label: '💊 Supplements' },
                  { id: 'trainer_booking', label: '🏋️ Trainer Bookings' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setPaymentCategoryFilter(tab.id)}
                    style={{
                      padding: '0.45rem 0.9rem',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      borderRadius: '6px',
                      cursor: 'pointer',
                      background: paymentCategoryFilter === tab.id ? 'var(--accent-volt)' : 'var(--bg-card-hover, rgba(128,128,128,0.06))',
                      color: paymentCategoryFilter === tab.id ? '#000' : 'var(--text-muted)',
                      border: '1px solid',
                      borderColor: paymentCategoryFilter === tab.id ? 'var(--accent-volt)' : 'var(--border-color)',
                      transition: 'all 0.2s'
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div style={{ minWidth: '240px' }}>
                <input
                  type="text"
                  placeholder="Search receipt #, member, or ID..."
                  value={paymentSearchQuery}
                  onChange={(e) => setPaymentSearchQuery(e.target.value)}
                  className="form-input"
                  style={{ padding: '0.5rem 0.8rem', fontSize: '0.8rem', background: 'var(--bg-black)' }}
                />
              </div>
            </div>
            
            {/* Table */}
            <div className="table-wrapper">
              <table className="db-table" id="admin-payments-table">
                <thead>
                  <tr>
                    <th>Receipt No.</th>
                    <th>Member / Client</th>
                    <th>Category & Item</th>
                    <th>Gateway Ref (Razorpay)</th>
                    <th>Amount (INR)</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Invoice</th>
                  </tr>
                </thead>
                <tbody id="admin-payments-body">
                  {(() => {
                    // Combine MongoDB transactions with fallback payment records
                    const combined = [
                      ...adminTransactions,
                      ...payments.map(p => ({
                        receiptNumber: p.txId,
                        orderId: 'ORD-PRO-TIER',
                        paymentId: p.txId,
                        userName: p.name,
                        userEmail: 'member@apex.com',
                        paymentType: 'membership',
                        title: p.plan,
                        amount: p.amount,
                        status: p.status || 'paid',
                        paymentMethod: 'Razorpay / Gateway',
                        createdAt: p.date === 'Today' ? new Date().toISOString() : new Date().toISOString()
                      }))
                    ];

                    const filtered = combined.filter((item) => {
                      // Filter by category
                      if (paymentCategoryFilter !== 'all' && item.paymentType !== paymentCategoryFilter) {
                        return false;
                      }
                      // Filter by search query
                      if (paymentSearchQuery.trim()) {
                        const q = paymentSearchQuery.toLowerCase();
                        const rNo = (item.receiptNumber || item.txId || '').toLowerCase();
                        const uName = (item.userName || item.name || '').toLowerCase();
                        const uEmail = (item.userEmail || '').toLowerCase();
                        const pId = (item.paymentId || '').toLowerCase();
                        const tTitle = (item.title || item.plan || '').toLowerCase();
                        return rNo.includes(q) || uName.includes(q) || uEmail.includes(q) || pId.includes(q) || tTitle.includes(q);
                      }
                      return true;
                    });

                    if (filtered.length === 0) {
                      return (
                        <tr>
                          <td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem', padding: '2.5rem 1.2rem' }}>
                            {isAccountsLoading ? 'Loading financial ledger from database...' : 'No payment transactions matching your filter criteria.'}
                          </td>
                        </tr>
                      );
                    }

                    return filtered.map((pay, idx) => (
                      <tr key={pay.receiptNumber || pay.paymentId || idx}>
                        <td style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--accent-cyan)', fontSize: '0.85rem' }}>
                          {pay.receiptNumber || pay.txId || `MH-RCP-${idx + 1000}`}
                        </td>
                        <td>
                          <strong style={{ color: 'var(--text-white)' }}>{pay.userName || pay.name}</strong>
                          {pay.userEmail && (
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>{pay.userEmail}</span>
                          )}
                        </td>
                        <td>
                          <span style={{
                            display: 'inline-block',
                            fontSize: '0.65rem',
                            textTransform: 'uppercase',
                            fontWeight: 800,
                            padding: '0.15rem 0.5rem',
                            borderRadius: '4px',
                            background: pay.paymentType === 'membership' ? 'rgba(0, 112, 243, 0.1)' : pay.paymentType === 'supplement_order' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(139, 92, 246, 0.1)',
                            color: pay.paymentType === 'membership' ? 'var(--accent-cyan)' : pay.paymentType === 'supplement_order' ? '#f59e0b' : '#8b5cf6',
                            marginBottom: '0.2rem'
                          }}>
                            {pay.paymentType === 'membership' ? 'Membership' : pay.paymentType === 'supplement_order' ? 'Supplement' : pay.paymentType === 'trainer_booking' ? 'Coach Hire' : 'General'}
                          </span>
                          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-white)' }}>
                            {pay.title || pay.plan || 'Club Service Fee'}
                          </div>
                        </td>
                        <td>
                          <code style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {pay.paymentId || 'pay_test_online'}
                          </code>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', display: 'block' }}>
                            {pay.paymentMethod || 'Razorpay Online'}
                          </span>
                        </td>
                        <td>
                          <strong style={{ color: 'var(--text-white)', fontSize: '0.95rem' }}>
                            ₹{Number(pay.amount || 0).toLocaleString('en-IN')}
                          </strong>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>
                            (Incl. 18% GST)
                          </span>
                        </td>
                        <td>
                          <span className="status-badge paid" style={{ fontSize: '0.68rem', padding: '0.2rem 0.6rem' }}>
                            {pay.status ? pay.status.toUpperCase() : 'PAID'} ✓
                          </span>
                        </td>
                        <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {pay.createdAt ? new Date(pay.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : (pay.date || 'Today')}
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveAdminReceipt({
                                receiptNumber: pay.receiptNumber || pay.txId || 'MH-RCP-ADMIN',
                                orderId: pay.orderId || 'ORD-VERIFIED',
                                paymentId: pay.paymentId || 'PAY-VERIFIED',
                                title: pay.title || pay.plan || 'MuScLe HuB Transaction',
                                amount: pay.amount,
                                userName: pay.userName || pay.name || 'Athlete Member',
                                userEmail: pay.userEmail || 'athlete@apex.club',
                                userPhone: pay.userPhone || '+91 98765 43210',
                                paymentMethod: pay.paymentMethod || 'Razorpay Gateway',
                                paymentType: pay.paymentType || 'membership',
                                createdAt: pay.createdAt || new Date().toISOString(),
                                items: pay.items && pay.items.length > 0 ? pay.items : [{ name: pay.title || pay.plan || 'Gym Service', qty: 1, unitPrice: pay.amount, total: pay.amount }]
                              });
                            }}
                            className="outline-btn"
                            style={{ padding: '0.35rem 0.8rem', fontSize: '0.72rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                          >
                            <span>📄</span> Tax Invoice
                          </button>
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3.5 ADMIN SUPPLEMENT ORDERS MANAGEMENT VIEW */}
      {(activeView === 'orders' || activeView === 'supplement-orders') && (
        <div className="admin-sub-view" id="admin-subview-orders" style={{ display: 'block' }}>
          {/* Header Banner */}
          <div className="db-card" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, rgba(20, 20, 28, 0.95) 0%, rgba(10, 10, 15, 0.95) 100%)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.5rem 1.8rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>🛒</span>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.3rem', color: 'var(--text-white)', margin: 0, textTransform: 'uppercase' }}>
                    Supplement Orders & Fulfillment Management
                  </h3>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: '0.3rem 0 0 0' }}>
                  Review member purchases, confirm pending orders, assign courier tracking numbers, and update delivery status.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.8rem' }}>
                <button
                  type="button"
                  className="glow-btn"
                  onClick={fetchAdminOrders}
                  style={{ padding: '0.5rem 1.1rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  🔄 Refresh Orders
                </button>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Orders</span>
              <h4 style={{ color: 'var(--text-white)', margin: '0.3rem 0 0 0', fontWeight: 800, fontSize: '1.25rem' }}>{adminOrders.length}</h4>
            </div>

            <div style={{ background: 'rgba(255, 159, 0, 0.08)', border: '1px solid rgba(255, 159, 0, 0.3)', borderRadius: '8px', padding: '1rem', boxShadow: '0 0 15px rgba(255, 159, 0, 0.1)' }}>
              <span style={{ fontSize: '0.72rem', color: '#ff9f00', textTransform: 'uppercase', fontWeight: 700 }}>Pending Confirmation ⚡</span>
              <h4 style={{ color: '#ff9f00', margin: '0.3rem 0 0 0', fontWeight: 800, fontSize: '1.3rem' }}>
                {adminOrders.filter(o => o.status === 'Pending Confirmation').length}
              </h4>
            </div>

            <div style={{ background: 'rgba(0, 240, 255, 0.05)', border: '1px solid rgba(0, 240, 255, 0.2)', borderRadius: '8px', padding: '1rem' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', textTransform: 'uppercase' }}>Confirmed & In-Transit</span>
              <h4 style={{ color: 'var(--accent-cyan)', margin: '0.3rem 0 0 0', fontWeight: 800, fontSize: '1.25rem' }}>
                {adminOrders.filter(o => ['Confirmed', 'Processing', 'Out for Delivery'].includes(o.status)).length}
              </h4>
            </div>

            <div style={{ background: 'rgba(0, 255, 102, 0.05)', border: '1px solid rgba(0, 255, 102, 0.2)', borderRadius: '8px', padding: '1rem' }}>
              <span style={{ fontSize: '0.72rem', color: '#00ff66', textTransform: 'uppercase' }}>Delivered</span>
              <h4 style={{ color: '#00ff66', margin: '0.3rem 0 0 0', fontWeight: 800, fontSize: '1.25rem' }}>
                {adminOrders.filter(o => o.status === 'Delivered').length}
              </h4>
            </div>
          </div>

          {/* Filter Chips and Search Bar */}
          <div className="store-filter-bar" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div className="filter-categories">
              {['All', 'Pending Confirmation', 'Confirmed', 'Processing', 'Out for Delivery', 'Delivered', 'Cancelled'].map((st) => (
                <button
                  key={st}
                  className={`filter-chip ${adminOrderFilter === st ? 'active' : ''}`}
                  onClick={() => setAdminOrderFilter(st)}
                  style={{ fontSize: '0.75rem', padding: '0.35rem 0.8rem' }}
                >
                  {st}
                </button>
              ))}
            </div>

            <input
              type="text"
              className="form-input"
              placeholder="Search Order ID, Member Name, Email..."
              value={adminOrderSearch}
              onChange={(e) => setAdminOrderSearch(e.target.value)}
              style={{ width: '250px', padding: '0.45rem 0.8rem', fontSize: '0.78rem' }}
            />
          </div>

          {/* Orders Management Table */}
          <div className="db-card flex-card">
            <div className="table-wrapper">
              <table className="db-table">
                <thead>
                  <tr>
                    <th>Order ID / TxID</th>
                    <th>Customer Member</th>
                    <th>Items Summary</th>
                    <th>Billed Total</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const filtered = adminOrders.filter((o) => {
                      const matchesFilter = adminOrderFilter === 'All' || o.status === adminOrderFilter;
                      const q = adminOrderSearch.toLowerCase();
                      const matchesSearch = !q ||
                        (o.orderId && o.orderId.toLowerCase().includes(q)) ||
                        (o.txId && o.txId.toLowerCase().includes(q)) ||
                        (o.userName && o.userName.toLowerCase().includes(q)) ||
                        (o.userEmail && o.userEmail.toLowerCase().includes(q)) ||
                        (o.itemsSummary && o.itemsSummary.toLowerCase().includes(q));
                      return matchesFilter && matchesSearch;
                    });

                    if (filtered.length === 0) {
                      return (
                        <tr>
                          <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '2.5rem', fontSize: '0.85rem' }}>
                            No supplement orders found matching criteria.
                          </td>
                        </tr>
                      );
                    }

                    return filtered.map((order) => {
                      const isPending = order.status === 'Pending Confirmation';
                      const isCancelled = order.status === 'Cancelled';

                      return (
                        <tr key={order.orderId || order.txId}>
                          <td>
                            <strong style={{ fontFamily: 'monospace', color: 'var(--accent-cyan)', display: 'block' }}>{order.orderId}</strong>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>Tx: {order.txId}</span>
                          </td>
                          <td>
                            <strong style={{ color: 'var(--text-white)', display: 'block' }}>{order.userName || 'Member'}</strong>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{order.userEmail}</span>
                          </td>
                          <td style={{ maxWidth: '200px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            {order.itemsSummary}
                          </td>
                          <td>
                            <strong style={{ color: 'var(--accent-volt)', fontSize: '0.9rem' }}>₹{Number(order.total || order.totalAmount || 0).toFixed(2)}</strong>
                            <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', display: 'block', textTransform: 'uppercase' }}>{order.paymentMethod || 'card'}</span>
                          </td>
                          <td style={{ fontSize: '0.78rem' }}>{order.date}</td>
                          <td>
                            <span style={{
                              padding: '0.25rem 0.6rem',
                              borderRadius: '12px',
                              fontWeight: 800,
                              fontSize: '0.68rem',
                              textTransform: 'uppercase',
                              background: isCancelled
                                ? 'rgba(255, 62, 108, 0.15)'
                                : order.status === 'Delivered'
                                ? 'rgba(0, 255, 102, 0.15)'
                                : isPending
                                ? 'rgba(255, 159, 0, 0.15)'
                                : 'rgba(0, 240, 255, 0.15)',
                              color: isCancelled
                                ? '#ff3e6c'
                                : order.status === 'Delivered'
                                ? '#00ff66'
                                : isPending
                                ? '#ff9f00'
                                : 'var(--accent-cyan)',
                              border: `1px solid ${
                                isCancelled
                                  ? '#ff3e6c'
                                  : order.status === 'Delivered'
                                  ? '#00ff66'
                                  : isPending
                                  ? '#ff9f00'
                                  : 'var(--accent-cyan)'
                              }`
                            }}>
                              {order.status}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                              {isPending && (
                                <button
                                  type="button"
                                  className="glow-btn"
                                  onClick={() => handleAdminConfirmOrder(order)}
                                  style={{ padding: '0.25rem 0.6rem', fontSize: '0.7rem', background: '#00ff66', color: '#000', fontWeight: 800, border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                >
                                  ✓ Confirm Order
                                </button>
                              )}

                              <button
                                type="button"
                                className="outline-btn"
                                onClick={() => {
                                  setEditingOrderModal(order);
                                  setEditStatus(order.status || 'Confirmed');
                                  setEditCourier(order.courierName || 'Apex Express Logistics');
                                  setEditTracking(order.trackingNumber || '');
                                  setEditEstDelivery(order.estimatedDelivery || '2-3 Business Days');
                                  setEditNote('');
                                }}
                                style={{ padding: '0.25rem 0.6rem', fontSize: '0.7rem', color: 'var(--accent-volt)', borderColor: 'rgba(198, 255, 0, 0.4)' }}
                              >
                                ⚙ Update Status
                              </button>

                              <button
                                type="button"
                                className="outline-btn"
                                onClick={() => setSelectedAdminOrder(order)}
                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}
                              >
                                🔍 Details
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </div>

          {/* EDIT STATUS & COURIER MODAL */}
          {editingOrderModal && (
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.88)', zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="db-card" style={{ maxWidth: '540px', width: '90%', background: 'var(--bg-card)', border: '1px solid var(--accent-volt)', borderRadius: '10px', padding: '1.8rem', position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setEditingOrderModal(null)}
                  style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}
                >
                  &times;
                </button>

                <h4 style={{ color: 'var(--text-white)', margin: '0 0 0.3rem 0', fontSize: '1.15rem', fontWeight: 800 }}>
                  Update Order Fulfillment Status
                </h4>
                <p style={{ color: 'var(--accent-cyan)', fontFamily: 'monospace', fontSize: '0.8rem', margin: '0 0 1.2rem 0' }}>
                  {editingOrderModal.orderId} — Customer: {editingOrderModal.userName}
                </p>

                <form onSubmit={handleAdminSaveOrderStatus} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-white)', display: 'block', marginBottom: '0.3rem', fontWeight: 700 }}>
                      Order Status *
                    </label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="form-input"
                      style={{ background: 'var(--bg-black)', border: '1px solid var(--border-color)', color: '#fff', width: '100%', padding: '0.6rem' }}
                    >
                      <option value="Pending Confirmation">Pending Confirmation</option>
                      <option value="Confirmed">Confirmed (Order Approved)</option>
                      <option value="Processing">Processing (Packing Parcel)</option>
                      <option value="Out for Delivery">Out for Delivery (Dispatched to Courier)</option>
                      <option value="Delivered">Delivered (Handed to Customer)</option>
                      <option value="Cancelled">Cancelled / Refunded</option>
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-white)', display: 'block', marginBottom: '0.3rem', fontWeight: 700 }}>
                        Courier Logistics Name
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        value={editCourier}
                        onChange={(e) => setEditCourier(e.target.value)}
                        placeholder="e.g. Apex Express, BlueDart, FedEx"
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-white)', display: 'block', marginBottom: '0.3rem', fontWeight: 700 }}>
                        Tracking Number
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        value={editTracking}
                        onChange={(e) => setEditTracking(e.target.value)}
                        placeholder="e.g. APX-98214-IN"
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-white)', display: 'block', marginBottom: '0.3rem', fontWeight: 700 }}>
                      Estimated Delivery Window
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={editEstDelivery}
                      onChange={(e) => setEditEstDelivery(e.target.value)}
                      placeholder="e.g. 2-3 Business Days or Tomorrow 4 PM"
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-white)', display: 'block', marginBottom: '0.3rem', fontWeight: 700 }}>
                      Admin Audit Note (Visible in User Status Timeline)
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={editNote}
                      onChange={(e) => setEditNote(e.target.value)}
                      placeholder="e.g. Verified payment & packed with fragile bubble wrap"
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem', marginTop: '0.5rem' }}>
                    <button
                      type="button"
                      className="outline-btn"
                      onClick={() => setEditingOrderModal(null)}
                      style={{ padding: '0.6rem 1.2rem', fontSize: '0.8rem' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="glow-btn"
                      style={{ padding: '0.6rem 1.5rem', fontSize: '0.8rem' }}
                    >
                      Save Status Update ✓
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ADMIN ORDER FULL DETAILS MODAL */}
          {selectedAdminOrder && (
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.88)', zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="db-card" style={{ maxWidth: '600px', width: '90%', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '1.8rem', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
                <button
                  type="button"
                  onClick={() => setSelectedAdminOrder(null)}
                  style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}
                >
                  &times;
                </button>

                <h4 style={{ color: 'var(--text-white)', margin: '0 0 0.3rem 0', fontSize: '1.2rem', fontWeight: 800 }}>
                  Order Detailed Inspection
                </h4>
                <p style={{ color: 'var(--accent-cyan)', fontFamily: 'monospace', fontSize: '0.82rem', margin: '0 0 1.2rem 0' }}>
                  {selectedAdminOrder.orderId} (Tx: {selectedAdminOrder.txId})
                </p>

                {/* Customer & Shipping Summary */}
                <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.9rem', marginBottom: '1rem', fontSize: '0.8rem' }}>
                  <strong style={{ color: 'var(--accent-volt)', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Customer & Delivery Info:</strong>
                  <div style={{ color: 'var(--text-white)' }}><strong>{selectedAdminOrder.userName}</strong> ({selectedAdminOrder.userPhone || 'N/A'}) — {selectedAdminOrder.userEmail}</div>
                  {selectedAdminOrder.shippingInfo && (
                    <div style={{ color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                      Address: {selectedAdminOrder.shippingInfo.address}, {selectedAdminOrder.shippingInfo.city}, {selectedAdminOrder.shippingInfo.state} - {selectedAdminOrder.shippingInfo.pincode}
                    </div>
                  )}
                </div>

                {/* Items List */}
                <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.9rem', marginBottom: '1rem' }}>
                  <strong style={{ color: 'var(--accent-cyan)', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Purchased Items List:</strong>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {selectedAdminOrder.items && selectedAdminOrder.items.length > 0 ? (
                      selectedAdminOrder.items.map((item, iIdx) => (
                        <div key={iIdx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                          <span style={{ color: 'var(--text-white)' }}>{item.quantity}x {item.name}</span>
                          <span style={{ color: 'var(--accent-volt)', fontWeight: 700 }}>₹{(Number(item.price) * Number(item.quantity)).toFixed(2)}</span>
                        </div>
                      ))
                    ) : (
                      <span style={{ color: 'var(--text-white)', fontSize: '0.8rem' }}>{selectedAdminOrder.itemsSummary}</span>
                    )}
                  </div>
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: '0.5rem', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontWeight: 800, color: 'var(--accent-volt)', fontSize: '0.9rem' }}>
                    <span>Billed Total</span>
                    <span>₹{Number(selectedAdminOrder.total || selectedAdminOrder.totalAmount || 0).toFixed(2)}</span>
                  </div>
                </div>

                {/* Status Timeline */}
                <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.9rem', marginBottom: '1.2rem' }}>
                  <strong style={{ color: 'var(--text-white)', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Status History Timeline:</strong>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto' }}>
                    {(selectedAdminOrder.statusTimeline || []).map((tl, tIdx) => (
                      <div key={tIdx} style={{ fontSize: '0.75rem', borderLeft: '2px solid var(--accent-cyan)', paddingLeft: '0.6rem' }}>
                        <span style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>{tl.status}</span> <span style={{ color: 'var(--text-dim)', fontSize: '0.68rem' }}>({tl.timestamp})</span>
                        <div style={{ color: 'var(--text-muted)' }}>{tl.note}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  className="outline-btn"
                  onClick={() => setSelectedAdminOrder(null)}
                  style={{ width: '100%', padding: '0.6rem' }}
                >
                  Close Inspection
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. ADMIN GYM FLOOR MACHINE DIAGNOSTICS VIEW */}
      {activeView === 'equipment' && (
        <div className="admin-sub-view" id="admin-subview-equipment" style={{ display: 'block' }}>
          <div className="db-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
              <div>
                <h4 style={{ textTransform: 'uppercase', fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>Gym Floor Machine Diagnostics</h4>
                <p className="card-subtitle" style={{ margin: 0 }}>Real-time status metrics and service records for MuScLe HuB floor gear</p>
              </div>
              <button
                onClick={() => setIsAddEquipmentOpen(true)}
                style={{
                  background: 'var(--accent-volt)',
                  color: '#000',
                  border: 'none',
                  padding: '0.65rem 1.3rem',
                  borderRadius: '6px',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  boxShadow: '0 0 15px rgba(198, 255, 0, 0.3)',
                  transition: 'transform 0.2s'
                }}
              >
                <span style={{ fontSize: '1.2rem', lineHeight: 1, fontWeight: 900 }}>+</span> Add Equipment
              </button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginTop: '1rem' }}>
              {equipmentList.map((item) => (
                <div key={item.id} className="equipment-card" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                  <div style={{ height: '140px', background: '#0a0a0f', borderBottom: '1px solid var(--border-color)', overflow: 'hidden', position: 'relative' }}>
                    <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.src = 'assets/images/gallery_weights.png'; }} />
                    <button
                      onClick={() => handleDeleteEquipmentCard(item.id, item.name)}
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        background: 'rgba(255, 40, 40, 0.85)',
                        border: 'none',
                        color: '#fff',
                        borderRadius: '4px',
                        padding: '0.2rem 0.5rem',
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                      title="Delete Equipment"
                    >
                      🗑️ Remove
                    </button>
                  </div>
                  <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.8rem', flexGrow: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h5 style={{ color: 'var(--text-white)', fontWeight: 700, margin: 0 }}>{item.name}</h5>
                      <span style={{ fontSize: '0.72rem', color: 'var(--accent-volt)', fontWeight: 800, background: 'rgba(198,255,0,0.08)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>{item.status}</span>
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', margin: 0 }}>{item.subtitle}</p>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem', marginTop: 'auto' }}>
                      <button className="outline-btn" style={{ padding: '0.3rem 0.6rem', fontSize: '0.7rem' }} onClick={() => {
                        setSelectedEquipment(item);
                        setModalViewMode('photo');
                      }}>Details</button>
                      <button className="outline-btn" style={{ padding: '0.3rem 0.6rem', fontSize: '0.7rem' }} onClick={() => alert(`${item.name} diagnostics test run successfully!`)}>Test</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. ADMIN MASTER ATTENDANCE CONTROL VIEW */}
      {activeView === 'attendance' && (
        <div className="admin-sub-view" id="admin-subview-attendance" style={{ display: 'block' }}>
          <div className="db-card flex-card" style={{ marginBottom: '1.5rem', minHeight: 'auto' }}>
            <h4 style={{ textTransform: 'uppercase', fontSize: '1.2rem', fontWeight: 800 }}>Master Attendance Management</h4>
            <p className="card-subtitle">Monitor real-time gym floor logins, daily reports, monthly reports, and verify RFID turnstile parameters</p>
            
            {/* mini stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.2rem', marginTop: '1.2rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', padding: '1rem', borderRadius: '6px' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Checked-In Today</span>
                <h3 style={{ color: 'var(--accent-volt)', fontSize: '1.5rem', fontWeight: 800, marginTop: '0.2rem', margin: 0 }} id="admin-att-stat-total">
                  {checkedInCount}
                </h3>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', padding: '1rem', borderRadius: '6px' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>On Gym Floor Now</span>
                <h3 style={{ color: 'var(--accent-cyan)', fontSize: '1.5rem', fontWeight: 800, marginTop: '0.2rem', margin: 0 }} id="admin-att-stat-active">
                  {onFloorCount}
                </h3>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', padding: '1rem', borderRadius: '6px' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Monthly Stay Average</span>
                <h3 style={{ color: '#ff9f00', fontSize: '1.5rem', fontWeight: 800, marginTop: '0.2rem', margin: 0 }}>1h 42m</h3>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', padding: '1rem', borderRadius: '6px' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Average Attendance Rate</span>
                <h3 style={{ color: '#a855f7', fontSize: '1.5rem', fontWeight: 800, marginTop: '0.2rem', margin: 0 }} id="admin-att-stat-rate">84.2%</h3>
              </div>
            </div>
          </div>

          <div className="db-grid-row" style={{ gridTemplateColumns: '0.8fr 1.2fr', gap: '1.5rem' }}>
            {/* Simulation scan form */}
            <div className="db-card flex-card" style={{ height: '100%' }}>
              <h4 style={{ textTransform: 'uppercase', fontSize: '1rem', fontWeight: 800 }}>Mock RFID Check-in Terminal</h4>
              <p className="card-subtitle">Simulate members scanning their RFID card at the turnstiles to test dashboard reactions</p>
              
              <form onSubmit={handleSimulateScanSubmit} id="admin-attendance-sim-form" style={{ marginTop: '1.2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="sim-member-select">Select Gym Member</label>
                  <select
                    id="sim-member-select"
                    className="form-input"
                    value={simMember}
                    onChange={(e) => setSimMember(e.target.value)}
                    style={{ background: 'var(--bg-black)', border: '1px solid var(--border-color)', color: 'var(--text-white)' }}
                  >
                    <option value="Ethan Hunt">Ethan Hunt (ID: #8092-PRO)</option>
                    <option value="Luther Stickell">Luther Stickell (ID: #5021-REG)</option>
                    <option value="Benji Dunn">Benji Dunn (ID: #4032-HIIT)</option>
                    <option value="Ilsa Faust">Ilsa Faust (ID: #1092-PRO)</option>
                    <option value="William Brandt">William Brandt (ID: #6014-REG)</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label" htmlFor="sim-member-action">Simulate Action</label>
                  <select
                    id="sim-member-action"
                    className="form-input"
                    value={simAction}
                    onChange={(e) => setSimAction(e.target.value)}
                    style={{ background: 'var(--bg-black)', border: '1px solid var(--border-color)', color: 'var(--text-white)' }}
                  >
                    <option value="check-in">RFID Card Check-In</option>
                    <option value="check-out">RFID Card Check-Out</option>
                  </select>
                </div>
                
                <button type="submit" className="glow-btn" style={{ padding: '0.75rem', fontSize: '0.85rem', marginTop: '0.5rem', width: '100%' }}>
                  Trigger Simulated Scan
                </button>
              </form>
            </div>

            {/* Reports tables (Daily/Monthly) */}
            <div className="db-card flex-card" style={{ height: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                <h4 id="attendance-report-title" style={{ margin: 0, fontSize: '1rem', textTransform: 'uppercase', fontWeight: 800 }}>
                  {attReportType === 'daily' ? 'Daily Attendance Report' : 'Monthly Attendance Report'}
                </h4>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className={`outline-btn ${attReportType === 'daily' ? 'active' : ''}`}
                    onClick={() => setAttReportType('daily')}
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
                  >
                    Daily
                  </button>
                  <button
                    type="button"
                    className={`outline-btn ${attReportType === 'monthly' ? 'active' : ''}`}
                    onClick={() => setAttReportType('monthly')}
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
                  >
                    Monthly
                  </button>
                </div>
              </div>

              {attReportType === 'daily' ? (
                <div id="report-daily-container" style={{ display: 'block' }}>
                  <div className="table-wrapper" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                    <table className="db-table">
                      <thead>
                        <tr>
                          <th>Member</th>
                          <th>ID Code</th>
                          <th>Check-in</th>
                          <th>Check-out</th>
                          <th>Stay Duration</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody id="admin-daily-att-body">
                        {dailyAttendance.length === 0 ? (
                          <tr>
                            <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem', padding: '2rem 1.2rem' }}>
                              No visits logged for today.
                            </td>
                          </tr>
                        ) : (
                          dailyAttendance.map((item, idx) => (
                            <tr key={idx}>
                              <td><strong>{item.memberName || item.name}</strong></td>
                              <td style={{ fontFamily: 'monospace' }}>{item.code || item.id}</td>
                              <td>{item.inTime || item.time}</td>
                              <td>{item.outTime || '--'}</td>
                              <td>{item.hoursLogged || item.duration || '--'}</td>
                              <td>
                                <span className={`status-badge ${item.status === 'Active' || item.status === 'active' ? 'pending' : 'paid'}`}>
                                  {item.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div id="report-monthly-container" style={{ display: 'block' }}>
                  <div className="table-wrapper" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                    <table className="db-table">
                      <thead>
                        <tr>
                          <th>Member</th>
                          <th>Total Visits</th>
                          <th>Average Stay</th>
                          <th>Frequency</th>
                          <th>Attendance Rate</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody id="admin-monthly-att-body">
                        {monthlyAttendance.length === 0 ? (
                          <tr>
                            <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem', padding: '2rem 1.2rem' }}>
                              No monthly attendance reports accumulated.
                            </td>
                          </tr>
                        ) : (
                          monthlyAttendance.map((item, idx) => (
                            <tr key={idx}>
                              <td><strong>{item.name}</strong></td>
                              <td>{item.visits} visits</td>
                              <td>{item.avgStay}</td>
                              <td>{item.freq}</td>
                              <td style={{ color: 'var(--accent-volt)', fontWeight: 'bold' }}>{item.rate}</td>
                              <td>
                                <span className="status-badge paid">
                                  {item.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
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
          background: 'rgba(5, 5, 8, 0.75)',
          backdropFilter: 'blur(8px)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        onClick={(e) => { if (e.target === e.currentTarget) setSelectedEquipment(null); }}
        >
          <div style={{
            background: 'var(--bg-card)',
            color: 'var(--text-white)',
            border: '1px solid var(--border-color)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.25)',
            borderRadius: '16px',
            width: '90%',
            maxWidth: '580px',
            padding: '2rem',
            position: 'relative',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <button
              onClick={() => setSelectedEquipment(null)}
              style={{
                position: 'absolute',
                top: '1.2rem',
                right: '1.2rem',
                background: 'rgba(128, 128, 128, 0.1)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-muted)',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.3rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                lineHeight: 1
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#ff3e6c';
                e.currentTarget.style.background = 'rgba(255, 62, 108, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-muted)';
                e.currentTarget.style.background = 'rgba(128, 128, 128, 0.1)';
              }}
            >
              &times;
            </button>

            <h3 style={{ textTransform: 'uppercase', fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--text-white)', margin: '0 0 0.5rem 0', fontSize: '1.4rem', letterSpacing: '0.02em' }}>
              {selectedEquipment.name}
            </h3>
            <p style={{ color: 'var(--text-muted)', margin: '0 0 1.5rem 0', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Status: <span style={{ color: 'var(--accent-volt)', fontWeight: 'bold' }}>{selectedEquipment.status}</span>
            </p>

            {/* TAB BUTTONS (2 Buttons: Photo and Diagnostics) */}
            <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <button
                className={`glow-btn`}
                style={{
                  padding: '0.5rem 1.2rem',
                  fontSize: '0.8rem',
                  textTransform: 'uppercase',
                  background: modalViewMode === 'photo' ? 'var(--accent-volt)' : 'var(--bg-card-hover, rgba(128, 128, 128, 0.08))',
                  color: modalViewMode === 'photo' ? '#ffffff' : 'var(--text-muted)',
                  border: '1px solid',
                  borderColor: modalViewMode === 'photo' ? 'var(--accent-volt)' : 'var(--border-color)',
                  boxShadow: modalViewMode === 'photo' ? 'var(--glow-volt)' : 'none',
                  cursor: 'pointer',
                  fontWeight: 700,
                  borderRadius: '6px',
                  transition: 'all 0.2s'
                }}
                onClick={() => setModalViewMode('photo')}
              >
                Photo
              </button>
              <button
                className={`outline-btn`}
                style={{
                  padding: '0.5rem 1.2rem',
                  fontSize: '0.8rem',
                  textTransform: 'uppercase',
                  background: modalViewMode === 'diagnostics' ? 'var(--accent-cyan)' : 'var(--bg-card-hover, rgba(128, 128, 128, 0.08))',
                  color: modalViewMode === 'diagnostics' ? '#ffffff' : 'var(--text-muted)',
                  border: '1px solid',
                  borderColor: modalViewMode === 'diagnostics' ? 'var(--accent-cyan)' : 'var(--border-color)',
                  boxShadow: modalViewMode === 'diagnostics' ? 'var(--glow-cyan)' : 'none',
                  cursor: 'pointer',
                  fontWeight: 700,
                  borderRadius: '6px',
                  transition: 'all 0.2s'
                }}
                onClick={() => setModalViewMode('diagnostics')}
              >
                Diagnostics
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
                        src={chestPhotos[chestPhotoIndex % Math.max(1, chestPhotos.length)] || 'assets/images/gallery_weights.png'}
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <button
                          onClick={() => handleDeleteStationImage('Chest Workout Station', chestPhotoIndex)}
                          style={{
                            background: 'rgba(255, 40, 40, 0.15)',
                            border: '1px solid rgba(255, 60, 60, 0.4)',
                            color: '#ff5555',
                            padding: '0.2rem 0.55rem',
                            borderRadius: '4px',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem'
                          }}
                          title="Delete current image (Admin Only)"
                        >
                          🗑️ Delete Image
                        </button>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {chestPhotoIndex + 1} / 10
                        </span>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '0.6rem', overflowX: 'auto', padding: '0.4rem 0.2rem' }}>
                      {chestPhotos.map((src, idx) => (
                        <div key={idx} style={{ position: 'relative', display: 'inline-block', flexShrink: 0 }}>
                          <button
                            onClick={() => setChestPhotoIndex(idx)}
                            style={{
                              width: '50px',
                              height: '38px',
                              borderRadius: '4px',
                              overflow: 'hidden',
                              border: chestPhotoIndex === idx ? '2px solid var(--accent-volt)' : '1px solid var(--border-color)',
                              padding: 0,
                              cursor: 'pointer',
                              background: 'none',
                              display: 'block'
                            }}
                          >
                            <img src={src} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteStationImage('chest', idx);
                            }}
                            style={{
                              position: 'absolute',
                              top: '-5px',
                              right: '-5px',
                              background: 'rgba(255, 35, 35, 0.95)',
                              border: '1px solid #fff',
                              color: '#fff',
                              borderRadius: '50%',
                              width: '18px',
                              height: '18px',
                              fontSize: '0.65rem',
                              fontWeight: 900,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              zIndex: 10,
                              boxShadow: '0 2px 4px rgba(0,0,0,0.5)'
                            }}
                            title={`Remove separate image #${idx + 1}`}
                          >
                            ✕
                          </button>
                        </div>
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
                        src={backPhotos[backPhotoIndex % Math.max(1, backPhotos.length)] || 'assets/images/gallery_weights.png'}
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <button
                          onClick={() => handleDeleteStationImage('Back Workout Station', backPhotoIndex)}
                          style={{
                            background: 'rgba(255, 40, 40, 0.15)',
                            border: '1px solid rgba(255, 60, 60, 0.4)',
                            color: '#ff5555',
                            padding: '0.2rem 0.55rem',
                            borderRadius: '4px',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem'
                          }}
                          title="Delete current image (Admin Only)"
                        >
                          🗑️ Delete Image
                        </button>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {backPhotoIndex + 1} / 10
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.6rem', overflowX: 'auto', padding: '0.4rem 0.2rem' }}>
                      {backPhotos.map((src, idx) => (
                        <div key={idx} style={{ position: 'relative', display: 'inline-block', flexShrink: 0 }}>
                          <button
                            onClick={() => setBackPhotoIndex(idx)}
                            style={{
                              width: '50px',
                              height: '38px',
                              borderRadius: '4px',
                              overflow: 'hidden',
                              border: backPhotoIndex === idx ? '2px solid var(--accent-volt)' : '1px solid var(--border-color)',
                              padding: 0,
                              cursor: 'pointer',
                              background: 'none',
                              display: 'block'
                            }}
                          >
                            <img src={src} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteStationImage('back', idx);
                            }}
                            style={{
                              position: 'absolute',
                              top: '-5px',
                              right: '-5px',
                              background: 'rgba(255, 35, 35, 0.95)',
                              border: '1px solid #fff',
                              color: '#fff',
                              borderRadius: '50%',
                              width: '18px',
                              height: '18px',
                              fontSize: '0.65rem',
                              fontWeight: 900,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              zIndex: 10,
                              boxShadow: '0 2px 4px rgba(0,0,0,0.5)'
                            }}
                            title={`Remove separate image #${idx + 1}`}
                          >
                            ✕
                          </button>
                        </div>
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
                  background: 'var(--bg-card-hover, rgba(128,128,128,0.06))',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  padding: '1.4rem',
                  maxHeight: '260px',
                  overflowY: 'auto'
                }}>
                  <h4 style={{ color: 'var(--text-white)', fontWeight: 700, fontSize: '0.9rem', textTransform: 'uppercase', marginBottom: '0.8rem', letterSpacing: '0.05em' }}>
                    Diagnostic Logs
                  </h4>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                    {selectedEquipment.diagnostics.map((log, idx) => (
                      <li key={idx} style={{ fontSize: '0.85rem', color: 'var(--text-white)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <span style={{ color: 'var(--accent-volt)', fontWeight: 'bold' }}>▶</span> {log}
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
                style={{
                  padding: '0.6rem 1.6rem',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  borderRadius: '6px'
                }}
              >
                Close Details
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
      {/* ADD EQUIPMENT MODAL (ADMIN ONLY) */}
      {isAddEquipmentOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(5, 5, 8, 0.92)',
          backdropFilter: 'blur(10px)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem'
        }}>
          <div className="db-card" style={{ width: '100%', maxWidth: '540px', background: '#0a0a10', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.8rem', position: 'relative' }}>
            <button
              onClick={() => setIsAddEquipmentOpen(false)}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}
            >&times;</button>
            <h4 style={{ color: 'var(--text-white)', fontWeight: 800, fontSize: '1.2rem', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
              + Add New Gym Equipment Station
            </h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginBottom: '1.2rem' }}>
              Register new gym equipment/workout machinery, specify operation stats, and upload workout image.
            </p>
            <form onSubmit={handleAddEquipmentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* 1. Workout Name */}
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-white)', display: 'block', marginBottom: '0.35rem', fontWeight: 700 }}>
                  Workout Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Incline Chest Press Station / Cable Crossover"
                  value={newEqName}
                  onChange={(e) => setNewEqName(e.target.value)}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', color: '#fff', padding: '0.6rem 0.8rem', borderRadius: '6px', fontSize: '0.85rem' }}
                />
              </div>

              {/* Short Description */}
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>Short Description / Details</label>
                <input
                  type="text"
                  placeholder="e.g. Heavy-duty plate loaded chest press machine"
                  value={newEqSubtitle}
                  onChange={(e) => setNewEqSubtitle(e.target.value)}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', color: '#fff', padding: '0.6rem 0.8rem', borderRadius: '6px', fontSize: '0.85rem' }}
                />
              </div>

              {/* 2. Category & 3. Operation Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-white)', display: 'block', marginBottom: '0.35rem', fontWeight: 700 }}>
                    Category *
                  </label>
                  <select
                    value={newEqType}
                    onChange={(e) => setNewEqType(e.target.value)}
                    style={{ width: '100%', background: '#12121a', border: '1px solid var(--border-color)', color: '#fff', padding: '0.6rem 0.8rem', borderRadius: '6px', fontSize: '0.85rem' }}
                  >
                    <option value="chest">Chest Station</option>
                    <option value="back">Back Station</option>
                    <option value="biceps">Biceps Station</option>
                    <option value="triceps">Triceps Station</option>
                    <option value="shoulder">Shoulder Station</option>
                    <option value="legs">Legs Station</option>
                    <option value="cardio">Cardio Zone</option>
                    <option value="functional">Functional / HIIT</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-white)', display: 'block', marginBottom: '0.35rem', fontWeight: 700 }}>
                    Operation Stats *
                  </label>
                  <select
                    value={newEqStatus}
                    onChange={(e) => setNewEqStatus(e.target.value)}
                    style={{ width: '100%', background: '#12121a', border: '1px solid var(--border-color)', color: '#fff', padding: '0.6rem 0.8rem', borderRadius: '6px', fontSize: '0.85rem' }}
                  >
                    <option value="100% Active">100% Active</option>
                    <option value="Active">Active</option>
                    <option value="Maintenance Due">Maintenance Due</option>
                    <option value="Under Service">Under Service</option>
                  </select>
                </div>
              </div>

              {/* 4. Workout Image */}
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-white)', display: 'block', marginBottom: '0.35rem', fontWeight: 700 }}>
                  Workout Image *
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => setNewEqImage(reader.result);
                        reader.readAsDataURL(file);
                      }
                    }}
                    style={{
                      width: '100%',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-muted)',
                      padding: '0.45rem 0.6rem',
                      borderRadius: '6px',
                      fontSize: '0.8rem'
                    }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <input
                      type="text"
                      placeholder="Or enter image URL (e.g. assets/images/bench_press.png)"
                      value={newEqImage}
                      onChange={(e) => setNewEqImage(e.target.value)}
                      style={{
                        flexGrow: 1,
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid var(--border-color)',
                        color: '#fff',
                        padding: '0.5rem 0.8rem',
                        borderRadius: '6px',
                        fontSize: '0.82rem'
                      }}
                    />
                    {newEqImage && (
                      <div style={{ width: '48px', height: '36px', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--accent-volt)', flexShrink: 0 }}>
                        <img src={newEqImage} alt="Workout Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.src = 'assets/images/gallery_weights.png'; }} />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Diagnostic Log Records */}
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>Diagnostic Log Records (1 per line)</label>
                <textarea
                  rows="2"
                  value={newEqDiagnostics}
                  onChange={(e) => setNewEqDiagnostics(e.target.value)}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', color: '#fff', padding: '0.6rem 0.8rem', borderRadius: '6px', fontSize: '0.82rem', fontFamily: 'monospace' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsAddEquipmentOpen(false)}
                  style={{ padding: '0.6rem 1.2rem', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-muted)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '0.6rem 1.4rem', background: 'var(--accent-volt)', color: '#000', border: 'none', borderRadius: '6px', fontWeight: 800, cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  + Add Equipment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* 6. ADMIN MEMBER DIRECTORY & REGISTRATION VIEW */}
      {(activeView === 'members' || activeView === 'add-member') && (
        <div className="admin-sub-view" id="admin-subview-members" style={{ display: 'block' }}>
          <div className="db-card flex-card">
            <div className="card-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <h4 style={{ textTransform: 'uppercase', fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>Gym Member Directory & Registration</h4>
                <p className="card-subtitle" style={{ margin: 0 }}>Manage member accounts, register new gym members, assign trainers, and track membership status</p>
              </div>

              <button
                onClick={() => setIsAddMemberOpen(true)}
                style={{
                  background: 'var(--accent-volt)',
                  color: '#000',
                  border: 'none',
                  padding: '0.65rem 1.3rem',
                  borderRadius: '6px',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  boxShadow: '0 0 15px rgba(198, 255, 0, 0.3)',
                  transition: 'transform 0.2s'
                }}
              >
                <span style={{ fontSize: '1.2rem', lineHeight: 1, fontWeight: 900 }}>+</span> Add New Member
              </button>
            </div>

            {/* Filter & Search Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="🔍 Search members by name, email, phone, or RFID..."
                value={memberSearchQuery}
                onChange={(e) => setMemberSearchQuery(e.target.value)}
                style={{
                  flexGrow: 1,
                  maxWidth: '400px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border-color)',
                  color: '#fff',
                  padding: '0.6rem 1rem',
                  borderRadius: '6px',
                  fontSize: '0.85rem'
                }}
              />

              <div style={{ display: 'flex', gap: '0.8rem' }}>
                <select
                  value={filterPlan}
                  onChange={(e) => setFilterPlan(e.target.value)}
                  style={{
                    background: '#12121a',
                    border: '1px solid var(--border-color)',
                    color: '#fff',
                    padding: '0.6rem 1rem',
                    borderRadius: '6px',
                    fontSize: '0.85rem'
                  }}
                >
                  <option value="All">All Membership Tiers</option>
                  <option value="Pro Apex Tier">Pro Apex Tier (₹2,999/mo)</option>
                  <option value="VIP Elite Athlete">VIP Elite Athlete (₹4,999/mo)</option>
                  <option value="Basic Gym Tier">Basic Gym Tier (₹1,499/mo)</option>
                </select>
              </div>
            </div>

            {/* Members Directory Table */}
            <div className="table-wrapper">
              <table className="db-table" id="admin-members-table">
                <thead>
                  <tr>
                    <th>Member Profile</th>
                    <th>Contact Info</th>
                    <th>Membership Plan</th>
                    <th>Status</th>
                    <th>Joining Date</th>
                    <th>Assigned Trainer</th>
                    <th>RFID Code</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {membersList.filter((m) => {
                    const matchesSearch =
                      m.name.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
                      m.email.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
                      m.phone.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
                      m.rfid.toLowerCase().includes(memberSearchQuery.toLowerCase());
                    const matchesPlan = filterPlan === 'All' || m.plan === filterPlan;
                    return matchesSearch && matchesPlan;
                  }).length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-white)', marginBottom: '0.4rem' }}>
                          No Registered Members Found
                        </div>
                        <p style={{ fontSize: '0.8rem', margin: 0 }}>
                          Only real registered members are displayed in this directory. Register a new member via "+ Add New Member" button above or through account sign up!
                        </p>
                      </td>
                    </tr>
                  ) : (
                    membersList
                      .filter((m) => {
                        const matchesSearch =
                          m.name.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
                          m.email.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
                          m.phone.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
                          m.rfid.toLowerCase().includes(memberSearchQuery.toLowerCase());
                        const matchesPlan = filterPlan === 'All' || m.plan === filterPlan;
                        return matchesSearch && matchesPlan;
                      })
                      .map((m) => (
                        <tr key={m.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                              <div style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '50%',
                                background: 'var(--accent-volt)',
                                color: '#000',
                                fontWeight: 800,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.9rem'
                              }}>
                                {m.name.charAt(0)}
                              </div>
                              <span style={{ fontWeight: 700, color: 'var(--text-white)' }}>{m.name}</span>
                            </div>
                          </td>
                          <td>
                            <div style={{ fontSize: '0.8rem' }}>
                              <div style={{ color: 'var(--text-white)' }}>{m.email}</div>
                              <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>{m.phone}</div>
                            </div>
                          </td>
                          <td>
                            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-white)' }}>{m.plan}</span>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>{m.price}</span>
                          </td>
                          <td>
                            <span style={{
                              padding: '0.2rem 0.6rem',
                              borderRadius: '4px',
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              background: m.status === 'Active' ? 'rgba(198,255,0,0.1)' : m.status === 'Pending' ? 'rgba(255,159,0,0.1)' : 'rgba(255,60,60,0.1)',
                              color: m.status === 'Active' ? 'var(--accent-volt)' : m.status === 'Pending' ? '#ff9f00' : '#ff3e6c',
                              border: `1px solid ${m.status === 'Active' ? 'rgba(198,255,0,0.3)' : m.status === 'Pending' ? 'rgba(255,159,0,0.3)' : 'rgba(255,60,60,0.3)'}`
                            }}>
                              {m.status}
                            </span>
                          </td>
                          <td>{m.joinDate}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <span style={{ fontSize: '0.85rem' }}>🏋️</span>
                              <div>
                                <span style={{
                                  fontWeight: 700,
                                  color: m.trainer && m.trainer !== 'No Trainer Assigned' ? 'var(--accent-volt)' : 'var(--text-muted)',
                                  fontSize: '0.82rem',
                                  display: 'block'
                                }}>
                                  {m.trainer || 'No Trainer Assigned'}
                                </span>
                                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                                  {m.trainer && m.trainer !== 'No Trainer Assigned' ? 'Registered Coach' : 'Self-guided'}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <code style={{ background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.4rem', borderRadius: '4px', color: 'var(--accent-cyan)' }}>
                              {m.rfid}
                            </code>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              onClick={() => handleDeleteMember(m.id, m.name, m.email)}
                              style={{
                                background: 'rgba(255, 40, 40, 0.15)',
                                border: '1px solid rgba(255, 60, 60, 0.3)',
                                color: '#ff5555',
                                padding: '0.3rem 0.6rem',
                                borderRadius: '4px',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                              title="Delete Member"
                            >
                              🗑️ Delete
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

      {/* 7. ADMIN TRAINER DIRECTORY VIEW */}
      {activeView === 'trainers' && (
        <div className="admin-sub-view" id="admin-subview-trainers" style={{ display: 'block' }}>
          <div className="db-card flex-card">
            <div className="card-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <h4 style={{ textTransform: 'uppercase', fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>Gym Trainer Directory</h4>
                <p className="card-subtitle" style={{ margin: 0 }}>Manage certified coaches, view specializations, qualifications, and credentials</p>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="🔍 Search trainers by name, email, specialty, or certs..."
                value={trainerSearchQuery}
                onChange={(e) => setTrainerSearchQuery(e.target.value)}
                style={{
                  flexGrow: 1,
                  maxWidth: '400px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border-color)',
                  color: '#fff',
                  padding: '0.6rem 1rem',
                  borderRadius: '6px',
                  fontSize: '0.85rem'
                }}
              />
            </div>

            {/* Trainers Directory Table */}
            <div className="table-wrapper">
              <table className="db-table" id="admin-trainers-table">
                <thead>
                  <tr>
                    <th>Trainer Profile</th>
                    <th>Contact Info</th>
                    <th>Coaching Specialization</th>
                    <th>Certifications & Experience</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {trainersList.filter((t) => {
                    const matchesSearch =
                      t.name.toLowerCase().includes(trainerSearchQuery.toLowerCase()) ||
                      t.email.toLowerCase().includes(trainerSearchQuery.toLowerCase()) ||
                      t.specialty.toLowerCase().includes(trainerSearchQuery.toLowerCase()) ||
                      (t.certifications && t.certifications.toLowerCase().includes(trainerSearchQuery.toLowerCase()));
                    return matchesSearch;
                  }).length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-white)', marginBottom: '0.4rem' }}>
                          No Registered Trainers Found
                        </div>
                        <p style={{ fontSize: '0.8rem', margin: 0 }}>
                          Only real registered trainers are displayed in this directory. Register a new trainer via account sign up!
                        </p>
                      </td>
                    </tr>
                  ) : (
                    trainersList
                      .filter((t) => {
                        const matchesSearch =
                          t.name.toLowerCase().includes(trainerSearchQuery.toLowerCase()) ||
                          t.email.toLowerCase().includes(trainerSearchQuery.toLowerCase()) ||
                          t.specialty.toLowerCase().includes(trainerSearchQuery.toLowerCase()) ||
                          (t.certifications && t.certifications.toLowerCase().includes(trainerSearchQuery.toLowerCase()));
                        return matchesSearch;
                      })
                      .map((t, idx) => (
                        <tr key={idx}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                              <div style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '50%',
                                background: 'var(--accent-volt)',
                                color: '#000',
                                fontWeight: 800,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.9rem'
                              }}>
                                {t.name.charAt(0)}
                              </div>
                              <span style={{ fontWeight: 700, color: 'var(--text-white)' }}>{t.name}</span>
                            </div>
                          </td>
                          <td>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-white)' }}>{t.email}</div>
                          </td>
                          <td>
                            <span style={{
                              padding: '0.2rem 0.6rem',
                              borderRadius: '4px',
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              textTransform: 'uppercase',
                              background: 'rgba(198,255,0,0.1)',
                              color: 'var(--accent-volt)',
                              border: '1px solid rgba(198,255,0,0.3)'
                            }}>
                              {t.specialty === 'strength' ? '💪 Strength & Power' : t.specialty === 'hiit' ? '⚡ HIIT & Cardio' : t.specialty === 'yoga' ? '🧘 Yoga & Mobility' : t.specialty === 'combat' ? '🥊 Combat & Boxing' : t.specialty}
                            </span>
                          </td>
                          <td>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{t.certifications || 'Not specified'}</span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              onClick={() => handleDeleteTrainer(t.email, t.name)}
                              style={{
                                background: 'rgba(255, 40, 40, 0.15)',
                                border: '1px solid rgba(255, 60, 60, 0.3)',
                                color: '#ff5555',
                                padding: '0.3rem 0.6rem',
                                borderRadius: '4px',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                              title="Delete Trainer"
                            >
                              🗑️ Delete
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

      {/* 8. ADMIN ALERTS BROADCAST VIEW */}
      {activeView === 'alerts' && (
        <div className="admin-sub-view" id="admin-subview-alerts" style={{ display: 'block' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.8rem', marginBottom: '2rem' }}>
            
            {/* Left Panel: Broadcast Form */}
            <div className="db-card flex-card">
              <h4 style={{ textTransform: 'uppercase', fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.4rem', color: 'var(--text-white)' }}>
                📢 Broadcast New Alert
              </h4>
              <p className="card-subtitle" style={{ marginBottom: '1.5rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Publish a real-time message like sudden holidays, event alerts, or facility notices to all active users.
              </p>

              <form onSubmit={handleCreateAlert} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-white)' }}>
                    Alert Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sudden Holiday, Special Powerlifting Meet"
                    value={newAlertTitle}
                    onChange={(e) => setNewAlertTitle(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid var(--border-color)',
                      color: '#fff',
                      padding: '0.7rem 1rem',
                      borderRadius: '6px',
                      fontSize: '0.85rem'
                    }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-white)' }}>
                    Alert Category
                  </label>
                  <select
                    value={newAlertType}
                    onChange={(e) => setNewAlertType(e.target.value)}
                    style={{
                      width: '100%',
                      background: '#121319',
                      border: '1px solid var(--border-color)',
                      color: '#fff',
                      padding: '0.7rem 1rem',
                      borderRadius: '6px',
                      fontSize: '0.85rem'
                    }}
                  >
                    <option value="holiday">Sudden Holiday 🛑</option>
                    <option value="event">Special Event 🎉</option>
                    <option value="maintenance">Facility Maintenance ⚙️</option>
                    <option value="general">General Alert 📢</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-white)' }}>
                    Broadcast Message
                  </label>
                  <textarea
                    placeholder="Describe the holiday or event details clearly..."
                    value={newAlertMessage}
                    onChange={(e) => setNewAlertMessage(e.target.value)}
                    rows={5}
                    style={{
                      width: '100%',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid var(--border-color)',
                      color: '#fff',
                      padding: '0.7rem 1rem',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      resize: 'none'
                    }}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="glow-btn"
                  style={{
                    padding: '0.8rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    background: 'var(--accent-volt)',
                    color: '#000',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    boxShadow: 'var(--glow-volt)'
                  }}
                >
                  Broadcast Message 📢
                </button>
              </form>
            </div>

            {/* Right Panel: Active/History Broadcast List */}
            <div className="db-card flex-card" style={{ display: 'flex', flexDirection: 'column' }}>
              <h4 style={{ textTransform: 'uppercase', fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.4rem', color: 'var(--text-white)' }}>
                Active Broadcasts
              </h4>
              <p className="card-subtitle" style={{ marginBottom: '1.5rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                List of currently active and visible notifications on members & trainers portals.
              </p>

              <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', maxHeight: '420px' }}>
                {broadcastAlerts.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                    <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: '#fff' }}>No Active Broadcast Messages</p>
                    <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.78rem' }}>Create one on the left to push immediate alerts.</p>
                  </div>
                ) : (
                  broadcastAlerts.map((alt) => {
                    const typeInfo = {
                      holiday: { border: '#ff3e6c', bg: 'rgba(255, 62, 108, 0.05)', label: 'Holiday' },
                      event: { border: '#00f0ff', bg: 'rgba(0, 240, 255, 0.05)', label: 'Event' },
                      maintenance: { border: '#ff9f00', bg: 'rgba(255, 159, 0, 0.05)', label: 'Maintenance' },
                      general: { border: '#c6ff00', bg: 'rgba(198, 255, 0, 0.05)', label: 'General Alert' }
                    }[alt.type] || { border: '#8e919f', bg: 'rgba(255, 255, 255, 0.03)', label: 'Alert' };

                    return (
                      <div key={alt.id} style={{
                        background: typeInfo.bg,
                        border: `1px solid rgba(255,255,255,0.05)`,
                        borderLeft: `4px solid ${typeInfo.border}`,
                        borderRadius: '8px',
                        padding: '1rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: '1rem'
                      }}>
                        <div style={{ flexGrow: 1 }}>
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.35rem' }}>
                            <span style={{
                              fontSize: '0.65rem',
                              fontWeight: 800,
                              textTransform: 'uppercase',
                              padding: '0.15rem 0.4rem',
                              background: `rgba(${alt.type === 'holiday' ? '255,62,108' : (alt.type === 'event' ? '0,240,255' : '198,255,0')}, 0.15)`,
                              color: typeInfo.border,
                              borderRadius: '4px',
                              border: `1px solid ${typeInfo.border}`
                            }}>
                              {typeInfo.label}
                            </span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{alt.date}</span>
                          </div>
                          <h5 style={{ margin: '0 0 0.3rem 0', fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-white)' }}>{alt.title}</h5>
                          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>{alt.message}</p>
                         </div>
                         <button
                           onClick={() => handleDeleteAlert(alt.id, alt.title)}
                           style={{
                             background: 'none',
                             border: 'none',
                             color: '#ff5555',
                             fontSize: '1rem',
                             cursor: 'pointer',
                             padding: '0.2rem'
                           }}
                           title="Withdraw Alert"
                         >
                           🗑️
                         </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ADD NEW MEMBER MODAL (ADMIN ONLY) */}
      {isAddMemberOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(5, 5, 8, 0.92)',
          backdropFilter: 'blur(10px)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem'
        }}>
          <div className="db-card" style={{ width: '100%', maxWidth: '540px', background: '#0a0a10', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.8rem', position: 'relative' }}>
            <button
              onClick={() => setIsAddMemberOpen(false)}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}
            >&times;</button>
            <h4 style={{ color: 'var(--text-white)', fontWeight: 800, fontSize: '1.2rem', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
              + Register New Gym Member
            </h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginBottom: '1.2rem' }}>
              Enter new member details, choose membership plan, assign trainer, and generate RFID pass code.
            </p>

            <form onSubmit={handleAddMemberSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-white)', display: 'block', marginBottom: '0.35rem', fontWeight: 700 }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Keerthan Gowda"
                  value={newMemName}
                  onChange={(e) => setNewMemName(e.target.value)}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', color: '#fff', padding: '0.6rem 0.8rem', borderRadius: '6px', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-white)', display: 'block', marginBottom: '0.35rem', fontWeight: 700 }}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="member@apex.com"
                    value={newMemEmail}
                    onChange={(e) => setNewMemEmail(e.target.value)}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', color: '#fff', padding: '0.6rem 0.8rem', borderRadius: '6px', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-white)', display: 'block', marginBottom: '0.35rem', fontWeight: 700 }}>
                    Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="+91 98765 43210"
                    value={newMemPhone}
                    onChange={(e) => setNewMemPhone(e.target.value)}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', color: '#fff', padding: '0.6rem 0.8rem', borderRadius: '6px', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-white)', display: 'block', marginBottom: '0.35rem', fontWeight: 700 }}>
                    Membership Plan *
                  </label>
                  <select
                    value={newMemPlan}
                    onChange={(e) => setNewMemPlan(e.target.value)}
                    style={{ width: '100%', background: '#12121a', border: '1px solid var(--border-color)', color: '#fff', padding: '0.6rem 0.8rem', borderRadius: '6px', fontSize: '0.85rem' }}
                  >
                    <option value="Pro Apex Tier">Pro Apex Tier (₹2,999/mo)</option>
                    <option value="VIP Elite Athlete">VIP Elite Athlete (₹4,999/mo)</option>
                    <option value="Basic Gym Tier">Basic Gym Tier (₹1,499/mo)</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-white)', display: 'block', marginBottom: '0.35rem', fontWeight: 700 }}>
                    Membership Status *
                  </label>
                  <select
                    value={newMemStatus}
                    onChange={(e) => setNewMemStatus(e.target.value)}
                    style={{ width: '100%', background: '#12121a', border: '1px solid var(--border-color)', color: '#fff', padding: '0.6rem 0.8rem', borderRadius: '6px', fontSize: '0.85rem' }}
                  >
                    <option value="Active">Active</option>
                    <option value="Pending">Pending</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-white)', display: 'block', marginBottom: '0.35rem', fontWeight: 700 }}>
                    Assigned Trainer (Taken by Member)
                  </label>
                  <select
                    value={newMemTrainer}
                    onChange={(e) => setNewMemTrainer(e.target.value)}
                    style={{ width: '100%', background: '#12121a', border: '1px solid var(--border-color)', color: '#fff', padding: '0.6rem 0.8rem', borderRadius: '6px', fontSize: '0.85rem' }}
                  >
                    <option value="No Trainer Assigned">No Trainer Assigned (Self-guided)</option>
                    {registeredTrainers.map((tName, idx) => (
                      <option key={idx} value={tName}>
                        🏋️ {tName} (Registered Coach)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-white)', display: 'block', marginBottom: '0.35rem', fontWeight: 700 }}>
                    RFID Card Code
                  </label>
                  <input
                    type="text"
                    value={newMemRfid}
                    onChange={(e) => setNewMemRfid(e.target.value)}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', color: 'var(--accent-cyan)', padding: '0.6rem 0.8rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 700 }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsAddMemberOpen(false)}
                  style={{ padding: '0.6rem 1.2rem', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-muted)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '0.6rem 1.4rem', background: 'var(--accent-volt)', color: '#000', border: 'none', borderRadius: '6px', fontWeight: 800, cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  + Register Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* OFFICIAL RAZORPAY RECEIPT / TAX INVOICE MODAL */}
      {activeAdminReceipt && (
        <ReceiptModal
          receipt={activeAdminReceipt}
          onClose={() => setActiveAdminReceipt(null)}
        />
      )}
    </div>
  );
}
