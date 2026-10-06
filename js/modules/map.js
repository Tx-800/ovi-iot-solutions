/* ==========================================================================
   map.js — Leaflet + OpenStreetMap on contact.html, initialised only when the
   map scrolls into view. Leaflet's own CSS and JS are injected here and on no
   other page (ARCHITECTURE.md §6). Built in Phase 5 (TODO.md).
   ========================================================================== */

export function init() {
  const mount = document.querySelector('[data-map]');
  if (!mount) return;
}
