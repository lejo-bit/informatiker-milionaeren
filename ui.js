/**
 * ui.js — UI rendering and visual effects.
 *
 * This module handles all DOM updates: HUD (lives, score, timer, etc.),
 * player titles, streak/combo visual effects, and the leaderboard table.
 *
 * It imports the shared `state` object from state.js and is imported by
 * game.js and firebase.js.
 */

import { state } from "./state.js";

/**
 * Returns a player title based on the given score.
 * Titles are tiered — higher scores unlock cooler titles.
 *
 * @param {number} points - The player's current score.
 * @returns {string} The player's title.
 */
export function getPlayerTitle(points) {
  if (points >= 10001) return "OVERDEITY!!!";
  if (points >= 9001) return "LET HIM COOK!";
  if (points >= 7001) return "OMFG!";
  if (points >= 5001) return "Godling";
  if (points >= 3501) return "Absolute Unit";
  if (points >= 2501) return "Aura";
  if (points >= 1501) return "Ordinary Joe";
  if (points >= 1001) return "Flutterby";
  if (points >= 501) return "Creeper";
  return "Anfänger";
}

/**
 * Updates all HUD elements (lives, score, timer, multiplier, etc.)
 * to reflect the current game state.
 *
 * @param {Function} getStreakMultiplier - Function that returns the current
 *   streak multiplier (passed from game.js to avoid circular imports).
 */
export function updateHud(getStreakMultiplier) {
  // --- Lives ---
  const livesEl = document.getElementById("lives");
  livesEl.textContent = state.lives;

  // Pulse animation when only 1 life remains
  const heartIcon = livesEl.parentElement;
  if (state.lives === 1) {
    heartIcon.classList.add("pulse-heart");
  } else {
    heartIcon.classList.remove("pulse-heart");
  }

  // --- Score ---
  document.getElementById("score").textContent = state.score;

  // --- Timer ---
  document.getElementById("timer").textContent = state.timer;

  // --- Player name ---
  const playerLabel = document.getElementById("playerLabel");
  if (playerLabel) playerLabel.textContent = state.playerName || "";

  // --- Player title ---
  const playerTitleEl = document.getElementById("playerTitle");
  if (playerTitleEl) playerTitleEl.textContent = getPlayerTitle(state.score);

  // --- Streak multiplier badge ---
  const multiplierBadge = document.getElementById("multiplierBadge");
  const currentMultiplier = getStreakMultiplier();
  if (multiplierBadge) {
    if (currentMultiplier > 1.0) {
      multiplierBadge.textContent = `⚡ x${currentMultiplier.toFixed(1)}`;
      multiplierBadge.classList.remove("hidden");
    } else {
      multiplierBadge.classList.add("hidden");
    }
  }

  // --- Timer bar (visual progress bar) ---
  const timerBar = document.getElementById("timerBar");
  if (timerBar) {
    const percentage = Math.max(0, (state.timer / state.initialTimerValue) * 100);
    timerBar.style.width = `${percentage}%`;
    timerBar.classList.toggle("warning", state.timer <= 5);
  }

  // --- Skips ---
  const skipsLeftEl = document.getElementById("skipsLeft");
  const skipBtn = document.getElementById("skipBtn");
  if (skipsLeftEl) skipsLeftEl.textContent = state.skipsLeft;
  if (skipBtn) skipBtn.disabled = state.skipsLeft <= 0;

  // --- 50:50 ---
  const fiftyFiftyLeftEl = document.getElementById("fiftyFiftyLeft");
  const fiftyFiftyBtn = document.getElementById("fiftyFiftyBtn");
  if (fiftyFiftyLeftEl) fiftyFiftyLeftEl.textContent = state.fiftyFiftyLeft;

  // IMPORTANT: The 50:50 button is intentionally INDEPENDENT of skipsLeft.
  // It must remain usable even when the player has 0 skips remaining.
  if (fiftyFiftyBtn) {
    const q = state.questions[state.currentIndex];
    const isChoiceQuestion = q && q.questionType === "choice";
    const hasFiftyFiftyLeft = state.fiftyFiftyLeft > 0;
    const notUsedOnCurrentQuestion = !state.fiftyFiftyUsedOnCurrentQuestion;
    const notSubmitted = !state.isAnswerSubmitted;

    const canUse = hasFiftyFiftyLeft && notUsedOnCurrentQuestion && notSubmitted;
    fiftyFiftyBtn.disabled = !isChoiceQuestion || !canUse;
  }
}

/**
 * Triggers visual damage effects when the player loses a life:
 * a screen shake and a red flash overlay.
 */
export function triggerDamageEffects() {
  const container = document.querySelector(".container");
  if (container) {
    container.classList.remove("shake");
    void container.offsetWidth; // Force reflow to restart animation
    container.classList.add("shake");
  }

  const flash = document.createElement("div");
  flash.className = "red-flash-overlay";
  document.body.appendChild(flash);
  setTimeout(() => flash.remove(), 500);
}

/**
 * Shows the streak visual effect (background overlay + banner) when
 * the player reaches a streak milestone (5, 10, or 15 correct answers).
 *
 * @param {number} count - The streak count that was reached.
 */
export function showStreakEffect(count) {
  clearStreakEffect();
  document.body.classList.add(`streak-${count}`);

  // Create a streak background overlay element
  const overlay = document.createElement("div");
  overlay.className = "streak-background";
  document.body.appendChild(overlay);

  const banner = document.getElementById("comboBanner");
  if (!banner) return;

  banner.classList.remove("hidden");
  banner.textContent = count === 5
    ? "🔥 5 richtige Antworten in Folge! Streak-Effekt aktiviert!"
    : count === 10
      ? "💥 10 richtige Antworten! Mega-Streak!"
      : "🌟 15 richtige Antworten! Ultimate Streak!";

  if (state.streakBannerTimeout) clearTimeout(state.streakBannerTimeout);
  state.streakBannerTimeout = setTimeout(() => {
    if (banner && banner.textContent.includes("Streak")) {
      banner.classList.add("hidden");
    }
  }, 4200);
}

/**
 * Clears all streak visual effects: removes body classes,
 * removes the streak background overlay, and clears the banner timeout.
 */
export function clearStreakEffect() {
  document.body.classList.remove("streak-5", "streak-10", "streak-15");
  const oldOverlay = document.querySelector(".streak-background");
  if (oldOverlay) oldOverlay.remove();

  if (state.streakBannerTimeout) {
    clearTimeout(state.streakBannerTimeout);
    state.streakBannerTimeout = null;
  }
}

/**
 * Shows the combo reward banner when the player earns a reward
 * (every 5 correct answers in a row).
 *
 * @param {string} reward - The type of reward: "live", "skip", or "fifty".
 */
export function showComboBanner(reward = "live") {
  const banner = document.getElementById("comboBanner");
  if (!banner) return;

  const messages = {
    live: "🎉 5 Richtige Antworten Combo! +1 Leben ❤️",
    skip: "🎉 5 Richtige Antworten Combo! +1 Überspringen ⏭️",
    fifty: "🎉 5 Richtige Antworten Combo! +1 50:50 💡"
  };

  banner.textContent = messages[reward] || messages.live;
  banner.classList.remove("hidden");

  if (state.comboTimeout) clearTimeout(state.comboTimeout);
  state.comboTimeout = setTimeout(() => {
    banner.classList.add("hidden");
  }, 3500);
}

/**
 * Hides the combo banner and clears its timeout.
 */
export function hideComboBanner() {
  const banner = document.getElementById("comboBanner");
  if (banner) banner.classList.add("hidden");
  if (state.comboTimeout) clearTimeout(state.comboTimeout);
}

/**
 * Renders the leaderboard table with the given scores.
 *
 * @param {Array<{name: string, points: number}>} scores - Array of score entries.
 */
export function renderScoreTable(scores) {
  const tbody = document.getElementById("scoreTableBody");
  if (!tbody) return;

  tbody.innerHTML = "";
  scores.forEach((entry, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${entry.name}</td>
      <td>${entry.points}</td>
      <td>${getPlayerTitle(entry.points)}</td>
    `;
    tbody.appendChild(tr);
  });
}
