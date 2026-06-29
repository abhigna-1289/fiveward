// =============================================================
// FIVEWARD — Subject Page
// Handles tab switching and the user dropdown.
// =============================================================

(function initSubjectPage() {

  // --- Progress (reads the same localStorage keys as unit.js) --

  // Topic counts must match the UNITS data in unit.js
  const UNIT_TOPIC_COUNTS = { 1: 4, 2: 4, 3: 18, 4: 3, 5: 6 };
  const TOTAL_TOPICS = 35;

  function getCompletedCount(unitNum) {
    try {
      const raw = localStorage.getItem(`fw_progress_u${unitNum}`);
      return raw ? JSON.parse(raw).length : 0;
    } catch {
      return 0;
    }
  }

  (function loadProgress() {
    const unitCards = document.querySelectorAll('.unit-list .unit-card');
    let totalCompleted = 0;

    unitCards.forEach((card, index) => {
      const unitNum   = index + 1;
      const topicCount = UNIT_TOPIC_COUNTS[unitNum];
      if (!topicCount) return;

      const completed = getCompletedCount(unitNum);
      totalCompleted += completed;
      const pct = Math.round((completed / topicCount) * 100);

      const pctEl = card.querySelector('.unit-card__progress-pct');
      const fill  = card.querySelector('.unit-card__progress-fill');
      const bar   = card.querySelector('.unit-card__progress-bar');

      if (pctEl) pctEl.textContent = `${pct}%`;
      if (fill)  fill.style.width  = `${pct}%`;
      if (bar)   bar.setAttribute('aria-valuenow', pct);
    });

    // Overall progress header
    const overallPct = Math.round((totalCompleted / TOTAL_TOPICS) * 100);

    const overallPctEl = document.getElementById('overallProgressPct');
    const overallFill  = document.getElementById('overallProgressFill');
    const overallBar   = document.querySelector('.subject-header-card__progress-bar');

    if (overallPctEl) overallPctEl.textContent = `${overallPct}%`;
    if (overallFill)  overallFill.style.width   = `${overallPct}%`;
    if (overallBar)   overallBar.setAttribute('aria-valuenow', overallPct);
  })();

  // --- Tab switching ----------------------------------------
  const tabs   = document.querySelectorAll('.subject-tab');
  const panels = document.querySelectorAll('.subject-panel');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetId = tab.getAttribute('aria-controls');

      // Update tab states
      tabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');

      // Show matching panel, hide others
      panels.forEach(panel => {
        if (panel.id === targetId) {
          panel.removeAttribute('hidden');
        } else {
          panel.setAttribute('hidden', '');
        }
      });
    });
  });

  // --- User dropdown ----------------------------------------
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

    // Populate dropdown with user info
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
