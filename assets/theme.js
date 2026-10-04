// Gespeichertes Farbschema vor dem ersten Rendern setzen (verhindert Aufflackern).
(function () {
  try {
    var t = localStorage.getItem('theme');
    if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t);
  } catch (e) { /* Speicher nicht verfügbar */ }
})();
