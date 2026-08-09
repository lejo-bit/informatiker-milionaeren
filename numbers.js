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

// Map units and tens for programmatic compound number generation (21-99)
const UNITS = {
  "ein": 1, "eins": 1, "zwei": 2, "zwo": 2, "drei": 3, "vier": 4, 
  "fuenf": 5, "fünf": 5, "sechs": 6, "sieben": 7, "acht": 8, "neun": 9
};

const TENS = {
  "zwanzig": 20, "dreissig": 30, "dreißig": 30, "vierzig": 40, 
  "fuenfzig": 50, "fünfzig": 50, "sechzig": 60, "siebzig": 70, 
  "achtzig": 80, "neunzig": 90
};

// Generates compound numbers like "einundzwanzig" -> "21"
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

function normalizeWithNumbers(text) {
  const norm = normalize(text); // normalize from checker.js
  const tokens = norm.split(" ");
  
  return tokens
    .map(t => parseCompoundNumber(t))
    .join(" ");
}