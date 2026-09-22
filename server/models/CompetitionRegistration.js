import mongoose from 'mongoose';

const CompetitionRegistrationSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  competitionId: {
    type: String,
    required: true
  },
  competitionTitle: {
    type: String,
    required: true
  },
  participantId: {
    type: String,
    required: true
  },
  participantName: {
    type: String,
    required: true
  },
  participantEmail: {
    type: String,
    required: true
  },
  participantPhone: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    enum: ['member', 'trainer'],
    default: 'member'
  },
  category: {
    type: String,
    required: true
  },
  division: {
    type: String,
    default: 'Open Division'
  },
  bibNumber: {
    type: String, // e.g. "APX-042"
    required: true
  },
  registrationDate: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Confirmed', 'Pending', 'Disqualified', 'Attended'],
    default: 'Confirmed'
  },
  paymentStatus: {
    type: String,
    enum: ['Free', 'Paid', 'Pending'],
    default: 'Free'
  },
  paymentId: {
    type: String,
    default: null
  },
  score: {
    type: String,
    default: null
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

export default mongoose.models.CompetitionRegistration || mongoose.model('CompetitionRegistration', CompetitionRegistrationSchema);
