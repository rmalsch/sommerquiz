# Sommerquiz Website

Dieses Projekt ist eine statische, modulare Sommerquiz-Website für GitHub Pages.

## Enthalten
- öffentliche Startseite mit Countdown, Passwortzugang und Verweis auf das Passwort-Rätsel
- öffentliche Rätselseite mit sechs sequenziellen Spielen und sechs freispielbaren Passwortbuchstaben
- Navigation, die sich nach Passwortfreigabe erweitert
- getrennte Seiten für News, Blog, Galerie/Chronik, RSVP, Mitbringen, Themen/Spiele, Newsletter, Keine Teamabstimmung und FAQ
- zentrale Daten-Dateien für Inhalte
- Formulare mit Google-Apps-Script-Anbindung
- sichtbare Live-Bereiche für RSVP-Counter und Mitbringen-Liste

## Zentrale Konfiguration
1. `assets/data/site-config.js` enthält Branding, Eventdatum, Passwort, Navigation, Introtext und Footer-Hinweis.
2. `assets/data/forms.js` enthält die Google-Apps-Script-`/exec`-URL, Formular-Modi, Remote-Formtypen und Meldungstexte.

Der aktuelle Ablauf in `raetsel.html` erwartet ein Passwort mit genau sechs Zeichen. Die Buchstaben werden direkt aus `accessPassword` in `assets/data/site-config.js` übernommen.

## Inhalte pflegen
- News: `assets/data/news.js`
- Blog: `assets/data/blog.js`
- Chronik: `assets/data/gallery.js`
- FAQ: `assets/data/faq.js`

## Formulare
Die Formularlogik im Frontend liegt in `assets/js/forms.js`.
Die Live-Daten für RSVP-Counter und Mitbringen-Liste werden in `assets/js/live-data.js` geladen.

Erwartete Formulararten:
- `rsvp`
- `bring`
- `games`
- `newsletter`
- `team_profiles`
- `faq_questions`

## Google Apps Script
Das Apps Script liegt in `google-apps-script/Code.gs`.

Erwartete Sheet-Namen:
- `rsvp`
- `bring`
- `games`
- `newsletter`
- `team_profiles`
- `faq_questions`

`team_profiles` erwartet die Spalten: Name, classic_knowledge, recognition, estimation_curiosity, patterns_puzzling, clue_combination, fine_motor_skills, movement_coordination, explain_coordinate, motivate_perform, Zeitstempel.
`faq_questions` erwartet die Spalten: Zeitstempel, Name, Frage.

Die Website sendet Formularwerte an die in `assets/data/forms.js` konfigurierte `/exec`-URL. Live-Auswertungen werden per JSONP über `doGet` geladen.

## GitHub Pages
Die Website ist bewusst ohne Framework gebaut und kann als statische Seite über GitHub Pages veröffentlicht werden.
