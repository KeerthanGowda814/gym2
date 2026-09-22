import express from 'express';
import { getDB, saveDB } from '../config/db.js';
import Competition from '../models/Competition.js';
import CompetitionRegistration from '../models/CompetitionRegistration.js';
import CompetitionResult from '../models/CompetitionResult.js';
import Certificate from '../models/Certificate.js';
import { isMongoConnected } from '../config/mongodb.js';

const router = express.Router();

/**
 * GET /api/competitions
 * Retrieve list of competitions (all or filtered by status: Upcoming, Active, Completed)
 */
router.get('/', async (req, res) => {
  try {
    const db = getDB();
    const statusFilter = req.query.status;

    let competitions = [];

    if (isMongoConnected()) {
      const query = statusFilter ? { status: statusFilter } : {};
      const atlasComps = await Competition.find(query).sort({ startDate: 1 });
      if (atlasComps && atlasComps.length > 0) {
        competitions = atlasComps;
      }
    }

    if (competitions.length === 0) {
      let list = Array.isArray(db.competitions) ? [...db.competitions] : [];
      if (statusFilter) {
        list = list.filter(c => c.status?.toLowerCase() === statusFilter.toLowerCase());
      }
      list.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
      competitions = list;
    }

    // Attach current participant count
    const registrations = Array.isArray(db.competitionRegistrations) ? db.competitionRegistrations : [];
    const enriched = competitions.map(comp => {
      const plain = comp.toObject ? comp.toObject() : { ...comp };
      const compRegs = registrations.filter(r => r.competitionId === plain.id);
      plain.registeredCount = compRegs.length;
      return plain;
    });

    res.json({
      success: true,
      count: enriched.length,
      data: enriched
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch competitions', error: err.message });
  }
});

/**
 * GET /api/competitions/my-registrations
 * Retrieve all competition registrations for current user
 */
router.get('/my-registrations', async (req, res) => {
  try {
    const db = getDB();
    const email = (req.query.email || req.user?.email || '').toLowerCase().trim();

    let myRegs = [];
    if (isMongoConnected()) {
      const atlasRegs = await CompetitionRegistration.find({
        participantEmail: { $regex: new RegExp(`^${email}$`, 'i') }
      }).sort({ createdAt: -1 });
      if (atlasRegs && atlasRegs.length > 0) {
        myRegs = atlasRegs;
      }
    }

    if (myRegs.length === 0) {
      const list = Array.isArray(db.competitionRegistrations) ? db.competitionRegistrations : [];
      myRegs = list.filter(r => r.participantEmail && r.participantEmail.toLowerCase() === email);
    }

    res.json({
      success: true,
      count: myRegs.length,
      data: myRegs
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch registrations', error: err.message });
  }
});

/**
 * GET /api/competitions/certificates/my
 * Retrieve all certificates issued to the current user
 */
router.get('/certificates/my', async (req, res) => {
  try {
    const db = getDB();
    const email = (req.query.email || req.user?.email || '').toLowerCase().trim();

    let certs = [];
    if (isMongoConnected()) {
      const atlasCerts = await Certificate.find({
        participantEmail: { $regex: new RegExp(`^${email}$`, 'i') }
      }).sort({ createdAt: -1 });
      if (atlasCerts && atlasCerts.length > 0) {
        certs = atlasCerts;
      }
    }

    if (certs.length === 0) {
      const list = Array.isArray(db.certificates) ? db.certificates : [];
      certs = list.filter(c => c.participantEmail && c.participantEmail.toLowerCase() === email);
    }

    res.json({
      success: true,
      count: certs.length,
      data: certs
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch certificates', error: err.message });
  }
});

/**
 * GET /api/competitions/certificates/:certId
 * Verification / detail of a specific certificate
 */
router.get('/certificates/:certId', async (req, res) => {
  try {
    const { certId } = req.params;
    const db = getDB();

    let cert = null;
    if (isMongoConnected()) {
      cert = await Certificate.findOne({ id: certId });
    }

    if (!cert) {
      cert = (db.certificates || []).find(c => c.id === certId || c.verificationCode === certId);
    }

    if (!cert) {
      return res.status(404).json({ success: false, message: 'Certificate not found' });
    }

    res.json({
      success: true,
      data: cert
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error retrieving certificate', error: err.message });
  }
});

/**
 * GET /api/competitions/:id
 * Retrieve details of a specific competition
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();

    let comp = null;
    if (isMongoConnected()) {
      comp = await Competition.findOne({ id });
    }

    if (!comp) {
      comp = (db.competitions || []).find(c => c.id === id);
    }

    if (!comp) {
      return res.status(404).json({ success: false, message: 'Competition not found' });
    }

    const registrations = (db.competitionRegistrations || []).filter(r => r.competitionId === id);
    const resultDoc = (db.competitionResults || []).find(r => r.competitionId === id);

    const compObj = comp.toObject ? comp.toObject() : { ...comp };
    compObj.participants = registrations;
    compObj.results = resultDoc || null;

    res.json({
      success: true,
      data: compObj
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error loading competition details', error: err.message });
  }
});

/**
 * POST /api/competitions
 * Admin creates a new competition
 */
router.post('/', async (req, res) => {
  try {
    const {
      title,
      description,
      bannerImage,
      category,
      categories,
      schedule,
      rules,
      entryFee,
      startDate,
      endDate,
      registrationDeadline,
      venue,
      maxParticipants,
      status,
      prizePool,
      allowMemberRegistration,
      allowTrainerRegistration
    } = req.body;

    const db = getDB();

    const newComp = {
      id: `COMP-${Date.now()}`,
      title: title || 'New Apex Championship',
      description: description || 'Official tournament held by Apex Athletics.',
      bannerImage: bannerImage || 'assets/images/gallery_weights.png',
      category: category || 'General Championship',
      categories: Array.isArray(categories) && categories.length > 0 ? categories : [
        { id: `cat-1`, name: 'Open Men Division', description: 'All-weight class division', gender: 'Male', maxWeightKg: null, criteria: 'Standard division' },
        { id: `cat-2`, name: 'Open Women Division', description: 'All-weight class division', gender: 'Female', maxWeightKg: null, criteria: 'Standard division' }
      ],
      schedule: Array.isArray(schedule) && schedule.length > 0 ? schedule : [
        { time: '09:00 AM - 10:00 AM', event: 'Athlete Check-in & Weigh-ins', stage: 'Main Deck', description: 'Official athlete badge collection.' },
        { time: '11:00 AM - 04:00 PM', event: 'Main Competition Rounds', stage: 'Arena Stage', description: 'Tournament heats and rounds.' },
        { time: '05:30 PM - 06:30 PM', event: 'Podium & Awards Ceremony', stage: 'Main Stage', description: 'Official trophies and certificates.' }
      ],
      rules: Array.isArray(rules) && rules.length > 0 ? rules : [
        'All participants must check in with biometric keycard or government photo ID.',
        'Official athletic uniform or division standard attire strictly enforced.',
        'Good sportsmanship and fair play standards mandated by the committee.'
      ],
      entryFee: Number(entryFee) || 0,
      startDate: startDate || new Date().toISOString().split('T')[0],
      endDate: endDate || new Date().toISOString().split('T')[0],
      registrationDeadline: registrationDeadline || new Date().toISOString().split('T')[0],
      venue: venue || 'Apex Athletics Main Arena',
      maxParticipants: Number(maxParticipants) || 100,
      status: status || 'Upcoming',
      prizePool: prizePool || '₹50,000 + Championship Gold Trophy',
      allowMemberRegistration: allowMemberRegistration !== false,
      allowTrainerRegistration: allowTrainerRegistration !== false,
      createdAt: new Date().toISOString()
    };

    if (!Array.isArray(db.competitions)) db.competitions = [];
    db.competitions.unshift(newComp);
    saveDB(db);

    if (isMongoConnected()) {
      await Competition.create(newComp).catch(err => console.warn('Mongo create competition error:', err.message));
    }

    res.status(201).json({
      success: true,
      message: `Competition "${newComp.title}" created successfully!`,
      data: newComp
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create competition', error: err.message });
  }
});

/**
 * PUT /api/competitions/:id
 * Admin updates a competition
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();

    if (!Array.isArray(db.competitions)) db.competitions = [];
    const idx = db.competitions.findIndex(c => c.id === id);

    if (idx === -1) {
      return res.status(404).json({ success: false, message: 'Competition not found' });
    }

    const updated = {
      ...db.competitions[idx],
      ...req.body,
      id // preserve ID
    };

    db.competitions[idx] = updated;
    saveDB(db);

    if (isMongoConnected()) {
      await Competition.findOneAndUpdate({ id }, updated).catch(() => {});
    }

    res.json({
      success: true,
      message: `Competition "${updated.title}" updated successfully!`,
      data: updated
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update competition', error: err.message });
  }
});

/**
 * DELETE /api/competitions/:id
 * Admin deletes a competition
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();

    if (Array.isArray(db.competitions)) {
      db.competitions = db.competitions.filter(c => c.id !== id);
      saveDB(db);
    }

    if (isMongoConnected()) {
      await Competition.findOneAndDelete({ id }).catch(() => {});
      await CompetitionRegistration.deleteMany({ competitionId: id }).catch(() => {});
      await CompetitionResult.deleteMany({ competitionId: id }).catch(() => {});
      await Certificate.deleteMany({ competitionId: id }).catch(() => {});
    }

    res.json({
      success: true,
      message: 'Competition and related records removed successfully.'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete competition', error: err.message });
  }
});

/**
 * POST /api/competitions/:id/register
 * Member or Trainer registers for an event
 */
router.post('/:id/register', async (req, res) => {
  try {
    const { id } = req.params;
    const { category, division, phone, notes } = req.body;
    const db = getDB();

    const comp = (db.competitions || []).find(c => c.id === id);
    if (!comp) {
      return res.status(404).json({ success: false, message: 'Competition not found' });
    }

    const participantEmail = (req.user?.email || req.body.participantEmail || 'member@apex.com').toLowerCase().trim();
    const participantName = req.user?.name || req.body.participantName || 'Ethan Hunt';
    const participantId = req.user?.userId || req.body.participantId || 'MEM-90210';
    const role = req.user?.role === 'trainer' ? 'trainer' : 'member';

    if (!Array.isArray(db.competitionRegistrations)) db.competitionRegistrations = [];

    // Check if already registered
    const existing = db.competitionRegistrations.find(
      r => r.competitionId === id && r.participantEmail.toLowerCase() === participantEmail
    );

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `You are already registered for this competition! Athlete Bib: ${existing.bibNumber}`
      });
    }

    // Generate unique Bib Number
    const count = db.competitionRegistrations.filter(r => r.competitionId === id).length + 1;
    const bibNumber = `APX-${String(count).padStart(3, '0')}`;

    const newReg = {
      id: `REG-${Date.now()}`,
      competitionId: id,
      competitionTitle: comp.title,
      participantId,
      participantName,
      participantEmail,
      participantPhone: phone || req.user?.phone || '+1 (555) 777-7777',
      role,
      category: category || (comp.categories?.[0]?.name || 'Open Division'),
      division: division || 'Standard',
      bibNumber,
      registrationDate: new Date().toISOString().split('T')[0],
      status: 'Confirmed',
      paymentStatus: comp.entryFee > 0 ? 'Paid' : 'Free',
      paymentId: comp.entryFee > 0 ? `pay_comp_${Date.now()}` : null,
      score: null,
      notes: notes || '',
      createdAt: new Date().toISOString()
    };

    db.competitionRegistrations.unshift(newReg);
    saveDB(db);

    if (isMongoConnected()) {
      await CompetitionRegistration.create(newReg).catch(err => console.warn('Mongo reg error:', err.message));
    }

    res.status(201).json({
      success: true,
      message: `Registration confirmed for "${comp.title}"! Your athlete bib number is ${bibNumber}.`,
      data: newReg
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to register for competition', error: err.message });
  }
});

/**
 * GET /api/competitions/:id/participants
 * Retrieve participants roster for a competition
 */
router.get('/:id/participants', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();

    let participants = [];
    if (isMongoConnected()) {
      participants = await CompetitionRegistration.find({ competitionId: id }).sort({ bibNumber: 1 });
    }

    if (!participants || participants.length === 0) {
      participants = (db.competitionRegistrations || []).filter(r => r.competitionId === id);
    }

    res.json({
      success: true,
      count: participants.length,
      data: participants
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to load participants', error: err.message });
  }
});

/**
 * POST /api/competitions/:id/results
 * Admin publishes winners and scores
 */
router.post('/:id/results', async (req, res) => {
  try {
    const { id } = req.params;
    const { winners, summary } = req.body;
    const db = getDB();

    const comp = (db.competitions || []).find(c => c.id === id);
    if (!comp) {
      return res.status(404).json({ success: false, message: 'Competition not found' });
    }

    const resultId = `RES-${id}`;
    const resultDoc = {
      id: resultId,
      competitionId: id,
      competitionTitle: comp.title,
      published: true,
      publishedDate: new Date().toISOString().split('T')[0],
      summary: summary || `Official standings and podium results for ${comp.title}.`,
      winners: Array.isArray(winners) ? winners : [],
      createdAt: new Date().toISOString()
    };

    if (!Array.isArray(db.competitionResults)) db.competitionResults = [];
    const existingIdx = db.competitionResults.findIndex(r => r.competitionId === id);
    if (existingIdx !== -1) {
      db.competitionResults[existingIdx] = resultDoc;
    } else {
      db.competitionResults.unshift(resultDoc);
    }

    // Mark competition as Completed
    const compIdx = db.competitions.findIndex(c => c.id === id);
    if (compIdx !== -1) {
      db.competitions[compIdx].status = 'Completed';
    }

    saveDB(db);

    if (isMongoConnected()) {
      await CompetitionResult.findOneAndUpdate({ id: resultId }, resultDoc, { upsert: true }).catch(() => {});
      await Competition.findOneAndUpdate({ id }, { status: 'Completed' }).catch(() => {});
    }

    res.json({
      success: true,
      message: `Results published for "${comp.title}"! Athletes and trainers can now view standings.`,
      data: resultDoc
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to publish results', error: err.message });
  }
});

/**
 * GET /api/competitions/:id/results
 * View official results and winners podium
 */
router.get('/:id/results', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();

    let result = null;
    if (isMongoConnected()) {
      result = await CompetitionResult.findOne({ competitionId: id });
    }

    if (!result) {
      result = (db.competitionResults || []).find(r => r.competitionId === id);
    }

    if (!result) {
      return res.status(404).json({ success: false, message: 'Results have not been published for this competition yet.' });
    }

    res.json({
      success: true,
      data: result
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve results', error: err.message });
  }
});

/**
 * POST /api/competitions/:id/certificates/generate
 * Admin generates official digital certificates for all participants and podium winners
 */
router.post('/:id/certificates/generate', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();

    const comp = (db.competitions || []).find(c => c.id === id);
    if (!comp) {
      return res.status(404).json({ success: false, message: 'Competition not found' });
    }

    const participants = (db.competitionRegistrations || []).filter(r => r.competitionId === id);
    const results = (db.competitionResults || []).find(r => r.competitionId === id);

    if (participants.length === 0) {
      return res.status(400).json({ success: false, message: 'No registered participants found to issue certificates.' });
    }

    if (!Array.isArray(db.certificates)) db.certificates = [];

    const issuedCertificates = [];
    const todayStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    for (const p of participants) {
      // Check if winner in results
      const winnerMatch = results?.winners?.find(w => 
        (w.participantEmail && w.participantEmail.toLowerCase() === p.participantEmail.toLowerCase()) ||
        (w.participantName && w.participantName.toLowerCase() === p.participantName.toLowerCase())
      );

      let certType = 'Participation';
      let rank = null;
      let awardTitle = 'Certificate of Participation';

      if (winnerMatch) {
        rank = winnerMatch.rank;
        if (winnerMatch.rank === 1) {
          certType = 'Winner';
          awardTitle = `Gold Champion 🥇 - 1st Place (${winnerMatch.score || 'Top Score'})`;
        } else if (winnerMatch.rank === 2) {
          certType = 'RunnerUp';
          awardTitle = `Silver Runner Up 🥈 - 2nd Place (${winnerMatch.score || 'Podium'})`;
        } else if (winnerMatch.rank === 3) {
          certType = 'RunnerUp';
          awardTitle = `Bronze 3rd Place 🥉 - Podium Finalist`;
        } else {
          certType = 'Participation';
          awardTitle = `Podium Finalist - Rank #${winnerMatch.rank}`;
        }
      }

      const certId = `CERT-APX-${comp.id.replace(/[^a-zA-Z0-9]/g, '')}-${p.bibNumber.replace(/[^a-zA-Z0-9]/g, '')}`;
      const verificationCode = `APX-VER-${Math.floor(100000 + Math.random() * 900000)}-${p.bibNumber}`;

      const certDoc = {
        id: certId,
        competitionId: comp.id,
        competitionTitle: comp.title,
        participantId: p.participantId,
        participantName: p.participantName,
        participantEmail: p.participantEmail,
        participantRole: p.role || 'member',
        category: p.category,
        type: certType,
        rank,
        awardTitle,
        issueDate: todayStr,
        verificationCode,
        issuedBy: 'Apex Athletics Federation & Board of Directors',
        directorSignature: 'Master Director Keerthan Gowda',
        createdAt: new Date().toISOString()
      };

      // Upsert into db.certificates
      const existingIdx = db.certificates.findIndex(c => c.id === certId);
      if (existingIdx !== -1) {
        db.certificates[existingIdx] = certDoc;
      } else {
        db.certificates.unshift(certDoc);
      }

      issuedCertificates.push(certDoc);

      if (isMongoConnected()) {
        await Certificate.findOneAndUpdate({ id: certId }, certDoc, { upsert: true }).catch(() => {});
      }
    }

    saveDB(db);

    res.json({
      success: true,
      message: `Successfully generated and issued ${issuedCertificates.length} official digital certificates!`,
      count: issuedCertificates.length,
      data: issuedCertificates
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to generate certificates', error: err.message });
  }
});

export default router;
