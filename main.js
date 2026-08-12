/**
 * main.js — Application entry point.
 *
 * This module sets up the initial DOM event listeners after the page
 * loads: it loads the questions, fetches the leaderboard from Firebase,
 * and wires up all button click handlers and keyboard events.
 *
 * It imports shared state from state.js and game functions from game.js.
 */

import { state } from "./state.js";
import { fetchScoresFirebase } from "./firebase.js";
import { initFeedback } from "./feedback.js";
import {
  loadQuestions,
  startGame,
  handleAnswer,
  handleSkip,
  handleFiftyFifty,
  goToNextQuestionAfterError,
  restartGame
} from "./game.js";

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
