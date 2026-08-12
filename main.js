import { state } from "./state.js";
import { fetchScoresFirebase } from "./firebase.js";
import { 
  loadQuestions, 
  startGame, 
  handleAnswer, 
  handleSkip, 
  handleFiftyFifty, 
  goToNextQuestionAfterError, 
  restartGame 
} from "./game.js";

document.addEventListener("DOMContentLoaded", () => {
  loadQuestions();
  fetchScoresFirebase();

  document.getElementById("startBtn").addEventListener("click", startGame);
  document.getElementById("checkBtn").addEventListener("click", handleAnswer);
  document.getElementById("fiftyFiftyBtn").addEventListener("click", handleFiftyFifty);
  document.getElementById("skipBtn").addEventListener("click", handleSkip);
  document.getElementById("nextBtn").addEventListener("click", goToNextQuestionAfterError);
  document.getElementById("restartBtn").addEventListener("click", restartGame);

  const choiceContainer = document.getElementById("choiceContainer");
  const choiceButtons = choiceContainer.querySelectorAll(".choiceBtn");
  choiceButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      if (state.isAnswerSubmitted) return;
      choiceButtons.forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
      state.selectedChoice = btn;

      const q = state.questions[state.currentIndex];
      if (q && q.questionType === "choice") {
        handleAnswer();
      }
    });
  });

  const answerInput = document.getElementById("answerInput");
  answerInput.addEventListener("keydown", event => {
    if (event.key === "Enter") {
      const q = state.questions[state.currentIndex];
      if (q && q.questionType === "open") {
        event.preventDefault();
        handleAnswer();
      }
    }
  });
});