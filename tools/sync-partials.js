/* ==========================================================================
   sync-partials.js — keeps 14 pages in sync from partials/

   Reads each partials/<name>.html and replaces everything between
     <!-- @include <name> -->  and  <!-- /@include <name> -->
   in every page, then stamps the per-page values the build step owns:
   aria-current on the matching nav link, the canonical URL, baked tel:/
   mailto:/wa.me hrefs, and the JSON-LD block.

   Built in Phase 2 (TODO.md), once partials/ has real markup. Until then this
   exits cleanly so the verification loop in AGENTS.md §6 runs end to end from
   Phase 1 onward.

   Usage: node tools/sync-partials.js
   ========================================================================== */

import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const PARTIALS = join(ROOT, 'partials');

const partials = readdirSync(PARTIALS).filter((f) => f.endsWith('.html'));
const ready = partials.filter((f) => {
  const body = readFileSync(join(PARTIALS, f), 'utf8').replace(/<!--[\s\S]*?-->/g, '').trim();
  return body.length > 0;
});

if (ready.length === 0) {
  console.log(`sync-partials: ${partials.length} partial(s) found, none carrying markup yet — nothing to inject.`);
  process.exit(0);
}

console.error('sync-partials: injection is implemented in Phase 2.');
console.error(`Partials now carrying markup: ${ready.join(', ')}`);
process.exit(1);
