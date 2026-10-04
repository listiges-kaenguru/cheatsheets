# Mitmachen

Danke, dass du zu den Cheatsheets beitragen möchtest! Korrekturen, neue
Befehle und ganz neue Cheatsheets sind willkommen.

## Fehler melden & Ideen einbringen

- Öffne ein [Issue](https://github.com/listiges-kaenguru/cheatsheets/issues).
- Beschreibe kurz, **welches Cheatsheet** und **welcher Eintrag** betroffen ist,
  was falsch ist und wie es richtig wäre (gern mit Quelle, z. B. Manpage oder
  offizielle Doku).
- Bei Darstellungsfehlern: Browser, Betriebssystem und ggf. einen Screenshot
  angeben.

## Änderungen einreichen (Pull Request)

1. Repository forken und klonen:

   ```bash
   git clone https://github.com/<dein-name>/cheatsheets.git
   cd cheatsheets
   ```

2. Einen Branch mit sprechendem Namen anlegen:

   ```bash
   git switch -c cheatsheet/helm      # neues Cheatsheet
   git switch -c fix/git-rebase       # Korrektur
   ```

3. Änderungen vornehmen und lokal prüfen (siehe unten).
4. Einen Eintrag in [`CHANGELOG.md`](CHANGELOG.md) unter
   **`## [Unveröffentlicht]`** ergänzen (siehe [Changelog pflegen](#changelog-pflegen)).
5. Committen, pushen und einen Pull Request gegen `main` öffnen. Beschreibe im
   PR, was du geändert hast und warum.

## Lokal testen

Die Seite lädt die Cheatsheets per `fetch`, daher wird ein Webserver benötigt:

```bash
python3 -m http.server 8000
# http://localhost:8000 öffnen
```

Prüfe vor dem Pull Request:

- Das Cheatsheet erscheint in der Navigation und lädt ohne Fehler in der
  Browser-Konsole.
- Sprungmarken zu den Abschnitten funktionieren.
- Hell- und Dunkelmodus sowie die mobile Ansicht sehen ordentlich aus.
- `cheatsheets/config.json` ist gültiges JSON, z. B.:
  `python3 -m json.tool cheatsheets/config.json > /dev/null`

## Ein neues Cheatsheet anlegen

1. Fragment unter `cheatsheets/<id>.html` anlegen. Es enthält **nur**
   `<section>`-Blöcke – kein `<html>`, `<head>`, `<script>` oder `<style>`:

   ```html
   <section id="helm-grundlagen">
     <h2>Grundlagen</h2>
     <table>
       <thead><tr><th>Befehl</th><th>Beschreibung</th></tr></thead>
       <tbody>
         <tr><td><code>helm list</code></td><td>Installierte Releases anzeigen</td></tr>
       </tbody>
     </table>
   </section>
   ```

2. In `cheatsheets/config.json` unter der passenden Kategorie eintragen:

   ```json
   {
     "id": "helm",
     "title": "Helm",
     "description": "Paketmanager für Kubernetes: Charts, Releases, Repositories.",
     "file": "helm.html",
     "sections": [
       { "id": "helm-grundlagen", "title": "Grundlagen" }
     ]
   }
   ```

   Die `sections[].id` müssen exakt den `id`-Attributen der `<section>`-Blöcke
   entsprechen.

## Stilregeln

- **Sprache**: Beschreibungen auf Deutsch, kurz und sachlich. Befehle,
  Optionen und Fachbegriffe bleiben im Original.
- **IDs**: nur Kleinbuchstaben, Ziffern und Bindestriche (`[a-z0-9-]`).
  Abschnitts-IDs mit der Cheatsheet-ID als Präfix (`helm-grundlagen`).
- **Tabellen**: immer zwei Spalten – Befehl/Kürzel und Beschreibung.
- **Erlaubte Elemente**: `section, h2, h3, p, table, thead, tbody, tr, th, td,
  code, kbd, strong, em, ul, ol, li, a`. Andere Elemente werden beim Laden entfernt (nur ihr Text bleibt stehen).
- **Auszeichnungen**: `<p class="note">` für Hinweise, `<p class="warn">` für
  Warnungen (z. B. destruktive Befehle), `<kbd>` für Tastenkürzel,
  `<span class="tag">` für kleine Marker.
- **Platzhalter** in Befehlen in spitzen Klammern, HTML-maskiert:
  `<code>ssh &lt;user&gt;@&lt;host&gt;</code>`.
- **Keine externen Ressourcen**: keine CDNs, Webfonts, Tracker oder
  eingebetteten Skripte. Die Content-Security-Policy würde sie ohnehin blockieren.
- **Korrektheit**: Befehle möglichst vorher ausprobieren. Gefährliche Befehle
  (`rm -rf`, `DROP`, `--force` …) mit `<p class="warn">` kennzeichnen.

## Changelog pflegen

Jede inhaltliche Änderung bekommt einen Eintrag in [`CHANGELOG.md`](CHANGELOG.md)
unter `## [Unveröffentlicht]`, einsortiert in eine dieser Rubriken:

- `### Hinzugefügt` – neue Cheatsheets, Abschnitte oder Funktionen
- `### Geändert` – Überarbeitungen bestehender Inhalte oder Funktionen
- `### Behoben` – Fehlerkorrekturen (falsche Befehle, Darstellungsfehler)
- `### Entfernt` – entfernte Inhalte oder Funktionen
- `### Sicherheit` – sicherheitsrelevante Änderungen

Beispiel:

```markdown
## [Unveröffentlicht]

### Hinzugefügt

- Cheatsheet Helm.

### Behoben

- Git: Option von `git rebase --onto` korrigiert.
```

Bei einem Release wird `[Unveröffentlicht]` in eine Versionsnummer mit Datum
umbenannt (z. B. `## [1.1.0] – 2026-11-01`), darüber ein neuer leerer
`[Unveröffentlicht]`-Abschnitt angelegt und der Release mit `git tag v1.1.0`
markiert. Versionen nach [Semantic Versioning](https://semver.org/lang/de/):
neue Cheatsheets/Funktionen → Minor, Korrekturen → Patch.

## Lizenz

Mit deinem Beitrag erklärst du dich einverstanden, dass er unter der
[GNU General Public License v3.0](LICENSE) veröffentlicht wird.
