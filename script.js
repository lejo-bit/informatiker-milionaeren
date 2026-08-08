let questions = [];
let currentIndex = 0;
let lives = 3;
let score = 0;

let timer = 30;
let timerInterval = null;
let delayInterval = null;
let errorDelayInterval = null;
let selectedChoice = null;
let playerName = "";

async function saveScoreFirebase(name, points) {
  try {
    const db = window.firebaseDb;
    const helpers = window.firebaseHelpers;
    if (!db || !helpers) {
      console.warn("Firebase DB oder Helfer sind nicht verfügbar");
      return;
    }

    const { collection, addDoc } = helpers;

    await addDoc(collection(db, "scores"), {
      name,
      points,
      date: new Date().toISOString()
    });
  } catch (err) {
    console.error("Fehler beim Speichern des Scores in Firestore:", err);
  }
}

async function fetchScoresFirebase() {
  console.log("fetchScoresFirebase start");
  try {
    const db = window.firebaseDb;
    const helpers = window.firebaseHelpers;
    if (!db || !helpers) {
      console.warn("Firebase DB oder Helfer sind nicht verfügbar");
      return;
    }

    const { collection, getDocs, query, orderBy } = helpers;
    const scoresCol = collection(db, "scores");
    const q = query(scoresCol, orderBy("points", "desc"));
    const snap = await getDocs(q);

    const scores = [];
    snap.forEach(doc => {
      scores.push(doc.data());
    });

    console.log("Scores from Firestore (raw):", scores);

    scores.sort((a, b) => {
      if (a.points !== b.points) {
        return b.points - a.points;
      }
      const da = new Date(a.date);
      const db = new Date(b.date);
      return da - db;
    });

    const top10 = scores.slice(0, 10);
    console.log("Scores after local sort:", top10);
    renderScoreTable(top10);
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

async function loadQuestions() {
  try {
    const res = await fetch("fragen.json");
    questions = await res.json();

    document.getElementById("loading").classList.add("hidden");
    document.getElementById("startScreen").classList.remove("hidden");
  } catch (err) {
    document.getElementById("loading").classList.add("hidden");
    const errorEl = document.getElementById("error");
    errorEl.textContent = "Fehler beim Laden der Fragen.";
    errorEl.classList.remove("hidden");
  }
}

function startGame() {
  const nameInput = document.getElementById("playerName");
  const enteredName = nameInput ? nameInput.value.trim() : "";
  playerName = enteredName;

  if (!enteredName) {
    const errorEl = document.getElementById("error");
    errorEl.textContent = "Bitte gib deinen Namen ein, bevor du startest.";
    errorEl.classList.remove("hidden");
    return;
  } else {
    const errorEl = document.getElementById("error");
    errorEl.classList.add("hidden");
  }

  lives = 3;
  score = 0;
  currentIndex = 0;

  questions = shuffleArray(questions);

  document.getElementById("startScreen").classList.add("hidden");
  document.getElementById("game").classList.remove("hidden");
  document.getElementById("gameOver").classList.add("hidden");

  updateHud();
  renderQuestion();
  startTimer();
}

function updateHud() {
  document.getElementById("lives").textContent = lives;
  document.getElementById("score").textContent = score;
  document.getElementById("timer").textContent = timer;

  const playerLabel = document.getElementById("playerLabel");
  if (playerLabel) {
    playerLabel.textContent = playerName || "";
  }
}

function shuffleArray(arr) {
  return arr
    .map(value => ({ value, sortKey: Math.random() }))
    .sort((a, b) => a.sortKey - b.sortKey)
    .map(entry => entry.value);
}

function getShuffledOptions(question) {
  const options = [
    { text: question.antwort, isCorrect: true },
    ...(question.falseAnswers || []).map(f => ({ text: f, isCorrect: false }))
  ];
  return shuffleArray(options);
}

function getInitialTimeForQuestion(q) {
  return q.questionType === "choice" ? 10 : 30;
}

function calculatePointsForQuestion(q) {
  if (q.questionType === "choice") {
    return 100;
  }

  const elapsed = 30 - timer;
  if (elapsed <= 10) {
    return 100;
  }

  const extraSeconds = elapsed - 10;
  let pts = 100 - extraSeconds * 5;
  if (pts < 0) pts = 0;
  return pts;
}

function hideAnswerInputs() {
  const choiceContainer = document.getElementById("choiceContainer");
  if (choiceContainer) choiceContainer.classList.add("hidden");

  const input = document.getElementById("answerInput");
  if (input) input.classList.add("hidden");
}

function renderQuestion() {
  const q = questions[currentIndex];
  selectedChoice = null;

  timer = getInitialTimeForQuestion(q);
  updateHud();

  document.getElementById("questionText").textContent = q.frage;

  const input = document.getElementById("answerInput");
  const choiceContainer = document.getElementById("choiceContainer");
  const choiceButtons = choiceContainer.querySelectorAll(".choiceBtn");

  const resultBox = document.getElementById("resultBox");
  const correctAnswerText = document.getElementById("correctAnswerText");
  resultBox.classList.add("hidden");
  correctAnswerText.classList.add("hidden");
  resultBox.textContent = "";
  correctAnswerText.textContent = "";

  document.getElementById("checkBtn").classList.remove("hidden");
  document.getElementById("nextBtn").classList.add("hidden");

  if (q.questionType === "open") {
    input.value = "";
    input.disabled = false;
    input.classList.remove("hidden");

    choiceContainer.classList.add("hidden");
    choiceButtons.forEach(btn => {
      btn.textContent = "";
      btn.dataset.isCorrect = "";
      btn.disabled = true;
      btn.classList.remove("selected");
    });
  } else if (q.questionType === "choice") {
    input.value = "";
    input.disabled = true;
    input.classList.add("hidden");

    choiceContainer.classList.remove("hidden");

    const options = getShuffledOptions(q);
    options.forEach((opt, index) => {
      const btn = choiceButtons[index];
      if (!btn) return;
      btn.textContent = opt.text;
      btn.dataset.isCorrect = opt.isCorrect ? "true" : "false";
      btn.disabled = false;
      btn.classList.remove("selected");
    });
  }
}

function handleAnswer() {
  const q = questions[currentIndex];
  const resultBox = document.getElementById("resultBox");
  const correctAnswerText = document.getElementById("correctAnswerText");

  let isCorrect = false;
  let message = "";

  if (q.questionType === "open") {
    const inputVal = document.getElementById("answerInput").value;
    const result = checkAnswer(q, inputVal);
    isCorrect = result.isCorrect;
    message = result.message;
  } else if (q.questionType === "choice") {
    if (!selectedChoice) {
      resultBox.textContent = "Bitte wähle eine Antwort aus.";
      resultBox.classList.remove("hidden");
      return;
    }

    isCorrect = selectedChoice.dataset.isCorrect === "true";
    message = isCorrect ? "Richtig! Das ist die korrekte Antwort." : "Nope! Richtige Antwort ist:";

    hideAnswerInputs();
  }

  resultBox.textContent = message;
  resultBox.classList.remove("hidden");

  if (isCorrect) {
    const pointsToAdd = calculatePointsForQuestion(q);
    score += pointsToAdd;
    correctAnswerText.classList.add("hidden");
  } else {
    lives -= 1;

    correctAnswerText.textContent = q.antwort;
    correctAnswerText.classList.remove("hidden");

    if (q.questionType === "choice") {
      hideAnswerInputs();
    }

    if (lives <= 0) {
      updateHud();
      endGame();
      return;
    }
  }

  updateHud();

  const input = document.getElementById("answerInput");
  if (input) input.disabled = true;

  if (isCorrect) {
    goToNextQuestionWithDelay();
  } else {
    clearInterval(timerInterval);
    document.getElementById("checkBtn").classList.add("hidden");
    document.getElementById("nextBtn").classList.remove("hidden");

    if (errorDelayInterval) {
      clearTimeout(errorDelayInterval);
    }
    errorDelayInterval = setTimeout(() => {
      goToNextQuestionAfterError();
    }, 15000);
  }
}

function goToNextQuestionWithDelay() {
  clearInterval(timerInterval);
  if (errorDelayInterval) clearTimeout(errorDelayInterval);

  document.getElementById("checkBtn").classList.add("hidden");
  document.getElementById("nextBtn").classList.add("hidden");

  if (delayInterval) {
    clearTimeout(delayInterval);
  }

  delayInterval = setTimeout(() => {
    if (lives <= 0 || currentIndex + 1 >= questions.length) {
      endGame();
    } else {
      currentIndex++;
      renderQuestion();
      startTimer();
    }
  }, 2000);
}

function goToNextQuestionAfterError() {
  if (errorDelayInterval) {
    clearTimeout(errorDelayInterval);
  }

  if (lives <= 0) {
    endGame();
  } else {
    currentIndex++;
    if (currentIndex >= questions.length) {
      endGame();
    } else {
      renderQuestion();
      startTimer();
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
  clearInterval(timerInterval);
  const q = questions[currentIndex];
  const resultBox = document.getElementById("resultBox");
  const correctAnswerText = document.getElementById("correctAnswerText");

  lives -= 1;
  resultBox.textContent = "Zeit abgelaufen!";
  resultBox.classList.remove("hidden");

  correctAnswerText.textContent = q.antwort;
  correctAnswerText.classList.remove("hidden");

  if (q.questionType === "choice") {
    hideAnswerInputs();
  }

  updateHud();

  if (lives <= 0) {
    endGame();
    return;
  }

  const input = document.getElementById("answerInput");
  if (input) input.disabled = true;

  document.getElementById("checkBtn").classList.add("hidden");
  document.getElementById("nextBtn").classList.remove("hidden");

  if (errorDelayInterval) {
    clearTimeout(errorDelayInterval);
  }
  errorDelayInterval = setTimeout(() => {
    goToNextQuestionAfterError();
  }, 15000);
}

function endGame() {
  clearInterval(timerInterval);
  if (delayInterval) clearTimeout(delayInterval);
  if (errorDelayInterval) clearTimeout(errorDelayInterval);

  const gameEl = document.getElementById("game");
  const gameOverEl = document.getElementById("gameOver");
  const finalScoreEl = document.getElementById("finalScore");

  if (gameEl) gameEl.classList.add("hidden");
  if (gameOverEl) gameOverEl.classList.remove("hidden");
  if (finalScoreEl) finalScoreEl.textContent = score;

  saveScoreFirebase(playerName, score);
  fetchScoresFirebase();
}

function restartGame() {
  lives = 3;
  score = 0;
  currentIndex = 0;

  document.getElementById("gameOver").classList.add("hidden");
  document.getElementById("game").classList.remove("hidden");

  updateHud();
  renderQuestion();
  startTimer();
}

document.addEventListener("DOMContentLoaded", () => {
  loadQuestions();
  fetchScoresFirebase();

  document.getElementById("startBtn").addEventListener("click", startGame);
  document.getElementById("checkBtn").addEventListener("click", handleAnswer);
  document.getElementById("nextBtn").addEventListener("click", () => {
    goToNextQuestionAfterError();
  });
  document.getElementById("restartBtn").addEventListener("click", restartGame);

  const choiceContainer = document.getElementById("choiceContainer");
  const choiceButtons = choiceContainer.querySelectorAll(".choiceBtn");
  choiceButtons.forEach(btn => {
    btn.addEventListener("click", () => {
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