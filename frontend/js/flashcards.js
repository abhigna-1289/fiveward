// =============================================================
// FIVEWARD — Standalone Flashcards Page
// URL params: ?subject=ap-csp&unit=1&topic=1.1  (topic optional)
// =============================================================

(async function () {

  // ── Unit / topic data ──────────────────────────────────────
  const UNITS = {
    1: { name: 'Creative Development', topics: [
      { num: '1.1', name: 'Collaboration' },
      { num: '1.2', name: 'Program Function and Purpose' },
      { num: '1.3', name: 'Program Design and Development' },
      { num: '1.4', name: 'Identifying and Correcting Errors' },
    ]},
    2: { name: 'Data', topics: [
      { num: '2.1', name: 'Binary Numbers' },
      { num: '2.2', name: 'Data Compression' },
      { num: '2.3', name: 'Extracting Information from Data' },
      { num: '2.4', name: 'Using Programs with Data' },
    ]},
    3: { name: 'Algorithms and Programming', topics: [
      { num: '3.1',  name: 'Variables and Assignments' },
      { num: '3.2',  name: 'Data Abstraction' },
      { num: '3.3',  name: 'Mathematical Expressions' },
      { num: '3.4',  name: 'Strings' },
      { num: '3.5',  name: 'Boolean Expressions' },
      { num: '3.6',  name: 'Conditionals' },
      { num: '3.7',  name: 'Nested Conditionals' },
      { num: '3.8',  name: 'Iteration' },
      { num: '3.9',  name: 'Developing Algorithms' },
      { num: '3.10', name: 'Lists' },
      { num: '3.11', name: 'Binary Search' },
      { num: '3.12', name: 'Calling Procedures' },
      { num: '3.13', name: 'Developing Procedures' },
      { num: '3.14', name: 'Libraries' },
      { num: '3.15', name: 'Random Values' },
      { num: '3.16', name: 'Simulations' },
      { num: '3.17', name: 'Algorithmic Efficiency' },
      { num: '3.18', name: 'Undecidable Problems' },
    ]},
    4: { name: 'Computer Systems and Networks', topics: [
      { num: '4.1', name: 'The Internet' },
      { num: '4.2', name: 'Fault Tolerance' },
      { num: '4.3', name: 'Parallel and Distributed Computing' },
    ]},
    5: { name: 'Impact of Computing', topics: [
      { num: '5.1', name: 'Beneficial and Harmful Effects' },
      { num: '5.2', name: 'Digital Divide' },
      { num: '5.3', name: 'Computing Bias' },
      { num: '5.4', name: 'Crowdsourcing' },
      { num: '5.5', name: 'Legal and Ethical Concerns' },
      { num: '5.6', name: 'Safe Computing' },
    ]},
  };

  // ── URL params ─────────────────────────────────────────────
  const params    = new URLSearchParams(window.location.search);
  const subject   = params.get('subject') || 'ap-csp';
  const unitNum   = Math.min(5, Math.max(1, parseInt(params.get('unit')) || 1));
  const topicNum  = params.get('topic') || null; // e.g. "1.1"

  const unit      = UNITS[unitNum] || UNITS[1];
  const topicObj  = topicNum ? unit.topics.find(t => t.num === topicNum) : null;

  // ── Page header + breadcrumb ───────────────────────────────
  document.title = topicObj
    ? `${topicNum}: ${topicObj.name} Flashcards — fiveward`
    : `Unit ${unitNum} Flashcards — fiveward`;

  const elBcUnit     = document.getElementById('breadcrumbUnit');
  const elBcCurrent  = document.getElementById('breadcrumbCurrent');
  const elPhUnit     = document.getElementById('pageHeaderUnit');
  const elPhTitle    = document.getElementById('pageHeaderTitle');
  const elPhMeta     = document.getElementById('pageHeaderMeta');

  if (elBcUnit) {
    elBcUnit.textContent = `Unit ${unitNum}`;
    elBcUnit.href = `unit.html?unit=${unitNum}`;
  }
  if (elBcCurrent) elBcCurrent.textContent = topicObj ? `${topicNum} Flashcards` : 'Flashcards';
  if (elPhUnit)  elPhUnit.textContent  = `AP CSP · Unit ${unitNum}: ${unit.name}`;
  if (elPhTitle) elPhTitle.textContent = topicObj ? `${topicNum}: ${topicObj.name}` : `Unit ${unitNum} Flashcards`;

  // ── Auth guard (non-blocking — just sets avatar) ───────────
  (async () => {
    try {
      const { data: { user } } = await window._supabase.auth.getUser();
      if (!user) { window.location.href = 'auth.html'; return; }
      const avatar = document.getElementById('userAvatar');
      if (avatar) {
        const name = user.user_metadata?.full_name || user.email || '';
        avatar.textContent = name.charAt(0).toUpperCase() || '?';
      }
    } catch {}
  })();

  // ── Fetch flashcard data ───────────────────────────────────
  let allCards = [];
  try {
    const res  = await fetch(`/data/subjects/${subject}/flashcards/unit-${unitNum}.json`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const raw  = json.cards || [];
    allCards   = topicNum ? raw.filter(c => c.topic === topicNum) : raw;
  } catch (err) {
    console.error('[fiveward] Failed to load flashcards:', err);
  }

  // ── Update meta (card count) ───────────────────────────────
  if (elPhMeta) elPhMeta.textContent = `${allCards.length} card${allCards.length !== 1 ? 's' : ''}`;

  // ── Storage helpers ────────────────────────────────────────
  const scope = topicNum ? `t${topicNum.replace('.', '_')}` : 'all';

  function storageKey(type) {
    return `fw_fc_${type}_u${unitNum}_${scope}`;
  }

  // ── State ──────────────────────────────────────────────────
  let fcFilter       = 'all';
  let fcSidesFlipped = localStorage.getItem('fw_fc_sides') === '1';
  let fcNavAnimating = false;
  let fcZoomIsFlipped = false;

  const fcState = {
    deck:             [],
    idx:              0,
    isFlipped:        false,
    gotItIds:         new Set(),
    starredIds:       new Set(),
    stillLearningIds: new Set(),
  };

  function loadStorage() {
    try {
      fcState.gotItIds         = new Set(JSON.parse(localStorage.getItem(storageKey('gotit'))      || '[]'));
      fcState.starredIds       = new Set(JSON.parse(localStorage.getItem(storageKey('starred'))    || '[]'));
      fcState.stillLearningIds = new Set(JSON.parse(localStorage.getItem(storageKey('stilllearn'))|| '[]'));
    } catch {
      fcState.gotItIds = new Set(); fcState.starredIds = new Set(); fcState.stillLearningIds = new Set();
    }
  }

  function saveStorage() {
    localStorage.setItem(storageKey('gotit'),      JSON.stringify([...fcState.gotItIds]));
    localStorage.setItem(storageKey('starred'),    JSON.stringify([...fcState.starredIds]));
    localStorage.setItem(storageKey('stilllearn'), JSON.stringify([...fcState.stillLearningIds]));
  }

  // ── Points / streak ────────────────────────────────────────
  function awardPoints(pts) {
    const current = parseInt(localStorage.getItem('fw_points') || '0') + pts;
    localStorage.setItem('fw_points', String(current));
  }

  function logStudyDate() {
    const today = new Date().toISOString().slice(0, 10);
    try {
      const dates = new Set(JSON.parse(localStorage.getItem('fw_streak_dates') || '[]'));
      dates.add(today);
      localStorage.setItem('fw_streak_dates', JSON.stringify([...dates]));
    } catch {}
  }

  // ── Build deck from filter ────────────────────────────────
  function buildDeck() {
    if (fcFilter === 'starred')        return allCards.filter(c => fcState.starredIds.has(c.id));
    if (fcFilter === 'still-learning') return allCards.filter(c => fcState.stillLearningIds.has(c.id));
    return [...allCards];
  }

  // ── Render card ───────────────────────────────────────────
  function renderCard() {
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
    const fl = document.getElementById('fcFrontLabel');
    const bl = document.getElementById('fcBackLabel');
    if (ft) ft.textContent = fcSidesFlipped ? card.back  : card.front;
    if (bt) bt.textContent = fcSidesFlipped ? card.front : card.back;
    if (fl) fl.textContent = fcSidesFlipped ? 'DEFINITION' : 'TERM';
    if (bl) bl.textContent = fcSidesFlipped ? 'TERM' : 'DEFINITION';

    const ctr = document.getElementById('fcCounter');
    if (ctr) ctr.textContent = `${fcState.idx + 1} of ${fcState.deck.length}`;

    const prev = document.getElementById('fcPrev');
    const next = document.getElementById('fcNext');
    if (prev) prev.disabled = fcState.idx === 0;
    if (next) next.disabled = false;

    updateStar(fcState.starredIds.has(card.id));
    updateBadge(card);

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
      zoomSyncCard();
    }
  }

  function updateStar(starred) {
    ['fcStar', 'fcStarBack', 'fcZoomStar', 'fcZoomStarBack'].forEach(id => {
      document.getElementById(id)?.classList.toggle('fc-star-btn--active', starred);
    });
  }

  function updateBadge(card) {
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

  // ── Init / re-init ────────────────────────────────────────
  function fcInit() {
    loadStorage();

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

    if (elEmpty)    elEmpty.hidden    = true;
    if (elComplete) elComplete.hidden = true;
    if (elFilterEmpty) elFilterEmpty.hidden = true;
    if (elToolbar)  elToolbar.hidden  = false;

    const sidesBtn = document.getElementById('fcSwitchSides');
    if (sidesBtn) { sidesBtn.hidden = false; updateSidesBtn(); }

    fcState.deck      = buildDeck();
    fcState.idx       = 0;
    fcState.isFlipped = false;

    if (!fcState.deck.length) {
      if (elUI) elUI.hidden = true;
      const msgEl = document.getElementById('fcFilterEmptyMsg');
      if (msgEl) msgEl.textContent = fcFilter === 'starred'
        ? 'No starred cards yet. Click the star icon on any card to save it here.'
        : 'No cards marked Still Learning yet. Keep studying and mark cards as you go.';
      if (elFilterEmpty) elFilterEmpty.hidden = false;
      return;
    }

    if (elUI) elUI.hidden = false;
    renderCard();
  }

  // ── Flip ─────────────────────────────────────────────────
  function fcFlip() {
    if (fcNavAnimating) return;
    const el = document.getElementById('fcCard');
    if (!el) return;
    fcState.isFlipped = !fcState.isFlipped;
    el.classList.toggle('fc-flipped', fcState.isFlipped);
  }

  // ── Navigate ─────────────────────────────────────────────
  function fcNav(dir) {
    if (fcNavAnimating) return;
    const n = fcState.idx + dir;
    if (n < 0) return;
    if (n >= fcState.deck.length) { if (dir > 0) showComplete(); return; }

    const cardEl    = document.getElementById('fcCard');
    const zoomModal = document.getElementById('fcZoomModal');
    const zoomEl    = (!zoomModal?.hidden) ? document.getElementById('fcZoomCard') : null;

    if (!cardEl) { fcState.idx = n; renderCard(); return; }

    fcNavAnimating = true;
    const exitCls  = dir > 0 ? 'fc-card--exit-left'  : 'fc-card--exit-right';
    const enterCls = dir > 0 ? 'fc-card--enter-right' : 'fc-card--enter-left';
    const allAnim  = ['fc-card--exit-left','fc-card--exit-right','fc-card--enter-right','fc-card--enter-left'];

    cardEl.classList.remove(...allAnim);
    if (zoomEl) zoomEl.classList.remove(...allAnim);
    void cardEl.offsetWidth;
    cardEl.classList.add(exitCls);
    if (zoomEl) zoomEl.classList.add(exitCls);

    cardEl.addEventListener('animationend', () => {
      cardEl.classList.remove(exitCls);
      if (zoomEl) zoomEl.classList.remove(exitCls);
      fcState.idx = n;
      renderCard();
      void cardEl.offsetWidth;
      cardEl.classList.add(enterCls);
      if (zoomEl) zoomEl.classList.add(enterCls);
      cardEl.addEventListener('animationend', () => {
        cardEl.classList.remove(enterCls);
        if (zoomEl) zoomEl.classList.remove(enterCls);
        fcNavAnimating = false;
      }, { once: true });
    }, { once: true });
  }

  // ── Got it / Still Learning ───────────────────────────────
  function fcGotIt() {
    const card = fcState.deck[fcState.idx];
    if (!card) return;
    ['fcGotIt','fcZoomGotIt'].forEach(id => {
      const b = document.getElementById(id);
      if (!b) return;
      b.classList.add('fc-btn--bounce');
      b.addEventListener('animationend', () => b.classList.remove('fc-btn--bounce'), { once: true });
    });
    if (fcState.gotItIds.has(card.id)) {
      fcState.gotItIds.delete(card.id);
    } else {
      fcState.gotItIds.add(card.id);
      fcState.stillLearningIds.delete(card.id);
    }
    saveStorage();
    updateBadge(card);
  }

  function fcStillLearning() {
    const card = fcState.deck[fcState.idx];
    if (!card) return;
    ['fcStillLearning','fcZoomStillLearning'].forEach(id => {
      const b = document.getElementById(id);
      if (!b) return;
      b.classList.add('fc-btn--bounce');
      b.addEventListener('animationend', () => b.classList.remove('fc-btn--bounce'), { once: true });
    });
    if (fcState.stillLearningIds.has(card.id)) {
      fcState.stillLearningIds.delete(card.id);
    } else {
      fcState.stillLearningIds.add(card.id);
      fcState.gotItIds.delete(card.id);
    }
    saveStorage();
    updateBadge(card);
  }

  function fcToggleStar() {
    const card = fcState.deck[fcState.idx];
    if (!card) return;
    if (fcState.starredIds.has(card.id)) fcState.starredIds.delete(card.id);
    else fcState.starredIds.add(card.id);
    saveStorage();
    updateStar(fcState.starredIds.has(card.id));
  }

  // ── Shuffle ───────────────────────────────────────────────
  function fcShuffle() {
    for (let i = fcState.deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [fcState.deck[i], fcState.deck[j]] = [fcState.deck[j], fcState.deck[i]];
    }
    fcState.idx = 0;
    const btn = document.getElementById('fcShuffle');
    if (btn) {
      btn.classList.add('fc-shuffle-clicked');
      btn.addEventListener('animationend', () => btn.classList.remove('fc-shuffle-clicked'), { once: true });
    }
    renderCard();
  }

  // ── Restart ───────────────────────────────────────────────
  function fcRestart() {
    fcState.gotItIds.clear();
    fcState.stillLearningIds.clear();
    saveStorage();
    fcInit();
  }

  // ── Completion screen ─────────────────────────────────────
  function showComplete() {
    zoomClose();
    document.getElementById('fcUI').hidden      = true;
    document.getElementById('fcComplete').hidden = false;

    const total       = allCards.length;
    const gotIt       = fcState.gotItIds.size;
    const still       = fcState.stillLearningIds.size;
    const starred     = fcState.starredIds.size;
    const notReviewed = total - gotIt - still;

    const s = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    s('fcStatGotIt',      gotIt);
    s('fcStatStill',      still);
    s('fcStatStarred',    starred);
    s('fcStatNotReviewed',notReviewed);

    const btnStill   = document.getElementById('fcStudyStillLearning');
    const btnStarred = document.getElementById('fcStudyStarred');
    if (btnStill)   btnStill.disabled   = still === 0;
    if (btnStarred) btnStarred.disabled = starred === 0;

    // Award points for completing all cards
    const ptsEl = document.getElementById('fcPointsEarned');
    if (fcFilter === 'all' && allCards.length > 0) {
      awardPoints(3);
      logStudyDate();
      if (ptsEl) { ptsEl.textContent = 'You earned 3 points for completing all flashcards!'; ptsEl.hidden = false; }
    } else {
      if (ptsEl) ptsEl.hidden = true;
    }
  }

  // ── Switch sides ──────────────────────────────────────────
  function updateSidesBtn() {
    const btn = document.getElementById('fcSwitchSides');
    if (!btn) return;
    btn.classList.toggle('fc-sides-btn--active', fcSidesFlipped);
    const label = btn.querySelector('.fc-sides-label');
    if (label) label.textContent = fcSidesFlipped ? 'Definition → Term' : 'Term → Definition';
  }

  function fcSwitchSides() {
    fcSidesFlipped = !fcSidesFlipped;
    localStorage.setItem('fw_fc_sides', fcSidesFlipped ? '1' : '0');
    updateSidesBtn();
    document.getElementById('fcCard')?.classList.remove('fc-flipped');
    fcState.isFlipped = false;
    document.getElementById('fcZoomCard')?.classList.remove('fc-flipped');
    fcZoomIsFlipped = false;
    if (fcState.deck.length) renderCard();
  }

  // ── Filter pills ──────────────────────────────────────────
  function setActiveFilter(f) {
    fcFilter = f;
    document.querySelectorAll('.fc-filter-btn').forEach(btn => {
      btn.classList.toggle('fc-filter-btn--active', btn.dataset.filter === f);
    });
  }

  // ── Zoom modal ────────────────────────────────────────────
  function zoomOpen() {
    const modal = document.getElementById('fcZoomModal');
    if (!modal) return;
    fcZoomIsFlipped = fcState.isFlipped;
    document.getElementById('fcZoomCard')?.classList.toggle('fc-flipped', fcZoomIsFlipped);
    zoomSyncCard();
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function zoomClose() {
    const modal = document.getElementById('fcZoomModal');
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    document.body.style.overflow = '';
  }

  function zoomFlip() {
    const cardEl = document.getElementById('fcZoomCard');
    if (!cardEl) return;
    fcZoomIsFlipped = !fcZoomIsFlipped;
    cardEl.classList.toggle('fc-flipped', fcZoomIsFlipped);
  }

  function zoomSyncCard() {
    const card = fcState.deck[fcState.idx];
    if (!card) return;
    const ft = document.getElementById('fcZoomFrontText');
    const bt = document.getElementById('fcZoomBackText');
    const fl = document.getElementById('fcZoomFrontLabel');
    const bl = document.getElementById('fcZoomBackLabel');
    if (ft) ft.textContent = fcSidesFlipped ? card.back  : card.front;
    if (bt) bt.textContent = fcSidesFlipped ? card.front : card.back;
    if (fl) fl.textContent = fcSidesFlipped ? 'DEFINITION' : 'TERM';
    if (bl) bl.textContent = fcSidesFlipped ? 'TERM' : 'DEFINITION';
    const ctr = document.getElementById('fcZoomCounter');
    if (ctr) ctr.textContent = `${fcState.idx + 1} of ${fcState.deck.length}`;
    const starred = fcState.starredIds.has(card.id);
    ['fcZoomStar','fcZoomStarBack'].forEach(id => {
      document.getElementById(id)?.classList.toggle('fc-star-btn--active', starred);
    });
    const prev = document.getElementById('fcZoomPrev');
    const next = document.getElementById('fcZoomNext');
    if (prev) prev.disabled = fcState.idx === 0;
    if (next) next.disabled = fcState.idx === fcState.deck.length - 1;
    updateBadge(card);
  }

  // Inject zoom modal into body
  (function () {
    const STAR_SVG = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
    const PREV_SVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>`;
    const NEXT_SVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>`;
    const modal = document.createElement('div');
    modal.id = 'fcZoomModal';
    modal.className = 'fc-zoom-modal';
    modal.hidden = true;
    modal.setAttribute('role', 'dialog');
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
          <button class="fc-zoom-got-btn"   id="fcZoomGotIt"          type="button">Got it</button>
          <button class="fc-zoom-still-btn" id="fcZoomStillLearning"  type="button">Still Learning</button>
        </div>
      </div>`;
    document.body.appendChild(modal);

    modal.addEventListener('click', (e) => { if (e.target === modal) zoomClose(); });
    document.getElementById('fcZoomClose').addEventListener('click', zoomClose);
    document.getElementById('fcZoomCard').addEventListener('click', (e) => {
      if (e.target.closest('.fc-icon-btn')) return;
      zoomFlip();
    });
    document.getElementById('fcZoomPrev').addEventListener('click', () => fcNav(-1));
    document.getElementById('fcZoomNext').addEventListener('click', () => fcNav(1));
    document.getElementById('fcZoomStar').addEventListener('click', () => { fcToggleStar(); zoomSyncCard(); });
    document.getElementById('fcZoomStarBack').addEventListener('click', () => { fcToggleStar(); zoomSyncCard(); });
    document.getElementById('fcZoomGotIt').addEventListener('click', fcGotIt);
    document.getElementById('fcZoomStillLearning').addEventListener('click', fcStillLearning);
  })();

  // ── Wire listeners ────────────────────────────────────────
  document.getElementById('fcPrev')?.addEventListener('click', () => fcNav(-1));
  document.getElementById('fcNext')?.addEventListener('click', () => fcNav(1));
  document.getElementById('fcGotIt')?.addEventListener('click', fcGotIt);
  document.getElementById('fcStillLearning')?.addEventListener('click', fcStillLearning);
  document.getElementById('fcStar')?.addEventListener('click', fcToggleStar);
  document.getElementById('fcStarBack')?.addEventListener('click', fcToggleStar);
  document.getElementById('fcZoom')?.addEventListener('click', zoomOpen);
  document.getElementById('fcZoomBack')?.addEventListener('click', zoomOpen);
  document.getElementById('fcShuffle')?.addEventListener('click', fcShuffle);
  document.getElementById('fcRestart')?.addEventListener('click', fcRestart);
  document.getElementById('fcSwitchSides')?.addEventListener('click', fcSwitchSides);

  document.getElementById('fcStudyAllCards')?.addEventListener('click', () => {
    setActiveFilter('all'); fcInit();
  });
  document.getElementById('fcRestartAll')?.addEventListener('click', () => {
    fcState.gotItIds.clear(); fcState.stillLearningIds.clear(); saveStorage();
    setActiveFilter('all'); fcInit();
  });
  document.getElementById('fcStudyStillLearning')?.addEventListener('click', () => {
    setActiveFilter('still-learning'); fcInit();
  });
  document.getElementById('fcStudyStarred')?.addEventListener('click', () => {
    setActiveFilter('starred'); fcInit();
  });

  document.getElementById('fcFilters')?.addEventListener('click', (e) => {
    const btn = e.target.closest('.fc-filter-btn');
    if (!btn) return;
    setActiveFilter(btn.dataset.filter);
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
  let touchStartX = 0;
  document.getElementById('fcCard')?.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].clientX;
  }, { passive: true });
  document.getElementById('fcCard')?.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 50) fcNav(dx < 0 ? 1 : -1);
  }, { passive: true });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (document.getElementById('fcUI')?.hidden) return;
    if (!document.getElementById('fcZoomModal')?.hidden) {
      if      (e.key === 'Escape')     zoomClose();
      else if (e.key === ' ')          { e.preventDefault(); zoomFlip(); }
      else if (e.key === 'ArrowLeft')  { e.preventDefault(); fcNav(-1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); fcNav(1); }
      else if (e.key === 'g' || e.key === 'G') { e.preventDefault(); fcGotIt(); }
      else if (e.key === 's' || e.key === 'S') { e.preventDefault(); fcStillLearning(); }
      return;
    }
    if (fcNavAnimating) return;
    const tag = document.activeElement?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'BUTTON') return;
    if      (e.key === ' ')          { e.preventDefault(); fcFlip(); }
    else if (e.key === 'ArrowLeft')  { e.preventDefault(); fcNav(-1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); fcNav(1); }
    else if (e.key === 'g' || e.key === 'G') { e.preventDefault(); fcGotIt(); }
    else if (e.key === 's' || e.key === 'S') { e.preventDefault(); fcStillLearning(); }
  });

  // ── Boot ──────────────────────────────────────────────────
  fcInit();

})();
