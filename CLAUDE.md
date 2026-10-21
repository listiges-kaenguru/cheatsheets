# Cheatsheets – Hinweise für Claude

Statische Sammlung von Cheatsheets (Vanilla JS, kein Build), live unter <https://cheatsheets.schmaralde.de/>
(statisches Hosting, Upload von Hand).

## Orientierung

- `README.md` – Aufbau, Starten, Funktionen, neues Cheatsheet hinzufügen
- `CHANGELOG.md` – Änderungen je Version; jede inhaltliche Änderung unter `## [Unveröffentlicht]` eintragen
- `IDEEN.md` – ToDo und Ideen; Erledigtes ins CHANGELOG
- `CONTRIBUTING.md` – **Stilregeln** für Cheatsheets (erlaubte Elemente, IDs, Platzhalter), Release-Ablauf
- `backup/` ist eine lokale Sicherung (per `.gitignore` ausgeschlossen) – nicht anfassen.

## Regeln

- Beschreibungen auf Deutsch, kurz und sachlich; Befehle und Fachbegriffe im Original.
- Neue Cheatsheets: Fragment `cheatsheets/<id>.html` plus Eintrag in `cheatsheets/config.json`; `sections[].id`
  müssen exakt den `<section id>` entsprechen. Nur die erlaubten Elemente aus `CONTRIBUTING.md` verwenden.
- Keine externen Ressourcen (CDNs, Webfonts, Tracker), strikte CSP.
- Gefährliche Befehle mit `<p class="warn">` kennzeichnen, Befehle möglichst vorher ausprobieren.
- Neue Entwicklungsdateien in `.gitattributes` als `export-ignore` eintragen (Release-ZIP nur mit Benötigtem).
- Testen in einem Container: Syntax, JSON, lokale Links und `tests/run.sh` (Browsertest mit Playwright, `PW` zeigt
  auf dessen `package.json`), dann `python3 -m http.server 8000` und im Browser
  hell/dunkel, 1366 und 390 px, keine Konsolenfehler.
