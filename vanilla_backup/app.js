/**
 * APEX ATHLETICS - CORE WEB INTERACTION ENGINE
 * Powered by vanilla ES6+ JavaScript
 */

document.addEventListener('DOMContentLoaded', () => {
  
  // ==========================================
  // 1. MOBILE NAVIGATION MENU
  // ==========================================
  const header = document.getElementById('header');
  const hamburger = document.getElementById('hamburger-menu');
  const navMenu = document.getElementById('nav-menu');
  const navLinks = document.querySelectorAll('.nav-link');

  // Toggle mobile menu visibility
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    navMenu.classList.toggle('open');
  });

  // Close mobile menu when a link is clicked
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('open');
      navMenu.classList.remove('open');
    });
  });

  // Add scroll class to Header for glassmorphic styling change
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });


  // ==========================================
  // 2. SCROLL SPY - NAV LINK INDICATION
  // ==========================================
  const sections = document.querySelectorAll('section');

  const scrollSpy = () => {
    const scrollPosition = window.scrollY + 150; // offset for sticky header

    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      const sectionId = section.getAttribute('id');

      if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
        navLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${sectionId}`) {
            link.classList.add('active');
          }
        });
      }
    });
  };

  window.addEventListener('scroll', scrollSpy);


  // ==========================================
  // 3. SCROLL REVEAL ANIMATIONS (Intersection Observer)
  // ==========================================
  const revealElements = document.querySelectorAll('.reveal');

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        // Unobserve once animation is executed to preserve performance
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
  });

  revealElements.forEach(element => {
    revealObserver.observe(element);
  });


  // ==========================================
  // 4. METRICS COUNTER ANIMATION
  // ==========================================
  const stats = document.querySelectorAll('.stat-number');
  let startedCounter = false;

  const runCounter = () => {
    stats.forEach(stat => {
      const target = parseInt(stat.getAttribute('data-target'), 10);
      const suffix = stat.querySelector('span') ? stat.querySelector('span').outerHTML : '';
      let current = 0;
      const duration = 1500; // ms
      const stepTime = Math.max(Math.floor(duration / target), 15);
      
      const timer = setInterval(() => {
        current += Math.ceil(target / (duration / stepTime));
        if (current >= target) {
          stat.innerHTML = target + suffix;
          clearInterval(timer);
        } else {
          stat.innerHTML = current + suffix;
        }
      }, stepTime);
    });
  };

  // Observe the Stats section to trigger counters
  const statsSection = document.querySelector('.hero-stats-row');
  const countObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !startedCounter) {
        runCounter();
        startedCounter = true;
      }
    });
  }, { threshold: 0.5 });

  if (statsSection) {
    countObserver.observe(statsSection);
  }

  // Observe the experience badge in About section too
  const aboutBadge = document.querySelector('.about-experience-badge');
  let startedAboutCounter = false;

  const runAboutCounter = () => {
    const stat = aboutBadge.querySelector('h3');
    const target = parseInt(stat.getAttribute('data-target'), 10);
    let current = 0;
    const duration = 1200; // ms
    const stepTime = Math.max(Math.floor(duration / target), 30);

    const timer = setInterval(() => {
      current++;
      if (current >= target) {
        stat.textContent = target;
        clearInterval(timer);
      } else {
        stat.textContent = current;
      }
    }, stepTime);
  };

  const aboutBadgeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !startedAboutCounter) {
        runAboutCounter();
        startedAboutCounter = true;
      }
    });
  }, { threshold: 0.5 });

  if (aboutBadge) {
    aboutBadgeObserver.observe(aboutBadge);
  }


  // ==========================================
  // 5. MEMBERSHIP PRICE TOGGLE (Monthly / Annual)
  // ==========================================
  const monthlyBtn = document.getElementById('pricing-monthly-btn');
  const annualBtn = document.getElementById('pricing-annual-btn');
  const prices = document.querySelectorAll('.plan-price');
  const periods = document.querySelectorAll('.plan-period');

  const togglePricing = (mode) => {
    if (mode === 'annual') {
      monthlyBtn.classList.remove('active');
      annualBtn.classList.add('active');
      
      prices.forEach(price => {
        const annualValue = price.getAttribute('data-annual');
        animateValueChange(price, annualValue);
      });
      
      periods.forEach(period => {
        period.textContent = '/yr';
      });
    } else {
      annualBtn.classList.remove('active');
      monthlyBtn.classList.add('active');
      
      prices.forEach(price => {
        const monthlyValue = price.getAttribute('data-monthly');
        animateValueChange(price, monthlyValue);
      });
      
      periods.forEach(period => {
        period.textContent = '/mo';
      });
    }
  };

  // Micro-animation for price values switching
  const animateValueChange = (element, targetValue) => {
    element.style.transform = 'scale(0.8)';
    element.style.opacity = '0';
    
    setTimeout(() => {
      element.textContent = targetValue;
      element.style.transform = 'scale(1)';
      element.style.opacity = '1';
    }, 150);
  };

  monthlyBtn.addEventListener('click', () => togglePricing('monthly'));
  annualBtn.addEventListener('click', () => togglePricing('annual'));


  // ==========================================
  // 6. FILTERABLE GALLERY & LIGHTBOX
  // ==========================================
  const filterBtns = document.querySelectorAll('.filter-btn');
  const galleryItems = document.querySelectorAll('.gallery-item');
  const lightbox = document.getElementById('gallery-lightbox');
  const lightboxImg = document.getElementById('lightbox-image');
  const lightboxCaption = document.getElementById('lightbox-caption');
  const lightboxClose = document.getElementById('lightbox-close-btn');
  const lightboxPrev = document.getElementById('lightbox-prev-btn');
  const lightboxNext = document.getElementById('lightbox-next-btn');

  let currentGalleryIndex = 0;
  let activeGalleryItems = Array.from(galleryItems); // currently filtered list

  // Filtering Logic
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Toggle button states
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filterValue = btn.getAttribute('data-filter');
      activeGalleryItems = [];

      galleryItems.forEach(item => {
        const category = item.getAttribute('data-category');
        
        if (filterValue === 'all' || category === filterValue) {
          item.style.display = 'block';
          // Re-trigger layout animations
          setTimeout(() => {
            item.style.opacity = '1';
            item.style.transform = 'scale(1)';
          }, 50);
          activeGalleryItems.push(item);
        } else {
          item.style.opacity = '0';
          item.style.transform = 'scale(0.8)';
          setTimeout(() => {
            item.style.display = 'none';
          }, 300);
        }
      });
    });
  });

  // Lightbox Modal Logic
  const openLightbox = (index) => {
    currentGalleryIndex = index;
    const targetItem = activeGalleryItems[currentGalleryIndex];
    const imgSource = targetItem.querySelector('img').getAttribute('src');
    const imgAlt = targetItem.querySelector('img').getAttribute('alt');
    const titleText = targetItem.querySelector('h4').textContent;

    lightboxImg.setAttribute('src', imgSource);
    lightboxImg.setAttribute('alt', imgAlt);
    lightboxCaption.textContent = titleText;

    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden'; // lock page scroll
  };

  const closeLightbox = () => {
    lightbox.classList.remove('open');
    document.body.style.overflow = 'auto'; // release page scroll
  };

  const nextLightboxImage = () => {
    let nextIndex = currentGalleryIndex + 1;
    if (nextIndex >= activeGalleryItems.length) {
      nextIndex = 0;
    }
    
    // Smooth transition between items
    lightboxImg.style.transform = 'scale(0.95)';
    lightboxImg.style.opacity = '0';
    setTimeout(() => {
      openLightbox(nextIndex);
      lightboxImg.style.transform = 'scale(1)';
      lightboxImg.style.opacity = '1';
    }, 150);
  };

  const prevLightboxImage = () => {
    let prevIndex = currentGalleryIndex - 1;
    if (prevIndex < 0) {
      prevIndex = activeGalleryItems.length - 1;
    }
    
    lightboxImg.style.transform = 'scale(0.95)';
    lightboxImg.style.opacity = '0';
    setTimeout(() => {
      openLightbox(prevIndex);
      lightboxImg.style.transform = 'scale(1)';
      lightboxImg.style.opacity = '1';
    }, 150);
  };

  // Wire events to gallery elements
  galleryItems.forEach(item => {
    item.addEventListener('click', () => {
      const index = activeGalleryItems.indexOf(item);
      if (index !== -1) {
        openLightbox(index);
      }
    });
  });

  lightboxClose.addEventListener('click', closeLightbox);
  lightboxNext.addEventListener('click', nextLightboxImage);
  lightboxPrev.addEventListener('click', prevLightboxImage);

  // Close by clicking overlay backdrop
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) {
      closeLightbox();
    }
  });

  // Keyboard navigation support
  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('open')) return;
    
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowRight') nextLightboxImage();
    if (e.key === 'ArrowLeft') prevLightboxImage();
  });


  // ==========================================
  // 7. CONTACT CARDS - COPY TO CLIPBOARD
  // ==========================================
  const copyBtns = document.querySelectorAll('.contact-copy-btn');

  copyBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-copy-target');
      const textToCopy = document.getElementById(targetId).textContent;
      
      navigator.clipboard.writeText(textToCopy).then(() => {
        // Visual indicator of successful copying
        const originalColor = btn.style.color;
        btn.style.color = 'var(--accent-volt)';
        
        // Temporarily modify tooltip or state
        const originalIcon = btn.innerHTML;
        btn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        `;
        
        setTimeout(() => {
          btn.style.color = originalColor;
          btn.innerHTML = originalIcon;
        }, 1500);
      }).catch(err => {
        console.error('Could not copy text: ', err);
      });
    });
  });


  // ==========================================
  // 8. CONTACT FORM SUBMISSION HANDLER
  // ==========================================
  const contactForm = document.getElementById('contact-form');
  const successOverlay = document.getElementById('form-success-overlay');
  const successCloseBtn = document.getElementById('success-close-btn');
  const submitBtn = document.getElementById('form-submit-btn');

  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // Show dynamic submitting status on CTA button
    const originalBtnText = submitBtn.textContent;
    submitBtn.textContent = 'Transmitting...';
    submitBtn.disabled = true;

    // Simulate server POST transmission delay (1.5 seconds)
    setTimeout(() => {
      // Clear inputs
      contactForm.reset();
      
      // Reset submit button state
      submitBtn.textContent = originalBtnText;
      submitBtn.disabled = false;
      
      // Reveal premium overlay feedback box
      successOverlay.classList.add('active');
    }, 1500);
  });

  // Dismiss success overlay feedback
  successCloseBtn.addEventListener('click', () => {
    successOverlay.classList.remove('active');
  });

});
