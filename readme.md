# Fachinformatiker – Quiz

Ein interaktives Web-Quiz zur Vorbereitung auf die Fachinformatiker-Prüfung. Enthält **2.761 Fragen** (2.621 Multiple-Choice, 140 offene, 1 spezielle Belohnungs-Frage), Zeitlimits, ein dynamisches Multiplikator- und Leben-System, Kategorien, Spieler-Titel, visuelle Effekte sowie eine globale Bestenliste via Firebase Firestore.

## Spielprinzip

### Fragetypen

In der Fragenbasis (`fragen.json`) befinden sich zwei Fragetypen:

- `questionType: "choice"` – **Multiple-Choice-Fragen** mit 4 Antwortmöglichkeiten. Die Antwort wird durch Klick auf eine Antwortmöglichkeit automatisch abgegeben – ein separater „Prüfen"-Button ist hier nicht nötig.
- `questionType: "open"` – **Offene Fragen**, bei denen die Antwort manuell eingegeben wird (inkl. Levenshtein-Fuzzy-Matching und Zahlen-Normalisierung). Die Antwort wird über den „Prüfen"-Button oder die Enter-Taste abgegeben.

Jede Frage enthält optional eine **Kategorie** (z. B. Hardware, Netzwerke, Datenbanken, Programmierung, Mathematik, IT-Sicherheit, Betriebssysteme, Logik, IT-Geschichte, KI, Projektmanagement, usw.).

Bei offenen Fragen kann die `antwort`-Komponente entweder ein String oder ein Array von Strings sein (123 der 140 offenen Fragen akzeptieren mehrere Antwortformen, z. B. `"x = 7"` und `"7"`).

### Ablauf des Spiels

- **Start**: Eingabe eines Spielernamens/Nicks.
- **Startguthaben**: 3 Leben, 1-mal Überspringen (`Skips`), 1-mal 50:50.
- **HUD-Anzeige**: Leben, aktueller Punktestand, aktiver Multiplikator, Countdown, visuelle Timer-Bar, Spieler-Titel und Kategorie-Badge.
- **Spielende**: Das Spiel endet, wenn alle Leben verloren sind **oder** alle Fragen beantwortet wurden.

#### Hilfsmittel

- **50:50**: Entfernt zwei falsche Antwortmöglichkeiten bei Multiple-Choice-Fragen (nicht in offenen Fragen, nicht bei der Belohnungs-Frage). Kann nur **einmal pro Frage** verwendet werden.
- **Überspringen**: Überspringt die aktuelle Frage. Der Skip-Button ist deaktiviert, wenn keine Skips mehr übrig sind.

#### Punkte & Multiplikatoren

- **Streaks & Multiplikator**:
  - 3 richtige Antworten in Folge: **1.5x Multiplikator**
  - 6 richtige Antworten in Folge: **2.0x Multiplikator**
  - 9+ richtige Antworten in Folge: **3.0x Multiplikator**
- **Combo-Bonus**: Alle 5 richtigen Antworten in Folge erhält der Spieler eine zufällige Belohnung:
  - 40 % Chance: **+1 50:50**
  - 40 % Chance: **+1 Überspringen**
  - 20 % Chance: **+1 Leben**
- **Multiple-Choice**: 30 Sekunden Zeitlimit; Basiswert 100 Punkte (multipliziert mit dem Streak-Faktor).
- **Offene Fragen**: 60 Sekunden Zeitlimit. Volle 100 Punkte innerhalb der ersten 30 Sekunden; danach -2 Punkte pro verbleibender Sekunde.
- **Fehler / Timeout**: Zurücksetzen der Serie auf 0, Verlust von 1 Leben sowie Auslösen visueller Schadensteffekte (Bildschirmzittern + roter Blitz).
- **Automatischer Fortschritt**: Nach einer richtigen Antwort wird nach einer 2-sekündigen Verzögerung zur nächsten Frage gewechselt. Nach einer falschen Antwort oder einem Timeout erscheint ein „Nächste Frage"-Button und die Frage wird nach 5 bzw. 15 Sekunden automatisch übersprungen.

#### Besondere Frage: Belohnungs-Frage (nr 9999)

Innerhalb des Fragenkatalogs gibt es eine einzige **Belohnungs-Frage** (`nr: 9999`), die als Multiple-Choice-Frage erscheint. Der Spieler wählt eine der vier Optionen aus, um eine Belohnung zu erhalten:

| Option | Belohnung |
|--------|-----------|
| + 2 Leben | +2 Leben |
| + 3 Überspringen | +3 Überspringen |
| + 3 50:50 | +3 50:50 |
| + 1000 Punkte | +1000 Punkte |

Die Belohnungs-Frage **verleiht keine Basis-Punkte** und **erhöht nicht die Streak**. Wird die Zeit abgelaufen, ohne eine Antwort zu wählen, so wird **keine Strafe** ausgesprochen (kein Leben verloren, keine Streak zurückgesetzt) – der Spieler verpasst lediglich die Belohnung.

### Spieler-Titel

<details>
<summary>Basierend auf der erreichten Punktezahl werden passende Titel verliehen:</summary>

| Punkte     | Titel           |
|------------|-----------------|
| 10001+     | OVERDEITY!!!    |
| 9001+      | LET HIM COOK!   |
| 7001+      | OMFG!           |
| 5001+      | Godling         |
| 3501+      | Absolute Unit   |
| 2501+      | Aura            |
| 1501+      | Ordinary Joe    |
| 1001+      | Flutterby       |
| 501+       | Creeper         |
| < 500      | Anfänger        |
</details>

Der Titel wird sowohl im HUD während des Spiels als auch in der Bestenliste angezeigt.

## Antwort-Überprüfung (offene Fragen)

Bei offenen Fragen wird die Eingabe des Spielers anhand einer **dreistufigen Übereinstimmungsstrategie** mit der korrekten Antwort verglichen:

1. **Exakte Übereinstimmung** (nach Normalisierung): Der normalisierte Benutzereingabe wird mit der normalisierten korrekten Antwort verglichen.
2. **Wort-Überlappung** (≥ 70 %): Prüft, ob mindestens 70 % der Wörter der korrekten Antwort im Benutzereingabe enthalten sind (toleriert zusätzliche Wörter).
3. **Fuzzy-Matching via Levenshtein-Distanz** (≥ 80 %): Fängt Tippfehler ab, indem die Edit-Distanz zwischen den Strings berechnet wird.

Zusätzlich wird die Eingabe durch den **Deutschen-Zahl-Wort-Parser** (`numbers.js`) verarbeitet, der Zahlworten wie „einundzwanzig“ in „21“ umwandelt, sodass auch Antworten in Wortform erkannt werden.

## Visuelle Effekte

- **Timer-Bar**: Eine visuelle Fortschrittsleiste zeigt die verbleibende Zeit. Sie wird **rot**, wenn noch 5 Sekunden oder weniger übrig sind.
- **Herz-Animation**: Das Herz-Symbol im HUD **pulsieren** animiert, wenn nur noch 1 Leben übrig ist.
- **Multiplikator-Badge**: Zeigt den aktuellen Streak-Multiplikator als `⚡ x1.5` (oder höher) an, sobald er über 1.0 liegt.
- **Schaden-Effekte**: Bei Verlust eines Lebens wird der Bildschirm **gezittert** (Shake-Animation) und ein **roter Blitz** überlagert den Bildschirm.
- **Streak-Effekte**: Bei Streak-Meilensteinen (5, 10, 15 richtige Antworten) erscheint ein farbenfrohes Hintergrund-Overlay, ein Pulsieren des Spielfensters und ein Banner mit einer Streak-Botschaft.
- **Combo-Banner**: Bei jedem 5. korrekten Antwort in Folge wird ein Banner angezeigt, der die erhaltene zufällige Belohnung anzeigt (+1 Leben, +1 Überspringen oder +1 50:50).
- **Antwort-Feedback**: Bei falschen Antworten wird die korrekte Antwort in einem farblich hervorgehobenen Kasten (grün) angezeigt. Bei richtigen Antworten erscheint eine grüne Bestätigung.
- **Choice-Buttons**: Richtige Antworten werden **grün** und falsche **rot** hervorgehoben, nachdem eine Antwort abgegeben wurde.

## Bestenliste & Firebase

- **Speichern**: Nach Spielende wird das Ergebnis (`name`, `points`, `date`) automatisch in Firestore (`scores`-Kollektion) abgelegt.
- **Ränge/Titel**: Die **Bestenliste** zeigt die **TOP 10** Spieler basierend auf absteigenden Punkten – inklusive einer **Titel-Spalte**, die den zugehörigen Spieler-Titel anzeigt.
- **Datenabruf**: Es werden die Top 50 Einträge aus Firestore abgerufen, clientseitig nach Punkten sortiert und die besten 10 angezeigt.
- **Sicherheit**: Alle Zellen der Bestenliste werden mit `textContent` (nicht `innerHTML`) erstellt, um **gespeicherte XSS-Angriffe** durch Spieler-Namen zu verhindern.
- **Responsives Design**: Die Oberfläche ist für Smartphone-Bildschirme optimiert (kleinere Schriftgrößen, kompaktere Buttons, stapelbare Antworten).

## Feedback-Funktion

- **Immer sichtbarer Button**: Ein schwebender „Feedback"-Button ist dauerhaft in der unteren rechten Ecke sichtbar (über der Bestenliste).
- **Modal-Dialog**: Beim Klick öffnet sich ein Modal mit einem **Textarea-Eingabefeld** und einem **„Senden"-Button**. Die Eingabe kann auch per **Strg+Enter** (bzw. Cmd+Enter auf Mac) gesendet werden.
- **Spiel-Pause**: Während des Spiels wird das Spiel beim Öffnen des Modals **pausiert** (Timer und Verzögerungen werden angehalten) und beim Schließen **fortgesetzt**.
- **Speichern in Firestore (`feedback`-Kollektion)**: Das Feedback wird mit 3 Feldern in Firestore gespeichert:
  - `nr` – die Nummer der aktuellen Frage während des Spiels, oder `0` auf dem Start-/Game-Over-Bildschirm.
  - `feedback` – der eingegebene Text des Spielers.
  - `date` – das aktuelle Datum und die Uhrzeit (ISO-Format).
- **Bestätigung**: Nach erfolgreichem Senden wird eine Erfolgsmeldung ("Danke für dein Feedback!") angezeigt und das Modal schließt sich automatisch nach 2 Sekunden.

## Projektstruktur

```text
├── index.html              # UI-Struktur, Firebase SDK Script & Modul-Imports
├── style.css               # Layout, Animationen, Timer-Bar, Farbpalette & Responsive-Design
├── main.js                 # Haupteinstiegspunkt & Event-Listener
├── game.js                 # Kern-Spiellogik (Timer, Punkte, Navigation, Game-Loop)
├── ui.js                   # HUD-Updates, Spieler-Titel, visuelle Effekte & Bestenliste
├── state.js                # Zentraler Speicher für den Spielzustand (State Management)
├── firebase.js             # Firestore-Anbindung (saveScoreFirebase, fetchScoresFirebase)
├── feedback.js             # Feedback-Button, Modal-Dialog & Firestore-Speicherung
├── checker.js              # Text-Analyse (Levenshtein-Distanz & Word-Overlap)
├── numbers.js              # German-Number-Parser (z. B. "einundzwanzig" -> "21")
├── find-invalid-escapes.cjs # Hilfsskript: findet ungültige Escape-Sequenzen in fragen.json
├── fragen.json             # Fragenkatalog (2.761 Fragen)
├── fragen.json.backup      # Sicherungskopie des Fragenkatalogs
└── readme.md               # Diese Datei
```

### Skript-Lade-Reihenfolge

In `index.html` wird darauf geachtet, dass die Skripte in der richtigen Reihenfolge geladen werden:

1. **Firebase SDK** (inline als ES-Modul) – initialisiert Firestore und exponiert `window.firebaseDb` + `window.firebaseHelpers`.
2. **checker.js** (klassisches Skript) – definiert `normalize()` und `checkAnswer()` als globale Funktionen.
3. **numbers.js** (klassisches Skript) – nutzt `normalize()` aus checker.js und definiert `normalizeWithNumbers()`.
4. **main.js** (ES-Modul) – importiert `game.js`, `state.js`, `firebase.js`, `feedback.js` und richtet alle Event-Listener ein.

## Lokales Starten

Um das Projekt lokal mit ES-Modulen und Firebase zu starten:

1. Repository klonen:

   ```bash
   git clone <URL_des_Repository>
   cd informatiker-milionaeren
   ```

2. Einen lokalen Webserver starten (erforderlich für ES-Module und Firebase):

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
