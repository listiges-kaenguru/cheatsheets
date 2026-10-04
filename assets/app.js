'use strict';

/* ==========================================================================
   Cheatsheets – lädt Inhalte aus cheatsheets/*.html anhand von config.json
   ========================================================================== */

const CONFIG_URL = 'cheatsheets/config.json';
const SHEET_DIR = 'cheatsheets/';
const ID_RE = /^[a-z0-9-]+$/;
const FILE_RE = /^[a-z0-9-]+\.html$/;

// Erlaubte Elemente und Attribute in Cheatsheet-Dateien (alles andere wird entfernt).
const ALLOWED = {
  SECTION: ['id'], H2: [], H3: [], P: ['class'], DIV: ['class'], SPAN: ['class'],
  TABLE: [], THEAD: [], TBODY: [], TR: ['class'], TH: ['colspan', 'scope'], TD: ['colspan'],
  CODE: [], KBD: [], PRE: [], STRONG: [], EM: [], BR: [], UL: [], OL: [], LI: [], A: ['href']
};
const ALLOWED_CLASSES = new Set(['note', 'warn', 'tag', 'sub']);
const DROP_WITH_CONTENT = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'TEMPLATE',
  'SVG', 'MATH', 'LINK', 'META', 'BASE', 'FORM', 'INPUT', 'BUTTON', 'TEXTAREA', 'SELECT', 'NOSCRIPT']);

const $ = (sel, root = document) => root.querySelector(sel);

function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (key === 'text') node.textContent = value;
    else if (key === 'class') node.className = value;
    else node.setAttribute(key, value);
  }
  for (const child of [].concat(children)) if (child) node.append(child);
  return node;
}

const storage = {
  get(key) { try { return localStorage.getItem(key); } catch { return null; } },
  set(key, value) { try { localStorage.setItem(key, value); } catch { /* ignorieren */ } }
};

/* ---------- Sanitizer ---------- */

function cleanNode(parent) {
  for (const child of Array.from(parent.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) continue;
    if (child.nodeType !== Node.ELEMENT_NODE) { child.remove(); continue; }

    const tag = child.tagName;
    if (DROP_WITH_CONTENT.has(tag)) { child.remove(); continue; }

    cleanNode(child);

    if (!ALLOWED[tag]) { child.replaceWith(...child.childNodes); continue; }

    for (const attr of Array.from(child.attributes)) {
      const name = attr.name.toLowerCase();
      const value = attr.value.trim();
      let keep = ALLOWED[tag].includes(name);
      if (keep && name === 'id') keep = ID_RE.test(value);
      if (keep && name === 'href') keep = /^(https:\/\/|#)/i.test(value);
      if (keep && (name === 'colspan')) keep = /^\d{1,2}$/.test(value);
      if (keep && name === 'scope') keep = ['col', 'row', 'colgroup'].includes(value);
      if (keep && name === 'class') {
        const classes = value.split(/\s+/).filter(c => ALLOWED_CLASSES.has(c));
        if (classes.length) { child.setAttribute('class', classes.join(' ')); continue; }
        keep = false;
      }
      if (!keep) child.removeAttribute(attr.name);
    }
    if (tag === 'A' && /^https:/i.test(child.getAttribute('href') || '')) {
      child.setAttribute('rel', 'noopener noreferrer');
    }
  }
}

function sanitize(html) {
  // DOMParser führt keine Skripte aus; das Ergebnis wird anschließend gefiltert.
  const doc = new DOMParser().parseFromString(`<!DOCTYPE html><body>${html}`, 'text/html');
  cleanNode(doc.body);
  const fragment = document.createDocumentFragment();
  fragment.append(...Array.from(doc.body.childNodes).map(n => document.importNode(n, true)));
  return fragment;
}

/* ---------- App ---------- */

class CheatsheetApp {
  constructor() {
    this.categories = [];
    this.sheets = new Map();
    this.cache = new Map();
    this.current = null;
    this.main = $('#content');
    this.sidebar = $('#sidebar');
    this.menuToggle = $('#menu-toggle');
    this.toast = $('#toast');
  }

  async start() {
    this.initTheme();
    this.initMenu();
    this.initShortcuts();

    try {
      await this.loadConfig();
    } catch (err) {
      console.error(err);
      this.showError('Die Konfiguration konnte nicht geladen werden.',
        location.protocol === 'file:'
          ? 'Die Seite muss über einen Webserver aufgerufen werden, z. B. mit „python3 -m http.server“.'
          : 'Bitte prüfe die Datei cheatsheets/config.json.');
      return;
    }

    this.renderNav();
    window.addEventListener('popstate', () => this.route(false));
    this.route(false);
  }

  async loadConfig() {
    const res = await fetch(CONFIG_URL, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    for (const category of data.categories || []) {
      const valid = (category.cheatsheets || []).filter(s =>
        ID_RE.test(s.id) && FILE_RE.test(s.file) && typeof s.title === 'string' && !this.sheets.has(s.id));
      const cat = { name: String(category.name || ''), sheets: valid };
      valid.forEach(s => this.sheets.set(s.id, { ...s, category: cat.name }));
      if (valid.length) this.categories.push(cat);
    }
    if (!this.sheets.size) throw new Error('Keine gültigen Cheatsheets in config.json');
  }

  /* ----- Navigation ----- */

  renderNav() {
    const list = $('#sheet-list');
    const groups = this.categories.map(cat =>
      el('section', { class: 'nav-group' }, [
        el('h2', { text: cat.name }),
        el('ul', {}, cat.sheets.map(s =>
          el('li', {}, el('a', { href: `?s=${s.id}`, 'data-id': s.id, text: s.title }))))
      ]));
    const empty = el('p', { class: 'nav-empty', text: 'Kein Cheatsheet gefunden.', hidden: '' });
    list.replaceChildren(...groups, empty);

    list.addEventListener('click', e => {
      const link = e.target.closest('a[data-id]');
      if (!link || e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      this.navigate(link.dataset.id);
    });

    $('#sheet-filter').addEventListener('input', e => {
      const q = normalize(e.target.value);
      let any = false;
      for (const group of list.querySelectorAll('.nav-group')) {
        let groupHit = false;
        for (const li of group.querySelectorAll('li')) {
          const hit = !q || normalize(li.textContent + ' ' + group.firstChild.textContent).includes(q);
          li.hidden = !hit;
          groupHit ||= hit;
        }
        group.hidden = !groupHit;
        any ||= groupHit;
      }
      empty.hidden = any;
    });
  }

  markActive(id) {
    for (const a of document.querySelectorAll('#sheet-list a[data-id]')) {
      if (a.dataset.id === id) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    }
  }

  navigate(id) {
    if (!this.sheets.has(id)) return;
    history.pushState(null, '', `?s=${id}`);
    this.closeMenu();
    this.route(true);
  }

  route(focusContent) {
    const requested = new URLSearchParams(location.search).get('s');
    if (!this.sheets.has(requested)) {
      this.renderHome(focusContent);
      return;
    }
    if (this.current && this.current.id === requested) {
      this.scrollToHash();
      return;
    }
    this.loadSheet(requested, focusContent);
  }

  goHome() {
    history.pushState(null, '', location.pathname);
    this.closeMenu();
    this.route(true);
  }

  renderHome(focusContent) {
    this.current = null;
    this.markActive(null);
    document.title = 'Cheatsheets – Übersicht';

    const head = el('header', { class: 'sheet-head' }, [
      el('h1', { text: 'Cheatsheets' }),
      el('p', { class: 'lead', text: `Kurze, einheitliche Spickzettel für Linux, Windows, Netzwerk, `
        + `Datenbanken, Container und mehr – ${this.sheets.size} Cheatsheets in `
        + `${this.categories.length} Kategorien. Wähle links oder unten ein Thema aus.` })
    ]);

    const grid = el('div', { class: 'home-grid' }, this.categories.map(cat =>
      el('section', { class: 'home-cat' }, [
        el('h2', { text: cat.name }),
        el('ul', {}, cat.sheets.map(s =>
          el('li', {}, el('a', { href: `?s=${s.id}`, 'data-id': s.id }, [
            el('span', { class: 'home-title', text: s.title }),
            s.description ? el('span', { class: 'home-desc', text: s.description }) : null
          ]))))
      ])));

    grid.addEventListener('click', e => {
      const link = e.target.closest('a[data-id]');
      if (!link || e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      this.navigate(link.dataset.id);
    });

    this.main.replaceChildren(head, grid);
    window.scrollTo(0, 0);
    if (focusContent) this.main.focus({ preventScroll: true });
  }

  /* ----- Cheatsheet laden ----- */

  async fetchSheet(sheet) {
    if (this.cache.has(sheet.id)) return this.cache.get(sheet.id);
    const res = await fetch(SHEET_DIR + sheet.file, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    this.cache.set(sheet.id, html);
    return html;
  }

  async loadSheet(id, focusContent) {
    const sheet = this.sheets.get(id);
    this.current = sheet;
    this.markActive(id);
    document.title = `${sheet.title} – Cheatsheets`;

    let html;
    try {
      html = await this.fetchSheet(sheet);
    } catch (err) {
      console.error(err);
      if (this.current !== sheet) return;
      this.showError(`„${sheet.title}“ konnte nicht geladen werden.`,
        `Bitte prüfe, ob die Datei cheatsheets/${sheet.file} existiert.`);
      return;
    }
    if (this.current !== sheet) return; // inzwischen anderes Cheatsheet gewählt

    const body = el('div', { class: 'sheet' });
    body.append(sanitize(html));

    const sections = Array.from(body.querySelectorAll('section[id]'));
    for (const section of sections) {
      const h2 = section.querySelector('h2');
      if (h2) {
        h2.id = `${section.id}-titel`;
        section.setAttribute('aria-labelledby', h2.id);
      }
    }
    for (const row of body.querySelectorAll('thead tr')) {
      for (const th of row.children) th.setAttribute('scope', 'col');
    }
    this.addCopyButtons(body);

    const head = el('header', { class: 'sheet-head' }, [
      el('p', { class: 'crumb' }, [
        el('a', { href: './', 'data-home': '', text: 'Übersicht' }),
        el('span', { 'aria-hidden': 'true', text: ' › ' }),
        el('span', { text: sheet.category })
      ]),
      el('h1', { text: sheet.title }),
      sheet.description ? el('p', { class: 'lead', text: sheet.description }) : null
    ]);

    const filterInput = el('input', {
      type: 'search', id: 'row-filter', placeholder: 'In diesem Cheatsheet filtern …  (Taste /)',
      autocomplete: 'off', spellcheck: 'false', 'aria-describedby': 'row-count'
    });
    const count = el('span', { class: 'count', id: 'row-count', 'aria-live': 'polite' });
    const tools = el('div', { class: 'sheet-tools', role: 'search' }, [
      el('label', { for: 'row-filter', class: 'visually-hidden', text: 'Einträge filtern' }),
      filterInput, count
    ]);

    const toc = sections.length > 1
      ? el('nav', { 'aria-label': 'Abschnitte' }, el('ul', { class: 'toc' }, sections.map(s =>
          el('li', {}, el('a', { href: `#${s.id}`, text: (s.querySelector('h2') || s).textContent.trim() })))))
      : null;

    const noResults = el('p', { class: 'no-results', text: 'Keine passenden Einträge.', hidden: '' });
    filterInput.addEventListener('input', () => this.filterRows(body, filterInput.value, count, noResults));

    this.main.replaceChildren(head, tools, toc || '', body, noResults);
    this.filterRows(body, '', count, noResults);

    if (location.hash) this.scrollToHash();
    else window.scrollTo(0, 0);
    if (focusContent) this.main.focus({ preventScroll: true });
  }

  scrollToHash() {
    if (!location.hash) return;
    const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (target) target.scrollIntoView();
  }

  filterRows(body, query, count, noResults) {
    const q = normalize(query);
    let visible = 0;
    let total = 0;
    for (const section of body.querySelectorAll('section')) {
      let sectionHits = 0;
      for (const row of section.querySelectorAll('tbody tr')) {
        if (row.classList.contains('sub')) { row.hidden = Boolean(q); continue; }
        total++;
        const hit = !q || normalize(row.textContent).includes(q);
        row.hidden = !hit;
        if (hit) sectionHits++;
      }
      for (const extra of section.querySelectorAll(':scope > p, :scope > div')) extra.hidden = Boolean(q);
      section.hidden = Boolean(q) && sectionHits === 0;
      visible += sectionHits;
    }
    count.textContent = q ? `${visible} von ${total} Einträgen` : `${total} Einträge`;
    noResults.hidden = !(q && visible === 0);
  }

  addCopyButtons(body) {
    for (const cell of body.querySelectorAll('tbody td:first-child')) {
      const code = cell.querySelector('code');
      if (!code) continue;
      const btn = el('button', {
        type: 'button', class: 'copy-btn',
        'aria-label': `Kopieren: ${code.textContent}`, title: 'Befehl kopieren'
      });
      btn.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16"><rect x="9" y="9" width="11" height="11" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M5 15V6a2 2 0 0 1 2-2h8" fill="none" stroke="currentColor" stroke-width="2"/></svg>';
      btn.addEventListener('click', () => this.copy(code.textContent));
      cell.append(btn);
    }
  }

  async copy(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = el('textarea', { readonly: '', class: 'visually-hidden' });
        ta.value = text;
        document.body.append(ta);
        ta.select();
        const ok = document.execCommand('copy');
        ta.remove();
        if (!ok) throw new Error('execCommand fehlgeschlagen');
      }
      this.notify('In die Zwischenablage kopiert');
    } catch {
      this.notify('Kopieren nicht möglich');
    }
  }

  notify(message) {
    this.toast.textContent = message;
    this.toast.classList.add('show');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toast.classList.remove('show'), 1800);
  }

  showError(title, detail) {
    this.main.replaceChildren(el('div', { class: 'notice', role: 'alert' }, [
      el('h1', { text: title }), el('p', { text: detail })
    ]));
  }

  /* ----- Theme ----- */

  initTheme() {
    const root = document.documentElement;
    const btn = $('#theme-toggle');
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const resolved = () => root.getAttribute('data-theme') || (media.matches ? 'dark' : 'light');
    const update = () => {
      const dark = resolved() === 'dark';
      btn.setAttribute('aria-label', dark ? 'Helles Farbschema aktivieren' : 'Dunkles Farbschema aktivieren');
      btn.title = btn.getAttribute('aria-label');
    };

    if (!root.hasAttribute('data-theme')) root.setAttribute('data-theme', resolved());
    media.addEventListener('change', () => {
      if (!storage.get('theme')) { root.setAttribute('data-theme', media.matches ? 'dark' : 'light'); update(); }
    });
    btn.addEventListener('click', () => {
      const next = resolved() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      storage.set('theme', next);
      update();
    });
    update();
  }

  /* ----- Mobiles Menü & Tastatur ----- */

  initMenu() {
    this.menuToggle.addEventListener('click', () => {
      if (this.sidebar.classList.contains('open')) this.closeMenu();
      else this.openMenu();
    });
    document.addEventListener('click', e => {
      const home = e.target.closest('a[data-home]');
      if (home && !e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
        e.preventDefault();
        this.goHome();
        return;
      }
      if (this.sidebar.classList.contains('open') &&
          !this.sidebar.contains(e.target) && !this.menuToggle.contains(e.target)) this.closeMenu();
    });
  }

  openMenu() {
    this.sidebar.classList.add('open');
    this.menuToggle.setAttribute('aria-expanded', 'true');
    this.menuToggle.setAttribute('aria-label', 'Navigation schließen');
    $('#sheet-filter').focus();
  }

  closeMenu() {
    if (!this.sidebar.classList.contains('open')) return;
    this.sidebar.classList.remove('open');
    this.menuToggle.setAttribute('aria-expanded', 'false');
    this.menuToggle.setAttribute('aria-label', 'Navigation öffnen');
  }

  initShortcuts() {
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && this.sidebar.classList.contains('open')) {
        this.closeMenu();
        this.menuToggle.focus();
        return;
      }
      const typing = e.target.closest('input, textarea, [contenteditable="true"]');
      if (e.key === '/' && !typing && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const input = $('#row-filter');
        if (input) { e.preventDefault(); input.focus(); }
      }
    });
  }
}

function normalize(text) {
  return text.toLowerCase().normalize('NFKD').replace(/\s+/g, ' ').trim();
}

new CheatsheetApp().start();
