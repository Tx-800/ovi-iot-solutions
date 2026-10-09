/* ==========================================================================
   orbit.js — starts the Why-choose-OVI orbit revolving, and owns its pause.

   The revolve is CSS (06-sections.css: animating --spin). This module only
   decides whether it may run, and provides the control WCAG 2.2.2 requires
   for moving content that lasts more than five seconds: a visible button
   that stops it for everyone, not just mouse users. Hover and keyboard focus
   inside the orbit also pause it (CSS).

   It never runs when the visitor prefers reduced motion, below the desktop
   layout (where the cards are a static grid), or without JavaScript — in
   each case the cards simply sit still on the circle or in the grid.
   ========================================================================== */

import { prefersReducedMotion } from './motion.js';

const DESKTOP = '(min-width: 1024px)';

export function init() {
  const orbit = document.querySelector('[data-orbit]');
  const toggle = document.querySelector('[data-orbit-toggle]');
  if (!orbit || !toggle) return;

  const desktop = window.matchMedia(DESKTOP);

  const setPaused = (paused) => {
    orbit.toggleAttribute('data-paused', paused);
    toggle.setAttribute('aria-pressed', String(paused));
    toggle.textContent = paused ? 'Resume rotation' : 'Pause rotation';
  };

  const sync = () => {
    const allowed = desktop.matches && !prefersReducedMotion();
    orbit.toggleAttribute('data-spin', allowed);
    toggle.hidden = !allowed;
  };

  toggle.addEventListener('click', () => {
    setPaused(toggle.getAttribute('aria-pressed') !== 'true');
  });

  desktop.addEventListener('change', sync);
  window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', sync);
  sync();
}
