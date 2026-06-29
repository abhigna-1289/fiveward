// =============================================================
// FIVEWARD — Practice Questions
// URL params: ?subject=ap-csp&unit=1
// TODO: Build in the next session when practice.html is built.
// =============================================================

// Question modes
const MODES = {
  MC:    'mc',    // Multiple Choice only
  FRQ:   'frq',   // Free Response only
  MIXED: 'mixed', // Both, interleaved
};

const practiceState = {
  mode:           null,
  questions:      [],    // filtered by mode
  currentIndex:   0,
  score:          { correct: 0, partial: 0, incorrect: 0 },
  answered:       false,
};

// TODO: showModePicker()
//       Renders the three mode cards (MC / FRQ / Mixed).
//       On selection, sets practiceState.mode and calls loadQuestions().

// TODO: loadQuestions(subjectId, unitNumber, mode)
//       Fetches data/subjects/[id]/questions/unit-[n].json
//       Filters by type (mc / frq) based on chosen mode.

// TODO: renderQuestion(index)
//       Dispatches to renderMCQuestion() or renderFRQQuestion() based on type.

// TODO: renderMCQuestion(q)
//       Shows stem + A/B/C/D buttons.
//       On submit: highlights correct (green) / wrong (red), shows explanation.

// TODO: renderFRQQuestion(q)
//       Shows stem + textarea.
//       On submit: reveals sample answer + rubric.
//       Shows self-grade buttons: Full Credit / Partial Credit / No Credit.

// TODO: nextQuestion()
//       Advances currentIndex; shows summary screen when all done.
