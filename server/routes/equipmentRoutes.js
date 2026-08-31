import express from 'express';
import { getDB } from '../config/db.js';

const router = express.Router();

/**
 * GET /api/member/equipment
 * Retrieve status and specifications of all floor equipment stations
 */
router.get('/', (req, res) => {
  const db = getDB();
  res.json({
    success: true,
    count: db.equipment.length,
    data: db.equipment
  });
});

/**
 * GET /api/member/equipment/:id
 * Retrieve details for a specific equipment station
 */
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const db = getDB();
  const station = db.equipment.find((e) => e.id === id);

  if (!station) {
    return res.status(404).json({
      success: false,
      message: 'Equipment station not found.'
    });
  }

  res.json({
    success: true,
    data: station
  });
});

export default router;
