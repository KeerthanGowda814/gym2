import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { authMiddleware } from './middleware/authMiddleware.js';
import workoutRoutes from './routes/workoutRoutes.js';
import nutritionRoutes from './routes/nutritionRoutes.js';
import membershipRoutes from './routes/membershipRoutes.js';
import trainerRoutes from './routes/trainerRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import supplementRoutes from './routes/supplementRoutes.js';
import equipmentRoutes from './routes/equipmentRoutes.js';
import trainerPanelRoutes from './routes/trainerPanelRoutes.js';
import authRoutes from './routes/authRoutes.js';
import alertRoutes from './routes/alertRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import { connectMongoDB, isMongoConnected } from './config/mongodb.js';

dotenv.config();

// Global Exception & Rejection Handlers to prevent unexpected server crash
process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT EXCEPTION]:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[UNHANDLED REJECTION]:', reason);
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB Database
connectMongoDB();

// Enable CORS and JSON body parser
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Auth Routes (Public)
app.use('/api/auth', authRoutes);

// Alerts Routes (Public for GET, but secured or general in backend)
app.use('/api/alerts', alertRoutes);

// Payment Gateway Routes (Order creation, signature verification, receipts, accounts)
app.use('/api/payment', paymentRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'Apex Athletics Member & Trainer Panel Node.js MongoDB API Backend',
    database: isMongoConnected() ? 'MongoDB' : 'File DB (Fallback)',
    timestamp: new Date().toISOString()
  });
});

// Protected API Routes for Member Panel & Trainer Panel
app.use('/api/member/workouts', authMiddleware, workoutRoutes);
app.use('/api/member/nutrition', authMiddleware, nutritionRoutes);
app.use('/api/member', authMiddleware, membershipRoutes);
app.use('/api/member/trainer', authMiddleware, trainerRoutes);
app.use('/api/member/trainers', authMiddleware, trainerRoutes);
app.use('/api/member/attendance', authMiddleware, attendanceRoutes);
app.use('/api/member/supplements', authMiddleware, supplementRoutes);
app.use('/api/member/equipment', authMiddleware, equipmentRoutes);
app.use('/api/trainer', authMiddleware, trainerPanelRoutes);

// Global 404 Route
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API Route not found: ${req.method} ${req.originalUrl}`
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Server Internal Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: err.message
  });
});

// Start listening
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🏋️ APEX ATHLETICS NODE.JS MONGODB BACKEND SERVER RUNNING`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`====================================================`);
});
