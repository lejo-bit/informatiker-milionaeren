# Informatiker-Millionären – Quiz

Interaktives Quiz für angehende (und aktuelle) Informatiker. Fragen auf Deutsch, unterschiedliche Fragetypen, Zeitlimit, Leben und eine Bestenliste mit Speicherung der Ergebnisse in Firebase Firestore.

## Spielprinzip

### Fragetypen

Im Datei `fragen.json` befinden sich zwei Fragetypen:

- `questionType: "choice"` – **Multiple-Choice-Fragen** mit 4 Antwortmöglichkeiten.
- `questionType: "open"` – **offene Fragen**, bei denen der Spieler die Antwort in ein Textfeld eingibt.

Jede Frage hat eine richtige Antwort (`antwort`) und optional eine Liste falscher Antworten (`falseAnswers`).

### Ablauf des Spiels

- Zu Beginn gibt der Spieler einen **Namen/Nick** ein.
- Der Spieler startet mit **3 Leben**.
- Die Fragen werden **zufällig gemischt** (zufällige Reihenfolge, keine Wiederholungen).
- Im HUD werden angezeigt:
  - Anzahl der Leben,
  - aktueller Punktestand,
  - Spielername,
  - verbleibende Zeit für die aktuelle Frage.

#### Zeit und Punkte

- **Multiple-Choice-Fragen** (`choice`):
  - Zeitlimit: **10 Sekunden** pro Frage.
  - richtige Antwort: **immer 100 Punkte** (zeitunabhängig).
  - falsche Antwort: **–1 Leben**, keine Punkte.

- **Offene Fragen** (`open`):
  - Zeitlimit: **30 Sekunden** pro Frage.
  - in den ersten **10 Sekunden** gibt eine richtige Antwort **100 Punkte**.
  - nach 10 Sekunden werden pro **weiterer Sekunde** **5 Punkte abgezogen**:
    - Punkteformel: `100 - (Sekunden nach 10s * 5)`, Minimum 0 Punkte.

#### Leben und Game Over

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
2. Sortiert die Ergebnisse **lokal** in JavaScript:
   - zuerst nach `points` absteigend (mehr Punkte ganz oben),
   - bei gleichen `points` nach `date` aufsteigend (älteres Ergebnis oben).
3. Schneidet die Liste auf **TOP 10** Einträge zu.
4. Übergibt die sortierten Ergebnisse an `renderScoreTable(scores)`.

Die Tabelle „Bestenliste“ zeigt:

- Platz (1–10),
- Namen des Spielers,
- dessen Punktestand.

Das Feld `date` wird in Firestore gespeichert, aber **nicht angezeigt** – es dient nur zum Auflösen von Punktgleichheit.

## Projektstruktur

- `index.html` – HTML-Hauptseite mit dem Quiz-Markup, dem Game-Over-Screen, der Bestenliste und der Firebase-Konfiguration.
- `style.css` – Styles für das Quiz und die Ergebnistabelle.
- `script.js` – Spiellogik:
  - Laden der Fragen,
  - Timer-Logik,
  - Auswerten der Antworten (zusammen mit `checker.js`),
  - Verwaltung von Leben und Punktestand,
  - Speichern und Laden der Ergebnisse aus Firestore.
- `checker.js` – Hilfsfunktionen zur Prüfung der offenen Antworten.
- `fragen.json` – Fragenbasis für das Quiz.

## Lokales Starten

Um das Projekt lokal mit ES-Modulen und Firebase zu starten:

1. Repository klonen:

   ```bash
   git clone <URL_des_Repository>
   cd informatiker-milionaeren
   ```

2. Einfachen HTTP-Server starten (z.B. mit Python):

   ```bash
   python -m http.server 8000
   ```

3. Im Browser öffnen:

   ```text
   http://localhost:8000/index.html
   ```

Beim Öffnen per `file://` (ohne Server) funktionieren `type="module"` und die Firebase-Imports häufig nicht korrekt.

## Voraussetzungen

- Aktueller Browser mit Unterstützung für **ES Modules** (`<script type="module">`).
- Internetverbindung (Firebase SDK wird über CDN geladen).
- Konfiguriertes Firebase-Projekt mit:
  - aktiviertem **Firestore**,
  - angelegter Kollektion `scores`.

## Lizenz / Open Source

Dieses Projekt ist **komplett Open Source**.  
Jede Person darf den Code:

- herunterladen,
- verändern,
- erweitern,
- in eigene Projekte einbauen,

ohne mich vorher informieren oder um Erlaubnis fragen zu müssen.

Ein Hinweis auf die ursprüngliche Quelle ist natürlich nett, aber **nicht verpflichtend**.

---

Dieses Projekt ist ein einfaches, aber erweiterbares Informatiker-Quiz – geeignet als Übung für JavaScript, Arbeiten mit JSON, Integration von Firebase und das Entwerfen von Spiel-Logik (Timer, Punktesystem, Ranking).