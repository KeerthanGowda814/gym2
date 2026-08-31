/**
 * APEX ATHLETICS - DASHBOARD PANEL MANAGER
 */

document.addEventListener('DOMContentLoaded', () => {

  // 1. Double check routing credentials on load
  if (window.ApexAuth) {
    ApexAuth.enforceRouteGuard();
  } else {
    // Fallback if library failed to load
    window.location.href = 'login.html';
    return;
  }

  // Retrieve active user payload
  const currentUser = ApexAuth.getCurrentUser();
  if (!currentUser) {
    ApexAuth.logout();
    window.location.href = 'login.html';
    return;
  }

  // ==========================================
  // 2. USER DETAILS INITIALIZATION
  // ==========================================
  const userInitialsBox = document.getElementById('user-avatar-initials');
  const userNameText = document.getElementById('user-display-name');
  const userRoleText = document.getElementById('user-display-role');
  const welcomeText = document.getElementById('welcome-user-name');
  const dateText = document.getElementById('db-date-display');
  
  // Set details
  userNameText.textContent = currentUser.name;
  welcomeText.textContent = currentUser.name.split(' ')[0]; // display first name
  userRoleText.textContent = currentUser.role;
  
  // Generate Avatar Initials
  const nameParts = currentUser.name.split(' ');
  const initials = nameParts.map(part => part[0]).join('').toUpperCase().substring(0, 2);
  userInitialsBox.textContent = initials;

  // Set date display
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const today = new Date();
  dateText.textContent = today.toLocaleDateString('en-US', options);

  // Initialize attendance tracking module
  initAttendance();

  // ==========================================
  // 3. SECURE WORKSPACE ROLE ROUTER
  // ==========================================
  const adminPanel = document.getElementById('panel-admin');
  const trainerPanel = document.getElementById('panel-trainer');
  const memberPanel = document.getElementById('panel-member');
  
  // Display only the panel corresponding to the user's role
  if (currentUser.role === 'admin') {
    adminPanel.style.display = 'block';
    initAdminChart();
    // Show admin navigation links, hide member specific links
    document.querySelectorAll('.admin-only-nav').forEach(el => el.style.display = 'block');
    document.querySelectorAll('.member-only-nav').forEach(el => el.style.display = 'none');
  } else if (currentUser.role === 'trainer') {
    trainerPanel.style.display = 'block';
    initTrainerFeatures();
    // Hide admin, member specific links, and attendance
    document.querySelectorAll('.admin-only-nav').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.member-only-nav').forEach(el => el.style.display = 'none');
    const navAtt = document.getElementById('nav-db-attendance');
    if (navAtt) navAtt.parentElement.style.display = 'none';
  } else if (currentUser.role === 'member') {
    memberPanel.style.display = 'block';
    initMemberFeatures();
    // Hide admin navigation links, show member specific links
    document.querySelectorAll('.admin-only-nav').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.member-only-nav').forEach(el => el.style.display = 'block');
  }

  // ==========================================
  // 3.5 GLOBAL SIDEBAR NAVIGATION CONTROLLER
  // ==========================================
  const sidebarNavLinks = document.querySelectorAll('.sidebar-nav-link');
  
  sidebarNavLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      
      const linkId = link.id;
      if (!linkId) return;
      
      // Update active links styling
      sidebarNavLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      
      // Handle subview toggles based on role
      if (currentUser.role === 'admin') {
        const adminViewsMap = {
          'nav-db-home': 'admin-subview-home',
          'nav-db-analytics': 'admin-subview-analytics',
          'nav-db-billing': 'admin-subview-payments',
          'nav-db-equipment': 'admin-subview-equipment',
          'nav-db-attendance': 'admin-subview-attendance'
        };
        const targetViewId = adminViewsMap[linkId];
        if (targetViewId) {
          document.querySelectorAll('.admin-sub-view').forEach(view => {
            view.style.display = (view.id === targetViewId) ? 'block' : 'none';
          });
        }
      } else if (currentUser.role === 'member') {
        const memberViewsMap = {
          'nav-db-home': 'member-subview-home',
          'nav-db-trainer': 'member-subview-trainer',
          'nav-db-attendance': 'member-subview-attendance',
          'nav-db-supplements': 'member-subview-supplements',
          'nav-db-equipment': 'member-subview-equipment'
        };
        const targetViewId = memberViewsMap[linkId];
        if (targetViewId) {
          document.querySelectorAll('.member-sub-view').forEach(view => {
            view.style.display = (view.id === targetViewId) ? 'block' : 'none';
          });
          // Scroll chat log to bottom if navigating to coach chat
          if (linkId === 'nav-db-trainer') {
            const hist = document.getElementById('subview-chat-history');
            if (hist) hist.scrollTop = hist.scrollHeight;
          }
        }
      }
    });
  });

  // ==========================================
  // 4. LOGOUT ROUTINE
  // ==========================================
  const logoutBtn = document.getElementById('portal-logout-btn');
  logoutBtn.addEventListener('click', () => {
    // Visual logging
    logoutBtn.textContent = 'Clearing...';
    logoutBtn.disabled = true;
    
    setTimeout(() => {
      ApexAuth.logout();
      window.location.href = 'login.html';
    }, 800);
  });


  // ==========================================
  // 5. ROLE-SPECIFIC WORKSPACE PLUGINS
  // ==========================================
  
  // ==========================================
  // 5. ROLE-SPECIFIC WORKSPACE PLUGINS
  // ==========================================
  
  // --- Global Chart.js Configuration & Styling ---
  if (window.Chart) {
    Chart.defaults.color = '#9595a6'; // var(--text-muted)
    Chart.defaults.font.family = "'Inter', sans-serif";
    Chart.defaults.font.size = 11;
  }

  // helper function to create a smooth dark-themed neon gradient
  function createNeonGradient(ctx, colorStart, colorEnd) {
    const gradient = ctx.createLinearGradient(0, 0, 0, 180);
    gradient.addColorStop(0, colorStart);
    gradient.addColorStop(1, colorEnd);
    return gradient;
  }

  // Mock Databases
  const mockPayments = [];
  const mockExpiryAlerts = [];
  const mockActivities = [];

  // --- A. Admin Dashboard Features (Chart.js & Data Feeds) ---
  function initAdminChart() {
    if (!window.Chart) {
      console.warn("Chart.js failed to load. Falling back to simple metrics.");
      return;
    }

    // 1. Membership Growth Chart (Line Chart)
    const growthCanvas = document.getElementById('chart-membership-growth');
    if (growthCanvas) {
      const ctx = growthCanvas.getContext('2d');
      const gradient = createNeonGradient(ctx, 'rgba(198, 255, 0, 0.25)', 'rgba(198, 255, 0, 0.00)');
      new Chart(ctx, {
        type: 'line',
        data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
          datasets: [{
            label: 'Total Members',
            data: [840, 910, 990, 1070, 1150, 1210, 1248],
            borderColor: '#c6ff00',
            borderWidth: 3,
            backgroundColor: gradient,
            fill: true,
            tension: 0.35,
            pointBackgroundColor: '#c6ff00',
            pointBorderColor: 'rgba(8, 8, 10, 0.8)',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: '#9595a6' }
            },
            y: {
              grid: { color: 'rgba(255, 255, 255, 0.03)' },
              ticks: { color: '#9595a6' }
            }
          }
        }
      });
    }

    // 2. Revenue Streams Chart (Bar Chart)
    const revCanvas = document.getElementById('chart-revenue-streams');
    if (revCanvas) {
      const ctx = revCanvas.getContext('2d');
      const gradient = createNeonGradient(ctx, 'rgba(0, 240, 255, 0.3)', 'rgba(0, 240, 255, 0.02)');
      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
          datasets: [{
            label: 'Monthly Income',
            data: [29000, 31800, 34500, 38200, 40100, 41900, 42850],
            backgroundColor: gradient,
            borderColor: '#00f0ff',
            borderWidth: 1.5,
            borderRadius: 4,
            hoverBackgroundColor: '#00f0ff',
            hoverBorderColor: '#ffffff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: '#9595a6' }
            },
            y: {
              grid: { color: 'rgba(255, 255, 255, 0.03)' },
              ticks: { color: '#9595a6' }
            }
          }
        }
      });
    }

    // 3. Attendance Peaks Chart (Line Chart)
    const attCanvas = document.getElementById('chart-attendance-peaks');
    if (attCanvas) {
      const ctx = attCanvas.getContext('2d');
      const gradient = createNeonGradient(ctx, 'rgba(255, 94, 0, 0.25)', 'rgba(255, 94, 0, 0.00)');
      new Chart(ctx, {
        type: 'line',
        data: {
          labels: ['6am', '8am', '10am', '12pm', '2pm', '4pm', '6pm', '8pm', '10pm'],
          datasets: [{
            label: 'Athletes On-site',
            data: [35, 92, 70, 45, 60, 98, 134, 88, 30],
            borderColor: '#ff5e00',
            borderWidth: 3,
            backgroundColor: gradient,
            fill: true,
            tension: 0.35,
            pointBackgroundColor: '#ff5e00',
            pointBorderColor: 'rgba(8, 8, 10, 0.8)',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: '#9595a6' }
            },
            y: {
              grid: { color: 'rgba(255, 255, 255, 0.03)' },
              ticks: { color: '#9595a6' }
            }
          }
        }
      });
    }

    // Populate Dynamic Widgets
    renderAdminWidgets();
  }

  // Populate dynamic tables and timeline items for Admin Portal
  function renderAdminWidgets() {
    // A. Expiry Alerts Widget
    const alertsContainer = document.getElementById('admin-expiry-alerts');
    const alertsCountBadge = document.getElementById('alert-count-badge');
    
    if (alertsContainer && alertsCountBadge) {
      alertsContainer.innerHTML = '';
      alertsCountBadge.textContent = `${mockExpiryAlerts.length} Alerts`;
      
      if (mockExpiryAlerts.length === 0) {
        alertsContainer.innerHTML = `<div style="text-align: center; padding: 2rem; color: var(--text-dim); font-size: 0.85rem;">No active expiry alerts.</div>`;
      } else {
        mockExpiryAlerts.forEach((alert, index) => {
          const alertItem = document.createElement('div');
          alertItem.className = `expiry-alert-item ${alert.urgent ? 'urgent' : ''}`;
          alertItem.innerHTML = `
            <div class="alert-user-details">
              <h5>${alert.name}</h5>
              <p>${alert.plan} • Expires in <strong style="color: ${alert.urgent ? '#ff3e6c' : '#ff9f00'};">${alert.daysLeft} days</strong> (${alert.date})</p>
            </div>
            <button class="alert-action-btn" data-index="${index}">Notify</button>
          `;
          alertsContainer.appendChild(alertItem);
          
          alertItem.querySelector('.alert-action-btn').addEventListener('click', (e) => {
            const btn = e.target;
            btn.textContent = 'Notified';
            btn.disabled = true;
            btn.style.background = 'rgba(255,255,255,0.01)';
            btn.style.borderColor = 'rgba(255,255,255,0.03)';
            btn.style.color = '#5c5c6e';
            
            addRecentAdminActivity(`Dispatched expiry alert reminder message to <strong>${alert.name}</strong>`, 'orange');
          });
        });
      }
    }

    // B. Latest Payments Table
    const paymentsBody = document.getElementById('admin-payments-body');
    const paymentsCountBadge = document.getElementById('payment-count-badge');
    
    if (paymentsBody && paymentsCountBadge) {
      paymentsBody.innerHTML = '';
      paymentsCountBadge.textContent = `${mockPayments.length} Transactions`;
      
      if (mockPayments.length === 0) {
        paymentsBody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 1.5rem; color: var(--text-dim); font-size: 0.85rem;">No transaction logs recorded.</td></tr>`;
      } else {
        mockPayments.forEach(pay => {
          const row = document.createElement('tr');
          row.innerHTML = `
            <td style="font-family: monospace; font-weight: 700; color: var(--accent-cyan); font-size: 0.85rem;">${pay.txId}</td>
            <td><strong>${pay.name}</strong></td>
            <td>${pay.plan}</td>
            <td><strong>$${pay.amount.toFixed(2)}</strong></td>
            <td><span class="status-badge ${pay.status}">${pay.status}</span></td>
            <td>${pay.date}</td>
          `;
          paymentsBody.appendChild(row);
        });
      }
    }

    // C. Recent Activities Timeline
    const activitiesContainer = document.getElementById('admin-activities-timeline');
    if (activitiesContainer) {
      activitiesContainer.innerHTML = '';
      if (mockActivities.length === 0) {
        activitiesContainer.innerHTML = `<div style="text-align: center; padding: 2rem; color: var(--text-dim); font-size: 0.85rem;">No activities logged.</div>`;
      } else {
        mockActivities.forEach((act, idx) => {
          const item = document.createElement('div');
          item.className = 'timeline-item';
          item.style.animationDelay = `${idx * 0.08}s`;
          item.innerHTML = `
            <div class="timeline-dot ${act.color}"></div>
            <div class="timeline-content">
              <p>${act.text}</p>
              <span>${act.time}</span>
            </div>
          `;
          activitiesContainer.appendChild(item);
        });
      }
    }
  }

  // Push new event helper
  function addRecentAdminActivity(text, color = 'volt') {
    mockActivities.unshift({
      type: 'custom',
      text: text,
      time: 'Just Now',
      color: color
    });
    
    const activitiesContainer = document.getElementById('admin-activities-timeline');
    if (activitiesContainer) {
      const item = document.createElement('div');
      item.className = 'timeline-item';
      item.style.animationDelay = '0s';
      item.innerHTML = `
        <div class="timeline-dot ${color}"></div>
        <div class="timeline-content">
          <p>${text}</p>
          <span>Just Now</span>
        </div>
      `;
      activitiesContainer.insertBefore(item, activitiesContainer.firstChild);
    }
  }

  // --- B. Trainer scheduling additions ---
  function initTrainerFeatures() {
    const scheduleForm = document.getElementById('trainer-schedule-form');
    const agendaList = document.querySelector('.agenda-list');
    
    if (scheduleForm && agendaList) {
      scheduleForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const clientSelect = document.getElementById('sched-client');
        const routineInput = document.getElementById('sched-routine');
        const timeInput = document.getElementById('sched-time');
        
        const clientVal = clientSelect.value;
        const routineVal = routineInput.value.trim();
        const timeVal = timeInput.value.trim();
        
        if (!routineVal || !timeVal) return;
        
        // Create new HTML list item
        const newItem = document.createElement('li');
        newItem.className = 'agenda-item';
        newItem.style.opacity = '0';
        newItem.style.transform = 'translateY(15px)';
        newItem.style.transition = 'all 0.4s ease';
        
        newItem.innerHTML = `
          <div class="agenda-time">${timeVal}</div>
          <div class="agenda-details">
            <h5>${clientVal}</h5>
            <p>${routineVal}</p>
          </div>
          <span class="agenda-badge check">Ready</span>
        `;
        
        // Prepend to top of agenda list
        agendaList.insertBefore(newItem, agendaList.firstChild);
        
        // Animate entry
        setTimeout(() => {
          newItem.style.opacity = '1';
          newItem.style.transform = 'translateY(0)';
        }, 50);
        
        // Reset input fields
        scheduleForm.reset();
        
        // Show log entry inside console
        console.log(`[Coaching dispatch]: Issued "${routineVal}" for ${clientVal} at ${timeVal}`);
      });
    }
  }

  // --- C. Member workout logging & circular animations ---
  function initMemberFeatures() {
    // Dynamic keycard member name assignment
    const keycardMemberName = document.getElementById('keycard-member-name');
    if (keycardMemberName) {
      keycardMemberName.textContent = currentUser.name;
    }

    const workoutForm = document.getElementById('workout-log-form');
    const journalTableBody = document.querySelector('#workout-journal-table tbody');
    
    if (workoutForm && journalTableBody) {
      workoutForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const exerciseInput = document.getElementById('log-exercise');
        const weightInput = document.getElementById('log-weight');
        const repsInput = document.getElementById('log-reps');
        
        const exerciseVal = exerciseInput.value.trim();
        const weightVal = weightInput.value.trim();
        const repsVal = repsInput.value;
        
        if (!exerciseVal || !weightVal || !repsVal) return;
        
        // Remove empty state row if present
        const emptyRow = journalTableBody.querySelector('.empty-state-row');
        if (emptyRow) {
          emptyRow.remove();
        }

        // Create table row
        const newRow = document.createElement('tr');
        newRow.style.opacity = '0';
        newRow.style.transform = 'translateX(-10px)';
        newRow.style.transition = 'all 0.4s ease';
        
        newRow.innerHTML = `
          <td>${exerciseVal}</td>
          <td>${weightVal}</td>
          <td>${repsVal} reps</td>
          <td>Just Now</td>
        `;
        
        // Prepend to top of table
        journalTableBody.insertBefore(newRow, journalTableBody.firstChild);
        
        // Animate entry
        setTimeout(() => {
          newRow.style.opacity = '1';
          newRow.style.transform = 'translateX(0)';
        }, 50);
        
        // Reset inputs
        workoutForm.reset();
      });
    }

    // Animate Diet macro ratio circles
    const circles = document.querySelectorAll('.macro-circle');
    setTimeout(() => {
      circles.forEach(circle => {
        const parent = circle.parentElement;
        const ratioText = parent.querySelector('p').textContent;
        // Parse ingestion/target numbers to calculate visual progress
        const matches = ratioText.match(/(\d+)g \/ (\d+)g/);
        if (matches && matches.length === 3) {
          const current = parseInt(matches[1], 10);
          const target = parseInt(matches[2], 10);
          const percent = Math.min(Math.round((current / target) * 100), 100);
          
          circle.style.setProperty('--percent', percent);
          circle.querySelector('span').textContent = `${percent}%`;
        }
      });
    }, 150);

    // DYNAMIC EXPIRE & PAYMENT HISTORY (MEMBER SPECIFIC)
    const alertBox = document.getElementById('member-expiry-alert-box');
    const memberPaymentsBody = document.getElementById('member-payments-body');
    const renewBtn = document.getElementById('member-renew-btn');

    if (alertBox && currentUser.name === 'Ethan Hunt') {
      alertBox.style.display = 'block';
    }

    if (renewBtn && alertBox) {
      renewBtn.addEventListener('click', () => {
        renewBtn.textContent = 'Active';
        renewBtn.disabled = true;
        renewBtn.style.background = 'rgba(0, 255, 102, 0.05)';
        renewBtn.style.color = '#00ff66';
        renewBtn.style.borderColor = 'rgba(0, 255, 102, 0.15)';
        
        const alertText = alertBox.querySelector('.alert-details p');
        alertText.innerHTML = 'Thank you! Your <strong>Apex Pro Pass</strong> has been successfully renewed. Session keycard active. Next charge date: <strong>August 10, 2026</strong>.';
        
        // Remove empty state if present in payments
        if (memberPaymentsBody) {
          const emptyPayRow = memberPaymentsBody.querySelector('.empty-pay-row');
          if (emptyPayRow) emptyPayRow.remove();
        }

        // Add new transaction row dynamically
        const txId = 'TX-' + Math.floor(1000 + Math.random() * 9000);
        const newRow = document.createElement('tr');
        newRow.innerHTML = `
          <td style="font-family: monospace; font-weight: 700; color: var(--accent-cyan); font-size: 0.85rem;">${txId}</td>
          <td>Apex Pro</td>
          <td><strong>$79.00</strong></td>
          <td><span class="status-badge paid">paid</span></td>
          <td>Today</td>
        `;
        if (memberPaymentsBody) {
          memberPaymentsBody.insertBefore(newRow, memberPaymentsBody.firstChild);
        }
      });
    }

    if (memberPaymentsBody) {
      const memberInvoices = [];
      
      memberPaymentsBody.innerHTML = '';
      if (memberInvoices.length === 0) {
        memberPaymentsBody.innerHTML = `<tr class="empty-pay-row"><td colspan="5" style="text-align: center; color: var(--text-dim); font-size: 0.85rem; padding: 1.2rem;">No invoices logged.</td></tr>`;
      } else {
        memberInvoices.forEach(inv => {
          const row = document.createElement('tr');
          row.innerHTML = `
            <td style="font-family: monospace; font-weight: 700; color: var(--accent-cyan); font-size: 0.85rem;">${inv.txId}</td>
            <td>${inv.plan}</td>
            <td><strong>$${inv.amount.toFixed(2)}</strong></td>
            <td><span class="status-badge ${inv.status}">${inv.status}</span></td>
            <td>${inv.date}</td>
          `;
          memberPaymentsBody.appendChild(row);
        });
      }
    }



    // --- 1. Trainer Interactive Messaging (Subview Page) ---
    const chatForm = document.getElementById('subview-chat-form');
    const chatHistory = document.getElementById('subview-chat-history');
    const chatInput = document.getElementById('subview-chat-input');

    if (chatForm && chatHistory && chatInput) {
      chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const msgText = chatInput.value.trim();
        if (!msgText) return;

        // Append member bubble
        const memberBubble = document.createElement('div');
        memberBubble.className = 'chat-bubble member';
        memberBubble.style.cssText = 'align-self: flex-end; max-width: 85%; background: var(--accent-volt); color: var(--bg-black); padding: 0.7rem 0.9rem; border-radius: 8px 8px 0 8px; font-size: 0.85rem; line-height: 1.4;';
        memberBubble.innerHTML = `
          <p style="font-weight: 600;">${msgText}</p>
          <span style="display: block; font-size: 0.65rem; color: rgba(8,8,10,0.6); margin-top: 0.4rem; text-align: right;">Just Now</span>
        `;
        chatHistory.appendChild(memberBubble);
        chatInput.value = '';
        
        // Scroll to bottom
        chatHistory.scrollTop = chatHistory.scrollHeight;

        // Dynamic Trainer Response
        setTimeout(() => {
          let responseText = "Thanks for the message, Ethan! Keep up the intensity. Make sure to log your next strength metrics so we can review the trajectory.";
          const lowerMsg = msgText.toLowerCase();
          
          if (lowerMsg.includes('protein') || lowerMsg.includes('macro') || lowerMsg.includes('eat') || lowerMsg.includes('food')) {
            responseText = "Excellent tracking! With your squats climbing, aim for 200g of protein. Consuming a whey isolate shake immediately post-session will boost protein synthesis.";
          } else if (lowerMsg.includes('squat') || lowerMsg.includes('lift') || lowerMsg.includes('press') || lowerMsg.includes('rep')) {
            responseText = "Your posture looked solid on the 275 lbs reps. Let's aim to push for 295 lbs next session. Focus on high lateral core tension before starting the descent.";
          } else if (lowerMsg.includes('creatine') || lowerMsg.includes('supplement')) {
            responseText = "Creatine is perfect for strength build-ups. Take 5g daily at any convenient time to maintain muscle cell saturation. No loading phase needed.";
          } else if (lowerMsg.includes('pain') || lowerMsg.includes('hurt') || lowerMsg.includes('knee') || lowerMsg.includes('back')) {
            responseText = "If you're feeling sharp joint pain, pause lifts immediately. Do foam-rolling drills and cold plunge recovery. We'll adjust your routine to add mobility stretches.";
          } else if (lowerMsg.includes('hi') || lowerMsg.includes('hey') || lowerMsg.includes('hello')) {
            responseText = "Hey Ethan! Hope your training recovery is on track today. Let me know if you want to swap out the routine exercises.";
          }

          const coachBubble = document.createElement('div');
          coachBubble.className = 'chat-bubble coach';
          coachBubble.style.cssText = 'align-self: flex-start; max-width: 85%; background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); padding: 0.7rem 0.9rem; border-radius: 8px 8px 8px 0; font-size: 0.85rem; line-height: 1.4;';
          coachBubble.innerHTML = `
            <p style="color: var(--text-white);">${responseText}</p>
            <span style="display: block; font-size: 0.65rem; color: var(--text-dim); margin-top: 0.4rem; text-align: right;">Just Now</span>
          `;
          chatHistory.appendChild(coachBubble);
          chatHistory.scrollTop = chatHistory.scrollHeight;
        }, 1200);
      });
    }

    // --- Book Coach Session Button ---
    const bookSessionBtn = document.getElementById('btn-member-book-session');
    if (bookSessionBtn) {
      bookSessionBtn.addEventListener('click', () => {
        bookSessionBtn.textContent = 'Requested';
        bookSessionBtn.disabled = true;
        bookSessionBtn.style.background = 'rgba(0, 240, 255, 0.05)';
        bookSessionBtn.style.color = 'var(--accent-cyan)';
        bookSessionBtn.style.borderColor = 'rgba(0, 240, 255, 0.15)';
        alert("Session request dispatched to Coach Marcus Vance! You will receive a mobile verification notification shortly.");
      });
    }

    // --- 2. Attendance RFID Simulating Scan (Subview Page) ---
    const checkinBtn = document.getElementById('subview-btn-simulate-checkin');
    const statusText = document.getElementById('subview-checkin-status');
    const pulseIndicator = document.getElementById('subview-keycard-pulse');
    const todayTracker = document.getElementById('subview-tracker-today');
    const summaryStatus = document.getElementById('summary-checkin-status');

    if (checkinBtn) {
      checkinBtn.addEventListener('click', () => {
        checkinBtn.textContent = 'Check-in Active';
        checkinBtn.disabled = true;
        checkinBtn.style.background = 'rgba(0, 255, 102, 0.05)';
        checkinBtn.style.color = '#00ff66';
        checkinBtn.style.borderColor = 'rgba(0, 255, 102, 0.15)';
        
        if (statusText) {
          const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          statusText.textContent = `Checked-in Today at ${nowTime}`;
          statusText.style.color = '#00ff66';
        }
        
        if (pulseIndicator) {
          pulseIndicator.style.background = '#00ff66';
          pulseIndicator.style.boxShadow = '0 0 10px #00ff66';
        }
        
        if (todayTracker) {
          todayTracker.style.background = 'rgba(198, 255, 0, 0.1)';
          todayTracker.style.borderColor = 'var(--accent-volt)';
          todayTracker.style.color = 'var(--accent-volt)';
          todayTracker.title = "Checked in Today";
          // Add checkmark content to today tracker
          todayTracker.innerHTML = '✓';
          todayTracker.style.display = 'flex';
          todayTracker.style.alignItems = 'center';
          todayTracker.style.justifyContent = 'center';
        }

        if (summaryStatus) {
          summaryStatus.textContent = '6 Visits / 7 Days';
        }
        
        // Log to simulated global system logs
        addRecentAdminActivity(`Member Ethan Hunt checked in via RFID Keycard gate scanner`, 'volt');
      });
    }

    // --- 3. Supplement Shop E-Commerce Storefront Engine ---
    
    // Product data model
    const storeProducts = [
      {
        id: "whey-isolate",
        name: "Apex Whey Protein Isolate",
        category: "protein",
        price: 59.99,
        origPrice: 74.99,
        rating: 4.8,
        reviews: 1248,
        tag: "Best Seller",
        tagClass: "best-seller",
        image: "assets/images/whey_protein.png",
        desc: "100% Pure cross-flow microfiltered isolate. Chocolate flavor, 2.2 lbs tub. Yields 25g protein per serving.",
        specs: {
          "Weight": "2.2 lbs",
          "Protein / Serving": "25g",
          "BCAAs / Serving": "5.5g",
          "Flavor": "Double Rich Chocolate",
          "Servings": "30"
        }
      },
      {
        id: "creatine-mono",
        name: "Apex Micronized Creatine",
        category: "strength",
        price: 24.99,
        origPrice: 32.99,
        rating: 4.9,
        reviews: 842,
        tag: "ATP Power",
        tagClass: "best-seller",
        image: "assets/images/creatine.png",
        desc: "Premium 200-mesh micronized creatine monohydrate. 500g bag. Promotes ATP regeneration and cellular hydration.",
        specs: {
          "Weight": "500g",
          "Serving Size": "5g",
          "Purity": "99.9% Monohydrate",
          "Flavor": "Unflavored",
          "Servings": "100"
        }
      },
      {
        id: "pre-ignite",
        name: "Apex Pre-Workout Ignite",
        category: "energy",
        price: 34.99,
        origPrice: 45.99,
        rating: 4.7,
        reviews: 612,
        tag: "High Energy",
        tagClass: "",
        image: "assets/images/pre_workout.png",
        desc: "Sour Apple focus blend. 30 servings. Formulated with L-Citrulline, Beta-Alanine, and caffeine anhydrous.",
        specs: {
          "Weight": "300g",
          "Servings": "30",
          "Caffeine": "250mg",
          "L-Citrulline": "6000mg",
          "Beta-Alanine": "3200mg",
          "Flavor": "Sour Green Apple"
        }
      },
      {
        id: "mass-gainer",
        name: "Apex Hydro Mass Gainer",
        category: "protein",
        price: 69.99,
        origPrice: 89.99,
        rating: 4.6,
        reviews: 340,
        tag: "Mass Builder",
        tagClass: "",
        image: "assets/images/gallery_weights.png",
        desc: "High calorie complex carbohydrate and whey isolate formula. Premium Vanilla flavor, 6 lbs bag.",
        specs: {
          "Weight": "6.0 lbs",
          "Calories": "1250 kcal",
          "Protein": "50g",
          "Carbohydrates": "250g",
          "Flavor": "Vanilla Ice Cream"
        }
      },
      {
        id: "bcaa-recovery",
        name: "Apex BCAA Recovery",
        category: "energy",
        price: 29.99,
        origPrice: 37.99,
        rating: 4.8,
        reviews: 480,
        tag: "Intra-Workout",
        tagClass: "best-seller",
        image: "assets/images/gallery_cardio.png",
        desc: "Optimal 2:1:1 ratio BCAAs for intra-workout muscle preservation and recovery. Blue Raspberry flavor.",
        specs: {
          "Weight": "350g",
          "Servings": "30",
          "BCAA Ratio": "2:1:1 (7g)",
          "Electrolytes": "1000mg",
          "Flavor": "Blue Raspberry"
        }
      },
      {
        id: "multivitamin",
        name: "Apex Sports Multivitamin",
        category: "strength",
        price: 19.99,
        origPrice: 24.99,
        rating: 4.5,
        reviews: 215,
        tag: "Daily Health",
        tagClass: "",
        image: "assets/images/gallery_yoga.png",
        desc: "Clinically formulated daily multivitamin pack optimized for athletes. Contains 90 active tablets.",
        specs: {
          "Tablets": "90 Tablets",
          "Supply": "30 Days",
          "Target": "Athletes",
          "Ingredients": "25+ active vitamins"
        }
      }
    ];

    let storeCart = [];
    let promoCodeApplied = false;
    let promoDiscountPercent = 0;
    let currentCategoryFilter = "all";
    let productQuantities = {}; // key: productId, val: qty

    // Initialize product quantity state
    storeProducts.forEach(p => {
      productQuantities[p.id] = 1;
    });

    // Main render function
    function renderStoreProducts() {
      console.log("renderStoreProducts called");
      const grid = document.getElementById('supp-products-grid');
      if (!grid) {
        console.warn("supp-products-grid element not found in DOM");
        return;
      }

      const searchInput = document.getElementById('store-search-input');
      const sortSelect = document.getElementById('store-sort-select');
      const searchVal = searchInput ? searchInput.value.toLowerCase().trim() : "";
      const sortVal = sortSelect ? sortSelect.value : "popular";

      // 1. Filter
      let filtered = storeProducts.filter(p => {
        const matchesCategory = (currentCategoryFilter === "all" || p.category === currentCategoryFilter);
        const matchesSearch = p.name.toLowerCase().includes(searchVal) || p.desc.toLowerCase().includes(searchVal);
        return matchesCategory && matchesSearch;
      });

      // 2. Sort
      if (sortVal === "low-high") {
        filtered.sort((a, b) => a.price - b.price);
      } else if (sortVal === "high-low") {
        filtered.sort((a, b) => b.price - a.price);
      } else if (sortVal === "rating") {
        filtered.sort((a, b) => b.rating - a.rating);
      } else {
        // default: popularity (reviews count)
        filtered.sort((a, b) => b.reviews - a.reviews);
      }

      // 3. Render HTML
      grid.innerHTML = "";
      if (filtered.length === 0) {
        grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 4rem 2rem; color: var(--text-dim);">No matching products found. Try a different query or category filter!</div>`;
        return;
      }

      filtered.forEach(p => {
        const currentQty = productQuantities[p.id] || 1;
        const discountPercentage = Math.round(((p.origPrice - p.price) / p.origPrice) * 100);
        const tagHTML = p.tag ? `<span class="product-card-tag ${p.tagClass}">${p.tag}</span>` : '';
        
        const card = document.createElement('div');
        card.className = 'product-card';
        card.setAttribute('data-id', p.id);
        card.innerHTML = `
          ${tagHTML}
          <div class="product-img-container">
            <img src="${p.image}" alt="${p.name}" onerror="this.src='assets/images/gallery_weights.png'">
          </div>
          <span class="product-category">${p.category}</span>
          <h4 class="product-title">${p.name}</h4>
          <div class="product-rating-row">
            <span class="rating-stars">★ ★ ★ ★ ★</span>
            <span class="reviews-count">${p.rating} (${p.reviews})</span>
          </div>
          <p class="product-desc">${p.desc}</p>
          <div class="product-specs-badges">
            ${Object.entries(p.specs).slice(0, 2).map(([k, v]) => `<span class="spec-badge">${k}: ${v}</span>`).join('')}
          </div>
          <div class="product-pricing">
            <span class="current-price">$${p.price}</span>
            <span class="original-price">$${p.origPrice}</span>
            <span class="discount-pct">${discountPercentage}% OFF</span>
          </div>
          <div class="product-card-actions">
            <div class="qty-selector" onclick="event.stopPropagation()">
              <button class="qty-btn minus" data-id="${p.id}">&minus;</button>
              <span class="qty-val" id="qty-val-${p.id}">${currentQty}</span>
              <button class="qty-btn plus" data-id="${p.id}">&plus;</button>
            </div>
            <button class="outline-btn add-cart-btn" data-id="${p.id}" onclick="event.stopPropagation()">Add</button>
            <button class="glow-btn buy-now-btn" data-id="${p.id}" onclick="event.stopPropagation()">Buy Now</button>
          </div>
        `;

        // Card click (Detail view)
        card.addEventListener('click', () => {
          showProductDetailModal(p);
        });

        grid.appendChild(card);
      });

      bindStoreActionButtons();
    }

    // Bind event listeners within product cards
    function bindStoreActionButtons() {
      // Quantity selector buttons
      document.querySelectorAll('.product-card .qty-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = btn.getAttribute('data-id');
          let qty = productQuantities[id] || 1;
          if (btn.classList.contains('minus')) {
            if (qty > 1) qty--;
          } else {
            qty++;
          }
          productQuantities[id] = qty;
          const qtyText = document.getElementById(`qty-val-${id}`);
          if (qtyText) qtyText.textContent = qty;
        });
      });

      // Add to Cart buttons
      document.querySelectorAll('.add-cart-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          const qty = productQuantities[id] || 1;
          addToCart(id, qty);
          
          btn.textContent = "Added ✓";
          btn.style.color = "#00ff66";
          btn.style.borderColor = "rgba(0, 255, 102, 0.3)";
          
          setTimeout(() => {
            btn.textContent = "Add";
            btn.style.color = "var(--accent-cyan)";
            btn.style.borderColor = "var(--accent-cyan)";
          }, 1200);
        });
      });

      // Buy Now direct actions
      document.querySelectorAll('.buy-now-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          const qty = productQuantities[id] || 1;
          
          // Clear cart, add this item, and open cart for immediate checkout
          storeCart = [];
          addToCart(id, qty);
          openCartDrawer();
        });
      });
    }

    // Detail modal logic
    function showProductDetailModal(p) {
      const modal = document.getElementById('product-detail-modal');
      const content = document.getElementById('detail-modal-content');
      if (!modal || !content) return;

      const discountPercentage = Math.round(((p.origPrice - p.price) / p.origPrice) * 100);
      
      content.innerHTML = `
        <div class="modal-img-column">
          <img src="${p.image}" alt="${p.name}" onerror="this.src='assets/images/gallery_weights.png'">
        </div>
        <div class="modal-info-column">
          <span class="product-category" style="font-size: 0.75rem;">${p.category}</span>
          <h2>${p.name}</h2>
          <div class="product-rating-row" style="margin-top: 0.3rem; margin-bottom: 0.8rem;">
            <span class="rating-stars" style="font-size: 0.9rem;">★ ★ ★ ★ ★</span>
            <span class="reviews-count" style="font-size: 0.8rem;">${p.rating} (${p.reviews} verified reviews)</span>
          </div>
          <p style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.5; margin-bottom: 1rem;">${p.desc}</p>
          
          <h5 style="color: var(--text-white); font-size: 0.8rem; text-transform: uppercase; margin-bottom: 0.4rem; letter-spacing: 0.05em;">Nutrition & Technical Facts</h5>
          <div class="specs-list">
            ${Object.entries(p.specs).map(([k, v]) => `
              <div class="spec-item-row">
                <span class="spec-label">${k}</span>
                <span class="spec-value">${v}</span>
              </div>
            `).join('')}
          </div>

          <div class="product-pricing" style="margin-top: 1rem; border-top: 1px solid rgba(255,255,255,0.03); padding-top: 1rem;">
            <span class="current-price" style="font-size: 1.5rem;">$${p.price}</span>
            <span class="original-price" style="font-size: 1rem;">$${p.origPrice}</span>
            <span class="discount-pct" style="font-size: 0.85rem;">${discountPercentage}% OFF</span>
          </div>

          <div class="modal-action-row">
            <button class="outline-btn modal-add-btn" style="flex-grow: 1; padding: 0.8rem; font-size: 0.8rem; text-transform: uppercase; border-color: var(--accent-cyan); color: var(--accent-cyan);">Add to Cart</button>
            <button class="glow-btn modal-buy-btn" style="flex-grow: 1; padding: 0.8rem; font-size: 0.8rem; text-transform: uppercase;">Direct Buy Now</button>
          </div>
        </div>
      `;

      // Modal add button
      content.querySelector('.modal-add-btn').addEventListener('click', () => {
        addToCart(p.id, 1);
        const btn = content.querySelector('.modal-add-btn');
        btn.textContent = "Added to Cart ✓";
        btn.style.color = "#00ff66";
        btn.style.borderColor = "rgba(0, 255, 102, 0.3)";
        setTimeout(() => {
          modal.style.display = "none";
        }, 800);
      });

      // Modal buy button
      content.querySelector('.modal-buy-btn').addEventListener('click', () => {
        storeCart = [];
        addToCart(p.id, 1);
        modal.style.display = "none";
        openCartDrawer();
      });

      modal.style.display = "flex";
    }

    // Close detail modal
    const closeDetailBtn = document.getElementById('detail-modal-close');
    const detailOverlay = document.getElementById('product-detail-modal');
    if (closeDetailBtn) {
      closeDetailBtn.addEventListener('click', () => {
        detailOverlay.style.display = "none";
      });
    }
    if (detailOverlay) {
      detailOverlay.addEventListener('click', (e) => {
        if (e.target === detailOverlay) {
          detailOverlay.style.display = "none";
        }
      });
    }

    // Cart list functions
    function addToCart(productId, qty) {
      const product = storeProducts.find(p => p.id === productId);
      if (!product) return;

      const existing = storeCart.find(item => item.product.id === productId);
      if (existing) {
        existing.qty += qty;
      } else {
        storeCart.push({ product, qty });
      }

      updateCartUI();
    }

    function removeFromCart(productId) {
      storeCart = storeCart.filter(item => item.product.id !== productId);
      updateCartUI();
    }

    function changeCartItemQty(productId, delta) {
      const existing = storeCart.find(item => item.product.id === productId);
      if (existing) {
        existing.qty += delta;
        if (existing.qty <= 0) {
          removeFromCart(productId);
        } else {
          updateCartUI();
        }
      }
    }

    function updateCartUI() {
      // 1. Badge count
      const badge = document.getElementById('cart-item-count');
      const totalQty = storeCart.reduce((sum, item) => sum + item.qty, 0);
      if (badge) badge.textContent = totalQty;

      // 2. Drawer Items List
      const cartList = document.getElementById('cart-items-list');
      if (!cartList) return;

      cartList.innerHTML = "";
      if (storeCart.length === 0) {
        cartList.innerHTML = `
          <div class="cart-empty-state">
            <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <p>Your shopping cart is currently empty.</p>
          </div>
        `;
      } else {
        storeCart.forEach(item => {
          const p = item.product;
          const cartItem = document.createElement('div');
          cartItem.className = 'cart-item';
          cartItem.innerHTML = `
            <div class="cart-item-img">
              <img src="${p.image}" alt="${p.name}" onerror="this.src='assets/images/gallery_weights.png'">
            </div>
            <div class="cart-item-info">
              <h5 class="cart-item-title">${p.name}</h5>
              <div class="cart-item-price">$${p.price} each</div>
            </div>
            <div class="cart-item-actions">
              <div class="qty-selector">
                <button class="qty-btn cart-minus" data-id="${p.id}">&minus;</button>
                <span class="qty-val">${item.qty}</span>
                <button class="qty-btn cart-plus" data-id="${p.id}">&plus;</button>
              </div>
              <button class="cart-item-delete" data-id="${p.id}">Remove</button>
            </div>
          `;

          // Bind qty alterations in cart
          cartItem.querySelector('.cart-minus').addEventListener('click', () => changeCartItemQty(p.id, -1));
          cartItem.querySelector('.cart-plus').addEventListener('click', () => changeCartItemQty(p.id, 1));
          cartItem.querySelector('.cart-item-delete').addEventListener('click', () => removeFromCart(p.id));

          cartList.appendChild(cartItem);
        });
      }

      // 3. Price breakdown
      recalculateCartPricing();
    }

    function recalculateCartPricing() {
      const subtotal = storeCart.reduce((sum, item) => sum + (item.product.price * item.qty), 0);
      const memberDiscount = subtotal * 0.10; // Automatic 10% Member discount
      
      let promoDiscount = 0;
      if (promoCodeApplied) {
        promoDiscount = subtotal * promoDiscountPercent;
      }

      const total = Math.max(0, subtotal - memberDiscount - promoDiscount);

      // DOM Updates
      document.getElementById('cart-subtotal').textContent = `$${subtotal.toFixed(2)}`;
      document.getElementById('cart-member-discount').textContent = `-$${memberDiscount.toFixed(2)}`;
      
      const promoRow = document.getElementById('cart-promo-row');
      const promoDiscountLabel = document.getElementById('cart-promo-discount');
      if (promoCodeApplied) {
        promoRow.style.display = "flex";
        promoDiscountLabel.textContent = `-$${promoDiscount.toFixed(2)}`;
      } else {
        promoRow.style.display = "none";
      }

      document.getElementById('cart-total-price').textContent = `$${total.toFixed(2)}`;
      
      // Checkout button enable/disable
      const checkoutBtn = document.getElementById('cart-checkout-btn');
      if (checkoutBtn) {
        checkoutBtn.disabled = (storeCart.length === 0);
      }
    }

    // Toggle Cart Drawer
    function openCartDrawer() {
      const drawer = document.getElementById('cart-drawer-overlay');
      if (drawer) drawer.style.display = "block";
    }

    function closeCartDrawer() {
      const drawer = document.getElementById('cart-drawer-overlay');
      if (drawer) drawer.style.display = "none";
    }

    const cartTrigger = document.getElementById('store-cart-trigger');
    const closeCartBtn = document.getElementById('cart-drawer-close-btn');
    const drawerOverlay = document.getElementById('cart-drawer-overlay');

    if (cartTrigger) {
      cartTrigger.addEventListener('click', openCartDrawer);
    }
    if (closeCartBtn) {
      closeCartBtn.addEventListener('click', closeCartDrawer);
    }
    if (drawerOverlay) {
      drawerOverlay.addEventListener('click', (e) => {
        if (e.target === drawerOverlay) {
          closeCartDrawer();
        }
      });
    }

    // Category chips filters
    document.querySelectorAll('#store-category-filters .filter-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('#store-category-filters .filter-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        
        currentCategoryFilter = chip.getAttribute('data-category');
        renderStoreProducts();
      });
    });

    // Live search input handler
    const searchInput = document.getElementById('store-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', renderStoreProducts);
    }

    // Sort selection handler
    const sortSelect = document.getElementById('store-sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', renderStoreProducts);
    }

    // Promo code handler
    const applyPromoBtn = document.getElementById('apply-promo-btn');
    if (applyPromoBtn) {
      applyPromoBtn.addEventListener('click', () => {
        const promoInputEl = document.getElementById('promo-code-input');
        const msgEl = document.getElementById('promo-status-msg');
        if (!promoInputEl || !msgEl) return;
        const input = promoInputEl.value.toUpperCase().trim();
        const msg = msgEl;
        
        if (input === "APEX10") {
          promoCodeApplied = true;
          promoDiscountPercent = 0.10; // Extra 10% Off
          msg.textContent = "Promo applied: Additional 10% Discount applied! ✓";
          msg.style.color = "var(--accent-volt)";
          recalculateCartPricing();
        } else if (input === "") {
          msg.textContent = "";
        } else {
          msg.textContent = "Invalid promo code. Try 'APEX10'.";
          msg.style.color = "#ff3e6c";
        }
      });
    }

    // Cart Checkout placing order
    const cartCheckoutBtn = document.getElementById('cart-checkout-btn');
    if (cartCheckoutBtn) {
      cartCheckoutBtn.addEventListener('click', () => {
        if (storeCart.length === 0) return;

        // Generate Transaction Invoice row
        const txId = 'TX-' + Math.floor(1000 + Math.random() * 9000);
        const subtotal = storeCart.reduce((sum, item) => sum + (item.product.price * item.qty), 0);
        const memberDiscount = subtotal * 0.10;
        const promoDiscount = promoCodeApplied ? subtotal * promoDiscountPercent : 0;
        const total = Math.max(0, subtotal - memberDiscount - promoDiscount);

        const newRow = document.createElement('tr');
        newRow.innerHTML = `
          <td style="font-family: monospace; font-weight: 700; color: var(--accent-cyan); font-size: 0.85rem;">${txId}</td>
          <td>Supp Store Purchase</td>
          <td><strong>$${total.toFixed(2)}</strong></td>
          <td><span class="status-badge paid">paid</span></td>
          <td>Today</td>
        `;

        if (memberPaymentsBody) {
          memberPaymentsBody.insertBefore(newRow, memberPaymentsBody.firstChild);
          const emptyRow = memberPaymentsBody.querySelector('.empty-pay-row');
          if (emptyRow) emptyRow.remove();
        }

        // Add System Logs
        const orderSummaryText = storeCart.map(item => `${item.qty}x ${item.product.name}`).join(', ');
        addRecentAdminActivity(`Supplements Purchase: Ethan Hunt ordered [${orderSummaryText}] ($${total.toFixed(2)})`, 'cyan');

        // Show Success Receipt modal
        const successModal = document.getElementById('order-success-modal');
        const successSummaryDiv = document.getElementById('success-order-summary');
        const successInvoiceLabel = document.getElementById('success-invoice-id');

        if (successInvoiceLabel) successInvoiceLabel.textContent = txId;
        if (successSummaryDiv) {
          successSummaryDiv.innerHTML = `
            ${storeCart.map(item => `
              <div class="success-summary-line">
                <span>${item.qty}x ${item.product.name}</span>
                <span>$${(item.product.price * item.qty).toFixed(2)}</span>
              </div>
            `).join('')}
            <div class="success-summary-line" style="border-top: 1px solid rgba(255,255,255,0.05); margin-top: 0.5rem; padding-top: 0.5rem; color: var(--accent-volt);">
              <span>Billed Total (Charged to Account)</span>
              <span>$${total.toFixed(2)}</span>
            </div>
          `;
        }

        if (successModal) successModal.style.display = "flex";
        
        // Reset cart drawer
        storeCart = [];
        promoCodeApplied = false;
        document.getElementById('promo-code-input').value = "";
        document.getElementById('promo-status-msg').textContent = "";
        updateCartUI();
        closeCartDrawer();
      });
    }

    // Order success modal close button
    const successCloseBtn = document.getElementById('success-modal-close-btn');
    if (successCloseBtn) {
      successCloseBtn.addEventListener('click', () => {
        const successModal = document.getElementById('order-success-modal');
        if (successModal) successModal.style.display = "none";
      });
    }

    // Initial render of products
    renderStoreProducts();

    // Re-render products when supplements nav link is clicked to ensure view is populated
    const suppsNavLink = document.getElementById('nav-db-supplements');
    if (suppsNavLink) {
      suppsNavLink.addEventListener('click', () => {
        console.log("Supplements tab clicked, re-rendering products...");
        renderStoreProducts();
      });
    }

    // CTA shortcut button redirect from Member Homepage
    const shopSuppsBtn = document.getElementById('home-shop-supps-btn');
    if (shopSuppsBtn) {
      shopSuppsBtn.addEventListener('click', () => {
        if (suppsNavLink) {
          suppsNavLink.click();
        }
      });
    }

    // --- 4. Profile View Swapping & Editing ---
    const sidebarProfile = document.querySelector('.sidebar-profile');
    const profileForm = document.getElementById('member-profile-edit-form');
    const profileCancelBtn = document.getElementById('btn-profile-edit-cancel');

    function updateProfileDisplay(name, goal) {
      const profileFullname = document.getElementById('profile-display-fullname');
      const profileAvatarBadge = document.getElementById('profile-edit-avatar-badge');
      if (profileFullname) profileFullname.textContent = name;
      
      if (profileAvatarBadge) {
        const parts = name.split(' ');
        const initials = parts.map(p => p[0]).join('').toUpperCase().substring(0, 2);
        profileAvatarBadge.textContent = initials;
      }
    }

    function prefillProfileForm() {
      const editNameInput = document.getElementById('profile-edit-name');
      const editEmailInput = document.getElementById('profile-edit-email');
      const editPhoneInput = document.getElementById('profile-edit-phone');
      const editEmergencyName = document.getElementById('profile-edit-emergency-name');
      const editEmergencyPhone = document.getElementById('profile-edit-emergency-phone');
      const editGoalSelect = document.getElementById('profile-edit-goal');
      
      if (editNameInput) editNameInput.value = currentUser.name;
      if (editEmailInput) editEmailInput.value = currentUser.email || 'member@apex.com';
      
      const savedProfile = JSON.parse(localStorage.getItem(`apex_profile_${currentUser.email}`)) || {};
      if (editPhoneInput) editPhoneInput.value = savedProfile.phone || '+1 (555) 902-1829';
      if (editEmergencyName) editEmergencyName.value = savedProfile.emergName || 'Luther Stickell';
      if (editEmergencyPhone) editEmergencyPhone.value = savedProfile.emergPhone || '+1 (555) 304-8912';
      if (editGoalSelect) editGoalSelect.value = savedProfile.goal || 'strength';
      
      updateProfileDisplay(currentUser.name, savedProfile.goal || 'strength');
    }

    if (sidebarProfile) {
      sidebarProfile.addEventListener('click', () => {
        if (currentUser.role === 'member') {
          // Deactivate active states on navigation menu links
          sidebarNavLinks.forEach(link => link.classList.remove('active'));
          
          // Display the profile subview
          const subviews = document.querySelectorAll('.member-sub-view');
          subviews.forEach(view => {
            if (view.id === 'member-subview-profile') {
              view.style.display = 'block';
              prefillProfileForm();
            } else {
              view.style.display = 'none';
            }
          });
        } else {
          alert(`Profile Coordinates:\nName: ${currentUser.name}\nRole: ${currentUser.role.toUpperCase()}\nAccess Profile: Active`);
        }
      });
    }

    if (profileForm) {
      profileForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const newName = document.getElementById('profile-edit-name').value.trim();
        const newEmail = document.getElementById('profile-edit-email').value.trim();
        const newPhone = document.getElementById('profile-edit-phone').value.trim();
        const newGoal = document.getElementById('profile-edit-goal').value;
        const newEmergName = document.getElementById('profile-edit-emergency-name').value.trim();
        const newEmergPhone = document.getElementById('profile-edit-emergency-phone').value.trim();
        
        if (!newName || !newEmail) return;
        
        // Save details to LocalStorage
        const profileData = {
          phone: newPhone,
          goal: newGoal,
          emergName: newEmergName,
          emergPhone: newEmergPhone
        };
        localStorage.setItem(`apex_profile_${currentUser.email}`, JSON.stringify(profileData));
        
        // Update session identity
        currentUser.name = newName;
        currentUser.email = newEmail;
        localStorage.setItem('apex_session_user', JSON.stringify(currentUser));
        
        // Update global DOM labels
        if (userNameText) userNameText.textContent = newName;
        if (welcomeText) welcomeText.textContent = newName.split(' ')[0];
        if (userInitialsBox) {
          const parts = newName.split(' ');
          userInitialsBox.textContent = parts.map(p => p[0]).join('').toUpperCase().substring(0, 2);
        }
        
        // Update keycard name
        const keycardName = document.getElementById('keycard-member-name');
        if (keycardName) keycardName.textContent = newName;
        
        updateProfileDisplay(newName, newGoal);
        
        // Add log activity
        addRecentAdminActivity(`Member ${newName} updated their security contact profile details`, 'volt');
        
        alert("Personal profile changes saved successfully!");
        
        // Return to Home Dashboard subview by clicking Sidebar Home
        const homeNav = document.getElementById('nav-db-home');
        if (homeNav) homeNav.click();
      });
    }

    if (profileCancelBtn) {
      profileCancelBtn.addEventListener('click', () => {
        const homeNav = document.getElementById('nav-db-home');
        if (homeNav) homeNav.click();
      });
    }
  }

  // ==========================================
  // 6. ATTENDANCE MANAGEMENT MODULE
  // ==========================================
  function initAttendance() {
    const defaultAttendanceLogs = [
      { memberName: "Ethan Hunt", memberId: "8092-PRO", date: "2026-07-05", checkIn: "08:30 AM", checkOut: "10:15 AM", duration: "1h 45m", status: "Completed" },
      { memberName: "Luther Stickell", memberId: "5021-REG", date: "2026-07-06", checkIn: "07:15 AM", checkOut: "08:45 AM", duration: "1h 30m", status: "Completed" },
      { memberName: "Benji Dunn", memberId: "4032-HIIT", date: "2026-07-06", checkIn: "10:00 AM", checkOut: "11:30 AM", duration: "1h 30m", status: "Completed" },
      { memberName: "Ilsa Faust", memberId: "1092-PRO", date: "2026-07-06", checkIn: "11:15 AM", checkOut: "", duration: "", status: "Active" },
      { memberName: "Ethan Hunt", memberId: "8092-PRO", date: "2026-07-03", checkIn: "09:00 AM", checkOut: "11:00 AM", duration: "2h 00m", status: "Completed" },
      { memberName: "Ethan Hunt", memberId: "8092-PRO", date: "2026-07-02", checkIn: "08:00 AM", checkOut: "09:30 AM", duration: "1h 30m", status: "Completed" },
      { memberName: "Ethan Hunt", memberId: "8092-PRO", date: "2026-07-01", checkIn: "10:15 AM", checkOut: "12:15 PM", duration: "2h 00m", status: "Completed" },
    ];

    if (!localStorage.getItem('apex_attendance_logs')) {
      localStorage.setItem('apex_attendance_logs', JSON.stringify(defaultAttendanceLogs));
    }

    if (currentUser.role === 'admin') {
      renderAdminAttendance();
      bindAdminAttendanceEvents();
    } else if (currentUser.role === 'member') {
      renderMemberAttendance();
      bindMemberAttendanceEvents();
    }

    updateDashboardAttendanceCount();
  }

  function getAttendanceLogs() {
    return JSON.parse(localStorage.getItem('apex_attendance_logs')) || [];
  }

  function saveAttendanceLogs(logs) {
    localStorage.setItem('apex_attendance_logs', JSON.stringify(logs));
  }

  function updateDashboardAttendanceCount() {
    const logs = getAttendanceLogs();
    const todayStr = "2026-07-06";
    const todayCheckedInCount = logs.filter(log => log.date === todayStr).length;
    
    // Update main dashboard metrics card
    const statAttendanceEl = document.getElementById('stat-attendance');
    if (statAttendanceEl) {
      // Base offset to make gym feel busy
      statAttendanceEl.textContent = (328 + todayCheckedInCount).toString();
    }
  }

  // --- Member Attendance View ---
  function renderMemberAttendance() {
    const logs = getAttendanceLogs();
    const myLogs = logs.filter(log => log.memberName === currentUser.name);
    
    // Calculate streak
    const streakText = `${myLogs.length * 6} Days`;
    const streakEl = document.getElementById('member-att-streak');
    if (streakEl) {
      streakEl.textContent = streakText + " 🔥";
    }
    const homeStreakEl = document.getElementById('member-home-att-streak');
    if (homeStreakEl) {
      homeStreakEl.textContent = streakText + " 🔥";
    }

    // Calculate percentage rate
    // Target 8 visits in elapsed month days. Capped between 0 and 100%
    const visitsCount = myLogs.length;
    const targetVisits = 8;
    const rate = Math.min(100, Math.round((visitsCount / targetVisits) * 100));
    const pctEl = document.getElementById('member-attendance-pct');
    if (pctEl) {
      pctEl.textContent = `${rate}%`;
    }
    const homePctEl = document.getElementById('member-home-att-pct');
    if (homePctEl) {
      homePctEl.textContent = `${rate}%`;
    }

    // Renders training consistency calendar for July 2026 (31 days)
    const calendarGrid = document.getElementById('member-attendance-calendar-grid');
    if (calendarGrid) {
      calendarGrid.innerHTML = '';
      
      // Weekdays headings
      const daysOfWeek = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
      daysOfWeek.forEach(day => {
        const h = document.createElement('span');
        h.textContent = day;
        h.style.color = 'var(--text-muted)';
        h.style.fontWeight = '700';
        h.style.paddingBottom = '0.3rem';
        calendarGrid.appendChild(h);
      });

      // Render 31 days
      for (let d = 1; d <= 31; d++) {
        const dateStr = `2026-07-${d.toString().padStart(2, '0')}`;
        const hasSession = myLogs.some(log => log.date === dateStr);
        const daySpan = document.createElement('span');
        daySpan.textContent = d.toString();
        daySpan.style.width = '24px';
        daySpan.style.height = '24px';
        daySpan.style.borderRadius = '50%';
        daySpan.style.display = 'flex';
        daySpan.style.alignItems = 'center';
        daySpan.style.justifyContent = 'center';
        daySpan.style.margin = 'auto';

        if (hasSession) {
          daySpan.style.background = 'rgba(198, 255, 0, 0.15)';
          daySpan.style.border = '1px solid var(--accent-volt)';
          daySpan.style.color = 'var(--accent-volt)';
          daySpan.style.fontWeight = '700';
          daySpan.title = "Checked in session completed";
        } else {
          daySpan.style.background = 'rgba(255,255,255,0.01)';
          daySpan.style.border = '1px solid var(--border-color)';
          daySpan.style.color = 'var(--text-dim)';
        }
        calendarGrid.appendChild(daySpan);
      }
    }

    // Populate recent sessions list
    const sessionsList = document.getElementById('member-attendance-sessions-list');
    if (sessionsList) {
      sessionsList.innerHTML = '';
      const completedSessions = myLogs.filter(log => log.status === 'Completed');
      if (completedSessions.length === 0) {
        sessionsList.innerHTML = '<span style="color: var(--text-dim); font-size: 0.75rem;">No sessions logged.</span>';
      } else {
        completedSessions.slice().reverse().forEach(log => {
          const item = document.createElement('div');
          item.style.cssText = "background: rgba(255,255,255,0.01); border: 1px solid var(--border-color); padding: 0.4rem 0.6rem; border-radius: 4px; display: flex; justify-content: space-between; font-size: 0.72rem;";
          item.innerHTML = `<span style="color: var(--text-muted);">${log.date.substring(5)}</span><strong>${log.duration} Session</strong>`;
          sessionsList.appendChild(item);
        });
      }
    }

    // Update scanner buttons based on check-in state today (2026-07-06)
    const todayStr = "2026-07-06";
    const todayLog = myLogs.find(log => log.date === todayStr);
    
    const checkinBtn = document.getElementById('btn-face-checkin');
    const checkoutBtn = document.getElementById('btn-face-checkout');
    const statusText = document.getElementById('member-attendance-status');
    const overlayText = document.getElementById('camera-terminal-overlay');
    
    if (todayLog) {
      if (todayLog.status === 'Active') {
        if (checkinBtn) checkinBtn.disabled = true;
        if (checkoutBtn) checkoutBtn.disabled = false;
        if (statusText) {
          statusText.textContent = `Checked-In (Active since ${todayLog.checkIn})`;
          statusText.style.color = 'var(--accent-volt)';
        }
        if (overlayText) overlayText.textContent = "TERMINAL: ACTIVE SESSION";
      } else {
        if (checkinBtn) checkinBtn.disabled = true;
        if (checkoutBtn) checkoutBtn.disabled = true;
        if (statusText) {
          statusText.textContent = `Completed Today (${todayLog.duration} session)`;
          statusText.style.color = 'var(--accent-cyan)';
        }
        if (overlayText) overlayText.textContent = "TERMINAL: LOGGED OUT";
      }
    } else {
      if (checkinBtn) checkinBtn.disabled = false;
      if (checkoutBtn) checkoutBtn.disabled = true;
      if (statusText) {
        statusText.textContent = "Not Checked-In Today";
        statusText.style.color = '#ff9f00';
      }
      if (overlayText) overlayText.textContent = "TERMINAL: STANDBY";
    }
  }

  function bindMemberAttendanceEvents() {
    const checkinBtn = document.getElementById('btn-face-checkin');
    const checkoutBtn = document.getElementById('btn-face-checkout');
    const overlayText = document.getElementById('camera-terminal-overlay');
    
    if (checkinBtn) {
      checkinBtn.addEventListener('click', () => {
        if (checkinBtn.disabled) return;
        checkinBtn.disabled = true;
        
        if (overlayText) overlayText.textContent = "SCANNING FACE...";
        
        setTimeout(() => {
          const logs = getAttendanceLogs();
          const todayStr = "2026-07-06";
          
          // Add new active checkin log
          const newLog = {
            memberName: currentUser.name,
            memberId: "8092-PRO",
            date: todayStr,
            checkIn: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            checkOut: "",
            duration: "",
            status: "Active"
          };
          logs.push(newLog);
          saveAttendanceLogs(logs);
          
          // Activity timeline log
          addRecentAdminActivity(`${currentUser.name} checked in via Smart Face recognition terminal`, 'cyan');
          
          renderMemberAttendance();
          updateDashboardAttendanceCount();
          alert("Face recognized successfully! Check-in session started.");
        }, 1800);
      });
    }

    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', () => {
        if (checkoutBtn.disabled) return;
        checkoutBtn.disabled = true;
        
        if (overlayText) overlayText.textContent = "LOGGING OUT...";
        
        setTimeout(() => {
          const logs = getAttendanceLogs();
          const todayStr = "2026-07-06";
          const myTodayLog = logs.find(log => log.memberName === currentUser.name && log.date === todayStr && log.status === 'Active');
          
          if (myTodayLog) {
            const timeOutStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            myTodayLog.checkOut = timeOutStr;
            myTodayLog.status = "Completed";
            myTodayLog.duration = "1h 45m";
            saveAttendanceLogs(logs);
            
            // Activity log
            addRecentAdminActivity(`${currentUser.name} checked out via Smart Face recognition terminal`, 'volt');
          }
          
          renderMemberAttendance();
          updateDashboardAttendanceCount();
          alert("Face recognized successfully! Check-out session finalized.");
        }, 1800);
      });
    }
  }

  // --- Admin Attendance View ---
  function renderAdminAttendance() {
    const logs = getAttendanceLogs();
    const todayStr = "2026-07-06";
    const todayLogs = logs.filter(log => log.date === todayStr);
    
    const totalToday = todayLogs.length;
    const activeToday = todayLogs.filter(log => log.status === 'Active').length;
    
    // Update admin stats elements
    const statTotal = document.getElementById('admin-att-stat-total');
    const statActive = document.getElementById('admin-att-stat-active');
    
    if (statTotal) statTotal.textContent = totalToday.toString();
    if (statActive) statActive.textContent = activeToday.toString();
    
    // Populate daily report table
    const dailyBody = document.getElementById('admin-daily-att-body');
    if (dailyBody) {
      dailyBody.innerHTML = '';
      if (todayLogs.length === 0) {
        dailyBody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-dim); padding: 1rem;">No check-ins today.</td></tr>';
      } else {
        todayLogs.forEach(log => {
          const row = document.createElement('tr');
          const isCheckin = log.status === 'Active';
          const durationStr = isCheckin ? '--' : log.duration;
          const checkoutStr = isCheckin ? '<button type="button" class="outline-btn" style="padding: 0.2rem 0.5rem; font-size: 0.7rem;" onclick="adminMockCheckout(\'' + log.memberName + '\')">Checkout</button>' : log.checkOut;
          const statusBadgeClass = isCheckin ? 'pending' : 'paid';
          const statusLabel = isCheckin ? 'ACTIVE' : 'COMPLETED';
          
          row.innerHTML = `
            <td><strong>${log.memberName}</strong></td>
            <td><code style="color: var(--accent-cyan); font-size: 0.75rem;">#${log.memberId}</code></td>
            <td>${log.checkIn}</td>
            <td>${checkoutStr}</td>
            <td>${durationStr}</td>
            <td><span class="status-badge ${statusBadgeClass}">${statusLabel}</span></td>
          `;
          dailyBody.appendChild(row);
        });
      }
    }

    // Populate monthly report table
    const monthlyBody = document.getElementById('admin-monthly-att-body');
    if (monthlyBody) {
      monthlyBody.innerHTML = '';
      // Group by member name
      const memberGroup = {};
      logs.forEach(log => {
        if (!memberGroup[log.memberName]) {
          memberGroup[log.memberName] = {
            name: log.memberName,
            id: log.memberId,
            visits: 0,
            stayAvg: "1h 40m",
            frequency: "3x / week",
            status: log.status
          };
        }
        memberGroup[log.memberName].visits += 1;
        if (log.status === 'Active') {
          memberGroup[log.memberName].status = 'Active';
        }
      });

      Object.values(memberGroup).forEach(group => {
        const row = document.createElement('tr');
        const rate = Math.min(100, Math.round((group.visits / 12) * 100)) + '%';
        const badgeClass = group.status === 'Active' ? 'pending' : 'paid';
        const label = group.status === 'Active' ? 'ON FLOOR' : 'RESTING';
        
        row.innerHTML = `
          <td><strong>${group.name}</strong></td>
          <td>${group.visits} Visited</td>
          <td>${group.stayAvg}</td>
          <td>${group.frequency}</td>
          <td><strong style="color: var(--accent-volt);">${rate}</strong></td>
          <td><span class="status-badge ${badgeClass}">${label}</span></td>
        `;
        monthlyBody.appendChild(row);
      });
    }
  }

  // Handle global helper function for checkout from the admin table row
  window.adminMockCheckout = function(memberName) {
    const logs = getAttendanceLogs();
    const todayStr = "2026-07-06";
    const log = logs.find(l => l.memberName === memberName && l.date === todayStr && l.status === 'Active');
    
    if (log) {
      log.checkOut = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      log.status = "Completed";
      log.duration = "1h 45m";
      saveAttendanceLogs(logs);
      addRecentAdminActivity(`Admin manually checked out ${memberName}`, 'volt');
      
      renderAdminAttendance();
      updateDashboardAttendanceCount();
      alert(`Member ${memberName} checked out successfully.`);
    }
  };

  function bindAdminAttendanceEvents() {
    const btnDaily = document.getElementById('btn-report-daily');
    const btnMonthly = document.getElementById('btn-report-monthly');
    const title = document.getElementById('attendance-report-title');
    const dailyContainer = document.getElementById('report-daily-container');
    const monthlyContainer = document.getElementById('report-monthly-container');

    if (btnDaily && btnMonthly && title && dailyContainer && monthlyContainer) {
      btnDaily.addEventListener('click', () => {
        btnDaily.classList.add('active');
        btnMonthly.classList.remove('active');
        title.textContent = "Daily Attendance Report";
        dailyContainer.style.display = 'block';
        monthlyContainer.style.display = 'none';
      });

      btnMonthly.addEventListener('click', () => {
        btnDaily.classList.remove('active');
        btnMonthly.classList.add('active');
        title.textContent = "Monthly Attendance Summary";
        dailyContainer.style.display = 'none';
        monthlyContainer.style.display = 'block';
      });
    }

    // Mock terminal submission
    const simForm = document.getElementById('admin-attendance-sim-form');
    if (simForm) {
      simForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const mName = document.getElementById('sim-member-select').value;
        const mAction = document.getElementById('sim-member-action').value;
        
        const logs = getAttendanceLogs();
        const todayStr = "2026-07-06";
        const existing = logs.find(log => log.memberName === mName && log.date === todayStr);
        
        if (mAction === 'check-in') {
          if (existing && existing.status === 'Active') {
            alert(`${mName} is already checked in today.`);
            return;
          }
          // Remove completed if checking in again to simulate fresh
          const idx = logs.findIndex(log => log.memberName === mName && log.date === todayStr);
          if (idx !== -1) logs.splice(idx, 1);
          
          const newLog = {
            memberName: mName,
            memberId: mName === "Ethan Hunt" ? "8092-PRO" : "5021-REG",
            date: todayStr,
            checkIn: "12:00 PM",
            checkOut: "",
            duration: "",
            status: "Active"
          };
          logs.push(newLog);
          saveAttendanceLogs(logs);
          addRecentAdminActivity(`Simulated check-in scan: ${mName}`, 'cyan');
        } else {
          // check-out
          const activeLog = logs.find(log => log.memberName === mName && log.date === todayStr && log.status === 'Active');
          if (!activeLog) {
            alert(`${mName} does not have an active check-in session today.`);
            return;
          }
          activeLog.checkOut = "02:00 PM";
          activeLog.duration = "2h 00m";
          activeLog.status = "Completed";
          saveAttendanceLogs(logs);
          addRecentAdminActivity(`Simulated check-out scan: ${mName}`, 'volt');
        }
        
        renderAdminAttendance();
        updateDashboardAttendanceCount();
        alert(`Simulated scanner terminal action verified!`);
      });
    }
  }

});

