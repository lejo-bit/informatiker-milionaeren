let fragen = [];
let currentQuestionIndex = null;

let lives = 3;
let score = 0;
let timer = 30;
let timerInterval = null;
let currentPoints = 100;
let gameActive = false;

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

function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(/[.,;:!?()"\[\]]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function handleTimeUp() {
  if (!gameActive) return;

  resultBox.textContent = "Zeit abgelaufen!";
  resultBox.classList.remove('hidden', 'correct', 'wrong');
  resultBox.classList.add('wrong');

  const q = fragen[currentQuestionIndex];
  const correctRaw = q["antwort 1"] || q["antwort1"] || q["antwort_1"] || "";
  correctAnswerText.textContent = correctRaw;
  correctAnswerText.classList.remove('hidden');

  lives--;
  livesEl.textContent = lives;

  answerInputEl.disabled = true;
  checkBtn.disabled = true;
  nextBtn.classList.remove('hidden');
  nextBtn.focus();

  if (lives <= 0) {
    endGame();
  }
}

function endGame() {
  gameActive = false;
  clearInterval(timerInterval);

  gameEl.classList