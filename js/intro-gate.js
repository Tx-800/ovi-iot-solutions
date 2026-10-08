/* ==========================================================================
   intro-gate.js — decides, before first paint, whether the logo intro plays.

   A classic (non-module) script loaded synchronously from <head>, so the
   decision lands before the body is painted and the intro never flashes in
   late. Deliberately tiny: it is the only render-blocking script on the site.

   The intro plays on the first page of a browser session only — not on every
   click between pages — and never when the visitor prefers reduced motion.
   With JavaScript off this never runs, the attribute is never set, and the
   intro stays display:none. The animation itself is CSS (06-sections.css)
   and hides itself when it ends, so nothing here has to clean up.
   ========================================================================== */

(function () {
  var KEY = 'ovi-intro-seen';
  try {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (window.sessionStorage.getItem(KEY)) return;
    window.sessionStorage.setItem(KEY, '1');
  } catch (e) {
    return; /* storage blocked (private mode, policy): skip the intro rather than replay it on every page */
  }
  document.documentElement.setAttribute('data-intro', '');
})();
