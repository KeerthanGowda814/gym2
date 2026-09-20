import React, { useState, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import { memberApi } from '../services/memberApi';
import ReceiptModal from './ReceiptModal';
import { sendEmailJSBroadcastAlert } from '../services/emailService';
import Swal from 'sweetalert2';

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

  // Expiry alerts list
  const defaultExpiryAlerts = [
    { name: 'Ethan Hunt', plan: 'Muscle Pro (6-Month)', daysLeft: 3, date: 'Sep 15, 2026', urgent: true, notified: false },
    { name: 'Luther Stickell', plan: 'Muscle Core (Monthly)', daysLeft: 5, date: 'Sep 17, 2026', urgent: false, notified: false },
    { name: 'Benji Dunn', plan: 'Muscle Pro (6-Month)', daysLeft: 2, date: 'Sep 14, 2026', urgent: true, notified: false },
    { name: 'Ilsa Faust', plan: 'Muscle Elite (Yearly)', daysLeft: 6, date: 'Sep 18, 2026', urgent: false, notified: false }
  ];
  const [expiryAlerts, setExpiryAlerts] = useState(defaultExpiryAlerts);
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

          let memName = u.name || u.email.split('@')[0];
          if (u.email && u.email.toLowerCase() === 'thepcworkshop1@gmail.com' && (memName === 'The PC Workshop' || memName === 'thepcworkshop1')) {
            memName = 'Jeery';
          }

          combinedMap.set(u.email.toLowerCase(), {
            id: 'reg-' + index + '-' + u.email,
            name: memName,
            email: u.email,
            phone: u.phone || '+1 (555) 019-2831',
            plan: u.plan || 'Muscle Pro (6-Month)',
            price: u.price || '₹3,500/6 mos',
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

  const defaultTrainersSeed = [
    {
      id: 'TRN-VISHWAMBHARA',
      name: 'Coach Vishwambhara',
      email: 'vishwambhara@apex.com',
      role: 'trainer',
      specialty: 'hiit',
      certifications: 'NASM-CPT, Kettlebell & Functional Master',
      status: 'Active'
    },
    {
      id: 'TRN-KEERTHU',
      name: 'Coach Keerthu',
      email: 'keerthu@apex.com',
      role: 'trainer',
      specialty: 'strength',
      certifications: 'CSCS, Master of Sports Physiology',
      status: 'Active'
    },
    {
      id: 'tr-marcus',
      name: 'Marcus Vance',
      email: 'trainer@apex.com',
      role: 'trainer',
      specialty: 'strength',
      certifications: 'CSCS Certified, 8+ Years Experience',
      status: 'Active'
    },
    {
      id: 'tr-sarah',
      name: 'Sarah Connor',
      email: 'sarah.c@apex.com',
      role: 'trainer',
      specialty: 'hiit',
      certifications: 'NASM-CPT, Kettlebell Level 2',
      status: 'Active'
    },
    {
      id: 'tr-goggins',
      name: 'David Goggins',
      email: 'goggins@apex.com',
      role: 'trainer',
      specialty: 'combat',
      certifications: 'Ex-Navy SEAL, Ultra-endurance Coach',
      status: 'Active'
    }
  ];

  const getRegisteredTrainers = () => {
    const registeredUsers = JSON.parse(localStorage.getItem('apex_registered_users')) || [];
    const trainers = registeredUsers.filter(u => u.role === 'trainer' && u.name);

    const combinedMap = new Map();
    defaultTrainersSeed.forEach(t => combinedMap.set(t.email.toLowerCase(), t));
    trainers.forEach(t => combinedMap.set(t.email.toLowerCase(), t));

    return Array.from(combinedMap.values());
  };

  const [trainersList, setTrainersList] = useState(getRegisteredTrainers);

  const fetchDbTrainers = async () => {
    let apiTrainers = [];
    try {
      const res = await fetch('http://localhost:5000/api/member/trainers', {
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('apex_auth_token') ? { Authorization: `Bearer ${localStorage.getItem('apex_auth_token')}` } : {})
        }
      });
      if (res.ok) {
        const result = await res.json();
        if (result.success && Array.isArray(result.data)) {
          apiTrainers = result.data.map((u, index) => ({
            id: u._id || u.userId || u.id || `tr-db-${index}-${u.email}`,
            name: u.name,
            email: u.email,
            role: 'trainer',
            specialty: u.specialty || 'strength',
            certifications: u.certifications || u.credentials || 'Certified Fitness Coach',
            status: u.status || 'Active'
          }));
        }
      }
    } catch (err) {
      console.warn("Failed to fetch database trainers:", err);
    }

    const localUsers = JSON.parse(localStorage.getItem('apex_registered_users')) || [];
    const localTrainers = localUsers.filter(u => u.role === 'trainer' && u.name).map((u, index) => ({
      id: u.id || `tr-loc-${index}-${u.email}`,
      name: u.name,
      email: u.email,
      role: 'trainer',
      specialty: u.specialty || 'strength',
      certifications: u.certifications || u.credentials || 'Certified Fitness Coach',
      status: u.status || 'Active'
    }));

    const combinedMap = new Map();

    defaultTrainersSeed.forEach(t => {
      if (t && t.email) combinedMap.set(t.email.toLowerCase(), t);
    });

    apiTrainers.forEach(t => {
      if (t && t.email) combinedMap.set(t.email.toLowerCase(), t);
    });

    localTrainers.forEach(t => {
      if (t && t.email) {
        const existing = combinedMap.get(t.email.toLowerCase());
        if (existing) {
          combinedMap.set(t.email.toLowerCase(), { ...existing, ...t });
        } else {
          combinedMap.set(t.email.toLowerCase(), t);
        }
      }
    });

    setTrainersList(Array.from(combinedMap.values()));
  };

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
            let rawName = u.name || u.email.split('@')[0];
            if (u.email && u.email.toLowerCase() === 'thepcworkshop1@gmail.com' && (rawName === 'The PC Workshop' || rawName === 'thepcworkshop1')) {
              rawName = 'Jeery';
            }
            return {
              id: u.userId || `db-${index}-${u.email}`,
              name: rawName,
              email: u.email,
              phone: u.phone || '+1 (555) 019-2831',
              plan: u.membershipTier || 'Muscle Pro (6-Month)',
              price: u.price || '₹3,500/6 mos',
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
      fetchDbTrainers();
    };

    syncRegisteredUsers();
    window.addEventListener('storage', syncRegisteredUsers);
    return () => window.removeEventListener('storage', syncRegisteredUsers);
  }, []);

  const fetchFinancialAccounts = async () => {
    setIsAccountsLoading(true);
    try {
      let serverData = null;
      try {
        const res = await fetch('/api/payment/admin/accounts');
        const data = await res.json();
        if (data && data.success) {
          serverData = data;
        }
      } catch (e) {
        try {
          const res = await fetch('http://localhost:5000/api/payment/admin/accounts');
          const data = await res.json();
          if (data && data.success) {
            serverData = data;
          }
        } catch (e2) {}
      }

      let localSuppOrders = [];
      try {
        localSuppOrders = JSON.parse(localStorage.getItem('apex_supplement_orders') || '[]');
      } catch (e) {}

      const map = new Map();

      // 1. Add real server transactions with valid positive amounts
      if (serverData && Array.isArray(serverData.transactions)) {
        serverData.transactions.forEach(t => {
          const key = t.receiptNumber || t.orderId || t.paymentId || t.txId;
          const amt = Number(t.amount || t.netAmount || 0);
          if (key && amt > 0) {
            map.set(key, {
              ...t,
              amount: amt
            });
          }
        });
      }

      // 2. Add real local supplement orders with valid positive amounts
      localSuppOrders.forEach(o => {
        if (!o) return;
        const key = o.receiptNumber || o.orderId || o.txId;
        
        let realAmt = Number(o.total || o.totalAmount || o.netAmount || o.subtotal || 0);
        if (!realAmt && Array.isArray(o.items) && o.items.length > 0) {
          realAmt = o.items.reduce((sum, it) => sum + (Number(it.price || it.unitPrice || 0) * Number(it.qty || it.quantity || 1)), 0);
        }

        if (key && realAmt > 0) {
          map.set(key, {
            receiptNumber: o.receiptNumber || key,
            orderId: o.orderId || key,
            paymentId: o.txId || key,
            userName: o.userName || o.shippingInfo?.fullName || 'Athlete Member',
            userEmail: o.userEmail || o.shippingInfo?.email || '',
            paymentType: 'supplement_order',
            title: `MuScLe HuB Store: ${o.itemsSummary || (Array.isArray(o.items) ? o.items.map(i => `${i.quantity || i.qty || 1}x ${i.name}`).join(', ') : 'Supplement Purchase')}`,
            amount: realAmt,
            currency: 'INR',
            status: o.status === 'Cancelled' ? 'cancelled' : 'paid',
            paymentMethod: o.paymentMethod || 'Online Payment (Razorpay)',
            createdAt: o.date || new Date().toISOString()
          });
        }
      });

      const combinedTx = Array.from(map.values());

      let membershipRevenue = 0;
      let supplementRevenue = 0;
      let trainerRevenue = 0;
      let totalGst = 0;

      combinedTx.forEach(t => {
        const amt = Math.round(Number(t.amount) || 0);
        const gst = Math.round(Number(t.gstAmount) || (amt - (amt / 1.18)));
        totalGst += gst;

        if (t.paymentType === 'membership') {
          membershipRevenue += amt;
        } else if (t.paymentType === 'supplement_order') {
          supplementRevenue += amt;
        } else if (t.paymentType === 'trainer_booking') {
          trainerRevenue += amt;
        } else {
          membershipRevenue += amt;
        }
      });

      const grossRevenue = Math.round(membershipRevenue + supplementRevenue + trainerRevenue);

      setAccountsSummary({
        totalRevenue: grossRevenue,
        grossRevenue: grossRevenue,
        membershipRevenue: membershipRevenue,
        supplementRevenue: supplementRevenue,
        trainerRevenue: trainerRevenue,
        totalGst: totalGst,
        transactionCount: combinedTx.length
      });

      setAdminTransactions(combinedTx);
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
        plan: m.plan || 'Muscle Pro (6-Month)',
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
  const [filterMemberStatus, setFilterMemberStatus] = useState('All');
  const [memberSortField, setMemberSortField] = useState('name');
  const [memberSortDir, setMemberSortDir] = useState('asc');

  const [trainerSearchQuery, setTrainerSearchQuery] = useState('');
  const [filterSpecialty, setFilterSpecialty] = useState('All');
  const [trainerSortField, setTrainerSortField] = useState('name');
  const [trainerSortDir, setTrainerSortDir] = useState('asc');

  const handleMemberSortToggle = (field) => {
    if (memberSortField === field) {
      setMemberSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setMemberSortField(field);
      setMemberSortDir('asc');
    }
  };

  const handleTrainerSortToggle = (field) => {
    if (trainerSortField === field) {
      setTrainerSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setTrainerSortField(field);
      setTrainerSortDir('asc');
    }
  };

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

  // New Trainer Form States
  const [isAddTrainerOpen, setIsAddTrainerOpen] = useState(false);
  const [newTrName, setNewTrName] = useState('');
  const [newTrEmail, setNewTrEmail] = useState('');
  const [newTrSpecialty, setNewTrSpecialty] = useState('strength');
  const [newTrCerts, setNewTrCerts] = useState('ISSA / CSCS Certified (5+ yrs)');

  const handleAddTrainerSubmit = (e) => {
    e.preventDefault();
    if (!newTrName.trim() || !newTrEmail.trim()) {
      alert('Please enter trainer full name and email address!');
      return;
    }

    const newTrainer = {
      id: 'tr-' + Date.now(),
      name: newTrName.trim(),
      email: newTrEmail.trim(),
      role: 'trainer',
      specialty: newTrSpecialty,
      certifications: newTrCerts.trim() || 'Certified Fitness Coach',
      status: 'Active'
    };

    const registeredUsers = JSON.parse(localStorage.getItem('apex_registered_users')) || [];
    registeredUsers.unshift(newTrainer);
    localStorage.setItem('apex_registered_users', JSON.stringify(registeredUsers));

    setTrainersList((prev) => [newTrainer, ...prev]);

    setIsAddTrainerOpen(false);
    setNewTrName('');
    setNewTrEmail('');
    setNewTrCerts('ISSA / CSCS Certified (5+ yrs)');

    addActivity(`Registered new coach <strong>${newTrainer.name}</strong> (${newTrainer.specialty})`, 'volt');
    alert(`Trainer "${newTrainer.name}" registered successfully!`);
  };

  // New Member Form States
  const [newMemName, setNewMemName] = useState('');
  const [newMemEmail, setNewMemEmail] = useState('');
  const [newMemPhone, setNewMemPhone] = useState('');
  const [newMemPlan, setNewMemPlan] = useState('Muscle Pro (6-Month)');
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
      'Muscle Core (Monthly)': '₹800/mo',
      'Muscle Pro (6-Month)': '₹3,500/6 mos',
      'Muscle Elite (Yearly)': '₹7,500/yr'
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

  const [monthlyAttendance, setMonthlyAttendance] = useState(() => [
    { name: 'Ethan Hunt', visits: 24, avgStay: '1h 45m', freq: '6x / week', rate: '96.2%', status: 'Regular' },
    { name: 'Luther Stickell', visits: 19, avgStay: '1h 30m', freq: '5x / week', rate: '88.5%', status: 'Consistent' },
    { name: 'Benji Dunn', visits: 16, avgStay: '1h 15m', freq: '4x / week', rate: '82.0%', status: 'Active' },
    { name: 'Ilsa Faust', visits: 22, avgStay: '2h 05m', freq: '5x / week', rate: '92.4%', status: 'Elite' },
    { name: 'William Brandt', visits: 18, avgStay: '1h 20m', freq: '4x / week', rate: '85.1%', status: 'Regular' }
  ]);

  const [checkedInCount, setCheckedInCount] = useState(0);
  const [onFloorCount, setOnFloorCount] = useState(0);

  // Chart canvas references & analytics timeframe
  const growthCanvasRef = useRef(null);
  const revCanvasRef = useRef(null);
  const attCanvasRef = useRef(null);
  const tierCanvasRef = useRef(null);
  const statusReportCanvasRef = useRef(null);
  const targetCanvasRef = useRef(null);

  const [analyticsTimeframe, setAnalyticsTimeframe] = useState('30d');

  // Broadcast alerts states
  const [broadcastAlerts, setBroadcastAlerts] = useState([]);
  const [newAlertTitle, setNewAlertTitle] = useState('');
  const [newAlertMessage, setNewAlertMessage] = useState('');
  const [newAlertType, setNewAlertType] = useState('general');
  const [isBroadcasting, setIsBroadcasting] = useState(false);

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
      Swal.fire({
        icon: 'warning',
        title: 'Missing Alert Details',
        text: 'Please provide both alert title and description before broadcasting.',
        confirmColor: '#FF5E00'
      });
      return;
    }

    setIsBroadcasting(true);

    const newAlert = {
      title: newAlertTitle.trim(),
      message: newAlertMessage.trim(),
      type: newAlertType
    };

    // 1. Post to Backend API & Local Cache
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

    // 2. Extract recipient emails (from state + localStorage + defaults)
    const registeredUsers = JSON.parse(localStorage.getItem('apex_registered_users')) || [];
    const allEmails = [
      ...membersList.map(m => m.email),
      ...registeredUsers.map(u => u.email),
      'ethan.hunt@apex.com',
      'luther.stickell@apex.com',
      'benji.dunn@apex.com',
      'ilsa.faust@apex.com'
    ].filter(e => e && e.includes('@'));

    const recipientEmails = [...new Set(allEmails)];

    // 3. Dispatch EmailJS Notification
    const emailJsResult = await sendEmailJSBroadcastAlert({
      title: newAlertTitle.trim(),
      message: newAlertMessage.trim(),
      type: newAlertType,
      recipientEmails
    });

    setIsBroadcasting(false);

    addActivity(`Broadcasted alert <strong>${newAlertTitle}</strong> (${newAlertType})`, 'orange');

    Swal.fire({
      icon: 'success',
      title: 'Broadcast Published & EmailJS Sent! 📢',
      text: `Alert "${newAlertTitle.trim()}" published to portals and dispatched via EmailJS to ${recipientEmails.length} member email addresses.`,
      confirmButtonColor: '#FF5E00'
    });

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
      [...(serverOrders || []), ...(localOrders || [])].forEach((o) => {
        if (o && (o.orderId || o.txId)) {
          const key = o.orderId || o.txId;
          const existing = map.get(key) || {};
          map.set(key, { ...existing, ...o });
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
    const targetId = order.orderId || order.txId;
    if (!targetId) return;

    // 1. Instant state update for immediate user visual confirmation
    setAdminOrders(prev => prev.map(o => (o.orderId === targetId || o.txId === targetId) ? { ...o, status: 'Confirmed' } : o));

    // 2. Update local storage
    try {
      const localOrders = JSON.parse(localStorage.getItem('apex_supplement_orders') || '[]');
      const idx = localOrders.findIndex(o => o.orderId === targetId || o.txId === targetId);
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

    // 3. Call Express backend endpoint
    await memberApi.updateSupplementOrderStatus(targetId, {
      status: 'Confirmed',
      note: 'Order confirmed by Admin'
    });

    await fetchAdminOrders();
    if (addActivity) {
      addActivity(`Admin confirmed supplement order <strong>${targetId}</strong> (${order.userName || 'Member'})`, 'green');
    }
    alert(`Order ${targetId} confirmed successfully!`);
  };

  const handleAdminSaveOrderStatus = async (e) => {
    e.preventDefault();
    if (!editingOrderModal) return;

    const targetId = editingOrderModal.orderId || editingOrderModal.txId;
    if (!targetId) return;

    // 1. Instant state update for immediate visual confirmation
    setAdminOrders(prev => prev.map(o => (o.orderId === targetId || o.txId === targetId) ? {
      ...o,
      status: editStatus,
      courierName: editCourier,
      trackingNumber: editTracking,
      estimatedDelivery: editEstDelivery
    } : o));

    // 2. Update local storage
    try {
      const localOrders = JSON.parse(localStorage.getItem('apex_supplement_orders') || '[]');
      const idx = localOrders.findIndex(o => o.orderId === targetId || o.txId === targetId);
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

    // 3. Call Express backend endpoint
    await memberApi.updateSupplementOrderStatus(targetId, {
      status: editStatus,
      courierName: editCourier,
      trackingNumber: editTracking,
      estimatedDelivery: editEstDelivery,
      note: editNote || `Status updated to ${editStatus} by Admin`
    });

    await fetchAdminOrders();
    if (addActivity) {
      addActivity(`Admin updated order <strong>${targetId}</strong> status to ${editStatus}`, 'volt');
    }
    alert(`Order ${targetId} updated to ${editStatus}!`);
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
    let growthChart, revChart, attChart, tierChart;
    let statusReportChart, targetChart;

    const getGrowthData = () => {
      if (analyticsTimeframe === '7d') {
        return {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          data: [28, 31, 33, 35, 38, 42, Math.max(45, membersList.length)]
        };
      }
      if (analyticsTimeframe === '30d') {
        return {
          labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
          data: [22, 29, 36, Math.max(45, membersList.length)]
        };
      }
      if (analyticsTimeframe === '90d') {
        return {
          labels: ['Jul', 'Aug', 'Sep'],
          data: [18, 32, Math.max(45, membersList.length)]
        };
      }
      return {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
        data: [8, 12, 16, 22, 28, 33, 37, 41, Math.max(45, membersList.length)]
      };
    };

    const getRevenueData = () => {
      const baseRev = (accountsSummary?.totalRevenue || 128500) + payments.reduce((acc, p) => acc + (p.amount || 0), 0);
      if (analyticsTimeframe === '7d') {
        return {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          data: [12500, 14200, 11800, 18900, 22400, 26800, 21000]
        };
      }
      if (analyticsTimeframe === '30d') {
        return {
          labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
          data: [28500, 34200, 41800, Math.max(48900, baseRev)]
        };
      }
      if (analyticsTimeframe === '90d') {
        return {
          labels: ['Jul', 'Aug', 'Sep'],
          data: [88500, 104200, Math.max(128500, baseRev)]
        };
      }
      return {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
        data: [42000, 51000, 68000, 79000, 92000, 105000, 114000, 122000, Math.max(128500, baseRev)]
      };
    };

    const getStatusReportData = () => {
      const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const now = new Date();
      const currentYear = now.getFullYear();
      
      // Calculate actual member totals by plan tier
      const actualProCount = membersList.filter(m => (m.plan || '').toLowerCase().includes('pro')).length || 18;
      const actualEliteCount = membersList.filter(m => (m.plan || '').toLowerCase().includes('elite')).length || 7;
      const actualCoreCount = membersList.filter(m => (m.plan || '').toLowerCase().includes('core') || (m.plan || '').toLowerCase().includes('monthly') || (m.plan || '').toLowerCase().includes('basic')).length || 12;

      // Realistic historical monthly growth factors (Q1 to Q4 cumulative curve)
      const growthFactors = [0.45, 0.52, 0.60, 0.68, 0.75, 0.82, 0.88, 0.94, 1.00, 1.05, 1.10, 1.15];
      
      const proData = growthFactors.map(factor => Math.round(actualProCount * factor));
      const eliteData = growthFactors.map(factor => Math.round(actualEliteCount * factor));
      const basicData = growthFactors.map(factor => Math.round(actualCoreCount * factor));
      
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
        const grad1 = createNeonGradient(ctx, 'rgba(255, 94, 0, 0.22)', 'rgba(255, 94, 0, 0)');
        const grad2 = createNeonGradient(ctx, 'rgba(2, 132, 199, 0.22)', 'rgba(2, 132, 199, 0)');
        const grad3 = createNeonGradient(ctx, 'rgba(16, 185, 129, 0.22)', 'rgba(16, 185, 129, 0)');

        const statusReportData = getStatusReportData();
        statusReportChart = new Chart(ctx, {
          type: 'line',
          data: {
            labels: statusReportData.labels,
            datasets: [
              {
                label: 'Muscle Pro (6-Month)',
                data: statusReportData.proData,
                borderColor: '#FF5E00',
                borderWidth: 3,
                backgroundColor: grad1,
                fill: true,
                tension: 0.35,
                pointBackgroundColor: '#FF5E00',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 1.5,
                pointRadius: 4,
                pointHoverRadius: 7
              },
              {
                label: 'Muscle Core (Monthly)',
                data: statusReportData.basicData,
                borderColor: '#0284C7',
                borderWidth: 3,
                backgroundColor: grad2,
                fill: true,
                tension: 0.35,
                pointBackgroundColor: '#0284C7',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 1.5,
                pointRadius: 4,
                pointHoverRadius: 7
              },
              {
                label: 'Muscle Elite (Yearly)',
                data: statusReportData.eliteData,
                borderColor: '#10B981',
                borderWidth: 3,
                backgroundColor: grad3,
                fill: true,
                tension: 0.35,
                pointBackgroundColor: '#10B981',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 1.5,
                pointRadius: 4,
                pointHoverRadius: 7
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
                labels: { boxWidth: 10, boxHeight: 10, borderRadius: 2, padding: 15, font: { size: 11, weight: '700' } }
              }
            },
            scales: {
              x: { grid: { display: false }, ticks: { font: { size: 10, weight: '600' } } },
              y: { grid: { color: 'rgba(150, 150, 150, 0.1)' }, ticks: { font: { size: 10, weight: '600' } } }
            }
          }
        });
      }

      // 2. Membership Target (Semi-Doughnut)
      if (targetCanvasRef.current) {
        const ctx = targetCanvasRef.current.getContext('2d');
        const targetGoal = 50;
        const achievedPct = Math.min(100, Math.round(((membersList.length || 37) / targetGoal) * 100));
        const remainingPct = 100 - achievedPct;

        targetChart = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: ['Achieved', 'Remaining'],
            datasets: [
              {
                data: [achievedPct, remainingPct],
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
        const gradient = createNeonGradient(ctx, 'rgba(198, 255, 0, 0.3)', 'rgba(198, 255, 0, 0.02)');
        const revInfo = getRevenueData();
        revChart = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: revInfo.labels,
            datasets: [
              {
                label: 'Gross Income (₹)',
                data: revInfo.data,
                backgroundColor: gradient,
                borderColor: '#c6ff00',
                borderWidth: 1.5,
                borderRadius: 4,
                hoverBackgroundColor: '#c6ff00',
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
        const gradient = createNeonGradient(ctx, 'rgba(0, 240, 255, 0.25)', 'rgba(0, 240, 255, 0)');
        attChart = new Chart(ctx, {
          type: 'line',
          data: {
            labels: ['6am', '8am', '10am', '12pm', '2pm', '4pm', '6pm', '8pm', '10pm'],
            datasets: [
              {
                label: 'Athletes On-site',
                data: [35, 92, 70, 45, 60, 98, 134, 88, 30],
                borderColor: '#00f0ff',
                borderWidth: 3,
                backgroundColor: gradient,
                fill: true,
                tension: 0.35,
                pointBackgroundColor: '#00f0ff',
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

      // 4. Membership Tier Share
      if (tierCanvasRef.current) {
        const ctx = tierCanvasRef.current.getContext('2d');
        const proCount = membersList.filter(m => (m.plan || '').toLowerCase().includes('pro')).length || 18;
        const eliteCount = membersList.filter(m => (m.plan || '').toLowerCase().includes('elite')).length || 7;
        const coreCount = membersList.filter(m => (m.plan || '').toLowerCase().includes('core') || (m.plan || '').toLowerCase().includes('monthly') || (m.plan || '').toLowerCase().includes('basic')).length || 12;

        tierChart = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: ['Muscle Pro (6-Month)', 'Muscle Elite (Yearly)', 'Muscle Core (Monthly)'],
            datasets: [
              {
                data: [proCount, eliteCount, coreCount],
                backgroundColor: ['#c6ff00', '#00f0ff', '#ff9f00'],
                borderWidth: 0,
                cutout: '70%'
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: true,
                position: 'bottom',
                labels: { color: '#8E919F', font: { size: 11, weight: 600 }, boxWidth: 10, padding: 12 }
              }
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
      if (tierChart) tierChart.destroy();
    };
  }, [activeView, membersList, analyticsTimeframe]);

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

    const targetMem = membersList.find(m => m.name === simMember) || { email: `${simMember.toLowerCase().replace(/\s+/g, '')}@apex.com`, rfid: 'RF-8000' };
    const code = targetMem.rfid || '#8092-PRO';
    const email = targetMem.email || `${simMember.toLowerCase().replace(/\s+/g, '')}@apex.com`;

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

  // Trainer Attendance Board Terminal States & Handler
  const [simTrainer, setSimTrainer] = useState('Coach Keerthan');
  const [simTrainerAction, setSimTrainerAction] = useState('check-in');
  const [trainerAttNote, setTrainerAttNote] = useState('Morning Shift & Floor Supervision');

  const handleTrainerAttendanceSubmit = async (e) => {
    e.preventDefault();
    const trainerName = simTrainer.startsWith('Coach') ? simTrainer : `Coach ${simTrainer}`;
    const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const actionText = simTrainerAction === 'check-in' 
      ? 'Shift Clock-In (Morning)' 
      : simTrainerAction === 'evening-in' 
      ? 'Shift Clock-In (Evening)' 
      : simTrainerAction === 'check-out' 
      ? 'Shift Clock-Out' 
      : 'Coaching Session Completed';

    const newLog = {
      id: `tr-att-${Date.now()}`,
      trainerName,
      action: actionText,
      time: `${dateStr}, ${timeStr}`,
      notes: trainerAttNote || 'Standard Coaching Shift',
      status: simTrainerAction === 'check-out' ? 'Completed' : 'On Duty'
    };

    try {
      const existingLogs = JSON.parse(localStorage.getItem('apex_trainer_attendance') || '[]');
      existingLogs.unshift(newLog);
      localStorage.setItem('apex_trainer_attendance', JSON.stringify(existingLogs));
      window.dispatchEvent(new Event('storage'));
    } catch (err) {}

    addActivity(`Trainer <strong>${trainerName}</strong> logged ${actionText}`, 'cyan');

    if (CustomSwal) {
      CustomSwal.fire({
        icon: 'success',
        title: 'Trainer Attendance Logged ⏱️',
        html: `<div style="color:#fff;text-align:left;font-size:0.9rem;">
          <p style="margin-bottom:0.4rem;"><strong>Coach:</strong> ${trainerName}</p>
          <p style="margin-bottom:0.4rem;"><strong>Duty Status:</strong> ${actionText}</p>
          <p style="margin-bottom:0.4rem;"><strong>Timestamp:</strong> ${timeStr}</p>
          <p style="color:#c6ff00;font-weight:bold;margin-top:0.6rem;">✓ Recorded in Trainer Attendance Board!</p>
        </div>`
      });
    }
  };

  return (
    <div>
      {/* 1. ADMIN HOME VIEW */}
      {activeView === 'home' && (
        <div className="admin-sub-view" id="admin-subview-home" style={{ display: 'block' }}>
          
          {/* Row 1: Executive Welcome Banner & Capacity Distribution */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.35fr 0.65fr', gap: '1.8rem', marginBottom: '1.8rem' }}>
            {/* Welcome Banner with Quick Action Buttons */}
            <div className="admin-welcome-banner" style={{ background: 'linear-gradient(135deg, rgba(20, 20, 28, 0.98) 0%, rgba(10, 10, 15, 0.98) 100%)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="banner-content" style={{ flexGrow: 1 }}>
                <span style={{ fontSize: '0.75rem', background: 'linear-gradient(135deg, #ff5e00 0%, #d97706 100%)', color: '#ffffff', padding: '0.3rem 0.75rem', borderRadius: '20px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', boxShadow: '0 2px 8px rgba(255, 94, 0, 0.3)', display: 'inline-block' }}>
                  👑 Executive Command Center
                </span>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 900, margin: '0.6rem 0 0.3rem 0' }}>
                  Welcome Back, Club Admin
                </h2>
                <p style={{ fontSize: '0.85rem', margin: '0 0 1.2rem 0', opacity: 0.9 }}>
                  Manage facility turnstiles, certified trainers, financial ledgers, and membership accounts.
                </p>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => setIsAddMemberOpen(true)}
                    style={{ background: 'linear-gradient(135deg, #ff5e00 0%, #ff8700 100%)', color: '#ffffff', border: 'none', padding: '0.6rem 1.1rem', borderRadius: '8px', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(255, 94, 0, 0.35)', transition: 'transform 0.15s ease' }}
                  >
                    + REGISTER MEMBER
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddTrainerOpen(true)}
                    style={{ background: '#0f172a', color: '#ffffff', border: '1px solid #334155', padding: '0.6rem 1.1rem', borderRadius: '8px', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.25)', transition: 'transform 0.15s ease' }}
                  >
                    + REGISTER COACH
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigateSubView && onNavigateSubView('alerts')}
                    style={{ background: '#0284c7', color: '#ffffff', border: 'none', padding: '0.6rem 1.1rem', borderRadius: '8px', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)', transition: 'transform 0.15s ease' }}
                  >
                    📢 BROADCAST ALERT
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigateSubView && onNavigateSubView('payments')}
                    style={{ background: '#d97706', color: '#ffffff', border: 'none', padding: '0.6rem 1.1rem', borderRadius: '8px', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(217, 119, 6, 0.3)', transition: 'transform 0.15s ease' }}
                  >
                    💳 REVENUE LEDGER
                  </button>
                </div>
              </div>
            </div>

            {/* Member Activity capacity distribution */}
            <div className="admin-activity-card">
              <h4>Member Activity Peak</h4>
              <div className="admin-activity-circles-container">
                <div className="admin-activity-circle c1" title="Peak Slot: 06:00 - 10:00 (45% Capacity)">
                  45%
                  <span>06-10h</span>
                </div>
                <div className="admin-activity-circle c2" title="Mid-Day Slot: 10:00 - 14:00 (25% Capacity)">
                  25%
                  <span>10-14h</span>
                </div>
                <div className="admin-activity-circle c3" title="Evening Slot: 15:00 - 18:00 (20% Capacity)">
                  20%
                  <span>15-18h</span>
                </div>
                <div className="admin-activity-circle c4" title="Night Slot: 19:00 - 24:00 (10% Capacity)">
                  10%
                  <span>19-24h</span>
                </div>
              </div>
              <div className="admin-activity-legend">
                <div className="legend-item"><span className="legend-dot orange"></span>06:00-10:00 (45%)</div>
                <div className="legend-item"><span className="legend-dot yellow"></span>10:00-14:00 (25%)</div>
                <div className="legend-item"><span className="legend-dot green"></span>15:00-18:00 (20%)</div>
                <div className="legend-item"><span className="legend-dot blue"></span>19:00-24:00 (10%)</div>
              </div>
            </div>
          </div>

          {/* Row 2: Three Interactive Metrics Cards with Navigation Drilldown */}
          <div className="admin-metrics-row">
            {/* Card 1: Total Registered Members */}
            <div
              className="admin-metric-card-styled"
              onClick={() => onNavigateSubView && onNavigateSubView('members')}
              style={{ cursor: 'pointer', transition: 'transform 0.2s ease, border-color 0.2s ease' }}
              title="Click to view Member Directory"
            >
              <div className="card-header-styled">
                <h4>Total Gym Members</h4>
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
                    <span className="trend-percentage">▲ +18.6%</span>
                    <span className="trend-period">(Active Roster)</span>
                  </div>
                </div>
                <div className="sparkline-container">
                  <svg width="100%" height="100%" viewBox="0 0 100 40">
                    <path d="M 0,35 Q 15,20 30,28 T 60,10 T 90,5 T 100,2" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Card 2: On Gym Floor Now */}
            <div
              className="admin-metric-card-styled"
              onClick={() => onNavigateSubView && onNavigateSubView('attendance')}
              style={{ cursor: 'pointer', transition: 'transform 0.2s ease, border-color 0.2s ease' }}
              title="Click to view Live Master Attendance"
            >
              <div className="card-header-styled">
                <h4>On Gym Floor Now</h4>
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
                    <span className="trend-percentage" style={{ color: 'var(--accent-cyan)' }}>● Live RFID Scan</span>
                    <span className="trend-period">(Turnstiles)</span>
                  </div>
                </div>
                <div className="sparkline-container">
                  <svg width="100%" height="100%" viewBox="0 0 100 40">
                    <path d="M 0,32 Q 20,25 40,30 T 70,12 T 95,8 T 100,5" fill="none" stroke="#00f0ff" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Card 3: Today's Gate Check-Ins */}
            <div
              className="admin-metric-card-styled"
              onClick={() => onNavigateSubView && onNavigateSubView('attendance')}
              style={{ cursor: 'pointer', transition: 'transform 0.2s ease, border-color 0.2s ease' }}
              title="Click to view Attendance Logs"
            >
              <div className="card-header-styled">
                <h4>Today's Gate Scans</h4>
                <div className="icon-wrapper">
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
              </div>
              <div className="card-body-styled">
                <div>
                  <h3 className="value">{checkedInCount || dailyAttendance.length}</h3>
                  <div className="trend-box">
                    <span className="trend-percentage" style={{ color: 'var(--accent-volt)' }}>✓ Verified</span>
                    <span className="trend-period">(Today Visits)</span>
                  </div>
                </div>
                <div className="sparkline-container">
                  <svg width="100%" height="100%" viewBox="0 0 100 40">
                    <path d="M 0,38 Q 25,30 50,35 T 75,20 T 90,15 T 100,12" fill="none" stroke="#c6ff00" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Row 3: Two Chart Cards (Membership Report & Dynamic Target Goal Gauge) */}
          <div className="admin-charts-grid">
            {/* Membership Status Report (Line Chart) */}
            <div className="admin-chart-card">
              <h4>Membership Status Report</h4>
              <p className="card-subtitle">Detailed breakdown of membership tiers over time</p>
              <div className="chart-container" style={{ position: 'relative', height: '220px', width: '100%' }}>
                <canvas ref={statusReportCanvasRef} id="chart-membership-status-report"></canvas>
              </div>
            </div>

            {/* Membership Target (Semi-Doughnut) */}
            <div className="admin-chart-card">
              <h4>Membership Target Goal</h4>
              <p className="card-subtitle">Active member acquisition target progression</p>
              <div className="admin-gauge-container">
                <canvas ref={targetCanvasRef} id="chart-membership-target" width="160" height="100"></canvas>
                <div className="gauge-center-text">
                  <span className="percent">{Math.min(100, Math.round(((membersList.length || 37) / 50) * 100))}%</span>
                  <span className="label">Goal Progress</span>
                </div>
              </div>
              <div className="admin-gauge-stats">
                <div className="stat-box">
                  <span className="title">Target Goal</span>
                  <span className="val"><span className="bullet orange"></span>50 Members</span>
                </div>
                <div className="stat-box">
                  <span className="title">Active Roster</span>
                  <span className="val"><span className="bullet cyan"></span>{membersList.length || 37} Active</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sleek divider */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', margin: '2.5rem 0 1.5rem 0' }}></div>

          {/* Facility Utilities & Activity Logs */}
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
                            background: alert.notified ? 'rgba(0, 255, 102, 0.15)' : 'rgba(255,255,255,0.05)',
                            borderColor: alert.notified ? 'rgba(0, 255, 102, 0.3)' : 'var(--border-color)',
                            color: alert.notified ? '#00ff66' : 'var(--text-white)',
                            fontWeight: 700,
                            padding: '0.4rem 0.8rem',
                            borderRadius: '4px',
                            cursor: alert.notified ? 'default' : 'pointer'
                          }}
                        >
                          {alert.notified ? '✓ Notified' : '💬 Send Reminder'}
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
                <h4 style={{ textTransform: 'uppercase', fontSize: '1.1rem', fontWeight: 800 }}>Recent Facility Activities</h4>
                <p className="card-subtitle">Real-time turnstile logs & admin action feed</p>

                <div className="activity-timeline">
                  {activities.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem', padding: '2rem 1.2rem' }}>
                      No recent system activities logged today.
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

      {/* 2. ADMIN ANALYTICS & PERFORMANCE COMMAND CENTER VIEW */}
      {activeView === 'analytics' && (
        <div className="admin-sub-view" id="admin-subview-analytics" style={{ display: 'block' }}>
          
          {/* Executive Header Banner & Timeframe Bar */}
          <div className="db-card" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, rgba(20, 20, 28, 0.95) 0%, rgba(10, 10, 15, 0.95) 100%)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.5rem 1.8rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>📊</span>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.3rem', color: 'var(--text-white)', margin: 0, textTransform: 'uppercase' }}>
                    Executive Analytics & Performance Command Center
                  </h3>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: '0.3rem 0 0 0' }}>
                  Real-time revenue metrics, membership retention rates, floor density heatmaps, and financial analytics.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', padding: '0.2rem', border: '1px solid var(--border-color)' }}>
                  {[
                    { id: '7d', label: '7 Days' },
                    { id: '30d', label: '30 Days' },
                    { id: '90d', label: '90 Days (Q3)' },
                    { id: 'ytd', label: 'YTD 2026' }
                  ].map((tf) => (
                    <button
                      key={tf.id}
                      type="button"
                      onClick={() => setAnalyticsTimeframe(tf.id)}
                      style={{
                        background: analyticsTimeframe === tf.id ? 'var(--accent-volt)' : 'transparent',
                        color: analyticsTimeframe === tf.id ? '#000' : 'var(--text-white)',
                        border: 'none',
                        padding: '0.35rem 0.75rem',
                        borderRadius: '4px',
                        fontWeight: 800,
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {tf.label}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const reportRows = [
                      ['Apex Club Executive Performance Report'],
                      ['Generated Date', new Date().toLocaleDateString()],
                      ['Timeframe Filter', analyticsTimeframe.toUpperCase()],
                      [''],
                      ['Metric', 'Value', 'Growth Trend'],
                      ['Total Gross Revenue', `INR ${((accountsSummary?.totalRevenue || 128500) + payments.reduce((acc, p) => acc + (p.amount || 0), 0)).toLocaleString('en-IN')}`, '+22.4%'],
                      ['Active Club Memberships', membersList.length || 37, '+18.6%'],
                      ['Average Order Value (AOV)', 'INR 2,999', '+5.2%'],
                      ['Member Retention Rate', '94.2%', '+2.1%'],
                      ['Active Personal Coaching Mentorships', membersList.filter(m => m.trainer && m.trainer !== 'No Trainer Assigned').length || 14, '+15.0%'],
                      [''],
                      ['Monthly Operational Benchmark (2026)'],
                      ['Month', 'Revenue (INR)', 'New Members', 'Retention Rate', 'Status'],
                      ['Apr 2026', '79,000', '12', '91.5%', 'Optimal'],
                      ['May 2026', '92,000', '15', '92.8%', 'Optimal'],
                      ['Jun 2026', '1,05,000', '18', '93.4%', 'Surging Growth'],
                      ['Jul 2026', '1,14,000', '21', '94.0%', 'Surging Growth'],
                      ['Aug 2026', '1,22,000', '25', '94.2%', 'Target Met'],
                      ['Sep 2026 (Current)', `${((accountsSummary?.totalRevenue || 128500) + payments.reduce((acc, p) => acc + (p.amount || 0), 0)).toLocaleString('en-IN')}`, Math.max(membersList.length, 37), '95.1%', 'Target Met']
                    ];
                    const csvContent = 'data:text/csv;charset=utf-8,' + reportRows.map(e => e.join(',')).join('\n');
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement('a');
                    link.setAttribute('href', encodedUri);
                    link.setAttribute('download', `Apex_Executive_Analytics_Report_${analyticsTimeframe}_${new Date().toISOString().split('T')[0]}.csv`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    alert("Executive Analytics Report downloaded successfully!");
                  }}
                  className="glow-btn"
                  style={{ padding: '0.5rem 1.1rem', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer' }}
                >
                  📥 Export Report (CSV)
                </button>
              </div>
            </div>
          </div>

          {/* 4 Top Executive KPI Indicator Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.2rem', marginBottom: '1.8rem' }}>
            <div className="db-card" style={{ padding: '1.4rem', borderLeft: '4px solid var(--accent-volt)' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Total Period Revenue</span>
              <h3 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-white)', margin: '0.3rem 0 0 0' }}>
                ₹{((accountsSummary?.totalRevenue || 128500) + payments.reduce((acc, p) => acc + (p.amount || 0), 0)).toLocaleString('en-IN')}
              </h3>
              <span style={{ fontSize: '0.72rem', color: '#10b981', marginTop: '0.25rem', display: 'block', fontWeight: 700 }}>
                ▲ +22.4% vs previous period
              </span>
            </div>

            <div className="db-card" style={{ padding: '1.4rem', borderLeft: '4px solid var(--accent-cyan)' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Active Memberships</span>
              <h3 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-white)', margin: '0.3rem 0 0 0' }}>
                {membersList.length || 37}
              </h3>
              <span style={{ fontSize: '0.72rem', color: '#10b981', marginTop: '0.25rem', display: 'block', fontWeight: 700 }}>
                ▲ +18.6% net athlete growth
              </span>
            </div>

            <div className="db-card" style={{ padding: '1.4rem', borderLeft: '4px solid #f59e0b' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Member Retention Rate</span>
              <h3 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#f59e0b', margin: '0.3rem 0 0 0' }}>
                94.2%
              </h3>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                Low churn rate across all tiers
              </span>
            </div>

            <div className="db-card" style={{ padding: '1.4rem', borderLeft: '4px solid #8b5cf6' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Assigned Coach Mentorships</span>
              <h3 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#8b5cf6', margin: '0.3rem 0 0 0' }}>
                {membersList.filter(m => m.trainer && m.trainer !== 'No Trainer Assigned').length || 14}
              </h3>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                Personal 1-on-1 coaching passes
              </span>
            </div>
          </div>

          {/* 4 High-Definition Charts Grid (2x2) */}
          <div className="db-charts-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.8rem', marginBottom: '2rem' }}>
            {/* Chart 1: Membership Growth Trajectory */}
            <div className="db-card chart-card" style={{ padding: '1.8rem', minHeight: 'auto', display: 'flex', flexDirection: 'column' }}>
              <div className="chart-header">
                <h4 style={{ fontSize: '1.1rem', fontWeight: 800, textTransform: 'uppercase', margin: 0 }}>Membership Growth Trajectory</h4>
                <p className="card-subtitle" style={{ margin: '0.2rem 0 0 0' }}>Total active membership acquisitions over timeframe ({analyticsTimeframe.toUpperCase()})</p>
              </div>
              <div className="chart-container" style={{ position: 'relative', height: '240px', width: '100%', marginTop: '1rem' }}>
                <canvas ref={growthCanvasRef} id="chart-membership-growth"></canvas>
              </div>
            </div>
            
            {/* Chart 2: Revenue Stream Breakdown */}
            <div className="db-card chart-card" style={{ padding: '1.8rem', minHeight: 'auto', display: 'flex', flexDirection: 'column' }}>
              <div className="chart-header">
                <h4 style={{ fontSize: '1.1rem', fontWeight: 800, textTransform: 'uppercase', margin: 0 }}>Multi-Channel Revenue Streams (₹)</h4>
                <p className="card-subtitle" style={{ margin: '0.2rem 0 0 0' }}>Total income from memberships, supplements, and coaching</p>
              </div>
              <div className="chart-container" style={{ position: 'relative', height: '240px', width: '100%', marginTop: '1rem' }}>
                <canvas ref={revCanvasRef} id="chart-revenue-streams"></canvas>
              </div>
            </div>

            {/* Chart 3: Hourly Floor Attendance Density */}
            <div className="db-card chart-card" style={{ padding: '1.8rem', minHeight: 'auto', display: 'flex', flexDirection: 'column' }}>
              <div className="chart-header">
                <h4 style={{ fontSize: '1.1rem', fontWeight: 800, textTransform: 'uppercase', margin: 0 }}>Hourly Floor Headcount & Peak Density</h4>
                <p className="card-subtitle" style={{ margin: '0.2rem 0 0 0' }}>Real-time turnstile traffic distribution throughout the day</p>
              </div>
              <div className="chart-container" style={{ position: 'relative', height: '240px', width: '100%', marginTop: '1rem' }}>
                <canvas ref={attCanvasRef} id="chart-attendance-peaks"></canvas>
              </div>
            </div>

            {/* Chart 4: Membership Tier Share */}
            <div className="db-card chart-card" style={{ padding: '1.8rem', minHeight: 'auto', display: 'flex', flexDirection: 'column' }}>
              <div className="chart-header">
                <h4 style={{ fontSize: '1.1rem', fontWeight: 800, textTransform: 'uppercase', margin: 0 }}>Membership Pass Tier Distribution</h4>
                <p className="card-subtitle" style={{ margin: '0.2rem 0 0 0' }}>Muscle Core (Monthly) vs Muscle Pro (6-Month) vs Muscle Elite (Yearly)</p>
              </div>
              <div className="chart-container" style={{ position: 'relative', height: '240px', width: '100%', marginTop: '1rem' }}>
                <canvas ref={tierCanvasRef} id="chart-membership-tier-share"></canvas>
              </div>
            </div>
          </div>

          {/* Operational Performance Table */}
          <div className="db-card flex-card">
            <h4 style={{ textTransform: 'uppercase', fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.3rem' }}>
              Monthly Operational Performance Reports
            </h4>
            <p className="card-subtitle" style={{ marginBottom: '1.2rem' }}>Historical metrics, floor density records, and financial growth benchmarks</p>

            <div className="table-wrapper">
              <table className="db-table">
                <thead>
                  <tr>
                    <th>Month Period</th>
                    <th>Gross Revenue (INR)</th>
                    <th>New Registrations</th>
                    <th>Retention Rate</th>
                    <th>Peak Headcount</th>
                    <th>Performance Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { month: 'September 2026 (Current)', rev: `₹${((accountsSummary?.totalRevenue || 128500) + payments.reduce((acc, p) => acc + (p.amount || 0), 0)).toLocaleString('en-IN')}`, reg: `${Math.max(membersList.length, 37)} members`, ret: '95.1%', peak: '134 athletes', status: 'Target Met' },
                    { month: 'August 2026', rev: '₹1,22,000', reg: '25 members', ret: '94.2%', peak: '128 athletes', status: 'Target Met' },
                    { month: 'July 2026', rev: '₹1,14,000', reg: '21 members', ret: '94.0%', peak: '120 athletes', status: 'Surging Growth' },
                    { month: 'June 2026', rev: '₹1,05,000', reg: '18 members', ret: '93.4%', peak: '115 athletes', status: 'Surging Growth' },
                    { month: 'May 2026', rev: '₹92,000', reg: '15 members', ret: '92.8%', peak: '108 athletes', status: 'Optimal' },
                    { month: 'April 2026', rev: '₹79,000', reg: '12 members', ret: '91.5%', peak: '98 athletes', status: 'Optimal' }
                  ].map((row, idx) => (
                    <tr key={idx}>
                      <td><strong style={{ color: 'var(--text-white)' }}>{row.month}</strong></td>
                      <td><strong style={{ color: 'var(--accent-volt)' }}>{row.rev}</strong></td>
                      <td>{row.reg}</td>
                      <td><span style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>{row.ret}</span></td>
                      <td>{row.peak}</td>
                      <td>
                        <span style={{
                          padding: '0.2rem 0.6rem',
                          borderRadius: '4px',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          background: row.status === 'Target Met' ? 'rgba(0, 255, 102, 0.15)' : 'rgba(0, 240, 255, 0.15)',
                          color: row.status === 'Target Met' ? '#00ff66' : 'var(--accent-cyan)',
                          border: `1px solid ${row.status === 'Target Met' ? 'rgba(0, 255, 102, 0.3)' : 'rgba(0, 240, 255, 0.3)'}`
                        }}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
          {(() => {
            const membershipVal = Math.round(accountsSummary?.membershipRevenue || 0);
            const supplementVal = Math.round(accountsSummary?.supplementRevenue || 0);
            const trainerVal = Math.round(accountsSummary?.trainerRevenue || 0);
            const totalGrossVal = membershipVal + supplementVal + trainerVal;

            return (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.2rem', marginBottom: '1.5rem' }}>
                <div className="db-card" style={{ padding: '1.4rem', borderLeft: '4px solid var(--accent-volt)' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Total Gross Revenue</span>
                  <h3 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-white)', margin: '0.3rem 0 0 0' }}>
                    ₹{totalGrossVal.toLocaleString('en-IN')}
                  </h3>
                  <span style={{ fontSize: '0.72rem', color: '#10b981', marginTop: '0.2rem', display: 'block' }}>
                    ✓ Verified collections across all portals
                  </span>
                </div>

                <div className="db-card" style={{ padding: '1.4rem', borderLeft: '4px solid var(--accent-cyan)' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Membership Subscriptions</span>
                  <h3 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-white)', margin: '0.3rem 0 0 0' }}>
                    ₹{membershipVal.toLocaleString('en-IN')}
                  </h3>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'block' }}>
                    Keycard passes & renewals
                  </span>
                </div>

                <div className="db-card" style={{ padding: '1.4rem', borderLeft: '4px solid #f59e0b' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Supplement Store Sales</span>
                  <h3 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-white)', margin: '0.3rem 0 0 0' }}>
                    ₹{supplementVal.toLocaleString('en-IN')}
                  </h3>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'block' }}>
                    Protein, Creatine & Stack orders
                  </span>
                </div>

                <div className="db-card" style={{ padding: '1.4rem', borderLeft: '4px solid #8b5cf6' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Personal Coach Bookings</span>
                  <h3 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-white)', margin: '0.3rem 0 0 0' }}>
                    ₹{trainerVal.toLocaleString('en-IN')}
                  </h3>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'block' }}>
                    1-on-1 coaching mentorships
                  </span>
                </div>
              </div>
            );
          })()}

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
                          <span
                            className="status-badge"
                            style={{
                              fontSize: '0.68rem',
                              padding: '0.2rem 0.6rem',
                              borderRadius: '4px',
                              fontWeight: 800,
                              textTransform: 'uppercase',
                              background: pay.status === 'paid'
                                ? 'rgba(0, 255, 102, 0.15)'
                                : pay.status === 'pending'
                                ? 'rgba(255, 159, 0, 0.15)'
                                : 'rgba(0, 240, 255, 0.15)',
                              color: pay.status === 'paid'
                                ? '#00ff66'
                                : pay.status === 'pending'
                                ? '#ff9f00'
                                : 'var(--accent-cyan)',
                              border: `1px solid ${pay.status === 'paid' ? 'rgba(0, 255, 102, 0.3)' : pay.status === 'pending' ? 'rgba(255, 159, 0, 0.3)' : 'rgba(0, 240, 255, 0.3)'}`
                            }}
                          >
                            {pay.status === 'paid' ? 'PAID ✓' : pay.status === 'pending' ? 'PENDING (COD) ⏳' : pay.status === 'billed_to_account' ? 'MEMBER BILLED ⚡' : String(pay.status || 'PAID').toUpperCase()}
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
                      style={{ background: 'var(--bg-dark)', border: '1px solid var(--border-color)', color: 'var(--text-white)', width: '100%', padding: '0.6rem' }}
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
                <div style={{ background: 'var(--bg-dark)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.9rem', marginBottom: '1rem', fontSize: '0.8rem' }}>
                  <strong style={{ color: 'var(--accent-volt)', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Customer & Delivery Info:</strong>
                  <div style={{ color: 'var(--text-white)' }}><strong>{selectedAdminOrder.userName}</strong> ({selectedAdminOrder.userPhone || 'N/A'}) — {selectedAdminOrder.userEmail}</div>
                  {selectedAdminOrder.shippingInfo && (
                    <div style={{ color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                      Address: {selectedAdminOrder.shippingInfo.address}, {selectedAdminOrder.shippingInfo.city}, {selectedAdminOrder.shippingInfo.state} - {selectedAdminOrder.shippingInfo.pincode}
                    </div>
                  )}
                </div>

                {/* Items List */}
                <div style={{ background: 'var(--bg-dark)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.9rem', marginBottom: '1rem' }}>
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
                <div key={item.id} className="equipment-card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                  <div style={{ height: '140px', background: 'var(--bg-dark)', borderBottom: '1px solid var(--border-color)', overflow: 'hidden', position: 'relative' }}>
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
            {/* Trainer Attendance Board Terminal Card */}
            <div className="db-card flex-card" style={{ height: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ textTransform: 'uppercase', fontSize: '1rem', fontWeight: 800, margin: 0, color: 'var(--text-white)' }}>
                  🏋️ Trainer Attendance Board
                </h4>
                <span style={{ fontSize: '0.68rem', background: 'rgba(0, 240, 255, 0.12)', color: 'var(--accent-cyan)', border: '1px solid rgba(0, 240, 255, 0.3)', padding: '0.2rem 0.6rem', borderRadius: '4px', fontWeight: 800 }}>
                  ● Staff Terminal
                </span>
              </div>
              <p className="card-subtitle" style={{ margin: '0.3rem 0 0 0', fontSize: '0.8rem' }}>
                Clock-in certified coaches, verify shift duty attendance, and log active mentorship hours.
              </p>
              
              <form onSubmit={handleTrainerAttendanceSubmit} id="admin-trainer-attendance-form" style={{ marginTop: '1.2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="sim-trainer-select" style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                    Select Personal Coach / Trainer
                  </label>
                  <select
                    id="sim-trainer-select"
                    className="form-input"
                    value={simTrainer}
                    onChange={(e) => setSimTrainer(e.target.value)}
                    style={{ background: 'var(--bg-black)', border: '1px solid var(--border-color)', color: 'var(--text-white)', padding: '0.65rem' }}
                  >
                    {trainersList.length === 0 ? (
                      <option value="Coach Keerthan">Coach Keerthan (CSCS Master Trainer)</option>
                    ) : (
                      trainersList.map((t, idx) => (
                        <option key={idx} value={t.name}>
                          {t.name.startsWith('Coach') ? t.name : `Coach ${t.name}`} ({t.specialty || 'Certified Trainer'})
                        </option>
                      ))
                    )}
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label" htmlFor="sim-trainer-action" style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                    Shift Duty Action
                  </label>
                  <select
                    id="sim-trainer-action"
                    className="form-input"
                    value={simTrainerAction}
                    onChange={(e) => setSimTrainerAction(e.target.value)}
                    style={{ background: 'var(--bg-black)', border: '1px solid var(--border-color)', color: 'var(--text-white)', padding: '0.65rem' }}
                  >
                    <option value="check-in">🌅 Duty Clock-In (Morning Shift)</option>
                    <option value="evening-in">🌙 Duty Clock-In (Evening Shift)</option>
                    <option value="check-out">🏁 Duty Clock-Out (End Shift)</option>
                    <option value="session-complete">⚡ 1-on-1 Mentorship Session Completed</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="sim-trainer-notes" style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                    Shift Specialization / Duty Notes
                  </label>
                  <input
                    type="text"
                    id="sim-trainer-notes"
                    className="form-input"
                    placeholder="e.g. Floor Supervision & Client Assessment"
                    value={trainerAttNote}
                    onChange={(e) => setTrainerAttNote(e.target.value)}
                    style={{ background: 'var(--bg-black)', border: '1px solid var(--border-color)', color: 'var(--text-white)', padding: '0.6rem' }}
                  />
                </div>
                
                <button type="submit" className="glow-btn" style={{ padding: '0.75rem', fontSize: '0.85rem', marginTop: '0.3rem', width: '100%', fontWeight: 800 }}>
                  Log Trainer Attendance ⏱️
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
          <div className="db-card" style={{ width: '100%', maxWidth: '540px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.8rem', position: 'relative' }}>
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
                  style={{ width: '100%', background: 'var(--bg-dark)', border: '1px solid var(--border-color)', color: 'var(--text-white)', padding: '0.6rem 0.8rem', borderRadius: '6px', fontSize: '0.85rem' }}
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
                  style={{ width: '100%', background: 'var(--bg-dark)', border: '1px solid var(--border-color)', color: 'var(--text-white)', padding: '0.6rem 0.8rem', borderRadius: '6px', fontSize: '0.85rem' }}
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
                    style={{ width: '100%', background: 'var(--bg-dark)', border: '1px solid var(--border-color)', color: 'var(--text-white)', padding: '0.6rem 0.8rem', borderRadius: '6px', fontSize: '0.85rem' }}
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
                    style={{ width: '100%', background: 'var(--bg-dark)', border: '1px solid var(--border-color)', color: 'var(--text-white)', padding: '0.6rem 0.8rem', borderRadius: '6px', fontSize: '0.85rem' }}
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
                      background: 'var(--bg-dark)',
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
                        background: 'var(--bg-dark)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-white)',
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
                  style={{ width: '100%', background: 'var(--bg-dark)', border: '1px solid var(--border-color)', color: 'var(--text-white)', padding: '0.6rem 0.8rem', borderRadius: '6px', fontSize: '0.82rem', fontFamily: 'monospace' }}
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
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="🔍 Search member by name, email, phone, RFID, trainer..."
                value={memberSearchQuery}
                onChange={(e) => setMemberSearchQuery(e.target.value)}
                style={{
                  flexGrow: 1,
                  maxWidth: '360px',
                  background: 'var(--bg-dark)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-white)',
                  padding: '0.6rem 1rem',
                  borderRadius: '6px',
                  fontSize: '0.85rem'
                }}
              />

              <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>Plan:</span>
                  <select
                    value={filterPlan}
                    onChange={(e) => setFilterPlan(e.target.value)}
                    style={{
                      background: 'var(--bg-dark)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-white)',
                      padding: '0.5rem 0.8rem',
                      borderRadius: '6px',
                      fontSize: '0.82rem'
                    }}
                  >
                    <option value="All">All Membership Tiers</option>
                    <option value="Muscle Core (Monthly)">Muscle Core (Monthly) - ₹800/mo</option>
                    <option value="Muscle Pro (6-Month)">Muscle Pro (6-Month) - ₹3,500/6 mos</option>
                    <option value="Muscle Elite (Yearly)">Muscle Elite (Yearly) - ₹7,500/yr</option>
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>Status:</span>
                  <select
                    value={filterMemberStatus}
                    onChange={(e) => setFilterMemberStatus(e.target.value)}
                    style={{
                      background: 'var(--bg-dark)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-white)',
                      padding: '0.5rem 0.8rem',
                      borderRadius: '6px',
                      fontSize: '0.82rem'
                    }}
                  >
                    <option value="All">All Statuses</option>
                    <option value="Active">Active</option>
                    <option value="Pending">Pending</option>
                    <option value="Expired">Expired</option>
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>Sort By:</span>
                  <select
                    value={`${memberSortField}-${memberSortDir}`}
                    onChange={(e) => {
                      const [field, dir] = e.target.value.split('-');
                      setMemberSortField(field);
                      setMemberSortDir(dir);
                    }}
                    style={{
                      background: 'var(--bg-dark)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--accent-volt)',
                      padding: '0.5rem 0.8rem',
                      borderRadius: '6px',
                      fontSize: '0.82rem',
                      fontWeight: 700
                    }}
                  >
                    <option value="name-asc">Name (A-Z)</option>
                    <option value="name-desc">Name (Z-A)</option>
                    <option value="plan-desc">Plan Tier (Highest First)</option>
                    <option value="plan-asc">Plan Tier (Lowest First)</option>
                    <option value="status-asc">Status (Active First)</option>
                    <option value="joinDate-desc">Joined Date (Newest First)</option>
                    <option value="joinDate-asc">Joined Date (Oldest First)</option>
                    <option value="trainer-asc">Assigned Trainer</option>
                    <option value="rfid-asc">RFID Code</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Members Directory Table */}
            <div className="table-wrapper">
              <table className="db-table" id="admin-members-table">
                <thead>
                  <tr>
                    <th onClick={() => handleMemberSortToggle('name')} style={{ cursor: 'pointer', userSelect: 'none' }} title="Click to sort by Name">
                      Member Profile {memberSortField === 'name' ? (memberSortDir === 'asc' ? '▲' : '▼') : '↕'}
                    </th>
                    <th onClick={() => handleMemberSortToggle('email')} style={{ cursor: 'pointer', userSelect: 'none' }} title="Click to sort by Email">
                      Contact Info {memberSortField === 'email' ? (memberSortDir === 'asc' ? '▲' : '▼') : '↕'}
                    </th>
                    <th onClick={() => handleMemberSortToggle('plan')} style={{ cursor: 'pointer', userSelect: 'none' }} title="Click to sort by Plan">
                      Membership Plan {memberSortField === 'plan' ? (memberSortDir === 'asc' ? '▲' : '▼') : '↕'}
                    </th>
                    <th onClick={() => handleMemberSortToggle('status')} style={{ cursor: 'pointer', userSelect: 'none' }} title="Click to sort by Status">
                      Status {memberSortField === 'status' ? (memberSortDir === 'asc' ? '▲' : '▼') : '↕'}
                    </th>
                    <th onClick={() => handleMemberSortToggle('joinDate')} style={{ cursor: 'pointer', userSelect: 'none' }} title="Click to sort by Joined Date">
                      Joining Date {memberSortField === 'joinDate' ? (memberSortDir === 'asc' ? '▲' : '▼') : '↕'}
                    </th>
                    <th onClick={() => handleMemberSortToggle('trainer')} style={{ cursor: 'pointer', userSelect: 'none' }} title="Click to sort by Assigned Trainer">
                      Assigned Trainer {memberSortField === 'trainer' ? (memberSortDir === 'asc' ? '▲' : '▼') : '↕'}
                    </th>
                    <th onClick={() => handleMemberSortToggle('rfid')} style={{ cursor: 'pointer', userSelect: 'none' }} title="Click to sort by RFID">
                      RFID Code {memberSortField === 'rfid' ? (memberSortDir === 'asc' ? '▲' : '▼') : '↕'}
                    </th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const filteredMembers = membersList.filter((m) => {
                      const q = memberSearchQuery.toLowerCase().trim();
                      const matchesSearch = !q || (
                        (m.name || '').toLowerCase().includes(q) ||
                        (m.email || '').toLowerCase().includes(q) ||
                        (m.phone || '').toLowerCase().includes(q) ||
                        (m.rfid || '').toLowerCase().includes(q) ||
                        (m.plan || '').toLowerCase().includes(q) ||
                        (m.trainer || '').toLowerCase().includes(q) ||
                        (m.status || '').toLowerCase().includes(q)
                      );

                      const p = (m.plan || '').toLowerCase();
                      const fP = filterPlan.toLowerCase();
                      let matchesPlan = true;
                      if (filterPlan !== 'All') {
                        if (fP.includes('core')) matchesPlan = p.includes('core') || p.includes('monthly') || p.includes('basic');
                        else if (fP.includes('pro')) matchesPlan = p.includes('pro') || p.includes('6-month');
                        else if (fP.includes('elite')) matchesPlan = p.includes('elite') || p.includes('yearly') || p.includes('annual');
                        else matchesPlan = p.includes(fP) || m.plan === filterPlan;
                      }

                      let matchesStatus = true;
                      if (filterMemberStatus !== 'All') {
                        matchesStatus = (m.status || '').toLowerCase() === filterMemberStatus.toLowerCase();
                      }

                      return matchesSearch && matchesPlan && matchesStatus;
                    });

                    const sortedMembers = [...filteredMembers].sort((a, b) => {
                      let valA = '';
                      let valB = '';

                      if (memberSortField === 'name') {
                        valA = (a.name || '').toLowerCase();
                        valB = (b.name || '').toLowerCase();
                      } else if (memberSortField === 'email') {
                        valA = (a.email || '').toLowerCase();
                        valB = (b.email || '').toLowerCase();
                      } else if (memberSortField === 'plan') {
                        const getRank = (planStr) => {
                          const planVal = (planStr || '').toLowerCase();
                          if (planVal.includes('core') || planVal.includes('monthly') || planVal.includes('basic')) return 1;
                          if (planVal.includes('pro') || planVal.includes('6-month')) return 2;
                          if (planVal.includes('elite') || planVal.includes('yearly') || planVal.includes('annual')) return 3;
                          return 0;
                        };
                        valA = getRank(a.plan);
                        valB = getRank(b.plan);
                      } else if (memberSortField === 'status') {
                        valA = (a.status || '').toLowerCase();
                        valB = (b.status || '').toLowerCase();
                      } else if (memberSortField === 'joinDate') {
                        valA = new Date(a.joinDate || 0).getTime() || 0;
                        valB = new Date(b.joinDate || 0).getTime() || 0;
                      } else if (memberSortField === 'trainer') {
                        valA = (a.trainer || '').toLowerCase();
                        valB = (b.trainer || '').toLowerCase();
                      } else if (memberSortField === 'rfid') {
                        valA = (a.rfid || '').toLowerCase();
                        valB = (b.rfid || '').toLowerCase();
                      }

                      if (valA < valB) return memberSortDir === 'asc' ? -1 : 1;
                      if (valA > valB) return memberSortDir === 'asc' ? 1 : -1;
                      return 0;
                    });

                    if (sortedMembers.length === 0) {
                      return (
                        <tr>
                          <td colSpan="8" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-white)', marginBottom: '0.4rem' }}>
                              No Registered Members Found
                            </div>
                            <p style={{ fontSize: '0.8rem', margin: 0 }}>
                              No members match the current search or filter criteria. Clear search or adjust filter selection above!
                            </p>
                          </td>
                        </tr>
                      );
                    }

                    return sortedMembers.map((m) => {
                      const getPlanPrice = (planName) => {
                        const p = (planName || '').toLowerCase();
                        if (p.includes('core') || p.includes('monthly') || p.includes('basic')) return '₹800/mo';
                        if (p.includes('elite') || p.includes('yearly') || p.includes('annual')) return '₹7,500/yr';
                        return '₹3,500/6 mos';
                      };

                      return (
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
                            <span style={{ fontSize: '0.72rem', color: 'var(--accent-volt)', display: 'block', fontWeight: 700 }}>{getPlanPrice(m.plan)}</span>
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
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}>
                              <span style={{ color: 'var(--accent-volt)' }}>🏋️</span>
                              <span style={{ fontWeight: 700, color: m.trainer && !m.trainer.includes('No Trainer') ? '#ff9f00' : 'var(--text-muted)' }}>
                                {m.trainer || 'No Trainer Assigned'}
                              </span>
                            </div>
                          </td>
                          <td>
                            <span style={{ fontFamily: 'monospace', fontWeight: 800, color: 'var(--accent-cyan)', background: 'rgba(0,240,255,0.08)', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid rgba(0,240,255,0.2)' }}>
                              {m.rfid || 'RF-8000'}
                            </span>
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
                      );
                    });
                  })()}
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
                <p className="card-subtitle" style={{ margin: 0 }}>Manage certified coaches, view specializations, qualifications, assigned roster members, and total earnings</p>
              </div>
              <button
                onClick={() => setIsAddTrainerOpen(true)}
                style={{
                  background: 'var(--accent-volt)',
                  color: '#000',
                  border: 'none',
                  padding: '0.6rem 1.2rem',
                  borderRadius: '6px',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(198, 255, 0, 0.3)'
                }}
              >
                + Register New Trainer
              </button>
            </div>

            {/* Filter & Search Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="🔍 Search trainers by name, email, specialty, certs, or client name..."
                value={trainerSearchQuery}
                onChange={(e) => setTrainerSearchQuery(e.target.value)}
                style={{
                  flexGrow: 1,
                  maxWidth: '380px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border-color)',
                  color: '#fff',
                  padding: '0.6rem 1rem',
                  borderRadius: '6px',
                  fontSize: '0.85rem'
                }}
              />

              <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>Specialization:</span>
                  <select
                    value={filterSpecialty}
                    onChange={(e) => setFilterSpecialty(e.target.value)}
                    style={{
                      background: 'var(--bg-dark)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-white)',
                      padding: '0.5rem 0.8rem',
                      borderRadius: '6px',
                      fontSize: '0.82rem'
                    }}
                  >
                    <option value="All">All Specializations</option>
                    <option value="strength">Strength & Power</option>
                    <option value="hiit">HIIT & Cardio</option>
                    <option value="combat">Combat & Boxing</option>
                    <option value="yoga">Yoga & Mobility</option>
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>Sort By:</span>
                  <select
                    value={`${trainerSortField}-${trainerSortDir}`}
                    onChange={(e) => {
                      const [field, dir] = e.target.value.split('-');
                      setTrainerSortField(field);
                      setTrainerSortDir(dir);
                    }}
                    style={{
                      background: 'var(--bg-dark)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--accent-volt)',
                      padding: '0.5rem 0.8rem',
                      borderRadius: '6px',
                      fontSize: '0.82rem',
                      fontWeight: 700
                    }}
                  >
                    <option value="name-asc">Trainer Name (A-Z)</option>
                    <option value="name-desc">Trainer Name (Z-A)</option>
                    <option value="earnings-desc">Coaching Earnings (High to Low)</option>
                    <option value="earnings-asc">Coaching Earnings (Low to High)</option>
                    <option value="clients-desc">Assigned Clients (Most First)</option>
                    <option value="clients-asc">Assigned Clients (Least First)</option>
                    <option value="specialty-asc">Specialization (A-Z)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Trainers Directory Table */}
            <div className="table-wrapper">
              <table className="db-table" id="admin-trainers-table">
                <thead>
                  <tr>
                    <th onClick={() => handleTrainerSortToggle('name')} style={{ cursor: 'pointer', userSelect: 'none' }} title="Click to sort by Name">
                      Trainer Profile {trainerSortField === 'name' ? (trainerSortDir === 'asc' ? '▲' : '▼') : '↕'}
                    </th>
                    <th onClick={() => handleTrainerSortToggle('email')} style={{ cursor: 'pointer', userSelect: 'none' }} title="Click to sort by Email">
                      Contact Info {trainerSortField === 'email' ? (trainerSortDir === 'asc' ? '▲' : '▼') : '↕'}
                    </th>
                    <th onClick={() => handleTrainerSortToggle('specialty')} style={{ cursor: 'pointer', userSelect: 'none' }} title="Click to sort by Specialty">
                      Coaching Specialization {trainerSortField === 'specialty' ? (trainerSortDir === 'asc' ? '▲' : '▼') : '↕'}
                    </th>
                    <th>Certifications & Experience</th>
                    <th onClick={() => handleTrainerSortToggle('clients')} style={{ cursor: 'pointer', userSelect: 'none' }} title="Click to sort by Clients Count">
                      Assigned Clients {trainerSortField === 'clients' ? (trainerSortDir === 'asc' ? '▲' : '▼') : '↕'}
                    </th>
                    <th onClick={() => handleTrainerSortToggle('earnings')} style={{ cursor: 'pointer', userSelect: 'none' }} title="Click to sort by Monthly Earnings">
                      Monthly Coaching Earnings {trainerSortField === 'earnings' ? (trainerSortDir === 'asc' ? '▲' : '▼') : '↕'}
                    </th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const getClientsCount = (tr) => {
                      return membersList.filter(m => 
                        (m.trainer || '').toLowerCase().includes(tr.name.toLowerCase()) || 
                        (tr.name.toLowerCase().includes('marcus') && ((m.trainer || '').toLowerCase().includes('marcus') || !m.trainer))
                      ).length;
                    };

                    const getEarnings = (tr) => {
                      const trNameLower = (tr.name || '').toLowerCase();
                      
                      // 1. Direct paid booking fees for this trainer from transactions / receipts
                      const directBookings = (adminTransactions || []).reduce((sum, tx) => {
                        const isPaid = (tx.status || '').toLowerCase() === 'paid';
                        const pType = (tx.paymentType || tx.category || '').toLowerCase();
                        const titleStr = (tx.title || tx.desc || tx.plan || '').toLowerCase();
                        const trMeta = (tx.metadata && tx.metadata.trainerName ? tx.metadata.trainerName : '').toLowerCase();

                        const isTrainerBooking = pType.includes('trainer') || titleStr.includes('hire coach') || titleStr.includes('coaching');
                        const matchesTrainer = titleStr.includes(trNameLower) || trMeta.includes(trNameLower) || (trNameLower.includes('marcus') && (titleStr.includes('marcus') || trMeta.includes('marcus')));

                        if (isPaid && isTrainerBooking && matchesTrainer) {
                          const val = typeof tx.amount === 'number' ? tx.amount : parseFloat(String(tx.amount).replace(/[^0-9.]/g, '')) || 0;
                          return sum + val;
                        }
                        return sum;
                      }, 0);

                      // 2. Membership revenue share from assigned roster members
                      const assigned = membersList.filter(m => 
                        (m.trainer || '').toLowerCase().includes(trNameLower) || 
                        (trNameLower.includes('marcus') && ((m.trainer || '').toLowerCase().includes('marcus') || !m.trainer))
                      );

                      const recurringShare = assigned.reduce((acc, m) => {
                        const planVal = (m.plan || '').toLowerCase();
                        if (planVal.includes('elite') || planVal.includes('yearly')) return acc + 625;
                        if (planVal.includes('pro') || planVal.includes('6-month')) return acc + 583;
                        return acc + 800;
                      }, 0);

                      return directBookings > 0 ? (directBookings + recurringShare) : recurringShare;
                    };

                    const filteredTrainers = trainersList.filter((t) => {
                      const q = trainerSearchQuery.toLowerCase().trim();
                      const trClean = t.name.toLowerCase().replace('coach ', '').trim();
                      const assignedMembers = membersList.filter(m => {
                        const mTr = (m.trainer || '').toLowerCase();
                        if (!mTr) return trClean.includes('marcus');
                        return mTr.includes(trClean) || trClean.includes(mTr.replace('coach ', '').trim());
                      });
                      const clientNames = assignedMembers.map(m => m.name).join(' ').toLowerCase();

                      const matchesSearch = !q || (
                        (t.name || '').toLowerCase().includes(q) ||
                        (t.email || '').toLowerCase().includes(q) ||
                        (t.specialty || '').toLowerCase().includes(q) ||
                        (t.certifications || '').toLowerCase().includes(q) ||
                        clientNames.includes(q)
                      );

                      let matchesSpecialty = true;
                      if (filterSpecialty !== 'All') {
                        matchesSpecialty = (t.specialty || '').toLowerCase().includes(filterSpecialty.toLowerCase());
                      }

                      return matchesSearch && matchesSpecialty;
                    });

                    const sortedTrainers = [...filteredTrainers].sort((a, b) => {

                      let valA = '';
                      let valB = '';

                      if (trainerSortField === 'name') {
                        valA = (a.name || '').toLowerCase();
                        valB = (b.name || '').toLowerCase();
                      } else if (trainerSortField === 'email') {
                        valA = (a.email || '').toLowerCase();
                        valB = (b.email || '').toLowerCase();
                      } else if (trainerSortField === 'specialty') {
                        valA = (a.specialty || '').toLowerCase();
                        valB = (b.specialty || '').toLowerCase();
                      } else if (trainerSortField === 'clients') {
                        valA = getClientsCount(a);
                        valB = getClientsCount(b);
                      } else if (trainerSortField === 'earnings') {
                        valA = getEarnings(a);
                        valB = getEarnings(b);
                      }

                      if (valA < valB) return trainerSortDir === 'asc' ? -1 : 1;
                      if (valA > valB) return trainerSortDir === 'asc' ? 1 : -1;
                      return 0;
                    });

                    if (sortedTrainers.length === 0) {
                      return (
                        <tr>
                          <td colSpan="7" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-white)', marginBottom: '0.4rem' }}>
                              No Registered Trainers Found
                            </div>
                            <p style={{ fontSize: '0.8rem', margin: 0 }}>
                              No trainers match the current search or specialization filter. Register a new trainer via "+ Register New Trainer" button above!
                            </p>
                          </td>
                        </tr>
                      );
                    }

                    return sortedTrainers.map((t, idx) => {
                      const trClean = t.name.toLowerCase().replace('coach ', '').trim();
                      const assignedMembers = membersList.filter(m => {
                        const mTr = (m.trainer || '').toLowerCase();
                        if (!mTr) return trClean.includes('marcus');
                        return mTr.includes(trClean) || trClean.includes(mTr.replace('coach ', '').trim());
                      });
                      const clientCount = assignedMembers.length;
                      const totalEarnings = getEarnings(t);

                      const formattedClientNames = assignedMembers.map(m => (m.name === 'The PC Workshop' ? 'Jeery' : m.name)).join(', ');

                      return (
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
                          <td>
                            <div style={{ fontSize: '0.8rem', color: clientCount > 0 ? 'var(--accent-cyan)' : 'var(--text-muted)', fontWeight: 700 }}>
                              👥 {clientCount} Assigned Member{clientCount === 1 ? '' : 's'}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                              {formattedClientNames || 'No Active Clients'}
                            </div>
                          </td>
                          <td>
                            <span style={{
                              padding: '0.25rem 0.65rem',
                              borderRadius: '4px',
                              fontSize: '0.78rem',
                              fontWeight: 800,
                              background: clientCount > 0 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                              color: clientCount > 0 ? '#10B981' : 'var(--text-muted)',
                              border: `1px solid ${clientCount > 0 ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-color)'}`
                            }}>
                              ₹{totalEarnings.toLocaleString('en-IN')} / mo
                            </span>
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
                      );
                    });
                  })()}
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
                    placeholder="e.g. Independence Day Holiday Closure"
                    value={newAlertTitle}
                    onChange={(e) => setNewAlertTitle(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'var(--bg-dark)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-white)',
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
                      background: 'var(--bg-dark)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-white)',
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
                      background: 'var(--bg-dark)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-white)',
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
                  disabled={isBroadcasting}
                  style={{
                    padding: '0.8rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    background: isBroadcasting ? '#475569' : '#ff5e00',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: isBroadcasting ? 'not-allowed' : 'pointer',
                    boxShadow: isBroadcasting ? 'none' : '0 4px 14px rgba(255, 94, 0, 0.4)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {isBroadcasting ? 'Broadcasting & Dispatching EmailJS Emails... ⚡' : 'Broadcast Message 📢'}
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
                    <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-white)' }}>No Active Broadcast Messages</p>
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
          <div className="db-card" style={{ width: '100%', maxWidth: '540px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.8rem', position: 'relative' }}>
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
                  style={{ width: '100%', background: 'var(--bg-dark)', border: '1px solid var(--border-color)', color: 'var(--text-white)', padding: '0.6rem 0.8rem', borderRadius: '6px', fontSize: '0.85rem' }}
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
                    style={{ width: '100%', background: 'var(--bg-dark)', border: '1px solid var(--border-color)', color: 'var(--text-white)', padding: '0.6rem 0.8rem', borderRadius: '6px', fontSize: '0.85rem' }}
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
                    style={{ width: '100%', background: 'var(--bg-dark)', border: '1px solid var(--border-color)', color: 'var(--text-white)', padding: '0.6rem 0.8rem', borderRadius: '6px', fontSize: '0.85rem' }}
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
                    style={{ width: '100%', background: 'var(--bg-dark)', border: '1px solid var(--border-color)', color: 'var(--text-white)', padding: '0.6rem 0.8rem', borderRadius: '6px', fontSize: '0.85rem' }}
                  >
                    <option value="Muscle Core (Monthly)">Muscle Core (Monthly) - ₹800/mo</option>
                    <option value="Muscle Pro (6-Month)">Muscle Pro (6-Month) - ₹3,500/6 mos</option>
                    <option value="Muscle Elite (Yearly)">Muscle Elite (Yearly) - ₹7,500/yr</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-white)', display: 'block', marginBottom: '0.35rem', fontWeight: 700 }}>
                    Membership Status *
                  </label>
                  <select
                    value={newMemStatus}
                    onChange={(e) => setNewMemStatus(e.target.value)}
                    style={{ width: '100%', background: 'var(--bg-dark)', border: '1px solid var(--border-color)', color: 'var(--text-white)', padding: '0.6rem 0.8rem', borderRadius: '6px', fontSize: '0.85rem' }}
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
                    style={{ width: '100%', background: 'var(--bg-dark)', border: '1px solid var(--border-color)', color: 'var(--text-white)', padding: '0.6rem 0.8rem', borderRadius: '6px', fontSize: '0.85rem' }}
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
                    style={{ width: '100%', background: 'var(--bg-dark)', border: '1px solid var(--border-color)', color: 'var(--accent-cyan)', padding: '0.6rem 0.8rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 700 }}
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

      {/* ADD TRAINER MODAL */}
      {isAddTrainerOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div style={{
            background: 'var(--bg-card, #12121c)',
            border: '1px solid var(--accent-volt)',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '500px',
            padding: '1.8rem',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.8)',
            color: 'var(--text-white, #ffffff)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
              <h3 style={{ margin: 0, color: 'var(--accent-volt)', fontSize: '1.3rem', textTransform: 'uppercase', fontWeight: 800 }}>
                🏋️ Register Certified Trainer
              </h3>
              <button
                onClick={() => setIsAddTrainerOpen(false)}
                style={{ background: 'none', border: 'none', color: '#ff5555', fontSize: '1.4rem', cursor: 'pointer', fontWeight: 800 }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddTrainerSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                  Trainer Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Coach Marcus Vance"
                  value={newTrName}
                  onChange={(e) => setNewTrName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.7rem 0.9rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-color, rgba(255, 255, 255, 0.15))',
                    borderRadius: '6px',
                    color: 'var(--text-white, #ffffff)',
                    fontSize: '0.9rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                  Email Address (Login ID) *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. trainer@apex.com"
                  value={newTrEmail}
                  onChange={(e) => setNewTrEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.7rem 0.9rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-color, rgba(255, 255, 255, 0.15))',
                    borderRadius: '6px',
                    color: 'var(--text-white, #ffffff)',
                    fontSize: '0.9rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                  Coaching Specialization *
                </label>
                <select
                  value={newTrSpecialty}
                  onChange={(e) => setNewTrSpecialty(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.7rem 0.9rem',
                    background: 'var(--bg-card, #12121c)',
                    border: '1px solid var(--border-color, rgba(255, 255, 255, 0.15))',
                    borderRadius: '6px',
                    color: 'var(--text-white, #ffffff)',
                    fontSize: '0.9rem'
                  }}
                >
                  <option value="strength">💪 Strength & Powerlifting</option>
                  <option value="hiit">⚡ HIIT & Athletic Conditioning</option>
                  <option value="yoga">🧘 Yoga, Mobility & Posture</option>
                  <option value="combat">🥊 Combat & Boxing</option>
                  <option value="bodybuilding">🏆 Bodybuilding & Hypertrophy</option>
                </select>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                  Certifications & Experience
                </label>
                <input
                  type="text"
                  placeholder="e.g. ISSA Master Trainer, CSCS (6 yrs)"
                  value={newTrCerts}
                  onChange={(e) => setNewTrCerts(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.7rem 0.9rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-color, rgba(255, 255, 255, 0.15))',
                    borderRadius: '6px',
                    color: 'var(--text-white, #ffffff)',
                    fontSize: '0.9rem'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem' }}>
                <button
                  type="button"
                  onClick={() => setIsAddTrainerOpen(false)}
                  style={{
                    padding: '0.6rem 1.2rem',
                    background: 'transparent',
                    border: '1px solid var(--border-color, rgba(255, 255, 255, 0.2))',
                    color: 'var(--text-white, #ffffff)',
                    borderRadius: '6px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '0.6rem 1.4rem',
                    background: 'var(--accent-volt)',
                    color: '#000',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  Save Trainer
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
