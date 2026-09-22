import mongoose from 'mongoose';

const ProgressPhotoSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  memberId: {
    type: String,
    required: true
  },
  memberName: {
    type: String,
    required: true
  },
  memberEmail: {
    type: String,
    required: true
  },
  date: {
    type: String, // YYYY-MM-DD
    required: true
  },
  weekNumber: {
    type: String, // e.g. "Week 1", "Week 2", "Week 8"
    default: 'Week 1'
  },
  isBefore: {
    type: Boolean,
    default: false
  },
  isCurrent: {
    type: Boolean,
    default: false
  },
  frontPhoto: {
    type: String, // Base64 Data URI
    default: null
  },
  sidePhoto: {
    type: String, // Base64 Data URI
    default: null
  },
  backPhoto: {
    type: String, // Base64 Data URI
    default: null
  },
  bodyWeight: {
    type: Number, // e.g. 78.5 (kg or lbs)
    default: null
  },
  weightUnit: {
    type: String,
    default: 'lbs'
  },
  bodyFatPercentage: {
    type: Number,
    default: null
  },
  measurements: {
    chest: { type: String, default: null },
    waist: { type: String, default: null },
    arms: { type: String, default: null },
    thighs: { type: String, default: null }
  },
  notes: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

export default mongoose.models.ProgressPhoto || mongoose.model('ProgressPhoto', ProgressPhotoSchema);
