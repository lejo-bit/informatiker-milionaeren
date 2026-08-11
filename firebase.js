import { renderScoreTable } from "./ui.js";

export async function saveScoreFirebase(name, points) {
  try {
    const db = window.firebaseDb;
    const helpers = window.firebaseHelpers;
    if (!db || !helpers) return;

    const { collection, addDoc } = helpers;
    await addDoc(collection(db, "scores"), {
      name,
      points: Number(points),
      date: new Date().toISOString()
    });
  } catch (err) {
    console.error("Error saving score to Firestore:", err);
  }
}

export async function fetchScoresFirebase() {
  try {
    const db = window.firebaseDb;
    const helpers = window.firebaseHelpers;
    if (!db || !helpers) return;

    const { collection, getDocs, query, limit } = helpers;
    const scoresCol = collection(db, "scores");
    const q = query(scoresCol, limit(50));
    const snap = await getDocs(q);

    const scores = [];
    snap.forEach(doc => {
      const data = doc.data();
      scores.push({ ...data, points: Number(data.points) || 0 });
    });

    scores.sort((a, b) => b.points - a.points);
    renderScoreTable(scores.slice(0, 10));
  } catch (err) {
    console.error("Error fetching scores from Firestore:", err);
  }
}