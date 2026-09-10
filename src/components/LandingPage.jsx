import React, { useState, useEffect } from 'react';
import { ApexAuth } from '../services/auth';

export default function LandingPage({ navigate }) {
  // Mobile menu open state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  // Header scroll glassmorphic class state
  const [isHeaderScrolled, setIsHeaderScrolled] = useState(false);
  // active nav hash state for scroll indication
  const [activeHash, setActiveHash] = useState('#hero');
  
  // Pricing toggle (monthly / annual)
  const [billingPeriod, setBillingPeriod] = useState('monthly'); // 'monthly' or 'annual'

  // Gallery filters and lightbox states
  const [galleryFilter, setGalleryFilter] = useState('all');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Contact form submission states
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactGoal, setContactGoal] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);

  // Auto-increment counter states (Expert Coaches, Active Members, VIP Hours, Years)
  const [coachesCount, setCoachesCount] = useState(0);
  const [membersCount, setMembersCount] = useState(0);
  const [hoursCount, setHoursCount] = useState(0);
  const [yearsCount, setYearsCount] = useState(0);

  // Animate metrics on load
  useEffect(() => {
    const animateCount = (target, setter, duration = 1200) => {
      let current = 0;
      const stepTime = Math.max(Math.floor(duration / target), 15);
      const timer = setInterval(() => {
        current += Math.ceil(target / (duration / stepTime));
        if (current >= target) {
          setter(target);
          clearInterval(timer);
        } else {
          setter(current);
        }
      }, stepTime);
    };

    animateCount(15, setCoachesCount);
    animateCount(1200, setMembersCount);
    animateCount(24, setHoursCount);
    animateCount(12, setYearsCount);
  }, []);

  // Window scroll event listeners
  useEffect(() => {
    const handleScroll = () => {
      // 1. Header scroll class
      setIsHeaderScrolled(window.scrollY > 50);

      // 2. Simple scroll spy logic
      const sections = ['hero', 'about', 'services', 'trainers', 'membership', 'gallery', 'contact'];
      for (const sectionId of sections) {
        const el = document.getElementById(sectionId);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 150 && rect.bottom >= 150) {
            setActiveHash(`#${sectionId}`);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Check login state for nav links
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    setIsAuthenticated(ApexAuth.isAuthenticated());
    if (ApexAuth.isAuthenticated()) {
      const user = ApexAuth.getCurrentUser();
      setUserName(user ? user.name.split(' ')[0] : '');
    }
  }, []);

  // Gallery items database
  const galleryItems = [
    { id: 1, category: 'cardio', title: 'Apex Cardio Suite', desc: 'Cardio Zone', image: 'assets/images/gallery_cardio.png' },
    { id: 2, category: 'strength', title: 'Hammer Strength Rig', desc: 'Strength Zone', image: 'assets/images/gallery_weights.png' },
    { id: 3, category: 'yoga', title: 'Zen Yoga Studio', desc: 'Yoga & Mobility', image: 'assets/images/gallery_yoga.png' },
    { id: 4, category: 'hiit', title: 'High Octane Turf', desc: 'HIIT & Combat', image: 'assets/images/gallery_hiit.png' }
  ];

  const activeGalleryItems = galleryFilter === 'all' 
    ? galleryItems 
    : galleryItems.filter(item => item.category === galleryFilter);

  // Lightbox handlers
  const handleOpenLightbox = (item) => {
    const index = activeGalleryItems.findIndex(i => i.id === item.id);
    if (index !== -1) {
      setLightboxIndex(index);
      setLightboxOpen(true);
      document.body.style.overflow = 'hidden';
    }
  };

  const handleCloseLightbox = () => {
    setLightboxOpen(false);
    document.body.style.overflow = 'auto';
  };

  const handleNextLightbox = () => {
    setLightboxIndex((prev) => (prev + 1) % activeGalleryItems.length);
  };

  const handlePrevLightbox = () => {
    setLightboxIndex((prev) => (prev - 1 + activeGalleryItems.length) % activeGalleryItems.length);
  };

  // Keyboard accessibility for Lightbox
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!lightboxOpen) return;
      if (e.key === 'Escape') handleCloseLightbox();
      if (e.key === 'ArrowRight') handleNextLightbox();
      if (e.key === 'ArrowLeft') handlePrevLightbox();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, activeGalleryItems]);

  // Copy details helper
  const handleCopyToClipboard = (text, btnId) => {
    navigator.clipboard.writeText(text).then(() => {
      const btn = document.getElementById(btnId);
      if (btn) {
        const originalColor = btn.style.color;
        const originalHTML = btn.innerHTML;

        btn.style.color = 'var(--accent-volt)';
        btn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        `;
        setTimeout(() => {
          btn.style.color = originalColor;
          btn.innerHTML = originalHTML;
        }, 1500);
      }
    });
  };

  // Contact Form Submit Handler
  const handleContactSubmit = (e) => {
    e.preventDefault();
    setIsFormSubmitting(true);

    setTimeout(() => {
      setIsFormSubmitting(false);
      setShowSuccessOverlay(true);
      // Reset form
      setContactName('');
      setContactEmail('');
      setContactGoal('');
      setContactMessage('');
    }, 1500);
  };

  return (
    <div>
      
      {/* HEADER SECTION */}
      <header className={isHeaderScrolled ? 'scrolled' : ''} id="header">
        <div className="container">
          <a onClick={() => navigate('home')} className="logo" style={{ cursor: 'pointer' }}>
            MUSCLE<span>HUB</span>
            <div className="logo-dot"></div>
          </a>
          
          <nav>
            <ul className={`nav-menu ${isMobileMenuOpen ? 'open' : ''}`} id="nav-menu">
              <li><a href="#hero" onClick={() => setIsMobileMenuOpen(false)} className={`nav-link ${activeHash === '#hero' ? 'active' : ''}`}>Home</a></li>
              <li><a href="#about" onClick={() => setIsMobileMenuOpen(false)} className={`nav-link ${activeHash === '#about' ? 'active' : ''}`}>About</a></li>
              <li><a href="#services" onClick={() => setIsMobileMenuOpen(false)} className={`nav-link ${activeHash === '#services' ? 'active' : ''}`}>Services</a></li>
              <li><a href="#trainers" onClick={() => setIsMobileMenuOpen(false)} className={`nav-link ${activeHash === '#trainers' ? 'active' : ''}`}>Trainers</a></li>
              <li><a href="#membership" onClick={() => setIsMobileMenuOpen(false)} className={`nav-link ${activeHash === '#membership' ? 'active' : ''}`}>Plans</a></li>
              <li><a href="#gallery" onClick={() => setIsMobileMenuOpen(false)} className={`nav-link ${activeHash === '#gallery' ? 'active' : ''}`}>Gallery</a></li>
              <li><a href="#contact" onClick={() => setIsMobileMenuOpen(false)} className={`nav-link ${activeHash === '#contact' ? 'active' : ''}`}>Contact</a></li>
            </ul>
          </nav>
          
          <div className="nav-cta">
            <a onClick={() => navigate('login')} className="outline-btn" style={{ padding: '0.6rem 1.5rem', fontSize: '0.85rem', borderColor: 'rgba(255,255,255,0.15)', cursor: 'pointer' }} id="header-login">Portal Login</a>
            <a onClick={() => navigate('register')} className="glow-btn" style={{ padding: '0.6rem 1.6rem', fontSize: '0.85rem', cursor: 'pointer' }} id="header-cta">Join Now</a>
          </div>
          
          <div className={`hamburger ${isMobileMenuOpen ? 'open' : ''}`} onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} aria-label="Toggle Menu">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="hero" id="hero">
        <div className="hero-bg-image">
          <img src="assets/images/hero_bg.png" alt="Interior interior background" />
        </div>
        <div className="container">
          <div className="hero-grid">
            <div className="hero-content reveal active">
              <div className="hero-tagline">
                <div className="hero-tagline-dot"></div>
                Unleash Your Limits
              </div>
              <h1 className="hero-title">
                Train Smarter, <br />
                <span className="hero-title-accent text-gradient-volt"> Manage Better</span>
              </h1>
              <p className="hero-desc">
                Experience the ultimate training environment with elite level coaches, state-of-the-art diagnostic equipment, and tailored nutrition plans built for results.
              </p>
              <div className="hero-actions">
                <a onClick={() => navigate('register')} className="glow-btn" id="hero-btn-primary" style={{ cursor: 'pointer' }}>Start Free Trial</a>
                <a href="#services" className="outline-btn" id="hero-btn-secondary">Explore Services</a>
              </div>
              
              <div className="hero-stats-row">
                <div className="hero-stat-item">
                  <h3 className="stat-number">{coachesCount}<span>+</span></h3>
                  <p>Expert Coaches</p>
                </div>
                <div className="hero-stat-item">
                  <h3 className="stat-number">{membersCount}<span>+</span></h3>
                  <p>Active Members</p>
                </div>
                <div className="hero-stat-item">
                  <h3 className="stat-number">{hoursCount}<span>/7</span></h3>
                  <p>VIP Access Hours</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT SECTION */}
      <section className="about" id="about">
        <div className="container">
          <div className="about-grid">
            <div className="about-image-wrapper reveal reveal-left active">
              <div className="about-border-glow"></div>
              <div className="about-image">
                <img src="assets/images/about_athlete.png" alt="Athlete lifting weights in gym" />
              </div>
              <div className="about-experience-badge">
                <h3 className="stat-number">{yearsCount}</h3>
                <p>Years of Pride</p>
              </div>
            </div>
            
            <div className="about-content reveal reveal-right active">
              <span className="section-tag">About MuScLe HuB</span>
              <h2 className="section-title">We Build More Than Just <span>Physiques</span></h2>
              <p className="section-desc">
                At MuScLe HuB, we believe that fitness is a mental and physical transformation. Our luxury facilities host industry-leading coaching programs designed to elevate every aspect of your performance.
              </p>
              
              <div className="about-points">
                <div className="about-point-item">
                  <div className="about-point-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="about-point-info">
                    <h4>Premium Conditioning Equipment</h4>
                    <p>Train on Olympic-level power cages, hammer strength plates, and customized cardio dashboards.</p>
                  </div>
                </div>
                
                <div className="about-point-item">
                  <div className="about-point-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="about-point-info">
                    <h4>Elite Coaching Staff</h4>
                    <p>All training staff hold active CSCS certificates, national fitness certifications, and medical degrees.</p>
                  </div>
                </div>

                <div className="about-point-item">
                  <div className="about-point-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="about-point-info">
                    <h4>Comprehensive Nutrition Support</h4>
                    <p>Personalized bi-weekly macros checks and nutritional coaching plans synced straight to your app.</p>
                  </div>
                </div>
              </div>
              <a href="#contact" className="glow-btn" id="about-btn">Get In Touch</a>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES SECTION */}
      <section className="services" id="services">
        <div className="container">
          <span className="section-tag">Our Programs</span>
          <h2 className="section-title">Designed to push your <span>Limits</span></h2>
          <p className="section-desc">Choose from our curated fitness disciplines, structured for beginners and competitive athletes alike.</p>
          
          <div className="services-grid">
            {/* 1 */}
            <div className="service-card reveal active">
              <div className="service-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                </svg>
              </div>
              <h3>Strength & Power</h3>
              <p>Master the big three lifts, build dense muscle fibers, and increase power output under heavy loads.</p>
              <a href="#contact" className="service-link">
                Learn More
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>
            </div>

            {/* 2 */}
            <div className="service-card reveal active" style={{ transitionDelay: '0.1s' }}>
              <div className="service-icon" style={{ color: 'var(--accent-cyan)' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3>HIIT & Conditioning</h3>
              <p>Boost your cardiovascular baseline, sweat off fat storage, and increase VO2 Max with high-intensity intervals.</p>
              <a href="#contact" className="service-link" style={{ color: 'var(--accent-cyan)' }}>
                Learn More
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>
            </div>

            {/* 3 */}
            <div className="service-card reveal active" style={{ transitionDelay: '0.2s' }}>
              <div className="service-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3>Mind & Yoga Flow</h3>
              <p>Improve dynamic flexibility, correct postural issues, find mental clarity, and release tension.</p>
              <a href="#contact" className="service-link">
                Learn More
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>
            </div>

            {/* 4 */}
            <div className="service-card reveal active" style={{ transitionDelay: '0.3s' }}>
              <div className="service-icon" style={{ color: 'var(--accent-cyan)' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3>Combat & MMA</h3>
              <p>Develop defensive boxing, kickboxing drills, speed mechanics, core control and intense endurance.</p>
              <a href="#contact" className="service-link" style={{ color: 'var(--accent-cyan)' }}>
                Learn More
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* MEMBERSHIP PLANS */}
      <section className="membership" id="membership">
        <div className="container">
          <div className="pricing-header">
            <span className="section-tag">Pricing Plans</span>
            <h2 className="section-title">Elevate Your <span>Experience</span></h2>
            <p className="section-desc">Choose a tier that matches your goals. No hidden fees. Cancel anytime.</p>
            
            <div className="pricing-switch-container">
              <button
                className={`switch-label ${billingPeriod === 'monthly' ? 'active' : ''}`}
                onClick={() => setBillingPeriod('monthly')}
              >
                Monthly
              </button>
              <button
                className={`switch-label ${billingPeriod === 'annual' ? 'active' : ''}`}
                onClick={() => setBillingPeriod('annual')}
              >
                Annual <span className="discount-tag">Save 20%</span>
              </button>
            </div>
          </div>
          
          <div className="pricing-grid">
            {/* Basic Plan */}
            <div className="pricing-card reveal active">
              <h3 className="plan-name">MuScLe Core</h3>
              <p className="plan-desc">Essential access for structured lifters.</p>
              <div className="plan-price-wrapper">
                <span className="plan-currency">₹</span>
                <span className="plan-price" style={{ transition: 'all 0.15s ease' }}>
                  {billingPeriod === 'monthly' ? '600' : '31'}
                </span>
                <span className="plan-period">/{billingPeriod === 'monthly' ? 'mo' : 'yr'}</span>
              </div>
              <ul className="plan-features">
                <li className="plan-feature-item">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  All gym floor access
                </li>
                <li className="plan-feature-item">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Locker room & shower use
                </li>
                <li className="plan-feature-item">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Complimentary Wi-Fi
                </li>
                <li className="plan-feature-item muted">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Group classes inclusion
                </li>
                <li className="plan-feature-item muted">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  1-on-1 personal coach
                </li>
              </ul>
              <a onClick={() => navigate('register')} className="outline-btn" style={{ width: '100%', cursor: 'pointer' }}>Select Plan</a>
            </div>
            
            {/* Popular Plan */}
            <div className="pricing-card popular reveal active">
              <h3 className="plan-name">MuScLe Pro</h3>
              <p className="plan-desc">For driven members looking to accelerate.</p>
              <div className="plan-price-wrapper">
                <span className="plan-currency">₹</span>
                <span className="plan-price" style={{ transition: 'all 0.15s ease' }}>
                  {billingPeriod === 'monthly' ? '700' : '63'}
                </span>
                <span className="plan-period">/{billingPeriod === 'monthly' ? 'mo' : 'yr'}</span>
              </div>
              <ul className="plan-features">
                <li className="plan-feature-item">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  All core services & gym floor
                </li>
                <li className="plan-feature-item">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Unlimited group classes (HIIT/Yoga)
                </li>
                <li className="plan-feature-item">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Sauna & cold plunge access
                </li>
                <li className="plan-feature-item">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Bi-weekly nutrition checkins
                </li>
                <li className="plan-feature-item muted">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  1-on-1 personal coach
                </li>
              </ul>
              <a onClick={() => navigate('register')} className="glow-btn" style={{ width: '100%', cursor: 'pointer' }}>Select Plan</a>
            </div>

            {/* Premium Plan */}
            <div className="pricing-card reveal active">
              <h3 className="plan-name">MuScLe Elite</h3>
              <p className="plan-desc">Complete bespoke training & nutrition program.</p>
              <div className="plan-price-wrapper">
                <span className="plan-currency">₹</span>
                <span className="plan-price" style={{ transition: 'all 0.15s ease' }}>
                  {billingPeriod === 'monthly' ? '900' : '119'}
                </span>
                <span className="plan-period">/{billingPeriod === 'monthly' ? 'mo' : 'yr'}</span>
              </div>
              <ul className="plan-features">
                <li className="plan-feature-item">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  24/7 keycard VIP facility access
                </li>
                <li className="plan-feature-item">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Unlimited groups + guest passes
                </li>
                <li className="plan-feature-item">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Dedicated elite master coach (4 sessions/mo)
                </li>
                <li className="plan-feature-item">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Physiotherapist assessments
                </li>
                <li className="plan-feature-item">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Apex custom energy drinks bar free
                </li>
              </ul>
              <a onClick={() => navigate('register')} className="outline-btn" style={{ width: '100%', cursor: 'pointer' }}>Select Plan</a>
            </div>
          </div>
        </div>
      </section>

      {/* MEET YOUR COACHES */}
      <section className="trainers" id="trainers">
        <div className="container">
          <span className="section-tag">Elite Coaches</span>
          <h2 className="section-title">Meet Your <span>Coaches</span></h2>
          <p className="section-desc">Train with certified athletes, champions, and sports science specialists dedicated to your goals.</p>
          
          <div className="trainers-grid">
            {/* Coach 1 */}
            <div className="trainer-card reveal active">
              <div className="trainer-image-container">
                <img src="assets/images/trainer_male.png" alt="Strength Coach Marcus Vance" />
                <div className="trainer-overlay-info">
                  <h3>Marcus Vance</h3>
                  <h4>Strength & Power Coach</h4>
                  <div className="trainer-socials">
                    <a href="#" className="trainer-social-link" aria-label="Marcus Facebook">
                      <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/></svg>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Coach 2 */}
            <div className="trainer-card reveal active" style={{ transitionDelay: '0.1s' }}>
              <div className="trainer-image-container">
                <img src="assets/images/trainer_female.png" alt="Yoga coach Sofia Chen" />
                <div className="trainer-overlay-info">
                  <h3>Sofia Chen</h3>
                  <h4>Yoga & Mobility Coach</h4>
                  <div className="trainer-socials">
                    <a href="#" className="trainer-social-link" aria-label="Sofia Facebook">
                      <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/></svg>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Coach 3 */}
            <div className="trainer-card reveal active" style={{ transitionDelay: '0.2s' }}>
              <div className="trainer-image-container">
                <img src="assets/images/trainer_combat.png" alt="HIIT Coach Damian Vance" />
                <div className="trainer-overlay-info">
                  <h3>Damian Vance</h3>
                  <h4>Combat & MMA Specialist</h4>
                  <div className="trainer-socials">
                    <a href="#" className="trainer-social-link" aria-label="Damian Facebook">
                      <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/></svg>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* GALLERY SECTION */}
      <section className="gallery" id="gallery">
        <div className="container">
          <span className="section-tag">Inside Apex</span>
          <h2 className="section-title">Explore Our <span>Spaces</span></h2>
          <p className="section-desc">Take a visual tour of our professional training rooms, high-energy classes, and recovery zones.</p>
          
          {/* Filters */}
          <div className="gallery-filters" style={{ display: 'flex', gap: '0.5rem', marginBottom: '2.5rem', flexWrap: 'wrap' }}>
            <button className={`filter-btn ${galleryFilter === 'all' ? 'active' : ''}`} onClick={() => setGalleryFilter('all')}>All Zones</button>
            <button className={`filter-btn ${galleryFilter === 'cardio' ? 'active' : ''}`} onClick={() => setGalleryFilter('cardio')}>Cardio</button>
            <button className={`filter-btn ${galleryFilter === 'strength' ? 'active' : ''}`} onClick={() => setGalleryFilter('strength')}>Strength</button>
            <button className={`filter-btn ${galleryFilter === 'yoga' ? 'active' : ''}`} onClick={() => setGalleryFilter('yoga')}>Yoga & Mobility</button>
            <button className={`filter-btn ${galleryFilter === 'hiit' ? 'active' : ''}`} onClick={() => setGalleryFilter('hiit')}>HIIT & Combat</button>
          </div>
          
          {/* Grid */}
          <div className="gallery-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.5rem' }}>
            {activeGalleryItems.map((item, index) => (
              <div
                key={item.id}
                className="gallery-item reveal active"
                style={{ cursor: 'pointer', transitionDelay: `${index * 0.05}s` }}
                onClick={() => handleOpenLightbox(item)}
              >
                <img src={item.image} alt={item.title} onError={(e) => { e.target.src = 'assets/images/gallery_weights.png'; }} />
                <div className="gallery-item-overlay">
                  <div className="gallery-item-info">
                    <h4>{item.title}</h4>
                    <p>{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT SECTION */}
      <section className="contact" id="contact">
        <div className="container">
          <div className="contact-grid">
            
            {/* Info panel */}
            <div className="contact-info-column reveal reveal-left active">
              <span className="section-tag">Reach Us</span>
              <h2 className="section-title">We'd love to <span>Hear</span> from you</h2>
              <p className="section-desc">Ready to take the next step? Get in touch, or stop by for a personal walkthrough of our facility.</p>
              
              <div className="contact-info-cards">
                {/* Phone */}
                <div className="contact-info-card" id="contact-card-phone">
                  <div className="contact-icon-box">
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div className="contact-card-text">
                    <p>Phone Number</p>
                    <p id="phone-text">+1 (555) 348-9321</p>
                  </div>
                  <div
                    className="contact-copy-btn"
                    id="copy-btn-phone"
                    onClick={() => handleCopyToClipboard('+1 (555) 348-9321', 'copy-btn-phone')}
                    title="Copy to clipboard"
                    style={{ cursor: 'pointer' }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                  </div>
                </div>

                {/* Email */}
                <div className="contact-info-card" id="contact-card-email">
                  <div className="contact-icon-box">
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="contact-card-text">
                    <p>Email Address</p>
                    <p id="email-text">join@apexathletics.com</p>
                  </div>
                  <div
                    className="contact-copy-btn"
                    id="copy-btn-email"
                    onClick={() => handleCopyToClipboard('join@apexathletics.com', 'copy-btn-email')}
                    title="Copy to clipboard"
                    style={{ cursor: 'pointer' }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                  </div>
                </div>

                {/* Location */}
                <div className="contact-info-card" id="contact-card-address">
                  <div className="contact-icon-box">
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div className="contact-card-text">
                    <p>Location Address</p>
                    <p id="address-text">782 Cyber Boulevard, NY 10012</p>
                  </div>
                  <div
                    className="contact-copy-btn"
                    id="copy-btn-address"
                    onClick={() => handleCopyToClipboard('782 Cyber Boulevard, NY 10012', 'copy-btn-address')}
                    title="Copy to clipboard"
                    style={{ cursor: 'pointer' }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact form column */}
            <div className="contact-form-card reveal reveal-right active">
              <h3 className="form-title">Start your Journey</h3>
              <p className="form-desc">Fill in the fields below. Our fitness advisor will reach out within 24 hours.</p>
              
              <form onSubmit={handleContactSubmit} id="contact-form">
                <div className="form-group-row">
                  <div className="form-group">
                    <label htmlFor="form-name" className="form-label">Full Name</label>
                    <input
                      type="text"
                      id="form-name"
                      className="form-input"
                      placeholder="name"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="form-email" className="form-label">Email Address</label>
                    <input
                      type="email"
                      id="form-email"
                      className="form-input"
                      placeholder="name@example.com"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="form-program" className="form-label">Primary Fitness Goal</label>
                  <select
                    id="form-program"
                    className="form-input"
                    value={contactGoal}
                    onChange={(e) => setContactGoal(e.target.value)}
                    style={{ background: 'var(--bg-black)', border: '1px solid var(--border-color)', color: 'var(--text-white)' }}
                    required
                  >
                    <option value="" disabled>Select your goal...</option>
                    <option value="strength">Strength & Power Conditioning</option>
                    <option value="hiit">HIIT & Cardiovascular Fat Loss</option>
                    <option value="yoga">Mobility & Yoga Wellness</option>
                    <option value="combat">Combat & Boxing Endurance</option>
                    <option value="other">General Physical Fitness</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="form-message" className="form-label">Special Notes / Medical History</label>
                  <textarea
                    id="form-message"
                    className="form-input"
                    rows="4"
                    placeholder="Tell us about your fitness history or injuries (optional)..."
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                  ></textarea>
                </div>
                
                <button type="submit" className="glow-btn form-submit-btn" id="form-submit-btn" disabled={isFormSubmitting}>
                  {isFormSubmitting ? 'Transmitting...' : 'Send Message'}
                </button>
              </form>
              
              {/* Form Success Overlay */}
              <div className={`form-success-overlay ${showSuccessOverlay ? 'active' : ''}`} id="form-success-overlay">
                <div className="success-icon-wrapper" style={{ margin: '0 auto 1.5rem auto' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="success-title">Message Received</h3>
                <p className="success-message">Thank you! Your details have been transmitted. Our team will contact you very soon.</p>
                <button className="outline-btn" id="success-close-btn" onClick={() => setShowSuccessOverlay(false)}>Done</button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* FOOTER SECTION */}
      <footer>
        <div className="container">
          <div className="footer-grid">
            {/* Brand */}
            <div className="footer-brand-column">
              <a onClick={() => navigate('home')} className="logo" style={{ marginBottom: '1.5rem', cursor: 'pointer' }}>
                MUSCLE<span>HUB</span>
              </a>
              <p>
                Premium strength club, high-performance training rooms, and state-of-the-art diagnostic equipment. Built to crush limits.
              </p>
            </div>
            
            {/* Explore links */}
            <div className="footer-grid-column">
              <h4 className="footer-column-title">Explore</h4>
              <ul className="footer-links">
                <li><a href="#hero">Home</a></li>
                <li><a href="#about">About</a></li>
                <li><a href="#services">Services</a></li>
                <li><a href="#trainers">Coaches</a></li>
                <li><a href="#membership">Pricing</a></li>
              </ul>
            </div>
            
            {/* Club Hours */}
            <div className="footer-grid-column">
              <h4 className="footer-column-title">Club Hours</h4>
              <ul className="footer-links" style={{ gap: '0.8rem' }}>
                <li style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                  Weekdays: <span style={{ color: 'var(--text-white)', fontWeight: 600, display: 'block' }}>5:00 AM - 11:00 PM</span>
                </li>
                <li style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                  Saturdays: <span style={{ color: 'var(--text-white)', fontWeight: 600, display: 'block' }}>6:00 AM - 10:00 PM</span>
                </li>
                <li style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                  Sundays: <span style={{ color: 'var(--text-white)', fontWeight: 600, display: 'block' }}>8:00 AM - 8:00 PM</span>
                </li>
              </ul>
            </div>
            
            {/* Contact */}
            <div className="footer-grid-column">
              <h4 className="footer-column-title">Club Contact</h4>
              <div className="footer-contact-item" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="16" height="16">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>+1 (555) 348-9321</span>
              </div>
              <div className="footer-contact-item" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="16" height="16">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>join@musclehub.com</span>
              </div>
              <div className="footer-contact-item" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="16" height="16">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>782 Cyber Boulevard, NY 10012</span>
              </div>
            </div>
          </div>
          
          <div className="footer-bottom" style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '2rem', marginTop: '3.5rem', flexWrap: 'wrap', gap: '1rem', fontSize: '0.88rem', color: 'var(--text-dim)' }}>
            <p className="footer-copy" style={{ margin: 0 }}>
              2026 MuScLe HuB. All Rights Reserved. Designed by Antigravity.
            </p>
            <div className="footer-bottom-links" style={{ display: 'flex', gap: '1.5rem' }}>
              <a href="#">Privacy Policy</a>
              <a href="#">Terms & Conditions</a>
              <a href="#">Sitemap</a>
            </div>
          </div>
        </div>
      </footer>

      {/* LIGHTBOX POPUP MODAL */}
      {lightboxOpen && activeGalleryItems[lightboxIndex] && (
        <div className="lightbox open" id="gallery-lightbox" style={{ display: 'flex' }} onClick={handleCloseLightbox}>
          <div className="lightbox-close" id="lightbox-close-btn" onClick={handleCloseLightbox}>&times;</div>
          <div className="lightbox-nav lightbox-prev" id="lightbox-prev-btn" onClick={(e) => { e.stopPropagation(); handlePrevLightbox(); }}>&#10094;</div>
          
          <div className="lightbox-content-wrapper" onClick={(e) => e.stopPropagation()}>
            <img
              src={activeGalleryItems[lightboxIndex].image}
              alt={activeGalleryItems[lightboxIndex].title}
              className="lightbox-img"
              id="lightbox-image"
              onError={(e) => { e.target.src = 'assets/images/gallery_weights.png'; }}
            />
            <div className="lightbox-caption" id="lightbox-caption">{activeGalleryItems[lightboxIndex].title}</div>
          </div>
          
          <div className="lightbox-nav lightbox-next" id="lightbox-next-btn" onClick={(e) => { e.stopPropagation(); handleNextLightbox(); }}>&#10095;</div>
        </div>
      )}

    </div>
  );
}
