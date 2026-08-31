import express from 'express';
import { getDB, saveDB } from '../config/db.js';

const router = express.Router();

/**
 * GET /api/member/nutrition
 * Retrieve macro levels and targets
 */
router.get('/', (req, res) => {
  const db = getDB();
  res.json({
    success: true,
    data: db.nutrition
  });
});

/**
 * PUT /api/member/nutrition
 * Update daily consumed macros
 */
router.put('/', (req, res) => {
  const { protein, carbs, fats } = req.body;
  const db = getDB();

  if (protein !== undefined) db.nutrition.protein.current = Number(protein);
  if (carbs !== undefined) db.nutrition.carbs.current = Number(carbs);
  if (fats !== undefined) db.nutrition.fats.current = Number(fats);

  saveDB(db);

  res.json({
    success: true,
    message: 'Daily macro levels updated successfully.',
    data: db.nutrition
  });
});

export default router;
