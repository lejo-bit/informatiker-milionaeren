/**
 * numbers.js — German number word parser.
 *
 * Converts German number words (e.g. "einundzwanzig") into their
 * numeric string equivalents (e.g. "21") so that the answer checker
 * in checker.js can match numeric answers written in words.
 *
 * This script is loaded as a classic (non-module) script, so it
 * relies on `normalize()` being available globally from checker.js
 * (which is loaded first in index.html).
 *
 * The main function `normalizeWithNumbers()` is attached to `window`
 * so it can be used by other scripts.
 */

/**
 * Lookup table for simple German number words (0–19 and tens 20–90).
 * Includes common spelling variants (e.g. "fünf" / "fuenf").
 */
const GERMAN_NUMBER_MAP = {
  // 0 - 9
  "null": "0",
  "eins": "1", "ein": "1", "eine": "1", "einer": "1", "einem": "1", "einen": "1",
  "zwei": "2", "zwo": "2",
  "drei": "3",
  "vier": "4",
  "fuenf": "5", "fünf": "5",
  "sechs": "6",
  "sieben": "7", "siebn": "7",
  "acht": "8",
  "neun": "9",

  // 10 - 19
  "zehn": "10",
  "elf": "11",
  "zwoelf": "12", "zwölf": "12", "zwoelfe": "12", "zwölfe": "12",
  "dreizehn": "13",
  "vierzehn": "14",
  "fuenfzehn": "15", "fünfzehn": "15",
  "sechzehn": "16",
  "siebzehn": "17",
  "achtzehn": "18",
  "neunzehn": "19",

  // Tens (20 - 90)
  "zwanzig": "20",
  "dreissig": "30", "dreißig": "30",
  "vierzig": "40",
  "fuenfzig": "50", "fünfzig": "50",
  "sechzig": "60",
  "siebzig": "70",
  "achtzig": "80",
  "neunzig": "90"
};

/**
 * Map of unit words (1–9) for programmatic compound number generation.
 */
const UNITS = {
  "ein": 1, "eins": 1, "zwei": 2, "zwo": 2, "drei": 3, "vier": 4,
  "fuenf": 5, "fünf": 5, "sechs": 6, "sieben": 7, "acht": 8, "neun": 9
};

/**
 * Map of tens words (20–90) for programmatic compound number generation.
 */
const TENS = {
  "zwanzig": 20, "dreissig": 30, "dreißig": 30, "vierzig": 40,
  "fuenfzig": 50, "fünfzig": 50, "sechzig": 60, "siebzig": 70,
  "achtzig": 80, "neunzig": 90
};

/**
 * Parses a single token that may be a compound German number word
 * (e.g. "einundzwanzig" → "21").
 *
 * First checks the simple lookup table. If not found, attempts to
 * match the "unit-und-ten" pattern (e.g. "zweiunddreissig" → 2+30=32).
 *
 * @param {string} token - A single normalized word token.
 * @returns {string} The numeric string if recognized, otherwise the original token.
 */
function parseCompoundNumber(token) {
  if (GERMAN_NUMBER_MAP[token]) {
    return GERMAN_NUMBER_MAP[token];
  }

  // Matches patterns like "einundzwanzig", "zweiunddreissig", etc.
  const match = token.match(/^([a-zäöüß]+)und([a-zäöüß]+)$/);
  if (match) {
    const unitStr = match[1];
    const tenStr = match[2];

    if (UNITS[unitStr] !== undefined && TENS[tenStr] !== undefined) {
      return String(UNITS[unitStr] + TENS[tenStr]);
    }
  }

  return token;
}

/**
 * Normalizes text and converts German number words to numeric strings.
 *
 * Example: "einundzwanzig" → "21", "fünfzehn" → "15"
 *
 * @param {string} text - Raw input text.
 * @returns {string} Normalized text with number words converted to digits.
 */
function normalizeWithNumbers(text) {
  const norm = normalize(text); // normalize from checker.js
  const tokens = norm.split(" ");

  return tokens
    .map(t => parseCompoundNumber(t))
    .join(" ");
}

// Expose normalizeWithNumbers globally so it can be used by other scripts
// (e.g. checker.js could call it to handle numeric answers in word form).
window.normalizeWithNumbers = normalizeWithNumbers;
