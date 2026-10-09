/* ==========================================================================
   main.js — the single entry point for all 14 pages.

   Loaded as <script type="module">, so it is deferred by nature and never
   blocks render. Statically imported modules are the ones every page needs;
   everything else is imported only when its target element is on the page, so
   a solution page never downloads the hero plot or the map.

   Nothing here assumes an element exists — each module guards its own target
   (ARCHITECTURE.md §6).
   ========================================================================== */

import { hydrate } from './modules/config.js';
import { initNav } from './modules/nav.js';
import { initUI } from './modules/ui.js';

hydrate();      // writes SITE values into [data-site] nodes
initNav();
initUI();

/* Route-scoped, dynamically imported. */
if (document.querySelector('[data-hero-plot]')) {
  import('./modules/hero-plot.js').then((m) => m.init());
}

if (document.querySelector('[data-architecture]')) {
  import('./modules/architecture.js').then((m) => m.init());
}

if (document.querySelector('[data-orbit]')) {
  import('./modules/orbit.js').then((m) => m.init());
}

if (document.querySelector('[data-contact-form]')) {
  import('./modules/form.js').then((m) => m.init());
}

if (document.querySelector('[data-map]')) {
  import('./modules/map.js').then((m) => m.init());
}
