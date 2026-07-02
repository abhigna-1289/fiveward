// =============================================================
// FIVEWARD — Subject Page
// Handles tab switching, progress tab, settings tab, and user dropdown.
// =============================================================

(function initSubjectPage() {

  // =========================================================
  // UNIT DATA  (mirrors unit.js and progress.js)
  // =========================================================

  const UNITS = {
    1: { name: 'Creative Development', topics: [
      { id: 1, num: '1.1', name: 'Collaboration' },
      { id: 2, num: '1.2', name: 'Program Function and Purpose' },
      { id: 3, num: '1.3', name: 'Program Design and Development' },
      { id: 4, num: '1.4', name: 'Identifying and Correcting Errors' },
    ]},
    2: { name: 'Data', topics: [
      { id: 1, num: '2.1', name: 'Binary Numbers' },
      { id: 2, num: '2.2', name: 'Data Compression' },
      { id: 3, num: '2.3', name: 'Extracting Information from Data' },
      { id: 4, num: '2.4', name: 'Using Programs with Data' },
    ]},
    3: { name: 'Algorithms and Programming', topics: [
      { id: 1,  num: '3.1',  name: 'Variables and Assignments' },
      { id: 2,  num: '3.2',  name: 'Data Abstraction' },
      { id: 3,  num: '3.3',  name: 'Mathematical Expressions' },
      { id: 4,  num: '3.4',  name: 'Strings' },
      { id: 5,  num: '3.5',  name: 'Boolean Expressions' },
      { id: 6,  num: '3.6',  name: 'Conditionals' },
      { id: 7,  num: '3.7',  name: 'Nested Conditionals' },
      { id: 8,  num: '3.8',  name: 'Iteration' },
      { id: 9,  num: '3.9',  name: 'Developing Algorithms' },
      { id: 10, num: '3.10', name: 'Lists' },
      { id: 11, num: '3.11', name: 'Binary Search' },
      { id: 12, num: '3.12', name: 'Calling Procedures' },
      { id: 13, num: '3.13', name: 'Developing Procedures' },
      { id: 14, num: '3.14', name: 'Libraries' },
      { id: 15, num: '3.15', name: 'Random Values' },
      { id: 16, num: '3.16', name: 'Simulations' },
      { id: 17, num: '3.17', name: 'Algorithmic Efficiency' },
      { id: 18, num: '3.18', name: 'Undecidable Problems' },
    ]},
    4: { name: 'Computer Systems and Networks', topics: [
      { id: 1, num: '4.1', name: 'The Internet' },
      { id: 2, num: '4.2', name: 'Fault Tolerance' },
      { id: 3, num: '4.3', name: 'Parallel and Distributed Computing' },
    ]},
    5: { name: 'Impact of Computing', topics: [
      { id: 1, num: '5.1', name: 'Beneficial and Harmful Effects' },
      { id: 2, num: '5.2', name: 'Digital Divide' },
      { id: 3, num: '5.3', name: 'Computing Bias' },
      { id: 4, num: '5.4', name: 'Crowdsourcing' },
      { id: 5, num: '5.5', name: 'Legal and Ethical Concerns' },
      { id: 6, num: '5.6', name: 'Safe Computing' },
    ]},
  };

  const TOTAL_TOPICS = 35;

  // =========================================================
  // HELPERS
  // =========================================================

  function getCompletedSet(unitNum) {
    try {
      return new Set(JSON.parse(localStorage.getItem(`fw_progress_u${unitNum}`) || '[]'));
    } catch { return new Set(); }
  }

  function getCompletedCount(unitNum) {
    return getCompletedSet(unitNum).size;
  }

  function getStreak() {
    try {
      const raw = JSON.parse(localStorage.getItem('fw_streak_dates') || '[]');
      if (!raw.length) return 0;
      const dates = [...new Set(raw)].sort().reverse();
      const today = new Date().toISOString().slice(0, 10);
      let streak = 0;
      let expected = today;
      for (const d of dates) {
        if (d === expected) {
          streak++;
          const prev = new Date(expected);
          prev.setDate(prev.getDate() - 1);
          expected = prev.toISOString().slice(0, 10);
        } else { break; }
      }
      return streak;
    } catch { return 0; }
  }

  function getAvgScore() {
    try {
      const results = JSON.parse(localStorage.getItem('fw_pq_results') || '[]');
      if (!results.length) return null;
      const sum = results.reduce((acc, r) => acc + (r.pct || 0), 0);
      return Math.round(sum / results.length);
    } catch { return null; }
  }

  // =========================================================
  // HEADER PROGRESS  (Units tab overall bar)
  // =========================================================

  (function loadHeaderProgress() {
    const unitCards = document.querySelectorAll('.unit-list .unit-card');
    let totalCompleted = 0;

    unitCards.forEach((card, index) => {
      const unitNum    = index + 1;
      const unit       = UNITS[unitNum];
      if (!unit) return;
      const completed  = getCompletedCount(unitNum);
      totalCompleted  += completed;
      const pct        = Math.round((completed / unit.topics.length) * 100);

      const pctEl = card.querySelector('.unit-card__progress-pct');
      const fill  = card.querySelector('.unit-card__progress-fill');
      const bar   = card.querySelector('.unit-card__progress-bar');
      if (pctEl) pctEl.textContent = `${pct}%`;
      if (fill)  fill.style.width  = `${pct}%`;
      if (bar)   bar.setAttribute('aria-valuenow', pct);
    });

    const overallPct   = Math.round((totalCompleted / TOTAL_TOPICS) * 100);
    const overallPctEl = document.getElementById('overallProgressPct');
    const overallFill  = document.getElementById('overallProgressFill');
    const overallBar   = document.querySelector('.subject-header-card__progress-bar');
    if (overallPctEl) overallPctEl.textContent = `${overallPct}%`;
    if (overallFill)  overallFill.style.width   = `${overallPct}%`;
    if (overallBar)   overallBar.setAttribute('aria-valuenow', overallPct);
  })();

  // =========================================================
  // PROGRESS TAB
  // =========================================================

  function renderProgressTab() {
    const CIRCUMFERENCE = 2 * Math.PI * 52;

    // Overall completion ring
    let totalCompleted = 0;
    for (let u = 1; u <= 5; u++) totalCompleted += getCompletedCount(u);
    const pct = Math.round((totalCompleted / TOTAL_TOPICS) * 100);

    const ringFill = document.getElementById('spRingFill');
    if (ringFill) {
      ringFill.style.strokeDasharray  = CIRCUMFERENCE;
      ringFill.style.strokeDashoffset = CIRCUMFERENCE * (1 - pct / 100);
    }
    const pctEl = document.getElementById('spCompletionPct');
    if (pctEl) pctEl.textContent = pct + '%';

    // Streak
    const streakEl = document.getElementById('spStreakNum');
    if (streakEl) streakEl.textContent = getStreak();

    // Avg score
    const avgEl  = document.getElementById('spAvgScore');
    const avg    = getAvgScore();
    if (avgEl) avgEl.textContent = avg !== null ? avg + '%' : '—';

    // Unit expand list
    renderUnitsList();

    // Trigger staggered fade-up
    setTimeout(() => {
      document.querySelectorAll('.sp-anim').forEach(el => el.classList.add('sp-anim--active'));
    }, 50);
  }

  function renderUnitsList() {
    const container = document.getElementById('spUnitsList');
    if (!container) return;
    container.innerHTML = '';

    Object.entries(UNITS).forEach(([unitNum, unit]) => {
      const n         = parseInt(unitNum);
      const completed = getCompletedSet(n);
      const total     = unit.topics.length;
      const done      = unit.topics.filter(t => completed.has(t.id)).length;
      const pct       = total > 0 ? Math.round((done / total) * 100) : 0;
      const status    = done === 0 ? 'not-started' : done === total ? 'completed' : 'in-progress';

      const topicsHTML = unit.topics.map(topic => {
        const isDone = completed.has(topic.id);
        const checkIcon = isDone
          ? `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>`
          : '';
        const badge = isDone
          ? `<span class="sp-badge sp-badge--done">Done</span>`
          : `<span class="sp-badge sp-badge--not-started">Not Started</span>`;
        return `
          <div class="sp-topic-row">
            <span class="sp-topic-check ${isDone ? 'sp-topic-check--done' : ''}">${checkIcon}</span>
            <span class="sp-topic-name">${topic.num} ${topic.name}</span>
            ${badge}
          </div>`;
      }).join('');

      const card = document.createElement('div');
      card.className = `sp-unit-card sp-unit-card--${status}`;
      card.innerHTML = `
        <div class="sp-unit-card__hd" role="button" tabindex="0" aria-expanded="false">
          <div class="sp-unit-card__left">
            <span class="sp-unit-card__num">${n}</span>
            <div class="sp-unit-card__info">
              <span class="sp-unit-card__name">${unit.name}</span>
              <div class="sp-unit-card__bar-track">
                <div class="sp-unit-card__bar-fill" style="width:${pct}%"></div>
              </div>
            </div>
          </div>
          <div class="sp-unit-card__right">
            <span class="sp-unit-card__pct">${pct}%</span>
            <svg class="sp-unit-card__chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
          </div>
        </div>
        <div class="sp-unit-card__topics">${topicsHTML}</div>`;

      const hd       = card.querySelector('.sp-unit-card__hd');
      const topicsEl = card.querySelector('.sp-unit-card__topics');

      function toggleExpand() {
        const isOpen = card.classList.contains('sp-unit-card--open');
        if (isOpen) {
          topicsEl.style.maxHeight = topicsEl.scrollHeight + 'px';
          requestAnimationFrame(() => requestAnimationFrame(() => { topicsEl.style.maxHeight = '0'; }));
          card.classList.remove('sp-unit-card--open');
          hd.setAttribute('aria-expanded', 'false');
        } else {
          topicsEl.style.maxHeight = topicsEl.scrollHeight + 'px';
          card.classList.add('sp-unit-card--open');
          hd.setAttribute('aria-expanded', 'true');
        }
      }

      hd.addEventListener('click', toggleExpand);
      hd.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleExpand(); }
      });

      container.appendChild(card);
    });
  }

  // =========================================================
  // SETTINGS TAB
  // =========================================================

  function wirePillGroup(groupId, storageKey, defaultVal) {
    const group = document.getElementById(groupId);
    if (!group) return;
    const saved = localStorage.getItem(storageKey) || defaultVal;
    group.querySelectorAll('.sp-pill').forEach(pill => {
      if (pill.dataset.value === saved) pill.classList.add('sp-pill--active');
      pill.addEventListener('click', () => {
        group.querySelectorAll('.sp-pill').forEach(p => p.classList.remove('sp-pill--active'));
        pill.classList.add('sp-pill--active');
        localStorage.setItem(storageKey, pill.dataset.value);
      });
    });
  }

  function initSettingsTab() {
    wirePillGroup('spStudyMode', 'fw_default_study_mode', 'guide');
    wirePillGroup('spDuration',  'fw_default_duration',   '30');

    const autoToggle = document.getElementById('spAutoAdvance');
    if (autoToggle) {
      autoToggle.checked = localStorage.getItem('fw_auto_advance') === 'true';
      autoToggle.addEventListener('change', () => {
        localStorage.setItem('fw_auto_advance', autoToggle.checked);
      });
    }

    const modal      = document.getElementById('spResetModal');
    const resetBtn   = document.getElementById('spResetBtn');
    const cancelBtn  = document.getElementById('spModalCancel');
    const confirmBtn = document.getElementById('spModalConfirm');

    resetBtn?.addEventListener('click', () => { modal.hidden = false; });
    cancelBtn?.addEventListener('click', () => { modal.hidden = true; });
    modal?.addEventListener('click', e => { if (e.target === modal) modal.hidden = true; });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && modal && !modal.hidden) modal.hidden = true;
    });

    confirmBtn?.addEventListener('click', () => {
      ['fw_progress_u1','fw_progress_u2','fw_progress_u3','fw_progress_u4','fw_progress_u5',
       'fw_pq_results','fw_activity_log','fw_study_log','fw_streak_dates','fw_points']
        .forEach(k => localStorage.removeItem(k));
      modal.hidden = true;
      window.fwShowToast?.('Progress reset successfully');
      // Re-render header and progress tab
      loadHeaderProgress();
      document.querySelectorAll('.sp-anim').forEach(el => el.classList.remove('sp-anim--active'));
      renderProgressTab();
    });
  }

  // Expose loadHeaderProgress so confirmBtn can call it after reset
  function loadHeaderProgress() {
    const unitCards = document.querySelectorAll('.unit-list .unit-card');
    let totalCompleted = 0;
    unitCards.forEach((card, index) => {
      const unitNum   = index + 1;
      const unit      = UNITS[unitNum];
      if (!unit) return;
      const completed = getCompletedCount(unitNum);
      totalCompleted += completed;
      const pct       = Math.round((completed / unit.topics.length) * 100);
      const pctEl = card.querySelector('.unit-card__progress-pct');
      const fill  = card.querySelector('.unit-card__progress-fill');
      const bar   = card.querySelector('.unit-card__progress-bar');
      if (pctEl) pctEl.textContent = `${pct}%`;
      if (fill)  fill.style.width  = `${pct}%`;
      if (bar)   bar.setAttribute('aria-valuenow', pct);
    });
    const overallPct   = Math.round((totalCompleted / TOTAL_TOPICS) * 100);
    const overallPctEl = document.getElementById('overallProgressPct');
    const overallFill  = document.getElementById('overallProgressFill');
    const overallBar   = document.querySelector('.subject-header-card__progress-bar');
    if (overallPctEl) overallPctEl.textContent = `${overallPct}%`;
    if (overallFill)  overallFill.style.width   = `${overallPct}%`;
    if (overallBar)   overallBar.setAttribute('aria-valuenow', overallPct);
  }

  // =========================================================
  // TAB SWITCHING
  // =========================================================

  const tabs   = document.querySelectorAll('.subject-tab');
  const panels = document.querySelectorAll('.subject-panel');
  let _settingsInited = false;

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetId = tab.getAttribute('aria-controls');

      tabs.forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');

      panels.forEach(panel => {
        if (panel.id === targetId) panel.removeAttribute('hidden');
        else panel.setAttribute('hidden', '');
      });

      if (tab.id === 'tabProgress') {
        document.querySelectorAll('.sp-anim').forEach(el => el.classList.remove('sp-anim--active'));
        renderProgressTab();
      } else if (tab.id === 'tabSettings' && !_settingsInited) {
        initSettingsTab();
        _settingsInited = true;
      }
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
