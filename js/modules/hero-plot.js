/* ==========================================================================
   hero-plot.js — the coverage plot entrance (index.html only).

   DESIGN.md §6.1: the contour rings scale 0.6 -> 1 and fade in, staggered
   90ms apart, 900ms in total, then one slow pulse ring every 4 seconds.
   This is the single orchestrated motion moment on the site, and nothing else
   on the page animates on load.

   The plot's settled state is its CSS state, so this module animates *to*
   what is already rendered. If the script never runs, if Motion fails to
   load, or if the visitor has asked for reduced motion, the plot is simply
   there — complete and correct.
   ========================================================================== */

import { loadMotion, prefersReducedMotion } from './motion.js';

const DURATION = 0.9;        /* 900ms total — DESIGN.md §6.1 */
const STAGGER = 0.09;        /* 90ms between rings */
const EASE = [0.16, 1, 0.3, 1];
const PULSE_PERIOD = 4;      /* one slow pulse every 4s */

export async function init() {
  const plot = document.querySelector('[data-hero-plot]');
  if (!plot) return;

  /* Reduced motion: the final state is already on screen. Leave it alone. */
  if (prefersReducedMotion()) return;

  const rings = plot.querySelectorAll('[data-ring]');
  const pulse = plot.querySelector('[data-pulse]');
  if (rings.length === 0) return;

  const motion = await loadMotion();
  if (!motion) return;        /* CDN unreachable — the settled plot stands */

  const { animate } = motion;

  /* Motion 12 drives SVG elements through its SVG renderer, which shaped two
     choices here (measured in a real-time browser, 2026-10-08):
     - `scale`, not a raw `transform` string. The string form wrote
       transform="undefined" — a console error that cost Best Practices 4
       points. Motion scales around each circle's own centre; every ring is
       centred on the view-box centre, where the CSS transform-origin puts
       it, so the result is identical.
     - `opacity`, not `strokeOpacity`. The renderer writes stroke-opacity as
       a presentation attribute, which each ring's class outranks, so the
       fade never showed. Element opacity fades 0 -> 1 over the stroke
       opacity the class sets, so the settled state is still the
       stylesheet's own. */
  rings.forEach((ring, i) => {
    animate(
      ring,
      { scale: [0.6, 1], opacity: [0, 1] },
      { duration: DURATION, delay: i * STAGGER, ease: EASE },
    );
  });

  if (!pulse) return;

  /* One continuous element, deliberately slow: a single contour leaving the
     gateway every four seconds. It starts after the entrance has finished. */
  const entranceEnd = DURATION + (rings.length - 1) * STAGGER;

  animate(
    pulse,
    { scale: [1, 4.5], opacity: [0.5, 0] },
    {
      duration: PULSE_PERIOD,
      delay: entranceEnd,
      ease: 'linear',
      repeat: Infinity,
    },
  );
}
