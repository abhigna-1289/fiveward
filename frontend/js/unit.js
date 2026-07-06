// =============================================================
// FIVEWARD — Unit Page
// =============================================================

(function initUnitPage() {

  // =========================================================
  // UNIT DATA
  // =========================================================

  const UNITS = {
    1: {
      name: 'Creative Development',
      topics: [
        { id: 1, num: '1.1', name: 'Collaboration' },
        { id: 2, num: '1.2', name: 'Program Function and Purpose' },
        { id: 3, num: '1.3', name: 'Program Design and Development' },
        { id: 4, num: '1.4', name: 'Identifying and Correcting Errors' },
      ],
    },
    2: {
      name: 'Data',
      topics: [
        { id: 1, num: '2.1', name: 'Binary Numbers' },
        { id: 2, num: '2.2', name: 'Data Compression' },
        { id: 3, num: '2.3', name: 'Extracting Information from Data' },
        { id: 4, num: '2.4', name: 'Using Programs with Data' },
      ],
    },
    3: {
      name: 'Algorithms and Programming',
      topics: [
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
      ],
    },
    4: {
      name: 'Computer Systems and Networks',
      topics: [
        { id: 1, num: '4.1', name: 'The Internet' },
        { id: 2, num: '4.2', name: 'Fault Tolerance' },
        { id: 3, num: '4.3', name: 'Parallel and Distributed Computing' },
      ],
    },
    5: {
      name: 'Impact of Computing',
      topics: [
        { id: 1, num: '5.1', name: 'Beneficial and Harmful Effects' },
        { id: 2, num: '5.2', name: 'Digital Divide' },
        { id: 3, num: '5.3', name: 'Computing Bias' },
        { id: 4, num: '5.4', name: 'Crowdsourcing' },
        { id: 5, num: '5.5', name: 'Legal and Ethical Concerns' },
        { id: 6, num: '5.6', name: 'Safe Computing' },
      ],
    },
  };

  // =========================================================
  // LOAD UNIT FROM URL PARAMETER
  // =========================================================

  const params  = new URLSearchParams(window.location.search);
  const unitNum = Math.min(5, Math.max(1, parseInt(params.get('unit')) || 1));
  const unit    = UNITS[unitNum];

  document.title = `Unit ${unitNum}: ${unit.name} — AP CSP — fiveward`;
  const bcUnit = document.getElementById('breadcrumbUnit');
  if (bcUnit) bcUnit.textContent = `Unit ${unitNum}`;
  const panelTitle    = document.getElementById('unitPanelTitle');
  const panelSubtitle = document.getElementById('unitPanelSubtitle');
  if (panelTitle)    panelTitle.textContent    = `Unit ${unitNum}`;
  if (panelSubtitle) panelSubtitle.textContent = unit.name;

  // =========================================================
  // PROGRESS — localStorage, keyed per unit
  // =========================================================

  const PROGRESS_KEY = `fw_progress_u${unitNum}`;
  let completedTopics = new Set();

  function loadProgress() {
    try {
      completedTopics = new Set(JSON.parse(localStorage.getItem(PROGRESS_KEY) || '[]'));
    } catch { completedTopics = new Set(); }
  }

  function saveProgress() {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify([...completedTopics]));
  }

  function updateProgressBar() {
    try {
      const read  = key => new Set(JSON.parse(localStorage.getItem(key) || '[]'));
      const done  = read(`fw_fc_done_u${unitNum}`).size
                  + read(`fw_pq_done_u${unitNum}`).size
                  + read(`fw_sg_done_u${unitNum}`).size;
      const total = unit.topics.length * 3;
      const pct   = total > 0 ? Math.round((done / total) * 100) : 0;
      const label = document.getElementById('unitProgressLabel');
      const fill  = document.getElementById('unitProgressFill');
      if (label) label.textContent = `${pct}% Complete`;
      if (fill)  fill.style.width  = `${pct}%`;
    } catch {}
  }

  // Write one activity completion; return true if newly added.
  function _markActivityDone(key, topicId) {
    try {
      const s = new Set(JSON.parse(localStorage.getItem(key) || '[]'));
      if (s.has(topicId)) return false;
      s.add(topicId);
      localStorage.setItem(key, JSON.stringify([...s]));
      return true;
    } catch { return false; }
  }

  function _removeActivityDone(key, topicId) {
    try {
      const s = new Set(JSON.parse(localStorage.getItem(key) || '[]'));
      if (!s.has(topicId)) return;
      s.delete(topicId);
      localStorage.setItem(key, JSON.stringify([...s]));
    } catch {}
  }

  // After any activity write, check if all 3 are done → tick the checkbox.
  function _checkAndMarkFullyComplete(topicId) {
    try {
      const read  = key => new Set(JSON.parse(localStorage.getItem(key) || '[]'));
      const fcD   = read(`fw_fc_done_u${unitNum}`);
      const pqD   = read(`fw_pq_done_u${unitNum}`);
      const sgD   = read(`fw_sg_done_u${unitNum}`);
      if (fcD.has(topicId) && pqD.has(topicId) && sgD.has(topicId)) {
        if (!completedTopics.has(topicId)) {
          completedTopics.add(topicId);
          saveProgress();
          const item = document.querySelector(`.unit-topic-item[data-topic-id="${topicId}"]`);
          if (item) refreshCheckUI(item, true);
          if (completedTopics.size === unit.topics.length) {
            const bonusKey = `fw_unit_bonus_u${unitNum}`;
            if (!localStorage.getItem(bonusKey)) {
              localStorage.setItem(bonusKey, '1');
              _awardPoints(50, `Unit ${unitNum} Complete Bonus`);
            }
          }
        }
      }
    } catch {}
    updateProgressBar();
  }

  loadProgress();

  // =========================================================
  // RENDER TOPIC LIST
  // =========================================================

  const topicList = document.getElementById('unitTopicList');

  function renderTopics() {
    topicList.innerHTML = '';
    unit.topics.forEach(topic => {
      const done = completedTopics.has(topic.id);
      const li   = document.createElement('li');
      li.className = 'unit-topic-item';
      li.dataset.topicId = topic.id;
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', 'false');
      li.setAttribute('tabindex', '0');
      li.innerHTML = `
        <span class="unit-topic-item__num">${topic.num}</span>
        <span class="unit-topic-item__name">${topic.name}</span>
        <button class="unit-topic-item__check" type="button"
                aria-label="${done ? 'Unmark as complete' : 'Mark as complete'}">
          <svg class="check-empty" width="18" height="18" viewBox="0 0 24 24"
               fill="none" stroke="currentColor" stroke-width="1.8"
               style="${done ? 'display:none' : ''}">
            <circle cx="12" cy="12" r="9"/>
          </svg>
          <svg class="check-done" width="18" height="18" viewBox="0 0 24 24"
               fill="none" stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round"
               style="${done ? '' : 'display:none'}">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </button>`;
      topicList.appendChild(li);
    });
    attachTopicListeners();
    updateProgressBar();
  }

  function attachTopicListeners() {
    document.querySelectorAll('.unit-topic-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.closest('.unit-topic-item__check')) return;
        const id = parseInt(item.dataset.topicId);
        selectTopic(id);
        if (viewMode === 'review') setViewMode('topic', false);
      });
      item.addEventListener('keydown', (e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !e.target.closest('.unit-topic-item__check')) {
          e.preventDefault();
          selectTopic(parseInt(item.dataset.topicId));
        }
      });
      item.querySelector('.unit-topic-item__check')?.addEventListener('click', (e) => {
        e.stopPropagation();
        const id      = parseInt(item.dataset.topicId);
        const wasDown = completedTopics.has(id);
        if (wasDown) completedTopics.delete(id);
        else         completedTopics.add(id);
        saveProgress();
        refreshCheckUI(item, completedTopics.has(id));
        if (wasDown) {
          // Uncheck: remove from all 3 activity keys so % recalculates correctly
          _removeActivityDone(`fw_fc_done_u${unitNum}`, id);
          _removeActivityDone(`fw_pq_done_u${unitNum}`, id);
          _removeActivityDone(`fw_sg_done_u${unitNum}`, id);
        } else {
          // Manual check counts as all 3 activities done
          _markActivityDone(`fw_fc_done_u${unitNum}`, id);
          _markActivityDone(`fw_pq_done_u${unitNum}`, id);
          _markActivityDone(`fw_sg_done_u${unitNum}`, id);
          _logStudyDate();
          // 50pt bonus when all topics in the unit are checked — awarded only once
          if (completedTopics.size === unit.topics.length) {
            const bonusKey = `fw_unit_bonus_u${unitNum}`;
            if (!localStorage.getItem(bonusKey)) {
              localStorage.setItem(bonusKey, '1');
              _awardPoints(50, `Unit ${unitNum} Complete Bonus`);
            }
          }
        }
        updateProgressBar();
      });
    });
  }

  function refreshCheckUI(item, done) {
    const btn   = item.querySelector('.unit-topic-item__check');
    const empty = item.querySelector('.check-empty');
    const check = item.querySelector('.check-done');
    if (empty) empty.style.display = done ? 'none' : '';
    if (check) check.style.display = done ? '' : 'none';
    if (btn)   btn.setAttribute('aria-label', done ? 'Unmark as complete' : 'Mark as complete');
  }

  renderTopics();

  // =========================================================
  // TOPIC SELECTION & VIEW MODE
  // =========================================================

  let currentTopicId = 1;
  let viewMode       = 'topic'; // 'topic' | 'review'

  const topicNumEl  = document.getElementById('currentTopicNum');
  const topicNameEl = document.getElementById('currentTopicName');
  const reviewBtn   = document.getElementById('unitReviewBtn');

  function selectTopic(topicId) {
    const topic = unit.topics.find(t => t.id === topicId);
    if (!topic) return;
    currentTopicId = topicId;
    document.querySelectorAll('.unit-topic-item').forEach(item => {
      const active = parseInt(item.dataset.topicId) === topicId;
      item.classList.toggle('active', active);
      item.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    if (topicNumEl)  topicNumEl.textContent  = topic.num;
    if (topicNameEl) topicNameEl.textContent = topic.name;
    if (fcIsActive()) fcInit();
    if (pqIsActive()) pqInit();
  }

  function setViewMode(mode, syncBtn = true) {
    viewMode = mode;
    if (mode === 'review') {
      document.querySelectorAll('.unit-topic-item').forEach(item => {
        item.classList.remove('active');
        item.setAttribute('aria-selected', 'false');
      });
      if (topicNumEl)  topicNumEl.textContent  = '';
      if (topicNameEl) topicNameEl.textContent = `Unit ${unitNum} Review`;
      if (reviewBtn)   reviewBtn.classList.add('active');
      if (fcIsActive()) fcInit();
      if (pqIsActive()) pqInit();
    } else {
      selectTopic(currentTopicId);
      if (reviewBtn) reviewBtn.classList.remove('active');
    }
    if (syncBtn) {
      document.querySelectorAll('.study-mode-option').forEach(b => {
        b.classList.toggle('active', b.dataset.mode === (mode === 'review' ? 'review' : 'unit'));
      });
    }
  }

  const topicParam = parseInt(params.get('topic'));
  selectTopic((topicParam && unit.topics.some(t => t.id === topicParam)) ? topicParam : 1);

  // =========================================================
  // CONTENT TABS
  // =========================================================

  const contentTabs   = document.querySelectorAll('.unit-content-tab');
  const contentPanels = document.querySelectorAll('.unit-content-pane');

  function selectContentTab(targetId) {
    contentTabs.forEach(tab => {
      const active = tab.getAttribute('aria-controls') === targetId;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    contentPanels.forEach(panel => {
      if (panel.id === targetId) panel.removeAttribute('hidden');
      else panel.setAttribute('hidden', '');
    });
    if (targetId === 'cpanelFlashcards') fcLoad().then(() => fcInit());
    if (targetId === 'cpanelPractice')   pqLoad().then(() => pqInit());
    if (targetId === 'cpanelGuide' && viewMode !== 'review') {
      _markActivityDone(`fw_sg_done_u${unitNum}`, currentTopicId);
      _checkAndMarkFullyComplete(currentTopicId);
    }
  }

  contentTabs.forEach(tab => {
    tab.addEventListener('click', () => selectContentTab(tab.getAttribute('aria-controls')));
  });

  document.getElementById('qaGuide')?.addEventListener('click',      () => selectContentTab('cpanelGuide'));
  document.getElementById('qaFlashcards')?.addEventListener('click', () => selectContentTab('cpanelFlashcards'));
  document.getElementById('qaPractice')?.addEventListener('click',   () => selectContentTab('cpanelPractice'));

  // =========================================================
  // STUDY MODE CARD
  // =========================================================

  document.querySelectorAll('.study-mode-option').forEach(btn => {
    btn.addEventListener('click', () => {
      setViewMode(btn.dataset.mode === 'review' ? 'review' : 'topic');
    });
  });

  reviewBtn?.addEventListener('click', () => setViewMode('review'));

  // =========================================================
  // FLASHCARD ENGINE
  // =========================================================

  // --- Card data (fetched from JSON, indexed by topic number) -

  let fcCardsData   = {}; // { '1.1': [{id, front, back, topic}], ... }
  let fcReviewCards = []; // cards from unit-N-review.json

  async function fcLoad() {
    fcCardsData   = {};
    fcReviewCards = [];
    try {
      const r    = await fetch(`/data/subjects/ap-csp/flashcards/unit-${unitNum}.json?v=${Date.now()}`);
      const data = await r.json();
      (data.cards || []).forEach(card => {
        if (!fcCardsData[card.topic]) fcCardsData[card.topic] = [];
        fcCardsData[card.topic].push(card);
      });
    } catch(err) {
      console.error('[fiveward] Failed to load flashcards:', err);
    }
    try {
      const rr   = await fetch(`/data/subjects/ap-csp/flashcards/unit-${unitNum}-review.json?v=${Date.now()}`);
      const data = await rr.json();
      fcReviewCards = (data.cards || []).map(c => ({ ...c, _topicId: null }));
    } catch {
      // review file not yet created for this unit — silently ignored
    }
  }

  // --- State -----------------------------------------------

  let fcFilter        = 'all';
  let fcZoomIsFlipped = false;
  let fcNavAnimating  = false;
  let fcSidesFlipped  = localStorage.getItem('fw_fc_sides') === '1';

  let fcState = {
    allCards:         [],
    deck:             [],
    idx:              0,
    isFlipped:        false,
    gotItIds:         new Set(),
    starredIds:       new Set(),
    stillLearningIds: new Set(),
  };

  function fcStorageKey(type) {
    const scope = viewMode === 'review' ? 'final' : `t${currentTopicId}`;
    return `fw_fc_${type}_u${unitNum}_${scope}`;
  }

  function fcLoadStorage() {
    try {
      fcState.gotItIds         = new Set(JSON.parse(localStorage.getItem(fcStorageKey('gotit'))       || '[]'));
      fcState.starredIds       = new Set(JSON.parse(localStorage.getItem(fcStorageKey('starred'))     || '[]'));
      fcState.stillLearningIds = new Set(JSON.parse(localStorage.getItem(fcStorageKey('stilllearn')) || '[]'));
    } catch {
      fcState.gotItIds         = new Set();
      fcState.starredIds       = new Set();
      fcState.stillLearningIds = new Set();
    }
  }

  function fcSaveStorage() {
    localStorage.setItem(fcStorageKey('gotit'),      JSON.stringify([...fcState.gotItIds]));
    localStorage.setItem(fcStorageKey('starred'),    JSON.stringify([...fcState.starredIds]));
    localStorage.setItem(fcStorageKey('stilllearn'), JSON.stringify([...fcState.stillLearningIds]));
  }

  function fcIsActive() {
    return !document.getElementById('cpanelFlashcards')?.hasAttribute('hidden');
  }

  function fcGetAllCards() {
    if (viewMode === 'review') {
      return fcReviewCards.slice();
    }
    const topic = unit.topics.find(t => t.id === currentTopicId);
    return (fcCardsData[topic?.num] || []).map(c => ({ ...c, _topicId: currentTopicId }));
  }

  function fcBuildDeck() {
    const all = fcState.allCards;
    if (fcFilter === 'starred')        return all.filter(c => fcState.starredIds.has(c.id));
    if (fcFilter === 'still-learning') return all.filter(c => fcState.stillLearningIds.has(c.id));
    return [...all]; // 'all' — every card, always, no exceptions
  }

  // --- Init ------------------------------------------------

  function fcInit() {
    fcLoadStorage();

    const allCards = fcGetAllCards();
    fcState.allCards = allCards;

    const elEmpty       = document.getElementById('fcEmpty');
    const elUI          = document.getElementById('fcUI');
    const elComplete    = document.getElementById('fcComplete');
    const elToolbar     = document.getElementById('fcToolbar');
    const elFilterEmpty = document.getElementById('fcFilterEmpty');

    if (!allCards.length) {
      if (elEmpty)       elEmpty.hidden       = false;
      if (elUI)          elUI.hidden          = true;
      if (elComplete)    elComplete.hidden    = true;
      if (elToolbar)     elToolbar.hidden     = true;
      if (elFilterEmpty) elFilterEmpty.hidden = true;
      return;
    }

    if (elEmpty)       elEmpty.hidden       = true;
    if (elComplete)    elComplete.hidden    = true;
    if (elFilterEmpty) elFilterEmpty.hidden = true;
    if (elToolbar)     elToolbar.hidden     = false;
    const sidesBtn = document.getElementById('fcSwitchSides');
    if (sidesBtn) sidesBtn.hidden = false;
    fcUpdateSidesBtn();

    fcState.deck      = fcBuildDeck();
    fcState.idx       = 0;
    fcState.isFlipped = false;

    if (!fcState.deck.length) {
      if (elUI) elUI.hidden = true;
      if (sidesBtn) sidesBtn.hidden = true;
      const msgEl = document.getElementById('fcFilterEmptyMsg');
      if (msgEl) msgEl.textContent = fcFilter === 'starred'
        ? 'No starred cards yet. Click the star icon on any card to save it here.'
        : 'No cards marked Still Learning yet. Keep studying and mark cards as Still Learning as you go.';
      if (elFilterEmpty) elFilterEmpty.hidden = false;
      return;
    }

    if (elUI) elUI.hidden = false;
    fcRenderCard();
  }

  // --- Render ----------------------------------------------

  function fcRenderCard() {
    const card = fcState.deck[fcState.idx];
    if (!card) return;

    const cardEl = document.getElementById('fcCard');
    if (cardEl) {
      const inner = cardEl.querySelector('.fc-card-inner');
      if (inner) inner.style.transition = 'none';
      cardEl.classList.remove('fc-flipped');
      fcState.isFlipped = false;
      void cardEl.offsetWidth;
      if (inner) inner.style.transition = '';
    }

    const ft = document.getElementById('fcFrontText');
    const bt = document.getElementById('fcBackText');
    if (ft) ft.textContent = fcSidesFlipped ? card.back  : card.front;
    if (bt) bt.textContent = fcSidesFlipped ? card.front : card.back;
    const fl = document.getElementById('fcFrontLabel');
    const bl = document.getElementById('fcBackLabel');
    if (fl) fl.textContent = fcSidesFlipped ? 'DEFINITION' : 'TERM';
    if (bl) bl.textContent = fcSidesFlipped ? 'TERM' : 'DEFINITION';

    const ctr = document.getElementById('fcCounter');
    if (ctr) ctr.textContent = `${fcState.idx + 1} of ${fcState.deck.length}`;

    const prev = document.getElementById('fcPrev');
    const next = document.getElementById('fcNext');
    if (prev) prev.disabled = fcState.idx === 0;
    if (next) next.disabled = false;

    fcUpdateStar(fcState.starredIds.has(card.id));
    fcUpdateBadge(card);

    if (!document.getElementById('fcZoomModal')?.hidden) {
      fcZoomIsFlipped = false;
      const zoomCardEl = document.getElementById('fcZoomCard');
      if (zoomCardEl) {
        const inner = zoomCardEl.querySelector('.fc-zoom-card-inner');
        if (inner) inner.style.transition = 'none';
        zoomCardEl.classList.remove('fc-flipped');
        void zoomCardEl.offsetWidth;
        if (inner) inner.style.transition = '';
      }
      fcZoomSyncCard();
    }
  }


  // --- Actions ---------------------------------------------

  function fcFlip() {
    if (fcNavAnimating) return;
    const el = document.getElementById('fcCard');
    if (!el) return;
    fcState.isFlipped = !fcState.isFlipped;
    el.classList.toggle('fc-flipped', fcState.isFlipped);
  }

  function fcNav(dir) {
    if (fcNavAnimating) return;
    const n = fcState.idx + dir;
    if (n < 0) return;
    if (n >= fcState.deck.length) { if (dir > 0) fcShowComplete(); return; }

    const cardEl     = document.getElementById('fcCard');
    const zoomModal  = document.getElementById('fcZoomModal');
    const zoomCardEl = (!zoomModal?.hidden) ? document.getElementById('fcZoomCard') : null;

    if (!cardEl) { fcState.idx = n; fcRenderCard(); return; }

    fcNavAnimating = true;
    const exitCls  = dir > 0 ? 'fc-card--exit-left'  : 'fc-card--exit-right';
    const enterCls = dir > 0 ? 'fc-card--enter-right' : 'fc-card--enter-left';
    const allAnim  = ['fc-card--exit-left', 'fc-card--exit-right', 'fc-card--enter-right', 'fc-card--enter-left'];

    cardEl.classList.remove(...allAnim);
    if (zoomCardEl) zoomCardEl.classList.remove(...allAnim);
    void cardEl.offsetWidth;
    cardEl.classList.add(exitCls);
    if (zoomCardEl) zoomCardEl.classList.add(exitCls);

    cardEl.addEventListener('animationend', () => {
      cardEl.classList.remove(exitCls);
      if (zoomCardEl) zoomCardEl.classList.remove(exitCls);
      fcState.idx = n;
      fcRenderCard();
      void cardEl.offsetWidth;
      cardEl.classList.add(enterCls);
      if (zoomCardEl) zoomCardEl.classList.add(enterCls);
      cardEl.addEventListener('animationend', () => {
        cardEl.classList.remove(enterCls);
        if (zoomCardEl) zoomCardEl.classList.remove(enterCls);
        fcNavAnimating = false;
      }, { once: true });
    }, { once: true });
  }

  function fcGotIt() {
    const card = fcState.deck[fcState.idx];
    if (!card) return;
    [document.getElementById('fcGotIt'), document.getElementById('fcZoomGotIt')].forEach(b => {
      if (!b) return;
      b.classList.add('fc-btn--bounce');
      b.addEventListener('animationend', () => b.classList.remove('fc-btn--bounce'), { once: true });
    });
    if (fcState.gotItIds.has(card.id)) {
      fcState.gotItIds.delete(card.id);
      fcSaveStorage();
      fcUpdateBadge(card);
      return;
    }
    fcState.gotItIds.add(card.id);
    fcState.stillLearningIds.delete(card.id);
    fcSaveStorage();
    fcUpdateBadge(card);
  }

  function fcStillLearning() {
    const card = fcState.deck[fcState.idx];
    if (!card) return;
    [document.getElementById('fcStillLearning'), document.getElementById('fcZoomStillLearning')].forEach(b => {
      if (!b) return;
      b.classList.add('fc-btn--bounce');
      b.addEventListener('animationend', () => b.classList.remove('fc-btn--bounce'), { once: true });
    });
    if (fcState.stillLearningIds.has(card.id)) {
      fcState.stillLearningIds.delete(card.id);
      fcSaveStorage();
      fcUpdateBadge(card);
      return;
    }
    fcState.stillLearningIds.add(card.id);
    fcState.gotItIds.delete(card.id);
    fcSaveStorage();
    fcUpdateBadge(card);
  }

  function fcToggleStar() {
    const card = fcState.deck[fcState.idx];
    if (!card) return;
    if (fcState.starredIds.has(card.id)) fcState.starredIds.delete(card.id);
    else fcState.starredIds.add(card.id);
    fcSaveStorage();
    fcUpdateStar(fcState.starredIds.has(card.id));
  }

  function fcUpdateStar(starred) {
    ['fcStar', 'fcStarBack', 'fcZoomStar', 'fcZoomStarBack'].forEach(id => {
      const btn = document.getElementById(id);
      if (btn) btn.classList.toggle('fc-star-btn--active', starred);
    });
  }

  function fcUpdateBadge(card) {
    const html = fcState.gotItIds.has(card.id)
      ? '<span class="fc-badge fc-badge--got-it">Got It</span>'
      : fcState.stillLearningIds.has(card.id)
      ? '<span class="fc-badge fc-badge--still">Still Learning</span>'
      : '';
    ['fcBadgeFront', 'fcBadgeBack', 'fcZoomBadgeFront', 'fcZoomBadgeBack'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = html;
    });
  }

  function fcShuffle() {
    for (let i = fcState.deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [fcState.deck[i], fcState.deck[j]] = [fcState.deck[j], fcState.deck[i]];
    }
    fcState.idx = 0;
    const shuffleBtn = document.getElementById('fcShuffle');
    if (shuffleBtn) {
      shuffleBtn.classList.add('fc-shuffle-clicked');
      shuffleBtn.addEventListener('animationend', () => shuffleBtn.classList.remove('fc-shuffle-clicked'), { once: true });
    }
    fcRenderCard();
  }

  function fcRestart() {
    fcState.gotItIds.clear();
    fcState.stillLearningIds.clear();
    fcSaveStorage();
    fcInit();
  }

  function fcShowComplete() {
    fcZoomClose();
    const elUI = document.getElementById('fcUI');
    const elC  = document.getElementById('fcComplete');
    if (elUI) elUI.hidden = true;
    if (elC)  elC.hidden  = false;
    const total       = fcState.allCards.length;
    const gotIt       = fcState.gotItIds.size;
    const still       = fcState.stillLearningIds.size;
    const starred     = fcState.starredIds.size;
    const notReviewed = total - gotIt - still;
    const el1 = document.getElementById('fcStatGotIt');
    const el2 = document.getElementById('fcStatStill');
    const el3 = document.getElementById('fcStatStarred');
    const el4 = document.getElementById('fcStatNotReviewed');
    if (el1) el1.textContent = gotIt;
    if (el2) el2.textContent = still;
    if (el3) el3.textContent = starred;
    if (el4) el4.textContent = notReviewed;
    const btnStill   = document.getElementById('fcStudyStillLearning');
    const btnStarred = document.getElementById('fcStudyStarred');
    if (btnStill)   btnStill.disabled   = still === 0;
    if (btnStarred) btnStarred.disabled = starred === 0;

    // Award 3pts and update progress for completing all cards in a topic
    const ptsEarnedEl = document.getElementById('fcPointsEarned');
    if (viewMode !== 'review' && fcFilter === 'all' && fcState.allCards.length > 0) {
      const t = unit.topics.find(t => t.id === currentTopicId);
      _awardPoints(3, `Flashcards: ${t?.num || 'topic'}`);
      _logStudyDate();

      // Mark flashcard activity done; tick checkbox only when all 3 activities complete
      _markActivityDone(`fw_fc_done_u${unitNum}`, currentTopicId);
      _checkAndMarkFullyComplete(currentTopicId);

      if (ptsEarnedEl) {
        ptsEarnedEl.textContent = 'You earned 3 points for completing all flashcards in this topic!';
        ptsEarnedEl.hidden = false;
      }
    } else {
      if (ptsEarnedEl) ptsEarnedEl.hidden = true;
    }
  }

  // --- Zoom modal functions --------------------------------

  function fcZoomOpen() {
    const modal = document.getElementById('fcZoomModal');
    if (!modal) return;
    fcZoomIsFlipped = fcState.isFlipped;
    document.getElementById('fcZoomCard')?.classList.toggle('fc-flipped', fcZoomIsFlipped);
    fcZoomSyncCard();
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function fcZoomClose() {
    const modal = document.getElementById('fcZoomModal');
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    document.body.style.overflow = '';
  }

  function fcZoomFlip() {
    const cardEl = document.getElementById('fcZoomCard');
    if (!cardEl) return;
    fcZoomIsFlipped = !fcZoomIsFlipped;
    cardEl.classList.toggle('fc-flipped', fcZoomIsFlipped);
  }

  function fcZoomSyncCard() {
    const card = fcState.deck[fcState.idx];
    if (!card) return;
    const ft = document.getElementById('fcZoomFrontText');
    const bt = document.getElementById('fcZoomBackText');
    if (ft) ft.textContent = fcSidesFlipped ? card.back  : card.front;
    if (bt) bt.textContent = fcSidesFlipped ? card.front : card.back;
    const fl = document.getElementById('fcZoomFrontLabel');
    const bl = document.getElementById('fcZoomBackLabel');
    if (fl) fl.textContent = fcSidesFlipped ? 'DEFINITION' : 'TERM';
    if (bl) bl.textContent = fcSidesFlipped ? 'TERM' : 'DEFINITION';
    const ctr = document.getElementById('fcZoomCounter');
    if (ctr) ctr.textContent = `${fcState.idx + 1} of ${fcState.deck.length}`;
    const starred = fcState.starredIds.has(card.id);
    ['fcZoomStar', 'fcZoomStarBack'].forEach(id => {
      const btn = document.getElementById(id);
      if (btn) btn.classList.toggle('fc-star-btn--active', starred);
    });
    const prev = document.getElementById('fcZoomPrev');
    const next = document.getElementById('fcZoomNext');
    if (prev) prev.disabled = fcState.idx === 0;
    if (next) next.disabled = fcState.idx === fcState.deck.length - 1;
    const zcard = fcState.deck[fcState.idx];
    if (zcard) fcUpdateBadge(zcard);
  }

  // --- Filter pills ----------------------------------------

  function fcUpdateSidesBtn() {
    const btn = document.getElementById('fcSwitchSides');
    if (!btn) return;
    btn.classList.toggle('fc-sides-btn--active', fcSidesFlipped);
    const label = btn.querySelector('.fc-sides-label');
    if (label) label.textContent = fcSidesFlipped ? 'Definition → Term' : 'Term → Definition';
  }

  function fcSwitchSides() {
    fcSidesFlipped = !fcSidesFlipped;
    localStorage.setItem('fw_fc_sides', fcSidesFlipped ? '1' : '0');
    fcUpdateSidesBtn();
    const cardEl = document.getElementById('fcCard');
    if (cardEl) { cardEl.classList.remove('fc-flipped'); fcState.isFlipped = false; }
    const zoomCardEl = document.getElementById('fcZoomCard');
    if (zoomCardEl) { zoomCardEl.classList.remove('fc-flipped'); fcZoomIsFlipped = false; }
    if (fcState.deck.length) fcRenderCard();
  }

  function fcSetActiveFilter(f) {
    fcFilter = f;
    document.querySelectorAll('.fc-filter-btn').forEach(btn => {
      btn.classList.toggle('fc-filter-btn--active', btn.dataset.filter === f);
    });
  }

  // --- Wire listeners --------------------------------------

  document.getElementById('fcPrev')?.addEventListener('click', () => fcNav(-1));
  document.getElementById('fcNext')?.addEventListener('click', () => fcNav(1));
  document.getElementById('fcGotIt')?.addEventListener('click', fcGotIt);
  document.getElementById('fcStillLearning')?.addEventListener('click', fcStillLearning);
  document.getElementById('fcStar')?.addEventListener('click', fcToggleStar);
  document.getElementById('fcStarBack')?.addEventListener('click', fcToggleStar);
  document.getElementById('fcZoom')?.addEventListener('click', fcZoomOpen);
  document.getElementById('fcZoomBack')?.addEventListener('click', fcZoomOpen);
  document.getElementById('fcShuffle')?.addEventListener('click', fcShuffle);
  document.getElementById('fcRestart')?.addEventListener('click', fcRestart);

  document.getElementById('fcRestartAll')?.addEventListener('click', () => {
    fcState.gotItIds.clear();
    fcState.stillLearningIds.clear();
    fcSaveStorage();
    fcSetActiveFilter('all');
    fcInit();
  });
  document.getElementById('fcStudyStillLearning')?.addEventListener('click', () => {
    fcSetActiveFilter('still-learning');
    fcInit();
  });
  document.getElementById('fcStudyStarred')?.addEventListener('click', () => {
    fcSetActiveFilter('starred');
    fcInit();
  });

  document.getElementById('fcSwitchSides')?.addEventListener('click', fcSwitchSides);
  document.getElementById('fcStudyAllCards')?.addEventListener('click', () => {
    fcSetActiveFilter('all');
    fcInit();
  });

  document.getElementById('fcFilters')?.addEventListener('click', (e) => {
    const btn = e.target.closest('.fc-filter-btn');
    if (!btn) return;
    fcSetActiveFilter(btn.dataset.filter);
    fcInit();
  });

  document.getElementById('fcCard')?.addEventListener('click', (e) => {
    if (e.target.closest('.fc-icon-btn')) return;
    fcFlip();
  });
  document.getElementById('fcCard')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fcFlip(); }
  });

  // Swipe gesture
  let fcTouchStartX = 0;
  document.getElementById('fcCard')?.addEventListener('touchstart', (e) => {
    fcTouchStartX = e.changedTouches[0].clientX;
  }, { passive: true });
  document.getElementById('fcCard')?.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - fcTouchStartX;
    if (Math.abs(dx) > 50) fcNav(dx < 0 ? 1 : -1);
  }, { passive: true });

  // Keyboard shortcuts — only when flashcards pane is visible and zoom is closed
  document.addEventListener('keydown', (e) => {
    if (!fcIsActive() || document.getElementById('fcUI')?.hidden) return;
    if (!document.getElementById('fcZoomModal')?.hidden) return;
    if (fcNavAnimating) return;
    const tag = document.activeElement?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'BUTTON') return;
    if      (e.key === ' ')          { e.preventDefault(); fcFlip(); }
    else if (e.key === 'ArrowLeft')  { e.preventDefault(); fcNav(-1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); fcNav(1); }
    else if (e.key === 'g' || e.key === 'G') { e.preventDefault(); fcGotIt(); }
    else if (e.key === 's' || e.key === 'S') { e.preventDefault(); fcStillLearning(); }
  });

  // Inject full-card zoom modal into body
  (() => {
    const STAR_SVG = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
    const PREV_SVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>`;
    const NEXT_SVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>`;
    const modal = document.createElement('div');
    modal.id        = 'fcZoomModal';
    modal.className = 'fc-zoom-modal';
    modal.hidden    = true;
    modal.setAttribute('role',       'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Flashcard zoom view');
    modal.innerHTML = `
      <div class="fc-zoom-box">
        <button class="fc-zoom-close-btn" id="fcZoomClose" type="button" aria-label="Close">&times;</button>
        <div class="fc-zoom-nav-row">
          <button class="fc-nav-btn" id="fcZoomPrev" type="button" aria-label="Previous card">${PREV_SVG}</button>
          <div class="fc-zoom-card-wrap">
            <div class="fc-zoom-card" id="fcZoomCard" role="button" tabindex="0" aria-label="Flashcard — click to flip">
              <div class="fc-zoom-card-inner">
                <div class="fc-zoom-face fc-zoom-front">
                  <div class="fc-card-icons">
                    <button class="fc-icon-btn fc-star-btn" id="fcZoomStar" type="button" aria-label="Star this card">${STAR_SVG}</button>
                  </div>
                  <div class="fc-status-badge" id="fcZoomBadgeFront"></div>
                  <span class="fc-face-label" id="fcZoomFrontLabel">TERM</span>
                  <p class="fc-face-text" id="fcZoomFrontText"></p>
                  <span class="fc-flip-cue">Click to flip</span>
                </div>
                <div class="fc-zoom-face fc-zoom-back">
                  <div class="fc-card-icons">
                    <button class="fc-icon-btn fc-star-btn" id="fcZoomStarBack" type="button" aria-label="Star this card">${STAR_SVG}</button>
                  </div>
                  <div class="fc-status-badge" id="fcZoomBadgeBack"></div>
                  <span class="fc-face-label" id="fcZoomBackLabel">DEFINITION</span>
                  <p class="fc-face-text" id="fcZoomBackText"></p>
                  <span class="fc-flip-cue">Click to flip back</span>
                </div>
              </div>
            </div>
          </div>
          <button class="fc-nav-btn" id="fcZoomNext" type="button" aria-label="Next card">${NEXT_SVG}</button>
        </div>
        <span class="fc-zoom-counter" id="fcZoomCounter"></span>
        <div class="fc-zoom-actions">
          <button class="fc-zoom-got-btn"   id="fcZoomGotIt"         type="button">Got it</button>
          <button class="fc-zoom-still-btn" id="fcZoomStillLearning" type="button">Still Learning</button>
        </div>
      </div>`;
    document.body.appendChild(modal);

    modal.addEventListener('click', (e) => { if (e.target === modal) fcZoomClose(); });
    document.addEventListener('keydown', (e) => {
      if (modal.hidden) return;
      if      (e.key === 'Escape')     { fcZoomClose(); }
      else if (e.key === ' ')          { e.preventDefault(); fcZoomFlip(); }
      else if (e.key === 'ArrowLeft')  { e.preventDefault(); fcNav(-1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); fcNav(1); }
      else if (e.key === 'g' || e.key === 'G') { e.preventDefault(); fcGotIt(); }
      else if (e.key === 's' || e.key === 'S') { e.preventDefault(); fcStillLearning(); }
    });
    document.getElementById('fcZoomClose').addEventListener('click', fcZoomClose);
    document.getElementById('fcZoomCard').addEventListener('click', (e) => {
      if (e.target.closest('.fc-icon-btn')) return;
      fcZoomFlip();
    });
    document.getElementById('fcZoomPrev').addEventListener('click', () => fcNav(-1));
    document.getElementById('fcZoomNext').addEventListener('click', () => fcNav(1));
    document.getElementById('fcZoomStar').addEventListener('click', () => { fcToggleStar(); fcZoomSyncCard(); });
    document.getElementById('fcZoomStarBack').addEventListener('click', () => { fcToggleStar(); fcZoomSyncCard(); });
    document.getElementById('fcZoomGotIt').addEventListener('click', fcGotIt);
    document.getElementById('fcZoomStillLearning').addEventListener('click', fcStillLearning);
  })();

  // =========================================================
  // PRACTICE QUESTIONS ENGINE
  // =========================================================

  // Question data fetched from JSON, indexed by topic number
  let pqQuestionsData = {}; // { '1.1': [normalized questions], ... }
  let pqAllQuestions  = []; // flat array for id lookups

  function pqNormalizeQuestion(raw) {
    const letters = ['A', 'B', 'C', 'D'];
    const opts    = letters.map(l => (raw.options || {})[l]).filter(v => v !== undefined);
    const correct = letters.indexOf(raw.correctAnswer);
    return {
      id:           raw.id,
      topic:        raw.topic,
      type:         raw.type === 'mc' ? 'mcq' : raw.type === 'frq' ? 'frq' : raw.type,
      question:     raw.question,
      options:      opts,
      correct:      correct >= 0 ? correct : 0,
      explanation:  raw.explanation  || '',
      sampleAnswer: raw.sampleAnswer || '',
      rubric:       raw.rubric       || [],
    };
  }

  async function pqLoad() {
    pqQuestionsData = {};
    pqAllQuestions  = [];
    try {
      const r    = await fetch(`/data/subjects/ap-csp/questions/unit-${unitNum}.json?v=${Date.now()}`);
      const data = await r.json();
      (data.questions || []).forEach(raw => {
        const q = pqNormalizeQuestion(raw);
        if (!pqQuestionsData[q.topic]) pqQuestionsData[q.topic] = [];
        pqQuestionsData[q.topic].push(q);
        pqAllQuestions.push(q);
      });
      unit.topics.forEach(t => {
        console.log(`[fiveward] Practice questions loaded — Topic ${t.num}: ${(pqQuestionsData[t.num] || []).length} questions`);
      });
    } catch(err) {
      console.error('[fiveward] Failed to load practice questions:', err);
    }
  }

  let pqType    = 'mcq';
  let pqDeck    = [];
  let pqIdx     = 0;
  let pqAnswers = {}; // keyed by question id

  function pqIsActive() {
    return !document.getElementById('cpanelPractice')?.hasAttribute('hidden');
  }

  // --- Session persistence --------------------------------

  function pqSessionKey(type) {
    return 'fw_pq_session_u' + unitNum + '_' + type;
  }

  function pqSaveSession() {
    if (!pqDeck.length) return;
    try {
      localStorage.setItem(pqSessionKey(pqType), JSON.stringify({
        questionIds: pqDeck.map(q => q.id),
        idx:     pqIdx,
        answers: pqAnswers
      }));
    } catch(e) {}
  }

  function pqLoadSession(type) {
    try {
      const raw = localStorage.getItem(pqSessionKey(type));
      return raw ? JSON.parse(raw) : null;
    } catch(e) { return null; }
  }

  function pqClearSession(type) {
    try { localStorage.removeItem(pqSessionKey(type)); } catch(e) {}
  }

  function pqBackToPicker() {
    if (pqDeck.length > 0) pqSaveSession();
    pqInit();
  }

  function pqStartFresh() {
    pqClearSession(pqType);
    const allAvailable = pqGetDeck(pqType);
    if (!allAvailable.length) {
      const m = document.getElementById('pqEmptyMsg');
      if (m) m.textContent = 'No questions of this type available.';
      pqShowView('pqEmpty');
      return;
    }
    const input   = document.getElementById('pqCountInput');
    let   count   = input ? parseInt(input.value) : allAvailable.length;
    if (isNaN(count) || count < 1)      count = 1;
    if (count > allAvailable.length)    count = allAvailable.length;
    const shuffled = [...allAvailable].sort(() => Math.random() - 0.5);
    pqDeck    = shuffled.slice(0, count);
    pqIdx     = 0;
    pqAnswers = {};
    pqDeck.forEach(q => {
      pqAnswers[q.id] = { submitted: false, selected: null, userText: '', grade: null, isCorrect: null };
    });
    pqShowView('pqSession');
    pqRender();
  }

  function pqResume(session) {
    const restored = (session.questionIds || []).map(id => pqAllQuestions.find(q => q.id === id)).filter(Boolean);
    if (!restored.length) { pqStartFresh(); return; }
    pqDeck    = restored;
    pqIdx     = Math.min(session.idx || 0, pqDeck.length - 1);
    pqAnswers = session.answers || {};
    pqDeck.forEach(q => {
      if (!pqAnswers[q.id]) pqAnswers[q.id] = { submitted: false, selected: null, userText: '', grade: null, isCorrect: null };
    });
    pqShowView('pqSession');
    pqRender();
  }

  function pqShowResumePrompt(session) {
    const dialog = document.getElementById('pqResumeDialog');
    if (!dialog) return;
    dialog.hidden = false;
    document.getElementById('pqResumeBtn')?.addEventListener('click', () => {
      dialog.hidden = true; pqResume(session);
    }, { once: true });
    document.getElementById('pqStartFreshBtn')?.addEventListener('click', () => {
      dialog.hidden = true; pqStartFresh();
    }, { once: true });
  }

  function pqShowView(id) {
    ['pqEmpty', 'pqPicker', 'pqSession', 'pqComplete'].forEach(v => {
      const el = document.getElementById(v);
      if (el) el.hidden = (v !== id);
    });
  }

  function pqGetDeck(type) {
    let questions;
    if (viewMode === 'review') {
      questions = pqAllQuestions;
    } else {
      const topic = unit.topics.find(t => t.id === currentTopicId);
      questions = pqQuestionsData[topic?.num] || [];
    }
    if (type === 'mcq') return questions.filter(q => q.type === 'mcq');
    if (type === 'frq') return questions.filter(q => q.type === 'frq');
    return [...questions];
  }

  function pqUpdateCountInput() {
    const max   = pqGetDeck(pqType).length;
    const input = document.getElementById('pqCountInput');
    const avail = document.getElementById('pqCountAvail');
    const msg   = document.getElementById('pqCountMsg');
    if (!input) return;
    input.max   = max;
    input.value = max;
    if (avail) avail.textContent = `of ${max} available`;
    if (msg)   { msg.textContent = ''; msg.className = 'pq-count-msg'; }
  }

  function pqInit() {
    pqDeck    = [];
    pqIdx     = 0;
    pqAnswers = {};
    const available = pqGetDeck('mcq').length + pqGetDeck('frq').length;
    if (!available) { pqShowView('pqEmpty'); return; }
    document.querySelectorAll('.pq-type-card').forEach(c => {
      const type = c.dataset.type;
      c.classList.toggle('pq-type-card--active', type === pqType);
      const badge = c.querySelector('.pq-type-inprogress');
      if (badge) badge.hidden = !pqLoadSession(type);
    });
    pqUpdateCountInput();
    pqShowView('pqPicker');
  }

  function pqStart() {
    const session = pqLoadSession(pqType);
    if (session) { pqShowResumePrompt(session); return; }
    pqStartFresh();
  }

  function pqRender() {
    const q = pqDeck[pqIdx];
    const a = pqAnswers[q.id];

    const pct  = Math.round(((pqIdx + 1) / pqDeck.length) * 100);
    const fill = document.getElementById('pqProgFill');
    const ctr  = document.getElementById('pqCounter');
    if (fill) fill.style.width = pct + '%';
    if (ctr)  ctr.textContent  = (pqIdx + 1) + ' of ' + pqDeck.length;

    const prevBtn = document.getElementById('pqPrev');
    const nextBtn = document.getElementById('pqNext');
    if (prevBtn) prevBtn.disabled = pqIdx === 0;

    if (nextBtn) {
      const needsGrade = q.type === 'frq' && a.submitted && a.grade === null;
      const canNext    = a.submitted && !needsGrade;
      const isLast     = pqIdx === pqDeck.length - 1;
      nextBtn.disabled = !canNext;
      nextBtn.textContent = (isLast && canNext) ? 'See Results' : 'Next ›';
    }

    const area = document.getElementById('pqQuestionArea');
    if (!area) return;
    area.innerHTML = q.type === 'mcq' ? pqMCQHtml(q, a) : pqFRQHtml(q, a);
    if (q.type === 'mcq') pqWireMCQ(q, a);
    else                  pqWireFRQ(q, a);
  }

  function pqMCQHtml(q, a) {
    const L = ['A', 'B', 'C', 'D'];
    const opts = (q.options || []).map((opt, i) => {
      let cls = 'pq-option';
      if (a.submitted) {
        cls += i === q.correct ? ' pq-option--correct'
             : i === a.selected ? ' pq-option--wrong'
             : ' pq-option--neutral';
      } else if (i === a.selected) {
        cls += ' pq-option--selected';
      }
      return `<button class="${cls}" data-idx="${i}" type="button"${a.submitted ? ' disabled' : ''}>
        <span class="pq-option-radio"></span>
        <span class="pq-option-letter">${L[i]}</span>
        <span class="pq-option-text">${opt}</span>
      </button>`;
    }).join('');

    const submitBtn = a.submitted ? '' :
      `<button class="pq-submit-btn" id="pqSubmit" type="button"${a.selected === null ? ' disabled' : ''}>Submit Answer</button>`;

    let feedback = '';
    if (a.submitted && q.explanation) {
      const ok   = a.isCorrect;
      const icon = ok
        ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>`
        : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
      feedback = `<div class="pq-feedback pq-feedback--${ok ? 'correct' : 'wrong'}">
        <span class="pq-feedback-icon">${icon}</span>
        <p class="pq-feedback-text">${q.explanation}</p>
      </div>`;
    }

    return `<div class="pq-question-card"><p class="pq-question-text">${q.question}</p></div>
      <div class="pq-options" id="pqOptions">${opts}</div>
      ${submitBtn}${feedback}`;
  }

  function pqWireMCQ(q, a) {
    document.querySelectorAll('#pqOptions .pq-option').forEach(btn => {
      if (!a.submitted) {
        btn.addEventListener('click', () => {
          pqAnswers[q.id].selected = parseInt(btn.dataset.idx);
          pqRender();
        });
      }
    });
    document.getElementById('pqSubmit')?.addEventListener('click', () => {
      const ans = pqAnswers[q.id];
      if (ans.selected === null || ans.submitted) return;
      ans.submitted = true;
      ans.isCorrect = ans.selected === q.correct;
      pqRender();
    });
  }

  function pqFRQHtml(q, a) {
    const e = s => (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    const inputPart = a.submitted
      ? `<div class="pq-user-response">${e(a.userText).replace(/\n/g, '<br>')}</div>`
      : `<textarea class="pq-textarea" id="pqTextarea" placeholder="Type your answer here..." rows="6">${e(a.userText)}</textarea>
         <button class="pq-submit-btn" id="pqSubmit" type="button"${!a.userText.trim() ? ' disabled' : ''}>Submit Answer</button>`;

    let revealPart = '';
    if (a.submitted) {
      const rubric = (q.rubric || []).map(r => `<li class="pq-rubric-item">${e(r)}</li>`).join('');
      const g = grade => a.grade === grade ? ' pq-sg-btn--active' : '';
      revealPart = `
        <div class="pq-frq-reveal">
          <div class="pq-reveal-grid">
            <div class="pq-reveal-card">
              <span class="pq-reveal-title">Sample Answer</span>
              <p class="pq-reveal-text">${e(q.sampleAnswer)}</p>
            </div>
            <div class="pq-reveal-card">
              <span class="pq-reveal-title">Rubric</span>
              <ul class="pq-rubric-list">${rubric}</ul>
            </div>
          </div>
          <div class="pq-self-grade">
            <span class="pq-sg-label">Self Grade:</span>
            <button class="pq-sg-btn pq-sg-btn--full${g('full')}"       data-grade="full"    type="button">Full Credit</button>
            <button class="pq-sg-btn pq-sg-btn--partial${g('partial')}" data-grade="partial" type="button">Partial Credit</button>
            <button class="pq-sg-btn pq-sg-btn--none${g('none')}"       data-grade="none"    type="button">No Credit</button>
          </div>
        </div>`;
    }

    return `<div class="pq-question-card">
      <span class="pq-frq-badge">Free Response</span>
      <p class="pq-question-text">${e(q.question)}</p>
    </div>
    ${inputPart}${revealPart}`;
  }

  function pqWireFRQ(q, a) {
    const ta = document.getElementById('pqTextarea');
    if (ta && !a.submitted) {
      ta.addEventListener('input', () => {
        pqAnswers[q.id].userText = ta.value;
        const sub = document.getElementById('pqSubmit');
        if (sub) sub.disabled = !ta.value.trim();
      });
      document.getElementById('pqSubmit')?.addEventListener('click', () => {
        const ans   = pqAnswers[q.id];
        const text  = document.getElementById('pqTextarea')?.value || '';
        if (!text.trim() || ans.submitted) return;
        ans.userText  = text;
        ans.submitted = true;
        pqRender();
      });
    }
    if (a.submitted) {
      document.querySelectorAll('.pq-sg-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const ans   = pqAnswers[q.id];
          ans.grade     = btn.dataset.grade;
          ans.isCorrect = ans.grade !== 'none';
          document.querySelectorAll('.pq-sg-btn').forEach(b => {
            b.classList.toggle('pq-sg-btn--active', b.dataset.grade === ans.grade);
          });
          const nextBtn = document.getElementById('pqNext');
          if (nextBtn) {
            nextBtn.disabled = false;
            if (pqIdx === pqDeck.length - 1) nextBtn.textContent = 'See Results';
          }
        });
      });
    }
  }

  function pqNav(dir) {
    const n = pqIdx + dir;
    if (n < 0) return;
    if (n >= pqDeck.length) { if (dir > 0) pqShowResults(); return; }
    pqIdx = n;
    pqRender();
  }

  function pqShowResults() {
    pqClearSession(pqType);
    let correct = 0, partial = 0, wrong = 0;
    pqDeck.forEach(q => {
      const a = pqAnswers[q.id];
      if (a.grade === 'partial')     partial++;
      else if (a.isCorrect === true) correct++;
      else                           wrong++;
    });
    const total  = pqDeck.length;
    const points = correct + partial * 0.5;
    const pct    = total > 0 ? Math.round((points / total) * 100) : 0;
    const color  = pct >= 80 ? 'var(--color-primary)' : pct >= 60 ? '#f59e0b' : '#ef4444';

    const pctEl = document.getElementById('pqScorePct');
    if (pctEl) { pctEl.textContent = pct + '%'; pctEl.style.color = color; }

    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('pqStatCorrect', correct);
    set('pqStatPartial', partial);
    set('pqStatWrong',   wrong);
    set('pqStatTotal',   total);

    const revBtn = document.getElementById('pqReviewWrong');
    if (revBtn) revBtn.disabled = wrong === 0 && partial === 0;

    // Award points: MCQ correct = 2pts, FRQ full = 5pts, FRQ partial = 2pts
    let earnedPts = 0, correctMcq = 0, fullFrq = 0, partialFrq = 0;
    pqDeck.forEach(q => {
      const a = pqAnswers[q.id];
      if (q.type === 'mcq' && a.isCorrect === true)  { earnedPts += 2; correctMcq++; }
      if (q.type === 'frq' && a.grade === 'full')    { earnedPts += 5; fullFrq++; }
      if (q.type === 'frq' && a.grade === 'partial') { earnedPts += 2; partialFrq++; }
    });
    if (earnedPts > 0) _awardPoints(earnedPts, `Practice: ${pqType.toUpperCase()}`);

    // Show points breakdown on complete screen
    const pqPtsEl = document.getElementById('pqPointsEarned');
    if (pqPtsEl) {
      if (earnedPts > 0) {
        const parts = [];
        if (correctMcq  > 0) parts.push(`${correctMcq} correct answer${correctMcq > 1 ? 's' : ''} × 2 pts`);
        if (fullFrq     > 0) parts.push(`${fullFrq} full credit × 5 pts`);
        if (partialFrq  > 0) parts.push(`${partialFrq} partial credit × 2 pts`);
        pqPtsEl.textContent = `You earned ${earnedPts} point${earnedPts !== 1 ? 's' : ''} this session — ${parts.join(' + ')}.`;
        pqPtsEl.hidden = false;
      } else {
        pqPtsEl.hidden = true;
      }
    }

    pqShowView('pqComplete');
    _logPqResult(pct, correct, total);

    // Mark PQ activity done for single-topic mode
    if (viewMode !== 'review') {
      _markActivityDone(`fw_pq_done_u${unitNum}`, currentTopicId);
      _checkAndMarkFullyComplete(currentTopicId);
    }
  }

  // --- Listeners ------------------------------------------

  document.querySelectorAll('.pq-type-card').forEach(card => {
    card.addEventListener('click', () => {
      pqType = card.dataset.type;
      document.querySelectorAll('.pq-type-card').forEach(c => {
        c.classList.toggle('pq-type-card--active', c.dataset.type === pqType);
      });
      pqUpdateCountInput();
    });
  });

  document.getElementById('pqStartBtn')?.addEventListener('click', pqStart);
  document.getElementById('pqCountInput')?.addEventListener('input', () => {
    const input = document.getElementById('pqCountInput');
    const msg   = document.getElementById('pqCountMsg');
    const max   = parseInt(input.max) || 1;
    const val   = parseInt(input.value);
    if (!msg) return;
    msg.className = 'pq-count-msg';
    if (input.value === '' || isNaN(val)) {
      msg.textContent = '';
    } else if (val < 1) {
      msg.textContent = 'Please enter at least 1 question.';
      msg.classList.add('pq-count-msg--error');
    } else if (val > max) {
      input.value     = max;
      msg.textContent = `Only ${max} questions available.`;
      msg.classList.add('pq-count-msg--warn');
    } else {
      msg.textContent = '';
    }
  });
  document.getElementById('pqChangeType')?.addEventListener('click', pqBackToPicker);
  document.getElementById('pqChangeTypeComplete')?.addEventListener('click', pqInit);
  document.getElementById('pqPrev')?.addEventListener('click', () => pqNav(-1));
  document.getElementById('pqNext')?.addEventListener('click', () => pqNav(1));
  document.getElementById('pqRestart')?.addEventListener('click', pqStart);
  document.getElementById('pqReviewWrong')?.addEventListener('click', () => {
    const wrongDeck = pqDeck.filter(q => {
      const a = pqAnswers[q.id];
      return a.isCorrect === false || a.grade === 'none' || a.grade === 'partial';
    });
    if (!wrongDeck.length) return;
    pqDeck    = wrongDeck;
    pqIdx     = 0;
    pqAnswers = {};
    wrongDeck.forEach(q => {
      pqAnswers[q.id] = { submitted: false, selected: null, userText: '', grade: null, isCorrect: null };
    });
    pqShowView('pqSession');
    pqRender();
  });

  // --- Inject resume dialog --------------------------------

  (() => {
    const dlg = document.createElement('div');
    dlg.id        = 'pqResumeDialog';
    dlg.className = 'pq-dialog-overlay';
    dlg.hidden    = true;
    dlg.innerHTML = `
      <div class="pq-dialog-box">
        <p class="pq-dialog-title">Unfinished Session</p>
        <p class="pq-dialog-msg">You have an unfinished session. Resume where you left off, or start fresh?</p>
        <div class="pq-dialog-btns">
          <button class="btn btn--primary"  id="pqResumeBtn"     type="button">Resume</button>
          <button class="btn btn--outline"  id="pqStartFreshBtn" type="button">Start Fresh</button>
        </div>
      </div>`;
    document.body.appendChild(dlg);
  })();

  // --- Keyboard shortcuts ---------------------------------

  document.addEventListener('keydown', e => {
    if (!pqIsActive()) return;
    const session = document.getElementById('pqSession');
    if (!session || session.hidden) return;
    const tag = document.activeElement?.tagName;
    if (tag === 'TEXTAREA' || tag === 'INPUT') return;

    const q = pqDeck[pqIdx];
    const a = q && pqAnswers[q.id];
    if (!q || !a) return;

    if (q.type === 'mcq' && !a.submitted) {
      const map = { a:0, A:0, b:1, B:1, c:2, C:2, d:3, D:3 };
      if (e.key in map && map[e.key] < (q.options?.length || 0)) {
        e.preventDefault();
        pqAnswers[q.id].selected = map[e.key];
        pqRender();
        return;
      }
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (!a.submitted && q.type === 'mcq' && a.selected !== null) {
        a.submitted = true;
        a.isCorrect = a.selected === q.correct;
        pqRender();
      } else if (a.submitted && !(q.type === 'frq' && a.grade === null)) {
        pqNav(1);
      }
      return;
    }

    if (e.key === 'ArrowRight' && a.submitted) {
      if (q.type !== 'frq' || a.grade !== null) { e.preventDefault(); pqNav(1); }
    }
  });

  // =========================================================
  // PROGRESS TRACKER — DATA LOGGING
  // =========================================================

  function _logStudyDate() {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const dates = JSON.parse(localStorage.getItem('fw_streak_dates') || '[]');
      if (!dates.includes(today)) {
        dates.push(today);
        localStorage.setItem('fw_streak_dates', JSON.stringify(dates));
      }
    } catch {}
  }

  function _awardPoints(points, action) {
    try {
      const current = parseInt(localStorage.getItem('fw_points') || '0') || 0;
      localStorage.setItem('fw_points', String(current + points));
      const log = JSON.parse(localStorage.getItem('fw_points_log') || '[]');
      log.push({ date: new Date().toISOString(), action, points });
      if (log.length > 1000) log.splice(0, log.length - 1000);
      localStorage.setItem('fw_points_log', JSON.stringify(log));
      if (typeof window.fwShowToast === 'function') window.fwShowToast(`+${points} points`);
    } catch {}
  }

  function _logPqResult(pct, correct, total) {
    try {
      const topic   = unit.topics.find(t => t.id === currentTopicId);
      const results = JSON.parse(localStorage.getItem('fw_pq_results') || '[]');
      results.push({
        date:      new Date().toISOString(),
        unitNum,
        topicNum:  topic?.num  || '',
        topicName: topic?.name || `Unit ${unitNum}`,
        type:      pqType,
        pct, correct, total,
      });
      if (results.length > 500) results.splice(0, results.length - 500);
      localStorage.setItem('fw_pq_results', JSON.stringify(results));

      const activity = JSON.parse(localStorage.getItem('fw_activity_log') || '[]');
      activity.unshift({
        date:  new Date().toISOString(),
        label: `Practice: ${topic?.name || 'Unit ' + unitNum}`,
        sub:   `${pqType.toUpperCase()} · ${correct}/${total} correct · ${pct}%`,
      });
      if (activity.length > 100) activity.splice(100);
      localStorage.setItem('fw_activity_log', JSON.stringify(activity));

      _logStudyDate();
    } catch {}
  }

  // =========================================================
  // USER DROPDOWN
  // =========================================================

  const trigger  = document.getElementById('userMenuTrigger');
  const dropdown = document.getElementById('userDropdown');

  if (trigger && dropdown) {
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

})();
