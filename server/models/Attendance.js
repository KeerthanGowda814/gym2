import mongoose from 'mongoose';

const AttendanceSchema = new mongoose.Schema({
  id: { type: String },
  userId: { type: String },
  userEmail: { type: String, required: true, index: true },
  memberName: { type: String, required: true },
  code: { type: String },
  scanMethod: { type: String, default: 'Manual Keycard' },
  gateAction: { type: String, default: 'Gate Entry Check-in' },
  inTime: { type: String },
  outTime: { type: String, default: '--' },
  duration: { type: String, default: '--' },
  hoursLogged: { type: String, default: '--' },
  date: { type: String },
  monthYear: { type: String },
  dayOfMonth: { type: Number },
  status: { type: String, default: 'Active' },
  confidence: { type: String },
  faceImage: { type: String, default: null },
  refImage: { type: String, default: null }
}, { timestamps: true });

export default mongoose.models.Attendance || mongoose.model('Attendance', AttendanceSchema);
