// =============================================================
// FIVEWARD — Shared Study Timer Card
// Google-style timer widget. Works on any page that includes
// the timer card HTML.  Must load after timer.js.
// =============================================================

(function initTimerCard() {

  const gDisplay     = document.getElementById('gtimerDisplay');
  if (!gDisplay) return; // timer card not on this page

  const gEdit        = document.getElementById('gtimerEdit');
  const gHint        = document.getElementById('gtimerHint');
  const gStartBtn    = document.getElementById('gtimerStartBtn');
  const gRunningBtns = document.getElementById('gtimerRunningBtns');
  const gPRBtn       = document.getElementById('gtimerPauseResumeBtn');
  const gRestartBtn  = document.getElementById('gtimerRestartBtn');
  const gdisH        = document.getElementById('gdisH');
  const gdisHsep     = document.getElementById('gdisHsep');
  const gdisM        = document.getElementById('gdisM');
  const gdisS        = document.getElementById('gdisS');
  const ginH         = document.getElementById('ginH');
  const ginM         = document.getElementById('ginM');
  const ginS         = document.getElementById('ginS');

  const prPauseIcon = gPRBtn?.querySelector('.pr-pause');
  const prPlayIcon  = gPRBtn?.querySelector('.pr-play');
  const prLabel     = gPRBtn?.querySelector('.pr-label');

  const _savedMins = parseInt(localStorage.getItem('fw_default_duration')) || 30;
  let gSetSeconds  = _savedMins * 60;
  let gCardState       = 'stopped'; // 'stopped' | 'running' | 'paused'
  let gIsEditing       = false;
  let gStateBeforeEdit = 'stopped';

  function gPad(n) { return n.toString().padStart(2, '0'); }

  function gSecsToHMS(total) {
    return { h: Math.floor(total / 3600), m: Math.floor((total % 3600) / 60), s: total % 60 };
  }

  function gShow(el, disp) { if (el) el.style.display = disp !== undefined ? disp : ''; }
  function gHide(el)        { if (el) el.style.display = 'none'; }

  function gUpdateDisplay(secs) {
    const { h, m, s } = gSecsToHMS(secs);
    if (gdisH) gdisH.textContent = gPad(h);
    if (gdisM) gdisM.textContent = gPad(m);
    if (gdisS) gdisS.textContent = gPad(s);
  }

  function gUpdateButtons() {
    const stopped = gCardState === 'stopped';
    if (stopped) { gShow(gStartBtn); gHide(gRunningBtns); }
    else         { gHide(gStartBtn); gShow(gRunningBtns, 'flex'); }
    if (!stopped && prPauseIcon && prPlayIcon && prLabel) {
      const running = gCardState === 'running';
      prPauseIcon.style.display = running ? '' : 'none';
      prPlayIcon.style.display  = running ? 'none' : '';
      prLabel.textContent       = running ? 'Pause' : 'Resume';
    }
  }

  function gUpdateHint() {
    if (!gHint) return;
    gHint.textContent = gIsEditing
      ? 'Press Enter to confirm'
      : (gCardState === 'stopped' ? 'Click time to edit' : '');
  }

  // Enter edit mode — works regardless of current timer state
  function gEnterEdit() {
    if (gIsEditing) return;
    gStateBeforeEdit = gCardState;
    if (gCardState === 'running') pauseTimer();
    gIsEditing = true;

    // Pre-fill with remaining time (or set duration if stopped)
    let editSecs = gSetSeconds;
    if (gStateBeforeEdit !== 'stopped') {
      try { editSecs = JSON.parse(sessionStorage.getItem('fw_timer') || 'null')?.secondsLeft ?? gSetSeconds; } catch {}
    }
    const { h, m, s } = gSecsToHMS(editSecs);
    if (ginH) ginH.value = h > 0 ? h : '';
    if (ginM) ginM.value = m > 0 ? m : '';
    if (ginS) ginS.value = s > 0 ? s : '';

    gHide(gDisplay);
    gShow(gEdit, 'flex');
    gShow(gStartBtn);
    gHide(gRunningBtns);
    gUpdateHint();
    if (ginM) { ginM.focus(); ginM.select(); }
  }

  function gReadInputs() {
    const h = Math.max(0, parseInt(ginH?.value) || 0);
    const m = Math.max(0, Math.min(59, parseInt(ginM?.value) || 0));
    const s = Math.max(0, Math.min(59, parseInt(ginS?.value) || 0));
    gSetSeconds = Math.max(1, Math.min(86400, h * 3600 + m * 60 + s));
  }

  // Confirm edit — restarts timer if it was active before editing
  function gConfirmEdit() {
    if (!gIsEditing) return;
    gReadInputs();
    gIsEditing = false;
    gShow(gDisplay, 'flex');
    gHide(gEdit);
    if (gStateBeforeEdit === 'stopped') {
      gUpdateDisplay(gSetSeconds);
    } else {
      endTimer();
      startTimer(gSetSeconds / 60);
      gCardState = 'running';
      gUpdateDisplay(gSetSeconds);
    }
    gUpdateButtons();
    gUpdateHint();
  }

  // Restore from sessionStorage if a timer was already running
  (function gInit() {
    const raw = sessionStorage.getItem('fw_timer');
    if (raw) {
      try {
        const saved = JSON.parse(raw);
        if (saved.secondsLeft > 0) {
          gSetSeconds = saved.totalSeconds;
          gCardState  = saved.isRunning ? 'running' : 'paused';
          gUpdateDisplay(saved.secondsLeft);
          gUpdateButtons();
          gUpdateHint();
          return;
        }
      } catch {}
    }
    gUpdateDisplay(gSetSeconds);
    gUpdateButtons();
    gUpdateHint();
  })();

  // Display is always clickable — edit at any time
  gDisplay.addEventListener('click', () => gEnterEdit());
  gDisplay.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); gEnterEdit(); }
  });

  // Auto-advance between inputs after two digits
  ginH?.addEventListener('input', () => { if (ginH.value.length >= 2) ginM?.focus(); });
  ginM?.addEventListener('input', () => { if (ginM.value.length >= 2) ginS?.focus(); });

  [ginH, ginM, ginS].forEach(inp => {
    inp?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); gConfirmEdit(); }
    });
  });

  // Focus leaving edit container → confirm (80ms lets button clicks land first)
  gEdit?.addEventListener('focusout', () => {
    setTimeout(() => {
      if (gIsEditing && gEdit && !gEdit.contains(document.activeElement)) gConfirmEdit();
    }, 80);
  });

  // Start button — also commits any in-progress edit
  gStartBtn?.addEventListener('click', () => {
    if (gIsEditing) {
      gReadInputs();
      gIsEditing = false;
      gShow(gDisplay, 'flex');
      gHide(gEdit);
    }
    if (gSetSeconds <= 0) return;
    startTimer(gSetSeconds / 60);
    gCardState = 'running';
    gUpdateDisplay(gSetSeconds);
    gUpdateButtons();
    gUpdateHint();
  });

  // Pause / Resume
  gPRBtn?.addEventListener('click', () => {
    if (gCardState === 'running') {
      pauseTimer();
      gCardState = 'paused';
    } else if (gCardState === 'paused') {
      resumeTimer();
      gCardState = 'running';
    }
    gUpdateButtons();
    gUpdateHint();
  });

  // Restart → stop and reset to original set duration
  gRestartBtn?.addEventListener('click', () => {
    endTimer();
    gCardState = 'stopped';
    gUpdateDisplay(gSetSeconds);
    gUpdateButtons();
    gUpdateHint();
  });

  // Sync display on every tick from timer.js
  document.addEventListener('fw:timerTick', (e) => {
    if ((gCardState === 'running' || gCardState === 'paused') && !gIsEditing) {
      gUpdateDisplay(e.detail.secondsLeft);
    }
  });

  // ---- Timer state events -------------------------------------
  // The time-up modal is handled globally by timer.js.

  function resetTimerCard() {
    gCardState = 'stopped';
    gUpdateDisplay(gSetSeconds);
    gUpdateButtons();
    gUpdateHint();
  }

  // Reset card UI when timer ends
  document.addEventListener('fw:timerEnd', () => resetTimerCard());

  // Resume card UI when user adds time via the time-up modal
  document.addEventListener('fw:timerExtend', () => {
    gCardState = 'running';
    gUpdateButtons();
    gUpdateHint();
  });

})();
