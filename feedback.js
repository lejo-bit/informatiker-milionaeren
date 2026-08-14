/**
 * feedback.js — Feedback button and modal logic.
 *
 * Provides a floating feedback button that is always visible and a modal
 * dialog for submitting feedback. During the game, it pauses the game
 * and sends the current question's "nr". During start or game over
 * screens, it sends 0 as the "nr".
 */

import { state } from "./state.js";
import { startTimer, goToNextQuestionAfterError, goToNextQuestionWithDelay } from "./game.js";

// Tracks whether the game was paused by the feedback modal
let gameWasPaused = false;
// Tracks whether the game was in a delay state (auto-advance pending)
let wasInDelayState = false;
// Tracks whether the delay was a correct-answer delay or error delay
let wasErrorDelay = false;

/**
 * Initializes the feedback system: creates the button and modal in the DOM,
 * and sets up event listeners.
 */
export function initFeedback() {
  // Create the floating feedback button
  const feedbackBtn = document.createElement("button");
  feedbackBtn.id = "feedbackFloatingBtn";
  feedbackBtn.className = "feedback-float-btn";
  feedbackBtn.textContent = "Feedback";
  feedbackBtn.setAttribute("aria-label", "Feedback geben");
  document.body.appendChild(feedbackBtn);

  // Create the modal overlay
  const modal = document.createElement("div");
  modal.id = "feedbackModal";
  modal.className = "feedback-modal hidden";
  modal.innerHTML = `
    <div class="feedback-modal-content">
      <button class="feedback-close-btn" id="feedbackCloseBtn" aria-label="Schliessen">&times;</button>
      <h2>Feedback</h2>
      <p class="feedback-subtitle">Was bedrückt dich?</p>
      <textarea id="feedbackInput" class="feedback-input" placeholder="Deine Nachricht..." rows="4"></textarea>
      <button id="feedbackSendBtn" class="feedback-send-btn">Senden</button>
      <p id="feedbackSuccess" class="feedback-success hidden">Danke für dein Feedback!</p>
    </div>
  `;
  document.body.appendChild(modal);

  // --- Event Listeners ---

  // Open modal on button click
  feedbackBtn.addEventListener("click", () => {
    openFeedbackModal(modal);
  });

  // Close modal on X button
  document.getElementById("feedbackCloseBtn").addEventListener("click", () => {
    closeFeedbackModal(modal);
  });

  // Close modal on overlay click (click outside content)
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeFeedbackModal(modal);
    }
  });

  // Close modal on Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.classList.contains("hidden")) {
      closeFeedbackModal(modal);
    }
  });

  // Send button click
  document.getElementById("feedbackSendBtn").addEventListener("click", () => {
    handleFeedbackSend(modal);
  });

  // Allow Ctrl+Enter to send from textarea
  document.getElementById("feedbackInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleFeedbackSend(modal);
    }
  });
}

/**
 * Checks whether the game is currently active (game screen visible,
 * game over screen hidden).
 *
 * @returns {boolean} True if the game is active.
 */
function isGameActive() {
  const gameEl = document.getElementById("game");
  const gameOverEl = document.getElementById("gameOver");
  return (
    gameEl &&
    gameOverEl &&
    !gameEl.classList.contains("hidden") &&
    gameOverEl.classList.contains("hidden")
  );
}

/**
 * Opens the feedback modal and pauses the game if it's running.
 * @param {HTMLElement} modal - The modal element.
 */
function openFeedbackModal(modal) {
  const input = modal.querySelector("#feedbackInput");
  const success = modal.querySelector("#feedbackSuccess");
  const sendBtn = modal.querySelector("#feedbackSendBtn");

  // Reset UI
  input.value = "";
  input.classList.remove("hidden");
  sendBtn.classList.remove("hidden");
  success.classList.add("hidden");
  input.style.display = "";
  sendBtn.style.display = "";

  modal.classList.remove("hidden");
  setTimeout(() => input.focus(), 100);

  // Pause the game if it's active: stop the countdown timer and any
  // pending auto-advance delays so the game freezes while feedback is open.
  if (isGameActive()) {
    gameWasPaused = true;
    wasInDelayState = false;
    wasErrorDelay = false;

    if (state.timerInterval) {
      clearInterval(state.timerInterval);
    }
    if (state.delayInterval) {
      clearTimeout(state.delayInterval);
      wasInDelayState = true;
      wasErrorDelay = false;
    }
    if (state.errorDelayInterval) {
      clearTimeout(state.errorDelayInterval);
      wasInDelayState = true;
      wasErrorDelay = true;
    }
  }
}

/**
 * Closes the feedback modal and resumes the game if it was paused.
 * @param {HTMLElement} modal - The modal element.
 */
function closeFeedbackModal(modal) {
  modal.classList.add("hidden");

  // Resume the game if it was paused by the feedback modal
  if (gameWasPaused && isGameActive()) {
    if (wasInDelayState) {
      // Restore the auto-advance delay
      if (wasErrorDelay) {
        // Restart the 5-second error delay before auto-advancing
        state.errorDelayInterval = setTimeout(goToNextQuestionAfterError, 5000);
      } else {
        // Restart the 2-second correct-answer delay
        goToNextQuestionWithDelay();
      }
    } else if (!state.isAnswerSubmitted) {
      // Restart the countdown timer
      startTimer();
    }
  }

  gameWasPaused = false;
  wasInDelayState = false;
  wasErrorDelay = false;
}

/**
 * Handles sending feedback to Firebase.
 * @param {HTMLElement} modal - The modal element.
 */
async function handleFeedbackSend(modal) {
  const input = modal.querySelector("#feedbackInput");
  const feedbackText = input.value.trim();

  if (!feedbackText) {
    input.focus();
    input.style.borderColor = "#c62828";
    setTimeout(() => { input.style.borderColor = ""; }, 2000);
    return;
  }

  const sendBtn = modal.querySelector("#feedbackSendBtn");
  const success = modal.querySelector("#feedbackSuccess");
  const textarea = modal.querySelector("#feedbackInput");

  // Determine the "nr" value: current question's nr during the game,
  // otherwise 0 (start screen, game over screen, loading).
  let nr = 0;
  if (isGameActive() && state.questions && state.questions.length > 0) {
    const currentQ = state.questions[state.currentIndex];
    nr = currentQ ? currentQ.nr : 0;
  }

  // Disable button and show sending state
  sendBtn.disabled = true;
  sendBtn.textContent = "Senden...";

  try {
    const db = window.firebaseDb;
    const helpers = window.firebaseHelpers;
    if (!db || !helpers) {
      console.error("Firebase not initialized");
      return;
    }

    const { collection, addDoc } = helpers;
    await addDoc(collection(db, "feedback"), {
      nr: nr,
      feedback: feedbackText,
      date: new Date().toISOString()
    });

    // Show success message
    textarea.style.display = "none";
    sendBtn.style.display = "none";
    success.classList.remove("hidden");

    // Auto-close after 2 seconds
    setTimeout(() => {
      closeFeedbackModal(modal);
    }, 2000);
  } catch (err) {
    console.error("Error saving feedback:", err);
    sendBtn.disabled = false;
    sendBtn.textContent = "Senden";
  }
}