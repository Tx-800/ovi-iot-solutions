/* ==========================================================================
   check-links.js — every internal link and asset reference must resolve.

   Walks every .html file in the project (excluding docs/, node_modules/ and
   partials/, which are fragments), collects href/src/srcset targets, and
   reports any that do not exist on disk. External URLs, mailto:, tel: and
   anchors are skipped; a bare href="#" is reported separately because it is a
   dead link (AGENTS.md §6).

   Usage: node tools/check-links.js
   Exit code 1 if anything is broken, so it can gate a commit.
   ========================================================================== */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, resolve, dirname, posix } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const SKIP_DIRS = new Set(['docs', 'node_modules', '.git', 'partials', 'tools']);
const EXTERNAL = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;

function htmlFiles(dir = ROOT, found = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (!SKIP_DIRS.has(entry) && !entry.startsWith('.')) htmlFiles(full, found);
    } else if (entry.endsWith('.html')) {
      found.push(full);
    }
  }
  return found;
}

/** Every href/src/srcset value in the file, with the attribute it came from. */
function references(html) {
  const refs = [];
  const attr = /\s(href|src|srcset|poster|content)\s*=\s*"([^"]*)"/gi;
  let m;
  while ((m = attr.exec(html)) !== null) {
    const [, name, raw] = m;
    // Only og:url / og:image style content attributes point at resources.
    if (name === 'content' && !raw.startsWith('/')) continue;
    const targets = name === 'srcset'
      ? raw.split(',').map((part) => part.trim().split(/\s+/)[0])
      : [raw];
    for (const target of targets) if (target) refs.push({ name, target });
  }
  return refs;
}

/** Resolve a link to an absolute path on disk, or null if it is not checkable. */
function toDiskPath(target, fromFile) {
  if (EXTERNAL.test(target) || target.startsWith('#')) return null;
  const [pathPart] = target.split(/[?#]/);
  if (!pathPart) return null;
  const relative = pathPart.startsWith('/')
    ? pathPart.slice(1)
    : posix.join(dirname(fromFile).replaceAll('\\', '/').slice(ROOT.length + 1), pathPart);
  const onDisk = resolve(ROOT, relative);
  // A directory link resolves to its index.html.
  if (existsSync(onDisk) && statSync(onDisk).isDirectory()) return join(onDisk, 'index.html');
  return onDisk;
}

const pages = htmlFiles();
const broken = [];
const dead = [];

for (const file of pages) {
  const rel = file.slice(ROOT.length + 1).replaceAll('\\', '/');
  const html = readFileSync(file, 'utf8');
  for (const { name, target } of references(html)) {
    if (target === '#') {
      dead.push(`${rel}  ${name}="#"`);
      continue;
    }
    const onDisk = toDiskPath(target, file);
    if (onDisk && !existsSync(onDisk)) broken.push(`${rel}  ->  ${target}`);
  }
}

console.log(`check-links: ${pages.length} page(s) scanned.`);

if (dead.length) {
  console.error(`\n${dead.length} dead link(s) (href="#"):`);
  for (const d of dead) console.error(`  ${d}`);
}

if (broken.length) {
  console.error(`\n${broken.length} unresolved reference(s):`);
  for (const b of broken) console.error(`  ${b}`);
}

if (broken.length || dead.length) process.exit(1);

console.log('check-links: 0 broken, 0 dead.');
