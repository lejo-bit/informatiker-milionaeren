import { state, resetGameState } from "./state.js";
import { 
  updateHud, 
  triggerDamageEffects, 
  showStreakEffect, 
  clearStreakEffect, 
  showComboBanner, 
  hideComboBanner,
  getPlayerTitle 
} from "./ui.js";
import { saveScoreFirebase, fetchScoresFirebase } from "./firebase.js";

export function getStreakMultiplier() {
  if (state.consecutiveCorrectAnswers >= 9) return 3.0;
  if (state.consecutiveCorrectAnswers >= 6) return 2.0;
  if (state.consecutiveCorrectAnswers >= 3) return 1.5;
  return 1.0;
}

export function shuffleArray(arr) {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[i]];
  }
  return shuffled;
}

export function getDisplayedCorrectAnswers(q, maxAnswers = 2) {
  const answers = Array.isArray(q.antwort) ? q.antwort : [q.antwort];
  return answers.slice(0, maxAnswers).join(", ");
}

export async function loadQuestions() {
  try {
    const res = await fetch("fragen.json");
    state.allQuestions = await res.json();
    state.questions = [...state.allQuestions];

    document.getElementById("loading").classList.add("hidden");
    document.getElementById("startScreen").classList.remove("hidden");
  } catch (err) {
    document.getElementById("loading").classList.add("hidden");
    const errorEl = document.getElementById("error");
    errorEl.textContent = "Error loading questions file.";
    errorEl.classList.remove("hidden");
  }
}

export function startGame() {
  const nameInput = document.getElementById("playerName");
  const enteredName = nameInput ? nameInput.value.trim() : "";
  state.playerName = enteredName;

  if (!enteredName) {
    const errorEl = document.getElementById("error");
    errorEl.textContent = "Please enter your name before starting.";
    errorEl.classList.remove("hidden");
    return;
  }
  document.getElementById("error").classList.add("hidden");

  resetGameState();
  hideComboBanner();
  clearStreakEffect();

  state.questions = shuffleArray(state.questions);
  if (state.questions.length === 0) return;

  document.getElementById("startScreen").classList.add("hidden");
  document.getElementById("game").classList.remove("hidden");
  document.getElementById("gameOver").classList.add("hidden");

  updateHud(getStreakMultiplier);
  renderQuestion();
}

export function renderQuestion() {
  state.isAnswerSubmitted = false;
  state.fiftyFiftyUsedOnCurrentQuestion = false;
  const q = state.questions[state.currentIndex];
  state.selectedChoice = null;

  state.initialTimerValue = q.questionType === "choice" ? 30 : 60;
  state.timer = state.initialTimerValue;
  updateHud(getStreakMultiplier);

  document.getElementById("questionText").textContent = q.frage;

  const categoryElement = document.getElementById("category-badge");
  if (categoryElement) {
    const categoryName = q.category || q.kategorie || "Allgemein";
    categoryElement.textContent = `Kategorie: ${categoryName}`;
  }

  const input = document.getElementById("answerInput");
  const label = document.getElementById("answerLabel");
  const choiceContainer = document.getElementById("choiceContainer");
  const choiceButtons = choiceContainer.querySelectorAll(".choiceBtn");
  const resultBox = document.getElementById("resultBox");

  resultBox.textContent = "";
  resultBox.classList.add("hidden");

  // Prüfen button is only needed for open questions.
  // Choice questions submit automatically when an answer is clicked.
  if (q.questionType === "open") {
    document.getElementById("checkBtn").classList.remove("hidden");
  } else {
    document.getElementById("checkBtn").classList.add("hidden");
  }
  document.getElementById("skipBtn").classList.remove("hidden");
  document.getElementById("fiftyFiftyBtn").classList.remove("hidden");
  document.getElementById("nextBtn").classList.add("hidden");

  if (q.questionType === "open") {
    input.value = "";
    input.disabled = false;
    input.classList.remove("hidden");
    if (label) label.classList.remove("hidden");

    choiceContainer.classList.add("hidden");
    choiceButtons.forEach(btn => {
      btn.textContent = "";
      btn.dataset.isCorrect = "";
      btn.disabled = true;
      btn.className = "choiceBtn";
    });

    setTimeout(() => input.focus(), 100);
  } else if (q.questionType === "choice") {
    input.value = "";
    input.disabled = true;
    input.classList.add("hidden");
    if (label) label.classList.remove("hidden");

    choiceContainer.classList.remove("hidden");

    const options = shuffleArray([
      { text: q.antwort, isCorrect: true },
      ...(q.falseAnswers || []).map(f => ({ text: f, isCorrect: false }))
    ]);

    options.forEach((opt, index) => {
      const btn = choiceButtons[index];
      if (!btn) return;
      btn.textContent = opt.text;
      btn.dataset.isCorrect = opt.isCorrect ? "true" : "false";
      btn.disabled = false;
      btn.className = "choiceBtn";
    });
  }

  startTimer();
}

export function handleFiftyFifty() {
  if (state.isAnswerSubmitted) return;
  if (state.fiftyFiftyLeft <= 0) return;
  if (state.fiftyFiftyUsedOnCurrentQuestion) return;

  const q = state.questions[state.currentIndex];
  if (!q || q.questionType !== "choice") return;

  const choiceButtons = document.querySelectorAll(".choiceBtn");
  const wrongButtons = Array.from(choiceButtons).filter(
    btn => btn.dataset.isCorrect === "false" && !btn.disabled
  );

  if (wrongButtons.length < 2) return;

  const shuffledWrong = shuffleArray(wrongButtons);
  const toRemove = shuffledWrong.slice(0, 2);

  toRemove.forEach(btn => {
    btn.disabled = true;
    btn.classList.add("fifty-fifty-removed");
    btn.textContent = "";
  });

  state.fiftyFiftyLeft--;
  state.fiftyFiftyUsedOnCurrentQuestion = true;
  updateHud(getStreakMultiplier);
}

export function grantComboReward() {
  const roll = Math.random();
  let reward;

  if (roll < 0.4) {
    // 40% chance: extra 50:50
    state.fiftyFiftyLeft += 1;
    reward = "fifty";
  } else if (roll < 0.8) {
    // 40% chance: extra Skip
    state.skipsLeft += 1;
    reward = "skip";
  } else {
    // 20% chance: extra live
    state.lives += 1;
    reward = "live";
  }

  showComboBanner(reward);
  updateHud(getStreakMultiplier);
}

export function handleAnswer() {
  if (state.isAnswerSubmitted) return;

  const q = state.questions[state.currentIndex];
  const resultBox = document.getElementById("resultBox");
  let isCorrect = false;
  let message = "";

  if (q.questionType === "open") {
    const inputVal = document.getElementById("answerInput").value;
    // window.checkAnswer originates from checker.js
    const result = window.checkAnswer(q, inputVal);
    isCorrect = result.isCorrect;

    if (isCorrect) {
      message = result.message;
      resultBox.className = "result correct-result";
    } else {
      message = `❌ Falsch!<br>
        <div class="highlight-correct">
          Richtige Antworten: <span>${getDisplayedCorrectAnswers(q, 2)}</span>
        </div>`;
      resultBox.className = "result wrong-result";
    }
  } else if (q.questionType === "choice") {
    if (!state.selectedChoice) {
      resultBox.textContent = "Bitte wähle eine Antwort aus.";
      resultBox.className = "result";
      resultBox.classList.remove("hidden");
      return;
    }

    isCorrect = state.selectedChoice.dataset.isCorrect === "true";
    if (isCorrect) {
      message = "✅ Richtig! Das ist die korrekte Antwort.";
      resultBox.className = "result correct-result";
    } else {
      message = `❌ Nicht ganz.<br>
        <div class="highlight-correct">
          Richtige Antwort: <span>${q.antwort}</span>
        </div>`;
      resultBox.className = "result wrong-result";
    }

    document.querySelectorAll(".choiceBtn").forEach(btn => {
      btn.disabled = true;
      if (btn.dataset.isCorrect === "true") btn.classList.add("correct");
    });

    if (!isCorrect) state.selectedChoice.classList.add("wrong");
  }

  state.isAnswerSubmitted = true;
  document.getElementById("skipBtn").classList.add("hidden");
  document.getElementById("fiftyFiftyBtn").classList.add("hidden");
  clearInterval(state.timerInterval);

  resultBox.innerHTML = message;
  resultBox.classList.remove("hidden");

  if (isCorrect) {
    let basePoints = 100;
    if (q.questionType === "open") {
      const elapsed = 60 - state.timer;
      if (elapsed > 30) basePoints = Math.max(0, 100 - (elapsed - 30) * 2);
    }
    state.score += Math.round(basePoints * getStreakMultiplier());
    state.consecutiveCorrectAnswers += 1;

    if (state.consecutiveCorrectAnswers % 5 === 0) {
      grantComboReward();
    }

    if ([5, 10, 15].includes(state.consecutiveCorrectAnswers)) {
      showStreakEffect(state.consecutiveCorrectAnswers);
    }
  } else {
    state.consecutiveCorrectAnswers = 0;
    hideComboBanner();
    clearStreakEffect();
    state.lives -= 1;
    triggerDamageEffects();

    if (state.lives <= 0) {
      updateHud(getStreakMultiplier);
      endGame(q);
      return;
    }
  }

  updateHud(getStreakMultiplier);
  const input = document.getElementById("answerInput");
  if (input) input.disabled = true;

  if (isCorrect) {
    goToNextQuestionWithDelay();
  } else {
    document.getElementById("checkBtn").classList.add("hidden");
    document.getElementById("nextBtn").classList.remove("hidden");

    if (state.errorDelayInterval) clearTimeout(state.errorDelayInterval);
    state.errorDelayInterval = setTimeout(goToNextQuestionAfterError, 5000);
  }
}

export function handleSkip() {
  if (state.skipsLeft <= 0 || state.isAnswerSubmitted) return;

  state.skipsLeft--;
  clearInterval(state.timerInterval);
  if (state.errorDelayInterval) clearTimeout(state.errorDelayInterval);
  if (state.delayInterval) clearTimeout(state.delayInterval);

  updateHud(getStreakMultiplier);
  state.currentIndex++;

  if (state.currentIndex >= state.questions.length) {
    endGame();
  } else {
    renderQuestion();
  }
}

export function startTimer() {
  clearInterval(state.timerInterval);
  state.timerInterval = setInterval(() => {
    state.timer -= 1;
    updateHud(getStreakMultiplier);
    if (state.timer <= 0) handleTimeout();
  }, 1000);
}

export function handleTimeout() {
  if (state.isAnswerSubmitted) return;
  state.isAnswerSubmitted = true;
  document.getElementById("skipBtn").classList.add("hidden");
  document.getElementById("fiftyFiftyBtn").classList.add("hidden");
  clearInterval(state.timerInterval);

  const q = state.questions[state.currentIndex];
  const resultBox = document.getElementById("resultBox");

  state.consecutiveCorrectAnswers = 0;
  hideComboBanner();
  clearStreakEffect();
  state.lives -= 1;
  triggerDamageEffects();

  resultBox.textContent = `⏰ Zeit abgelaufen! Richtige Antworten: ${getDisplayedCorrectAnswers(q, 2)}`;
  resultBox.classList.remove("hidden");

  if (q.questionType === "choice") {
    document.querySelectorAll(".choiceBtn").forEach(btn => {
      btn.disabled = true;
      if (btn.dataset.isCorrect === "true") btn.classList.add("correct");
    });
  }

  updateHud(getStreakMultiplier);

  if (state.lives <= 0) {
    endGame(q);
    return;
  }

  const input = document.getElementById("answerInput");
  if (input) input.disabled = true;

  document.getElementById("checkBtn").classList.add("hidden");
  document.getElementById("nextBtn").classList.remove("hidden");

  if (state.errorDelayInterval) clearTimeout(state.errorDelayInterval);
  state.errorDelayInterval = setTimeout(goToNextQuestionAfterError, 15000);
}

export function goToNextQuestionWithDelay() {
  clearInterval(state.timerInterval);
  if (state.errorDelayInterval) clearTimeout(state.errorDelayInterval);

  document.getElementById("checkBtn").classList.add("hidden");
  document.getElementById("nextBtn").classList.add("hidden");

  if (state.delayInterval) clearTimeout(state.delayInterval);
  state.delayInterval = setTimeout(() => {
    if (state.lives <= 0 || state.currentIndex + 1 >= state.questions.length) {
      endGame();
    } else {
      state.currentIndex++;
      renderQuestion();
    }
  }, 2000);
}

export function goToNextQuestionAfterError() {
  if (state.errorDelayInterval) clearTimeout(state.errorDelayInterval);

  if (state.lives <= 0) {
    endGame();
  } else {
    state.currentIndex++;
    if (state.currentIndex >= state.questions.length) {
      endGame();
    } else {
      renderQuestion();
    }
  }
}

export function endGame(q = null) {
  clearInterval(state.timerInterval);
  hideComboBanner();

  if (state.delayInterval) {
    clearTimeout(state.delayInterval);
    state.delayInterval = null;
  }
  if (state.errorDelayInterval) {
    clearTimeout(state.errorDelayInterval);
    state.errorDelayInterval = null;
  }

  clearStreakEffect();

  document.getElementById("game")?.classList.add("hidden");
  document.getElementById("gameOver")?.classList.remove("hidden");
  
  const finalScoreEl = document.getElementById("finalScore");
  if (finalScoreEl) finalScoreEl.textContent = state.score;

  const finalTitleEl = document.getElementById("finalTitle");
  if (finalTitleEl) finalTitleEl.innerHTML = `Titel: <strong>${getPlayerTitle(state.score)}</strong>`;

  const correctAnswerEl = document.getElementById("gameOverCorrectAnswer");
  if (correctAnswerEl) {
    if (q && q.antwort) {
      correctAnswerEl.textContent = `Richtige Antworten: ${getDisplayedCorrectAnswers(q, 2)}`;
      correctAnswerEl.classList.remove("hidden");
    } else {
      correctAnswerEl.textContent = "";
      correctAnswerEl.classList.add("hidden");
    }
  }

  saveScoreFirebase(state.playerName, state.score);
  fetchScoresFirebase();
}

export function restartGame() {
  resetGameState();
  clearInterval(state.timerInterval);
  clearTimeout(state.delayInterval);
  clearTimeout(state.errorDelayInterval);
  hideComboBanner();
  clearStreakEffect();

  state.questions = shuffleArray([...state.allQuestions]);

  document.getElementById("gameOver").classList.add("hidden");
  document.getElementById("game").classList.remove("hidden");

  updateHud(getStreakMultiplier);
  renderQuestion();
}