/* ==========================================================================
   build-sitemap.js — regenerates sitemap.xml from the pages on disk, using
   SITE.url as the origin.

   Built in Phase 6 (TODO.md), when all 14 pages exist and SITE.url is real.
   Exits cleanly while the domain is still a placeholder, so running it early
   cannot write a sitemap full of placeholder URLs.

   Usage: node tools/build-sitemap.js
   ========================================================================== */

import { SITE } from '../js/site.config.js';

/* Matched loosely on purpose: the literal placeholder string must not appear
   anywhere outside js/site.config.js (PRD.md §11). */
if (/REPLACE/i.test(SITE.url)) {
  console.log('build-sitemap: SITE.url is still a placeholder — skipping.');
  console.log('Fill `url` in js/site.config.js, then run this again.');
  process.exit(0);
}

console.error('build-sitemap: generation is implemented in Phase 6.');
process.exit(1);
