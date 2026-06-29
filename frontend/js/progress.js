// =============================================================
// FIVEWARD — Progress Tracker
// Reads all study data from localStorage and renders the page.
//
// localStorage keys consumed:
//   fw_progress_u1..5     → [topicId, ...]        (written by unit.js)
//   fw_study_log          → [{date,seconds}, ...]  (written by timer.js)
//   fw_pq_results         → [{date,unitNum,topicNum,topicName,type,pct,...}]
//   fw_activity_log       → [{date,label,sub}, ...]
//   fw_streak_dates       → ['YYYY-MM-DD', ...]
//   fw_points             → number (total points)
//   fw_lb_show_on_page    → boolean (show leaderboard card at all)
//   fw_lb_show_me         → boolean (show user on other leaderboards)
// =============================================================

(function initProgress() {

  // =========================================================
  // UNIT DEFINITIONS  (mirrors unit.js)
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

  // =========================================================
  // HELPERS
  // =========================================================

  function ls(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) ?? 'null') ?? fallback; }
    catch { return fallback; }
  }

  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function todayStr() { return new Date().toISOString().slice(0, 10); }

  function offsetDay(delta, base) {
    const d = base ? new Date(base) : new Date();
    d.setDate(d.getDate() + delta);
    return d.toISOString().slice(0, 10);
  }

  function relDate(isoStr) {
    const d = new Date(isoStr);
    if (d.toDateString() === new Date().toDateString()) return 'Today';
    if (d.toDateString() === new Date(Date.now() - 86400000).toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function relTime(isoStr) {
    return new Date(isoStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }

  // =========================================================
  // DATA CALCULATIONS
  // =========================================================

  function completedTopicsForUnit(n) {
    return new Set(ls(`fw_progress_u${n}`, []));
  }

  function topicInProgress(unitNum, topicId) {
    try {
      const gotit = ls(`fw_fc_gotit_u${unitNum}_t${topicId}`, []);
      const still = ls(`fw_fc_stilllearn_u${unitNum}_t${topicId}`, []);
      return gotit.length > 0 || still.length > 0;
    } catch { return false; }
  }

  function calcOverallCompletion() {
    let total = 0, done = 0;
    for (let n = 1; n <= 5; n++) {
      total += UNITS[n].topics.length;
      done  += completedTopicsForUnit(n).size;
    }
    return total > 0 ? Math.round((done / total) * 100) : 0;
  }

  function calcStudyTime() {
    const log      = ls('fw_study_log', []);
    const totalSec = log.reduce((s, e) => s + (e.seconds || 0), 0);
    return { h: Math.floor(totalSec / 3600), m: Math.floor((totalSec % 3600) / 60), totalSec };
  }

  function calcStreak() {
    const raw   = ls('fw_streak_dates', []);
    const dates = [...new Set(raw)].sort();
    if (!dates.length) return 0;
    const last = dates[dates.length - 1];
    if (last !== todayStr() && last !== offsetDay(-1)) return 0;
    let streak = 1, current = last;
    for (let i = dates.length - 2; i >= 0; i--) {
      if (dates[i] === offsetDay(-1, current)) { streak++; current = dates[i]; }
      else break;
    }
    return streak;
  }

  function calcAvgScore() {
    const results = ls('fw_pq_results', []);
    if (!results.length) return null;
    return Math.round(results.reduce((a, r) => a + (r.pct || 0), 0) / results.length);
  }

  function calcWeakAreas() {
    const results  = ls('fw_pq_results', []);
    const byTopic  = {};
    results.forEach(r => {
      const key = `${r.unitNum}-${r.topicNum}`;
      if (!byTopic[key]) byTopic[key] = { topicName: r.topicName || r.topicNum, pcts: [] };
      byTopic[key].pcts.push(r.pct || 0);
    });
    return Object.values(byTopic)
      .map(t => ({ ...t, avg: Math.round(t.pcts.reduce((a, b) => a + b, 0) / t.pcts.length) }))
      .sort((a, b) => a.avg - b.avg)
      .slice(0, 5);
  }

  function calcActivity() {
    return ls('fw_activity_log', []).slice(0, 5);
  }

  function getUserPoints() {
    return parseInt(localStorage.getItem('fw_points') || '0') || 0;
  }

  // =========================================================
  // SVG RING
  // =========================================================

  const CIRCUMFERENCE = 326.73;

  function setRing(pct) {
    const fill = document.getElementById('pgRingFill');
    if (fill) fill.style.strokeDashoffset = CIRCUMFERENCE * (1 - pct / 100);
    const label = document.getElementById('pgCompletionPct');
    if (label) label.textContent = pct + '%';
    const bar = document.getElementById('pgCompletionBar');
    if (bar) bar.style.width = pct + '%';
  }

  // =========================================================
  // RENDER — STAT CARDS
  // =========================================================

  function el(id) { return document.getElementById(id) || { textContent: '', style: {} }; }
  function setBarWidth(id, pct) { const b = document.getElementById(id); if (b) b.style.width = pct + '%'; }

  function renderStats() {
    const pct = calcOverallCompletion();
    setTimeout(() => setRing(pct), 80);

    const { h, m, totalSec } = calcStudyTime();
    el('pgStudyH').textContent = h;
    el('pgStudyM').textContent = m;
    setBarWidth('pgStudyBar', Math.min(totalSec / 72000 * 100, 100));

    const streak = calcStreak();
    el('pgStreakDays').textContent = streak;
    setBarWidth('pgStreakBar', Math.min(streak / 30 * 100, 100));

    const avg = calcAvgScore();
    if (avg !== null) {
      el('pgAvgScore').textContent = avg + '%';
      el('pgAvgUnit').textContent  = '';
      setBarWidth('pgAvgBar', avg);
    } else {
      el('pgAvgScore').textContent = '—';
    }

    // Total points (5th card)
    const pts = getUserPoints();
    el('pgTotalPoints').textContent = pts.toLocaleString();
    setBarWidth('pgPointsBar', Math.min(pts / 500 * 100, 100)); // 500pts = full bar
  }

  // =========================================================
  // RENDER — UNITS PANEL  (topic rows are clickable <a> links)
  // =========================================================

  const CHECK_SVG = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>`;

  function renderUnits() {
    const list = document.getElementById('pgUnitsList');
    if (!list) return;
    list.innerHTML = '';

    for (let n = 1; n <= 5; n++) {
      const unit      = UNITS[n];
      const completed = completedTopicsForUnit(n);
      const total     = unit.topics.length;
      const pct       = total > 0 ? Math.round((completed.size / total) * 100) : 0;
      const barCls    = pct === 100 ? '' : pct > 0 ? 'pg-unit-row__bar-fill--partial' : '';

      const row = document.createElement('div');
      row.className = 'pg-unit-row';
      row.innerHTML = `
        <button class="pg-unit-row__hd" type="button" aria-expanded="false">
          <span class="pg-unit-row__chevron">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>
          </span>
          <span class="pg-unit-row__name">Unit ${n}</span>
          <div class="pg-unit-row__bar-wrap">
            <div class="pg-unit-row__bar-fill ${barCls}" style="width:${pct}%"></div>
          </div>
          <span class="pg-unit-row__pct">${pct}%</span>
        </button>
        <div class="pg-unit-row__topics" role="list">
          ${unit.topics.map(t => {
            const isDone   = completed.has(t.id);
            const isIP     = !isDone && topicInProgress(n, t.id);
            const status   = isDone ? 'complete' : isIP ? 'inprogress' : 'notstarted';
            const dotHtml  = isDone
              ? `<span class="pg-topic-dot pg-topic-dot--complete">${CHECK_SVG}</span>`
              : `<span class="pg-topic-dot pg-topic-dot--${status}"></span>`;
            return `<a class="pg-topic-row pg-topic-row--${status}"
                       href="unit.html?unit=${n}&topic=${t.id}"
                       role="listitem"
                       aria-label="Go to ${t.num} ${t.name}">
              ${dotHtml}
              <span class="pg-topic-num">${t.num}</span>
              <span class="pg-topic-name">${escHtml(t.name)}</span>
            </a>`;
          }).join('')}
        </div>`;

      row.querySelector('.pg-unit-row__hd').addEventListener('click', () => {
        const expanded = row.classList.toggle('pg-unit-row--expanded');
        row.querySelector('.pg-unit-row__hd').setAttribute('aria-expanded', String(expanded));
      });

      list.appendChild(row);
    }
  }

  // =========================================================
  // RENDER — WEAK AREAS
  // =========================================================

  const WARN_SVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;

  function renderWeakAreas() {
    const container = document.getElementById('pgWeakList');
    if (!container) return;
    const items = calcWeakAreas();
    if (!items.length) {
      container.innerHTML = `<div class="pg-empty">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        <p>Complete some practice questions to see your weak areas.</p>
      </div>`;
      return;
    }
    container.innerHTML = items.map(item => `
      <div class="pg-weak-item">
        <span class="pg-weak-item__icon">${WARN_SVG}</span>
        <span class="pg-weak-item__name">${escHtml(item.topicName)}</span>
        <span class="pg-weak-item__score">${item.avg}%</span>
      </div>`).join('');
  }

  // =========================================================
  // RENDER — RECENT ACTIVITY
  // =========================================================

  function renderActivity() {
    const container = document.getElementById('pgActivityList');
    if (!container) return;
    const items = calcActivity();
    if (!items.length) {
      container.innerHTML = `<div class="pg-empty">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
        <p>Your recent study sessions will appear here once you start practicing.</p>
      </div>`;
      return;
    }
    container.innerHTML = items.map(item => `
      <div class="pg-activity-item">
        <span class="pg-activity-dot"></span>
        <div class="pg-activity-body">
          <span class="pg-activity-label">${escHtml(item.label)}</span>
          ${item.sub ? `<span class="pg-activity-sub">${escHtml(item.sub)}</span>` : ''}
        </div>
        <div class="pg-activity-time">
          <span class="pg-activity-date">${relDate(item.date)}</span>
          <span class="pg-activity-clock">${relTime(item.date)}</span>
        </div>
      </div>`).join('');
  }

  // =========================================================
  // RENDER — LEADERBOARD
  // Visibility is controlled by fw_lb_show_on_page (set in Settings).
  // Shows user's real fw_points alongside placeholder data for other users.
  // =========================================================

  const LB_OTHERS = [
    { name: 'alex_k',  score: 2450 },
    { name: 'sam_r',   score: 2150 },
    { name: 'jess_m',  score: 1980 },
    { name: 'riley_t', score: 1760 },
    { name: 'drew_l',  score: 1620 },
  ];

  const RANK_CLASSES = ['', 'pg-lb-rank--gold', 'pg-lb-rank--silver', 'pg-lb-rank--bronze'];

  const USER_SVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;

  function initLeaderboard() {
    const card = document.getElementById('pgLeaderboardCard');
    if (!card) return;

    const showOnPage = ls('fw_lb_show_on_page', true);
    if (!showOnPage) {
      card.hidden = true;
      return;
    }

    card.hidden = false;
    const container = document.getElementById('pgLeaderboard');
    const footer    = document.getElementById('pgLbFooter');
    if (!container) return;

    const userPoints = getUserPoints();

    // Merge user entry with placeholder data, sort descending
    const entries = [
      { name: 'You', score: userPoints, isYou: true },
      ...LB_OTHERS,
    ]
      .sort((a, b) => b.score - a.score)
      .slice(0, 6); // show top 6 to ensure user is visible even at bottom

    container.innerHTML = `<div class="pg-lb-list">
      ${entries.map((u, i) => {
        const rank     = i + 1;
        const rankCls  = RANK_CLASSES[rank] || '';
        const rowCls   = u.isYou ? 'pg-lb-row pg-lb-row--you' : 'pg-lb-row';
        const nameHtml = u.isYou
          ? `<span class="pg-lb-name">You <span class="pg-lb-you-badge">· your score</span></span>`
          : `<span class="pg-lb-name">${escHtml(u.name)}</span>`;
        return `<div class="${rowCls}">
          <span class="pg-lb-rank ${rankCls}">${rank}</span>
          <span class="pg-lb-avatar">${USER_SVG}</span>
          ${nameHtml}
          <span class="pg-lb-score">${u.score.toLocaleString()}</span>
        </div>`;
      }).join('')}
    </div>`;

    if (footer) footer.style.display = 'flex';
  }

  // =========================================================
  // USER DROPDOWN
  // =========================================================

  function initDropdown() {
    const trigger  = document.getElementById('userMenuTrigger');
    const dropdown = document.getElementById('userDropdown');
    if (!trigger || !dropdown) return;

    const open  = () => { dropdown.hidden = false; trigger.setAttribute('aria-expanded', 'true');  trigger.classList.add('open'); };
    const close = () => { dropdown.hidden = true;  trigger.setAttribute('aria-expanded', 'false'); trigger.classList.remove('open'); };

    trigger.addEventListener('click', (e) => { e.stopPropagation(); dropdown.hidden ? open() : close(); });
    document.addEventListener('click',   () => close());
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });

    if (window.sb) {
      window.sb.auth.getUser().then(({ data: { user } }) => {
        if (!user) return;
        const name    = user.user_metadata?.full_name || '';
        const nameEl  = document.getElementById('dropdownName');
        const emailEl = document.getElementById('dropdownEmail');
        const avatEl  = document.getElementById('userAvatar');
        if (nameEl)  nameEl.textContent  = name || user.email;
        if (emailEl) emailEl.textContent = user.email;
        if (avatEl && name) avatEl.textContent = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
      });
    }

    document.getElementById('signOutBtn')?.addEventListener('click', async () => {
      if (window.sb) await window.sb.auth.signOut();
      window.location.href = 'auth.html';
    });
  }

  // =========================================================
  // ENROLLMENT CHECK
  // =========================================================

  function isEnrolled() {
    try {
      return JSON.parse(localStorage.getItem('fw_enrolled') || '[]').includes('ap-csp');
    } catch { return false; }
  }

  function showNotEnrolledState() {
    document.getElementById('pgNotEnrolled')?.removeAttribute('hidden');
    document.querySelector('.pg-subject-header')?.style.setProperty('display', 'none');
    const grid = document.getElementById('pgStatsGrid');
    if (grid) grid.style.display = 'none';
    const layout = document.getElementById('pgLayout');
    if (layout) layout.style.display = 'none';
  }

  // =========================================================
  // INIT
  // =========================================================

  function init() {
    if (!isEnrolled()) {
      showNotEnrolledState();
      initDropdown();
      return;
    }
    renderStats();
    renderUnits();
    renderWeakAreas();
    renderActivity();
    initLeaderboard();
    initDropdown();
  }

  init();

})();
