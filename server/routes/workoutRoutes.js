import express from 'express';
import { getDB, saveDB } from '../config/db.js';

const router = express.Router();

/**
 * GET /api/member/workouts
 * Retrieve all logged workout entries
 */
router.get('/', (req, res) => {
  const db = getDB();
  res.json({
    success: true,
    count: db.workouts.length,
    data: db.workouts
  });
});

/**
 * POST /api/member/workouts
 * Log a new workout entry
 */
router.post('/', (req, res) => {
  const { exercise, weight, reps } = req.body;

  if (!exercise || !weight || !reps) {
    return res.status(400).json({
      success: false,
      message: 'Please provide exercise label, weight workload, and reps count.'
    });
  }

  const db = getDB();
  const newLog = {
    id: `w-${Date.now()}`,
    exercise: exercise.trim(),
    weight: weight.trim(),
    reps: Number(reps),
    time: 'Just Now'
  };

  db.workouts.unshift(newLog); // Place newest at top
  saveDB(db);

  res.status(201).json({
    success: true,
    message: 'Workout log recorded successfully.',
    data: newLog
  });
});

/**
 * DELETE /api/member/workouts/:id
 * Remove a logged exercise entry
 */
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const db = getDB();

  const initialLength = db.workouts.length;
  db.workouts = db.workouts.filter((w) => w.id !== id);

  if (db.workouts.length === initialLength) {
    return res.status(404).json({
      success: false,
      message: 'Workout log entry not found.'
    });
  }

  saveDB(db);

  res.json({
    success: true,
    message: 'Workout log entry deleted.'
  });
});

export default router;
