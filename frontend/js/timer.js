// =============================================================
// FIVEWARD — Study Timer
// Countdown timer that persists visibly in the navbar while
// the user navigates between pages (uses sessionStorage).
// Shows a popup when time runs out to extend or end the session.
// =============================================================

const TIMER_KEY = 'fw_timer';  // sessionStorage key
let _temModal = null;          // global time-up modal element

const timerState = {
  totalSeconds:   0,    // total seconds chosen by the user
  secondsLeft:    0,    // seconds remaining
  isRunning:      false,
  intervalId:     null,
  startTime:      null, // Date.now() when timer started/resumed
};

// ---- Public API ---------------------------------------------

// Start a new timer (called from unit.html timer card).
// durationMinutes: how many minutes to count down from.
function startTimer(durationMinutes) {
  timerState.totalSeconds = durationMinutes * 60;
  timerState.secondsLeft  = durationMinutes * 60;
  timerState.isRunning    = true;
  timerState.startTime    = Date.now();
  _saveState();
  _tick();
}

function pauseTimer() {
  if (!timerState.isRunning) return;
  timerState.isRunning = false;
  clearInterval(timerState.intervalId);
  _saveState();
  _updateNavbarDisplay();
}

function resumeTimer() {
  if (timerState.isRunning || timerState.secondsLeft <= 0) return;
  timerState.isRunning = true;
  timerState.startTime = Date.now();
  _saveState();
  _tick();
}

function extendTimer(additionalMinutes) {
  timerState.secondsLeft += additionalMinutes * 60;
  timerState.totalSeconds += additionalMinutes * 60;
  _saveState();
  _updateNavbarDisplay();
}

function endTimer() {
  const elapsed = timerState.totalSeconds - timerState.secondsLeft;
  if (elapsed >= 30) _logStudyTime(elapsed);
  clearInterval(timerState.intervalId);
  timerState.isRunning   = false;
  timerState.secondsLeft = 0;
  sessionStorage.removeItem(TIMER_KEY);
  _showNavbarTimer(false);
}

function _logStudyTime(seconds) {
  try {
    const log = JSON.parse(localStorage.getItem('fw_study_log') || '[]');
    log.push({ date: new Date().toISOString(), seconds });
    if (log.length > 500) log.splice(0, log.length - 500);
    localStorage.setItem('fw_study_log', JSON.stringify(log));
    _logStreakDate();
  } catch {}
}

function _logStreakDate() {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const dates = JSON.parse(localStorage.getItem('fw_streak_dates') || '[]');
    if (!dates.includes(today)) {
      dates.push(today);
      localStorage.setItem('fw_streak_dates', JSON.stringify(dates));
    }
  } catch {}
}

// ---- Internal helpers ---------------------------------------

function _tick() {
  clearInterval(timerState.intervalId);
  timerState.intervalId = setInterval(() => {
    timerState.secondsLeft -= 1;
    _saveState();
    _updateNavbarDisplay();

    if (timerState.secondsLeft <= 0) {
      clearInterval(timerState.intervalId);
      timerState.isRunning = false;
      _saveState();
      _showTimeUpPopup();
    }
  }, 1000);
}

function _saveState() {
  sessionStorage.setItem(TIMER_KEY, JSON.stringify({
    secondsLeft: timerState.secondsLeft,
    totalSeconds: timerState.totalSeconds,
    isRunning: timerState.isRunning,
  }));
}

function _loadState() {
  const raw = sessionStorage.getItem(TIMER_KEY);
  if (!raw) return false;
  try {
    const saved = JSON.parse(raw);
    timerState.secondsLeft  = saved.secondsLeft;
    timerState.totalSeconds = saved.totalSeconds;
    timerState.isRunning    = saved.isRunning;
    return true;
  } catch {
    return false;
  }
}

function _formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function _updateNavbarDisplay() {
  const display = document.getElementById('navbarTimerDisplay');
  if (display) {
    display.textContent = _formatTime(timerState.secondsLeft);
  }
  _showNavbarTimer(timerState.secondsLeft > 0);

  // Let unit.js (and any other page scripts) react to each tick
  document.dispatchEvent(new CustomEvent('fw:timerTick', {
    detail: { secondsLeft: timerState.secondsLeft, isRunning: timerState.isRunning }
  }));
}

function _showNavbarTimer(visible) {
  const timerEl = document.getElementById('navbarTimer');
  if (!timerEl) return;
  timerEl.classList.toggle('visible', visible);
}

// ---- Time-up popup ------------------------------------------
function _showTimeUpPopup() {
  document.dispatchEvent(new CustomEvent('fw:timerEnd'));
  if (_temModal) {
    _temModal.hidden = false;
    setTimeout(() => document.getElementById('fwTemM')?.focus(), 50);
  }
}

// ---- Global time-up modal (CSS + HTML injected on every page) ----
// Using .fw-tem prefix to avoid collisions with page-level styles.

const _TEM_CSS = `
.fw-tem{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center}
.fw-tem[hidden]{display:none}
.fw-tem__overlay{position:absolute;inset:0;background:rgba(0,0,0,.45)}
.fw-tem__box{position:relative;background:var(--color-white,#fff);border-radius:var(--radius-xl,16px);box-shadow:0 4px 24px rgba(0,0,0,.15);padding:2rem 1.5rem;width:340px;max-width:calc(100vw - 2rem);text-align:center;display:flex;flex-direction:column;align-items:center;gap:1rem}
.fw-tem__icon{width:56px;height:56px;background:var(--color-primary-bg,#eaf6ed);border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-primary,#2d7a4f)}
.fw-tem__title{font-size:var(--text-xl,1.25rem);font-weight:var(--font-bold,700);color:var(--color-text,#111827);margin:0;font-family:var(--font-sans,inherit)}
.fw-tem__msg{font-size:var(--text-sm,.875rem);color:var(--color-text-muted,#6b7280);margin:0;line-height:1.5;font-family:var(--font-sans,inherit)}
.fw-tem__time-row{display:flex;align-items:center;justify-content:center;padding:var(--space-2,.5rem) 0;gap:1px}
.fw-tem__input{width:2.4ch;font-size:2rem;font-weight:var(--font-bold,700);color:var(--color-primary,#2d7a4f);font-variant-numeric:tabular-nums;letter-spacing:-.03em;line-height:1;text-align:center;background:transparent;border:none;border-bottom:2.5px solid var(--color-primary,#2d7a4f);border-radius:0;outline:none;padding:0;font-family:var(--font-sans,inherit);-moz-appearance:textfield}
.fw-tem__input::-webkit-outer-spin-button,.fw-tem__input::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}
.fw-tem__input:focus{background:var(--color-primary-bg,#eaf6ed);border-radius:3px 3px 0 0}
.fw-tem__colon{font-size:1.75rem;font-weight:var(--font-bold,700);color:var(--color-primary,#2d7a4f);line-height:1;padding:0 3px;user-select:none;font-family:var(--font-sans,inherit)}
.fw-tem__add-btn{width:100%;height:44px;background:var(--color-primary,#2d7a4f);color:#fff;border:none;border-radius:var(--radius-md,8px);font-family:var(--font-sans,inherit);font-size:var(--text-sm,.875rem);font-weight:var(--font-semibold,600);cursor:pointer;transition:background .15s}
.fw-tem__add-btn:hover{background:var(--color-primary-hover,#245f3d)}
.fw-tem__end-btn{width:100%;padding:.75rem;background:transparent;border:1.5px solid var(--color-border,#e5e7eb);border-radius:var(--radius-md,8px);font-family:var(--font-sans,inherit);font-size:var(--text-sm,.875rem);font-weight:var(--font-medium,500);color:var(--color-text-muted,#6b7280);cursor:pointer;transition:all .15s}
.fw-tem__end-btn:hover{border-color:var(--color-gray-400,#9ca3af);color:var(--color-text,#374151)}
`;

const _TEM_HTML = `<div class="fw-tem" id="fwTimerEndModal" hidden role="dialog" aria-modal="true" aria-labelledby="fwTemTitle">
  <div class="fw-tem__overlay" id="fwTemOverlay"></div>
  <div class="fw-tem__box">
    <div class="fw-tem__icon" aria-hidden="true">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
    </div>
    <h3 class="fw-tem__title" id="fwTemTitle">Time's up!</h3>
    <p class="fw-tem__msg">Add more time or end your study session?</p>
    <div class="fw-tem__time-row">
      <input class="fw-tem__input" id="fwTemH" type="number" min="0" max="23" placeholder="00" aria-label="Hours to add" />
      <span class="fw-tem__colon" aria-hidden="true">:</span>
      <input class="fw-tem__input" id="fwTemM" type="number" min="0" max="59" placeholder="25" aria-label="Minutes to add" />
      <span class="fw-tem__colon" aria-hidden="true">:</span>
      <input class="fw-tem__input" id="fwTemS" type="number" min="0" max="59" placeholder="00" aria-label="Seconds to add" />
    </div>
    <button class="fw-tem__add-btn" id="fwTemAddBtn" type="button">Add Time</button>
    <button class="fw-tem__end-btn" id="fwTemEndBtn" type="button">End Session</button>
  </div>
</div>`;

// ---- Auto-restore on page load + inject global modal --------
(function init() {
  // Inject time-up modal CSS so it renders on every page
  const _style = document.createElement('style');
  _style.textContent = _TEM_CSS;
  document.head.appendChild(_style);

  // Inject modal HTML at end of body
  document.body.insertAdjacentHTML('beforeend', _TEM_HTML);

  // Wire up modal controls
  _temModal              = document.getElementById('fwTimerEndModal');
  const _temOverlay      = document.getElementById('fwTemOverlay');
  const _temAddBtn       = document.getElementById('fwTemAddBtn');
  const _temEndBtn       = document.getElementById('fwTemEndBtn');
  const _temH            = document.getElementById('fwTemH');
  const _temM            = document.getElementById('fwTemM');
  const _temS            = document.getElementById('fwTemS');

  function _closeModal() { if (_temModal) _temModal.hidden = true; }
  function _clearModal() {
    if (_temH) _temH.value = '';
    if (_temM) _temM.value = '';
    if (_temS) _temS.value = '';
  }

  _temOverlay?.addEventListener('click', _closeModal);

  _temAddBtn?.addEventListener('click', () => {
    const h = Math.max(0, parseInt(_temH?.value) || 0);
    const m = Math.max(0, Math.min(59, parseInt(_temM?.value) || 0));
    const s = Math.max(0, Math.min(59, parseInt(_temS?.value) || 0));
    const addSecs = h * 3600 + m * 60 + s;
    if (addSecs <= 0) return;
    extendTimer(addSecs / 60);
    resumeTimer();
    _closeModal();
    _clearModal();
    document.dispatchEvent(new CustomEvent('fw:timerExtend'));
  });

  _temEndBtn?.addEventListener('click', () => {
    endTimer();
    _closeModal();
    _clearModal();
  });

  // Auto-advance between inputs after two digits
  _temH?.addEventListener('input', () => { if ((_temH.value + '').length >= 2) _temM?.focus(); });
  _temM?.addEventListener('input', () => { if ((_temM.value + '').length >= 2) _temS?.focus(); });
  [_temH, _temM, _temS].forEach(inp => {
    inp?.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); _temAddBtn?.click(); }
    });
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && _temModal && !_temModal.hidden) _closeModal();
  });

  // Apply persisted dark mode and font size on every page
  try {
    if (localStorage.getItem('fw_dark_mode') === 'true') {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
    const fontSize = localStorage.getItem('fw_font_size');
    if (fontSize && fontSize !== '"medium"' && fontSize !== 'medium') {
      const size = fontSize.replace(/"/g, '');
      if (size === 'small' || size === 'large') {
        document.documentElement.setAttribute('data-font-size', size);
      }
    }
  } catch {}

  // Restore timer if it was running before navigation
  const restored = _loadState();
  if (restored && timerState.secondsLeft > 0) {
    _updateNavbarDisplay();
    if (timerState.isRunning) {
      _tick();
    }
  }
})();

// ---- Toast notification system (available on every page) ----

const _TOAST_CSS = `
.fw-toast-wrap{position:fixed;bottom:24px;right:24px;z-index:9998;display:flex;flex-direction:column-reverse;gap:8px;pointer-events:none}
.fw-toast{display:inline-flex;align-items:center;gap:7px;padding:10px 18px;background:#2D7A4F;color:#fff;border-radius:999px;font-size:13px;font-weight:600;font-family:var(--font-sans,Inter,sans-serif);box-shadow:0 4px 20px rgba(0,0,0,.2);transform:translateX(calc(100% + 32px));opacity:0;transition:transform .32s cubic-bezier(.34,1.56,.64,1),opacity .32s ease;will-change:transform,opacity;white-space:nowrap}
.fw-toast--in{transform:translateX(0);opacity:1}
.fw-toast--out{transform:translateX(calc(100% + 32px));opacity:0;transition:transform .22s ease,opacity .22s ease}
`;

(function initToastSystem() {
  const _s = document.createElement('style');
  _s.textContent = _TOAST_CSS;
  document.head.appendChild(_s);

  const _wrap = document.createElement('div');
  _wrap.className = 'fw-toast-wrap';
  _wrap.setAttribute('aria-live', 'polite');
  _wrap.setAttribute('aria-atomic', 'false');
  document.body.appendChild(_wrap);

  window.fwShowToast = function(msg) {
    const t = document.createElement('div');
    t.className   = 'fw-toast';
    t.textContent = msg;
    _wrap.appendChild(t);
    requestAnimationFrame(() => requestAnimationFrame(() => t.classList.add('fw-toast--in')));
    setTimeout(() => {
      t.classList.remove('fw-toast--in');
      t.classList.add('fw-toast--out');
      t.addEventListener('transitionend', () => t.remove(), { once: true });
    }, 2500);
  };
})();
