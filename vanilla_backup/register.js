/**
 * APEX ATHLETICS - REGISTRATION PORTAL CONTROLLER
 */

document.addEventListener('DOMContentLoaded', () => {

  // Immediately check active session state
  if (window.ApexAuth) {
    ApexAuth.enforcePortalGuard();
  }

  // --- DOM SELECTORS ---
  const memberTab = document.getElementById('reg-tab-member');
  const trainerTab = document.getElementById('reg-tab-trainer');
  const memberForm = document.getElementById('register-member-form');
  const trainerForm = document.getElementById('register-trainer-form');
  const successOverlay = document.getElementById('reg-success-state');
  const successTitle = document.getElementById('reg-success-title');
  const successMessage = document.getElementById('reg-success-message');

  // Helper to save registered users to localStorage mock DB
  const saveMockUser = (email, password, name, role) => {
    const users = JSON.parse(localStorage.getItem('apex_registered_users')) || [];
    const existingIndex = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
    const newUser = { email, password, name, role };
    if (existingIndex !== -1) {
      users[existingIndex] = newUser;
    } else {
      users.push(newUser);
    }
    localStorage.setItem('apex_registered_users', JSON.stringify(users));
  };

  // ==========================================
  // 1. AUTO-SELECT PLANS REMOVED
  // ==========================================
  // Membership selection is removed. Query parameters are ignored.


  // ==========================================
  // 2. TAB SWITCHER (MEMBER VS TRAINER REGISTRATION)
  // ==========================================
  const toggleFormTabs = (type) => {
    // Reset validations and values
    memberForm.reset();
    trainerForm.reset();
    clearAllErrors();

    if (type === 'trainer') {
      memberTab.classList.remove('active');
      trainerTab.classList.add('active');
      memberForm.style.display = 'none';
      trainerForm.style.display = 'block';
    } else {
      trainerTab.classList.remove('active');
      memberTab.classList.add('active');
      trainerForm.style.display = 'none';
      memberForm.style.display = 'block';
    }
  };

  memberTab.addEventListener('click', (e) => {
    e.preventDefault();
    toggleFormTabs('member');
  });

  trainerTab.addEventListener('click', (e) => {
    e.preventDefault();
    toggleFormTabs('trainer');
  });


  // ==========================================
  // 3. PASSWORD VISIBILITY TOGGLERS
  // ==========================================
  const forms = [memberForm, trainerForm];
  
  forms.forEach(form => {
    const toggleBtn = form.querySelector('.eye-toggle');
    const passInput = form.querySelector('.pass-input');
    
    if (toggleBtn && passInput) {
      let isVisible = false;
      toggleBtn.addEventListener('click', () => {
        isVisible = !isVisible;
        if (isVisible) {
          passInput.setAttribute('type', 'text');
          toggleBtn.innerHTML = `
            <!-- Eye Off Icon -->
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
            </svg>
          `;
        } else {
          passInput.setAttribute('type', 'password');
          toggleBtn.innerHTML = `
            <!-- Eye Icon -->
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          `;
        }
      });
    }
  });


  // ==========================================
  // 4. PASSWORD STRENGTH METER REMOVED
  // ==========================================


  // ==========================================
  // 5. REGEX FORM VALIDATION HELPERS
  // ==========================================
  const isValidEmail = (email) => {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(email);
  };

  const clearAllErrors = () => {
    const errorFields = document.querySelectorAll('.error-feedback');
    const invalidInputs = document.querySelectorAll('.form-input');
    errorFields.forEach(err => {
      err.style.display = 'none';
      err.textContent = '';
    });
    invalidInputs.forEach(input => {
      input.classList.remove('invalid');
    });
  };


  // ==========================================
  // 6. MEMBER REGISTRATION SUBMISSION
  // ==========================================
  memberForm.addEventListener('submit', (e) => {
    e.preventDefault();
    clearAllErrors();

    const nameInput = document.getElementById('mem-name');
    const emailInput = document.getElementById('mem-email');
    const passInput = document.getElementById('mem-password');
    const ageInput = document.getElementById('mem-age');
    const phoneInput = document.getElementById('mem-phone');
    const termsInput = document.getElementById('mem-terms');
    const submitBtn = document.getElementById('mem-submit-btn');

    const nameVal = nameInput.value.trim();
    const emailVal = emailInput.value.trim();
    const passVal = passInput.value;
    const ageVal = ageInput.value;
    const phoneVal = phoneInput.value.trim();
    const termsVal = termsInput.checked;

    let isFormValid = true;

    if (!nameVal) {
      nameInput.classList.add('invalid');
      document.getElementById('mem-name-error').textContent = 'Full Name is required.';
      document.getElementById('mem-name-error').style.display = 'block';
      isFormValid = false;
    }

    if (!emailVal) {
      emailInput.classList.add('invalid');
      document.getElementById('mem-email-error').textContent = 'Email address is required.';
      document.getElementById('mem-email-error').style.display = 'block';
      isFormValid = false;
    } else if (!isValidEmail(emailVal)) {
      emailInput.classList.add('invalid');
      document.getElementById('mem-email-error').textContent = 'Invalid email syntax.';
      document.getElementById('mem-email-error').style.display = 'block';
      isFormValid = false;
    }

    if (!passVal) {
      passInput.classList.add('invalid');
      document.getElementById('mem-password-error').textContent = 'Password is required.';
      document.getElementById('mem-password-error').style.display = 'block';
      isFormValid = false;
    }

    if (!ageVal) {
      ageInput.classList.add('invalid');
      document.getElementById('mem-age-error').textContent = 'Age is required.';
      document.getElementById('mem-age-error').style.display = 'block';
      isFormValid = false;
    } else if (parseInt(ageVal, 10) < 12 || parseInt(ageVal, 10) > 100) {
      ageInput.classList.add('invalid');
      document.getElementById('mem-age-error').textContent = 'Age must be between 12 and 100.';
      document.getElementById('mem-age-error').style.display = 'block';
      isFormValid = false;
    }

    if (!phoneVal) {
      phoneInput.classList.add('invalid');
      document.getElementById('mem-phone-error').textContent = 'Mobile Number is required.';
      document.getElementById('mem-phone-error').style.display = 'block';
      isFormValid = false;
    }

    if (!termsVal) {
      document.getElementById('mem-terms-error').textContent = 'Accepting terms is required.';
      document.getElementById('mem-terms-error').style.display = 'block';
      isFormValid = false;
    }

    if (!isFormValid) return;

    // Successful mock Member signup triggers loader
    submitBtn.textContent = 'Creating Profile...';
    submitBtn.disabled = true;
    
    // Save to mock database in LocalStorage
    saveMockUser(emailVal, passVal, nameVal, 'member');

    setTimeout(() => {
      // Setup successful notification details
      successTitle.textContent = 'Account Provisioned!';
      successMessage.textContent = `Welcome, ${nameVal}! Age: ${ageVal}, Mobile: ${phoneVal}. Mock profile synced. Redirecting to secure login interface...`;
      successOverlay.classList.add('active');

      // Inject bypass recovery inside console for direct testing
      console.log('--- APEX ATHLETICS REGISTRATION SYNC ---');
      console.log(`Registered Member: ${nameVal}`);
      console.log(`Email: ${emailVal}`);
      console.log(`Age: ${ageVal}`);
      console.log(`Mobile: ${phoneVal}`);
      console.log('Note: Pre-filled credentials simulated. You may now login.');
      console.log('----------------------------------------');

      setTimeout(() => {
        window.location.href = 'login.html';
      }, 1800);
    }, 1200);
  });


  // ==========================================
  // 7. TRAINER APPLICATION SUBMISSION
  // ==========================================
  trainerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    clearAllErrors();

    const nameInput = document.getElementById('trn-name');
    const emailInput = document.getElementById('trn-email');
    const passInput = document.getElementById('trn-password');
    const certsInput = document.getElementById('trn-certs');
    const termsInput = document.getElementById('trn-terms');
    const submitBtn = document.getElementById('trn-submit-btn');

    const nameVal = nameInput.value.trim();
    const emailVal = emailInput.value.trim();
    const passVal = passInput.value;
    const specialtyVal = document.getElementById('trn-specialty').value;
    const certsVal = certsInput.value.trim();
    const termsVal = termsInput.checked;

    let isFormValid = true;

    if (!nameVal) {
      nameInput.classList.add('invalid');
      document.getElementById('trn-name-error').textContent = 'Full Name is required.';
      document.getElementById('trn-name-error').style.display = 'block';
      isFormValid = false;
    }

    if (!emailVal) {
      emailInput.classList.add('invalid');
      document.getElementById('trn-email-error').textContent = 'Email address is required.';
      document.getElementById('trn-email-error').style.display = 'block';
      isFormValid = false;
    } else if (!isValidEmail(emailVal)) {
      emailInput.classList.add('invalid');
      document.getElementById('trn-email-error').textContent = 'Invalid email syntax.';
      document.getElementById('trn-email-error').style.display = 'block';
      isFormValid = false;
    }

    if (!passVal) {
      passInput.classList.add('invalid');
      document.getElementById('trn-password-error').textContent = 'Password is required.';
      document.getElementById('trn-password-error').style.display = 'block';
      isFormValid = false;
    }

    if (!certsVal) {
      certsInput.classList.add('invalid');
      document.getElementById('trn-certs-error').textContent = 'Certifications details are required.';
      document.getElementById('trn-certs-error').style.display = 'block';
      isFormValid = false;
    }

    if (!termsVal) {
      document.getElementById('trn-terms-error').textContent = 'Accepting terms is required.';
      document.getElementById('trn-terms-error').style.display = 'block';
      isFormValid = false;
    }

    if (!isFormValid) return;

    // Successful Trainer application triggers loader
    submitBtn.textContent = 'Submitting Application...';
    submitBtn.disabled = true;
    
    // Save to mock database in LocalStorage
    saveMockUser(emailVal, passVal, nameVal, 'trainer');

    setTimeout(() => {
      successTitle.textContent = 'Application Transmitted!';
      successMessage.textContent = `Thank you, Coach ${nameVal}! Your credentials specialty [${specialtyVal.toUpperCase()}] have been logged. Redirecting to Sign In portal...`;
      successOverlay.classList.add('active');

      console.log('--- APEX ATHLETICS TRAINER REGISTERED ---');
      console.log(`Applicant Trainer: ${nameVal}`);
      console.log(`Email: ${emailVal}`);
      console.log(`Specialization: ${specialtyVal.toUpperCase()}`);
      console.log(`Credentials: ${certsVal}`);
      console.log('Note: Application data stored in mock DB. Redirecting to login portal...');
      console.log('------------------------------------------');

      setTimeout(() => {
        window.location.href = 'login.html';
      }, 2000);
    }, 1200);
  });

});
