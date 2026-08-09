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
    .filter(token => token.length > 0);
}

function checkAnswer(question, userAnswer) {
  const correctAnswers = Array.isArray(question.antwort)
    ? question.antwort
    : [question.antwort];

  const keywords = (question.keywords || []).map(normalize);
  const threshold = question.threshold ?? keywords.length;

  const normUser = normalizeWithNumbers(userAnswer);

  // 1. Vollständige Übereinstimmung mit einer beliebigen richtigen Antwort
  const fullMatch = correctAnswers.some(correctAnswer => {
    const normCorrect = normalizeWithNumbers(correctAnswer);
    return normUser === normCorrect && normCorrect.length > 0;
  });

  if (fullMatch) {
    return {
      isCorrect: true,
      message: "Richtig! Das ist die korrekte Antwort."
    };
  }

  // 2. Keywords + threshold
  const userTokens = tokenize(userAnswer);
  const matchedKeywords = keywords.filter(keyword =>
    userTokens.includes(keyword)
  );

  if (threshold > 0 && matchedKeywords.length >= threshold) {
    return {
      isCorrect: true,
      message: "Inhaltlich richtig – du nennst genügend wichtige Begriffe."
    };
  }

  if (matchedKeywords.length > 0) {
    return {
      isCorrect: false,
      message:
        `Teilweise richtig – du hast ${matchedKeywords.length} ` +
        `von ${keywords.length} wichtigen Begriffen genannt.`
    };
  }

  // 3. Fallback: maximal zwei richtige Antworten anzeigen
  const displayedAnswers = correctAnswers
    .slice(0, 2)
    .join(", ");

  return {
    isCorrect: false,
    message: `Nicht ganz. Mögliche richtige Antworten: ${displayedAnswers}`
  };
}
