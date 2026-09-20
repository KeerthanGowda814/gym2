import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  userId: { type: String },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['member', 'trainer', 'admin'], default: 'member' },
  age: { type: Number },
  phone: { type: String },
  specialty: { type: String },
  certifications: { type: String },
  credentials: { type: String },
  certificateFile: { type: String },
  certificateName: { type: String },
  certificateType: { type: String },
  isApproved: { type: Boolean, default: true },
  bio: { type: String },
  membershipTier: { type: String, default: 'Muscle Pro' },
  status: { type: String, default: 'Active' },
  joinedDate: { type: String }
}, { timestamps: true });

export default mongoose.models.User || mongoose.model('User', UserSchema);
