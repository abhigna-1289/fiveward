// =============================================================
// FIVEWARD — Settings Page
//
// localStorage keys managed here:
//   fw_lb_show_on_page     → boolean  (leaderboard card on progress page)
//   fw_lb_show_me          → boolean  (show user on leaderboard)
//   fw_lb_username_display → string   ('full' | 'first' | 'anon')
//   fw_dark_mode           → boolean  (dark theme applied to all pages)
//   fw_font_size           → string   ('small' | 'medium' | 'large')
//   fw_notif_email         → boolean
//   fw_notif_reminder      → boolean
//   fw_notif_reminder_time → string   ('HH:MM')
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
  // SIDEBAR NAVIGATION
  // =========================================================

  const navItems = document.querySelectorAll('.settings-nav-item');
  const sections = document.querySelectorAll('.settings-section');

  function showSection(id) {
    sections.forEach(s => { s.hidden = s.id !== id; });
    navItems.forEach(btn => {
      const matches = ('section' + btn.dataset.section.charAt(0).toUpperCase() + btn.dataset.section.slice(1)) === id;
      btn.classList.toggle('active', matches);
    });
  }

  navItems.forEach(btn => {
    btn.addEventListener('click', () => {
      const sectionId = 'section' + btn.dataset.section.charAt(0).toUpperCase() + btn.dataset.section.slice(1);
      showSection(sectionId);
      history.replaceState(null, '', '#' + btn.dataset.section);
    });
  });

  function applyHash() {
    const hash = window.location.hash.replace('#', '');
    if (hash) {
      const target = document.getElementById('section' + hash.charAt(0).toUpperCase() + hash.slice(1));
      if (target) { showSection(target.id); return; }
    }
    showSection('sectionAccount');
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

  document.getElementById('stEditProfileBtn')?.addEventListener('click', () => {
    window.fwShowToast?.('Profile editing coming soon');
  });

  document.getElementById('stChangePasswordBtn')?.addEventListener('click', () => {
    window.fwShowToast?.('Password management coming soon');
  });

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

  wireToggle('stEmailNotif',   'fw_notif_email',    true);
  wireToggle('stStudyReminder','fw_notif_reminder',  false);
  if (localStorage.getItem('fw_notif_browser') === null) {
    localStorage.setItem('fw_notif_browser', 'true');
  }
  wireToggle('stBrowserNotif', 'fw_notif_browser', true);

  const reminderTimeEl = document.getElementById('stReminderTime');
  if (reminderTimeEl) {
    reminderTimeEl.value = ls('fw_notif_reminder_time', '18:00') || '18:00';
    reminderTimeEl.addEventListener('change', () => {
      lsSet('fw_notif_reminder_time', reminderTimeEl.value);
    });
  }

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
