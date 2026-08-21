/**
 * main.js — Application entry point.
 *
 * This module sets up the initial DOM event listeners after the page
 * loads: it loads the questions, fetches the leaderboard from Firebase,
 * and wires up all button click handlers and keyboard events.
 *
 * It imports shared state from state.js and game functions from game.js.
 */

// NOTE: The ?v=7 query parameters are intentional cache-busters.
// Without them, GitHub Pages can serve stale cached copies of old
// module versions while main.js itself is freshly fetched (because
// main.js is loaded with ?v=... in index.html). This caused the
// deployed SyntaxError ("does not provide an export named
// 'simulateStreakTest'") because the cached game.js was older than
// the freshly-fetched main.js. Bump the version when changing any
// module's exports/imports so all modules reload together.
import { state } from "./state.js?v=7";
import { fetchScoresFirebase } from "./firebase.js?v=7";
import { initFeedback } from "./feedback.js?v=7";
import {
  loadQuestions,
  startGame,
  handleAnswer,
  handleSkip,
  handleFiftyFifty,
  goToNextQuestionAfterError,
  restartGame,
  simulateStreakTest
} from "./game.js?v=7";

document.addEventListener("DOMContentLoaded", () => {
  // Load questions from fragen.json and fetch leaderboard scores
  loadQuestions();
  fetchScoresFirebase();

  // Initialize the feedback button and modal
  initFeedback();

  // --- Button event listeners ---
  document.getElementById("startBtn").addEventListener("click", startGame);
  document.getElementById("checkBtn").addEventListener("click", handleAnswer);
  document.getElementById("fiftyFiftyBtn").addEventListener("click", handleFiftyFifty);
  document.getElementById("skipBtn").addEventListener("click", handleSkip);
  document.getElementById("nextBtn").addEventListener("click", goToNextQuestionAfterError);
  document.getElementById("restartBtn").addEventListener("click", restartGame);

  // TEST-ONLY helper: builds a small test-controls bar with the
  // streak simulator button. The button is intentionally NOT in the
  // static HTML so it never appears in production — it is only
  // injected when the page is served from a local dev server
  // (localhost or 127.0.0.1), e.g. via a local HTTP server.
  function createStreakTestControls() {
    const gameEl = document.getElementById("game");
    if (!gameEl || document.getElementById("streakTestBtn")) return;

    const bar = document.createElement("div");
    bar.className = "buttons test-controls";

    const btn = document.createElement("button");
    btn.id = "streakTestBtn";
    btn.className = "test-btn";
    btn.textContent = "🧪 Streak-Test";

    btn.addEventListener("click", () => {
      if (state.isAnswerSubmitted) return;
      simulateStreakTest();
    });

    bar.appendChild(btn);
    gameEl.appendChild(bar);
  }

  const isLocalDev =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname === "[::1]" ||
    window.location.protocol === "file:";

  if (isLocalDev) {
    createStreakTestControls();
  }

  // --- Choice button click handler ---
  // For multiple-choice questions, clicking an answer automatically
  // submits it (no separate "Prüfen" button needed).
  const choiceContainer = document.getElementById("choiceContainer");
  const choiceButtons = choiceContainer.querySelectorAll(".choiceBtn");
  choiceButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      // Ignore clicks if the answer has already been submitted
      if (state.isAnswerSubmitted) return;
      // Ignore clicks on disabled buttons (e.g. after 50:50 removal)
      if (btn.disabled) return;

      // Highlight the selected button
      choiceButtons.forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
      state.selectedChoice = btn;

      // Auto-submit for choice-type questions
      const q = state.questions[state.currentIndex];
      if (q && q.questionType === "choice") {
        handleAnswer();
      }
    });
  });

  // --- Open-ended answer input handler ---
  // Pressing Enter submits the answer for open-ended questions.
  const answerInput = document.getElementById("answerInput");
  answerInput.addEventListener("keydown", event => {
    if (event.key === "Enter") {
      const q = state.questions[state.currentIndex];
      if (q && q.questionType === "open") {
        event.preventDefault();
        handleAnswer();
      }
    }
  });
});
