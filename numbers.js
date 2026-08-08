// numbers.js

const GERMAN_NUMBER_MAP = {
  "null": "0",
  "eins": "1",
  "ein": "1",
  "eine": "1",
  "zwei": "2",
  "drei": "3",
  "vier": "4",
  "fuenf": "5",
  "fünf": "5",
  "sechs": "6",
  "sieben": "7",
  "acht": "8",
  "neun": "9",
  "zehn": "10",
  "elf": "11",
  "zwoelf": "12",
  "zwölf": "12",
  "dreizehn": "13",
  "vierzehn": "14",
  "fuenfzehn": "15",
  "fünfzehn": "15",
  "zwanzig": "20"
  // możesz stopniowo dodawać kolejne
};

function normalizeWithNumbers(text) {
  const norm = normalize(text); // normalize z checker.js
  const tokens = norm.split(" ");
  return tokens
    .map(t => GERMAN_NUMBER_MAP[t] ?? t)
    .join(" ");
}