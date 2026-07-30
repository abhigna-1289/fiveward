// =============================================================
// FIVEWARD — Settings Page
//
// localStorage keys managed here:
//   fw_lb_show_on_page     → boolean  (leaderboard card on progress page)
//   fw_lb_show_me          → boolean  (show user on leaderboard)
//   fw_lb_username_display → string   ('full' | 'first' | 'anon')
//   fw_dark_mode           → boolean  (dark theme applied to all pages)
//   fw_font_size           → string   ('small' | 'medium' | 'large')
//   fw_notif_browser       → boolean
//   fw_privacy_data        → boolean
//   fw_privacy_visibility  → boolean
// =============================================================

(function initSettings() {

  // =========================================================
  // HELPERS
  // =========================================================

  function ls(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) ?? 'null') ?? fallback; }
    catch { return fallback; }
  }

  function lsSet(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function wireToggle(id, storageKey, defaultVal) {
    const el = document.getElementById(id);
    if (!el) return;
    el.checked = ls(storageKey, defaultVal);
    el.addEventListener('change', () => lsSet(storageKey, el.checked));
  }

  // =========================================================
  // SIDEBAR NAVIGATION (scroll-based TOC)
  // =========================================================

  const navItems = document.querySelectorAll('.settings-nav-item');
  const sections = document.querySelectorAll('.settings-section');

  function sectionIdForBtn(btn) {
    return 'section' + btn.dataset.section.charAt(0).toUpperCase() + btn.dataset.section.slice(1);
  }

  function setActiveNav(id) {
    navItems.forEach(btn => btn.classList.toggle('active', sectionIdForBtn(btn) === id));
  }

  navItems.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = document.getElementById(sectionIdForBtn(btn));
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveNav(sectionIdForBtn(btn));
      history.replaceState(null, '', '#' + btn.dataset.section);
    });
  });

  // Update active highlight as sections scroll into view
  const _io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) setActiveNav(entry.target.id);
    });
  }, { rootMargin: '-100px 0px -55% 0px', threshold: 0 });
  sections.forEach(s => _io.observe(s));

  // Scroll to hashed section on load
  function applyHash() {
    const hash = window.location.hash.replace('#', '');
    if (hash) {
      const target = document.getElementById('section' + hash.charAt(0).toUpperCase() + hash.slice(1));
      if (target) {
        setTimeout(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
        setActiveNav(target.id);
        return;
      }
    }
    setActiveNav('sectionAccount');
  }
  applyHash();
  window.addEventListener('hashchange', applyHash);

  // =========================================================
  // ACCOUNT SECTION
  // =========================================================

  function loadAccountInfo() {
    if (window.sb) {
      window.sb.auth.getUser().then(({ data: { user } }) => {
        if (!user) return;
        const fullName = user.user_metadata?.full_name || '';
        const email    = user.email;

        const provider   = user.app_metadata?.provider || 'email';
        const nameEl     = document.getElementById('settingsName');
        const emailEl    = document.getElementById('settingsEmail');
        const gEmailEl   = document.getElementById('settingsGoogleEmail');
        const avatEl     = document.getElementById('stAvatarEl');
        const navNameEl  = document.getElementById('dropdownName');
        const navEmailEl = document.getElementById('dropdownEmail');
        const navAvatEl  = document.getElementById('userAvatar');
        const connCard   = document.getElementById('stConnectedAccountsCard');

        if (nameEl)  nameEl.textContent  = fullName || '—';
        if (emailEl) emailEl.textContent = email || '—';

        if (provider === 'google') {
          if (connCard) connCard.hidden = false;
          if (gEmailEl) gEmailEl.textContent = email || 'Connected via Google';
        } else {
          if (connCard) connCard.hidden = true;
        }

        if (fullName && avatEl) {
          const initials = fullName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
          avatEl.textContent = initials;
        }
        if (navNameEl)  navNameEl.textContent  = fullName || email;
        if (navEmailEl) navEmailEl.textContent = email;
        if (navAvatEl && fullName) {
          const initials = fullName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
          navAvatEl.textContent = initials;
        }
      });
    }
  }

  // --- Edit Profile Modal -----------------------------------

  const _editModal    = document.getElementById('stEditProfileModal');
  const _editNameIn   = document.getElementById('stEditNameInput');
  const _editErrEl    = document.getElementById('stEditProfileError');

  document.getElementById('stEditProfileBtn')?.addEventListener('click', () => {
    if (_editNameIn) _editNameIn.value = document.getElementById('settingsName')?.textContent?.trim() || '';
    if (_editErrEl)  _editErrEl.hidden = true;
    if (_editModal)  { _editModal.hidden = false; _editNameIn?.focus(); }
  });

  document.getElementById('stEditProfileSave')?.addEventListener('click', async () => {
    const name = _editNameIn?.value?.trim() || '';
    if (_editErrEl) _editErrEl.hidden = true;
    if (!name) {
      if (_editErrEl) { _editErrEl.textContent = 'Name cannot be empty.'; _editErrEl.hidden = false; }
      return;
    }
    if (window.sb) {
      const { error } = await window.sb.auth.updateUser({ data: { full_name: name } });
      if (error) {
        if (_editErrEl) { _editErrEl.textContent = error.message; _editErrEl.hidden = false; }
        return;
      }
    }
    const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    const nameEl    = document.getElementById('settingsName');
    const avatEl    = document.getElementById('stAvatarEl');
    const navNameEl = document.getElementById('dropdownName');
    const navAvatEl = document.getElementById('userAvatar');
    if (nameEl)    nameEl.textContent    = name;
    if (avatEl)    avatEl.textContent    = initials;
    if (navNameEl) navNameEl.textContent = name;
    if (navAvatEl) navAvatEl.textContent = initials;
    if (_editModal) _editModal.hidden = true;
    window.fwShowToast?.('Profile updated');
  });

  document.getElementById('stEditProfileCancel')?.addEventListener('click', () => {
    if (_editModal) _editModal.hidden = true;
  });
  _editModal?.addEventListener('keydown', e => { if (e.key === 'Escape') _editModal.hidden = true; });

  // --- Change Password Modal --------------------------------

  const _pwModal    = document.getElementById('stChangePasswordModal');
  const _newPwIn    = document.getElementById('stNewPasswordInput');
  const _confPwIn   = document.getElementById('stConfirmPasswordInput');
  const _pwErrEl    = document.getElementById('stChangePwError');

  document.getElementById('stChangePasswordBtn')?.addEventListener('click', () => {
    if (_newPwIn)  _newPwIn.value  = '';
    if (_confPwIn) _confPwIn.value = '';
    if (_pwErrEl)  _pwErrEl.hidden = true;
    if (_pwModal)  { _pwModal.hidden = false; _newPwIn?.focus(); }
  });

  document.getElementById('stChangePwSave')?.addEventListener('click', async () => {
    const newPw  = _newPwIn?.value  || '';
    const confPw = _confPwIn?.value || '';
    if (_pwErrEl) _pwErrEl.hidden = true;
    if (!newPw) {
      if (_pwErrEl) { _pwErrEl.textContent = 'Please enter a new password.'; _pwErrEl.hidden = false; }
      return;
    }
    if (newPw.length < 6) {
      if (_pwErrEl) { _pwErrEl.textContent = 'Password must be at least 6 characters.'; _pwErrEl.hidden = false; }
      return;
    }
    if (newPw !== confPw) {
      if (_pwErrEl) { _pwErrEl.textContent = 'Passwords do not match.'; _pwErrEl.hidden = false; }
      return;
    }
    if (!window.sb) {
      if (_pwErrEl) { _pwErrEl.textContent = 'Not connected to authentication service.'; _pwErrEl.hidden = false; }
      return;
    }
    // Check current user and their sign-in identities
    const { data: { user: currentUser } } = await window.sb.auth.getUser();
    console.log('[fiveward] Change password — current user:', currentUser);
    console.log('[fiveward] Change password — identities:', currentUser?.identities);
    // Google-only accounts cannot set a password for email login
    const isGoogleOnly = currentUser?.identities?.length > 0 &&
      currentUser.identities.every(id => id.provider === 'google');
    if (isGoogleOnly) {
      if (_pwErrEl) {
        _pwErrEl.textContent = 'Your account uses Google sign-in. Password login is not available for Google accounts.';
        _pwErrEl.hidden = false;
      }
      return;
    }
    const { data, error } = await window.sb.auth.updateUser({ password: newPw });
    console.log('[fiveward] updateUser password — data:', data, 'error:', error);
    if (error) {
      if (_pwErrEl) { _pwErrEl.textContent = error.message; _pwErrEl.hidden = false; }
      return;
    }
    if (_pwModal) _pwModal.hidden = true;
    window.fwShowToast?.('Password updated — signing you out so you can log in with your new password');
    setTimeout(async () => {
      await window.sb.auth.signOut();
      window.location.href = 'auth.html';
    }, 2000);
  });

  document.getElementById('stChangePwCancel')?.addEventListener('click', () => {
    if (_pwModal) _pwModal.hidden = true;
  });
  _pwModal?.addEventListener('keydown', e => { if (e.key === 'Escape') _pwModal.hidden = true; });

  document.getElementById('stUnlinkGoogleBtn')?.addEventListener('click', () => {
    window.fwShowToast?.('Account unlinking coming soon');
  });

  document.getElementById('settingsSignOut')?.addEventListener('click', async () => {
    if (window.sb) await window.sb.auth.signOut();
    window.location.href = 'auth.html';
  });

  // =========================================================
  // APPEARANCE SECTION
  // =========================================================

  const darkToggle = document.getElementById('stDarkMode');
  if (darkToggle) {
    if (localStorage.getItem('fw_dark_mode') === null) {
      localStorage.setItem('fw_dark_mode', 'false');
    }
    darkToggle.checked = ls('fw_dark_mode', false);
    darkToggle.addEventListener('change', () => {
      lsSet('fw_dark_mode', darkToggle.checked);
      if (darkToggle.checked) {
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.removeAttribute('data-theme');
      }
    });
  }

  // Font size pill group
  const fontPills = document.querySelectorAll('input[name="fontSize"]');
  const savedSize = ls('fw_font_size', 'medium');
  fontPills.forEach(pill => {
    if (pill.value === savedSize) pill.checked = true;
    pill.addEventListener('change', () => {
      if (pill.checked) {
        lsSet('fw_font_size', pill.value);
        document.documentElement.setAttribute('data-font-size', pill.value);
      }
    });
  });

  // =========================================================
  // NOTIFICATIONS SECTION
  // =========================================================

  if (localStorage.getItem('fw_notif_browser') === null) {
    localStorage.setItem('fw_notif_browser', 'true');
  }
  wireToggle('stBrowserNotif', 'fw_notif_browser', true);

  // =========================================================
  // PRIVACY SECTION
  // =========================================================

  wireToggle('stDataCollection',   'fw_privacy_data',       true);
  wireToggle('stAccountVisibility','fw_privacy_visibility',  true);

  // =========================================================
  // LEADERBOARD SECTION
  // =========================================================

  wireToggle('stLbShowOnPage', 'fw_lb_show_on_page', true);
  wireToggle('stLbShowMe',     'fw_lb_show_me',      true);

  const usernameDisplayEl = document.getElementById('stUsernameDisplay');
  if (usernameDisplayEl) {
    usernameDisplayEl.value = ls('fw_lb_username_display', 'full') || 'full';
    usernameDisplayEl.addEventListener('change', () => {
      lsSet('fw_lb_username_display', usernameDisplayEl.value);
    });
  }

  // =========================================================
  // DANGER ZONE
  // =========================================================

  function showConfirm(title, msg, onConfirm) {
    const dialog   = document.getElementById('stConfirmDialog');
    const titleEl  = document.getElementById('stConfirmTitle');
    const msgEl    = document.getElementById('stConfirmMsg');
    const okBtn    = document.getElementById('stConfirmOk');
    const cancelBtn= document.getElementById('stConfirmCancel');
    if (!dialog) return;

    if (titleEl) titleEl.textContent = title;
    if (msgEl)   msgEl.textContent   = msg;
    dialog.hidden = false;

    const cleanup   = () => { dialog.hidden = true; };
    const doConfirm = () => { cleanup(); onConfirm(); };

    okBtn.addEventListener('click',    doConfirm, { once: true });
    cancelBtn.addEventListener('click', cleanup,  { once: true });
    dialog.addEventListener('keydown', (e) => { if (e.key === 'Escape') cleanup(); }, { once: true });
  }

  document.getElementById('settingsClearProgress')?.addEventListener('click', () => {
    showConfirm(
      'Clear all progress?',
      'This will permanently delete all your topic checkmarks, flashcard data, practice scores, points, and streak. Your account is kept.',
      () => {
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith('fw_') && !k.startsWith('fw_dark') && !k.startsWith('fw_font') && !k.startsWith('fw_notif') && !k.startsWith('fw_privacy') && !k.startsWith('fw_lb')) {
            keys.push(k);
          }
        }
        keys.forEach(k => localStorage.removeItem(k));
        window.fwShowToast?.('Progress cleared');
        setTimeout(() => window.location.reload(), 800);
      }
    );
  });

  document.getElementById('settingsDeleteAccount')?.addEventListener('click', () => {
    showConfirm(
      'Delete your account?',
      'This will permanently delete your fiveward account and all associated data. This action cannot be undone.',
      async () => {
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith('fw_')) keys.push(k);
        }
        keys.forEach(k => localStorage.removeItem(k));
        if (window.sb) {
          await window.sb.auth.signOut();
        }
        window.location.href = 'auth.html';
      }
    );
  });

  // =========================================================
  // NAVBAR DROPDOWN
  // =========================================================

  const trigger  = document.getElementById('userMenuTrigger');
  const dropdown = document.getElementById('userDropdown');

  if (trigger && dropdown) {
    const open  = () => { dropdown.hidden = false; trigger.setAttribute('aria-expanded', 'true');  trigger.classList.add('open'); };
    const close = () => { dropdown.hidden = true;  trigger.setAttribute('aria-expanded', 'false'); trigger.classList.remove('open'); };

    trigger.addEventListener('click', (e) => { e.stopPropagation(); dropdown.hidden ? open() : close(); });
    document.addEventListener('click',   () => close());
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });

    document.getElementById('signOutBtn')?.addEventListener('click', async () => {
      if (window.sb) await window.sb.auth.signOut();
      window.location.href = 'auth.html';
    });
  }

  // =========================================================
  // INIT
  // =========================================================

  loadAccountInfo();

})();
