import mongoose from 'mongoose';

const MemberSchema = new mongoose.Schema({
  memberId: { type: String, default: 'MEM-90210' },
  name: { type: String, required: true },
  email: { type: String, required: true },
  role: { type: String, default: 'member' },
  membershipTier: { type: String, default: 'Muscle Pro' },
  autoRenew: { type: Boolean, default: true },
  daysLeft: { type: Number, default: 30 },
  expiryDate: { type: String },
  nextChargeDate: { type: String },
  renewed: { type: Boolean, default: false },
  attendanceStreak: { type: Number, default: 14 },
  attendanceRate: { type: Number, default: 92 },
  registeredFacePhoto: { type: String, default: null },
  faceRegistered: { type: Boolean, default: false },
  faceRegistrationDate: { type: String }
}, { timestamps: true });

export default mongoose.models.Member || mongoose.model('Member', MemberSchema);
