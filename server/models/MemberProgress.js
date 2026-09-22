import mongoose from 'mongoose';

const MemberProgressSchema = new mongoose.Schema({
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
  trainerId: {
    type: String,
    default: null
  },
  trainerName: {
    type: String,
    default: 'Unassigned Coach'
  },
  trainerEmail: {
    type: String,
    default: null
  },
  date: {
    type: String, // e.g. YYYY-MM-DD
    required: true
  },
  workoutTitle: {
    type: String,
    required: true
  },
  category: {
    type: String,
    default: 'Strength Training' // Strength, Hypertrophy, Cardio, HIIT, Mobility, Powerlifting
  },
  targetWorkouts: {
    type: Number,
    default: 5 // How many workouts/exercises he should do
  },
  completedWorkouts: {
    type: Number,
    default: 5 // Actual completed workouts/exercises
  },
  durationMinutes: {
    type: Number,
    default: 60
  },
  caloriesBurned: {
    type: Number,
    default: 450
  },
  intensity: {
    type: String,
    enum: ['Light', 'Moderate', 'High', 'Extreme'],
    default: 'High'
  },
  exercises: [{
    name: String,
    sets: Number,
    reps: Number,
    weight: String,
    completed: { type: Boolean, default: true }
  }],
  workoutPhoto: {
    type: String, // Base64 data URI or image URL
    default: null
  },
  notes: {
    type: String, // Member note to trainer
    default: ''
  },
  trainerFeedback: {
    comment: { type: String, default: null },
    rating: { type: Number, default: 5 }, // 1 to 5 stars
    feedbackDate: { type: String, default: null },
    trainerName: { type: String, default: null }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

export default mongoose.models.MemberProgress || mongoose.model('MemberProgress', MemberProgressSchema);
