import mongoose from 'mongoose';

const CompetitionResultSchema = new mongoose.Schema({
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
  published: {
    type: Boolean,
    default: true
  },
  publishedDate: {
    type: String,
    required: true
  },
  summary: {
    type: String,
    default: 'Official apex athletics tournament results published.'
  },
  winners: [{
    rank: { type: Number, required: true }, // 1, 2, 3, etc.
    awardTitle: { type: String, required: true }, // "Gold Champion", "Silver Runner Up", "Bronze 3rd Place"
    participantId: { type: String, default: '' },
    participantName: { type: String, required: true },
    participantEmail: { type: String, required: true },
    category: { type: String, required: true },
    bibNumber: { type: String, default: '' },
    score: { type: String, default: '' }, // e.g., "Total 620 kg (220/150/250)"
    photo: { type: String, default: null }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

export default mongoose.models.CompetitionResult || mongoose.model('CompetitionResult', CompetitionResultSchema);
