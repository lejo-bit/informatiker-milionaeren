// script.js

let questions = [];
let currentIndex = 0;
let lives = 3;
let score = 0;
let timer = 30;
let timerInterval = null;
let delayInterval = null;      // 2‑sekundowy timer po poprawnej odpowiedzi
let errorDelayInterval = null; // 15‑sekundowy timer po błędnej odpowiedzi
let selectedChoice = null;

let playerName = "";

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
    // brak nicka → pokaż komunikat i nie startuj gry
    const errorEl = document.getElementById("error");
    errorEl.textContent = "Bitte gib deinen Namen ein, bevor du startest.";
    errorEl.classList.remove("hidden");
    return;
  } else {
    // zapisujemy nick i chowamy ewentualny stary błąd
    playerName = enteredName;
    const errorEl = document.getElementById("error");
    errorEl.classList.add("hidden");
  }

  lives = 3;
  score = 0;
  currentIndex = 0;
  timer = 30;

  // losowa kolejność pytań, bez powtórek
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

function renderQuestion() {
  const q = questions[currentIndex];
  selectedChoice = null;

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

  // przy każdym nowym pytaniu: pokaż "Prüfen", ukryj "Nächste Frage"
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

  const input = document.getElementById("answerInput");
  if (input) input.disabled = true;

  if (isCorrect) {
    // poprawna odpowiedź → automatycznie dalej po 2 s
    goToNextQuestionWithDelay();
  } else {
    // błędna odpowiedź → Nächste Frage + 15 s timer
    clearInterval(timerInterval); // zatrzymaj główny 30 s timer
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
  if (errorDelayInterval) {
    clearTimeout(errorDelayInterval);
  }

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
      timer = 30;
      updateHud();
      renderQuestion();
      startTimer();
    }
  }, 2000);
}

// przejście do następnego pytania po błędzie (klik lub 15 s)
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
      timer = 30;
      updateHud();
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

  updateHud();

  const input = document.getElementById("answerInput");
  if (input) input.disabled = true;

  // timeout traktujemy jak błąd → ten sam mechanizm
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
  if (delayInterval) {
    clearTimeout(delayInterval);
  }
  if (errorDelayInterval) {
    clearTimeout(errorDelayInterval);
  }

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
  document.getElementById("nextBtn").addEventListener("click", () => {
    goToNextQuestionAfterError();
  });
  document.getElementById("restartBtn").addEventListener("click", restartGame);

  const choiceContainer = document.getElementById("choiceContainer");
  const choiceButtons = choiceContainer.querySelectorAll(".choiceBtn");
  choiceButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      console.log("choice clicked", btn.textContent);
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
