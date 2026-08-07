// --- Stan gry ---
let fragen = [];
let currentQuestionIndex = null;

let lives = 3;
let score = 0;
let timer = 30;
let timerInterval = null;
let currentPoints = 100;
let gameActive = false;
let currentQuestion = null;

// --- Elementy DOM ---
const loadingEl = document.getElementById('loading');
const errorEl = document.getElementById('error');
const startScreen = document.getElementById('startScreen');
const gameEl = document.getElementById('game');
const startBtn = document.getElementById('startBtn');

const livesEl = document.getElementById('lives');
const scoreEl = document.getElementById('score');
const timerEl = document.getElementById('timer');
const gameOverEl = document.getElementById('gameOver');
const finalScoreEl = document.getElementById('finalScore');
const restartBtn = document.getElementById('restartBtn');

const questionTextEl = document.getElementById('questionText');
const answerInputEl = document.getElementById('answerInput');
const checkBtn = document.getElementById('checkBtn');
const nextBtn = document.getElementById('nextBtn');
const resultBox = document.getElementById('resultBox');
const correctAnswerText = document.getElementById('correctAnswerText');

// --- Pomocnicze funkcje ---

function normalizeText(text) {
  return (text || "")
    .toLowerCase()
    .replace(/[.,;:!?()"\[\]]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Gdy skończy się czas na odpowiedź
function handleTimeUp() {
  if (!gameActive) return;

  resultBox.textContent = "Zeit abgelaufen!";
  resultBox.classList.remove("hidden", "correct", "wrong");
  resultBox.classList.add("wrong");

  const q = fragen[currentQuestionIndex];
  const correctRaw = q["antwort 1"] || q["antwort1"] || q["antwort_1"] || "";
  correctAnswerText.textContent = correctRaw;
  correctAnswerText.classList.remove("hidden");

  lives--;
  livesEl.textContent = lives;

  answerInputEl.disabled = true;
  checkBtn.disabled = true;
  nextBtn.classList.remove("hidden");
  nextBtn.focus();

  if (lives <= 0) {
    endGame();
  }
}

// Zakończenie gry
function endGame() {
  gameActive = false;
  clearInterval(timerInterval);

  gameEl.classList.add("hidden");
  gameOverEl.classList.remove("hidden");
  finalScoreEl.textContent = score;
}

// Losowanie i wyświetlenie pytania
function loadRandomQuestion() {
  if (!gameActive) return;

  if (!fragen || fragen.length === 0) {
    questionTextEl.textContent = "Keine Fragen mehr.";
    answerInputEl.disabled = true;
    checkBtn.disabled = true;
    nextBtn.classList.add("hidden");
    endGame(); // albo możesz pokazać osobny ekran
    return;
  }

  // losujemy indeks
  const idx = Math.floor(Math.random() * fragen.length);
  const q = fragen[idx];

  // zapamiętujemy indeks PYTANIA w oryginalnej liście (opcjonalnie)
  currentQuestionIndex = q.id;

  // usuwamy pytanie z listy, żeby się nie powtórzyło
  fragen.splice(idx, 1);

  questionTextEl.textContent = q.frage;
  answerInputEl.value = "";
  answerInputEl.disabled = false;
  checkBtn.disabled = false;

  resultBox.classList.add("hidden");
  correctAnswerText.classList.add("hidden");
  nextBtn.classList.add("hidden");

  timer = 30;
  currentPoints = 100;
  timerEl.textContent = timer;

  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timer--;
    timerEl.textContent = timer;

    if (timer <= 20 && timer >= 0) {
      currentPoints = Math.max(0, 100 - (30 - timer) * 10);
    }

    if (timer <= 0) {
      clearInterval(timerInterval);
      handleTimeUp();
    }
  }, 1000);

  answerInputEl.focus();
}

  currentQuestionIndex = Math.floor(Math.random() * fragen.length);
  const q = fragen[currentQuestionIndex];

  questionTextEl.textContent = q.frage;
  answerInputEl.value = "";
  answerInputEl.disabled = false;
  checkBtn.disabled = false;

  resultBox.classList.add("hidden");
  correctAnswerText.classList.add("hidden");
  nextBtn.classList.add("hidden");

  // Timer i punkty
  timer = 30;
  currentPoints = 100;
  timerEl.textContent = timer;

  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timer--;
    timerEl.textContent = timer;

    if (timer <= 20 && timer >= 0) {
      currentPoints = Math.max(0, 100 - (30 - timer) * 10);
    }

    if (timer <= 0) {
      clearInterval(timerInterval);
      handleTimeUp();
    }
  }, 1000);

  answerInputEl.focus();
}

// Sprawdzanie odpowiedzi
function checkAnswer() {
  if (currentQuestionIndex === null || !gameActive) return;

  clearInterval(timerInterval);
  const q = currentQuestion;
  // q już nie jest w fragen, więc najlepiej przechowywać aktualne pytanie globalnie
  const userRaw = answerInputEl.value || "";
  const user = normalizeText(userRaw);
 
  
  const correctRaw = q["antwort 1"] || q["antwort1"] || q["antwort_1"] || "";
  const correct = normalizeText(correctRaw);

  resultBox.classList.remove("hidden", "correct", "wrong");
  correctAnswerText.classList.add("hidden");

  // Pusta odpowiedź traktujemy jak błąd
  if (!user) {
    resultBox.textContent = "Keine Antwort!";
    resultBox.classList.add("wrong");

    lives--;
    livesEl.textContent = lives;

    answerInputEl.disabled = true;
    checkBtn.disabled = true;
    nextBtn.classList.remove("hidden");

    correctAnswerText.textContent = correctRaw;
    correctAnswerText.classList.remove("hidden");

    if (lives <= 0) {
      endGame();
    }
    return;
  }

  // Proste sprawdzanie poprawności
  let isCorrect = false;

  if (user === correct) {
    isCorrect = true;
  } else if (user.length > 2 && correct.includes(user)) {
    // np. user = "berlin", correct = "berlin"
    isCorrect = true;
  }

  if (isCorrect) {
    resultBox.textContent = "Richtige Antwort! +" + currentPoints + " Punkte";
    resultBox.classList.add("correct");
    score += currentPoints;
    scoreEl.textContent = score;
    correctAnswerText.textContent = correctRaw;
    correctAnswerText.classList.remove("hidden");
  } else {
    resultBox.textContent = "Nicht ganz. Die richtige Antwort lautet:";
    resultBox.classList.add("wrong");
    correctAnswerText.textContent = correctRaw;
    correctAnswerText.classList.remove("hidden");

    lives--;
    livesEl.textContent = lives;

    if (lives <= 0) {
      endGame();
      return;
    }
  }

  checkBtn.disabled = true;
  answerInputEl.disabled = true;
  nextBtn.classList.remove("hidden");
  nextBtn.focus();
}

// --- Zdarzenia ---

checkBtn.addEventListener("click", checkAnswer);
nextBtn.addEventListener("click", loadRandomQuestion);

// --- Ładowanie pytań z JSON ---

fetch("fragen.json")
  .then(res => {
    if (!res.ok) {
      throw new Error(
        "fragen.json konnte nicht geladen werden (Status: " + res.status + ")"
      );
    }
    return res.json();
  })
  .then(data => {
    fragen = data;
    loadingEl.classList.add("hidden");
    startScreen.classList.remove("hidden");
  })
  .catch(err => {
    loadingEl.classList.add("hidden");
    errorEl.textContent =
      "Fehler: " +
      err.message +
      ". Stelle sicher, dass die Datei fragen.json existiert und gültiges JSON enthält.";
    errorEl.classList.remove("hidden");
  });

// --- Start i restart gry ---

startBtn.addEventListener("click", () => {
  startScreen.classList.add("hidden");
  gameEl.classList.remove("hidden");
  gameOverEl.classList.add("hidden");

  lives = 3;
  score = 0;
  livesEl.textContent = lives;
  scoreEl.textContent = score;

  gameActive = true;
  loadRandomQuestion();
});

restartBtn.addEventListener("click", () => {
  gameOverEl.classList.add("hidden");
  gameEl.classList.remove("hidden");

  lives = 3;
  score = 0;
  livesEl.textContent = lives;
  scoreEl.textContent = score;

  gameActive = true;
  loadRandomQuestion();
});
