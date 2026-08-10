# Informatiker – Quiz

Interaktives Quiz für angehende (und aktuelle) Informatiker. Fragen auf Deutsch, unterschiedliche Fragetypen, Zeitlimit, Leben und eine Bestenliste mit Speicherung der Ergebnisse in Firebase Firestore.

## Spielprinzip

### Fragetypen

In der Datei `fragen.json` befinden sich zwei Fragetypen:

- `questionType: "choice"` – **Multiple-Choice-Fragen** mit 4 Antwortmöglichkeiten.
- `questionType: "open"` – **offene Fragen**, bei denen der Spieler die Antwort in ein Textfeld eingibt.

Jede Frage hat eine richtige Antwort (`antwort`) und optional eine Liste falscher Antworten (`falseAnswers`).

### Ablauf des Spiels

- Zu Beginn gibt der Spieler einen **Namen/Nick** ein.
- Der Spieler startet mit **3 Leben**.
- Die Fragen werden **zufällig gemischt** (zufällige Reihenfolge, keine Wiederholungen).
- Im HUD werden angezeigt:
  - Anzahl der Leben (bei **1 verbleibenden Leben** fängt das Herz-Symbol an zu pulsieren),
  - aktueller Punktestand,
  - Spielername,
  - verbleibende Zeit für die aktuelle Frage.

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
- Bei jeder falschen Antwort oder bei Zeitüberschreitung verliert der Spieler **1 Leben**.
- Wenn nach einem Fehler oder Timeout die Leben auf **0** fallen, wird sofort der **„Game Over“-Bildschirm** angezeigt.
- Der Game-Over-Screen zeigt den erreichten Punktestand und ermöglicht einen Neustart des Spiels.

## Bestenliste und Firebase

### Speichern der Ergebnisse

Nach Spielende wird:

- `saveScoreFirebase(playerName, score)` aufgerufen.
- Das Ergebnis wird in der Firestore-Kollektion **`scores`** gespeichert:
  - `name` – Spielername/Nick,
  - `points` – Punktestand,
  - `date` – Zeitstempel im ISO-Format (`new Date().toISOString()`).

Diese Daten werden für die Erstellung der Bestenliste verwendet.

### Laden und Sortieren der Ergebnisse

Die Funktion `fetchScoresFirebase()`:

1. Lädt alle Dokumente aus der Kollektion `scores` in Cloud Firestore.
2. Sortiert die Ergebnisse **lokal** in JavaScript nach `points` absteigend (mehr Punkte ganz oben).
3. Schneidet die Liste auf **TOP 10** Einträge zu.
4. Übergibt die sortierten Ergebnisse an `renderScoreTable(scores)`.

Die Tabelle „Bestenliste“ zeigt:

- Platz (1–10),
- Namen des Spielers,
- dessen Punktestand.

## Projektstruktur

- `index.html` – HTML-Hauptseite mit dem Quiz-Markup, dem Combo-Banner, dem Game-Over-Screen, der Bestenliste und der Firebase-Konfiguration.
- `style.css` – Styles für das Quiz, Puls-Animation des Herzens, Combo-Banner und die Ergebnistabelle.
- `script.js` – Spiellogik:
  - Laden der Fragen,
  - Timer-Logik (Choice / Open),
  - Auswerten der Antworten (zusammen mit `checker.js`),
  - Verwaltung von Leben, Punktabzügen, Combo-Serien und HUD-Updates,
  - Speichern und Laden der Ergebnisse aus Firestore.
- `checker.js` – Hilfsfunktionen zur Prüfung der offenen Antworten.
- `numbers.js` – Generierung und Normalisierung deutscher Zahlen (0–99) für den Antwortabgleich.
- `fragen.json` – Fragenbasis für das Quiz.

## Lokales Starten

Um das Projekt lokal mit ES-Modulen und Firebase zu starten:

1. Repository klonen:

   ```bash
   git clone <URL_des_Repository>
   cd informatiker-milionaeren
   ```

2. Ein lokales Webserver starten (erforderlich für ES-Module und Firebase):

   - mit Python 3:

     ```bash
     python3 -m http.server 8000
     ```

   - oder mit Node.js und `serve`:

     ```bash
     npm install -g serve
     serve .
     ```

3. Den Browser öffnen und zur Adresse wechseln:

   ```text
   http://localhost:8000
   ```

## Git und Repository-Update

Wenn das Ordner als Git-Repository eingerichtet ist, kannst du Änderungen so hochladen:

```bash
git status
git add .
git commit -m "Beschreibung der Änderungen"
git push
```

Falls noch kein Remote gesetzt ist, erstelle einen Remote und pushe auf den Hauptbranch:

```bash
git remote add origin <repo-url>
git push -u origin main
```

Wenn du vorher den aktuellen Stand vom Remote holen möchtest:

```bash
git pull origin main
```

> Hinweis: Ersetze `main` durch deinen tatsächlichen Branch-Namen, falls er anders heißt.
