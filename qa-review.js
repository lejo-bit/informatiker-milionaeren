const fs = require('fs');
const raw = fs.readFileSync('./fragen.json', 'utf8');
const data = JSON.parse(raw);

const wc = s => (s || '').trim().split(/\s+/).filter(Boolean).length;

// Normalisierte Form für Duplikat-Erkennung (Kleinschreibung, Satzzeichen entfernt, Leerzeichen vereinheitlicht)
const norm = s => (s || '')
  .toLowerCase()
  .replace(/[ä]/g, 'ae').replace(/[ö]/g, 'oe').replace(/[ü]/g, 'ue').replace(/ß/g, 'ss')
  .replace(/[^a-z0-9\s]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const shorten = (text, maxWords) => {
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(' ').replace(/[,;:\s]+$/, '');
};

// --- Automatische Duplikaterkennung ---
// Schlüssel: norm(frage) + "|" + norm(antwort)
const seen = new Map();
const dups = []; // {nr, origNr}
data.forEach(q => {
  const key = norm(q.frage) + '|' + norm(q.antwort);
  if (seen.has(key)) {
    dups.push({ nr: q.nr, origNr: seen.get(key) });
  } else {
    seen.set(key, q.nr);
  }
});

const dupNrs = new Set(dups.map(d => d.nr));
const origByDup = new Map(dups.map(d => [d.nr, d.origNr]));

// --- Alternative Fragen für Duplikate (generisch, fachlich passend zur Kategorie) ---
function generiereAlternative(q, origNr) {
  const kategorie = q.category;
  const altVorschlaege = {
    'Hardware': {
      frage: 'Welche Komponente puffert Daten zwischen CPU und dauerhaftem Speicher?',
      antwort: 'Arbeitsspeicher (RAM)',
      falseAnswers: ['Grafikkarte', 'Netzteil', 'Mainboard-Chipsatz']
    },
    'Betriebssysteme': {
      frage: 'Welches Programm verwaltet Benutzeranmeldungen an einem Windows-System?',
      antwort: 'Anmeldedienst (Winlogon)',
      falseAnswers: ['Task-Manager', 'Explorer', 'Registrierungseditor']
    },
    'Netzwerke': {
      frage: 'Welches Gerät übersetzt private IP-Adressen in eine öffentliche Adresse?',
      antwort: 'Router mit NAT',
      falseAnswers: ['Switch', 'Hub', 'Repeater']
    },
    'IT-Sicherheit': {
      frage: 'Welches Protokoll verschlüsselt die Anmeldung an einem entfernten Server?',
      antwort: 'SSH',
      falseAnswers: ['Telnet', 'FTP', 'HTTP']
    },
    'Datenbanken': {
      frage: 'Welcher Befehl entfernt alle Datensätze einer Tabelle, ohne die Struktur zu löschen?',
      antwort: 'DELETE',
      falseAnswers: ['DROP', 'TRUNCATE', 'ALTER']
    },
    'Programmierung': {
      frage: 'Welche Datenstruktur verwaltet Elemente nach dem Last-In-First-Out-Prinzip?',
      antwort: 'Stack',
      falseAnswers: ['Queue', 'Liste', 'Hashtabelle']
    },
    'Logik': {
      frage: 'Was ist die Negation der Aussage "Es regnet"?',
      antwort: 'Es regnet nicht',
      falseAnswers: ['Es ist kalt', 'Der Boden ist nass', 'Alle sind nass']
    },
    'IT-Grundlagen': {
      frage: 'Welche Einheit beschreibt die elektrische Spannung?',
      antwort: 'Volt',
      falseAnswers: ['Ampere', 'Watt', 'Ohm']
    },
    'Wirtschaft & Soziales': {
      frage: 'Welcher Faktor bestimmt die Höhe des Bruttoarbeitsentgelts?',
      antwort: 'Arbeitsvertrag und Tarifvereinbarungen',
      falseAnswers: ['Kundenrezensionen', 'Wetterlage', 'Grafikkartenmodell']
    },
    'Gaming & Medien': {
      frage: 'Welche Auszeichnung erhalten Spiele mit hoher Qualität?',
      antwort: 'Game of the Year',
      falseAnswers: ['Jahresabonnement', 'Controller-Upgrade', 'Pixelfehler']
    },
    'Künstliche Intelligenz': {
      frage: 'Welche Datenform wird für überwachtes Lernen benötigt?',
      antwort: 'Labelierte Beispieldaten',
      falseAnswers: ['Nur unstrukturierte Texte', 'Zufällige Rauschwerte', 'Ausschließlich Bilder']
    },
    'IT-Unternehmen': {
      frage: 'Welches Unternehmen entwickelte das Betriebssystem Windows?',
      antwort: 'Microsoft',
      falseAnswers: ['Apple', 'Google', 'IBM']
    },
    'Projektmanagement': {
      frage: 'Welche Methode visualisiert offene Aufgaben in Spalten?',
      antwort: 'Kanban-Board',
      falseAnswers: ['Gantt-Diagramm', 'Use-Case-Diagramm', 'ER-Diagramm']
    },
    'IT-Geschichte': {
      frage: 'Welches Unternehmen entwickelte den ersten kommerziell erfolgreichen Mikroprozessor 4004?',
      antwort: 'Intel',
      falseAnswers: ['AMD', 'Motorola', 'Texas Instruments']
    },
    'Wirtschaft & Soziales (erweitert)': {
      frage: 'Welche Kammer ist für die IHK-Ausbildung zuständig?',
      antwort: 'IHK (Industrie- und Handelskammer)',
      falseAnswers: ['Handwerkskammer', 'Bundesagentur für Arbeit', 'Zollbehörde']
    }
  };

  const alt = altVorschlaege[kategorie] || altVorschlaege['Programmierung'];
  return {
    questionType: 'choice',
    frage: alt.frage,
    antwort: alt.antwort,
    falseAnswers: [...alt.falseAnswers],
    category: kategorie
  };
}

// --- Hauptschleife ---
const out = data.map(q => {
  const nr = q.nr;
  const review = { status: 'unverändert', gruende: [], aenderungen: [] };
  let changed = false;

  // Duplikat?
  if (dupNrs.has(nr)) {
    const origNr = origByDup.get(nr);
    review.status = 'duplikat';
    review.gruende.push(`Inhaltlich praktisch identisch mit Frage Nr. ${origNr} (gleiche Frage und Antwort).`);
    review.aenderungen.push('Als Duplikat markiert; alternativer Fragenvorschlag ergänzt.');
    return {
      ...q,
      review,
      alternativVorschlag: generiereAlternative(q, origNr)
    };
  }

  let neuFrage = q.frage;
  let frageGeandert = false;
  if (wc(neuFrage) > 30) {
    review.gruende.push(`Frage enthielt ${wc(neuFrage)} Wörter (Maximum: 30).`);
    neuFrage = shorten(neuFrage, 30);
    frageGeandert = true;
  }

  let neuAntwort = q.antwort;
  let antwortGeandert = false;
  if (q.questionType === 'choice' && wc(neuAntwort) > 15) {
    review.gruende.push(`Richtige Antwort enthielt ${wc(neuAntwort)} Wörter (Maximum: 15).`);
    neuAntwort = shorten(neuAntwort, 15);
    antwortGeandert = true;
  }

  let neuFalse = q.falseAnswers;
  let falseGeandert = false;
  if (q.questionType === 'choice' && Array.isArray(neuFalse)) {
    const neueListe = [];
    neuFalse.forEach((fa, i) => {
      if (wc(fa) > 15) {
        review.gruende.push(`Falsche Antwort ${i + 1} enthielt ${wc(fa)} Wörter (Maximum: 15).`);
        neueListe.push(shorten(fa, 15));
        falseGeandert = true;
      } else {
        neueListe.push(fa);
      }
    });
    if (falseGeandert) neueFalse = neueListe;
  }

  if (frageGeandert) {
    review.aenderungen.push('Frage auf maximal 30 Wörter gekürzt.');
    changed = true;
  }
  if (antwortGeandert) {
    review.aenderungen.push('Richtige Antwort auf maximal 15 Wörter gekürzt.');
    changed = true;
  }
  if (falseGeandert) {
    review.aenderungen.push('Überlange falsche Antwort(en) auf maximal 15 Wörter gekürzt.');
    changed = true;
  }

  if (changed) review.status = 'geändert';

  return { ...q, frage: neuFrage, antwort: neuAntwort, falseAnswers: neueFalse, review };
});

fs.writeFileSync('./fragen_reviewed.json', JSON.stringify(out, null, 2), 'utf8');

const stat = { gesamt: out.length, unveraendert: 0, geaendert: 0, duplikat: 0 };
out.forEach(q => { stat[q.review.status] = (stat[q.review.status] || 0) + 1; });
console.log('Verarbeitet:', JSON.stringify(stat));
console.log('Davon Duplikate:', JSON.stringify(dups));
let maxF = 0, maxA = 0, maxFA = 0, nrF, nrA, nrFA;
out.forEach(q => {
  const wf = wc(q.frage);
  if (wf > maxF) { maxF = wf; nrF = q.nr; }
  if (q.questionType === 'choice') {
    const wa = wc(q.antwort);
    if (wa > maxA) { maxA = wa; nrA = q.nr; }
    (q.falseAnswers || []).forEach(fa => {
      const wfa = wc(fa);
      if (wfa > maxFA) { maxFA = wfa; nrFA = q.nr; }
    });
  }
});
console.log('Max Frage-Wörter:', maxF, 'bei Nr.', nrF);
console.log('Max Antwort-Wörter:', maxA, 'bei Nr.', nrA);
console.log('Max falseAnswer-Wörter:', maxFA, 'bei Nr.', nrFA);