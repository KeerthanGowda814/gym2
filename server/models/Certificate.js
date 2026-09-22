import mongoose from 'mongoose';

const CertificateSchema = new mongoose.Schema({
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
  participantRole: {
    type: String,
    enum: ['member', 'trainer'],
    default: 'member'
  },
  category: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['Winner', 'RunnerUp', 'Participation'],
    default: 'Participation'
  },
  rank: {
    type: Number,
    default: null
  },
  awardTitle: {
    type: String,
    default: 'Certificate of Excellence'
  },
  issueDate: {
    type: String,
    required: true
  },
  verificationCode: {
    type: String,
    required: true
  },
  issuedBy: {
    type: String,
    default: 'Apex Athletics Federation'
  },
  directorSignature: {
    type: String,
    default: 'Apex Master Director'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

export default mongoose.models.Certificate || mongoose.model('Certificate', CertificateSchema);
