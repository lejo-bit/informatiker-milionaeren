// script.js

let questions = [];
let currentIndex = 0;
let lives = 3;
let score = 0;
let timer = 30;
let timerInterval = null;
let selectedChoice = null;

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
  lives = 3;
  score = 0;
  currentIndex = 0;
  timer = 30;

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

function renderQuestion() {
  const q = questions[currentIndex];
  selectedChoice = null; // reset zaznaczenia
  
  document.getElementById("questionText").textContent = q.frage;

  const input = document.getElementById("answerInput");
  const choiceContainer = document.getElementById("choiceContainer");
  const choiceButtons = choiceContainer.querySelectorAll(".choiceBtn");

  // reset feedback
  const resultBox = document.getElementById("resultBox");
  const correctAnswerText = document.getElementById("correctAnswerText");
  resultBox.classList.add("hidden");
  correctAnswerText.classList.add("hidden");
  resultBox.textContent = "";
  correctAnswerText.textContent = "";

  document.getElementById("checkBtn").classList.remove("hidden");
  document.getElementById("nextBtn").classList.add("hidden");

  if (q.questionType === "open") {
    // pytanie otwarte
    input.value = "";
    input.disabled = false;
    input.classList.remove("hidden");

    choiceContainer.classList.add("hidden");
  } else if (q.questionType === "choice") {
    // pytanie wyboru
    input.value = "";
    input.disabled = true;
    input.classList.add("hidden");

    choiceContainer.classList.remove("hidden");

    const options = getShuffledOptions(q); // { text, isCorrect }

    options.forEach((opt, index) => {
      const btn = choiceButtons[index];
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
    const result = checkAnswer(q, inputVal); // z checker.js
    isCorrect = result.isCorrect;
    message = result.message;

  } else if (q.questionType === "choice") {
    if (!selectedChoice) {
      resultBox.textContent = "Bitte wähle eine Antwort aus.";
      resultBox.classList.remove("hidden");
      return;
    }

    isCorrect = selectedChoice.dataset.isCorrect === "true";
    message = isCorrect
      ? "Richtig! Das ist die korrekte Antwort."
      : "Nicht ganz. Die richtige Antwort lautet: " + q.antwort;
  }
  resultBox.textContent = message;
  resultBox.classList.remove("hidden");

  if (isCorrect) {
    score += 100;
  } else {
    lives -= 1;
    correctAnswerText.textContent = q.antwort;
    correctAnswerText.classList.remove("hidden");
  }

  updateHud();

  document.getElementById("checkBtn").classList.add("hidden");
  document.getElementById("nextBtn").classList.remove("hidden");
  document.getElementById("answerInput").disabled = true;

  if (lives <= 0) {
    endGame();
  }
}

function nextQuestion() {
  if (lives <= 0) {
    endGame();
    return;
  }

  currentIndex++;
  if (currentIndex >= questions.length) {
    endGame();
  } else {
    timer = 30;
    updateHud();
    renderQuestion();
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

  updateHud();

  document.getElementById("checkBtn").classList.add("hidden");
  document.getElementById("nextBtn").classList.remove("hidden");
  document.getElementById("answerInput").disabled = true;

  if (lives <= 0) {
    endGame();
  }
}

function endGame() {
  clearInterval(timerInterval);

  document.getElementById("game").classList.add("hidden");
  document.getElementById("gameOver").classList.remove("hidden");
  document.getElementById("finalScore").textContent = score;
}

function restartGame() {
  lives = 3;
  score = 0;
  currentIndex = 0;
  timer = 30;
  document.getElementById("gameOver").classList.add("hidden");
  document.getElementById("game").classList.remove("hidden");
  updateHud();
  renderQuestion();
  startTimer();
}

document.addEventListener("DOMContentLoaded", () => {
  loadQuestions();

  document.getElementById("startBtn").addEventListener("click", startGame);
  document.getElementById("checkBtn").addEventListener("click", handleAnswer);
  document.getElementById("nextBtn").addEventListener("click", nextQuestion);
  document.getElementById("restartBtn").addEventListener("click", restartGame);

  const choiceContainer = document.getElementById("choiceContainer");
  const choiceButtons = choiceContainer.querySelectorAll(".choiceBtn");
  choiceButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      console.log("choice clicked", btn.textContent); // opcjonalnie
      choiceButtons.forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
      selectedChoice = btn;
    });
  });
});
