let fragen = [];
let currentQuestionIndex = null;

const loadingEl = document.getElementById('loading');
const errorEl = document.getElementById('error');
const startScreen = document.getElementById('startScreen');
const gameEl = document.getElementById('game');
const startBtn = document.getElementById('startBtn');

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

function loadRandomQuestion() {
  if (fragen.length === 0) {
    questionTextEl.textContent = "Keine Fragen in der Liste.";
    answerInputEl.disabled = true;
    checkBtn.disabled = true;
    return;
  }

  currentQuestionIndex = Math.floor(Math.random() * fragen.length);
  const q = fragen[currentQuestionIndex];

  questionTextEl.textContent = q.frage;
  answerInputEl.value = '';
  answerInputEl.disabled = false;
  checkBtn.disabled = false;

  resultBox.classList.add('hidden');
  correctAnswerText.classList.add('hidden');
  nextBtn.classList.add('hidden');

  answerInputEl.focus();
}

function checkAnswer() {
  if (currentQuestionIndex === null) return;

  const q = fragen[currentQuestionIndex];
  const user = normalizeText(answerInputEl.value || "");

  // Bezpieczne odczytanie odpowiedzi
  const correctRaw = q["antwort 1"] || q["antwort1"] || q["antwort_1"] || "";
  const correct = normalizeText(correctRaw);

  // Zawsze resetujemy widok
  resultBox.classList.remove('hidden', 'correct', 'wrong');
  correctAnswerText.classList.add('hidden');

  if (!user) {
    resultBox.textContent = "Bitte gib eine Antwort ein.";
    resultBox.classList.add('wrong');
    checkBtn.disabled = true;
    answerInputEl.disabled = true;
    nextBtn.classList.remove('hidden');
    return;
  }

  const userWords = user.split(' ').filter(w => w.length > 2);
  const correctWords = correct.split(' ').filter(w => w.length > 2);

  const matchCount = userWords.filter(w => correctWords.includes(w)).length;
  const coverage = matchCount / Math.max(correctWords.length, 1);

  let isCorrect = false;

  if (coverage >= 0.7 && matchCount >= 2) {
    isCorrect = true;
  } else if (user.length > 0 && correct.includes(user) && user.length > 3) {
    isCorrect = true;
  }

  if (isCorrect) {
    resultBox.textContent = "Richtige Antwort!";
    resultBox.classList.add('correct');
    correctAnswerText.textContent = correctRaw;
    correctAnswerText.classList.remove('hidden');
  } else {
    resultBox.textContent = "Nicht ganz. Die richtige Antwort lautet:";
    resultBox.classList.add('wrong');
    correctAnswerText.textContent = correctRaw;
    correctAnswerText.classList.remove('hidden');
  }

  checkBtn.disabled = true;
  answerInputEl.disabled = true;
  nextBtn.classList.remove('hidden');
  nextBtn.focus();
}

checkBtn.addEventListener('click', checkAnswer);
nextBtn.addEventListener('click', loadRandomQuestion);

// Fragen aus JSON laden
fetch('fragen.json')
  .then(res => {
    if (!res.ok) {
      throw new Error('fragen.json konnte nicht geladen werden (Status: ' + res.status + ')');
    }
    return res.json();
  })
  .then(data => {
    fragen = data;
    loadingEl.classList.add('hidden');

    // Pokaż ekran startowy
    startScreen.classList.remove('hidden');
  })
  .catch(err => {
    loadingEl.classList.add('hidden');
    errorEl.textContent = 'Fehler: ' + err.message + '. Stelle sicher, dass die Datei fragen.json existiert und gültiges JSON enthält.';
    errorEl.classList.remove('hidden');
  });

// Start przycisku
startBtn.addEventListener('click', () => {
  startScreen.classList.add('hidden');
  gameEl.classList.remove('hidden');
  loadRandomQuestion();
});