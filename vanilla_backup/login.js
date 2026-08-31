/**
 * APEX ATHLETICS - PORTAL INTERACTION CONTROLLER
 */

document.addEventListener('DOMContentLoaded', () => {

  // Immediately check if user is already authenticated
  // Enforce portal guard so active sessions bypass login.html
  if (window.ApexAuth) {
    ApexAuth.enforcePortalGuard();
  }

  // --- DOM SELECTORS ---
  const loginCard = document.getElementById('login-card-container');
  const roleHiddenInput = document.getElementById('login-role');
  const helperText = document.getElementById('login-helper-text');
  
  // Forms
  const loginForm = document.getElementById('portal-login-form');
  const forgotForm = document.getElementById('portal-forgot-form');
  
  // Inputs
  const emailInput = document.getElementById('login-email');
  const passwordInput = document.getElementById('login-password');
  const rememberCheckbox = document.getElementById('login-remember');
  const forgotEmailInput = document.getElementById('forgot-email');
  
  // Errors
  const emailError = document.getElementById('email-error');
  const passwordError = document.getElementById('password-error');
  const forgotEmailError = document.getElementById('forgot-email-error');
  
  // Interactive UI buttons
  const togglePassBtn = document.getElementById('toggle-password-visibility');
  const triggerForgotBtn = document.getElementById('trigger-forgot-panel');
  const triggerLoginBtn = document.getElementById('trigger-login-panel');
  const forgotSuccessBackBtn = document.getElementById('forgot-success-back-btn');
  const loginSubmitBtn = document.getElementById('login-submit-btn');
  const forgotSubmitBtn = document.getElementById('forgot-submit-btn');
  
  // Paneling overlay boxes
  const forgotSuccessState = document.getElementById('forgot-success-state');
  // Strength selectors removed

  // ==========================================
  // 1. TABS SYSTEM - CHOOSE PORTAL ROLE
  // ==========================================
  const tabs = document.querySelectorAll('.role-tab');
  
  // Pre-configured mock databases for authentication checks
  const mockDatabases = {
    member: {
      email: 'member@apex.com',
      password: 'MemberPass123!',
      name: 'Ethan Hunt'
    },
    trainer: {
      email: 'trainer@apex.com',
      password: 'TrainerPass123!',
      name: 'Marcus Vance'
    },
    admin: {
      email: 'admin@apex.com',
      password: 'AdminPass123!',
      name: 'System Admin'
    }
  };

  const handleRoleSwitch = (role) => {
    roleHiddenInput.value = role;
    
    // Clear inputs and error fields on switch
    emailInput.value = '';
    passwordInput.value = '';
    emailInput.classList.remove('invalid');
    passwordInput.classList.remove('invalid');
    emailError.style.display = 'none';
    passwordError.style.display = 'none';
    // Strength reset removed
    
    // Update credentials tip text
    const credentials = mockDatabases[role];
    helperText.innerHTML = `Try: <strong>${credentials.email}</strong> / <strong>${credentials.password}</strong>`;
  };

  tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const selectedRole = tab.getAttribute('data-role');
      handleRoleSwitch(selectedRole);
    });
  });


  // ==========================================
  // 2. 3D FLIP MECHANISM (FORGOT PASSWORD)
  // ==========================================
  triggerForgotBtn.addEventListener('click', (e) => {
    e.preventDefault();
    loginCard.classList.add('flipped');
  });

  triggerLoginBtn.addEventListener('click', (e) => {
    e.preventDefault();
    loginCard.classList.remove('flipped');
    forgotForm.reset();
    forgotEmailInput.classList.remove('invalid');
    forgotEmailError.style.display = 'none';
    forgotSuccessState.classList.remove('active');
  });

  forgotSuccessBackBtn.addEventListener('click', () => {
    loginCard.classList.remove('flipped');
    forgotForm.reset();
    forgotSuccessState.classList.remove('active');
  });


  // ==========================================
  // 3. PASSWORD VISIBILITY TOGGLER
  // ==========================================
  let isPasswordVisible = false;
  
  togglePassBtn.addEventListener('click', () => {
    isPasswordVisible = !isPasswordVisible;
    if (isPasswordVisible) {
      passwordInput.setAttribute('type', 'text');
      togglePassBtn.innerHTML = `
        <!-- Eye Off Icon -->
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
        </svg>
      `;
    } else {
      passwordInput.setAttribute('type', 'password');
      togglePassBtn.innerHTML = `
        <!-- Eye Icon -->
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      `;
    }
  });


  // ==========================================
  // 4. REAL-TIME PASSWORD STRENGTH REMOVED
  // ==========================================


  // ==========================================
  // 5. REGEX FORM VALIDATORS
  // ==========================================
  const isValidEmail = (email) => {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(email);
  };

  // ==========================================
  // 6. LOGIN FORM SUBMIT (Simulated Server POST)
  // ==========================================
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const emailVal = emailInput.value.trim();
    const passwordVal = passwordInput.value;
    const roleVal = roleHiddenInput.value;
    const rememberMe = rememberCheckbox.checked;
    
    let isFormValid = true;

    // Reset validations
    emailInput.classList.remove('invalid');
    passwordInput.classList.remove('invalid');
    emailError.style.display = 'none';
    passwordError.style.display = 'none';

    // Email validation
    if (!emailVal) {
      emailInput.classList.add('invalid');
      emailError.textContent = 'Email address is required.';
      emailError.style.display = 'block';
      isFormValid = false;
    } else if (!isValidEmail(emailVal)) {
      emailInput.classList.add('invalid');
      emailError.textContent = 'Invalid email syntax.';
      emailError.style.display = 'block';
      isFormValid = false;
    }

    // Password validation
    if (!passwordVal) {
      passwordInput.classList.add('invalid');
      passwordError.textContent = 'Password is required.';
      passwordError.style.display = 'block';
      isFormValid = false;
    }

    if (!isFormValid) return;

    // Simulate database lookup and check
    const mockUser = mockDatabases[roleVal];
    
    // Check localStorage registered users database too
    const registeredUsers = JSON.parse(localStorage.getItem('apex_registered_users')) || [];
    const matchedRegisteredUser = registeredUsers.find(u => u.email.toLowerCase() === emailVal.toLowerCase() && u.role === roleVal);

    let authenticatedUser = null;

    if (emailVal.toLowerCase() === mockUser.email.toLowerCase() && passwordVal === mockUser.password) {
      authenticatedUser = {
        email: mockUser.email,
        name: mockUser.name,
        role: roleVal
      };
    } else if (matchedRegisteredUser && matchedRegisteredUser.password === passwordVal) {
      authenticatedUser = {
        email: matchedRegisteredUser.email,
        name: matchedRegisteredUser.name,
        role: roleVal
      };
    }

    if (authenticatedUser) {
      // Correct credentials
      loginSubmitBtn.textContent = 'Authorizing...';
      loginSubmitBtn.disabled = true;

      // Simulate network request latencies (1.2 seconds)
      setTimeout(() => {
        if (window.ApexAuth) {
          // Write simulated JWT to storage
          ApexAuth.authenticateUser(authenticatedUser.email, authenticatedUser.role, authenticatedUser.name, rememberMe);
          // Redirect based on role
          window.location.href = 'dashboard.html';
        }
      }, 1200);
    } else {
      // Incorrect credentials
      passwordInput.classList.add('invalid');
      passwordError.textContent = 'Invalid email or password for selected portal role.';
      passwordError.style.display = 'block';
    }
  });


  // ==========================================
  // 7. FORGOT PASSWORD SIMULATION SUBMIT
  // ==========================================
  forgotForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const emailVal = forgotEmailInput.value.trim();
    
    forgotEmailInput.classList.remove('invalid');
    forgotEmailError.style.display = 'none';

    if (!emailVal) {
      forgotEmailInput.classList.add('invalid');
      forgotEmailError.textContent = 'Email address is required.';
      forgotEmailError.style.display = 'block';
      return;
    } else if (!isValidEmail(emailVal)) {
      forgotEmailInput.classList.add('invalid');
      forgotEmailError.textContent = 'Invalid email syntax.';
      forgotEmailError.style.display = 'block';
      return;
    }

    // Send reset instructions (simulated)
    forgotSubmitBtn.textContent = 'Transmitting...';
    forgotSubmitBtn.disabled = true;

    setTimeout(() => {
      forgotSubmitBtn.textContent = 'Send Reset Instructions';
      forgotSubmitBtn.disabled = false;
      
      // Open Success state
      forgotSuccessState.classList.add('active');
      
      // Inject debug recovery code in console for user review
      console.log('--- APEX ATHLETICS RECOVERY MOCK ---');
      console.log(`Reset Request Email: ${emailVal}`);
      console.log('Recovery Payload: 127-OTP-BYPASS');
      console.log('Mock Dashboard Entry Key: AdminPass123!');
      console.log('------------------------------------');
    }, 1500);
  });

});
