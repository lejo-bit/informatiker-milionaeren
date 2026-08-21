const d = require('./fragen.json');

const wc = s => (s || '').trim().split(/\s+/).filter(Boolean).length;

// Helper: Normalize text for duplicate detection
const norm = s => (s || '').toLowerCase()
  .replace(/[äöüß]/g, m => ({ä:'ae',ö:'oe',ü:'ue',ß:'ss'})[m])
  .replace(/[^a-z0-9]/g, ' ')
  .replace(/\s+/g, ' ').trim();

// 1. Distraktoren >15 Wörter
console.log('=== falseAnswers >15 Wörter ===');
d.forEach(q => {
  if (q.questionType !== 'choice') return;
  q.falseAnswers.forEach((f, i) => {
    const n = wc(f);
    if (n > 15) console.log(`nr ${q.nr}: "${f}" (${n} Wörter)`);
  });
});

// 2. Kategorie-Check
console.log('\n=== Kategorie "U are lucky" ===');
d.filter(q => q.category === 'U are lucky').forEach(q => console.log(JSON.stringify(q)));

// 3. Duplikate suchen: gleiche "frage" normalisiert oder sehr ähnlich
console.log('\n=== Duplikate (exakt gleicher Fragetext) ===');
const seen = new Map();
d.forEach(q => {
  const key = norm(q.frage);
  if (!seen.has(key)) seen.set(key, []);
  seen.get(key).push(q.nr);
});
[...seen.entries()].filter(([,v]) => v.length > 1).forEach(([k, v]) => {
  console.log(v.join(', '), '=>', k);
});

// 4. Gleiche Antwort + gleiche falseAnswers bei unterschiedlichen Fragen (Templates)
console.log('\n=== Gleiche antwort+falseAnswers-Kombinationen (Templates) ===');
const combo = new Map();
d.filter(q => q.questionType === 'choice').forEach(q => {
  const key = `${norm(q.antwort)}|${q.falseAnswers.map(norm).join('|')}`;
  if (!combo.has(key)) combo.set(key, []);
  combo.get(key).push(q.nr);
});
[...combo.entries()].filter(([,v]) => v.length >= 3).forEach(([k, v]) => {
  console.log(`${v.join(', ')} => ${k.slice(0, 80)} (${v.length} Fragen)`);
});

// 5. Distraktoren-Qualität: zu offensichtliche unsinnige Distraktoren erkennen
console.log('\n=== Verdächtige Distraktoren (fachfremd/absurd) ===');
const suspiciousPatterns = [
  /hallo/i, /lucky/i, /erpressen/i, /stehlen/i, /schenken/i, /tanzen/i, /essen/i,
  /kochen/i, /singen/i, /lachen/i, /party/i, /banane/i, /pizza/i, /hund/i, /katze/i,
  /papa/i, /mama/i, /freund/i, /urlaub/i, /beispiel/i
];
d.filter(q => q.questionType === 'choice').forEach(q => {
  q.falseAnswers.forEach(f => {
    if (suspiciousPatterns.some(r => r.test(f))) {
      console.log(`nr ${q.nr}: "${f}"`);
    }
  });
});

// 6. Open Fragen prüfen
console.log('\n=== Alle Open Fragen (nr: frage | antwort) ===');
d.filter(q => q.questionType === 'open').forEach(q => {
  console.log(`nr ${q.nr} [${q.category}] | ${q.frage} => ${JSON.stringify(q.antwort)}`);
});