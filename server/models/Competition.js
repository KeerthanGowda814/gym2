import mongoose from 'mongoose';

const CompetitionSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  bannerImage: {
    type: String,
    default: null
  },
  category: {
    type: String,
    default: 'Open Championship'
  },
  categories: [{
    id: { type: String },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    gender: { type: String, default: 'All' }, // 'Male', 'Female', 'All'
    maxWeightKg: { type: Number, default: null },
    criteria: { type: String, default: '' }
  }],
  schedule: [{
    time: { type: String, required: true },
    event: { type: String, required: true },
    stage: { type: String, default: 'Main Stage' },
    description: { type: String, default: '' }
  }],
  rules: [{
    type: String
  }],
  entryFee: {
    type: Number,
    default: 0 // 0 = Free Entry
  },
  startDate: {
    type: String,
    required: true
  },
  endDate: {
    type: String,
    required: true
  },
  registrationDeadline: {
    type: String,
    required: true
  },
  venue: {
    type: String,
    default: 'Apex Main Sports Arena'
  },
  maxParticipants: {
    type: Number,
    default: 100
  },
  status: {
    type: String,
    enum: ['Upcoming', 'Active', 'Completed'],
    default: 'Upcoming'
  },
  prizePool: {
    type: String,
    default: '₹50,000 + Championship Gold Trophy'
  },
  allowMemberRegistration: {
    type: Boolean,
    default: true
  },
  allowTrainerRegistration: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

export default mongoose.models.Competition || mongoose.model('Competition', CompetitionSchema);
