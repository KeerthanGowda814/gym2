import React, { useState, useEffect } from 'react';
import { competitionApi } from '../services/competitionApi';
import { CustomSwal } from '../utils/swal';

export default function AdminCompetitionManagement({ currentUser, onNavigateSubView }) {
  const [activeSubTab, setActiveSubTab] = useState('list');
  // 'create', 'list', 'registration', 'participants', 'categories', 'schedule', 'results', 'certificates'

  const [competitions, setCompetitions] = useState([]);
  const [selectedCompId, setSelectedCompId] = useState('');
  const [selectedComp, setSelectedComp] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form state for Create / Edit Competition
  const [compForm, setCompForm] = useState({
    title: '',
    description: '',
    bannerImage: 'assets/images/gallery_weights.png',
    category: 'Powerlifting',
    entryFee: 1500,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    registrationDeadline: new Date().toISOString().split('T')[0],
    venue: 'Apex Athletics Grand Arena, Hall 1',
    maxParticipants: 80,
    status: 'Upcoming',
    prizePool: '₹75,000 Cash Pool + Gold Cup',
    allowMemberRegistration: true,
    allowTrainerRegistration: true,
    categories: [
      { id: 'cat-1', name: 'Men Open Heavyweight (90kg+)', description: 'Raw open class', gender: 'Male', maxWeightKg: 120, criteria: 'Standard raw' },
      { id: 'cat-2', name: 'Women Open Division', description: 'Open class', gender: 'Female', maxWeightKg: 80, criteria: 'Standard raw' }
    ],
    schedule: [
      { time: '08:00 AM - 09:30 AM', event: 'Weigh-in & Gear Inspection', stage: 'Locker Hall A', description: 'Scale check' },
      { time: '10:00 AM - 02:00 PM', event: 'Prelims & Heats', stage: 'Main Stage Platform', description: 'Flight rounds' },
      { time: '04:00 PM - 06:00 PM', event: 'Championship Finals', stage: 'Main Stage Platform', description: 'Final showdown' }
    ],
    rules: [
      'Singlet and approved lifting belt required.',
      'Strict IPF / Federation movement standards apply.',
      'Athletes must report to weigh-ins on time.'
    ]
  });

  // Results publisher state
  const [resultForm, setResultForm] = useState({
    summary: 'Official tournament standings verified by tournament director.',
    winner1: { participantName: '', participantEmail: '', category: '', bibNumber: '', score: '', awardTitle: 'Gold Champion 🥇' },
    winner2: { participantName: '', participantEmail: '', category: '', bibNumber: '', score: '', awardTitle: 'Silver Runner Up 🥈' },
    winner3: { participantName: '', participantEmail: '', category: '', bibNumber: '', score: '', awardTitle: 'Bronze 3rd Place 🥉' }
  });

  const [certificatesList, setCertificatesList] = useState([]);

  // Fetch competitions
  const fetchCompetitions = async () => {
    setIsLoading(true);
    try {
      const data = await competitionApi.getCompetitions();
      setCompetitions(data || []);
      if (data && data.length > 0) {
        if (!selectedCompId || !data.some(c => c.id === selectedCompId)) {
          setSelectedCompId(data[0].id);
          setSelectedComp(data[0]);
        } else {
          const current = data.find(c => c.id === selectedCompId);
          setSelectedComp(current || data[0]);
        }
      }
    } catch (err) {
      console.warn('Admin load comps error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch participants for selected competition
  const fetchParticipants = async (compId) => {
    if (!compId) return;
    try {
      const list = await competitionApi.getParticipants(compId);
      setParticipants(list || []);

      // If winners form empty, pre-fill from top participants
      if (list && list.length >= 1) {
        setResultForm(prev => ({
          ...prev,
          winner1: {
            participantName: list[0]?.participantName || '',
            participantEmail: list[0]?.participantEmail || '',
            category: list[0]?.category || '',
            bibNumber: list[0]?.bibNumber || '',
            score: list[0]?.score || 'Top Score',
            awardTitle: 'Gold Champion 🥇'
          },
          winner2: list[1] ? {
            participantName: list[1]?.participantName || '',
            participantEmail: list[1]?.participantEmail || '',
            category: list[1]?.category || '',
            bibNumber: list[1]?.bibNumber || '',
            score: list[1]?.score || 'Second Split',
            awardTitle: 'Silver Runner Up 🥈'
          } : prev.winner2,
          winner3: list[2] ? {
            participantName: list[2]?.participantName || '',
            participantEmail: list[2]?.participantEmail || '',
            category: list[2]?.category || '',
            bibNumber: list[2]?.bibNumber || '',
            score: list[2]?.score || 'Podium Finish',
            awardTitle: 'Bronze 3rd Place 🥉'
          } : prev.winner3
        }));
      }
    } catch (err) {
      console.warn('Error fetching participants:', err);
    }
  };

  useEffect(() => {
    fetchCompetitions();
  }, []);

  useEffect(() => {
    if (selectedCompId) {
      const comp = competitions.find(c => c.id === selectedCompId);
      setSelectedComp(comp || null);
      fetchParticipants(selectedCompId);
    }
  }, [selectedCompId, competitions]);

  // Handle Competition Creation
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      await competitionApi.createCompetition(compForm);
      CustomSwal.fire({
        title: 'Competition Created! 🏆',
        text: `"${compForm.title}" is now published and stored in MongoDB database!`,
        icon: 'success'
      });
      fetchCompetitions();
      setActiveSubTab('list');
    } catch (err) {
      CustomSwal.fire({ title: 'Creation Failed', text: err.message || 'Error saving competition', icon: 'error' });
    }
  };

  // Handle Delete
  const handleDeleteComp = async (id, title) => {
    const confirm = await CustomSwal.fire({
      title: `Delete "${title}"?`,
      text: 'This will remove the competition, participants, results, and certificates from MongoDB.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Delete',
      confirmButtonColor: '#ff3e6c'
    });

    if (confirm.isConfirmed) {
      try {
        await competitionApi.deleteCompetition(id);
        CustomSwal.fire({ title: 'Deleted', text: 'Competition deleted.', icon: 'success' });
        fetchCompetitions();
      } catch (err) {
        CustomSwal.fire({ title: 'Error', text: err.message, icon: 'error' });
      }
    }
  };

  // Handle Status Toggle
  const handleToggleStatus = async (comp, newStatus) => {
    try {
      await competitionApi.updateCompetition(comp.id, { status: newStatus });
      CustomSwal.fire({ title: 'Status Updated', text: `Set status to ${newStatus}`, icon: 'success' });
      fetchCompetitions();
    } catch (err) {
      CustomSwal.fire({ title: 'Error', text: err.message, icon: 'error' });
    }
  };

  // Handle Results Publish
  const handlePublishResultsSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCompId) return;

    const winnersArray = [
      { rank: 1, ...resultForm.winner1 },
      { rank: 2, ...resultForm.winner2 },
      { rank: 3, ...resultForm.winner3 }
    ].filter(w => w.participantName.trim());

    if (winnersArray.length === 0) {
      CustomSwal.fire({ title: 'Missing Winners', text: 'Please enter at least 1 winner for the podium.', icon: 'warning' });
      return;
    }

    try {
      await competitionApi.publishResults(selectedCompId, {
        winners: winnersArray,
        summary: resultForm.summary
      });
      CustomSwal.fire({
        title: 'Results Published! 🥇',
        text: `Official results published live for athletes and coaches to view.`,
        icon: 'success'
      });
      fetchCompetitions();
    } catch (err) {
      CustomSwal.fire({ title: 'Error', text: err.message, icon: 'error' });
    }
  };

  // Batch Certificate Generator
  const handleBatchGenerateCertificates = async () => {
    if (!selectedCompId) return;
    try {
      const res = await competitionApi.generateCertificates(selectedCompId);
      CustomSwal.fire({
        title: 'Certificates Generated! 📜',
        text: `Successfully issued ${res.count || 'all'} verified digital certificates for "${selectedComp?.title}"!`,
        icon: 'success'
      });
      if (res.data) {
        setCertificatesList(res.data);
      }
    } catch (err) {
      CustomSwal.fire({ title: 'Generation Failed', text: err.message, icon: 'error' });
    }
  };

  return (
    <div className="admin-competition-management" style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
      {/* HEADER BAR */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '1.5rem',
        padding: '1.4rem 1.8rem',
        background: 'linear-gradient(135deg, rgba(255, 94, 0, 0.15), rgba(255, 215, 0, 0.08))',
        borderRadius: '14px',
        border: '1px solid var(--accent-volt, #ff5e00)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.35)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
            <span style={{ fontSize: '1.8rem' }}>🏆</span>
            <h2 style={{
              margin: 0,
              fontSize: '1.6rem',
              fontWeight: 800,
              fontFamily: 'var(--font-display, sans-serif)',
              color: 'var(--text-white, #fff)',
              letterSpacing: '0.5px'
            }}>
              COMPETITION MANAGEMENT CONSOLE 🏆
            </h2>
          </div>
          <p style={{ margin: 0, color: 'var(--text-dim, #8E919F)', fontSize: '0.85rem' }}>
            Manage tournaments, categories, participant rosters, event schedules, publish podium results, and batch generate official certificates.
          </p>
        </div>

        {/* Action button */}
        <button
          className="glow-btn"
          onClick={() => setActiveSubTab('create')}
          style={{
            padding: '0.65rem 1.4rem',
            background: 'var(--accent-volt)',
            color: '#000',
            fontWeight: 800,
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          ➕ Create New Competition
        </button>
      </div>

      {/* 8-NODE HIERARCHICAL NAVIGATION TABS */}
      <div style={{
        display: 'flex',
        gap: '0.4rem',
        borderBottom: '1px solid var(--border-color)',
        marginBottom: '1.8rem',
        paddingBottom: '0.5rem',
        overflowX: 'auto'
      }}>
        {[
          { id: 'list', label: 'Competition List', icon: '📋' },
          { id: 'create', label: 'Create Competition', icon: '➕' },
          { id: 'registration', label: 'Registration', icon: '📝' },
          { id: 'participants', label: 'Participants', icon: '👥' },
          { id: 'categories', label: 'Categories', icon: '🏷️' },
          { id: 'schedule', label: 'Schedule', icon: '⏱️' },
          { id: 'results', label: 'Results / Winners', icon: '🥇' },
          { id: 'certificates', label: 'Certificates', icon: '📜' }
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveSubTab(tab.id)}
            style={{
              padding: '0.6rem 1.1rem',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.82rem',
              fontWeight: 800,
              whiteSpace: 'nowrap',
              background: activeSubTab === tab.id ? 'var(--accent-volt)' : 'transparent',
              color: activeSubTab === tab.id ? '#000' : 'var(--text-muted)',
              boxShadow: activeSubTab === tab.id ? '0 0 15px rgba(255, 94, 0, 0.3)' : 'none'
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* COMPETITION SELECTOR DROPDOWN (FOR CONTEXT-SENSITIVE TABS) */}
      {['registration', 'participants', 'categories', 'schedule', 'results', 'certificates'].includes(activeSubTab) && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          background: 'var(--bg-card)',
          padding: '0.9rem 1.4rem',
          borderRadius: '10px',
          border: '1px solid var(--border-color)',
          marginBottom: '1.5rem'
        }}>
          <span style={{ color: 'var(--accent-volt)', fontWeight: 800, fontSize: '0.85rem' }}>
            Selected Tournament:
          </span>
          <select
            value={selectedCompId}
            onChange={(e) => setSelectedCompId(e.target.value)}
            style={{
              flex: 1,
              background: '#0d0d15',
              border: '1px solid var(--border-color)',
              color: '#fff',
              padding: '0.5rem 0.9rem',
              borderRadius: '6px',
              fontSize: '0.85rem'
            }}
          >
            {competitions.map(c => (
              <option key={c.id} value={c.id}>
                {c.title} [{c.status}] - {c.venue}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* ======================================================== */}
      {/* 1. COMPETITION LIST                                      */}
      {/* ======================================================== */}
      {activeSubTab === 'list' && (
        <div>
          {isLoading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-dim)' }}>
              Loading competitions from MongoDB...
            </div>
          ) : competitions.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-dim)' }}>
              No competitions found. Click "Create New Competition" above to add one.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.4rem' }}>
              {competitions.map((comp) => (
                <div
                  key={comp.id}
                  style={{
                    background: 'var(--bg-card, #12121c)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    padding: '1.4rem',
                    boxShadow: '0 6px 20px rgba(0,0,0,0.3)',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                    <span style={{
                      background: comp.status === 'Active' ? 'rgba(0, 240, 255, 0.15)' : comp.status === 'Completed' ? 'rgba(100, 100, 120, 0.2)' : 'rgba(255, 204, 0, 0.15)',
                      color: comp.status === 'Active' ? 'var(--accent-cyan)' : comp.status === 'Completed' ? '#aaa' : '#ffcc00',
                      padding: '0.2rem 0.6rem',
                      borderRadius: '4px',
                      fontSize: '0.72rem',
                      fontWeight: 800
                    }}>
                      {comp.status}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      {comp.registeredCount || 0} / {comp.maxParticipants} Enrolled
                    </span>
                  </div>

                  <h3 style={{ margin: '0 0 0.4rem 0', color: 'var(--text-white)', fontSize: '1.15rem', fontWeight: 800 }}>
                    {comp.title}
                  </h3>
                  <p style={{ margin: '0 0 0.8rem 0', color: 'var(--text-dim)', fontSize: '0.8rem', lineHeight: '1.4' }}>
                    {comp.description}
                  </p>

                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.6rem', borderRadius: '6px', fontSize: '0.75rem', marginBottom: '1rem' }}>
                    <div>Date: <strong style={{ color: 'var(--text-white)' }}>{comp.startDate}</strong></div>
                    <div>Prize: <strong style={{ color: '#ffcc00' }}>{comp.prizePool}</strong></div>
                    <div>Entry Fee: <strong style={{ color: 'var(--accent-volt)' }}>{comp.entryFee === 0 ? 'FREE' : `₹${comp.entryFee}`}</strong></div>
                  </div>

                  {/* Actions Bar */}
                  <div style={{ marginTop: 'auto', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCompId(comp.id);
                        setActiveSubTab('participants');
                      }}
                      style={{ flex: 1, padding: '0.45rem', background: 'rgba(255,255,255,0.05)', color: 'var(--text-white)', border: '1px solid var(--border-color)', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 700 }}
                    >
                      👥 Roster ({comp.registeredCount || 0})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCompId(comp.id);
                        setActiveSubTab('results');
                      }}
                      style={{ flex: 1, padding: '0.45rem', background: 'rgba(255, 204, 0, 0.1)', color: '#ffcc00', border: '1px solid rgba(255, 204, 0, 0.3)', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 700 }}
                    >
                      🥇 Results
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(comp, comp.status === 'Active' ? 'Completed' : 'Active')}
                      style={{ padding: '0.45rem 0.6rem', background: 'rgba(0, 240, 255, 0.1)', color: 'var(--accent-cyan)', border: '1px solid rgba(0, 240, 255, 0.3)', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }}
                      title="Toggle Status"
                    >
                      {comp.status === 'Active' ? 'Mark Done' : 'Activate'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteComp(comp.id, comp.title)}
                      style={{ padding: '0.45rem 0.6rem', background: 'rgba(255, 62, 108, 0.1)', color: '#ff3e6c', border: '1px solid rgba(255, 62, 108, 0.3)', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }}
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. CREATE COMPETITION FORM                               */}
      {/* ======================================================== */}
      {activeSubTab === 'create' && (
        <div style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: '14px', border: '1px solid var(--border-color)', maxWidth: '800px', margin: '0 auto' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--accent-volt)', fontSize: '1.3rem', fontWeight: 800 }}>
            ➕ Create New Tournament
          </h3>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.82rem', marginBottom: '1.5rem' }}>
            Fill tournament metadata, add categories, schedule rounds, and set prize pools.
          </p>

          <form onSubmit={handleCreateSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '0.3rem' }}>Tournament Title *</label>
                <input
                  type="text"
                  required
                  value={compForm.title}
                  onChange={(e) => setCompForm({ ...compForm, title: e.target.value })}
                  placeholder="e.g. Apex Southern Powerlifting Open 2026"
                  style={{ width: '100%', padding: '0.6rem', background: '#0d0d15', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '6px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '0.3rem' }}>Category Domain</label>
                <input
                  type="text"
                  value={compForm.category}
                  onChange={(e) => setCompForm({ ...compForm, category: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', background: '#0d0d15', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '6px' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '0.3rem' }}>Description *</label>
              <textarea
                rows="3"
                required
                value={compForm.description}
                onChange={(e) => setCompForm({ ...compForm, description: e.target.value })}
                placeholder="Tournament overview, rules summary, and eligibility."
                style={{ width: '100%', padding: '0.6rem', background: '#0d0d15', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '6px' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '0.3rem' }}>Start Date *</label>
                <input
                  type="date"
                  required
                  value={compForm.startDate}
                  onChange={(e) => setCompForm({ ...compForm, startDate: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', background: '#0d0d15', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '6px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '0.3rem' }}>End Date *</label>
                <input
                  type="date"
                  required
                  value={compForm.endDate}
                  onChange={(e) => setCompForm({ ...compForm, endDate: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', background: '#0d0d15', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '6px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '0.3rem' }}>Registration Deadline</label>
                <input
                  type="date"
                  value={compForm.registrationDeadline}
                  onChange={(e) => setCompForm({ ...compForm, registrationDeadline: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', background: '#0d0d15', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '6px' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.2rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '0.3rem' }}>Venue / Stage</label>
                <input
                  type="text"
                  value={compForm.venue}
                  onChange={(e) => setCompForm({ ...compForm, venue: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', background: '#0d0d15', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '6px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '0.3rem' }}>Entry Fee (₹)</label>
                <input
                  type="number"
                  value={compForm.entryFee}
                  onChange={(e) => setCompForm({ ...compForm, entryFee: Number(e.target.value) })}
                  style={{ width: '100%', padding: '0.5rem', background: '#0d0d15', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '6px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '0.3rem' }}>Prize Pool</label>
                <input
                  type="text"
                  value={compForm.prizePool}
                  onChange={(e) => setCompForm({ ...compForm, prizePool: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', background: '#0d0d15', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '6px' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem' }}>
              <button
                type="button"
                onClick={() => setActiveSubTab('list')}
                style={{ padding: '0.6rem 1.4rem', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-dim)', borderRadius: '6px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="glow-btn"
                style={{ padding: '0.6rem 1.8rem', background: 'var(--accent-volt)', color: '#000', fontWeight: 800, border: 'none', borderRadius: '6px', cursor: 'pointer' }}
              >
                Save &amp; Publish Tournament 🏆
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. REGISTRATION MANAGEMENT                               */}
      {/* ======================================================== */}
      {activeSubTab === 'registration' && selectedComp && (
        <div style={{ background: 'var(--bg-card)', padding: '1.8rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <h3 style={{ color: 'var(--text-white)', margin: '0 0 1rem 0' }}>
            📝 Registration Control: {selectedComp.title}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Status</span>
              <h3 style={{ margin: '0.2rem 0', color: selectedComp.status === 'Active' ? 'var(--accent-volt)' : '#ffcc00' }}>
                {selectedComp.status}
              </h3>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Registered Athletes</span>
              <h3 style={{ margin: '0.2rem 0', color: 'var(--accent-cyan)' }}>
                {participants.length} / {selectedComp.maxParticipants} Cap
              </h3>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Entry Fee</span>
              <h3 style={{ margin: '0.2rem 0', color: '#ffcc00' }}>
                {selectedComp.entryFee === 0 ? 'Free' : `₹${selectedComp.entryFee}`}
              </h3>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              type="button"
              onClick={() => handleToggleStatus(selectedComp, selectedComp.status === 'Active' ? 'Upcoming' : 'Active')}
              className="glow-btn"
              style={{ padding: '0.6rem 1.4rem', background: selectedComp.status === 'Active' ? '#ff3e6c' : 'var(--accent-volt)', color: '#000', fontWeight: 800, border: 'none', borderRadius: '6px', cursor: 'pointer' }}
            >
              {selectedComp.status === 'Active' ? 'Close Registration' : 'Open Registration 🔓'}
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. PARTICIPANTS ROSTER                                   */}
      {/* ======================================================== */}
      {activeSubTab === 'participants' && (
        <div style={{ background: 'var(--bg-card)', padding: '1.8rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
            <h3 style={{ margin: 0, color: 'var(--text-white)' }}>
              👥 Enrolled Athletes Roster ({participants.length})
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
              {selectedComp?.title}
            </span>
          </div>

          {participants.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-dim)' }}>
              No athletes registered yet for this competition.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-dim)', textAlign: 'left' }}>
                    <th style={{ padding: '0.7rem' }}>BIB #</th>
                    <th style={{ padding: '0.7rem' }}>Athlete</th>
                    <th style={{ padding: '0.7rem' }}>Role</th>
                    <th style={{ padding: '0.7rem' }}>Category</th>
                    <th style={{ padding: '0.7rem' }}>Date</th>
                    <th style={{ padding: '0.7rem' }}>Payment</th>
                    <th style={{ padding: '0.7rem' }}>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {participants.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '0.7rem', fontWeight: 800, color: 'var(--accent-volt)' }}>{p.bibNumber}</td>
                      <td style={{ padding: '0.7rem', color: 'var(--text-white)' }}>{p.participantName}</td>
                      <td style={{ padding: '0.7rem', textTransform: 'capitalize', color: 'var(--accent-cyan)' }}>{p.role}</td>
                      <td style={{ padding: '0.7rem' }}>{p.category}</td>
                      <td style={{ padding: '0.7rem', color: 'var(--text-dim)' }}>{p.registrationDate}</td>
                      <td style={{ padding: '0.7rem', color: '#ffcc00' }}>{p.paymentStatus}</td>
                      <td style={{ padding: '0.7rem', color: 'var(--text-white)' }}>{p.score || 'Pending'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. CATEGORIES                                            */}
      {/* ======================================================== */}
      {activeSubTab === 'categories' && selectedComp && (
        <div style={{ background: 'var(--bg-card)', padding: '1.8rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <h3 style={{ color: 'var(--text-white)', margin: '0 0 1.2rem 0' }}>
            🏷️ Divisions &amp; Weight Classes: {selectedComp.title}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
            {selectedComp.categories?.map((cat, i) => (
              <div key={i} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem' }}>
                <strong style={{ color: 'var(--accent-cyan)', fontSize: '1rem', display: 'block', marginBottom: '0.3rem' }}>
                  {cat.name}
                </strong>
                <p style={{ margin: '0 0 0.5rem 0', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                  {cat.description || 'Standard competitive division'}
                </p>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-white)' }}>
                  <div>Gender: <strong>{cat.gender}</strong></div>
                  <div>Max Weight: <strong>{cat.maxWeightKg ? `${cat.maxWeightKg} kg` : 'Open'}</strong></div>
                  <div>Criteria: <strong style={{ color: 'var(--accent-volt)' }}>{cat.criteria || 'Standard'}</strong></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. SCHEDULE                                              */}
      {/* ======================================================== */}
      {activeSubTab === 'schedule' && selectedComp && (
        <div style={{ background: 'var(--bg-card)', padding: '1.8rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <h3 style={{ color: 'var(--text-white)', margin: '0 0 1.2rem 0' }}>
            ⏱️ Event Timeline &amp; Rounds: {selectedComp.title}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {selectedComp.schedule?.map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: '1.2rem', alignItems: 'center', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.9rem 1.2rem' }}>
                <div style={{ minWidth: '150px', fontWeight: 800, color: 'var(--accent-volt)', fontSize: '0.85rem' }}>
                  {s.time}
                </div>
                <div style={{ flex: 1 }}>
                  <strong style={{ color: 'var(--text-white)', fontSize: '0.95rem' }}>{s.event}</strong>
                  <p style={{ margin: '0.2rem 0 0 0', color: 'var(--text-dim)', fontSize: '0.78rem' }}>{s.description}</p>
                </div>
                <div style={{ background: 'rgba(0, 240, 255, 0.1)', color: 'var(--accent-cyan)', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700 }}>
                  {s.stage || 'Main Stage'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 7. RESULTS & WINNERS PODIUM PUBLISHER                    */}
      {/* ======================================================== */}
      {activeSubTab === 'results' && selectedComp && (
        <div style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border-color)', maxWidth: '780px', margin: '0 auto' }}>
          <h3 style={{ margin: '0 0 0.4rem 0', color: '#ffcc00', fontSize: '1.35rem', fontWeight: 800 }}>
            🥇 Publish Tournament Winners &amp; Podium
          </h3>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.82rem', marginBottom: '1.5rem' }}>
            Publishing results marks the tournament as Completed and broadcasts the official podium to members and coaches.
          </p>

          <form onSubmit={handlePublishResultsSubmit}>
            {/* Rank 1 Gold */}
            <div style={{ background: 'rgba(255, 215, 0, 0.08)', border: '1px solid #ffd700', borderRadius: '8px', padding: '1rem', marginBottom: '1rem' }}>
              <strong style={{ color: '#ffd700', display: 'block', marginBottom: '0.5rem', fontSize: '0.95rem' }}>
                🥇 1st Place - Gold Champion
              </strong>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.6rem' }}>
                <input
                  type="text"
                  placeholder="Athlete Name"
                  value={resultForm.winner1.participantName}
                  onChange={(e) => setResultForm({ ...resultForm, winner1: { ...resultForm.winner1, participantName: e.target.value } })}
                  style={{ padding: '0.5rem', background: '#0d0d15', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '4px', fontSize: '0.8rem' }}
                />
                <input
                  type="text"
                  placeholder="Category (e.g. Heavyweight)"
                  value={resultForm.winner1.category}
                  onChange={(e) => setResultForm({ ...resultForm, winner1: { ...resultForm.winner1, category: e.target.value } })}
                  style={{ padding: '0.5rem', background: '#0d0d15', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '4px', fontSize: '0.8rem' }}
                />
                <input
                  type="text"
                  placeholder="Winning Score / Time"
                  value={resultForm.winner1.score}
                  onChange={(e) => setResultForm({ ...resultForm, winner1: { ...resultForm.winner1, score: e.target.value } })}
                  style={{ padding: '0.5rem', background: '#0d0d15', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '4px', fontSize: '0.8rem' }}
                />
              </div>
            </div>

            {/* Rank 2 Silver */}
            <div style={{ background: 'rgba(192, 192, 192, 0.08)', border: '1px solid #c0c0c0', borderRadius: '8px', padding: '1rem', marginBottom: '1rem' }}>
              <strong style={{ color: '#c0c0c0', display: 'block', marginBottom: '0.5rem', fontSize: '0.95rem' }}>
                🥈 2nd Place - Silver Runner Up
              </strong>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.6rem' }}>
                <input
                  type="text"
                  placeholder="Athlete Name"
                  value={resultForm.winner2.participantName}
                  onChange={(e) => setResultForm({ ...resultForm, winner2: { ...resultForm.winner2, participantName: e.target.value } })}
                  style={{ padding: '0.5rem', background: '#0d0d15', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '4px', fontSize: '0.8rem' }}
                />
                <input
                  type="text"
                  placeholder="Category"
                  value={resultForm.winner2.category}
                  onChange={(e) => setResultForm({ ...resultForm, winner2: { ...resultForm.winner2, category: e.target.value } })}
                  style={{ padding: '0.5rem', background: '#0d0d15', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '4px', fontSize: '0.8rem' }}
                />
                <input
                  type="text"
                  placeholder="Score / Time"
                  value={resultForm.winner2.score}
                  onChange={(e) => setResultForm({ ...resultForm, winner2: { ...resultForm.winner2, score: e.target.value } })}
                  style={{ padding: '0.5rem', background: '#0d0d15', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '4px', fontSize: '0.8rem' }}
                />
              </div>
            </div>

            {/* Rank 3 Bronze */}
            <div style={{ background: 'rgba(205, 127, 50, 0.08)', border: '1px solid #cd7f32', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem' }}>
              <strong style={{ color: '#cd7f32', display: 'block', marginBottom: '0.5rem', fontSize: '0.95rem' }}>
                🥉 3rd Place - Bronze Finalist
              </strong>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.6rem' }}>
                <input
                  type="text"
                  placeholder="Athlete Name"
                  value={resultForm.winner3.participantName}
                  onChange={(e) => setResultForm({ ...resultForm, winner3: { ...resultForm.winner3, participantName: e.target.value } })}
                  style={{ padding: '0.5rem', background: '#0d0d15', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '4px', fontSize: '0.8rem' }}
                />
                <input
                  type="text"
                  placeholder="Category"
                  value={resultForm.winner3.category}
                  onChange={(e) => setResultForm({ ...resultForm, winner3: { ...resultForm.winner3, category: e.target.value } })}
                  style={{ padding: '0.5rem', background: '#0d0d15', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '4px', fontSize: '0.8rem' }}
                />
                <input
                  type="text"
                  placeholder="Score / Time"
                  value={resultForm.winner3.score}
                  onChange={(e) => setResultForm({ ...resultForm, winner3: { ...resultForm.winner3, score: e.target.value } })}
                  style={{ padding: '0.5rem', background: '#0d0d15', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '4px', fontSize: '0.8rem' }}
                />
              </div>
            </div>

            <button
              type="submit"
              className="glow-btn"
              style={{ width: '100%', padding: '0.75rem', background: '#ffcc00', color: '#000', fontWeight: 900, border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '1rem' }}
            >
              Publish Official Results Live 🥇
            </button>
          </form>
        </div>
      )}

      {/* ======================================================== */}
      {/* 8. CERTIFICATES BATCH GENERATOR                         */}
      {/* ======================================================== */}
      {activeSubTab === 'certificates' && selectedComp && (
        <div style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <h3 style={{ margin: 0, color: 'var(--text-white)' }}>
                📜 Official Certificate Issuer
              </h3>
              <p style={{ margin: '0.2rem 0 0 0', color: 'var(--text-dim)', fontSize: '0.82rem' }}>
                Batch issue official cryptographic verification certificates to all {participants.length} registered athletes.
              </p>
            </div>
            <button
              type="button"
              onClick={handleBatchGenerateCertificates}
              className="glow-btn"
              style={{ padding: '0.7rem 1.6rem', background: '#d4af37', color: '#000', fontWeight: 800, border: 'none', borderRadius: '8px', cursor: 'pointer' }}
            >
              ⚡ Batch Generate Certificates ({participants.length})
            </button>
          </div>

          {certificatesList.length > 0 && (
            <div>
              <h4 style={{ color: 'var(--accent-volt)', marginBottom: '0.8rem' }}>
                Recently Generated Certificates ({certificatesList.length})
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                {certificatesList.map(c => (
                  <div key={c.id} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid #d4af37', padding: '1rem', borderRadius: '8px' }}>
                    <strong style={{ color: '#d4af37', display: 'block' }}>{c.awardTitle}</strong>
                    <div style={{ color: 'var(--text-white)', fontSize: '0.9rem', margin: '0.3rem 0' }}>{c.participantName} ({c.participantRole})</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Code: {c.verificationCode}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
