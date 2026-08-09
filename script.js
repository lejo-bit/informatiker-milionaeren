let allQuestions = [];
let questions = [];
let currentIndex = 0;
let lives = 5;
let score = 0;
let consecutiveCorrectAnswers = 0;

let timer = 30;
let initialTimerValue = 30;
let timerInterval = null;
let delayInterval = null;
let errorDelayInterval = null;
let comboTimeout = null;
let selectedChoice = null;
let playerName = "";
let isAnswerSubmitted = false;
let skipsLeft = 2; // Maximum 2 skips per game

// ===== GAME JUICE & MULTIPLIER HELPERS =====
function getStreakMultiplier() {
  if (consecutiveCorrectAnswers >= 9) return 3.0;
  if (consecutiveCorrectAnswers >= 6) return 2.0;
  if (consecutiveCorrectAnswers >= 3) return 1.5;
  return 1.0;
}

function triggerDamageEffects() {
  // Screen shake on main container
  const container = document.querySelector(".container");
  if (container) {
    container.classList.remove("shake");
    void container.offsetWidth; // Trigger reflow to restart animation
    container.classList.add("shake");
  }

  // Red flash on full screen
  const flash = document.createElement("div");
  flash.className = "red-flash-overlay";
  document.body.appendChild(flash);
  setTimeout(() => flash.remove(), 500);
}

// ===== FIREBASE FUNCTIONS =====
async function saveScoreFirebase(name, points) {
  try {
    const db = window.firebaseDb;
    const helpers = window.firebaseHelpers;
    if (!db || !helpers) return;

    const { collection, addDoc } = helpers;

    await addDoc(collection(db, "scores"), {
      name,
      points: Number(points),
      date: new Date().toISOString()
    });
  } catch (err) {
    console.error("Fehler beim Speichern des Scores in Firestore:", err);
  }
}

async function fetchScoresFirebase() {
  try {
    const db = window.firebaseDb;
    const helpers = window.firebaseHelpers;
    if (!db || !helpers) return;

    const { collection, getDocs, query, limit } = helpers;
    const scoresCol = collection(db, "scores");

    const q = query(scoresCol, limit(50));
    const snap = await getDocs(q);

    const scores = [];
    snap.forEach(doc => {
      const data = doc.data();
      scores.push({
        ...data,
        points: Number(data.points) || 0
      });
    });

    scores.sort((a, b) => b.points - a.points);

    renderScoreTable(scores.slice(0, 10));
  } catch (err) {
    console.error("Fehler beim Laden der Scores aus Firestore:", err);
  }
}

function renderScoreTable(scores) {
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

// ===== GAME LOGIC =====
async function loadQuestions() {
  try {
    const res = await fetch("fragen.json");
    const loadedQuestions = await res.json();

    allQuestions = loadedQuestions;
    questions = [...allQuestions];

    document.getElementById("loading").classList.add("hidden");
    document.getElementById("startScreen").classList.remove("hidden");
  } catch (err) {
    document.getElementById("loading").classList.add("hidden");
    const errorEl = document.getElementById("error");
    errorEl.textContent = "Fehler beim Laden der Fragen.";
    errorEl.classList.remove("hidden");
  }
}

function showComboBanner() {
  const banner = document.getElementById("comboBanner");
  if (!banner) return;

  banner.classList.remove("hidden");

  if (comboTimeout) clearTimeout(comboTimeout);
  comboTimeout = setTimeout(() => {
    banner.classList.add("hidden");
  }, 3500);
}

function hideComboBanner() {
  const banner = document.getElementById("comboBanner");
  if (banner) banner.classList.add("hidden");
  if (comboTimeout) clearTimeout(comboTimeout);
}

function startGame() {
  skipsLeft = 2;
  const nameInput = document.getElementById("playerName");
  const enteredName = nameInput ? nameInput.value.trim() : "";
  playerName = enteredName;

  if (!enteredName) {
    const errorEl = document.getElementById("error");
    errorEl.textContent = "Bitte gib deinen Namen ein, bevor du startest.";
    errorEl.classList.remove("hidden");
    return;
  } else {
    document.getElementById("error").classList.add("hidden");
  }

  lives = 5;
  score = 0;
  currentIndex = 0;
  consecutiveCorrectAnswers = 0;
  hideComboBanner();

  questions = shuffleArray(questions);

  if (questions.length === 0) {
    console.error("Keine Fragen geladen.");
    return;
  }

  document.getElementById("startScreen").classList.add("hidden");
  document.getElementById("game").classList.remove("hidden");
  document.getElementById("gameOver").classList.add("hidden");

  updateHud();
  renderQuestion();
}

function updateHud() {
  const livesEl = document.getElementById("lives");
  livesEl.textContent = lives;

  const heartIcon = livesEl.parentElement;
  if (lives === 1) {
    heartIcon.classList.add("pulse-heart");
  } else {
    heartIcon.classList.remove("pulse-heart");
  }

  document.getElementById("score").textContent = score;
  document.getElementById("timer").textContent = timer;

  const playerLabel = document.getElementById("playerLabel");
  if (playerLabel) playerLabel.textContent = playerName || "";

  // Multiplier Badge
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
    const percentage = Math.max(0, (timer / initialTimerValue) * 100);
    timerBar.style.width = `${percentage}%`;

    if (timer <= 5) {
      timerBar.classList.add("warning");
    } else {
      timerBar.classList.remove("warning");
    }
  }

  // Skip Button Counter & Disabled State
  const skipsLeftEl = document.getElementById("skipsLeft");
  const skipBtn = document.getElementById("skipBtn");

  if (skipsLeftEl) skipsLeftEl.textContent = skipsLeft;
  if (skipBtn) {
    skipBtn.disabled = skipsLeft <= 0;
  }
}

function shuffleArray(arr) {
  const shuffled = [...arr];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[i]];
  }

  return shuffled;
}

function getShuffledOptions(question) {
  const options = [
    { text: question.antwort, isCorrect: true },
    ...(question.falseAnswers || []).map(f => ({ text: f, isCorrect: false }))
  ];
  return shuffleArray(options);
}

function getDisplayedCorrectAnswers(q, maxAnswers = 2) {
  const answers = Array.isArray(q.antwort) ? q.antwort : [q.antwort];
  return answers.slice(0, maxAnswers).join(", ");
}

function getInitialTimeForQuestion(q) {
  return q.questionType === "choice" ? 30 : 60;
}

function calculatePointsForQuestion(q) {
  let basePoints = 100;

  if (q.questionType === "open") {
    const elapsed = 60 - timer;
    if (elapsed > 30) {
      const extraSeconds = elapsed - 30;
      basePoints = Math.max(0, 100 - extraSeconds * 2);
    }
  }

  const multiplier = getStreakMultiplier();
  return Math.round(basePoints * multiplier);
}

function hideAnswerInputs() {
  const choiceContainer = document.getElementById("choiceContainer");
  if (choiceContainer) choiceContainer.classList.add("hidden");

  const input = document.getElementById("answerInput");
  const label = document.getElementById("answerLabel");
  if (input) input.classList.add("hidden");
  if (label) label.classList.add("hidden");
}

function renderQuestion() {
  isAnswerSubmitted = false;
  const q = questions[currentIndex];
  selectedChoice = null;

  initialTimerValue = getInitialTimeForQuestion(q);
  timer = initialTimerValue;
  updateHud();

  document.getElementById("questionText").textContent = q.frage;

  const input = document.getElementById("answerInput");
  const label = document.getElementById("answerLabel");
  const choiceContainer = document.getElementById("choiceContainer");
  const choiceButtons = choiceContainer.querySelectorAll(".choiceBtn");
  const resultBox = document.getElementById("resultBox");

  resultBox.textContent = "";
  resultBox.classList.add("hidden");

  document.getElementById("checkBtn").classList.remove("hidden");
  document.getElementById("skipBtn").classList.remove("hidden");
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

    const options = getShuffledOptions(q);
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

function handleAnswer() {
  if (isAnswerSubmitted) return;

  const q = questions[currentIndex];
  const resultBox = document.getElementById("resultBox");

  let isCorrect = false;
  let message = "";

  if (q.questionType === "open") {
    const inputVal = document.getElementById("answerInput").value;
    const result = checkAnswer(q, inputVal);
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
    if (!selectedChoice) {
      resultBox.textContent = "Bitte wähle eine Antwort aus.";
      resultBox.className = "result";
      resultBox.classList.remove("hidden");
      return;
    }

    isCorrect = selectedChoice.dataset.isCorrect === "true";
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

    const choiceButtons = document.querySelectorAll(".choiceBtn");
    choiceButtons.forEach(btn => {
      btn.disabled = true;
      if (btn.dataset.isCorrect === "true") {
        btn.classList.add("correct");
      }
    });

    if (!isCorrect) {
      selectedChoice.classList.add("wrong");
    }
  }

  isAnswerSubmitted = true;
  document.getElementById("skipBtn").classList.add("hidden");
  clearInterval(timerInterval);

  resultBox.innerHTML = message;
  resultBox.classList.remove("hidden");

  // ===== STATS & DAMAGE LOGIC =====
  if (isCorrect) {
    score += calculatePointsForQuestion(q);
    consecutiveCorrectAnswers += 1;

    // +1 Life every 4 streak
    if (consecutiveCorrectAnswers % 4 === 0) {
      lives += 1;
      showComboBanner();
    }
  } else {
    consecutiveCorrectAnswers = 0; // Reset streak on mistake
    hideComboBanner();
    lives -= 1;
    
    // Trigger Screen Shake & Red Flash animation
    triggerDamageEffects();

    if (lives <= 0) {
      updateHud();
      endGame(q);
      return;
    }
  }

  updateHud();

  const input = document.getElementById("answerInput");
  if (input) input.disabled = true;

  if (isCorrect) {
    goToNextQuestionWithDelay();
  } else {
    document.getElementById("checkBtn").classList.add("hidden");
    document.getElementById("nextBtn").classList.remove("hidden");

    if (errorDelayInterval) clearTimeout(errorDelayInterval);
    errorDelayInterval = setTimeout(() => {
      goToNextQuestionAfterError();
    }, 15000);
  }
}

function handleSkip() {
  if (skipsLeft <= 0 || isAnswerSubmitted) return;

  skipsLeft--;
  clearInterval(timerInterval);
  if (errorDelayInterval) clearTimeout(errorDelayInterval);
  if (delayInterval) clearTimeout(delayInterval);

  updateHud();

  // Move to next question or end game if last question
  currentIndex++;
  if (currentIndex >= questions.length) {
    endGame();
  } else {
    renderQuestion();
  }
}

function goToNextQuestionWithDelay() {
  clearInterval(timerInterval);
  if (errorDelayInterval) clearTimeout(errorDelayInterval);

  document.getElementById("checkBtn").classList.add("hidden");
  document.getElementById("nextBtn").classList.add("hidden");

  if (delayInterval) clearTimeout(delayInterval);

  delayInterval = setTimeout(() => {
    if (lives <= 0 || currentIndex + 1 >= questions.length) {
      endGame();
    } else {
      currentIndex++;
      renderQuestion();
    }
  }, 2000);
}

function goToNextQuestionAfterError() {
  if (errorDelayInterval) clearTimeout(errorDelayInterval);

  if (lives <= 0) {
    endGame();
  } else {
    currentIndex++;
    if (currentIndex >= questions.length) {
      endGame();
    } else {
      renderQuestion();
    }
  }
}

function startTimer() {
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timer -= 1;
    updateHud();

    if (timer <= 0) {
      handleTimeout();
    }
  }, 1000);
}

function handleTimeout() {
  if (isAnswerSubmitted) return;
  isAnswerSubmitted = true;
  document.getElementById("skipBtn").classList.add("hidden");
  clearInterval(timerInterval);

  const q = questions[currentIndex];
  const resultBox = document.getElementById("resultBox");

  consecutiveCorrectAnswers = 0;
  hideComboBanner();
  lives -= 1;
  
  triggerDamageEffects();
  
  resultBox.textContent =
    `⏰ Zeit abgelaufen! Richtige Antworten: ${getDisplayedCorrectAnswers(q, 2)}`;
  resultBox.classList.remove("hidden");

  if (q.questionType === "choice") {
    const choiceButtons = document.querySelectorAll(".choiceBtn");
    choiceButtons.forEach(btn => {
      btn.disabled = true;
      if (btn.dataset.isCorrect === "true") {
        btn.classList.add("correct");
      }
    });
  }

  updateHud();

  if (lives <= 0) {
    endGame(q);
    return;
  }

  const input = document.getElementById("answerInput");
  if (input) input.disabled = true;

  document.getElementById("checkBtn").classList.add("hidden");
  document.getElementById("nextBtn").classList.remove("hidden");

  if (errorDelayInterval) clearTimeout(errorDelayInterval);
  errorDelayInterval = setTimeout(() => {
    goToNextQuestionAfterError();
  }, 15000);
}

function endGame(q = null) {
  clearInterval(timerInterval);
  hideComboBanner();

  if (delayInterval) {
    clearTimeout(delayInterval);
    delayInterval = null;
  }

  if (errorDelayInterval) {
    clearTimeout(errorDelayInterval);
    errorDelayInterval = null;
  }

  const gameEl = document.getElementById("game");
  const gameOverEl = document.getElementById("gameOver");
  const finalScoreEl = document.getElementById("finalScore");
  const correctAnswerEl = document.getElementById("gameOverCorrectAnswer");

  if (gameEl) {
    gameEl.classList.add("hidden");
  }

  if (gameOverEl) {
    gameOverEl.classList.remove("hidden");
  }

  if (finalScoreEl) {
    finalScoreEl.textContent = score;
  }

  if (correctAnswerEl) {
    if (q && q.antwort) {
      correctAnswerEl.textContent =
        `Richtige Antworten: ${getDisplayedCorrectAnswers(q, 2)}`;
      correctAnswerEl.classList.remove("hidden");
    } else {
      correctAnswerEl.textContent = "";
      correctAnswerEl.classList.add("hidden");
    }
  }

  saveScoreFirebase(playerName, score);
  fetchScoresFirebase();
}

function restartGame() {
  lives = 5;
  score = 0;
  skipsLeft = 2;
  currentIndex = 0;
  consecutiveCorrectAnswers = 0;
  selectedChoice = null;
  isAnswerSubmitted = false;

  clearInterval(timerInterval);
  clearTimeout(delayInterval);
  clearTimeout(errorDelayInterval);
  hideComboBanner();

  questions = shuffleArray([...allQuestions]);

  document.getElementById("gameOver").classList.add("hidden");
  document.getElementById("game").classList.remove("hidden");

  updateHud();
  renderQuestion();
}

// ===== EVENT LISTENERS =====
document.addEventListener("DOMContentLoaded", () => {
  loadQuestions();
  fetchScoresFirebase();

  document.getElementById("startBtn").addEventListener("click", startGame);
  document.getElementById("checkBtn").addEventListener("click", handleAnswer);
  document.getElementById("skipBtn").addEventListener("click", handleSkip);
  document.getElementById("nextBtn").addEventListener("click", () => {
    goToNextQuestionAfterError();
  });
  document.getElementById("restartBtn").addEventListener("click", restartGame);

  const choiceContainer = document.getElementById("choiceContainer");
  const choiceButtons = choiceContainer.querySelectorAll(".choiceBtn");
  choiceButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      if (isAnswerSubmitted) return;
      choiceButtons.forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
      selectedChoice = btn;

      const q = questions[currentIndex];
      if (q && q.questionType === "choice") {
        handleAnswer();
      }
    });
  });

  const answerInput = document.getElementById("answerInput");
  answerInput.addEventListener("keydown", event => {
    if (event.key === "Enter") {
      const q = questions[currentIndex];
      if (q && q.questionType === "open") {
        event.preventDefault();
        handleAnswer();
      }
    }
  });
});