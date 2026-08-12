# Fachinformatiker – Quiz

Ein interaktives Web-Quiz zur Vorbereitung auf die Fachinformatiker-Prüfung. Enthält offene und Multiple-Choice-Fragen, Zeitlimits, ein dynamisches Multiplikator- und Leben-System, Kategorien, Spieler-Titel sowie eine globale Bestenliste via Firebase Firestore.

## Spielprinzip

### Fragetypen

In der Fragenbasis (`fragen.json`) befinden sich zwei Fragetypen:

- `questionType: "choice"` – **Multiple-Choice-Fragen** mit 4 Antwortmöglichkeiten. Die Antwort wird durch Klick auf eine Antwortmöglichkeit automatisch abgegeben – ein separater „Prüfen"-Button ist hier nicht nötig.
- `questionType: "open"` – **Offene Fragen**, bei denen die Antwort manuell eingegeben wird (inkl. Levenshtein-Fuzzy-Matching und Zahlen-Normalisierung). Die Antwort wird über den „Prüfen"-Button oder die Enter-Taste abgegeben.

Jede Frage enthält optional eine Zuordnung zu einer **Kategorie** (z. B. Netzwerke, Datenbanken, Allgemein).

### Ablauf des Spiels

- **Start**: Eingabe eines Spielernamens/Nicks.
- **Startguthaben**: 3 Leben, 1-mal Überspringen (`Skips`), 1-mal 50:50.
- **HUD-Anzeige**: Leben, aktueller Punktestand, aktiver Multiplikator, Countdown, visuelle Timer-Bar, Spieler-Titel und Kategorie-Badge.

#### Hilfsmittel

- **50:50**: Entfernt zwei falsche Antwortmöglichkeiten bei Multiple-Choice-Fragen (nicht in offenen Fragen).
- **Überspringen**: Überspringt die aktuelle Frage.

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
- **Fehler / Timeout**: Zurücksetzen der Serie auf 0, Verlust von 1 Leben sowie Auslösen visueller Schadensteffekte.

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

## Bestenliste & Firebase

- **Speichern**: Nach Spielende wird das Ergebnis (`name`, `points`, `date`) automatisch in Firestore (`scores`) abgelegt.
- **Ränge/Titel**: Die **Bestenliste** zeigt die **TOP 10** Spieler basierend auf absteigenden Punkten – inklusive einer **Titel-Spalte**, die den zugehörigen Spieler-Titel anzeigt.
- **Responsives Design**: Die Oberfläche ist für Smartphone-Bildschirme optimiert (kleinere Schriftgrößen, kompaktere Buttons, stapelbare Antworten).

## Projektstruktur

```text
├── index.html       # UI-Struktur, Firebase SDK Script & Modul-Imports
├── style.css        # Layout, Animationen, Timer-Bar, Farbpalette & Responsive-Design
├── main.js          # Haupteinstiegspunkt & Event-Listener
├── game.js          # Kern-Spiellogik (Timer, Punkte, Navigation, Game-Loop)
├── ui.js            # HUD-Updates, Spieler-Titel, visual Effects & Bestenliste
├── state.js         # Zentraler Speicher für den Spielzustand (State Management)
├── firebase.js      # Firestore-Anbindung (saveScoreFirebase, fetchScoresFirebase)
├── checker.js       # Text-Analyse (Levenshtein-Distanz & Word-Overlap)
├── numbers.js       # German-Number-Parser (z. B. "einundzwanzig" -> "21")
└── fragen.json      # Fragenkatalog
```

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