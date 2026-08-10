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

function wordOverlapSimilarity(userStr, correctStr) {
  const userWords = normalize(userStr).split(" ").filter(Boolean);
  const correctWords = normalize(correctStr).split(" ").filter(Boolean);

  if (correctWords.length === 0) return 0;

  const userSet = new Set(userWords);
  let matchCount = 0;

  for (const w of correctWords) {
    if (userSet.has(w)) matchCount++;
  }

  return matchCount / correctWords.length; // 0.0–1.0
}

function checkAnswer(question, userAnswer) {
  const correctAnswers = Array.isArray(question.antwort)
    ? question.antwort
    : [question.antwort];

  const normUser = normalize(userAnswer);

  // If the user did not type anything (empty after normalization)
  if (!normUser) {
    return {
      isCorrect: false,
      message: "Bitte gib eine Antwort ein."
    };
  }

  // 1) Exact match (strict, but robust thanks to normalization)
  const exactMatch = correctAnswers.some(correctAnswer => {
    const normCorrect = normalize(correctAnswer);
    return normUser === normCorrect;
  });

  if (exactMatch) {
    return {
      isCorrect: true,
      message: "Richtig! Das ist die korrekte Antwort."
    };
  }

  // 2) Word-overlap match:
  //    Check if the user used most of the important words
  //    from at least one correct answer (e.g. 70% of them).
  const WORD_OVERLAP_THRESHOLD = 0.7; // 0.0–1.0

  const goodWordMatch = correctAnswers.some(correctAnswer => {
    const overlap = wordOverlapSimilarity(userAnswer, correctAnswer);
    return overlap >= WORD_OVERLAP_THRESHOLD;
  });

  if (goodWordMatch) {
    return {
      isCorrect: true,
      message: "Richtig! Deine Antwort trifft den Inhalt."
    };
  }

  // 3) Fuzzy match using Levenshtein similarity:
  //    Here we only want to catch typos, not big semantic changes.
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

  // 4) If nothing matched: show some example correct answers
  const displayedAnswers = correctAnswers
    .slice(0, 2)
    .join(", ");

  return {
    isCorrect: false,
    message: `Nicht ganz. Mögliche richtige Antworten: ${displayedAnswers}`
  };
}