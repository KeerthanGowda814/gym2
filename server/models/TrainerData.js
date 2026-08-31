import mongoose from 'mongoose';

const MemberRosterSchema = new mongoose.Schema({
  id: String,
  name: String,
  email: String,
  tier: String,
  status: String,
  joined: String,
  goal: String
});

const WorkoutPlanSchema = new mongoose.Schema({
  id: String,
  name: String,
  target: String,
  duration: String,
  exercises: String,
  clientsAssigned: { type: Number, default: 0 },
  date: String
});

const DietPlanSchema = new mongoose.Schema({
  id: String,
  name: String,
  calories: String,
  protein: String,
  carbs: String,
  fats: String,
  desc: String,
  clientsAssigned: { type: Number, default: 0 }
});

const AgendaSchema = new mongoose.Schema({
  id: String,
  client: String,
  routine: String,
  timeBlock: String,
  status: String
});

const ChatMessageSchema = new mongoose.Schema({
  id: String,
  sender: String,
  text: String,
  time: String
});

const TrainerDataSchema = new mongoose.Schema({
  coachName: { type: String, default: "Coach Marcus Vance" },
  credentials: { type: String, default: "CSCS, M.Sc. Sports Physiology" },
  specialty: { type: String, default: "Barbell Biomechanics & Powerlifting" },
  bio: { type: String },
  members: [MemberRosterSchema],
  workoutPlans: [WorkoutPlanSchema],
  dietPlans: [DietPlanSchema],
  agenda: [AgendaSchema],
  chatHistory: [ChatMessageSchema]
}, { timestamps: true });

export default mongoose.models.TrainerData || mongoose.model('TrainerData', TrainerDataSchema);
