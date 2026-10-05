# Cheatsheets

Eine schlichte, schnelle und barrierearme Sammlung von Cheatsheets für Linux,
Windows, Netzwerk, Datenbanken, Container und mehr. Ohne externe Abhängigkeiten,
komplett statisch.

## Aufbau

```
.
├── index.html                # Grundgerüst der Seite
├── assets/
│   ├── style.css             # Layout & Farbschema (hell/dunkel)
│   ├── theme.js              # Farbschema früh setzen (kein Aufflackern)
│   ├── app.js                # Laden, Navigation, Filter, Kopieren, Theme
│   └── icons/                # Favicon & App-Icons (SVG + PNG)
├── cheatsheets/
│   ├── config.json           # Kategorien, Titel, Beschreibungen, Abschnitte
│   └── *.html                # Ein Fragment (nur <section>/<table>) je Cheatsheet
├── manifest.webmanifest      # Web-App-Manifest (Name, Farben, Icons)
├── CHANGELOG.md              # Änderungsprotokoll
├── CONTRIBUTING.md           # Anleitung für Beitragende
└── LICENSE                   # GNU GPL v3
```

## Starten

Die Seite lädt die Cheatsheets per `fetch`, daher wird ein Webserver benötigt
(nicht per `file://` öffnen):

```bash
python3 -m http.server 8000
# danach http://localhost:8000 im Browser öffnen
```

## Funktionen

- **Startseite**: Beim Aufruf ohne `?s=…` erscheint eine Übersicht mit allen
  Kategorien und Cheatsheets als Links. Ein einzelnes Cheatsheet wird über
  `?s=<id>` geladen; jedes Cheatsheet verlinkt oben zurück zur Übersicht und
  zeigt Sprungmarken zu seinen Abschnitten.
- **Einheitlich**: Alle Cheatsheets folgen demselben HTML-Muster (Abschnitte mit
  Tabellen aus zwei Spalten: Befehl/Kürzel und Beschreibung).
- **Suche & Filter**: Cheatsheets in der Seitenleiste durchsuchen; innerhalb eines
  Cheatsheets mit der Taste `/` filtern.
- **Kopieren**: Jeder Befehl lässt sich per Knopf in die Zwischenablage kopieren.
- **Hell/Dunkel**: Folgt dem System, umschaltbar und gespeichert.
- **Barrierefrei**: Tastaturbedienung, sichtbarer Fokus, Sprunglink, ARIA-Labels,
  ausreichende Kontraste, `prefers-reduced-motion`, mobile Kartenansicht, Druck-Layout.
- **Sicher**: Strikte Content-Security-Policy, keine externen Ressourcen,
  nachgeladene Cheatsheet-Inhalte werden über eine Allowlist bereinigt (Schutz
  vor eingeschleustem HTML/JS).

## Neues Cheatsheet hinzufügen

1. HTML-Fragment unter `cheatsheets/<id>.html` anlegen. Muster:

   ```html
   <section id="abschnitt-id">
     <h2>Abschnittstitel</h2>
     <table>
       <thead><tr><th>Befehl</th><th>Beschreibung</th></tr></thead>
       <tbody>
         <tr><td><code>befehl</code></td><td>Beschreibung</td></tr>
       </tbody>
     </table>
   </section>
   ```

   Erlaubt sind u. a. `section, h2, h3, p, table, tr, th, td, code, kbd, strong,
   em, ul, ol, li, a`. Für Hinweise `<p class="note">` bzw. `<p class="warn">`,
   für Tastenkürzel `<kbd>`, für kleine Marker `<span class="tag">`.

2. In `cheatsheets/config.json` unter der passenden Kategorie eintragen
   (`id`, `title`, `description`, `file`, `sections`). Die `id` und die
   `sections[].id` müssen aus `[a-z0-9-]` bestehen.

3. Fertig – das Cheatsheet erscheint automatisch in der Navigation.

Ausführliche Regeln (Stil, Tests, Pull Requests) stehen in
[CONTRIBUTING.md](CONTRIBUTING.md).

## Mitmachen & Änderungen

- Beiträge sind willkommen – siehe [CONTRIBUTING.md](CONTRIBUTING.md).
- Alle Änderungen werden in [CHANGELOG.md](CHANGELOG.md) dokumentiert.

## Lizenz

Copyright (C) 2026 listiges-kaenguru

Dieses Projekt steht unter der
[GNU General Public License v3.0](LICENSE). Du darfst es verwenden, verändern
und weitergeben – auch kommerziell –, solange abgeleitete Werke ebenfalls unter
der GPLv3 veröffentlicht werden und der Quellcode verfügbar bleibt.
