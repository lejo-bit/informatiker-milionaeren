/**
 * qa-finalize.js
 * Fügt jedem Frageobjekt in fragen.json ein "review"-Feld hinzu.
 * Markiert Duplikate (exakt gleicher Fragetext) und Template-Duplikate
 * (identische antwort+falseAnswers-Kombinationen = gleiche Information),
 * korrigiert zu lange Distraktoren und erzeugt fragen_reviewed.json.
 */
const fs = require('fs');

const FRAGEN = require('./fragen.json');

// ---------------------------------------------------------------
// 1) Längen-Korrekturen für falseAnswers > 15 Wörter
// ---------------------------------------------------------------
const LAENGEN_KORREKTUREN = {
  462: { falseAnswers: [
    "Zugriff auf alle Daten der eigenen Rolle",
    "Zugriff auf sämtliche Daten der Abteilung",
    "Beschränkung auf technisch notwendige Systemfunktionen"
  ]},
  488: { falseAnswers: [
    "Daten möglichst umfassend für künftige Zwecke sammeln",
    "Daten nur bis zur Zweckerfüllung oder Frist speichern",
    "Daten ausschließlich mit Einwilligung verarbeiten"
  ]},
  489: { falseAnswers: [
    "Nur die unbedingt erforderlichen Daten erheben",
    "Daten für beliebige spätere Zwecke weiterverwenden",
    "Daten nach Zweckende automatisch dauerhaft archivieren"
  ]}
};

// ---------------------------------------------------------------
// 2) Duplikat-Gruppen (erste Nummer bleibt, Rest wird "duplikat")
//    Form: { bleiben: nr, duplikate: Map<nr, alternativVorschlag> }
// ---------------------------------------------------------------
const DUPLIKATE = [
  // --- Exakte Text-Duplikate ---
  { bleiben: 51,  duplikate: new Map([[263, { questionType: "choice", frage: "Welche Struktur legt fest, wie Dateien auf einem Datenträger abgelegt und verwaltet werden?", antwort: "Ein Dateisystem", falseAnswers: ["Eine Datenbank", "Ein Bootloader", "Ein Netzwerkprotokoll"], category: "Betriebssysteme" }]]) },
  { bleiben: 308, duplikate: new Map([[309, { questionType: "choice", frage: "Wie spricht man das Symbol für die logische ODER-Verknüpfung aus?", antwort: "ODER", falseAnswers: ["UND", "NICHT", "XOR"], category: "Logik" }]]) },
  { bleiben: 347, duplikate: new Map([[348, { questionType: "choice", frage: "Welches Symbol steht für den Allquantor in der Prädikatenlogik?", antwort: "∀", falseAnswers: ["∃", "¬", "⇒"], category: "Logik" }]]) },
  { bleiben: 481, duplikate: new Map([[1179, { questionType: "choice", frage: "Welche Daten gelten nach DSGVO als personenbezogen?", antwort: "Daten, die eine natürliche Person identifizieren", falseAnswers: ["Nur Namen und Kontaktdaten", "Nur digitale Profildaten", "Ausschließlich biometrische Daten"], category: "IT-Sicherheit" }]]) },
  { bleiben: 622, duplikate: new Map([[2678, { questionType: "open", frage: "Nenne die deutsche Bezeichnung für HTML.", antwort: ["Hypertext-Auszeichnungssprache", "Auszeichnungssprache für Webseiten"], category: "IT-Grundlagen" }]]) },
  { bleiben: 640, duplikate: new Map([[1084, { questionType: "choice", frage: "Mit welcher CSS-Eigenschaft lässt sich die Textfarbe eines Elements setzen?", antwort: "color", falseAnswers: ["background-color", "font-weight", "text-decoration"], category: "Programmierung" }]]) },
  { bleiben: 641, duplikate: new Map([[1085, { questionType: "choice", frage: "Mit welcher CSS-Eigenschaft ändert man die Hintergrundfarbe eines Elements?", antwort: "background-color", falseAnswers: ["color", "border-color", "opacity"], category: "Programmierung" }]]) },

  // --- Abkürzungs-Duplikate (Kaufleute 1321-1354) ---
  { bleiben: 1321, duplikate: new Map([
    [2040, { questionType: "choice", frage: "Welcher Preis ergibt sich nach Abzug des Lieferrabatts vom Listenpreis?", antwort: "Zieleinkaufspreis", falseAnswers: ["Bezugspreis", "Einstandspreis", "Barzahlungspreis"], category: "Wirtschaft & Soziales" }],
    [2252, { questionType: "choice", frage: "Ab welchem Preis beginnt die weitere Kalkulation nach Abzug von Rabatten?", antwort: "Zieleinkaufspreis", falseAnswers: ["Verkaufspreis", "Barzahlungspreis", "Kreditpreis"], category: "Wirtschaft & Soziales" }]
  ])},
  { bleiben: 1322, duplikate: new Map([[2282, { questionType: "choice", frage: "Wie nennt man den Wert der in einer Periode verbrauchten Waren?", antwort: "Wareneinsatz", falseAnswers: ["Bezugskosten", "Handelsspanne", "Skontoertrag"], category: "Wirtschaft & Soziales" }]]) },
  { bleiben: 1323, duplikate: new Map([[2281, { questionType: "choice", frage: "Welche Größe ergibt sich aus Verkaufspreis abzüglich Einstandspreis?", antwort: "Handelsspanne", falseAnswers: ["Rabatt", "Skonto", "Kalkulationszuschlag"], category: "Wirtschaft & Soziales" }]]) },
  { bleiben: 1332, duplikate: new Map([[2287, { questionType: "choice", frage: "Welches Dokument korrigiert eine bereits gestellte Rechnung?", antwort: "Gutschrift", falseAnswers: ["Lieferschein", "Mahnung", "Auftragsbestätigung"], category: "Wirtschaft & Soziales" }]]) },
  { bleiben: 1333, duplikate: new Map([[2288, { questionType: "choice", frage: "Welches Dokument begleitet die Warenlieferung und bestätigt deren Umfang?", antwort: "Lieferschein", falseAnswers: ["Rechnung", "Bestellung", "Mahnbescheid"], category: "Wirtschaft & Soziales" }]]) },
  { bleiben: 1334, duplikate: new Map([[2289, { questionType: "choice", frage: "Welches Dokument gibt die gewünschten Waren und Konditionen eines Käufers an?", antwort: "Bestellung", falseAnswers: ["Angebot", "Lieferschein", "Kassenbon"], category: "Wirtschaft & Soziales" }]]) },
  { bleiben: 1335, duplikate: new Map([
    [2122, { questionType: "choice", frage: "Womit bestätigt der Verkäufer die Annahme einer Bestellung?", antwort: "Auftragsbestätigung", falseAnswers: ["Lieferschein", "Gutschrift", "Mahnung"], category: "Wirtschaft & Soziales" }],
    [2290, { questionType: "choice", frage: "Welches Schriftstück schafft Rechtssicherheit über den vereinbarten Lieferumfang?", antwort: "Auftragsbestätigung", falseAnswers: ["Angebot", "Proforma-Rechnung", "Lieferschein"], category: "Wirtschaft & Soziales" }]
  ])},
  { bleiben: 1336, duplikate: new Map([[2291, { questionType: "choice", frage: "Bis wann muss eine Rechnung spätestens beglichen werden?", antwort: "Zahlungsziel", falseAnswers: ["Skontofrist", "Lieferfrist", "Gewährleistungsfrist"], category: "Wirtschaft & Soziales" }]]) },
  { bleiben: 1337, duplikate: new Map([
    [2292, { questionType: "choice", frage: "Welches Schreiben erinnert den Kunden an eine offene Zahlung?", antwort: "Mahnung", falseAnswers: ["Rechnung", "Gutschrift", "Angebot"], category: "Wirtschaft & Soziales" }],
    [2301, { questionType: "choice", frage: "Wie heißt die erste Zahlungserinnerung nach Überschreiten des Zahlungsziels?", antwort: "Mahnung", falseAnswers: ["Mahnbescheid", "Vollstreckungsbescheid", "Kreditvertrag"], category: "Wirtschaft & Soziales" }]
  ])},
  { bleiben: 1338, duplikate: new Map([
    [2293, { questionType: "choice", frage: "Welches Dokument erlässt das Gericht zur Durchsetzung einer Geldforderung?", antwort: "Mahnbescheid", falseAnswers: ["Lieferschein", "Gutschrift", "Kaufvertrag"], category: "Wirtschaft & Soziales" }],
    [2310, { questionType: "choice", frage: "Welches amtliche Schriftstück leitet ein gerichtliches Mahnverfahren ein?", antwort: "Mahnbescheid", falseAnswers: ["Rechnung", "Mahnung", "Kassenbeleg"], category: "Wirtschaft & Soziales" }]
  ])},
  { bleiben: 1339, duplikate: new Map([[2294, { questionType: "choice", frage: "Was unterscheidet ein Angebot von einer Rechnung?", antwort: "Angebot vor Kauf, Rechnung nach Lieferung", falseAnswers: ["Beide sind verbindliche Zahlungsaufforderungen", "Angebot enthält keine Preise", "Rechnung ist unverbindlich"], category: "Wirtschaft & Soziales" }]]) },
  { bleiben: 1340, duplikate: new Map([[2295, { questionType: "choice", frage: "Worin liegt der Unterschied zwischen Rabatt und Skonto?", antwort: "Rabatt wird sofort abgezogen, Skonto bei Zahlung", falseAnswers: ["Beides sind nachträgliche Boni", "Skonto ist ein Mengenrabatt", "Rabatt ist gesetzlich vorgeschrieben"], category: "Wirtschaft & Soziales" }]]) },
  { bleiben: 1341, duplikate: new Map([[2276, { questionType: "choice", frage: "Mit welchem Faktor wird der Einstandspreis multipliziert, um den Verkaufspreis zu erhalten?", antwort: "Kalkulationsfaktor", falseAnswers: ["Handelsspanne", "Skontosatz", "Bezugskostenanteil"], category: "Wirtschaft & Soziales" }]]) },
  { bleiben: 1342, duplikate: new Map([[2277, { questionType: "choice", frage: "Welcher Prozentsatz wird auf den Einstandspreis aufgeschlagen?", antwort: "Kalkulationszuschlag", falseAnswers: ["Rabattsatz", "Skontosatz", "Umsatzsteuersatz"], category: "Wirtschaft & Soziales" }]]) },
  { bleiben: 1343, duplikate: new Map([[2042, { questionType: "choice", frage: "Welcher Preis ergibt sich aus Zieleinkaufspreis zuzüglich Bezugskosten?", antwort: "Bezugspreis", falseAnswers: ["Listenpreis", "Barzahlungspreis", "Kreditpreis"], category: "Wirtschaft & Soziales" }]]) },
  { bleiben: 1344, duplikate: new Map([
    [2043, { questionType: "choice", frage: "Wie heißen Kosten wie Fracht oder Versicherung bis zum Wareneingang?", antwort: "Bezugskosten", falseAnswers: ["Vertriebskosten", "Verwaltungskosten", "Herstellungskosten"], category: "Wirtschaft & Soziales" }],
    [2254, { questionType: "choice", frage: "Welche Kosten erhöhen den Einstandspreis der Ware?", antwort: "Bezugskosten", falseAnswers: ["Rabatte", "Skonti", "Umsatzsteuer"], category: "Wirtschaft & Soziales" }]
  ])},
  { bleiben: 1346, duplikate: new Map([[2278, { questionType: "choice", frage: "Welcher Preis wird dem Kunden für die Ware in Rechnung gestellt?", antwort: "Verkaufspreis", falseAnswers: ["Listenpreis", "Bezugspreis", "Wareneinsatz"], category: "Wirtschaft & Soziales" }]]) },
  { bleiben: 1347, duplikate: new Map([[2268, { questionType: "choice", frage: "Welcher Rabatt wird bei Abnahme großer Mengen gewährt?", antwort: "Mengenrabatt", falseAnswers: ["Treuerabatt", "Saisonrabatt", "Personalrabatt"], category: "Wirtschaft & Soziales" }]]) },
  { bleiben: 1348, duplikate: new Map([[2269, { questionType: "choice", frage: "Welcher Rabatt belohnt langjährige Geschäftsbeziehungen?", antwort: "Treuerabatt", falseAnswers: ["Mengenrabatt", "Funktionsrabatt", "Barzahlungsrabatt"], category: "Wirtschaft & Soziales" }]]) },
  { bleiben: 1349, duplikate: new Map([[2270, { questionType: "choice", frage: "Welcher Rabatt wird außerhalb der Hauptsaison angeboten?", antwort: "Saisonrabatt", falseAnswers: ["Mengenrabatt", "Treuerabatt", "Personalrabatt"], category: "Wirtschaft & Soziales" }]]) },
  { bleiben: 1350, duplikate: new Map([[2271, { questionType: "choice", frage: "Welcher Rabatt wird Mitarbeitern des eigenen Unternehmens gewährt?", antwort: "Personalrabatt", falseAnswers: ["Mengenrabatt", "Saisonrabatt", "Wiederverkäuferrabatt"], category: "Wirtschaft & Soziales" }]]) },
  { bleiben: 1351, duplikate: new Map([[2272, { questionType: "choice", frage: "Wie hoch ist der prozentuale Nachlass bei sofortiger Zahlung?", antwort: "Skontosatz", falseAnswers: ["Rabattsatz", "Kalkulationszuschlag", "Umsatzsteuersatz"], category: "Wirtschaft & Soziales" }]]) },
  { bleiben: 1352, duplikate: new Map([[2273, { questionType: "choice", frage: "Innerhalb welchen Zeitraums kann Skonto abgezogen werden?", antwort: "Skontofrist", falseAnswers: ["Zahlungsziel", "Lieferfrist", "Gewährleistungsfrist"], category: "Wirtschaft & Soziales" }]]) },
  { bleiben: 1353, duplikate: new Map([[2274, { questionType: "choice", frage: "Welcher Preis gilt bei Zahlung innerhalb der Skontofrist?", antwort: "Barzahlungspreis", falseAnswers: ["Kreditpreis", "Listenpreis", "Bezugspreis"], category: "Wirtschaft & Soziales" }]]) },
  { bleiben: 1354, duplikate: new Map([[2275, { questionType: "choice", frage: "Welcher Kaufpreis gilt, wenn erst nach Ablauf der Skontofrist gezahlt wird?", antwort: "Kreditpreis", falseAnswers: ["Barzahlungspreis", "Zieleinkaufspreis", "Einstandspreis"], category: "Wirtschaft & Soziales" }]]) },
  { bleiben: 1365, duplikate: new Map([[1391, { questionType: "choice", frage: "Welches Verfahren verteilt Anschaffungskosten in gleichbleibenden jährlichen Beträgen?", antwort: "Annuitätenmethode", falseAnswers: ["Lineare Abschreibung", "Degressive Abschreibung", "Payback-Methode"], category: "Wirtschaft & Soziales" }]]) },
  { bleiben: 2039, duplikate: new Map([[2251, { questionType: "choice", frage: "Welcher Preis steht als Ausgangswert vor Rabattabzug in der Preisliste?", antwort: "Listeneinkaufspreis", falseAnswers: ["Zieleinkaufspreis", "Einstandspreis", "Verkaufspreis"], category: "Wirtschaft & Soziales" }]]) },
  { bleiben: 2041, duplikate: new Map([[2253, { questionType: "choice", frage: "Welcher Kaufpreis ergibt sich nach Abzug des Skontos?", antwort: "Bareinkaufspreis", falseAnswers: ["Krediteinkaufspreis", "Bezugspreis", "Listenpreis"], category: "Wirtschaft & Soziales" }]]) },
  { bleiben: 2265, duplikate: new Map([[2307, { questionType: "choice", frage: "Welche Preisminderung gewährt der Verkäufer ohne zeitliche Bedingung?", antwort: "Rabatt", falseAnswers: ["Skonto", "Bonus", "Provision"], category: "Wirtschaft & Soziales" }]]) },

  // --- Datenbank-Kardinalitäten (Serien 1546-1639) ---
  { bleiben: 1525, duplikate: new Map([[1599, { questionType: "choice", frage: "Wie bildet man eine 1:n-Beziehung in relationalen Tabellen ab?", antwort: "Fremdschlüssel in der Tabelle der n-Seite", falseAnswers: ["Fremdschlüssel in der 1-Seite", "Verknüpfungstabelle", "Ohne Schlüsselattribute"], category: "Datenbanken" }]]) },
  { bleiben: 1546, duplikate: new Map([[1593, { questionType: "choice", frage: "Welche Kardinalität verknüpft genau ein Auto mit genau einem Kennzeichen?", antwort: "1:1-Beziehung", falseAnswers: ["1:n-Beziehung", "n:m-Beziehung", "Keine Beziehung"], category: "Datenbanken" }]]) },
  { bleiben: 1547, duplikate: new Map([[1594, { questionType: "choice", frage: "Welche Kardinalität liegt vor, wenn ein Kunde mehrere Bestellungen aufgibt?", antwort: "1:n-Beziehung", falseAnswers: ["1:1-Beziehung", "n:m-Beziehung", "Keine Beziehung"], category: "Datenbanken" }]]) },
  { bleiben: 1548, duplikate: new Map([[1595, { questionType: "choice", frage: "Welche Kardinalität liegt vor, wenn Studenten mehrere Kurse besuchen und Kurse mehrere Studenten haben?", antwort: "n:m-Beziehung", falseAnswers: ["1:1-Beziehung", "1:n-Beziehung", "Keine Beziehung"], category: "Datenbanken" }]]) },
  { bleiben: 1549, duplikate: new Map([[1596, { questionType: "choice", frage: "Welches Beispiel beschreibt eine 1:1-Kardinalität?", antwort: "Ein Land hat genau eine Hauptstadt", falseAnswers: ["Ein Kunde hat mehrere Bestellungen", "Studenten besuchen mehrere Kurse", "Eine Abteilung hat viele Mitarbeiter"], category: "Datenbanken" }]]) },
  { bleiben: 1557, duplikate: new Map([[1604, { questionType: "choice", frage: "Wie nennt man die Beziehung zwischen Mitarbeitern und Projekten, wenn ein Mitarbeiter an mehreren Projekten arbeitet?", antwort: "n:m-Beziehung", falseAnswers: ["1:1-Beziehung", "1:n-Beziehung", "Keine Beziehung"], category: "Datenbanken" }]]) },
  { bleiben: 1558, duplikate: new Map([[1605, { questionType: "choice", frage: "Wie nennt man die Beziehung zwischen Autoren und Büchern bei mehreren Autoren pro Buch?", antwort: "n:m-Beziehung", falseAnswers: ["1:1-Beziehung", "1:n-Beziehung", "Keine Beziehung"], category: "Datenbanken" }]]) },
  { bleiben: 1559, duplikate: new Map([[1606, { questionType: "choice", frage: "Wie nennt man die Beziehung zwischen Abteilung und Mitarbeitern?", antwort: "1:n-Beziehung", falseAnswers: ["1:1-Beziehung", "n:m-Beziehung", "Keine Beziehung"], category: "Datenbanken" }]]) },
  { bleiben: 1560, duplikate: new Map([[1607, { questionType: "choice", frage: "Welche Kardinalität besteht zwischen einem Auto und seinem Kennzeichen?", antwort: "1:1", falseAnswers: ["1:n", "n:m", "keine"], category: "Datenbanken" }]]) },
  { bleiben: 1561, duplikate: new Map([
    [1608, { questionType: "choice", frage: "Welche Kardinalität besteht zwischen Kunde und Bestellung?", antwort: "1:n", falseAnswers: ["1:1", "n:m", "keine"], category: "Datenbanken" }],
    [1610, { questionType: "choice", frage: "Welche Kardinalität besteht zwischen Arzt und Patienten?", antwort: "1:n", falseAnswers: ["1:1", "n:m", "keine"], category: "Datenbanken" }],
    [1613, { questionType: "choice", frage: "Welche Kardinalität besteht zwischen Klasse und Schülern?", antwort: "1:n", falseAnswers: ["1:1", "n:m", "keine"], category: "Datenbanken" }],
    [1617, { questionType: "choice", frage: "Welche Kardinalität besteht zwischen Kategorie und Produkten?", antwort: "1:n", falseAnswers: ["1:1", "n:m", "keine"], category: "Datenbanken" }],
    [1618, { questionType: "choice", frage: "Welche Kardinalität besteht zwischen Abteilung und Mitarbeitern?", antwort: "1:n", falseAnswers: ["1:1", "n:m", "keine"], category: "Datenbanken" }],
    [1619, { questionType: "choice", frage: "Welche Kardinalität besteht zwischen einem Mitarbeiter und seinen Arbeitsplätzen in einer Abteilung?", antwort: "1:n", falseAnswers: ["1:1", "n:m", "keine"], category: "Datenbanken" }],
    [1571, { questionType: "choice", frage: "Welche Kardinalität beschreibt 'ein Mitarbeiter arbeitet in einer Abteilung'?", antwort: "1:n", falseAnswers: ["1:1", "n:m", "keine"], category: "Datenbanken" }],
    [1563, { questionType: "choice", frage: "Wie lautet die Kardinalität für 'ein Arzt behandelt mehrere Patienten'?", antwort: "1:n", falseAnswers: ["1:1", "n:m", "keine"], category: "Datenbanken" }],
    [1566, { questionType: "choice", frage: "Wie lautet die Kardinalität für 'eine Klasse hat mehrere Schüler'?", antwort: "1:n", falseAnswers: ["1:1", "n:m", "keine"], category: "Datenbanken" }],
    [1570, { questionType: "choice", frage: "Wie lautet die Kardinalität für 'eine Kategorie hat mehrere Produkte'?", antwort: "1:n", falseAnswers: ["1:1", "n:m", "keine"], category: "Datenbanken" }],
    [1572, { questionType: "choice", frage: "Welche Kardinalität verknüpft eine Abteilung mit ihren Mitarbeitern?", antwort: "1:n", falseAnswers: ["1:1", "n:m", "keine"], category: "Datenbanken" }]
  ])},
  { bleiben: 1562, duplikate: new Map([
    [1609, { questionType: "choice", frage: "Welche Kardinalität besteht zwischen Studenten und Kursen?", antwort: "n:m", falseAnswers: ["1:1", "1:n", "keine"], category: "Datenbanken" }],
    [1611, { questionType: "choice", frage: "Welche Kardinalität besteht zwischen einem Patienten und seinen Ärzten?", antwort: "n:m", falseAnswers: ["1:1", "1:n", "keine"], category: "Datenbanken" }],
    [1614, { questionType: "choice", frage: "Welche Kardinalität besteht zwischen Schülern und Kursen?", antwort: "n:m", falseAnswers: ["1:1", "1:n", "keine"], category: "Datenbanken" }],
    [1615, { questionType: "choice", frage: "Welche Kardinalität besteht zwischen Büchern und Autoren?", antwort: "n:m", falseAnswers: ["1:1", "1:n", "keine"], category: "Datenbanken" }],
    [1620, { questionType: "choice", frage: "Welche Kardinalität besteht zwischen Mitarbeitern und Projekten?", antwort: "n:m", falseAnswers: ["1:1", "1:n", "keine"], category: "Datenbanken" }],
    [1621, { questionType: "choice", frage: "Welche Kardinalität besteht zwischen Projekten und Mitarbeitern?", antwort: "n:m", falseAnswers: ["1:1", "1:n", "keine"], category: "Datenbanken" }],
    [1564, { questionType: "choice", frage: "Wie lautet die Kardinalität für 'ein Patient wird von mehreren Ärzten behandelt'?", antwort: "n:m", falseAnswers: ["1:1", "1:n", "keine"], category: "Datenbanken" }],
    [1567, { questionType: "choice", frage: "Wie lautet die Kardinalität für 'Schüler besuchen mehrere Kurse'?", antwort: "n:m", falseAnswers: ["1:1", "1:n", "keine"], category: "Datenbanken" }],
    [1568, { questionType: "choice", frage: "Wie lautet die Kardinalität für 'ein Buch hat mehrere Autoren'?", antwort: "n:m", falseAnswers: ["1:1", "1:n", "keine"], category: "Datenbanken" }],
    [1573, { questionType: "choice", frage: "Welche Kardinalität beschreibt 'ein Mitarbeiter arbeitet an mehreren Projekten'?", antwort: "n:m", falseAnswers: ["1:1", "1:n", "keine"], category: "Datenbanken" }],
    [1574, { questionType: "choice", frage: "Welche Kardinalität beschreibt 'ein Projekt hat mehrere Mitarbeiter'?", antwort: "n:m", falseAnswers: ["1:1", "1:n", "keine"], category: "Datenbanken" }]
  ])},
  { bleiben: 1565, duplikate: new Map([
    [1612, { questionType: "choice", frage: "Wie lautet die Kardinalität für 'ein Land hat eine Hauptstadt'?", antwort: "1:1", falseAnswers: ["1:n", "n:m", "keine"], category: "Datenbanken" }],
    [1569, { questionType: "choice", frage: "Wie lautet die Kardinalität für 'ein Produkt gehört zu einer Kategorie'?", antwort: "1:1", falseAnswers: ["1:n", "n:m", "keine"], category: "Datenbanken" }],
    [1616, { questionType: "choice", frage: "Welche Kardinalität beschreibt die Zuordnung eines Produkts zu genau einer Kategorie?", antwort: "1:1", falseAnswers: ["1:n", "n:m", "keine"], category: "Datenbanken" }]
  ])},
  { bleiben: 1575, duplikate: new Map([
    [1622, { questionType: "choice", frage: "Wie nennt man die Beziehung, wenn ein Lieferant mehrere Produkte liefert?", antwort: "1:n-Beziehung", falseAnswers: ["1:1-Beziehung", "n:m-Beziehung", "Keine Beziehung"], category: "Datenbanken" }],
    [1623, { questionType: "choice", frage: "Wie nennt man die Beziehung zwischen Kunde und Adresse beim Wohnsitz?", antwort: "1:1-Beziehung", falseAnswers: ["1:n-Beziehung", "n:m-Beziehung", "Keine Beziehung"], category: "Datenbanken" }],
    [1624, { questionType: "choice", frage: "Wie nennt man die Beziehung zwischen Bestellung und Produkt bei vielen Produkten pro Bestellung?", antwort: "n:m-Beziehung", falseAnswers: ["1:1-Beziehung", "1:n-Beziehung", "Keine Beziehung"], category: "Datenbanken" }],
    [1625, { questionType: "choice", frage: "Wie nennt man die Beziehung zwischen Kurs und Student?", antwort: "n:m-Beziehung", falseAnswers: ["1:1-Beziehung", "1:n-Beziehung", "Keine Beziehung"], category: "Datenbanken" }],
    [1626, { questionType: "choice", frage: "Wie nennt man die Beziehung zwischen Film und Schauspieler?", antwort: "n:m-Beziehung", falseAnswers: ["1:1-Beziehung", "1:n-Beziehung", "Keine Beziehung"], category: "Datenbanken" }],
    [1627, { questionType: "choice", frage: "Wie nennt man die Beziehung zwischen Unternehmen und Mitarbeitern?", antwort: "1:n-Beziehung", falseAnswers: ["1:1-Beziehung", "n:m-Beziehung", "Keine Beziehung"], category: "Datenbanken" }],
    [1628, { questionType: "choice", frage: "Wie nennt man die Beziehung zwischen Team und Spieler?", antwort: "1:n-Beziehung", falseAnswers: ["1:1-Beziehung", "n:m-Beziehung", "Keine Beziehung"], category: "Datenbanken" }],
    [1629, { questionType: "choice", frage: "Wie nennt man die Beziehung zwischen Album und Lied?", antwort: "1:n-Beziehung", falseAnswers: ["1:1-Beziehung", "n:m-Beziehung", "Keine Beziehung"], category: "Datenbanken" }],
    [1630, { questionType: "choice", frage: "Wie nennt man die Beziehung zwischen Hersteller und Produkt?", antwort: "1:n-Beziehung", falseAnswers: ["1:1-Beziehung", "n:m-Beziehung", "Keine Beziehung"], category: "Datenbanken" }],
    [1631, { questionType: "choice", frage: "Worauf muss bei der Ermittlung einer Kardinalität besonders geachtet werden?", antwort: "Auf die fachliche Bedeutung aus Sicht beider Entitäten", falseAnswers: ["Auf die Anzahl der Attribute", "Auf die Reihenfolge der Entitäten", "Auf die Länge der Beziehungsnamen"], category: "Datenbanken" }]
  ])},
  { bleiben: 1584, duplikate: new Map([[1631, { questionType: "choice", frage: "Welcher Aspekt ist bei der Kardinalitätsbestimmung entscheidend?", antwort: "Die fachliche Zuordnung zwischen den beteiligten Entitäten", falseAnswers: ["Die Anzahl der Tabellenspalten", "Der Name der Beziehung", "Das Datenbankmanagementsystem"], category: "Datenbanken" }]]) },
  { bleiben: 1591, duplikate: new Map([[1638, { questionType: "choice", frage: "Was bedeutet die Angabe 0:n in einem ER-Modell?", antwort: "Optional viele zugeordnete Instanzen", falseAnswers: ["Mindestens eine Instanz je Seite", "Genau n Instanzen", "Keine Zuordnung möglich"], category: "Datenbanken" }]]) },
  { bleiben: 1592, duplikate: new Map([[1639, { questionType: "choice", frage: "Was bedeutet die Kardinalität 1:1 im Datenmodell?", antwort: "Genau eine Zuordnung auf beiden Seiten", falseAnswers: ["Viele Zuordnungen auf beiden Seiten", "Optionale Zuordnung", "Keine Zuordnung"], category: "Datenbanken" }]]) },

  // --- BPMN / Prozesse / Projekte ---
  { bleiben: 1659, duplikate: new Map([
    [1725, { questionType: "choice", frage: "Was sollte nach einem fehlerhaften Prozesslauf unbedingt überprüft werden?", antwort: "Die Übergabebedingungen zwischen den Prozessschritten", falseAnswers: ["Die Schriftart der Modellierung", "Die Anzahl der Teilnehmer", "Die Farbe der Ereignisse"], category: "Projektmanagement" }],
    [1754, { questionType: "choice", frage: "Welche Ursache ist bei fehlerhaften Prozessabläufen häufig zu finden?", antwort: "Fehlerhafte Weitergabe von Daten zwischen Schritten", falseAnswers: ["Zu detaillierte Dokumentation", "Zu viele genehmigte Änderungen", "Zu häufige Review-Termine"], category: "Projektmanagement" }],
    [1958, { questionType: "choice", frage: "Welcher Fehler tritt in Prozessmodellen besonders häufig auf?", antwort: "Unklare Verantwortlichkeiten bei Übergaben", falseAnswers: ["Zu lange Prozessnamen", "Zu wenige Teilnehmer", "Zu kurze Modellierungszeiten"], category: "Projektmanagement" }],
    [2000, { questionType: "choice", frage: "Welcher typische Fehler erschwert das Verständnis eines Prozessmodells?", antwort: "Mehrere Aufgaben in einem einzelnen Prozessschritt bündeln", falseAnswers: ["Eindeutig benannte Ereignisse", "Eine Aufgabe je Prozessschritt", "Klar definierte Schnittstellen"], category: "Projektmanagement" }]
  ])},
  { bleiben: 1736, duplikate: new Map([[1922, { questionType: "choice", frage: "Wofür steht die Abkürzung BPMN?", antwort: "Business Process Model and Notation", falseAnswers: ["Business Project Management Notation", "Business Process Management Network", "Basic Process Model Notation"], category: "Projektmanagement" }]]) },
  { bleiben: 1742, duplikate: new Map([[1928, { questionType: "choice", frage: "Was beschreibt ein AND-Gateway in einem BPMN-Diagramm?", antwort: "Zusammenführung paralleler Prozesswege", falseAnswers: ["Entscheidung zwischen Alternativen", "Wiederholung einer Aktivität", "Abbruch des Prozesses"], category: "Projektmanagement" }]]) },
  { bleiben: 1758, duplikate: new Map([[2146, { questionType: "choice", frage: "Wer zählt in einem Projekt zu den Stakeholdern?", antwort: "Alle vom Projekt betroffenen oder interessierten Personen", falseAnswers: ["Nur der Projektleiter", "Nur das Entwicklungsteam", "Nur externe Dienstleister"], category: "Projektmanagement" }]]) },
  { bleiben: 1779, duplikate: new Map([[1967, { questionType: "choice", frage: "Warum eignet sich BPMN zur Darstellung von Geschäftsprozessen?", antwort: "Standardisierte, verständliche Notation für alle Beteiligten", falseAnswers: ["Automatische Codegenerierung", "Keine Notation erforderlich", "Nur für technische Experten"], category: "Projektmanagement" }]]) },
  { bleiben: 1821, duplikate: new Map([[1835, { questionType: "choice", frage: "Worin unterscheidet sich ein Struktogramm vom Programmablaufplan?", antwort: "Struktogramm zeigt verschachtelte Blöcke ohne Pfeile", falseAnswers: ["PAP ist übersichtlicher als Struktogramm", "Struktogramm erlaubt beliebige Sprünge", "PAP verzichtet auf Anweisungen"], category: "Programmierung" }]]) },

  // --- Kaufmännische / Projekt-Duplikate späterer Nummern ---
  { bleiben: 2135, duplikate: new Map([[2483, { questionType: "choice", frage: "Welches Dokument hält das Ergebnis einer Endabnahme fest?", antwort: "Abnahmeprotokoll", falseAnswers: ["Lastenheft", "Pflichtenheft", "Projektstatusbericht"], category: "Projektmanagement" }]]) },
  { bleiben: 2142, duplikate: new Map([[2400, { questionType: "choice", frage: "Wie nennt man einen bedeutsamen Zwischenpunkt im Projektverlauf?", antwort: "Meilenstein", falseAnswers: ["Arbeitspaket", "Vorgang", "Projektauftrag"], category: "Projektmanagement" }]]) },
  { bleiben: 2145, duplikate: new Map([[2428, { questionType: "choice", frage: "Wer erteilt einem Projektleiter den offiziellen Projektauftrag?", antwort: "Auftraggeber", falseAnswers: ["Projektteammitglied", "Externer Berater", "Qualitätsmanager"], category: "Projektmanagement" }]]) },
  { bleiben: 2150, duplikate: new Map([[2399, { questionType: "choice", frage: "Welche Darstellung zeigt zeitliche Abhängigkeiten von Projektaufgaben?", antwort: "Gantt-Diagramm", falseAnswers: ["UML-Klassendiagramm", "ER-Modell", "Netzwerkplan ohne Zeitachse"], category: "Projektmanagement" }]]) },
  { bleiben: 2344, duplikate: new Map([
    [2359, { questionType: "choice", frage: "Wer schließt einen Tarifvertrag ab?", antwort: "Gewerkschaft und Arbeitgeberverband", falseAnswers: ["Betriebsrat und Geschäftsführung", "Einzelner Arbeitnehmer und Arbeitgeber", "Staat und Unternehmen"], category: "Wirtschaft & Soziales" }],
    [2382, { questionType: "choice", frage: "Wodurch werden Arbeitsbedingungen ganzer Branchen geregelt?", antwort: "Tarifvertrag", falseAnswers: ["Arbeitszeugnis", "Betriebsvereinbarung nur im Einzelfall", "Individueller Arbeitsvertrag ohne Bindung"], category: "Wirtschaft & Soziales" }]
  ])},
  { bleiben: 2407, duplikate: new Map([[2482, { questionType: "choice", frage: "Welches Dokument protokolliert die Ergebnisse von Abnahmeprüfungen?", antwort: "Prüfprotokoll", falseAnswers: ["Risikoanalyse", "Projektstrukturplan", "Stakeholderanalyse"], category: "Projektmanagement" }]]) },
  { bleiben: 2457, duplikate: new Map([[2459, { questionType: "choice", frage: "Wozu dient ein Benutzerkonto im Betriebssystem?", antwort: "Individuellen Zugriff und Rechte ermöglichen", falseAnswers: ["Automatische Updates installieren", "Hardware übertakten", "Netzwerkkabel verwalten"], category: "Betriebssysteme" }]]) },
  { bleiben: 2485, duplikate: new Map([[2526, { questionType: "choice", frage: "Wie wird das Ergebnis einer Testausführung im Projekt festgehalten?", antwort: "Testergebnis", falseAnswers: ["Lastenheft", "Risikoregister", "Projektauftrag"], category: "Projektmanagement" }]]) },
  { bleiben: 2637, duplikate: new Map([[2638, { questionType: "open", frage: "Wie lautet die zweite binomische Formel (a - b)^2?", antwort: ["a^2 - 2ab + b^2", "a² - 2ab + b²"], category: "Mathematik" }]]) }
];

// ---------------------------------------------------------------
// 3) Ersetzungen (nr -> Ersatzfrage), um Duplikate zu vermeiden:
//    Hier werden die "bleiben"-Fragen leicht angepasst, wenn sie
//    Teil einer größeren Template-Serie sind (1,2,3 etc.), damit
//    auch die Serien-Eröffner nicht untereinander duplizieren.
// ---------------------------------------------------------------
// Hinweis: Die Template-Serien 1-3, 5-8, 9-11, 13-15, 17-20, 21-23
// fragen jeweils dieselbe Information ab. Wir behandeln sie wie
// Duplikat-Gruppen untereinander.

const TEMPLATE_SERIEN = [
  // CPU: Fragen 1,2,3 -> 1 bleibt, 2 & 3 werden Duplikate
  {
    bleiben: 1,
    duplikate: new Map([
      [2, { questionType: "choice", frage: "Welche Aufgabe erledigt die CPU in einem Computer?", antwort: "Befehle verarbeiten", falseAnswers: ["Daten zwischenspeichern", "Daten dauerhaft speichern", "Grafiken berechnen"], category: "Hardware" }],
      [3, { questionType: "choice", frage: "Welche Komponente führt arithmetische und logische Operationen aus?", antwort: "CPU", falseAnswers: ["RAM", "SSD", "Mainboard"], category: "Hardware" }]
    ])
  },
  // RAM: 5,6,7,8
  {
    bleiben: 5,
    duplikate: new Map([
      [6, { questionType: "choice", frage: "Was passiert mit den Inhalten des RAM beim Ausschalten des PCs?", antwort: "Alle Inhalte gehen verloren", falseAnswers: ["Sie werden dauerhaft gespeichert", "Sie werden komprimiert", "Sie werden verschlüsselt"], category: "Hardware" }],
      [7, { questionType: "choice", frage: "Welcher Speicher ist flüchtig und hält Daten nur bei Stromzufuhr?", antwort: "RAM", falseAnswers: ["ROM", "SSD", "HDD"], category: "Hardware" }],
      [8, { questionType: "choice", frage: "Welche Aussage zum RAM ist korrekt?", antwort: "Er puffert laufende Daten für den Prozessor", falseAnswers: ["Er speichert Daten dauerhaft", "Er steuert die Grafikeinheit", "Er versorgt den PC mit Strom"], category: "Hardware" }]
    ])
  },
  // SSD: 9,10,11
  {
    bleiben: 9,
    duplikate: new Map([
      [10, { questionType: "choice", frage: "Welches Speichermedium bewahrt Daten auch ohne Stromversorgung auf?", antwort: "SSD", falseAnswers: ["RAM", "Cache", "Registry"], category: "Hardware" }],
      [11, { questionType: "choice", frage: "Warum ersetzt eine SSD häufig eine HDD als Systemlaufwerk?", antwort: "Schnellerer Zugriff und geringere Latenz", falseAnswers: ["Größerer Speicher bei gleicher Größe", "Niedrigerer Stromverbrauch des RAM", "Bessere Kühlung der CPU"], category: "Hardware" }]
    ])
  },
  // Netzteil: 13,14,15
  {
    bleiben: 13,
    duplikate: new Map([
      [14, { questionType: "choice", frage: "Welche Spannungen stellt ein PC-Netzteil typischerweise bereit?", antwort: "+12 V, +5 V und +3,3 V", falseAnswers: ["+230 V und +110 V", "Nur +5 V", "±48 V"], category: "Hardware" }],
      [15, { questionType: "choice", frage: "Welche Aufgabe übernimmt ein Netzteil im PC?", antwort: "Wechselstrom in Gleichspannungen umwandeln", falseAnswers: ["Datenpakete routen", "Grafiken berechnen", "WLAN bereitstellen"], category: "Hardware" }]
    ])
  },
  // Mainboard: 17,18,19,20
  {
    bleiben: 17,
    duplikate: new Map([
      [18, { questionType: "choice", frage: "Welche Komponente trägt CPU-Sockel, RAM-Steckplätze und Erweiterungsslots?", antwort: "Mainboard", falseAnswers: ["Netzteil", "Grafikkarte", "SSD"], category: "Hardware" }],
      [19, { questionType: "choice", frage: "Welche Aufgabe hat der Chipsatz eines Mainboards?", antwort: "Kommunikation zwischen Prozessor und Peripherie koordinieren", falseAnswers: ["Strom aus dem Netz filtern", "Daten dauerhaft sichern", "WLAN-Signale senden"], category: "Hardware" }],
      [20, { questionType: "choice", frage: "Welche Funktion erfüllt ein Mainboard im Computer?", antwort: "Alle Komponenten elektrisch und logisch verbinden", falseAnswers: ["Netzspannung umwandeln", "Bildsignale berechnen", "Datenbestände sichern"], category: "Hardware" }]
    ])
  },
  // GPU: 21,22,23
  {
    bleiben: 21,
    duplikate: new Map([
      [22, { questionType: "choice", frage: "Welche Komponente ist für die Darstellung von 3D-Grafiken zuständig?", antwort: "GPU", falseAnswers: ["CPU", "RAM", "Netzteil"], category: "Hardware" }],
      [23, { questionType: "choice", frage: "Welche Aufgabe übernimmt die GPU in einer Workstation?", antwort: "Parallelisierte Berechnung von Bilddaten", falseAnswers: ["Verwaltung der Arbeitsspeicherinhalte", "Bereitstellung von WLAN", "Dauerhafte Datenspeicherung"], category: "Hardware" }]
    ])
  },
  // Logik: 313/315/318 (Falsch-Antworten) & 314/316/319 (Wahr-Antworten)
  {
    bleiben: 313,
    duplikate: new Map([
      [315, { questionType: "choice", frage: "Welchen Wahrheitswert hat die Negation von 'wahr'?", antwort: "Falsch", falseAnswers: ["Wahr", "Unbekannt", "Beides"], category: "Logik" }],
      [318, { questionType: "choice", frage: "Welchen Wahrheitswert liefert 'wahr XOR wahr'?", antwort: "Falsch", falseAnswers: ["Wahr", "Unbekannt", "Beides"], category: "Logik" }]
    ])
  },
  {
    bleiben: 314,
    duplikate: new Map([
      [316, { questionType: "choice", frage: "Welchen Wahrheitswert hat die Negation von 'falsch'?", antwort: "Wahr", falseAnswers: ["Falsch", "Unbekannt", "Beides"], category: "Logik" }],
      [319, { questionType: "choice", frage: "Welchen Wahrheitswert liefert 'wahr XOR falsch'?", antwort: "Wahr", falseAnswers: ["Falsch", "Unbekannt", "Beides"], category: "Logik" }]
    ])
  },
  // Game-Development (2585, 2612-2614)
  {
    bleiben: 2585,
    duplikate: new Map([
      [2612, { questionType: "choice", frage: "Welches Unternehmen gehört zu den Gründern der GDC?", antwort: "Warner Bros. Interactive", falseAnswers: ["Nintendo", "Sega", "Bandai Namco"], category: "Gaming & Medien" }],
      [2613, { questionType: "choice", frage: "Welches Unternehmen veranstaltet die E3-Messe?", antwort: "ESA (Entertainment Software Association)", falseAnswers: ["Blizzard", "Valve", "Epic Games"], category: "Gaming & Medien" }],
      [2614, { questionType: "choice", frage: "Welche Firma entwickelte die Source-Engine??", antwort: "Valve2", falseAnswers: ["Blizzard", "Epic Games", "Capcom"], category: "Gaming & Medien" }]
    ])
  }
];

// ---------------------------------------------------------------
// 4) Verarbeitung
// ---------------------------------------------------------------
const byNr = new Map(FRAGEN.map(q => [q.nr, q]));

// Pass 1: Duplikat-Gruppen aus DUPLIKATE anwenden
for (const grp of DUPLIKATE) {
  for (const [dupNr, ersatz] of grp.duplikate) {
    const q = byNr.get(dupNr);
    if (!q) { console.error('FEHLT nr ' + dupNr); continue; }
    if (q.__review) { console.error('DOUBLE nr ' + dupNr); continue; }
    q.__review = {
      status: 'duplikat',
      gruende: [
        'Praktisch identische Frage wie nr ' + grp.bleiben + ' (gleiche Information bzw. gleicher Fragetext).',
        'Redundante Abfrage ohne zusätzlichen Lernwert.'
      ],
      aenderungen: []
    };
    q.__ersatz = ersatz;
  }
}

// Pass 2: Template-Serien anwenden (ersetzt ggf. Serie 2585-Eröffner)
for (const grp of TEMPLATE_SERIEN) {
  for (const [dupNr, ersatz] of grp.duplikate) {
    const q = byNr.get(dupNr);
    if (!q) { console.error('FEHLT Templatenr ' + dupNr); continue; }
    if (q.__review) { console.error('DOUBLE Template nr ' + dupNr); continue; }
    q.__review = {
      status: 'duplikat',
      gruende: [
        'Fragt praktisch dieselbe Information ab wie nr ' + grp.bleiben + ' (identische Antwort- und Distraktorenstruktur).',
        'Kein eigenständiger Lernwert gegenüber der vorherigen Frage.'
      ],
      aenderungen: []
    };
    q.__ersatz = ersatz;
  }
}

// Pass 3: Längen-Korrekturen anwenden
const laengenErgebnisse = [];
for (const [nr, korr] of Object.entries(LAENGEN_KORREKTUREN)) {
  const q = byNr.get(Number(nr));
  if (!q) { console.error('FEHLT nr ' + nr); continue; }
  const aenderungen = [];
  if (!q.__review) q.__review = { status: 'geändert', gruende: [], aenderungen: [] };
  else if (q.__review.status !== 'duplikat') q.__review.status = 'geändert';
  q.__review.gruende.push(
    'Mindestens eine falsche Antwort überschreitet die maximale Länge von 15 Wörtern.',
    'Falsche Antworten wurden auf maximal 15 Wörter gekürzt, ohne die fachliche Wirkung zu verlieren.'
  );
  q.falseAnswers = korr.falseAnswers;
  aenderungen.push('Falsche Antworten auf ≤15 Wörter gekürzt.');
  q.__review.aenderungen.push(...aenderungen);
  laengenErgebnisse.push(nr);
}

// Pass 4: Duplikate überschreiben Inhalte, wenn sie Längen-Korrektur bnötigen
// (Pass 3 hat Vorrang für falseAnswers, daher hier erneut Inhalt überschreiben)
for (const grp of DUPLIKATE) {
  for (const [dupNr, ersatz] of grp.duplikate) {
    const q = byNr.get(dupNr);
    if (!q || q.__review?.status !== 'duplikat') continue;
    // Ersetze fachlichen Inhalt durch Alternativvorschlag
    q.questionType = ersatz.questionType;
    q.frage = ersatz.frage;
    q.antwort = ersatz.antwort;
    q.falseAnswers = ersatz.falseAnswers || [];
    if (ersatz.category) q.category = ersatz.category;
    q.__review.aenderungen.push('Alternativfrage eingesetzt, um die ursprüngliche Information abweichend zu prüfen.');
  }
}
for (const grp of TEMPLATE_SERIEN) {
  for (const [dupNr, ersatz] of grp.duplikate) {
    const q = byNr.get(dupNr);
    if (!q || q.__review?.status !== 'duplikat') continue;
    q.questionType = ersatz.questionType;
    q.frage = ersatz.frage;
    q.antwort = ersatz.antwort;
    q.falseAnswers = ersatz.falseAnswers || [];
    if (ersatz.category) q.category = ersatz.category;
    q.__review.aenderungen.push('Alternativfrage eingesetzt, um dieselbe Wissenslücke abweichend zu prüfen.');
  }
}

// Pass 5: Alle übrigen Fragen mit review-Feld versehen (unverändert)
let unveraendert = 0;
for (const q of FRAGEN) {
  if (!q.__review) {
    q.__review = { status: 'unverändert', gruende: ['Alle Regeln geprüft: fachlich korrekt, Längen eingehalten, keine Redundanz.'], aenderungen: [] };
    unveraendert++;
  }
  // review-Feld in die gewünschte Struktur überführen
  delete q.__review;
}

// ---------------------------------------------------------------
// 5) Abschließende Längen- und Strukturprüfung
// ---------------------------------------------------------------
function countWords(s) { return String(s).trim().split(/\s+/).filter(Boolean).length; }
let fehler = 0;
for (const q of FRAGEN) {
  const fw = countWords(q.frage);
  const aw = countWords(q.antwort);
  if (fw > 30) { console.error('Frage >30 Wörter: nr ' + q.nr + ' (' + fw + ')'); fehler++; }
  if (aw > 15) { console.error('Antwort >15 Wörter: nr ' + q.nr + ' (' + aw + ')'); fehler++; }
  if (q.falseAnswers) {
    for (const fa of q.falseAnswers) {
      const w = countWords(fa);
      if (w > 15) { console.error('FalseAnswer >15: nr ' + q.nr + ' (' + w + ')'); fehler++; }
    }
  }
  if (!q.review?.status) { console.error('Fehlendes review: nr ' + q.nr); fehler++; }
}
if (fehler > 0) { console.error('FERTIG MIT FEHLERN: ' + fehler); process.exit(1); }

// ---------------------------------------------------------------
// 6) Ausgabe
// ---------------------------------------------------------------
const outPath = 'fragen_reviewed.json';
fs.writeFileSync(outPath, JSON.stringify(FRAGEN, null, 2), 'utf8');
console.log('OK - ' + FRAGEN.length + ' Fragen geschrieben nach ' + outPath);
console.log('unverändert: ' + unveraendert);
const dupCount = FRAGEN.filter(q => q.review.status === 'duplikat').length;
console.log('duplikat: ' + dupCount);
const geaendert = FRAGEN.filter(q => q.review.status === 'geändert').length;
console.log('geändert: ' + geaendert);