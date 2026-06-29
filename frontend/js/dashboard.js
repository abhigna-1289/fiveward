// =============================================================
// FIVEWARD — Dashboard Page
// Personalizes the welcome heading, renders enrolled subjects,
// and wires the user dropdown (settings + sign out).
// =============================================================

// --- Subject definitions (add more here as subjects launch) --
const SUBJECT_DEFS = {
  'ap-csp': {
    name:     'AP CSP',
    fullName: 'AP Computer Science Principles',
    desc:     '5 units · 35 topics',
    href:     'subject.html?subject=ap-csp',
    icon:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                 <polyline points="16 18 22 12 16 6"/>
                 <polyline points="8 6 2 12 8 18"/>
               </svg>`,
    getProgress() {
      // Reads same localStorage keys as subject.js
      const counts = { 1: 4, 2: 4, 3: 18, 4: 3, 5: 6 };
      const total  = 35;
      let done = 0;
      for (let u = 1; u <= 5; u++) {
        try {
          const raw = localStorage.getItem(`fw_progress_u${u}`);
          done += raw ? JSON.parse(raw).length : 0;
        } catch { /* ignore */ }
      }
      return { done, total, pct: Math.round((done / total) * 100) };
    },
  },
};

// --- Enrollment helpers --------------------------------------

function getEnrolled() {
  try {
    return JSON.parse(localStorage.getItem('fw_enrolled') || '[]');
  } catch {
    return [];
  }
}

// --- Render subjects -----------------------------------------

function renderSubjects() {
  const grid       = document.getElementById('subjectGrid');
  const emptyState = document.getElementById('subjectEmptyState');
  const enrolled   = getEnrolled();

  if (!enrolled.length) {
    grid.innerHTML = '';
    emptyState.hidden = false;
    return;
  }

  emptyState.hidden = true;

  grid.innerHTML = enrolled
    .filter(id => SUBJECT_DEFS[id])
    .map(id => {
      const s = SUBJECT_DEFS[id];
      const { pct } = s.getProgress();
      return `
        <div class="subject-card subject-card--active">
          <div class="subject-card__icon subject-card__icon--active" aria-hidden="true">
            ${s.icon}
          </div>
          <div class="subject-card__body">
            <h3 class="subject-card__name">${s.name}</h3>
            <p class="subject-card__full-name">${s.fullName}</p>
            <p class="subject-card__desc">${s.desc}</p>
          </div>
          <div class="subject-card__progress">
            <div class="subject-card__progress-bar" role="progressbar"
                 aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"
                 aria-label="${s.name} completion">
              <div class="subject-card__progress-fill" style="width:${pct}%"></div>
            </div>
            <span class="subject-card__progress-label">${pct}% complete</span>
          </div>
          <a href="${s.href}" class="btn btn--primary subject-card__btn">Study Now</a>
        </div>`;
    })
    .join('');
}

// --- Main init -----------------------------------------------

(async function initDashboard() {

  renderSubjects();

  // --- Welcome message + dropdown user info ------------------
  if (window.sb) {
    const { data: { user } } = await window.sb.auth.getUser();
    if (user) {
      const fullName  = user.user_metadata?.full_name || '';
      const firstName = fullName.split(' ')[0] || user.email.split('@')[0] || 'there';

      document.getElementById('welcomeHeading').textContent = `Welcome back, ${firstName}!`;

      document.getElementById('dropdownName').textContent  = fullName || user.email;
      document.getElementById('dropdownEmail').textContent = user.email;
    }
  }

  // --- User dropdown -----------------------------------------
  const trigger  = document.getElementById('userMenuTrigger');
  const dropdown = document.getElementById('userDropdown');

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

  document.getElementById('signOutBtn').addEventListener('click', async () => {
    if (window.sb) await signOut();
  });

})();
