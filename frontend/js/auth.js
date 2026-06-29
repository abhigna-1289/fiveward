// =============================================================
// FIVEWARD — Auth Module
// Two responsibilities:
//   1. Core auth functions used by every page (sign up, log in,
//      Google OAuth, sign out, session guard, avatar initials).
//   2. Full DOM wiring for auth.html (forms, toggle, eye icon,
//      Google button, terms modal, below-card switch link).
// =============================================================


// ============================================================
// CORE AUTH FUNCTIONS  (used by all pages)
// ============================================================

// Redirect to auth.html if the user is not logged in.
// Call this at the top of any inner-page script.
async function requireAuth() {
  const { data: { session } } = await window.sb.auth.getSession();
  if (!session) {
    window.location.href = 'auth.html';
  }
  return session;
}

async function getCurrentUser() {
  const { data: { user } } = await window.sb.auth.getUser();
  return user;
}

async function signUp(email, password, fullName) {
  console.log('[fiveward] signUp — calling Supabase with email:', email);

  const { data, error } = await window.sb.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: 'http://localhost:8000/frontend/auth.html',
    }
  });

  console.log('[fiveward] signUp — raw data:', data);
  console.log('[fiveward] signUp — raw error:', error);
  console.log('[fiveward] signUp — error?.message:', error?.message);
  console.log('[fiveward] signUp — error?.status:', error?.status);
  console.log('[fiveward] signUp — error?.code:', error?.code);
  console.log('[fiveward] signUp — data?.user:', data?.user);
  console.log('[fiveward] signUp — data?.session:', data?.session);
  console.log('[fiveward] signUp — data?.user?.identities:', data?.user?.identities);

  if (error) throw error;
  return data;
}

async function logIn(email, password) {
  const { data, error } = await window.sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

async function signInWithGoogle() {
  const { data, error } = await window.sb.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: 'http://localhost:8000/frontend/dashboard.html' }
  });
  if (error) throw error;
  return data;
}

async function signOut() {
  const { error } = await window.sb.auth.signOut();
  if (error) throw error;
  window.location.href = 'index.html';
}

// Reads the logged-in user's name and puts initials in the navbar avatar element.
async function setNavbarAvatar() {
  const avatarEl = document.getElementById('userAvatar');
  if (!avatarEl) return;
  const user = await getCurrentUser();
  if (!user) return;
  const name = user.user_metadata?.full_name || user.email || '?';
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  avatarEl.textContent = initials;
}


// ============================================================
// PAGE DETECTION
// ============================================================

const _currentPage  = window.location.pathname.split('/').pop();
const _publicPages  = ['index.html', 'auth.html', ''];
const _isAuthPage   = _currentPage === 'auth.html';
const _isInnerPage  = !_publicPages.includes(_currentPage);

// On every inner page: guard the session and populate the navbar avatar.
if (_isInnerPage) {
  (async () => {
    if (!window.sb) {
      window.location.href = 'auth.html';
      return;
    }
    const { data: { session } } = await window.sb.auth.getSession();
    if (!session) {
      window.location.href = 'auth.html';
      return;
    }
    setNavbarAvatar();
  })();
}

// On auth.html: if the user is already signed in (e.g. returning via OAuth
// callback), send them straight to the dashboard.
if (_isAuthPage && window.sb) {
  window.sb.auth.onAuthStateChange((event, session) => {
    if (session && event === 'SIGNED_IN') {
      window.location.href = 'dashboard.html';
    }
  });
}


// ============================================================
// AUTH PAGE DOM WIRING  (only runs on auth.html)
// ============================================================

if (_isAuthPage) {
  document.addEventListener('DOMContentLoaded', () => {

    // --- Elements -------------------------------------------
    const signupTab    = document.getElementById('signupTab');
    const loginTab     = document.getElementById('loginTab');
    const signupPanel  = document.getElementById('signupPanel');
    const loginPanel   = document.getElementById('loginPanel');
    const switchText   = document.getElementById('switchText');
    const authSwitchBtn = document.getElementById('authSwitchBtn');

    // --- Tab Toggle -----------------------------------------
    function showSignup() {
      signupTab.classList.add('active');
      loginTab.classList.remove('active');
      signupTab.setAttribute('aria-selected', 'true');
      loginTab.setAttribute('aria-selected', 'false');
      signupPanel.removeAttribute('hidden');
      loginPanel.setAttribute('hidden', '');
      switchText.textContent = 'Already have an account?';
      authSwitchBtn.textContent = 'Log In';
    }

    function showLogin() {
      loginTab.classList.add('active');
      signupTab.classList.remove('active');
      loginTab.setAttribute('aria-selected', 'true');
      signupTab.setAttribute('aria-selected', 'false');
      loginPanel.removeAttribute('hidden');
      signupPanel.setAttribute('hidden', '');
      switchText.textContent = "Don't have an account?";
      authSwitchBtn.textContent = 'Sign Up';
    }

    signupTab.addEventListener('click', showSignup);
    loginTab.addEventListener('click', showLogin);

    // Below-card link mirrors the tab toggle
    authSwitchBtn.addEventListener('click', () => {
      if (loginPanel.hasAttribute('hidden')) showLogin();
      else showSignup();
    });

    // --- Password Show / Hide --------------------------------
    // Each eye button holds two SVGs: .eye-show and .eye-hide.
    // We swap which one is visible whenever the button is clicked.
    document.querySelectorAll('.auth-field__eye').forEach(btn => {
      btn.addEventListener('click', () => {
        const input = document.getElementById(btn.dataset.target);
        const isHidden = input.type === 'password';

        input.type = isHidden ? 'text' : 'password';
        btn.setAttribute('aria-label', isHidden ? 'Hide password' : 'Show password');

        btn.querySelector('.eye-show').style.display = isHidden ? 'none'  : '';
        btn.querySelector('.eye-hide').style.display = isHidden ? ''      : 'none';
      });
    });

    // --- Helper: show a message inside a form ---------------
    function setMessage(el, text, type) {
      el.textContent = text;
      el.className = 'auth-message';
      if (type) el.classList.add('auth-message--' + type);
    }

    // --- Sign Up Form ---------------------------------------
    const signupForm    = document.getElementById('signupForm');
    const signupMsg     = document.getElementById('signupMessage');
    const signupSubmit  = document.getElementById('signupSubmit');

    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      setMessage(signupMsg, '', '');

      const name     = document.getElementById('signupName').value.trim();
      const email    = document.getElementById('signupEmail').value.trim();
      const password = document.getElementById('signupPassword').value;

      // Basic client-side validation
      if (!name || !email || !password) {
        setMessage(signupMsg, 'Please fill in all fields.', 'error');
        return;
      }
      if (password.length < 8) {
        setMessage(signupMsg, 'Password must be at least 8 characters.', 'error');
        return;
      }

      signupSubmit.textContent = 'Creating account…';
      signupSubmit.disabled = true;

      // Step 1: create the account
      let signUpData;
      try {
        signUpData = await signUp(email, password, name);
      } catch (err) {
        console.error('[fiveward] signUp failed | status:', err.status, '| code:', err.code, '| message:', err.message, '| full:', err);
        const raw = err.message;
        const msg = raw && raw !== '{}' ? raw : 'Could not create account — please try again or contact support.';
        setMessage(signupMsg, msg, 'error');
        signupSubmit.textContent = 'Create Account';
        signupSubmit.disabled = false;
        return;
      }

      // Step 2: confirm email via backend (service key never leaves the server)
      const userId = signUpData?.user?.id;
      if (userId) {
        try {
          const res = await fetch('http://localhost:5000/api/auth/confirm-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId }),
          });
          const json = await res.json();
          if (!res.ok) console.error('[fiveward] confirm-email failed:', json);
          else console.log('[fiveward] Email confirmed successfully');
        } catch (e) {
          console.error('[fiveward] confirm-email request error:', e);
        }
      }

      // Step 3: redirect — signUp already created a session so no separate login needed
      window.location.href = 'dashboard.html';
    });

    // --- Log In Form ----------------------------------------
    const loginForm   = document.getElementById('loginForm');
    const loginMsg    = document.getElementById('loginMessage');
    const loginSubmit = document.getElementById('loginSubmit');

    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      setMessage(loginMsg, '', '');

      const email    = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value;

      if (!email || !password) {
        setMessage(loginMsg, 'Please fill in all fields.', 'error');
        return;
      }

      loginSubmit.textContent = 'Logging in…';
      loginSubmit.disabled = true;

      try {
        await logIn(email, password);
        window.location.href = 'dashboard.html';
      } catch (err) {
        let msg;
        if (err.code === 'invalid_credentials') {
          msg = 'Incorrect email or password. Please try again.';
        } else if (err.code === 'email_not_confirmed') {
          msg = 'Please confirm your email before logging in.';
        } else {
          msg = 'Something went wrong. Please try again.';
        }
        setMessage(loginMsg, msg, 'error');
        loginSubmit.textContent = 'Log In';
        loginSubmit.disabled = false;
      }
    });

    // --- Google Sign In -------------------------------------
    document.getElementById('googleBtn').addEventListener('click', async () => {
      try {
        await signInWithGoogle();
        // Supabase redirects the browser to Google, then back to dashboard.html.
        // The onAuthStateChange listener above handles the final redirect.
      } catch (err) {
        // Surface the error below the Google button temporarily
        const googleBtn = document.getElementById('googleBtn');
        googleBtn.insertAdjacentHTML(
          'afterend',
          `<p class="auth-message auth-message--error">${err.message}</p>`
        );
      }
    });

    // --- Terms of Service Modal -----------------------------
    const termsModal = document.getElementById('termsModal');

    function openTerms() {
      termsModal.classList.add('open');
      termsModal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }

    function closeTerms() {
      termsModal.classList.remove('open');
      termsModal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }

    document.getElementById('openTermsBtn').addEventListener('click', openTerms);
    document.getElementById('closeTermsBtn').addEventListener('click', closeTerms);
    document.getElementById('termsOverlay').addEventListener('click', closeTerms);

    // --- Privacy Policy Modal -------------------------------
    const privacyModal = document.getElementById('privacyModal');

    function openPrivacy() {
      privacyModal.classList.add('open');
      privacyModal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }

    function closePrivacy() {
      privacyModal.classList.remove('open');
      privacyModal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }

    document.getElementById('openPrivacyBtn').addEventListener('click', openPrivacy);
    document.getElementById('closePrivacyBtn').addEventListener('click', closePrivacy);
    document.getElementById('privacyOverlay').addEventListener('click', closePrivacy);

    // Close either modal on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (termsModal.classList.contains('open')) closeTerms();
        if (privacyModal.classList.contains('open')) closePrivacy();
      }
    });

  }); // end DOMContentLoaded
} // end _isAuthPage
