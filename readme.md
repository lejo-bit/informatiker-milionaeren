# Informatiker-Millionären – Quiz[cite: 4]

Interaktives Quiz für angehende (und aktuelle) Informatiker. Fragen auf Deutsch, unterschiedliche Fragetypen, Zeitlimit, Leben und eine Bestenliste mit Speicherung der Ergebnisse in Firebase Firestore.[cite: 4]

## Spielprinzip[cite: 4]

### Fragetypen[cite: 4]

Im Datei `fragen.json` befinden sich zwei Fragetypen:[cite: 4]

- `questionType: "choice"` – **Multiple-Choice-Fragen** mit 4 Antwortmöglichkeiten.[cite: 4]
- `questionType: "open"` – **offene Fragen**, bei denen der Spieler die Antwort in ein Textfeld eingibt.[cite: 4]

Jede Frage hat eine richtige Antwort (`antwort`) und optional eine Liste falscher Antworten (`falseAnswers`).[cite: 4]

### Ablauf des Spiels[cite: 4]

- Zu Beginn gibt der Spieler einen **Namen/Nick** ein.[cite: 4]
- Der Spieler startet mit **3 Leben**.[cite: 4]
- Die Fragen werden **zufällig gemischt** (zufällige Reihenfolge, keine Wiederholungen).[cite: 4]
- Im HUD werden angezeigt:[cite: 4]
  - Anzahl der Leben (bei **1 verbleibenden Leben** fängt das Herz-Symbol an zu pulsieren),
  - aktueller Punktestand,[cite: 4]
  - Spielername,[cite: 4]
  - verbleibende Zeit für die aktuelle Frage.[cite: 4]

#### Zeit und Punkte

- **Multiple-Choice-Fragen** (`choice`):
  - Zeitlimit: **30 Sekunden** pro Frage.
  - richtige Antwort: **immer 100 Punkte** (zeitunabhängig).
  - falsche Antwort: **–1 Leben**, keine Punkte.

- **Offene Fragen** (`open`):
  - Zeitlimit: **60 Sekunden** pro Frage.
  - in den ersten **30 Sekunden** gibt eine richtige Antwort **100 Punkte**.
  - nach 30 Sekunden werden pro **weiterer Sekunde** **2 Punkte abgezogen**:
    - Punkteformel: `100 - (Sekunden nach 30s * 2)`, Minimum 0 Punkte.

#### Leben, Combos und Game Over

- **Combo-System**: Für jede **4 korrekten Antworten in Folge** erhält der Spieler **+1 Leben** geschenkt.
  - Ein animierter Banner (`🎉 4 Richtige Antworten Combo! +1 Leben ❤️`) erscheint kurz oben auf dem Bildschirm.
  - Bei einer falschen Antwort oder bei Ablauf der Zeit wird die Combo-Serie auf 0 zurückgesetzt.
- Bei jeder falschen Antwort oder bei Zeitüberschreitung verliert der Spieler **1 Leben**.[cite: 4]
- Wenn nach einem Fehler oder Timeout die Leben auf **0** fallen, wird sofort der **„Game Over“-Bildschirm** angezeigt.[cite: 4]
- Der Game-Over-Screen zeigt den erreichten Punktestand und ermöglicht einen Neustart des Spiels.[cite: 4]

## Bestenliste und Firebase[cite: 4]

### Speichern der Ergebnisse[cite: 4]

Nach Spielende wird:[cite: 4]

- `saveScoreFirebase(playerName, score)` aufgerufen.[cite: 4]
- Das Ergebnis wird in der Firestore-Kollektion **`scores`** gespeichert:[cite: 4]

  - `name` – Spielername/Nick,[cite: 4]
  - `points` – Punktestand,[cite: 4]
  - `date` – Zeitstempel im ISO-Format (`new Date().toISOString()`).[cite: 4]

Diese Daten werden für die Erstellung der Bestenliste verwendet.[cite: 4]

### Laden und Sortieren der Ergebnisse[cite: 4]

Die Funktion `fetchScoresFirebase()`:[cite: 4]

1. Lädt alle Dokumente aus der Kollektion `scores` in Cloud Firestore.[cite: 4]
2. Sortiert die Ergebnisse **lokal** in JavaScript nach `points` absteigend (mehr Punkte ganz oben).
3. Schneidet die Liste auf **TOP 10** Einträge zu.[cite: 4]
4. Übergibt die sortierten Ergebnisse an `renderScoreTable(scores)`.[cite: 4]

Die Tabelle „Bestenliste“ zeigt:[cite: 4]

- Platz (1–10),[cite: 4]
- Namen des Spielers,[cite: 4]
- dessen Punktestand.[cite: 4]

## Projektstruktur[cite: 4]

- `index.html` – HTML-Hauptseite mit dem Quiz-Markup, dem Combo-Banner, dem Game-Over-Screen, der Bestenliste und der Firebase-Konfiguration.
- `style.css` – Styles für das Quiz, Puls-Animation des Herzens, Combo-Banner und die Ergebnistabelle.
- `script.js` – Spiellogik:[cite: 4]
  - Laden der Fragen,[cite: 4]
  - Timer-Logik (Choice / Open),
  - Auswerten der Antworten (zusammen mit `checker.js`),[cite: 4]
  - Verwaltung von Leben, Punktabzügen, Combo-Serien und HUD-Updates,
  - Speichern und Laden der Ergebnisse aus Firestore.[cite: 4]
- `checker.js` – Hilfsfunktionen zur Prüfung der offenen Antworten.[cite: 4]
- `fragen.json` – Fragenbasis für das Quiz.[cite: 4]

## Lokales Starten[cite: 4]

Um das Projekt lokal mit ES-Modulen und Firebase zu starten:[cite: 4]

1. Repository klonen:[cite: 4]

   ```bash
   git clone <URL_des_Repository>
   cd informatiker-milionaeren
   ```[cite: 4]

2. Einfachen HTTP-Server starten (z.B. mit Python):[cite: 4]

   ```bash
   python -m http.server 8000
   ```[cite: 4]

3. Im Browser öffnen:[cite: 4]

   ```text
   http://localhost:8000/index.html
   ```[cite: 4]

Beim Öffnen per `file://` (ohne Server) funktionieren `type="module"` und die Firebase-Imports häufig nicht korrekt.[cite: 4]

## Voraussetzungen[cite: 4]

- Aktueller Browser mit Unterstützung für **ES Modules** (`<script type="module">`).[cite: 4]
- Internetverbindung (Firebase SDK wird über CDN geladen).[cite: 4]
- Konfiguriertes Firebase-Projekt mit:[cite: 4]
  - aktiviertem **Firestore**,[cite: 4]
  - angelegter Kollektion `scores`.[cite: 4]

## Lizenz / Open Source[cite: 4]

Dieses Projekt ist **komplett Open Source**.[cite: 4] 
Jede Person darf den Code herunterladen, verändern, erweitern und in eigene Projekte einbauen.[cite: 4]

---

Dieses Projekt ist ein einfaches, aber erweiterbares Informatiker-Quiz – geeignet als Übung für JavaScript, Arbeiten mit JSON, Integration von Firebase und das Entwerfen von Spiel-Logik.[cite: 4]