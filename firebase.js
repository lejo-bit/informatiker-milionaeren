/**
 * firebase.js — Firestore integration for saving and fetching scores.
 *
 * This module provides two async functions:
 * - `saveScoreFirebase(name, points)`: Saves a player's score to Firestore.
 * - `fetchScoresFirebase()`: Fetches the top 50 scores from Firestore and
 *   renders them in the leaderboard table.
 *
 * Firebase is initialized in an inline <script type="module"> in index.html,
 * which sets `window.firebaseDb` and `window.firebaseHelpers`. These functions
 * check for their existence before proceeding, so they gracefully no-op if
 * Firebase hasn't been initialized yet (e.g. offline or config error).
 */

import { renderScoreTable } from "./ui.js?v=7";

/**
 * Saves a player's score to the Firestore "scores" collection.
 *
 * @param {string} name - The player's name/nickname.
 * @param {number} points - The player's final score.
 * @returns {Promise<void>}
 */
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

/**
 * Fetches the top 50 scores from Firestore, sorts them by points
 * (descending), and renders the top 10 in the leaderboard table.
 *
 * Note: Sorting is done client-side because the `orderBy` helper is
 * available but we keep the query simple with just a `limit`.
 *
 * @returns {Promise<void>}
 */
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

    // Sort by points descending (highest score first)
    scores.sort((a, b) => b.points - a.points);

    // Render only the top 10 in the leaderboard
    renderScoreTable(scores.slice(0, 10));
  } catch (err) {
    console.error("Error fetching scores from Firestore:", err);
  }
}
