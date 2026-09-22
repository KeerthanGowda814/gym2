import express from 'express';
import { getDB, saveDB } from '../config/db.js';
import MemberProgress from '../models/MemberProgress.js';
import ProgressPhoto from '../models/ProgressPhoto.js';
import { isMongoConnected } from '../config/mongodb.js';

const router = express.Router();

/**
 * Helper to compute timeframe cutoff date
 */
function getCutoffDate(timeframe) {
  const now = new Date();
  if (timeframe === '1m') {
    now.setMonth(now.getMonth() - 1);
  } else if (timeframe === '3m') {
    now.setMonth(now.getMonth() - 3);
  } else if (timeframe === '6m') {
    now.setMonth(now.getMonth() - 6);
  } else if (timeframe === '1y') {
    now.setFullYear(now.getFullYear() - 1);
  } else {
    return null;
  }
  return now.toISOString().split('T')[0];
}

/**
 * GET /api/member/progress/daily
 * Get daily workout activity logs (for member or trainer)
 */
router.get('/daily', async (req, res) => {
  try {
    const db = getDB();
    const email = (req.query.memberEmail || req.query.email || req.user?.email || '').toLowerCase().trim();
    const trainerEmail = (req.query.trainerEmail || (req.user?.role === 'trainer' ? req.user?.email : '') || '').toLowerCase().trim();
    const timeframe = req.query.timeframe || 'all';
    const cutoff = getCutoffDate(timeframe);

    let progressList = [];

    if (isMongoConnected()) {
      const query = {};
      if (email && req.user?.role !== 'trainer') {
        query.memberEmail = { $regex: new RegExp(`^${email}$`, 'i') };
      } else if (trainerEmail) {
        query.$or = [
          { trainerEmail: { $regex: new RegExp(`^${trainerEmail}$`, 'i') } },
          { trainerName: { $regex: new RegExp(req.user?.name || '', 'i') } }
        ];
      }
      if (cutoff) {
        query.date = { $gte: cutoff };
      }

      const atlasLogs = await MemberProgress.find(query).sort({ date: -1, createdAt: -1 });
      if (atlasLogs && atlasLogs.length > 0) {
        progressList = atlasLogs;
      }
    }

    if (progressList.length === 0) {
      let logs = Array.isArray(db.memberProgress) ? [...db.memberProgress] : [];
      if (email && req.user?.role !== 'trainer') {
        logs = logs.filter(l => l.memberEmail && l.memberEmail.toLowerCase() === email);
      } else if (trainerEmail) {
        logs = logs.filter(l => (l.trainerEmail && l.trainerEmail.toLowerCase() === trainerEmail) || (l.trainerName && req.user?.name && l.trainerName.toLowerCase().includes(req.user.name.toLowerCase())));
      }
      if (cutoff) {
        logs = logs.filter(l => l.date >= cutoff);
      }
      logs.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
      progressList = logs;
    }

    res.json({
      success: true,
      count: progressList.length,
      data: progressList
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching progress logs', error: err.message });
  }
});

/**
 * POST /api/member/progress/daily
 * Member logs a daily activity and shares with trainer (workout photo, target vs done, exercises)
 */
router.post('/daily', async (req, res) => {
  try {
    const {
      workoutTitle,
      category,
      targetWorkouts,
      completedWorkouts,
      durationMinutes,
      caloriesBurned,
      intensity,
      exercises,
      workoutPhoto,
      notes,
      date,
      trainerName,
      trainerEmail
    } = req.body;

    const db = getDB();
    const memberEmail = (req.user?.email || req.body.memberEmail || 'member@apex.com').toLowerCase().trim();
    const memberName = req.user?.name || req.body.memberName || 'Ethan Hunt';
    const memberId = req.user?.userId || req.body.memberId || 'MEM-90210';

    // Find assigned trainer if not explicitly passed
    let resolvedTrainerName = trainerName || 'Coach Shravan';
    let resolvedTrainerEmail = trainerEmail || 'trainer@apex.com';

    if (!trainerName && db.member?.selectedTrainer) {
      resolvedTrainerName = db.member.selectedTrainer.name || resolvedTrainerName;
      resolvedTrainerEmail = db.member.selectedTrainer.email || resolvedTrainerEmail;
    }

    const newProgress = {
      id: `PROG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      memberId,
      memberName,
      memberEmail,
      trainerId: req.body.trainerId || null,
      trainerName: resolvedTrainerName,
      trainerEmail: resolvedTrainerEmail,
      date: date || new Date().toISOString().split('T')[0],
      workoutTitle: workoutTitle || 'Daily Activity Session',
      category: category || 'Strength Training',
      targetWorkouts: Number(targetWorkouts) || 5,
      completedWorkouts: Number(completedWorkouts) || 5,
      durationMinutes: Number(durationMinutes) || 60,
      caloriesBurned: Number(caloriesBurned) || 450,
      intensity: intensity || 'High',
      exercises: Array.isArray(exercises) ? exercises : [],
      workoutPhoto: workoutPhoto || null,
      notes: notes || '',
      trainerFeedback: {
        comment: null,
        rating: 5,
        feedbackDate: null,
        trainerName: null
      },
      createdAt: new Date().toISOString()
    };

    if (!Array.isArray(db.memberProgress)) {
      db.memberProgress = [];
    }
    db.memberProgress.unshift(newProgress);

    saveDB(db);

    // Also persist to MongoDB Atlas immediately
    if (isMongoConnected()) {
      await MemberProgress.create(newProgress).catch(err => console.warn('Mongo create progress warning:', err.message));
    }

    res.status(201).json({
      success: true,
      message: `Daily workout "${newProgress.workoutTitle}" shared successfully with ${resolvedTrainerName}!`,
      data: newProgress
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to save daily progress activity', error: err.message });
  }
});

/**
 * POST /api/member/progress/feedback/:id
 * Trainer reviews and leaves feedback on a member's daily workout activity
 */
router.post('/feedback/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { comment, rating, trainerName } = req.body;
    const db = getDB();

    const reviewerName = trainerName || req.user?.name || 'Coach Shravan';
    const feedbackData = {
      comment: comment || 'Great effort! Keep up the high intensity.',
      rating: Number(rating) || 5,
      feedbackDate: new Date().toISOString().split('T')[0],
      trainerName: reviewerName
    };

    let updated = null;

    if (Array.isArray(db.memberProgress)) {
      const idx = db.memberProgress.findIndex(p => p.id === id);
      if (idx !== -1) {
        db.memberProgress[idx].trainerFeedback = feedbackData;
        updated = db.memberProgress[idx];
        saveDB(db);
      }
    }

    if (isMongoConnected()) {
      const doc = await MemberProgress.findOneAndUpdate(
        { id },
        { trainerFeedback: feedbackData },
        { returnDocument: 'after' }
      );
      if (doc) updated = doc;
    }

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Progress record not found' });
    }

    res.json({
      success: true,
      message: `Feedback submitted to athlete by ${reviewerName}!`,
      data: updated
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to submit trainer feedback', error: err.message });
  }
});

/**
 * GET /api/member/progress/photos
 * Fetch member's progress photos (Front, Side, Back, Before vs Current, Date-wise comparison)
 */
router.get('/photos', async (req, res) => {
  try {
    const db = getDB();
    const email = (req.query.memberEmail || req.query.email || req.user?.email || '').toLowerCase().trim();

    let photos = [];

    if (isMongoConnected()) {
      const query = email ? { memberEmail: { $regex: new RegExp(`^${email}$`, 'i') } } : {};
      const atlasPhotos = await ProgressPhoto.find(query).sort({ date: -1 });
      if (atlasPhotos && atlasPhotos.length > 0) {
        photos = atlasPhotos;
      }
    }

    if (photos.length === 0) {
      let raw = Array.isArray(db.progressPhotos) ? [...db.progressPhotos] : [];
      if (email) {
        raw = raw.filter(p => p.memberEmail && p.memberEmail.toLowerCase() === email);
      }
      raw.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
      photos = raw;
    }

    res.json({
      success: true,
      count: photos.length,
      data: photos
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching progress photos', error: err.message });
  }
});

/**
 * POST /api/member/progress/photos
 * Upload weekly progress photos (Front, Side, Back, Before/Current tag, Body Weight)
 */
router.post('/photos', async (req, res) => {
  try {
    const {
      frontPhoto,
      sidePhoto,
      backPhoto,
      isBefore,
      isCurrent,
      weekNumber,
      bodyWeight,
      weightUnit,
      bodyFatPercentage,
      measurements,
      notes,
      date
    } = req.body;

    const db = getDB();
    const memberEmail = (req.user?.email || req.body.memberEmail || 'member@apex.com').toLowerCase().trim();
    const memberName = req.user?.name || req.body.memberName || 'Ethan Hunt';
    const memberId = req.user?.userId || req.body.memberId || 'MEM-90210';

    const newPhoto = {
      id: `PHOTO-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      memberId,
      memberName,
      memberEmail,
      date: date || new Date().toISOString().split('T')[0],
      weekNumber: weekNumber || `Week ${Math.floor(Math.random() * 20) + 1}`,
      isBefore: Boolean(isBefore),
      isCurrent: Boolean(isCurrent),
      frontPhoto: frontPhoto || null,
      sidePhoto: sidePhoto || null,
      backPhoto: backPhoto || null,
      bodyWeight: bodyWeight ? Number(bodyWeight) : null,
      weightUnit: weightUnit || 'lbs',
      bodyFatPercentage: bodyFatPercentage ? Number(bodyFatPercentage) : null,
      measurements: measurements || { chest: null, waist: null, arms: null, thighs: null },
      notes: notes || '',
      createdAt: new Date().toISOString()
    };

    if (!Array.isArray(db.progressPhotos)) {
      db.progressPhotos = [];
    }

    // If marked as Current, unmark previous isCurrent flags
    if (newPhoto.isCurrent) {
      db.progressPhotos.forEach(p => {
        if (p.memberEmail?.toLowerCase() === memberEmail) {
          p.isCurrent = false;
        }
      });
      if (isMongoConnected()) {
        await ProgressPhoto.updateMany({ memberEmail }, { isCurrent: false }).catch(() => {});
      }
    }

    // If marked as Before, unmark previous isBefore flags
    if (newPhoto.isBefore) {
      db.progressPhotos.forEach(p => {
        if (p.memberEmail?.toLowerCase() === memberEmail) {
          p.isBefore = false;
        }
      });
      if (isMongoConnected()) {
        await ProgressPhoto.updateMany({ memberEmail }, { isBefore: false }).catch(() => {});
      }
    }

    db.progressPhotos.unshift(newPhoto);
    saveDB(db);

    if (isMongoConnected()) {
      await ProgressPhoto.create(newPhoto).catch(err => console.warn('Mongo create photo warning:', err.message));
    }

    res.status(201).json({
      success: true,
      message: `Weekly progress photos for ${newPhoto.weekNumber} saved successfully!`,
      data: newPhoto
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to upload progress photos', error: err.message });
  }
});

/**
 * GET /api/member/progress/reports
 * Comprehensive progress reports (1 Month, 3 Month, 6 Month, 1 Year)
 */
router.get('/reports', async (req, res) => {
  try {
    const db = getDB();
    const email = (req.query.memberEmail || req.query.email || req.user?.email || '').toLowerCase().trim();
    const period = req.query.period || '1m'; // '1m', '3m', '6m', '1y'
    const cutoff = getCutoffDate(period);

    let logs = Array.isArray(db.memberProgress) ? [...db.memberProgress] : [];
    if (email) {
      logs = logs.filter(l => l.memberEmail && l.memberEmail.toLowerCase() === email);
    }
    if (cutoff) {
      logs = logs.filter(l => l.date >= cutoff);
    }
    logs.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Calculate aggregated metrics
    const totalWorkouts = logs.length;
    const totalCalories = logs.reduce((sum, l) => sum + (l.caloriesBurned || 0), 0);
    const totalMinutes = logs.reduce((sum, l) => sum + (l.durationMinutes || 0), 0);
    const totalTargetWorkouts = logs.reduce((sum, l) => sum + (l.targetWorkouts || 5), 0);
    const totalCompletedWorkouts = logs.reduce((sum, l) => sum + (l.completedWorkouts || 5), 0);

    const completionRate = totalTargetWorkouts > 0 ? Math.round((totalCompletedWorkouts / totalTargetWorkouts) * 100) : 100;

    // Intensity breakdown
    const intensityMap = { Light: 0, Moderate: 0, High: 0, Extreme: 0 };
    logs.forEach(l => {
      if (intensityMap[l.intensity] !== undefined) {
        intensityMap[l.intensity]++;
      } else {
        intensityMap.High++;
      }
    });

    // Weight progression from photos or profile
    let photos = Array.isArray(db.progressPhotos) ? [...db.progressPhotos] : [];
    if (email) {
      photos = photos.filter(p => p.memberEmail && p.memberEmail.toLowerCase() === email);
    }
    if (cutoff) {
      photos = photos.filter(p => p.date >= cutoff);
    }
    photos.sort((a, b) => new Date(a.date) - new Date(b.date));

    const weightTimeline = photos
      .filter(p => p.bodyWeight)
      .map(p => ({
        date: p.date,
        week: p.weekNumber,
        weight: p.bodyWeight,
        unit: p.weightUnit || 'lbs',
        bodyFat: p.bodyFatPercentage || null
      }));

    // Weekly workout frequency
    const workoutTimeline = logs.map(l => ({
      date: l.date,
      title: l.workoutTitle,
      calories: l.caloriesBurned,
      duration: l.durationMinutes,
      completed: l.completedWorkouts,
      target: l.targetWorkouts
    }));

    res.json({
      success: true,
      period,
      metrics: {
        totalWorkouts,
        totalCalories,
        totalHours: Math.round((totalMinutes / 60) * 10) / 10,
        completionRate,
        avgCaloriesPerSession: totalWorkouts > 0 ? Math.round(totalCalories / totalWorkouts) : 0,
        intensityDistribution: intensityMap
      },
      weightTimeline,
      workoutTimeline,
      recentLogs: logs.slice().reverse().slice(0, 10)
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to generate progress report', error: err.message });
  }
});

export default router;
