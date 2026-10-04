# Changelog

Alle nennenswerten Änderungen an diesem Projekt werden in dieser Datei
dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.1.0/),
die Versionierung folgt [Semantic Versioning](https://semver.org/lang/de/).

## [Unveröffentlicht]

## [1.0.0] – 2026-10-04

Erste öffentliche Version auf GitHub.

### Hinzugefügt

- Startseite mit Übersicht aller Kategorien und Cheatsheets; einzelne
  Cheatsheets über `?s=<id>` mit Sprungmarken zu den Abschnitten.
- Suche in der Seitenleiste, Filter innerhalb eines Cheatsheets (Taste `/`),
  Kopier-Knopf für jeden Befehl.
- Hell-/Dunkel-Modus (folgt dem System, umschaltbar, gespeichert) ohne
  Aufflackern beim Laden.
- Barrierefreiheit: Tastaturbedienung, sichtbarer Fokus, Sprunglink,
  ARIA-Labels, `prefers-reduced-motion`, mobile Kartenansicht, Druck-Layout.
- Strikte Content-Security-Policy und Allowlist-Bereinigung der nachgeladenen
  Cheatsheet-Inhalte.
- Neue Cheatsheets: Chocolatey, DNF, GPG, jq, keytool, kubectl,
  Linux-Grundlagen, Markdown, MySQL, Netzwerk, Nmap, OpenSSL, PostgreSQL,
  SQLite, tmux, winget.
- Lizenz GPLv3, Anleitung für Beitragende (`CONTRIBUTING.md`) und dieses
  Changelog.

### Geändert

- Alle Cheatsheets auf ein einheitliches HTML-Muster umgestellt (Abschnitte
  mit zweispaltigen Tabellen) und zentral in `cheatsheets/config.json`
  registriert.
- Code aufgeteilt in `assets/style.css`, `assets/theme.js` und `assets/app.js`
  (ersetzt `cheatsheet-manager.js`).

[Unveröffentlicht]: https://github.com/listiges-kaenguru/cheatsheets/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/listiges-kaenguru/cheatsheets/releases/tag/v1.0.0
