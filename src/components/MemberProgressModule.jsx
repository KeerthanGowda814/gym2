import React, { useState, useEffect } from 'react';
import { progressApi } from '../services/progressApi';
import { CustomSwal } from '../utils/swal';

export default function MemberProgressModule({ currentUser, onNavigateSubView }) {
  const [activeTab, setActiveTab] = useState('daily'); // 'daily', 'photos', 'reports'
  const userEmail = currentUser?.email || 'member@apex.com';
  const userName = currentUser?.name || 'Ethan Hunt';

  // --- 1. DAILY ACTIVITIES STATE ---
  const [activities, setActivities] = useState([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(true);
  const [showLogModal, setShowLogModal] = useState(false);
  const [isSubmittingLog, setIsSubmittingLog] = useState(false);

  // New activity form
  const [logForm, setLogForm] = useState({
    workoutTitle: '',
    category: 'Strength Training',
    targetWorkouts: 5,
    completedWorkouts: 5,
    durationMinutes: 60,
    caloriesBurned: 500,
    intensity: 'High',
    workoutPhoto: null,
    notes: '',
    date: new Date().toISOString().split('T')[0],
    exercises: [
      { name: 'Barbell Bench Press', sets: 4, reps: 8, weight: '200 lbs' },
      { name: 'Incline Dumbbell Press', sets: 3, reps: 10, weight: '70 lbs DBs' }
    ]
  });

  // Photo viewer lightbox
  const [lightboxPhoto, setLightboxPhoto] = useState(null);

  // --- 2. PROGRESS PHOTOS STATE ---
  const [photos, setPhotos] = useState([]);
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(true);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const [photoForm, setPhotoForm] = useState({
    weekNumber: 'Week 1',
    isBefore: false,
    isCurrent: true,
    frontPhoto: null,
    sidePhoto: null,
    backPhoto: null,
    bodyWeight: 175,
    weightUnit: 'lbs',
    bodyFatPercentage: '',
    chest: '',
    waist: '',
    arms: '',
    thighs: '',
    notes: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Date-wise comparison state
  const [selectedAngle, setSelectedAngle] = useState('front'); // 'front', 'side', 'back'
  const [compareDateA, setCompareDateA] = useState('');
  const [compareDateB, setCompareDateB] = useState('');

  // --- 3. PROGRESS REPORTS STATE ---
  const [reportPeriod, setReportPeriod] = useState('1m'); // '1m', '3m', '6m', '1y'
  const [reportData, setReportData] = useState(null);
  const [isLoadingReport, setIsLoadingReport] = useState(false);

  // Load daily activities
  const fetchActivities = async () => {
    setIsLoadingActivities(true);
    try {
      const data = await progressApi.getDailyActivities({ memberEmail: userEmail });
      setActivities(data || []);
    } catch (err) {
      console.warn('Error fetching activities:', err);
    } finally {
      setIsLoadingActivities(false);
    }
  };

  // Load progress photos
  const fetchPhotos = async () => {
    setIsLoadingPhotos(true);
    try {
      const data = await progressApi.getProgressPhotos(userEmail);
      setPhotos(data || []);
      if (data && data.length >= 2) {
        setCompareDateA(data[data.length - 1]?.id || '');
        setCompareDateB(data[0]?.id || '');
      } else if (data && data.length === 1) {
        setCompareDateA(data[0]?.id || '');
        setCompareDateB(data[0]?.id || '');
      }
    } catch (err) {
      console.warn('Error fetching photos:', err);
    } finally {
      setIsLoadingPhotos(false);
    }
  };

  // Load progress report
  const fetchReport = async (period = reportPeriod) => {
    setIsLoadingReport(true);
    try {
      const data = await progressApi.getProgressReport(userEmail, period);
      setReportData(data || null);
    } catch (err) {
      console.warn('Error fetching report:', err);
    } finally {
      setIsLoadingReport(false);
    }
  };

  useEffect(() => {
    fetchActivities();
    fetchPhotos();
    fetchReport(reportPeriod);
  }, [userEmail]);

  useEffect(() => {
    if (activeTab === 'reports') {
      fetchReport(reportPeriod);
    }
  }, [reportPeriod, activeTab]);

  // Image reader helper
  const handleImageFile = (e, callback) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      CustomSwal.fire({
        title: 'Image Too Large',
        text: 'Please select an image smaller than 15MB.',
        icon: 'warning'
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      callback(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  // Submit new daily workout activity
  const handleLogSubmit = async (e) => {
    e.preventDefault();
    if (!logForm.workoutTitle.trim()) {
      CustomSwal.fire({ title: 'Title Required', text: 'Please enter a workout title.', icon: 'warning' });
      return;
    }
    setIsSubmittingLog(true);
    try {
      const payload = {
        ...logForm,
        memberEmail: userEmail,
        memberName: userName,
        trainerName: currentUser?.trainer || 'Coach Shravan',
        trainerEmail: 'trainer@apex.com'
      };
      await progressApi.logDailyActivity(payload);
      CustomSwal.fire({
        title: 'Workout Logged! 🚀',
        text: `Shared with your coach with workout photo and target analysis.`,
        icon: 'success'
      });
      setShowLogModal(false);
      fetchActivities();
      fetchReport(reportPeriod);
    } catch (err) {
      CustomSwal.fire({ title: 'Error', text: err.message || 'Failed to save workout log.', icon: 'error' });
    } finally {
      setIsSubmittingLog(false);
    }
  };

  // Add exercise row in form
  const addExerciseRow = () => {
    setLogForm(prev => ({
      ...prev,
      exercises: [...prev.exercises, { name: '', sets: 3, reps: 10, weight: '' }]
    }));
  };

  // Remove exercise row
  const removeExerciseRow = (index) => {
    setLogForm(prev => ({
      ...prev,
      exercises: prev.exercises.filter((_, i) => i !== index)
    }));
  };

  // Submit weekly progress photos
  const handlePhotoUpload = async (e) => {
    e.preventDefault();
    if (!photoForm.frontPhoto && !photoForm.sidePhoto && !photoForm.backPhoto) {
      CustomSwal.fire({
        title: 'Photo Required',
        text: 'Please upload at least one angle photo (Front, Side, or Back).',
        icon: 'warning'
      });
      return;
    }
    setIsUploadingPhoto(true);
    try {
      const payload = {
        ...photoForm,
        memberEmail: userEmail,
        memberName: userName,
        measurements: {
          chest: photoForm.chest ? `${photoForm.chest} in` : null,
          waist: photoForm.waist ? `${photoForm.waist} in` : null,
          arms: photoForm.arms ? `${photoForm.arms} in` : null,
          thighs: photoForm.thighs ? `${photoForm.thighs} in` : null
        }
      };
      await progressApi.uploadProgressPhotos(payload);
      CustomSwal.fire({
        title: 'Photos Uploaded! 📸',
        text: `Weekly progress photos saved and synchronized with your personal coach.`,
        icon: 'success'
      });
      setShowPhotoModal(false);
      fetchPhotos();
      fetchReport(reportPeriod);
    } catch (err) {
      CustomSwal.fire({ title: 'Upload Failed', text: err.message || 'Could not upload photos.', icon: 'error' });
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Comparison Photo A and B
  const photoA = photos.find(p => p.id === compareDateA) || photos[photos.length - 1] || null;
  const photoB = photos.find(p => p.id === compareDateB) || photos[0] || null;

  const getAnglePhoto = (photoObj, angle) => {
    if (!photoObj) return null;
    if (angle === 'front') return photoObj.frontPhoto || photoObj.sidePhoto || photoObj.backPhoto;
    if (angle === 'side') return photoObj.sidePhoto || photoObj.frontPhoto || photoObj.backPhoto;
    if (angle === 'back') return photoObj.backPhoto || photoObj.frontPhoto || photoObj.sidePhoto;
    return photoObj.frontPhoto;
  };

  // Identify before and current photos
  const baselineBeforePhoto = photos.find(p => p.isBefore) || photos[photos.length - 1];
  const currentPhoto = photos.find(p => p.isCurrent) || photos[0];

  return (
    <div className="member-progress-module" style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
      {/* HEADER SECTION */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '1.5rem',
        padding: '1.4rem 1.8rem',
        background: 'var(--bg-card, #12121c)',
        borderRadius: '14px',
        border: '1px solid var(--border-color, rgba(255,255,255,0.08))',
        boxShadow: '0 8px 24px rgba(0,0,0,0.35)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
            <span style={{ fontSize: '1.6rem' }}>📈</span>
            <h2 style={{
              margin: 0,
              fontSize: '1.6rem',
              fontWeight: 800,
              fontFamily: 'var(--font-display, sans-serif)',
              color: 'var(--text-white, #fff)',
              letterSpacing: '0.5px'
            }}>
              ATHLETE PROGRESS & COACH REPORT
            </h2>
          </div>
          <p style={{ margin: 0, color: 'var(--text-dim, #8E919F)', fontSize: '0.85rem' }}>
            Share daily workout photos, monitor weekly angles (Front / Side / Back), and track 1, 3, 6, and 12-month progress reports.
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
          <button
            className="glow-btn"
            onClick={() => setShowLogModal(true)}
            style={{
              padding: '0.65rem 1.4rem',
              fontSize: '0.85rem',
              fontWeight: 800,
              background: 'var(--accent-volt, #ff5e00)',
              color: '#000',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 0 15px rgba(255, 94, 0, 0.35)'
            }}
          >
            <span>➕</span> Log Daily Activity & Photo
          </button>
          <button
            className="glow-btn"
            onClick={() => setShowPhotoModal(true)}
            style={{
              padding: '0.65rem 1.4rem',
              fontSize: '0.85rem',
              fontWeight: 800,
              background: 'rgba(0, 240, 255, 0.15)',
              color: 'var(--accent-cyan, #00f0ff)',
              border: '1px solid var(--accent-cyan, #00f0ff)',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <span>📸</span> Upload Weekly Progress Photos
          </button>
        </div>
      </div>

      {/* MODULE NAVIGATION TABS */}
      <div style={{
        display: 'flex',
        gap: '0.6rem',
        borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.08))',
        marginBottom: '1.8rem',
        paddingBottom: '0.5rem'
      }}>
        <button
          type="button"
          onClick={() => setActiveTab('daily')}
          style={{
            padding: '0.65rem 1.4rem',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.88rem',
            fontWeight: 800,
            transition: 'all 0.2s ease',
            background: activeTab === 'daily' ? 'var(--accent-volt, #ff5e00)' : 'transparent',
            color: activeTab === 'daily' ? '#000' : 'var(--text-muted, #8E919F)',
            boxShadow: activeTab === 'daily' ? '0 0 15px rgba(255, 94, 0, 0.3)' : 'none'
          }}
        >
          🏋️ Daily Activities & Coach Feed ({activities.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('photos')}
          style={{
            padding: '0.65rem 1.4rem',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.88rem',
            fontWeight: 800,
            transition: 'all 0.2s ease',
            background: activeTab === 'photos' ? 'var(--accent-volt, #ff5e00)' : 'transparent',
            color: activeTab === 'photos' ? '#000' : 'var(--text-muted, #8E919F)',
            boxShadow: activeTab === 'photos' ? '0 0 15px rgba(255, 94, 0, 0.3)' : 'none'
          }}
        >
          📸 Progress Photos & Comparisons ({photos.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('reports')}
          style={{
            padding: '0.65rem 1.4rem',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.88rem',
            fontWeight: 800,
            transition: 'all 0.2s ease',
            background: activeTab === 'reports' ? 'var(--accent-volt, #ff5e00)' : 'transparent',
            color: activeTab === 'reports' ? '#000' : 'var(--text-muted, #8E919F)',
            boxShadow: activeTab === 'reports' ? '0 0 15px rgba(255, 94, 0, 0.3)' : 'none'
          }}
        >
          📊 Progress Reports (1M / 3M / 6M / 1Y)
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: DAILY ACTIVITIES & TRAINER FEED                   */}
      {/* ======================================================== */}
      {activeTab === 'daily' && (
        <div>
          {isLoadingActivities ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-dim)' }}>
              Loading daily activities from MongoDB database...
            </div>
          ) : activities.length === 0 ? (
            <div style={{
              padding: '4rem 2rem',
              textAlign: 'center',
              background: 'var(--bg-card, #12121c)',
              borderRadius: '12px',
              border: '1px dashed var(--border-color)'
            }}>
              <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>🏋️</span>
              <h3 style={{ color: 'var(--text-white)', marginBottom: '0.5rem' }}>No Daily Activities Logged Yet</h3>
              <p style={{ color: 'var(--text-dim)', maxWidth: '480px', margin: '0 auto 1.5rem auto', fontSize: '0.88rem' }}>
                Log today's workout, attach your workout photo, specify how many exercises you were supposed to do vs completed, and send directly to your coach!
              </p>
              <button
                className="glow-btn"
                onClick={() => setShowLogModal(true)}
                style={{ padding: '0.65rem 1.5rem', background: 'var(--accent-volt)', color: '#000', fontWeight: 800, borderRadius: '8px' }}
              >
                Log First Activity
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.4rem' }}>
              {activities.map((item) => {
                const targetCount = item.targetWorkouts || 5;
                const doneCount = item.completedWorkouts || 5;
                const ratioPercent = Math.min(100, Math.round((doneCount / targetCount) * 100));

                return (
                  <div
                    key={item.id}
                    style={{
                      background: 'var(--bg-card, #12121c)',
                      border: '1px solid var(--border-color, rgba(255,255,255,0.08))',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      boxShadow: '0 6px 20px rgba(0,0,0,0.3)',
                      transition: 'transform 0.2s ease, border-color 0.2s ease'
                    }}
                  >
                    {/* Activity Top Banner / Photo */}
                    <div style={{ position: 'relative', height: '170px', background: 'rgba(0,0,0,0.5)', overflow: 'hidden' }}>
                      {item.workoutPhoto ? (
                        <img
                          src={item.workoutPhoto}
                          alt={item.workoutTitle}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }}
                          onClick={() => setLightboxPhoto(item.workoutPhoto)}
                        />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1c1c2e, #0d0d15)' }}>
                          <span style={{ fontSize: '3rem', opacity: 0.3 }}>🏋️</span>
                        </div>
                      )}

                      {/* Date Badge */}
                      <span style={{
                        position: 'absolute',
                        top: '10px',
                        left: '10px',
                        background: 'rgba(5, 5, 8, 0.85)',
                        backdropFilter: 'blur(6px)',
                        padding: '0.25rem 0.65rem',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: 'var(--accent-volt, #ff5e00)',
                        border: '1px solid rgba(255, 94, 0, 0.3)'
                      }}>
                        📅 {item.date}
                      </span>

                      {/* Category Badge */}
                      <span style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        background: 'rgba(0, 240, 255, 0.2)',
                        backdropFilter: 'blur(6px)',
                        padding: '0.25rem 0.65rem',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: 'var(--accent-cyan, #00f0ff)',
                        border: '1px solid rgba(0, 240, 255, 0.4)'
                      }}>
                        {item.category || 'Strength'}
                      </span>
                    </div>

                    {/* Content Body */}
                    <div style={{ padding: '1.2rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-white)', fontSize: '1.1rem', fontWeight: 800 }}>
                        {item.workoutTitle}
                      </h4>

                      {/* Target Workouts vs Done */}
                      <div style={{
                        background: 'rgba(255,255,255,0.03)',
                        borderRadius: '8px',
                        padding: '0.7rem 0.9rem',
                        marginBottom: '0.9rem',
                        border: '1px solid rgba(255,255,255,0.05)'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.35rem' }}>
                          <span style={{ color: 'var(--text-dim)' }}>Workouts Target vs Done:</span>
                          <strong style={{ color: doneCount >= targetCount ? 'var(--accent-volt)' : '#ffaa00' }}>
                            {doneCount} of {targetCount} completed ({ratioPercent}%)
                          </strong>
                        </div>
                        {/* Progress Bar */}
                        <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{
                            width: `${ratioPercent}%`,
                            height: '100%',
                            background: doneCount >= targetCount ? 'var(--accent-volt, #ff5e00)' : '#ffaa00',
                            borderRadius: '4px',
                            transition: 'width 0.5s ease'
                          }} />
                        </div>
                      </div>

                      {/* Quick Metrics */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '0.9rem', textAlign: 'center' }}>
                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.4rem', borderRadius: '6px' }}>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', display: 'block' }}>Duration</span>
                          <strong style={{ fontSize: '0.85rem', color: 'var(--text-white)' }}>{item.durationMinutes}m</strong>
                        </div>
                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.4rem', borderRadius: '6px' }}>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', display: 'block' }}>Burned</span>
                          <strong style={{ fontSize: '0.85rem', color: 'var(--accent-volt)' }}>{item.caloriesBurned} kcal</strong>
                        </div>
                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.4rem', borderRadius: '6px' }}>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', display: 'block' }}>Intensity</span>
                          <strong style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)' }}>{item.intensity}</strong>
                        </div>
                      </div>

                      {/* Exercises Mini-Table */}
                      {item.exercises && item.exercises.length > 0 && (
                        <div style={{ marginBottom: '0.9rem' }}>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Exercises Completed ({item.exercises.length})
                          </span>
                          <div style={{ maxHeight: '100px', overflowY: 'auto', fontSize: '0.75rem', paddingRight: '4px' }}>
                            {item.exercises.map((ex, i) => (
                              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.2rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                <span style={{ color: 'var(--text-white)' }}>✓ {ex.name}</span>
                                <span style={{ color: 'var(--text-dim)' }}>{ex.sets}x{ex.reps} {ex.weight ? `(${ex.weight})` : ''}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Member Notes */}
                      {item.notes && (
                        <p style={{
                          margin: '0 0 0.9rem 0',
                          fontSize: '0.78rem',
                          fontStyle: 'italic',
                          color: 'var(--text-dim)',
                          background: 'rgba(255,255,255,0.02)',
                          padding: '0.5rem 0.7rem',
                          borderRadius: '6px',
                          borderLeft: '2px solid var(--accent-volt)'
                        }}>
                          "{item.notes}"
                        </p>
                      )}

                      {/* Coach Review / Feedback Status */}
                      <div style={{
                        marginTop: 'auto',
                        padding: '0.7rem',
                        borderRadius: '8px',
                        background: item.trainerFeedback?.comment ? 'rgba(0, 240, 255, 0.08)' : 'rgba(255,255,255,0.03)',
                        border: item.trainerFeedback?.comment ? '1px solid rgba(0, 240, 255, 0.25)' : '1px solid rgba(255,255,255,0.05)'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: item.trainerFeedback?.comment ? 'var(--accent-cyan)' : 'var(--text-dim)' }}>
                            {item.trainerFeedback?.comment ? `💬 Coach ${item.trainerFeedback.trainerName || item.trainerName} Review:` : `⏳ Sent to Coach ${item.trainerName || 'Shravan'}`}
                          </span>
                          {item.trainerFeedback?.rating && (
                            <span style={{ fontSize: '0.72rem', color: '#ffcc00' }}>
                              {'★'.repeat(item.trainerFeedback.rating)}
                            </span>
                          )}
                        </div>
                        <p style={{ margin: 0, fontSize: '0.74rem', color: item.trainerFeedback?.comment ? 'var(--text-white)' : 'var(--text-dim)' }}>
                          {item.trainerFeedback?.comment || 'Awaiting personal coach review & analysis.'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: PROGRESS PHOTOS (BEFORE / CURRENT / MULTI-ANGLE)  */}
      {/* ======================================================== */}
      {activeTab === 'photos' && (
        <div>
          {/* WEEKLY UPLOAD STATUS CARD */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(255, 94, 0, 0.12), rgba(0, 240, 255, 0.08))',
            border: '1px solid var(--accent-volt, #ff5e00)',
            borderRadius: '12px',
            padding: '1.2rem 1.6rem',
            marginBottom: '1.8rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--accent-volt)', letterSpacing: '1px' }}>
                WEEKLY CHECK-IN CADENCE (UPLOAD ONCE A WEEK)
              </span>
              <h3 style={{ margin: '0.2rem 0 0.4rem 0', color: 'var(--text-white)', fontSize: '1.2rem' }}>
                📸 Multi-Angle Body Composition Tracking
              </h3>
              <p style={{ margin: 0, color: 'var(--text-dim)', fontSize: '0.84rem', maxWidth: '600px' }}>
                Capture Front, Side, and Back photos weekly under consistent lighting. Our system pairs your baseline "Before" shot with your "Current" condition for visual side-by-side analysis.
              </p>
            </div>
            <button
              className="glow-btn"
              onClick={() => setShowPhotoModal(true)}
              style={{
                padding: '0.65rem 1.4rem',
                fontSize: '0.85rem',
                fontWeight: 800,
                background: 'var(--accent-volt)',
                color: '#000',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Upload This Week's Angles 📸
            </button>
          </div>

          {/* BEFORE VS CURRENT COMPARISON SECTION */}
          {baselineBeforePhoto && currentPhoto && (
            <div style={{
              background: 'var(--bg-card, #12121c)',
              border: '1px solid var(--border-color)',
              borderRadius: '14px',
              padding: '1.5rem',
              marginBottom: '2rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.2rem' }}>
                <div>
                  <h3 style={{ margin: 0, color: 'var(--text-white)', fontSize: '1.25rem', fontWeight: 800 }}>
                    ⚡ Before vs Current Condition
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                    Baseline Day 1 ({baselineBeforePhoto.date}) vs Latest Check-in ({currentPhoto.date})
                  </span>
                </div>

                {/* Angle Selector Switcher */}
                <div style={{ display: 'flex', gap: '0.4rem', background: 'rgba(0,0,0,0.3)', padding: '0.3rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  {['front', 'side', 'back'].map(angle => (
                    <button
                      key={angle}
                      type="button"
                      onClick={() => setSelectedAngle(angle)}
                      style={{
                        padding: '0.4rem 1rem',
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        borderRadius: '6px',
                        border: 'none',
                        cursor: 'pointer',
                        background: selectedAngle === angle ? 'var(--accent-cyan)' : 'transparent',
                        color: selectedAngle === angle ? '#000' : 'var(--text-muted)'
                      }}
                    >
                      {angle}
                    </button>
                  ))}
                </div>
              </div>

              {/* Side-by-Side Dual Photo Frame */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                {/* Before Photo */}
                <div style={{
                  background: 'rgba(0,0,0,0.4)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 62, 108, 0.3)',
                  overflow: 'hidden',
                  position: 'relative'
                }}>
                  <div style={{ position: 'relative', height: '360px', background: '#0a0a10' }}>
                    {getAnglePhoto(baselineBeforePhoto, selectedAngle) ? (
                      <img
                        src={getAnglePhoto(baselineBeforePhoto, selectedAngle)}
                        alt="Before Angle"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }}
                        onClick={() => setLightboxPhoto(getAnglePhoto(baselineBeforePhoto, selectedAngle))}
                      />
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-dim)' }}>
                        No {selectedAngle} photo logged
                      </div>
                    )}
                    <span style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      background: 'rgba(255, 62, 108, 0.9)',
                      color: '#fff',
                      padding: '0.3rem 0.8rem',
                      borderRadius: '6px',
                      fontWeight: 800,
                      fontSize: '0.75rem',
                      textTransform: 'uppercase'
                    }}>
                      BEFORE ({baselineBeforePhoto.weekNumber || 'Baseline'})
                    </span>
                  </div>
                  <div style={{ padding: '0.9rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
                    <span style={{ color: 'var(--text-dim)' }}>Date: {baselineBeforePhoto.date}</span>
                    <strong style={{ color: 'var(--text-white)' }}>
                      Weight: {baselineBeforePhoto.bodyWeight ? `${baselineBeforePhoto.bodyWeight} ${baselineBeforePhoto.weightUnit || 'lbs'}` : 'N/A'}
                    </strong>
                  </div>
                </div>

                {/* Current Photo */}
                <div style={{
                  background: 'rgba(0,0,0,0.4)',
                  borderRadius: '12px',
                  border: '1px solid rgba(0, 240, 255, 0.3)',
                  overflow: 'hidden',
                  position: 'relative'
                }}>
                  <div style={{ position: 'relative', height: '360px', background: '#0a0a10' }}>
                    {getAnglePhoto(currentPhoto, selectedAngle) ? (
                      <img
                        src={getAnglePhoto(currentPhoto, selectedAngle)}
                        alt="Current Angle"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }}
                        onClick={() => setLightboxPhoto(getAnglePhoto(currentPhoto, selectedAngle))}
                      />
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-dim)' }}>
                        No {selectedAngle} photo logged
                      </div>
                    )}
                    <span style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      background: 'rgba(0, 240, 255, 0.9)',
                      color: '#000',
                      padding: '0.3rem 0.8rem',
                      borderRadius: '6px',
                      fontWeight: 800,
                      fontSize: '0.75rem',
                      textTransform: 'uppercase'
                    }}>
                      CURRENT ({currentPhoto.weekNumber || 'Latest'})
                    </span>
                  </div>
                  <div style={{ padding: '0.9rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
                    <span style={{ color: 'var(--text-dim)' }}>Date: {currentPhoto.date}</span>
                    <strong style={{ color: 'var(--accent-cyan)' }}>
                      Weight: {currentPhoto.bodyWeight ? `${currentPhoto.bodyWeight} ${currentPhoto.weightUnit || 'lbs'}` : 'N/A'}
                      {baselineBeforePhoto.bodyWeight && currentPhoto.bodyWeight && (
                        <span style={{ marginLeft: '0.4rem', color: currentPhoto.bodyWeight < baselineBeforePhoto.bodyWeight ? 'var(--accent-volt)' : '#00f0ff' }}>
                          ({(currentPhoto.bodyWeight - baselineBeforePhoto.bodyWeight > 0 ? '+' : '') + (currentPhoto.bodyWeight - baselineBeforePhoto.bodyWeight).toFixed(1)} lbs)
                        </span>
                      )}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* DATE-WISE COMPARISON VIEWER */}
          <div style={{
            background: 'var(--bg-card, #12121c)',
            border: '1px solid var(--border-color)',
            borderRadius: '14px',
            padding: '1.5rem',
            marginBottom: '2rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.2rem' }}>
              <div>
                <h3 style={{ margin: 0, color: 'var(--text-white)', fontSize: '1.2rem', fontWeight: 800 }}>
                  🗓️ Date-Wise Multi-Angle Inspection
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                  Select any two checkpoint dates to inspect Front, Side, and Back posture progression.
                </span>
              </div>

              {/* Date Selectors */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Point A:</span>
                  <select
                    value={compareDateA}
                    onChange={(e) => setCompareDateA(e.target.value)}
                    style={{
                      background: '#0d0d15',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-white)',
                      padding: '0.4rem 0.8rem',
                      borderRadius: '6px',
                      fontSize: '0.78rem'
                    }}
                  >
                    {photos.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.weekNumber} ({p.date}) - {p.bodyWeight || '?'} lbs
                      </option>
                    ))}
                  </select>
                </div>

                <span style={{ color: 'var(--accent-volt)', fontWeight: 800 }}>VS</span>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Point B:</span>
                  <select
                    value={compareDateB}
                    onChange={(e) => setCompareDateB(e.target.value)}
                    style={{
                      background: '#0d0d15',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-white)',
                      padding: '0.4rem 0.8rem',
                      borderRadius: '6px',
                      fontSize: '0.78rem'
                    }}
                  >
                    {photos.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.weekNumber} ({p.date}) - {p.bodyWeight || '?'} lbs
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* 3 Angles Tri-Comparison (Front / Side / Back) */}
            {photoA && photoB ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.2rem' }}>
                {['front', 'side', 'back'].map(angle => (
                  <div
                    key={angle}
                    style={{
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '10px',
                      padding: '0.9rem'
                    }}
                  >
                    <h5 style={{ margin: '0 0 0.8rem 0', textAlign: 'center', color: 'var(--accent-cyan)', textTransform: 'uppercase', fontSize: '0.85rem' }}>
                      {angle.toUpperCase()} ANGLE
                    </h5>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      {/* Photo A */}
                      <div style={{ height: '180px', borderRadius: '6px', overflow: 'hidden', background: '#0a0a10', position: 'relative' }}>
                        {getAnglePhoto(photoA, angle) ? (
                          <img
                            src={getAnglePhoto(photoA, angle)}
                            alt={`Point A ${angle}`}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }}
                            onClick={() => setLightboxPhoto(getAnglePhoto(photoA, angle))}
                          />
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-dim)', fontSize: '0.7rem' }}>
                            No image
                          </div>
                        )}
                        <span style={{ position: 'absolute', bottom: '4px', left: '4px', background: 'rgba(0,0,0,0.7)', fontSize: '0.65rem', padding: '0.1rem 0.35rem', borderRadius: '3px', color: '#fff' }}>
                          {photoA.weekNumber}
                        </span>
                      </div>

                      {/* Photo B */}
                      <div style={{ height: '180px', borderRadius: '6px', overflow: 'hidden', background: '#0a0a10', position: 'relative' }}>
                        {getAnglePhoto(photoB, angle) ? (
                          <img
                            src={getAnglePhoto(photoB, angle)}
                            alt={`Point B ${angle}`}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }}
                            onClick={() => setLightboxPhoto(getAnglePhoto(photoB, angle))}
                          />
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-dim)', fontSize: '0.7rem' }}>
                            No image
                          </div>
                        )}
                        <span style={{ position: 'absolute', bottom: '4px', left: '4px', background: 'rgba(0,0,0,0.7)', fontSize: '0.65rem', padding: '0.1rem 0.35rem', borderRadius: '3px', color: 'var(--accent-volt)' }}>
                          {photoB.weekNumber}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-dim)' }}>
                Upload at least two checkpoint photo sets to use date-wise comparison.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: PROGRESS REPORTS (1M, 3M, 6M, 1Y)                */}
      {/* ======================================================== */}
      {activeTab === 'reports' && (
        <div>
          {/* PERIOD FILTER SWITCHER */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '1.8rem',
            background: 'var(--bg-card, #12121c)',
            padding: '1rem 1.5rem',
            borderRadius: '12px',
            border: '1px solid var(--border-color)'
          }}>
            <div>
              <h3 style={{ margin: 0, color: 'var(--text-white)', fontSize: '1.2rem', fontWeight: 800 }}>
                📊 Historical Progress Report &amp; Analytics
              </h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                Comprehensive metric progression over 1 Month, 3 Months, 6 Months, and 1 Year.
              </span>
            </div>

            {/* Timeframe Buttons */}
            <div style={{ display: 'flex', gap: '0.5rem', background: '#0a0a10', padding: '0.3rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              {[
                { id: '1m', label: '1 Month' },
                { id: '3m', label: '3 Months' },
                { id: '6m', label: '6 Months' },
                { id: '1y', label: '1 Year' }
              ].map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setReportPeriod(p.id)}
                  style={{
                    padding: '0.45rem 1.1rem',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    background: reportPeriod === p.id ? 'var(--accent-volt, #ff5e00)' : 'transparent',
                    color: reportPeriod === p.id ? '#000' : 'var(--text-muted)'
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {isLoadingReport ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-dim)' }}>
              Calculating historical performance analytics...
            </div>
          ) : reportData ? (
            <div>
              {/* KPI CARDS GRID */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.8rem' }}>
                <div style={{ background: 'var(--bg-card)', padding: '1.2rem', borderRadius: '12px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Workouts</span>
                  <h2 style={{ margin: '0.4rem 0 0 0', color: 'var(--text-white)', fontSize: '2rem', fontWeight: 900 }}>
                    {reportData.metrics?.totalWorkouts || 0}
                  </h2>
                </div>

                <div style={{ background: 'var(--bg-card)', padding: '1.2rem', borderRadius: '12px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Target Completion %</span>
                  <h2 style={{ margin: '0.4rem 0 0 0', color: 'var(--accent-volt)', fontSize: '2rem', fontWeight: 900 }}>
                    {reportData.metrics?.completionRate || 100}%
                  </h2>
                </div>

                <div style={{ background: 'var(--bg-card)', padding: '1.2rem', borderRadius: '12px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Calories Burned</span>
                  <h2 style={{ margin: '0.4rem 0 0 0', color: 'var(--accent-cyan)', fontSize: '2rem', fontWeight: 900 }}>
                    {reportData.metrics?.totalCalories?.toLocaleString() || 0}
                  </h2>
                </div>

                <div style={{ background: 'var(--bg-card)', padding: '1.2rem', borderRadius: '12px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Hours</span>
                  <h2 style={{ margin: '0.4rem 0 0 0', color: '#ffcc00', fontSize: '2rem', fontWeight: 900 }}>
                    {reportData.metrics?.totalHours || 0}h
                  </h2>
                </div>
              </div>

              {/* VISUAL CHARTS SECTION */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                {/* Workout Volume SVG Bar Graph */}
                <div style={{ background: 'var(--bg-card)', padding: '1.4rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ margin: '0 0 1rem 0', color: 'var(--text-white)', fontSize: '1rem', fontWeight: 800 }}>
                    📈 Workout Intensity &amp; Calories Trend
                  </h4>
                  {reportData.workoutTimeline && reportData.workoutTimeline.length > 0 ? (
                    <div style={{ height: '200px', display: 'flex', alignItems: 'flex-end', gap: '8px', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
                      {reportData.workoutTimeline.map((item, idx) => {
                        const maxCal = Math.max(...reportData.workoutTimeline.map(w => w.calories || 400), 700);
                        const heightPct = Math.round(((item.calories || 400) / maxCal) * 100);
                        return (
                          <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }} title={`${item.title}: ${item.calories} kcal (${item.date})`}>
                            <span style={{ fontSize: '0.62rem', color: 'var(--text-dim)', marginBottom: '4px' }}>{item.calories}</span>
                            <div style={{
                              width: '100%',
                              maxWidth: '32px',
                              height: `${heightPct}%`,
                              background: 'linear-gradient(to top, var(--accent-volt), #ffaa00)',
                              borderRadius: '4px 4px 0 0',
                              transition: 'height 0.5s ease'
                            }} />
                            <span style={{ fontSize: '0.62rem', color: 'var(--text-dim)', marginTop: '6px', whiteSpace: 'nowrap' }}>
                              {item.date?.split('-').slice(1).join('/')}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-dim)' }}>
                      No workouts logged in this period.
                    </div>
                  )}
                </div>

                {/* Weight Progression Trend */}
                <div style={{ background: 'var(--bg-card)', padding: '1.4rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ margin: '0 0 1rem 0', color: 'var(--text-white)', fontSize: '1rem', fontWeight: 800 }}>
                    ⚖️ Weight Progression Track
                  </h4>
                  {reportData.weightTimeline && reportData.weightTimeline.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                      {reportData.weightTimeline.map((w, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.8rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <div>
                            <span style={{ color: 'var(--accent-cyan)', fontWeight: 800, fontSize: '0.85rem' }}>{w.week}</span>
                            <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem', marginLeft: '0.6rem' }}>{w.date}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            {w.bodyFat && (
                              <span style={{ fontSize: '0.75rem', color: '#ffcc00' }}>Body Fat: {w.bodyFat}%</span>
                            )}
                            <strong style={{ color: 'var(--text-white)', fontSize: '1rem' }}>
                              {w.weight} {w.unit}
                            </strong>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-dim)' }}>
                      No weight records logged for this period.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-dim)' }}>
              No report data available.
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: LOG DAILY ACTIVITY & PHOTO                      */}
      {/* ======================================================== */}
      {showLogModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(5, 5, 8, 0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            background: 'var(--bg-dark, #0d0d15)',
            border: '1px solid var(--accent-volt)',
            boxShadow: '0 0 35px rgba(255, 94, 0, 0.2)',
            borderRadius: '14px',
            width: '95%',
            maxWidth: '680px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '2rem',
            position: 'relative',
            color: 'var(--text-white)'
          }}>
            <button
              type="button"
              onClick={() => setShowLogModal(false)}
              style={{ position: 'absolute', top: '1.2rem', right: '1.2rem', background: 'transparent', border: 'none', color: 'var(--text-dim)', fontSize: '1.5rem', cursor: 'pointer' }}
            >
              ✕
            </button>

            <h3 style={{ margin: '0 0 0.4rem 0', color: 'var(--accent-volt)', fontSize: '1.4rem', fontWeight: 800 }}>
              🏋️ Share Daily Workout Activity to Coach
            </h3>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.82rem', marginBottom: '1.5rem' }}>
              Upload your workout photo, target workouts vs actual completed, and exercises.
            </p>

            <form onSubmit={handleLogSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '0.3rem' }}>
                    Workout Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chest & Triceps Hypertrophy"
                    value={logForm.workoutTitle}
                    onChange={(e) => setLogForm({ ...logForm, workoutTitle: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', background: '#171724', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '6px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '0.3rem' }}>
                    Category
                  </label>
                  <select
                    value={logForm.category}
                    onChange={(e) => setLogForm({ ...logForm, category: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', background: '#171724', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '6px' }}
                  >
                    <option value="Strength Training">Strength Training</option>
                    <option value="Hypertrophy">Hypertrophy & Mass</option>
                    <option value="Powerlifting">Powerlifting</option>
                    <option value="Cardio & Stamina">Cardio & Stamina</option>
                    <option value="HIIT Conditioning">HIIT Conditioning</option>
                  </select>
                </div>
              </div>

              {/* TARGET VS DONE WORKOUTS */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem', background: 'rgba(255,255,255,0.03)', padding: '0.8rem', borderRadius: '8px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--accent-volt)', marginBottom: '0.3rem' }}>
                    Workouts/Exercises Planned To Do:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={logForm.targetWorkouts}
                    onChange={(e) => setLogForm({ ...logForm, targetWorkouts: Number(e.target.value) })}
                    style={{ width: '100%', padding: '0.5rem', background: '#171724', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '6px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--accent-cyan)', marginBottom: '0.3rem' }}>
                    Workouts/Exercises Actually Completed:
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={logForm.completedWorkouts}
                    onChange={(e) => setLogForm({ ...logForm, completedWorkouts: Number(e.target.value) })}
                    style={{ width: '100%', padding: '0.5rem', background: '#171724', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '6px' }}
                  />
                </div>
              </div>

              {/* DURATION, CALORIES, INTENSITY */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '0.3rem' }}>Duration (Mins)</label>
                  <input
                    type="number"
                    value={logForm.durationMinutes}
                    onChange={(e) => setLogForm({ ...logForm, durationMinutes: Number(e.target.value) })}
                    style={{ width: '100%', padding: '0.5rem', background: '#171724', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '6px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '0.3rem' }}>Calories Burned</label>
                  <input
                    type="number"
                    value={logForm.caloriesBurned}
                    onChange={(e) => setLogForm({ ...logForm, caloriesBurned: Number(e.target.value) })}
                    style={{ width: '100%', padding: '0.5rem', background: '#171724', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '6px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '0.3rem' }}>Intensity</label>
                  <select
                    value={logForm.intensity}
                    onChange={(e) => setLogForm({ ...logForm, intensity: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', background: '#171724', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '6px' }}
                  >
                    <option value="Light">Light</option>
                    <option value="Moderate">Moderate</option>
                    <option value="High">High</option>
                    <option value="Extreme">Extreme</option>
                  </select>
                </div>
              </div>

              {/* WORKOUT PHOTO UPLOAD */}
              <div style={{ marginBottom: '1.2rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--accent-volt)', marginBottom: '0.4rem', fontWeight: 700 }}>
                  📸 Workout Photo / Pump Check:
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageFile(e, (dataUri) => setLogForm(prev => ({ ...prev, workoutPhoto: dataUri })))}
                    style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}
                  />
                  {logForm.workoutPhoto && (
                    <div style={{ width: '60px', height: '60px', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--accent-volt)' }}>
                      <img src={logForm.workoutPhoto} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                </div>
              </div>

              {/* EXERCISES BUILDER */}
              <div style={{ marginBottom: '1.2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Exercises List:</label>
                  <button
                    type="button"
                    onClick={addExerciseRow}
                    style={{ background: 'transparent', border: 'none', color: 'var(--accent-cyan)', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}
                  >
                    + Add Exercise
                  </button>
                </div>
                {logForm.exercises.map((ex, i) => (
                  <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.4rem' }}>
                    <input
                      type="text"
                      placeholder="Exercise Name"
                      value={ex.name}
                      onChange={(e) => {
                        const updated = [...logForm.exercises];
                        updated[i].name = e.target.value;
                        setLogForm({ ...logForm, exercises: updated });
                      }}
                      style={{ flex: 2, padding: '0.4rem', background: '#171724', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '4px', fontSize: '0.78rem' }}
                    />
                    <input
                      type="number"
                      placeholder="Sets"
                      value={ex.sets}
                      onChange={(e) => {
                        const updated = [...logForm.exercises];
                        updated[i].sets = Number(e.target.value);
                        setLogForm({ ...logForm, exercises: updated });
                      }}
                      style={{ width: '60px', padding: '0.4rem', background: '#171724', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '4px', fontSize: '0.78rem' }}
                    />
                    <input
                      type="number"
                      placeholder="Reps"
                      value={ex.reps}
                      onChange={(e) => {
                        const updated = [...logForm.exercises];
                        updated[i].reps = Number(e.target.value);
                        setLogForm({ ...logForm, exercises: updated });
                      }}
                      style={{ width: '60px', padding: '0.4rem', background: '#171724', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '4px', fontSize: '0.78rem' }}
                    />
                    <input
                      type="text"
                      placeholder="Weight"
                      value={ex.weight}
                      onChange={(e) => {
                        const updated = [...logForm.exercises];
                        updated[i].weight = e.target.value;
                        setLogForm({ ...logForm, exercises: updated });
                      }}
                      style={{ flex: 1, padding: '0.4rem', background: '#171724', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '4px', fontSize: '0.78rem' }}
                    />
                    <button
                      type="button"
                      onClick={() => removeExerciseRow(i)}
                      style={{ background: 'transparent', border: 'none', color: '#ff3e6c', cursor: 'pointer' }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              {/* NOTES TO TRAINER */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '0.3rem' }}>
                  Message / Notes for Coach:
                </label>
                <textarea
                  rows="2"
                  placeholder="e.g. Hit a new PB on bench today! Left shoulder felt slightly tight on set 4."
                  value={logForm.notes}
                  onChange={(e) => setLogForm({ ...logForm, notes: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', background: '#171724', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '6px', fontSize: '0.8rem' }}
                />
              </div>

              {/* ACTIONS */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem' }}>
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  style={{ padding: '0.6rem 1.2rem', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-dim)', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingLog}
                  className="glow-btn"
                  style={{ padding: '0.6rem 1.6rem', background: 'var(--accent-volt)', color: '#000', fontWeight: 800, border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                >
                  {isSubmittingLog ? 'Saving to MongoDB...' : 'Share With Coach 🚀'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: UPLOAD WEEKLY PROGRESS PHOTOS (FRONT/SIDE/BACK) */}
      {/* ======================================================== */}
      {showPhotoModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(5, 5, 8, 0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            background: 'var(--bg-dark, #0d0d15)',
            border: '1px solid var(--accent-cyan)',
            boxShadow: '0 0 35px rgba(0, 240, 255, 0.2)',
            borderRadius: '14px',
            width: '95%',
            maxWidth: '720px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '2rem',
            position: 'relative',
            color: 'var(--text-white)'
          }}>
            <button
              type="button"
              onClick={() => setShowPhotoModal(false)}
              style={{ position: 'absolute', top: '1.2rem', right: '1.2rem', background: 'transparent', border: 'none', color: 'var(--text-dim)', fontSize: '1.5rem', cursor: 'pointer' }}
            >
              ✕
            </button>

            <h3 style={{ margin: '0 0 0.4rem 0', color: 'var(--accent-cyan)', fontSize: '1.4rem', fontWeight: 800 }}>
              📸 Upload Weekly Check-in Photos
            </h3>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.82rem', marginBottom: '1.5rem' }}>
              Upload your Front, Side, and Back photos once a week for date-wise body transformation comparison.
            </p>

            <form onSubmit={handlePhotoUpload}>
              {/* WEEK & BEFORE/CURRENT FLAGS */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.2rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '0.3rem' }}>Week Label</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Week 1, Week 12"
                    value={photoForm.weekNumber}
                    onChange={(e) => setPhotoForm({ ...photoForm, weekNumber: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', background: '#171724', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '6px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '0.3rem' }}>Body Weight (lbs)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="175"
                    value={photoForm.bodyWeight}
                    onChange={(e) => setPhotoForm({ ...photoForm, bodyWeight: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', background: '#171724', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '6px' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.4rem', paddingTop: '0.8rem' }}>
                  <label style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={photoForm.isBefore}
                      onChange={(e) => setPhotoForm({ ...photoForm, isBefore: e.target.checked })}
                    />
                    Mark as "Baseline Before" Photo
                  </label>
                  <label style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={photoForm.isCurrent}
                      onChange={(e) => setPhotoForm({ ...photoForm, isCurrent: e.target.checked })}
                    />
                    Mark as "Current" Status
                  </label>
                </div>
              </div>

              {/* 3 ANGLE UPLOADERS (FRONT / SIDE / BACK) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                {/* Front Photo */}
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed var(--border-color)', borderRadius: '8px', padding: '0.8rem', textAlign: 'center' }}>
                  <strong style={{ display: 'block', fontSize: '0.8rem', color: 'var(--accent-volt)', marginBottom: '0.5rem' }}>
                    FRONT POSE
                  </strong>
                  <div style={{ height: '140px', background: '#0a0a10', borderRadius: '6px', overflow: 'hidden', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {photoForm.frontPhoto ? (
                      <img src={photoForm.frontPhoto} alt="Front" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: '2rem', opacity: 0.3 }}>🧍</span>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageFile(e, (dataUri) => setPhotoForm(prev => ({ ...prev, frontPhoto: dataUri })))}
                    style={{ fontSize: '0.7rem', width: '100%' }}
                  />
                </div>

                {/* Side Photo */}
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed var(--border-color)', borderRadius: '8px', padding: '0.8rem', textAlign: 'center' }}>
                  <strong style={{ display: 'block', fontSize: '0.8rem', color: 'var(--accent-cyan)', marginBottom: '0.5rem' }}>
                    SIDE PROFILE
                  </strong>
                  <div style={{ height: '140px', background: '#0a0a10', borderRadius: '6px', overflow: 'hidden', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {photoForm.sidePhoto ? (
                      <img src={photoForm.sidePhoto} alt="Side" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: '2rem', opacity: 0.3 }}>🚶</span>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageFile(e, (dataUri) => setPhotoForm(prev => ({ ...prev, sidePhoto: dataUri })))}
                    style={{ fontSize: '0.7rem', width: '100%' }}
                  />
                </div>

                {/* Back Photo */}
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed var(--border-color)', borderRadius: '8px', padding: '0.8rem', textAlign: 'center' }}>
                  <strong style={{ display: 'block', fontSize: '0.8rem', color: '#ffcc00', marginBottom: '0.5rem' }}>
                    BACK SPREAD
                  </strong>
                  <div style={{ height: '140px', background: '#0a0a10', borderRadius: '6px', overflow: 'hidden', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {photoForm.backPhoto ? (
                      <img src={photoForm.backPhoto} alt="Back" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: '2rem', opacity: 0.3 }}>🏋️</span>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageFile(e, (dataUri) => setPhotoForm(prev => ({ ...prev, backPhoto: dataUri })))}
                    style={{ fontSize: '0.7rem', width: '100%' }}
                  />
                </div>
              </div>

              {/* MEASUREMENTS OPTIONAL */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.6rem', marginBottom: '1.2rem' }}>
                <div>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Chest (in)</label>
                  <input
                    type="text"
                    placeholder="42"
                    value={photoForm.chest}
                    onChange={(e) => setPhotoForm({ ...photoForm, chest: e.target.value })}
                    style={{ width: '100%', padding: '0.4rem', background: '#171724', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '4px', fontSize: '0.78rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Waist (in)</label>
                  <input
                    type="text"
                    placeholder="32"
                    value={photoForm.waist}
                    onChange={(e) => setPhotoForm({ ...photoForm, waist: e.target.value })}
                    style={{ width: '100%', padding: '0.4rem', background: '#171724', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '4px', fontSize: '0.78rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Arms (in)</label>
                  <input
                    type="text"
                    placeholder="16"
                    value={photoForm.arms}
                    onChange={(e) => setPhotoForm({ ...photoForm, arms: e.target.value })}
                    style={{ width: '100%', padding: '0.4rem', background: '#171724', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '4px', fontSize: '0.78rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Thighs (in)</label>
                  <input
                    type="text"
                    placeholder="24"
                    value={photoForm.thighs}
                    onChange={(e) => setPhotoForm({ ...photoForm, thighs: e.target.value })}
                    style={{ width: '100%', padding: '0.4rem', background: '#171724', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '4px', fontSize: '0.78rem' }}
                  />
                </div>
              </div>

              {/* NOTES */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '0.3rem' }}>Progress Notes</label>
                <textarea
                  rows="2"
                  placeholder="e.g. Energy is high, vascularity visible in arms and upper abdomen."
                  value={photoForm.notes}
                  onChange={(e) => setPhotoForm({ ...photoForm, notes: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', background: '#171724', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '6px', fontSize: '0.8rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem' }}>
                <button
                  type="button"
                  onClick={() => setShowPhotoModal(false)}
                  style={{ padding: '0.6rem 1.2rem', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-dim)', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploadingPhoto}
                  className="glow-btn"
                  style={{ padding: '0.6rem 1.6rem', background: 'var(--accent-cyan)', color: '#000', fontWeight: 800, border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                >
                  {isUploadingPhoto ? 'Uploading to MongoDB...' : 'Save Weekly Angles 📸'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LIGHTBOX POPUP FOR FULLSCREEN PHOTO VIEW */}
      {lightboxPhoto && (
        <div
          onClick={() => setLightboxPhoto(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.92)',
            zIndex: 100000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            cursor: 'zoom-out'
          }}
        >
          <img
            src={lightboxPhoto}
            alt="Expanded Workout View"
            style={{ maxWidth: '90%', maxHeight: '90%', borderRadius: '12px', boxShadow: '0 0 40px rgba(0,0,0,0.8)' }}
          />
        </div>
      )}
    </div>
  );
}
