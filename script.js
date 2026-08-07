  const userWords = user.split(' ').filter(w => w.length > 2);
  const correctWords = correct.split(' ').filter(w => w.length > 2);

  const matchCount = userWords.filter(w => correctWords.includes(w)).length;
  const coverage = matchCount / Math.max(correctWords.length, 1);

 let isCorrect = false;

if (coverage >= 0.8 && matchCount >= 3) {
  isCorrect = true;
} else if (user.length > 10 && correct.includes(user) && user.length > correct.length * 0.6) {
  isCorrect = true;
}

 if (isCorrect) {
  resultBox.textContent = "Richtige Antwort! +" + currentPoints + " Punkte";
  ...
  nextBtn.focus();
}
