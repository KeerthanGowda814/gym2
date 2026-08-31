import mongoose from 'mongoose';

const GymDataSchema = new mongoose.Schema({
  key: { type: String, default: 'main_db', unique: true },
  data: { type: mongoose.Schema.Types.Mixed, required: true }
}, { timestamps: true, minimize: false });

export default mongoose.models.GymData || mongoose.model('GymData', GymDataSchema);
