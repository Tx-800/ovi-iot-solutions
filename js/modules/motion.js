/* ==========================================================================
   motion.js — Motion One setup and the reduced-motion guard.

   Motion is loaded on demand, not at page load, so a page with no animation
   never pays for it. Every caller must check prefersReducedMotion() first and
   render the final state instead of animating (DESIGN.md §8).
   ========================================================================== */

/* Pinned exactly — ARCHITECTURE.md §1. 12.43.0 was the latest 12.x on
   2026-10-08. The +esm URL is a stub that re-exports from
   framer-motion@12.43.0/dom/+esm, which jsDelivr also pins exactly; both
   were fetched and checked to export animate and inView before pinning.
   No SRI: jsDelivr generates +esm files and documents that SRI must not be
   used on them. */
const MOTION_CDN = 'https://cdn.jsdelivr.net/npm/motion@12.43.0/+esm';

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

/** True when the visitor has asked for less motion. Read at call time, not
 *  cached, so a mid-session OS change is respected. */
export function prefersReducedMotion() {
  return window.matchMedia(REDUCED_MOTION).matches;
}

let motionPromise;

/** Lazily import Motion. Returns null if the CDN is unreachable, so a caller
 *  can fall back to the final state rather than throwing. */
export function loadMotion() {
  if (!motionPromise) {
    motionPromise = import(MOTION_CDN).catch(() => null);
  }
  return motionPromise;
}
