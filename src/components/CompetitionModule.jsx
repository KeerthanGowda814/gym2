import React, { useState, useEffect, useRef } from 'react';
import { competitionApi } from '../services/competitionApi';
import { CustomSwal } from '../utils/swal';

export default function CompetitionModule({ currentUser, role = 'member' }) {
  const [activeTab, setActiveTab] = useState('list'); // 'list', 'my-regs', 'results', 'certificates'
  const userEmail = currentUser?.email || 'member@apex.com';
  const userName = currentUser?.name || 'Ethan Hunt';

  const [competitions, setCompetitions] = useState([]);
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [myCertificates, setMyCertificates] = useState([]);
  const [selectedCompResults, setSelectedCompResults] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Registration Modal
  const [selectedCompForReg, setSelectedCompForReg] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [regForm, setRegForm] = useState({
    category: '',
    division: 'Open Division',
    phone: currentUser?.phone || '+1 (555) 777-7777',
    notes: ''
  });

  // Certificate Viewer Modal
  const [viewingCertificate, setViewingCertificate] = useState(null);
  const certRef = useRef(null);

  // Fetch all data
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [comps, regs, certs] = await Promise.all([
        competitionApi.getCompetitions(),
        competitionApi.getMyRegistrations(userEmail),
        competitionApi.getMyCertificates(userEmail)
      ]);
      setCompetitions(comps || []);
      setMyRegistrations(regs || []);
      setMyCertificates(certs || []);

      // If there's a completed comp, load its results as default
      const completed = (comps || []).find(c => c.status === 'Completed');
      if (completed) {
        const resData = await competitionApi.getResults(completed.id);
        setSelectedCompResults(resData);
      }
    } catch (err) {
      console.warn('Error loading competitions data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [userEmail]);

  // Open registration modal
  const openRegisterModal = (comp) => {
    setSelectedCompForReg(comp);
    setRegForm({
      category: comp.categories?.[0]?.name || 'Open Division',
      division: 'Standard Division',
      phone: currentUser?.phone || '+1 (555) 777-7777',
      notes: ''
    });
  };

  // Submit registration
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCompForReg) return;
    setIsRegistering(true);
    try {
      const res = await competitionApi.registerForCompetition(selectedCompForReg.id, {
        ...regForm,
        participantEmail: userEmail,
        participantName: userName,
        participantId: currentUser?.userId || 'MEM-90210'
      });
      CustomSwal.fire({
        title: 'Registration Confirmed! 🏆',
        text: res.message || `You are officially registered! Check your Bib number.`,
        icon: 'success'
      });
      setSelectedCompForReg(null);
      loadData();
      setActiveTab('my-regs');
    } catch (err) {
      CustomSwal.fire({
        title: 'Registration Error',
        text: err.message || 'Failed to complete registration.',
        icon: 'error'
      });
    } finally {
      setIsRegistering(false);
    }
  };

  // Load results for specific competition
  const handleSelectCompResults = async (compId) => {
    try {
      const res = await competitionApi.getResults(compId);
      setSelectedCompResults(res);
    } catch (err) {
      CustomSwal.fire({ title: 'Results', text: 'Results have not been posted for this tournament yet.', icon: 'info' });
    }
  };

  // Print / Download Certificate
  const handlePrintCertificate = () => {
    window.print();
  };

  return (
    <div className="competition-module" style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
      {/* HEADER BANNER */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '1.5rem',
        padding: '1.4rem 1.8rem',
        background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.08), rgba(255, 94, 0, 0.12))',
        borderRadius: '14px',
        border: '1px solid rgba(255, 215, 0, 0.3)',
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
              APEX COMPETITION &amp; ATHLETIC CHAMPIONSHIPS
            </h2>
          </div>
          <p style={{ margin: 0, color: 'var(--text-dim, #8E919F)', fontSize: '0.85rem' }}>
            Compete in elite national powerlifting, physique, and functional endurance tournaments. Win gold trophies, official pro cards, and verified certificates.
          </p>
        </div>

        {/* Status Count Pill */}
        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <span style={{
            background: 'rgba(255, 215, 0, 0.15)',
            border: '1px solid rgba(255, 215, 0, 0.4)',
            color: '#ffcc00',
            padding: '0.35rem 0.8rem',
            borderRadius: '8px',
            fontSize: '0.8rem',
            fontWeight: 800
          }}>
            {competitions.length} Tournaments Available
          </span>
          {myRegistrations.length > 0 && (
            <span style={{
              background: 'rgba(0, 240, 255, 0.15)',
              border: '1px solid rgba(0, 240, 255, 0.4)',
              color: 'var(--accent-cyan)',
              padding: '0.35rem 0.8rem',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: 800
            }}>
              {myRegistrations.length} Active Enrolled
            </span>
          )}
        </div>
      </div>

      {/* MODULE TABS */}
      <div style={{
        display: 'flex',
        gap: '0.6rem',
        borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.08))',
        marginBottom: '1.8rem',
        paddingBottom: '0.5rem',
        flexWrap: 'wrap'
      }}>
        <button
          type="button"
          onClick={() => setActiveTab('list')}
          style={{
            padding: '0.65rem 1.4rem',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.88rem',
            fontWeight: 800,
            background: activeTab === 'list' ? '#ffcc00' : 'transparent',
            color: activeTab === 'list' ? '#000' : 'var(--text-muted)',
            boxShadow: activeTab === 'list' ? '0 0 15px rgba(255, 204, 0, 0.35)' : 'none'
          }}
        >
          🏆 Competitions &amp; Schedule ({competitions.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('my-regs')}
          style={{
            padding: '0.65rem 1.4rem',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.88rem',
            fontWeight: 800,
            background: activeTab === 'my-regs' ? '#ffcc00' : 'transparent',
            color: activeTab === 'my-regs' ? '#000' : 'var(--text-muted)',
            boxShadow: activeTab === 'my-regs' ? '0 0 15px rgba(255, 204, 0, 0.35)' : 'none'
          }}
        >
          📋 My Registrations ({myRegistrations.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('results')}
          style={{
            padding: '0.65rem 1.4rem',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.88rem',
            fontWeight: 800,
            background: activeTab === 'results' ? '#ffcc00' : 'transparent',
            color: activeTab === 'results' ? '#000' : 'var(--text-muted)',
            boxShadow: activeTab === 'results' ? '0 0 15px rgba(255, 204, 0, 0.35)' : 'none'
          }}
        >
          🥇 Results &amp; Winners Podium
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('certificates')}
          style={{
            padding: '0.65rem 1.4rem',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.88rem',
            fontWeight: 800,
            background: activeTab === 'certificates' ? '#ffcc00' : 'transparent',
            color: activeTab === 'certificates' ? '#000' : 'var(--text-muted)',
            boxShadow: activeTab === 'certificates' ? '0 0 15px rgba(255, 204, 0, 0.35)' : 'none'
          }}
        >
          📜 Official Certificates ({myCertificates.length})
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: COMPETITION LIST & SCHEDULE                       */}
      {/* ======================================================== */}
      {activeTab === 'list' && (
        <div>
          {isLoading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-dim)' }}>
              Loading official competitions from MongoDB Atlas...
            </div>
          ) : competitions.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-dim)' }}>
              No competitions posted right now. Check back soon!
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '1.5rem' }}>
              {competitions.map((comp) => {
                const isRegistered = myRegistrations.some(r => r.competitionId === comp.id);
                const isCompleted = comp.status === 'Completed';

                return (
                  <div
                    key={comp.id}
                    style={{
                      background: 'var(--bg-card, #12121c)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '14px',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.35)'
                    }}
                  >
                    {/* Banner Image */}
                    <div style={{ position: 'relative', height: '180px', background: '#0a0a10', overflow: 'hidden' }}>
                      <img
                        src={comp.bannerImage || 'assets/images/gallery_weights.png'}
                        alt={comp.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      {/* Status Tag */}
                      <span style={{
                        position: 'absolute',
                        top: '12px',
                        left: '12px',
                        background: comp.status === 'Active' ? 'rgba(0, 240, 255, 0.9)' : comp.status === 'Completed' ? 'rgba(100, 100, 120, 0.9)' : 'rgba(255, 204, 0, 0.9)',
                        color: '#000',
                        padding: '0.25rem 0.65rem',
                        borderRadius: '6px',
                        fontWeight: 800,
                        fontSize: '0.72rem',
                        textTransform: 'uppercase'
                      }}>
                        {comp.status}
                      </span>

                      {/* Entry Fee Badge */}
                      <span style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        background: 'rgba(5, 5, 8, 0.85)',
                        backdropFilter: 'blur(6px)',
                        padding: '0.25rem 0.65rem',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        color: comp.entryFee === 0 ? 'var(--accent-volt)' : '#fff',
                        border: '1px solid rgba(255,255,255,0.1)'
                      }}>
                        {comp.entryFee === 0 ? 'FREE ENTRY' : `₹${comp.entryFee}`}
                      </span>
                    </div>

                    {/* Card Content */}
                    <div style={{ padding: '1.3rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-white)', fontSize: '1.2rem', fontWeight: 800 }}>
                        {comp.title}
                      </h3>
                      <p style={{ margin: '0 0 1rem 0', color: 'var(--text-dim)', fontSize: '0.82rem', lineHeight: '1.4' }}>
                        {comp.description}
                      </p>

                      {/* Details Grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', background: 'rgba(0,0,0,0.2)', padding: '0.7rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.78rem' }}>
                        <div>
                          <span style={{ color: 'var(--text-dim)', display: 'block' }}>Date</span>
                          <strong style={{ color: 'var(--text-white)' }}>{comp.startDate}</strong>
                        </div>
                        <div>
                          <span style={{ color: 'var(--text-dim)', display: 'block' }}>Venue</span>
                          <strong style={{ color: 'var(--text-white)' }}>{comp.venue || 'Apex Arena'}</strong>
                        </div>
                        <div>
                          <span style={{ color: 'var(--text-dim)', display: 'block' }}>Prize Pool</span>
                          <strong style={{ color: '#ffcc00' }}>{comp.prizePool || 'Trophy + Medals'}</strong>
                        </div>
                        <div>
                          <span style={{ color: 'var(--text-dim)', display: 'block' }}>Registered</span>
                          <strong style={{ color: 'var(--accent-cyan)' }}>{comp.registeredCount || 0} athletes</strong>
                        </div>
                      </div>

                      {/* Categories Preview */}
                      {comp.categories && comp.categories.length > 0 && (
                        <div style={{ marginBottom: '1rem' }}>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block', marginBottom: '0.3rem', textTransform: 'uppercase' }}>
                            Divisions &amp; Categories:
                          </span>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                            {comp.categories.map((cat, i) => (
                              <span key={i} style={{ background: 'rgba(255,255,255,0.05)', fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '4px', color: 'var(--text-white)' }}>
                                {cat.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action Button */}
                      <div style={{ marginTop: 'auto', paddingTop: '0.8rem' }}>
                        {isCompleted ? (
                          <button
                            type="button"
                            onClick={() => {
                              handleSelectCompResults(comp.id);
                              setActiveTab('results');
                            }}
                            className="glow-btn"
                            style={{ width: '100%', padding: '0.65rem', background: 'rgba(255, 204, 0, 0.15)', color: '#ffcc00', border: '1px solid #ffcc00', borderRadius: '6px', fontWeight: 800, cursor: 'pointer' }}
                          >
                            View Official Results &amp; Podium 🥇
                          </button>
                        ) : isRegistered ? (
                          <button
                            type="button"
                            disabled
                            style={{ width: '100%', padding: '0.65rem', background: 'rgba(0, 240, 255, 0.15)', color: 'var(--accent-cyan)', border: '1px solid var(--accent-cyan)', borderRadius: '6px', fontWeight: 800, cursor: 'default' }}
                          >
                            ✓ Already Registered (Check Bib In My Regs)
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openRegisterModal(comp)}
                            className="glow-btn"
                            style={{ width: '100%', padding: '0.65rem', background: 'var(--accent-volt)', color: '#000', border: 'none', borderRadius: '6px', fontWeight: 800, cursor: 'pointer' }}
                          >
                            Register for Competition 🏆
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: MY REGISTRATIONS & BIB NUMBER                     */}
      {/* ======================================================== */}
      {activeTab === 'my-regs' && (
        <div>
          {myRegistrations.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', background: 'var(--bg-card)', borderRadius: '12px', border: '1px dashed var(--border-color)' }}>
              <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>📋</span>
              <h3 style={{ color: 'var(--text-white)' }}>No Active Tournament Registrations</h3>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                Browse upcoming competitions and submit your registration to receive an official athlete bib number.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('list')}
                className="glow-btn"
                style={{ padding: '0.6rem 1.4rem', background: '#ffcc00', color: '#000', fontWeight: 800, border: 'none', borderRadius: '6px' }}
              >
                Browse Competitions
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.4rem' }}>
              {myRegistrations.map((reg) => (
                <div
                  key={reg.id}
                  style={{
                    background: 'var(--bg-card, #12121c)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    padding: '1.4rem',
                    boxShadow: '0 6px 20px rgba(0,0,0,0.3)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                    <span style={{
                      background: 'rgba(255, 94, 0, 0.15)',
                      color: 'var(--accent-volt)',
                      border: '1px solid rgba(255, 94, 0, 0.4)',
                      padding: '0.3rem 0.8rem',
                      borderRadius: '8px',
                      fontWeight: 900,
                      fontSize: '1rem',
                      letterSpacing: '1px'
                    }}>
                      BIB: {reg.bibNumber}
                    </span>
                    <span style={{
                      background: reg.status === 'Confirmed' ? 'rgba(0, 240, 255, 0.15)' : 'rgba(255, 204, 0, 0.15)',
                      color: reg.status === 'Confirmed' ? 'var(--accent-cyan)' : '#ffcc00',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.72rem',
                      fontWeight: 800
                    }}>
                      {reg.status}
                    </span>
                  </div>

                  <h4 style={{ margin: '0 0 0.4rem 0', color: 'var(--text-white)', fontSize: '1.15rem', fontWeight: 800 }}>
                    {reg.competitionTitle}
                  </h4>
                  <p style={{ margin: '0 0 0.8rem 0', color: 'var(--text-dim)', fontSize: '0.82rem' }}>
                    Category: <strong style={{ color: 'var(--text-white)' }}>{reg.category}</strong>
                  </p>

                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.6rem 0.8rem', borderRadius: '6px', fontSize: '0.78rem', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                      <span style={{ color: 'var(--text-dim)' }}>Athlete:</span>
                      <strong style={{ color: 'var(--text-white)' }}>{reg.participantName} ({reg.role})</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                      <span style={{ color: 'var(--text-dim)' }}>Registered On:</span>
                      <strong style={{ color: 'var(--text-white)' }}>{reg.registrationDate}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-dim)' }}>Payment Status:</span>
                      <strong style={{ color: 'var(--accent-volt)' }}>{reg.paymentStatus}</strong>
                    </div>
                  </div>

                  {reg.score && (
                    <div style={{ background: 'rgba(255, 204, 0, 0.08)', border: '1px solid rgba(255, 204, 0, 0.3)', padding: '0.6rem', borderRadius: '6px', fontSize: '0.8rem' }}>
                      <span style={{ color: '#ffcc00', fontWeight: 700 }}>Official Score:</span>
                      <strong style={{ color: 'var(--text-white)', marginLeft: '0.5rem' }}>{reg.score}</strong>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: TOURNAMENT RESULTS & PODIUM                       */}
      {/* ======================================================== */}
      {activeTab === 'results' && (
        <div>
          {/* TOURNAMENT SELECTOR */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.5rem' }}>
            <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>Select Competition:</span>
            <select
              onChange={(e) => handleSelectCompResults(e.target.value)}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-white)',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                fontSize: '0.85rem'
              }}
            >
              {competitions.map(c => (
                <option key={c.id} value={c.id}>
                  {c.title} ({c.status})
                </option>
              ))}
            </select>
          </div>

          {selectedCompResults && selectedCompResults.winners ? (
            <div style={{
              background: 'var(--bg-card, #12121c)',
              border: '1px solid var(--border-color)',
              borderRadius: '14px',
              padding: '1.8rem',
              boxShadow: '0 8px 24px rgba(0,0,0,0.35)'
            }}>
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <span style={{ fontSize: '0.78rem', color: '#ffcc00', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
                  OFFICIAL TOURNAMENT STANDINGS
                </span>
                <h2 style={{ margin: '0.3rem 0', color: 'var(--text-white)', fontSize: '1.6rem', fontWeight: 800 }}>
                  {selectedCompResults.competitionTitle}
                </h2>
                <p style={{ margin: 0, color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                  {selectedCompResults.summary}
                </p>
              </div>

              {/* PODIUM 3-TIER SHOWCASE */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                {selectedCompResults.winners.map((winner) => {
                  const isFirst = winner.rank === 1;
                  const isSecond = winner.rank === 2;
                  const isThird = winner.rank === 3;
                  const medalColor = isFirst ? '#ffd700' : isSecond ? '#c0c0c0' : '#cd7f32';

                  return (
                    <div
                      key={winner.rank}
                      style={{
                        background: isFirst ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(0,0,0,0.4))' : 'rgba(0,0,0,0.3)',
                        border: `2px solid ${medalColor}`,
                        borderRadius: '12px',
                        padding: '1.5rem',
                        textAlign: 'center',
                        position: 'relative',
                        boxShadow: isFirst ? '0 0 25px rgba(255, 215, 0, 0.25)' : 'none'
                      }}
                    >
                      <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.5rem' }}>
                        {isFirst ? '🥇' : isSecond ? '🥈' : '🥉'}
                      </span>
                      <span style={{
                        background: medalColor,
                        color: '#000',
                        fontSize: '0.72rem',
                        fontWeight: 900,
                        padding: '0.2rem 0.6rem',
                        borderRadius: '12px',
                        textTransform: 'uppercase'
                      }}>
                        {winner.awardTitle}
                      </span>
                      <h3 style={{ margin: '0.8rem 0 0.3rem 0', color: 'var(--text-white)', fontSize: '1.3rem', fontWeight: 800 }}>
                        {winner.participantName}
                      </h3>
                      <p style={{ margin: '0 0 0.6rem 0', color: 'var(--text-dim)', fontSize: '0.82rem' }}>
                        {winner.category} {winner.bibNumber ? `(Bib: ${winner.bibNumber})` : ''}
                      </p>
                      {winner.score && (
                        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: '6px' }}>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block' }}>Winning Score</span>
                          <strong style={{ fontSize: '0.95rem', color: 'var(--text-white)' }}>{winner.score}</strong>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div style={{ padding: '3rem', textAlign: 'center', background: 'var(--bg-card)', borderRadius: '12px', color: 'var(--text-dim)' }}>
              Select a competition above to view official verified results and rankings.
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: OFFICIAL DIGITAL CERTIFICATES                     */}
      {/* ======================================================== */}
      {activeTab === 'certificates' && (
        <div>
          {myCertificates.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', background: 'var(--bg-card)', borderRadius: '12px', border: '1px dashed var(--border-color)' }}>
              <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>📜</span>
              <h3 style={{ color: 'var(--text-white)' }}>No Certificates Issued Yet</h3>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                Participate in competitions and complete your event heats. Official digital certificates are issued once tournament results are verified!
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.5rem' }}>
              {myCertificates.map((cert) => (
                <div
                  key={cert.id}
                  style={{
                    background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.08), #12121c)',
                    border: '1px solid rgba(255, 215, 0, 0.4)',
                    borderRadius: '12px',
                    padding: '1.4rem',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>📜</span>
                    <span style={{
                      background: 'rgba(255, 215, 0, 0.15)',
                      color: '#ffcc00',
                      padding: '0.2rem 0.6rem',
                      borderRadius: '4px',
                      fontSize: '0.72rem',
                      fontWeight: 800
                    }}>
                      {cert.type === 'Winner' ? '🥇 WINNER' : 'PARTICIPATION'}
                    </span>
                  </div>

                  <h4 style={{ margin: '0 0 0.3rem 0', color: 'var(--text-white)', fontSize: '1.1rem', fontWeight: 800 }}>
                    {cert.competitionTitle}
                  </h4>
                  <p style={{ margin: '0 0 0.8rem 0', color: '#ffcc00', fontSize: '0.85rem', fontWeight: 700 }}>
                    {cert.awardTitle}
                  </p>

                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.6rem', borderRadius: '6px', fontSize: '0.75rem', marginBottom: '1rem', color: 'var(--text-dim)' }}>
                    <div>Issued To: <strong style={{ color: 'var(--text-white)' }}>{cert.participantName}</strong></div>
                    <div>Date: <strong style={{ color: 'var(--text-white)' }}>{cert.issueDate}</strong></div>
                    <div>Verification: <code style={{ color: 'var(--accent-cyan)' }}>{cert.verificationCode}</code></div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setViewingCertificate(cert)}
                    className="glow-btn"
                    style={{
                      marginTop: 'auto',
                      padding: '0.6rem',
                      background: '#ffcc00',
                      color: '#000',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    View &amp; Download Certificate 📜
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* REGISTRATION MODAL */}
      {selectedCompForReg && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(5, 5, 8, 0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            background: 'var(--bg-dark, #0d0d15)',
            border: '1px solid #ffcc00',
            boxShadow: '0 0 35px rgba(255, 204, 0, 0.2)',
            borderRadius: '14px',
            width: '95%',
            maxWidth: '560px',
            padding: '2rem',
            position: 'relative',
            color: 'var(--text-white)'
          }}>
            <button
              type="button"
              onClick={() => setSelectedCompForReg(null)}
              style={{ position: 'absolute', top: '1.2rem', right: '1.2rem', background: 'transparent', border: 'none', color: 'var(--text-dim)', fontSize: '1.5rem', cursor: 'pointer' }}
            >
              ✕
            </button>

            <h3 style={{ margin: '0 0 0.4rem 0', color: '#ffcc00', fontSize: '1.35rem', fontWeight: 800 }}>
              🏆 Tournament Registration
            </h3>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginBottom: '1.2rem' }}>
              Enrolling in: <strong style={{ color: 'var(--text-white)' }}>{selectedCompForReg.title}</strong>
            </p>

            <form onSubmit={handleRegisterSubmit}>
              {/* Category Selector */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '0.3rem' }}>
                  Select Category / Weight Class *
                </label>
                <select
                  value={regForm.category}
                  onChange={(e) => setRegForm({ ...regForm, category: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', background: '#171724', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '6px' }}
                >
                  {selectedCompForReg.categories?.map((cat, i) => (
                    <option key={i} value={cat.name}>
                      {cat.name} ({cat.gender}) {cat.maxWeightKg ? `- Max ${cat.maxWeightKg}kg` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Contact Phone */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '0.3rem' }}>
                  Emergency Contact Phone *
                </label>
                <input
                  type="text"
                  required
                  value={regForm.phone}
                  onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', background: '#171724', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '6px' }}
                />
              </div>

              {/* Notes */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '0.3rem' }}>
                  Athlete Notes / Target Goals
                </label>
                <textarea
                  rows="2"
                  placeholder="e.g. Aiming for 600kg total squat/bench/deadlift."
                  value={regForm.notes}
                  onChange={(e) => setRegForm({ ...regForm, notes: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', background: '#171724', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '6px' }}
                />
              </div>

              {/* Fee Notice */}
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.8rem', borderRadius: '6px', fontSize: '0.8rem', marginBottom: '1.5rem' }}>
                <span>Entry Fee: </span>
                <strong style={{ color: selectedCompForReg.entryFee === 0 ? 'var(--accent-volt)' : '#ffcc00' }}>
                  {selectedCompForReg.entryFee === 0 ? 'FREE (Apex Member Privilege)' : `₹${selectedCompForReg.entryFee}`}
                </strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem' }}>
                <button
                  type="button"
                  onClick={() => setSelectedCompForReg(null)}
                  style={{ padding: '0.6rem 1.2rem', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-dim)', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRegistering}
                  className="glow-btn"
                  style={{ padding: '0.6rem 1.6rem', background: '#ffcc00', color: '#000', fontWeight: 800, border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                >
                  {isRegistering ? 'Confirming...' : 'Confirm Registration 🏆'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* HIGH-RES CERTIFICATE VIEWER MODAL */}
      {viewingCertificate && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(5, 5, 8, 0.9)',
          backdropFilter: 'blur(10px)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem'
        }}>
          <div style={{
            background: '#ffffff',
            color: '#1a1a24',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '850px',
            padding: '3rem',
            boxShadow: '0 0 50px rgba(255, 215, 0, 0.4)',
            border: '8px double #d4af37',
            position: 'relative',
            textAlign: 'center',
            fontFamily: 'Georgia, serif'
          }} ref={certRef}>
            {/* Close */}
            <button
              type="button"
              onClick={() => setViewingCertificate(null)}
              style={{ position: 'absolute', top: '1rem', right: '1.2rem', background: 'transparent', border: 'none', color: '#888', fontSize: '1.8rem', cursor: 'pointer' }}
            >
              ✕
            </button>

            {/* Crest / Header */}
            <div style={{ marginBottom: '1.2rem' }}>
              <span style={{ fontSize: '3.2rem', display: 'block' }}>🏛️</span>
              <h1 style={{ margin: '0.4rem 0 0 0', fontSize: '2.2rem', textTransform: 'uppercase', color: '#111', letterSpacing: '2px', fontWeight: 900 }}>
                APEX ATHLETICS FEDERATION
              </h1>
              <p style={{ margin: '0.2rem 0 0 0', fontStyle: 'italic', color: '#666', fontSize: '0.95rem' }}>
                Certificate of Official Tournament Recognition
              </p>
            </div>

            <div style={{ width: '80%', height: '2px', background: 'linear-gradient(to right, transparent, #d4af37, transparent)', margin: '1rem auto' }} />

            <p style={{ fontSize: '1.1rem', color: '#444', margin: '1rem 0 0.5rem 0' }}>
              This is to officially certify that
            </p>

            <h2 style={{ fontSize: '2.4rem', color: '#990000', margin: '0.4rem 0', fontFamily: 'Times New Roman, serif', borderBottom: '1px solid #ccc', display: 'inline-block', paddingBottom: '0.3rem' }}>
              {viewingCertificate.participantName}
            </h2>

            <p style={{ fontSize: '1.1rem', color: '#444', margin: '0.8rem 0' }}>
              has successfully achieved the honor of
            </p>

            <div style={{
              display: 'inline-block',
              background: 'rgba(212, 175, 55, 0.15)',
              border: '2px solid #d4af37',
              borderRadius: '8px',
              padding: '0.6rem 1.8rem',
              margin: '0.5rem 0 1.2rem 0'
            }}>
              <strong style={{ fontSize: '1.35rem', color: '#8b6508' }}>
                {viewingCertificate.awardTitle}
              </strong>
            </div>

            <p style={{ fontSize: '1rem', color: '#555', maxWidth: '650px', margin: '0 auto 1.5rem auto', lineHeight: '1.5' }}>
              in the <strong>{viewingCertificate.competitionTitle}</strong> ({viewingCertificate.category}), demonstrating supreme athletic fortitude, discipline, and competitive excellence.
            </p>

            {/* Footer Signature & Seal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '2.5rem', padding: '0 2rem' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ borderBottom: '1px solid #333', paddingBottom: '0.3rem', width: '180px', fontWeight: 700, fontStyle: 'italic' }}>
                  {viewingCertificate.directorSignature || 'Apex Master Director'}
                </div>
                <span style={{ fontSize: '0.75rem', color: '#777', marginTop: '0.2rem', display: 'block' }}>Tournament Director</span>
              </div>

              {/* Gold Verification Seal */}
              <div style={{
                width: '90px',
                height: '90px',
                borderRadius: '50%',
                border: '3px dashed #d4af37',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                background: 'rgba(212, 175, 55, 0.1)'
              }}>
                <span style={{ fontSize: '1.3rem' }}>🏅</span>
                <span style={{ fontSize: '0.55rem', fontWeight: 900, color: '#8b6508' }}>OFFICIAL</span>
                <span style={{ fontSize: '0.55rem', fontWeight: 900, color: '#8b6508' }}>SEAL</span>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ borderBottom: '1px solid #333', paddingBottom: '0.3rem', width: '180px', fontWeight: 700 }}>
                  {viewingCertificate.issueDate}
                </div>
                <span style={{ fontSize: '0.75rem', color: '#777', marginTop: '0.2rem', display: 'block' }}>Date of Issue</span>
              </div>
            </div>

            {/* Verification code */}
            <div style={{ marginTop: '1.5rem', fontSize: '0.75rem', color: '#888' }}>
              Certificate ID: {viewingCertificate.id} | Verification Code: <strong>{viewingCertificate.verificationCode}</strong>
            </div>

            {/* Print Action */}
            <div style={{ marginTop: '1.5rem' }}>
              <button
                type="button"
                onClick={handlePrintCertificate}
                style={{
                  padding: '0.6rem 1.8rem',
                  background: '#d4af37',
                  color: '#000',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                🖨️ Print / Save as PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
