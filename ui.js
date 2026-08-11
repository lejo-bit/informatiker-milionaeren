import { state } from "./state.js";

export function getPlayerTitle(points) {
  if (points >= 10001) return "CODE GOD";
  if (points >= 9001) return "Master of Systems";
  if (points >= 7001) return "Senior Developer";
  if (points >= 5001) return "Tech-Wizard";
  if (points >= 3501) return "Code-Ninja";
  if (points >= 2501) return "System-Schmied";
  if (points >= 1501) return "Bug Hunter";
  if (points >= 1001) return "Junior Coder";
  if (points >= 501) return "Code-Lehrling";
  return "Anfänger";
}

export function updateHud(getStreakMultiplier) {
  const livesEl = document.getElementById("lives");
  livesEl.textContent = state.lives;

  const heartIcon = livesEl.parentElement;
  if (state.lives === 1) {
    heartIcon.classList.add("pulse-heart");
  } else {
    heartIcon.classList.remove("pulse-heart");
  }

  document.getElementById("score").textContent = state.score;
  document.getElementById("timer").textContent = state.timer;

  const playerLabel = document.getElementById("playerLabel");
  if (playerLabel) playerLabel.textContent = state.playerName || "";

  const playerTitleEl = document.getElementById("playerTitle");
  if (playerTitleEl) playerTitleEl.textContent = getPlayerTitle(state.score);

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

  const timerBar = document.getElementById("timerBar");
  if (timerBar) {
    const percentage = Math.max(0, (state.timer / state.initialTimerValue) * 100);
    timerBar.style.width = `${percentage}%`;
    timerBar.classList.toggle("warning", state.timer <= 5);
  }

  const skipsLeftEl = document.getElementById("skipsLeft");
  const skipBtn = document.getElementById("skipBtn");
  if (skipsLeftEl) skipsLeftEl.textContent = state.skipsLeft;
  if (skipBtn) skipBtn.disabled = state.skipsLeft <= 0;
}

export function triggerDamageEffects() {
  const container = document.querySelector(".container");
  if (container) {
    container.classList.remove("shake");
    void container.offsetWidth;
    container.classList.add("shake");
  }

  const flash = document.createElement("div");
  flash.className = "red-flash-overlay";
  document.body.appendChild(flash);
  setTimeout(() => flash.remove(), 500);
}

export function showStreakEffect(count) {
  clearStreakEffect();
  document.body.classList.add(`streak-${count}`);

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

export function clearStreakEffect() {
  document.body.classList.remove("streak-5", "streak-10", "streak-15");
  const oldOverlay = document.querySelector(".streak-background");
  if (oldOverlay) oldOverlay.remove();

  if (state.streakBannerTimeout) {
    clearTimeout(state.streakBannerTimeout);
    state.streakBannerTimeout = null;
  }
}

export function showComboBanner() {
  const banner = document.getElementById("comboBanner");
  if (!banner) return;

  banner.textContent = "🎉 4 Richtige Antworten Combo! +1 Leben ❤️";
  banner.classList.remove("hidden");

  if (state.comboTimeout) clearTimeout(state.comboTimeout);
  state.comboTimeout = setTimeout(() => {
    banner.classList.add("hidden");
  }, 3500);
}

export function hideComboBanner() {
  const banner = document.getElementById("comboBanner");
  if (banner) banner.classList.add("hidden");
  if (state.comboTimeout) clearTimeout(state.comboTimeout);
}

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
    `;
    tbody.appendChild(tr);
  });
}