// =============================================================
// FIVEWARD — Explore Page
// Enrollment logic + user dropdown.
// localStorage key: fw_enrolled = JSON array of subject IDs
// =============================================================

(function initExplorePage() {

  // --- Enrollment helpers ------------------------------------

  function getEnrolled() {
    try {
      return JSON.parse(localStorage.getItem('fw_enrolled') || '[]');
    } catch {
      return [];
    }
  }

  function isEnrolled(id) {
    return getEnrolled().includes(id);
  }

  function enroll(id) {
    const list = getEnrolled();
    if (!list.includes(id)) {
      list.push(id);
      localStorage.setItem('fw_enrolled', JSON.stringify(list));
    }
  }

  function unenroll(id) {
    const list = getEnrolled().filter(x => x !== id);
    localStorage.setItem('fw_enrolled', JSON.stringify(list));
    if (id === 'ap-csp') _clearSubjectData();
  }

  function _clearSubjectData() {
    const prefixes = [
      'fw_progress_u', 'fw_fc_', 'fw_pq_',
      'fw_unit_bonus_', 'fw_study_log', 'fw_pq_results',
      'fw_activity_log', 'fw_streak_dates', 'fw_points',
    ];
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && prefixes.some(p => k.startsWith(p))) keys.push(k);
    }
    keys.forEach(k => localStorage.removeItem(k));
  }

  // --- Render button row states ------------------------------

  function renderEnrolled(row, id) {
    row.innerHTML = `
      <button class="explore-card__enrolled-btn" disabled type="button">Enrolled ✓</button>
      <button class="explore-card__unenroll-btn" type="button">Unenroll</button>`;
    row.querySelector('.explore-card__unenroll-btn').addEventListener('click', () => {
      unenroll(id);
      renderUnenrolled(row, id);
    });
  }

  function renderUnenrolled(row, id) {
    row.innerHTML = `<button class="explore-card__enroll-btn btn btn--primary" type="button">Enroll</button>`;
    row.querySelector('.explore-card__enroll-btn').addEventListener('click', () => {
      enroll(id);
      renderEnrolled(row, id);
    });
  }

  // --- AP CSP button row ------------------------------------

  const apCspRow = document.getElementById('apCspBtnRow');
  if (apCspRow) {
    if (isEnrolled('ap-csp')) {
      renderEnrolled(apCspRow, 'ap-csp');
    } else {
      renderUnenrolled(apCspRow, 'ap-csp');
    }
  }

  // --- User dropdown -----------------------------------------

  const trigger  = document.getElementById('userMenuTrigger');
  const dropdown = document.getElementById('userDropdown');

  if (trigger && dropdown) {
    function openDropdown() {
      dropdown.hidden = false;
      trigger.setAttribute('aria-expanded', 'true');
      trigger.classList.add('open');
    }
    function closeDropdown() {
      dropdown.hidden = true;
      trigger.setAttribute('aria-expanded', 'false');
      trigger.classList.remove('open');
    }

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.hidden ? openDropdown() : closeDropdown();
    });
    document.addEventListener('click', () => closeDropdown());
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeDropdown();
    });

    if (window.sb) {
      window.sb.auth.getUser().then(({ data: { user } }) => {
        if (!user) return;
        const fullName = user.user_metadata?.full_name || '';
        document.getElementById('dropdownName').textContent  = fullName || user.email;
        document.getElementById('dropdownEmail').textContent = user.email;
      });
    }

    document.getElementById('signOutBtn').addEventListener('click', async () => {
      if (window.sb) await signOut();
    });
  }

})();
