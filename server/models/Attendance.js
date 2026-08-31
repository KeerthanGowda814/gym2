import mongoose from 'mongoose';

const AttendanceSchema = new mongoose.Schema({
  id: { type: String },
  name: { type: String, required: true },
  code: { type: String },
  scanMethod: { type: String, default: 'AI Face Biometrics' },
  inTime: { type: String },
  outTime: { type: String, default: '--' },
  duration: { type: String, default: '--' },
  date: { type: String, default: 'Today' },
  status: { type: String, default: 'active' },
  confidence: { type: String, default: '98.8%' },
  faceImage: { type: String, default: null },
  refImage: { type: String, default: null }
}, { timestamps: true });

export default mongoose.models.Attendance || mongoose.model('Attendance', AttendanceSchema);
