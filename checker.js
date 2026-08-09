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

// Calculates Levenshtein distance for typo tolerance
function levenshteinDistance(a, b) {
  const matrix = Array.from({ length: a.length + 1 }, () => 
    Array(b.length + 1).fill(0)
  );

  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }
  return matrix[a.length][b.length];
}

// Calculates percentage similarity (0.0 to 1.0)
function calculateSimilarity(str1, str2) {
  if (!str1.length && !str2.length) return 1.0;
  if (!str1.length || !str2.length) return 0.0;
  
  const distance = levenshteinDistance(str1, str2);
  const maxLength = Math.max(str1.length, str2.length);
  return 1 - distance / maxLength;
}

function checkAnswer(question, userAnswer) {
  const correctAnswers = Array.isArray(question.antwort)
    ? question.antwort
    : [question.antwort];

  const normUser = normalize(userAnswer);

  if (!normUser) {
    return {
      isCorrect: false,
      message: "Bitte gib eine Antwort ein."
    };
  }

  // 1. Direct match or Substring match (user wrote a full sentence containing the answer)
  const isMatch = correctAnswers.some(correctAnswer => {
    const normCorrect = normalize(correctAnswer);
    if (!normCorrect) return false;

    // Direct match OR user answer contains the full expected answer phrase
    return normUser === normCorrect || normUser.includes(normCorrect);
  });

  if (isMatch) {
    return {
      isCorrect: true,
      message: "Richtig! Das ist die korrekte Antwort."
    };
  }

  // 2. Fuzzy match to catch typos (80% similarity threshold)
  const isCloseMatch = correctAnswers.some(correctAnswer => {
    const normCorrect = normalize(correctAnswer);
    return calculateSimilarity(normUser, normCorrect) >= 0.8;
  });

  if (isCloseMatch) {
    return {
      isCorrect: true,
      message: "Richtig! (Tippfehler wurden ignoriert)."
    };
  }

  // 3. Fallback: Display correct options if incorrect
  const displayedAnswers = correctAnswers
    .slice(0, 2)
    .join(", ");

  return {
    isCorrect: false,
    message: `Nicht ganz. Mögliche richtige Antworten: ${displayedAnswers}`
  };
}