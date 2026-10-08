/* ==========================================================================
   check-release.js — is this build shippable? Exit 0 only if every line passes.

   This is the gate between "the site works" and "the site can go live". It
   fails, loudly and line by line, while js/site.config.js still holds
   placeholders, while the sitemap or host files are stale, and until exactly
   one host's config files remain. tools/build-dist.js runs it first, so a
   deploy cannot be built while it fails.

   A value is a PLACEHOLDER when it still says REPLACE_ME or is the all-zero
   number from PRD.md §6 — that blocks release. A value that is deliberately
   EMPTY ("" — e.g. no WhatsApp line, no LinkedIn page) is allowed: the site
   simply omits it. For the map, `map: null` means "no map"; 0,0 is the
   placeholder.

   Usage: node tools/check-release.js
   ========================================================================== */

import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { SITE } from '../js/site.config.js';

const ROOT = resolve(import.meta.dirname, '..');
const results = [];
const pass = (label) => results.push({ ok: true, label });
const fail = (label, fix) => results.push({ ok: false, label, fix });

/* --- 1. Contact details ---------------------------------------------------- */

const placeholder = (v) => typeof v === 'string' && (/REPLACE_ME/i.test(v) || /^\+?0[0\s().-]*$/.test(v.trim()));
const fields = {
  url: SITE.url,
  email: SITE.email,
  phone: SITE.phone,
  phoneRaw: SITE.phoneRaw,
  whatsapp: SITE.whatsapp,
  hours: SITE.hours,
  web3formsKey: SITE.web3formsKey,
  'address.line1': SITE.address?.line1,
  'address.line2': SITE.address?.line2,
  'address.city': SITE.address?.city,
  'address.region': SITE.address?.region,
  'address.postal': SITE.address?.postal,
  'address.country': SITE.address?.country,
};
const unfilled = Object.entries(fields).filter(([, v]) => placeholder(v)).map(([k]) => k);
const map = SITE.map;
if (map && Number(map.lat) === 0 && Number(map.lng) === 0) unfilled.push('map (0,0 — or set map: null for no map)');
if (unfilled.length) {
  fail(`js/site.config.js still has placeholders: ${unfilled.join(', ')}`,
    'Fill each one, or set it to "" if the company genuinely has none (it is then left off the site).');
} else {
  pass('js/site.config.js has no placeholders');
}
if (!SITE.url || placeholder(SITE.url) || !/^https:\/\/[^/]+$/.test(SITE.url.replace(/\/+$/, ''))) {
  fail(`SITE.url must be the https:// production origin with no path (now: ${SITE.url})`,
    'canonical, og:url, JSON-LD and the sitemap are all built from it.');
} else {
  pass(`SITE.url is ${SITE.url}`);
}
if (!SITE.web3formsKey || placeholder(SITE.web3formsKey)) {
  fail('No Web3Forms access key — the enquiry form cannot send', 'Create one free at https://web3forms.com with the inbox that should receive enquiries.');
}

/* --- 2. Generated files are current --------------------------------------- */

function run(script, args = []) {
  try {
    execFileSync(process.execPath, [join(ROOT, 'tools', script), ...args], { cwd: ROOT, stdio: 'pipe', encoding: 'utf8' });
    return { ok: true };
  } catch (err) {
    return { ok: false, out: `${err.stdout || ''}${err.stderr || ''}`.trim().split('\n').filter((l) => /✗|would update|problem/.test(l)).join(' / ') };
  }
}

const sync = run('sync-partials.js', ['--check']);
if (sync.ok) pass('pages are in sync with partials and site.config.js');
else fail(`sync-partials --check failed: ${sync.out || 'see its output'}`, 'Run: node tools/sync-partials.js');

const sitemap = run('build-sitemap.js', ['--check']);
if (sitemap.ok) pass('sitemap.xml and robots.txt are current');
else fail(`sitemap: ${sitemap.out || 'see its output'}`, 'Run: node tools/build-sitemap.js');

const headers = run('build-headers.js', ['--check']);
if (headers.ok) pass('host config files match tools/build-headers.js (CSP hash current)');
else fail(`host files: ${headers.out || 'see its output'}`, 'Run: node tools/build-headers.js');

const links = run('check-links.js');
if (links.ok) pass('every internal link resolves');
else fail('check-links found broken links', 'Run: node tools/check-links.js');

/* --- 3. Shipped HTML ------------------------------------------------------- */

const SKIP = new Set(['docs', 'node_modules', '.git', 'partials', 'tools', '.shots', 'dist']);
function htmlFiles(dir = ROOT, found = []) {
  for (const e of readdirSync(dir)) {
    const f = join(dir, e);
    if (statSync(f).isDirectory()) { if (!SKIP.has(e) && !e.startsWith('.')) htmlFiles(f, found); } else if (e.endsWith('.html')) found.push(f);
  }
  return found;
}
const pages = htmlFiles();
const noCanonical = [];
const leaks = [];
for (const f of pages) {
  const rel = relative(ROOT, f).replaceAll('\\', '/');
  const html = readFileSync(f, 'utf8');
  if (rel !== '404.html' && !/<link rel="canonical" href="https:\/\//.test(html)) noCanonical.push(rel);
  if (/REPLACE_ME|ide[a]s/i.test(html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, ''))) leaks.push(rel);
}
if (noCanonical.length) fail(`${noCanonical.length} page(s) without an absolute canonical (no domain yet?)`, 'Set SITE.url, then run: node tools/sync-partials.js');
else pass(`all ${pages.length - 1} indexable pages have a canonical URL`);
/* ide[a]s: the retired company name, matched without spelling it, so this file passes the AGENTS.md §6 rename grep. */
if (leaks.length) fail(`placeholder or retired name in: ${leaks.join(', ')}`, 'Nothing containing REPLACE_ME or the old company name may ship.');
else pass('no REPLACE_ME and no retired company name in any page');

/* --- 4. Exactly one host ---------------------------------------------------- */

const present = ['_headers', 'netlify.toml', 'vercel.json', '.htaccess'].filter((f) => existsSync(join(ROOT, f)));
const HOSTS = {
  Netlify: ['_headers', 'netlify.toml'],
  'Cloudflare Pages': ['_headers'],
  Vercel: ['vercel.json'],
  'Apache / cPanel': ['.htaccess'],
};
const host = Object.entries(HOSTS).find(([, set]) => set.length === present.length && set.every((f) => present.includes(f)));
if (host) {
  pass(`host: ${host[0]} (${present.join(', ')})`);
} else {
  fail(`host not chosen — config for several hosts is present: ${present.join(', ') || 'none'}`,
    'Keep only your host\'s files: Netlify = _headers + netlify.toml · Cloudflare Pages = _headers · Vercel = vercel.json · cPanel = .htaccess. Delete the rest.');
}

/* --- Report ------------------------------------------------------------------ */

const failed = results.filter((r) => !r.ok);
console.log('check-release:');
for (const r of results) {
  console.log(`  ${r.ok ? '✓' : '✗'} ${r.label}`);
  if (!r.ok && r.fix) console.log(`      → ${r.fix}`);
}
console.log(failed.length
  ? `\n✗ NOT SHIPPABLE — ${failed.length} item(s) above. See README.md "Before launch".`
  : '\n✓ Shippable. Build the deploy folder with: node tools/build-dist.js');
process.exit(failed.length ? 1 : 0);
