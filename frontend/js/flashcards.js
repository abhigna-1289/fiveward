// =============================================================
// FIVEWARD — Flashcards
// URL params: ?subject=ap-csp&unit=1&topic=1.1 (topic optional)
// TODO: Build in the next session when flashcards.html is built.
// =============================================================

// Internal deck state
const deckState = {
  cards:        [],    // full array of card objects {front, back}
  shuffled:     [],    // current display order
  currentIndex: 0,
  gotIt:        [],    // indices of cards marked "Got it"
  stillLearning:[],    // indices of cards marked "Still Learning"
  isFlipped:    false,
};

// Fetches data/subjects/[id]/flashcards/unit-[n].json and populates deckState.
async function loadFlashcards(subjectId, unitNumber) {
  const path = `data/subjects/${subjectId}/flashcards/unit-${unitNumber}.json`;
  try {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${path}`);
    const json = await res.json();
    deckState.cards   = json.cards || [];
    deckState.shuffled = deckState.cards.map((_, i) => i);
    console.log(`[fiveward] Loaded ${deckState.cards.length} flashcards from ${path}`);
    return deckState.cards;
  } catch (err) {
    console.error('[fiveward] loadFlashcards failed:', err);
    return [];
  }
}

// TODO: renderCard(index)
//       Shows the front/back of deckState.shuffled[index].

// TODO: flipCard()
//       Adds .is-flipped class to .flashcard-scene; removes it on second click.

// TODO: nextCard() / prevCard()
//       Increments/decrements currentIndex, updates card and dot indicators.

// TODO: markGotIt() / markStillLearning()
//       Adds currentIndex to the appropriate array, advances to next card.

// TODO: shuffleDeck()
//       Fisher-Yates shuffle on deckState.shuffled; resets currentIndex to 0.

// TODO: restartDeck()
//       Resets all arrays to initial state, goes back to card 0.

// TODO: renderDotIndicators()
//       Builds the row of dot indicators below the card.
