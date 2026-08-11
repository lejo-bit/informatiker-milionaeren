// Game configuration and mutable runtime state
export const state = {
  allQuestions: [],
  questions: [],
  currentIndex: 0,

  playerName: "",
  lives: 3,
  score: 0,
  consecutiveCorrectAnswers: 0,
  skipsLeft: 2,

  timer: 30,
  initialTimerValue: 30,
  timerInterval: null,
  delayInterval: null,
  errorDelayInterval: null,
  comboTimeout: null,
  streakBannerTimeout: null,

  selectedChoice: null,
  isAnswerSubmitted: false
};

export function resetGameState() {
  state.lives = 3;
  state.score = 0;
  state.skipsLeft = 2;
  state.currentIndex = 0;
  state.consecutiveCorrectAnswers = 0;
  state.selectedChoice = null;
  state.isAnswerSubmitted = false;
}