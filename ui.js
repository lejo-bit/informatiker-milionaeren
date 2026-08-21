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
  if (points >= 30001) return "ZENO";
  if (points >= 20001) return "CHUCK NORRIS";
  if (points >= 15001) return "KEANU KNEES!";
  if (points >= 10001) return "OVERDEITY";
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

  // --- Streak counter ---
  const streakCounterEl = document.getElementById("streakCounter");
  if (streakCounterEl) {
    streakCounterEl.textContent = state.consecutiveCorrectAnswers;
    streakCounterEl.classList.toggle("hot", state.consecutiveCorrectAnswers >= 5);
  }

  // --- Category streak ---
  const categoryStreakEl = document.getElementById("categoryStreak");
  if (categoryStreakEl) {
    if (state.categoryStreak >= 2) {
      categoryStreakEl.textContent = `🗂️ ${state.categoryStreak}x Kombi`;
      categoryStreakEl.classList.remove("hidden");
    } else {
      categoryStreakEl.classList.add("hidden");
    }
  }

  // --- Bosses defeated ---
  const bossesDefeatedEl = document.getElementById("bossesDefeated");
  if (bossesDefeatedEl) {
    if (state.bossesDefeated > 0) {
      bossesDefeatedEl.textContent = `👹 ${state.bossesDefeated}`;
      bossesDefeatedEl.classList.remove("hidden");
    } else {
      bossesDefeatedEl.classList.add("hidden");
    }
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
    const isRewardQuestion = q && q.nr === 9999;
    const hasFiftyFiftyLeft = state.fiftyFiftyLeft > 0;
    const notUsedOnCurrentQuestion = !state.fiftyFiftyUsedOnCurrentQuestion;
    const notSubmitted = !state.isAnswerSubmitted;

    const canUse = hasFiftyFiftyLeft && notUsedOnCurrentQuestion && notSubmitted;
    fiftyFiftyBtn.disabled = !isChoiceQuestion || isRewardQuestion || !canUse;
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

  // Pulse the container (not body) to avoid breaking fixed-position
  // elements like the floating feedback button.
  const container = document.querySelector(".container");
  if (container) container.classList.add("streak-pulse");

  const banner = document.getElementById("comboBanner");
  if (!banner) return;

  banner.classList.remove("hidden");

  // Build the streak message
  const streakMessage = count === 5
    ? "🔥 5 richtige Antworten in Folge! Streak-Effekt aktiviert!"
    : count === 10
      ? "💥 10 richtige Antworten! Mega-Streak!"
      : "🌟 15 richtige Antworten! Ultimate Streak!";

  // Append to existing text (preserves the combo/prize message) instead of overwriting
  banner.textContent = banner.textContent
    ? `${banner.textContent} ${streakMessage}`
    : streakMessage;

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
  const container = document.querySelector(".container");
  if (container) container.classList.remove("streak-pulse");

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
 * Shows the "BOSS FIGHT!" intro banner when a boss question appears.
 * The banner auto-hides after a short delay.
 */
export function showBossIntro() {
  const banner = document.getElementById("bossBanner");
  if (!banner) return;

  banner.textContent = "👹 BOSS-KAMPF! 👹";
  banner.classList.remove("hidden");

  if (state.bossBannerTimeout) clearTimeout(state.bossBannerTimeout);
  state.bossBannerTimeout = setTimeout(() => {
    banner.classList.add("hidden");
  }, 2500);
}

/**
 * Shows the persistent boss badge next to the question text while a
 * boss question is active.
 */
export function showBossBadge() {
  const badge = document.getElementById("bossBadge");
  if (badge) badge.classList.remove("hidden");
}

/**
 * Hides the boss badge (used when leaving a boss question).
 */
export function clearBossBadge() {
  const badge = document.getElementById("bossBadge");
  if (badge) badge.classList.add("hidden");

  const banner = document.getElementById("bossBanner");
  if (banner) banner.classList.add("hidden");

  if (state.bossBannerTimeout) {
    clearTimeout(state.bossBannerTimeout);
    state.bossBannerTimeout = null;
  }
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

  // NOTE: Cells are built with textContent (not innerHTML) so that
  // player-provided names can never inject markup (stored XSS).
  scores.forEach((entry, index) => {
    const tr = document.createElement("tr");

    const rankCell = document.createElement("td");
    rankCell.textContent = index + 1;

    const nameCell = document.createElement("td");
    nameCell.textContent = entry.name;

    const pointsCell = document.createElement("td");
    pointsCell.textContent = entry.points;

    const titleCell = document.createElement("td");
    titleCell.textContent = getPlayerTitle(entry.points);

    tr.append(rankCell, nameCell, pointsCell, titleCell);
    tbody.appendChild(tr);
  });
}
