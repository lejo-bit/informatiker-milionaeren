/**
 * state.js — Central game state management.
 *
 * This module exports a single mutable `state` object that holds all
 * runtime game data (score, lives, timers, etc.) and a `resetGameState()`
 * function that resets the state to its initial values for a new game.
 *
 * The `state` object is imported by other modules (game.js, ui.js, main.js)
 * and mutated directly — this is a simple, pragmatic approach for a
 * single-page game without a formal state management library.
 */

// Game configuration and mutable runtime state
export const state = {
  // --- Question data ---
  allQuestions: [],       // Full list of questions loaded from fragen.json
  questions: [],          // Shuffled list used for the current game
  currentIndex: 0,        // Index of the current question in `questions`

  // --- Player data ---
  playerName: "",

  // --- Game resources ---
  lives: 3,               // Number of lives remaining
  score: 0,               // Current score
  consecutiveCorrectAnswers: 0,  // Streak counter for multiplier
  skipsLeft: 1,           // Number of skip uses remaining
  fiftyFiftyLeft: 1,      // Number of 50:50 uses remaining

  // --- Timer state ---
  timer: 60,              // Current countdown value (seconds)
  initialTimerValue: 60,  // Starting value for the current question's timer
  timerInterval: null,    // Reference to the setInterval for the countdown
  delayInterval: null,    // Reference to the setTimeout for correct-answer delay
  errorDelayInterval: null, // Reference to the setTimeout for wrong-answer delay
  comboTimeout: null,     // Reference to the setTimeout for combo banner
  streakBannerTimeout: null, // Reference to the setTimeout for streak banner

  // --- UI / interaction state ---
  selectedChoice: null,   // Currently selected choice button element
  isAnswerSubmitted: false, // Whether the answer for the current question has been submitted
  fiftyFiftyUsedOnCurrentQuestion: false // Whether 50:50 was used on the current question
};

/**
 * Resets all game state to initial values for a new game.
 *
 * IMPORTANT: This function also clears all timer/interval references
 * to prevent stale callbacks from firing during or after a reset.
 * The caller (e.g. restartGame) is responsible for clearing the
 * actual intervals/timeouts via clearInterval/clearTimeout.
 */
export function resetGameState() {
  state.lives = 3;
  state.score = 0;
  state.skipsLeft = 1;
  state.fiftyFiftyLeft = 1;
  state.currentIndex = 0;
  state.consecutiveCorrectAnswers = 0;
  state.selectedChoice = null;
  state.isAnswerSubmitted = false;
  state.fiftyFiftyUsedOnCurrentQuestion = false;

  // Reset timer values to defaults
  state.timer = 60;
  state.initialTimerValue = 60;

  // Clear timer/interval references to prevent stale callbacks
  state.timerInterval = null;
  state.delayInterval = null;
  state.errorDelayInterval = null;
  state.comboTimeout = null;
  state.streakBannerTimeout = null;
}
