// Browsertest: präparierte URL-Parameter (?s=, #anker) und Suchfelder dürfen keinen Code einschleusen oder die Seite
// zum Absturz bringen. Läuft in der Testumgebung (Playwright und Chromium aus dem Image, Pfad in $PW); tests/run.sh
// startet den Webserver.
import { createRequire } from 'node:module';

if (!process.env.PW) { console.error('$PW fehlt – in der Testumgebung ausführen: ~/projects/testumgebung/pt test'); process.exit(2); }
const { chromium } = createRequire(process.env.PW)('playwright');
const URL = process.env.APP_URL || 'http://localhost:8090/';

let failed = 0;
const check = (name, ok, info = '') => { console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${ok ? '' : ' ' + info}`); if (!ok) failed++; };

const browser = await chromium.launch();
const page = await browser.newPage();
const errors = [];
const fremd = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('dialog', (d) => { errors.push('Dialog: ' + d.message()); d.dismiss(); });
await page.route(/^https?:\/\/(?!localhost[:/])/, (r) => { fremd.push(r.request().url()); r.abort(); });

const XSS = '<img src=x onerror="window.__xss=1"><script>window.__xss=1</script>';
const sauber = async () => page.evaluate(() => window.__xss === undefined && !document.querySelector('img[src="x"], main script'));
async function oeffne(suffix) {
  errors.length = 0;
  await page.goto(URL + suffix);
  await page.waitForSelector('#content h1');
  await page.waitForTimeout(100);
}

// Normalfall
await oeffne('');
check('Übersicht lädt', (await page.textContent('#content h1')) === 'Cheatsheets');
await oeffne('?s=apt');
check('Sheet über ?s= lädt', (await page.title()).length > 0 && (await page.$$('#content table, #content tr')).length > 0);

// Präparierte Parameter
for (const s of [encodeURIComponent(XSS), '..%2F..%2Fimpressum', 'javascript:alert(1)', '%00', 'apt%22%3E%3Cimg%20src%3Dx%3E', 'x'.repeat(5000), '__proto__', 'constructor']) {
  await oeffne(`?s=${s}`);
  const titel = await page.textContent('#content h1');
  check(`?s=${decodeURIComponent(s).slice(0, 30)}: Übersicht statt Fehler`, titel === 'Cheatsheets' && errors.length === 0, `${titel} ${errors.join(' | ')}`);
  check(`?s=${decodeURIComponent(s).slice(0, 30)}: kein eingeschleuster Code`, await sauber());
}
for (const h of [encodeURIComponent(XSS), '%E0%A4%A', '%', '%%', 'x'.repeat(5000), '"><img src=x onerror=alert(1)>']) {
  await oeffne(`?s=apt#${h}`);
  check(`#${h.slice(0, 20)}: Sheet bleibt nutzbar, kein Fehler`, (await page.$$('#content tr')).length > 0 && errors.length === 0, errors.join(' | '));
  check(`#${h.slice(0, 20)}: kein eingeschleuster Code`, await sauber());
}

// Suchfelder: Sonderzeichen, Unicode, HTML, Regex-Zeichen
await oeffne('?s=apt');
for (const q of [XSS, '.*+?^${}()|[]\\', 'äöüß 🎭 שלום', '\u0000', 'x'.repeat(10000)]) {
  errors.length = 0;
  await page.fill('#sheet-filter', q);
  await page.fill('#content input[type=search]', q).catch(() => {});
  await page.waitForTimeout(50);
  check(`Suche ${JSON.stringify(q.slice(0, 20))}: kein Fehler, kein Code`, errors.length === 0 && await sauber(), errors.join(' | '));
}
await page.fill('#sheet-filter', 'apt');
check('Suche findet weiterhin ein Sheet', (await page.$$eval('#sheet-list li:not([hidden])', (l) => l.length)) > 0);

check('keine Anfragen an fremde Server', fremd.length === 0, fremd.join(' '));
await browser.close();
console.log(`\n${failed ? `${failed} Prüfung(en) fehlgeschlagen` : 'Alle Prüfungen bestanden'}`);
process.exit(failed ? 1 : 0);
