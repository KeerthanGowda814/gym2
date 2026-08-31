import mongoose from 'mongoose';

const WorkoutSchema = new mongoose.Schema({
  id: { type: String },
  exercise: { type: String, required: true },
  weight: { type: String, required: true },
  reps: { type: Number, required: true },
  time: { type: String, default: 'Today' },
  memberName: { type: String, default: 'Ethan Hunt' }
}, { timestamps: true });

export default mongoose.models.Workout || mongoose.model('Workout', WorkoutSchema);
