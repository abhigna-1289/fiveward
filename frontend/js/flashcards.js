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

// TODO: loadFlashcards(subjectId, unitNumber)
//       Fetches data/subjects/[id]/flashcards/unit-[n].json
//       Populates deckState.cards and deckState.shuffled.

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
