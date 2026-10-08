/* ==========================================================================
   build-dist.js — assemble dist/, the folder a host publishes.

   Not a build step in the bundler sense: nothing is compiled, minified or
   rewritten. It copies the files a visitor needs and leaves out the ones they
   must not get — docs/, tools/ (dev harnesses), partials/, css/src/, image
   sources, package files, node_modules. The repository root still serves
   as-is for local development.

   Runs tools/check-release.js first and stops if it fails, so a deploy
   cannot be built from placeholder contact details or a missing domain.
   --preview skips that gate for a local look at the deploy (serve-dist.js);
   never publish a preview build.

   Usage:
     node tools/build-dist.js             # release build (gated)
     node tools/build-dist.js --preview   # local preview only, not gated
   ========================================================================== */

import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const DIST = join(ROOT, 'dist');
const PREVIEW = process.argv.includes('--preview');

if (!PREVIEW) {
  try {
    execFileSync(process.execPath, [join(ROOT, 'tools', 'check-release.js')], { cwd: ROOT, stdio: 'inherit' });
  } catch {
    console.error('\nbuild-dist: stopped — the release check failed. Nothing was built.');
    process.exit(1);
  }
}

/* What ships. Directories are copied recursively, minus EXCLUDE. */
const SHIP = [
  'index.html', 'about.html', 'technology.html', 'solutions.html', 'services.html', 'contact.html', '404.html',
  'solutions', 'services',
  'css/main.css',
  'js',
  'assets',
  'site.webmanifest', 'robots.txt', 'sitemap.xml',
  '_headers', '.htaccess',
];
const EXCLUDE = [/^assets\/img\/_src(\/|$)/, /\.md$/i, /(^|\/)\.DS_Store$/, /(^|\/)Thumbs\.db$/];

if (DIST !== join(ROOT, 'dist')) throw new Error('refusing to clear an unexpected path');
rmSync(DIST, { recursive: true, force: true });

let count = 0;
function copy(rel) {
  const src = join(ROOT, rel);
  if (!existsSync(src)) return;
  if (EXCLUDE.some((re) => re.test(rel))) return;
  if (statSync(src).isDirectory()) {
    for (const entry of readdirSync(src)) copy(`${rel}/${entry}`);
    return;
  }
  const dest = join(DIST, rel);
  mkdirSync(dirname(dest), { recursive: true });
  cpSync(src, dest);
  count += 1;
}
for (const rel of SHIP) copy(rel);

const missing = ['index.html', '404.html', 'css/main.css', 'js/main.js'].filter((f) => !existsSync(join(DIST, f)));
if (missing.length) {
  console.error(`build-dist: dist/ is missing ${missing.join(', ')}`);
  process.exit(1);
}
console.log(`build-dist: ${count} file(s) -> ${relative(ROOT, DIST)}/${PREVIEW ? '  (PREVIEW — not for publishing)' : ''}`);
