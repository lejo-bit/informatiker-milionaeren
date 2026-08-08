// checker.js

function normalizeBase(text) {
  return text
    .trim()
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[.,;:!?()\[\]"'`„“‚’\-_/]/g, " ")
    .replace(/\s+/g, " ");
}

function normalize(text) {
  return normalizeBase(text)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function tokenize(text) {
  return normalize(text)
    .split(" ")
    .filter(t => t.length > 0);
}

function checkAnswer(question, userAnswer) {
  const correct = question.antwort;
  const keywords = (question.keywords || []).map(normalize);
  const threshold = question.threshold ?? keywords.length;

  const normUser = normalizeWithNumbers(userAnswer);  // z numbers.js
  const normCorrect = normalizeWithNumbers(correct);

  // 1. pełne dopasowanie
  if (normUser === normCorrect && normCorrect.length > 0) {
    return {
      isCorrect: true,
      message: "Richtig! Das ist die korrekte Antwort."
    };
  }

  // 2. keywords + threshold
  const userTokens = tokenize(userAnswer);
  const matchedKeywords = keywords.filter(kw => userTokens.includes(kw));

  if (threshold > 0 && matchedKeywords.length >= threshold) {
    return {
      isCorrect: true,
      message: "Inhaltlich richtig – du nennst genügend wichtige Begriffe."
    };
  }

  if (matchedKeywords.length > 0) {
    return {
      isCorrect: false,
      message: `Teilweise richtig – du hast ${matchedKeywords.length} von ${keywords.length} wichtigen Begriffen genannt.`
    };
  }

  // 3. fallback
  return {
    isCorrect: false,
    message: "Nicht ganz. Die richtige Antwort lautet: " + correct
  };
}