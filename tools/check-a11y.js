/* ==========================================================================
   check-a11y.js — axe-core over every page, or one named page.

   The gate is zero violations (ARCHITECTURE.md §8). Runs axe inside a real
   browser against the real rendered page, at a desktop and a mobile width,
   because some rules (contrast, target size, reflow) depend on layout.

   axe-core is a devDependency and never ships. Requires the dev server
   running (npx serve . -l 4321) and a local Chrome.

   Usage:
     node tools/check-a11y.js                 # every page
     node tools/check-a11y.js about.html      # one page
   ========================================================================== */

import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join, resolve, relative } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const ORIGIN = process.env.OVI_ORIGIN || 'http://localhost:4321';
const SKIP_DIRS = new Set(['docs', 'node_modules', '.git', 'partials', 'tools', '.shots']);
const WIDTHS = [375, 1280];

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean);

const chrome = CHROME_CANDIDATES.find((p) => existsSync(p));
if (!chrome) {
  console.error('check-a11y: no Chrome found. Set CHROME_PATH to a Chrome or Edge binary.');
  process.exit(1);
}

if (!existsSync(join(ROOT, 'node_modules', 'axe-core', 'axe.min.js'))) {
  console.error('check-a11y: axe-core is not installed. Run: npm install');
  process.exit(1);
}

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

const arg = process.argv[2];
const pages = arg && !arg.includes(':')
  ? [`/${arg.replace(/^\/+/, '')}`]
  : htmlFiles().map((f) => `/${relative(ROOT, f).replaceAll('\\', '/')}`).sort();

function run(page, width) {
  const dom = execFileSync(chrome, [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--virtual-time-budget=20000',
    '--window-size=1400,1500',
    '--dump-dom',
    `${ORIGIN}/tools/a11y-harness.html#url=${encodeURIComponent(page)}&w=${width}`,
  ], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 1024 * 1024 * 64 });

  const match = dom.match(/<pre id="out">([\s\S]*?)<\/pre>/);
  if (!match) throw new Error('harness produced no output');

  const text = match[1]
    .replaceAll('&quot;', '"').replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>').replaceAll('&amp;', '&');
  if (text.trim() === 'pending') throw new Error('axe did not finish');
  return JSON.parse(text);
}

let totalViolations = 0;
let failedPages = 0;

for (const page of pages) {
  const lines = [];
  let pageViolations = 0;

  for (const width of WIDTHS) {
    let r;
    try {
      r = run(page, width);
    } catch (err) {
      lines.push(`    ${width}px  ERROR  ${err.message}`);
      pageViolations += 1;
      continue;
    }

    if (r.error) {
      lines.push(`    ${width}px  ERROR  ${r.error}`);
      pageViolations += 1;
      continue;
    }

    pageViolations += r.violationCount;
    for (const v of r.violations) {
      lines.push(`    ${width}px  ${v.impact ?? 'n/a'}  ${v.id} — ${v.help} (${v.nodeCount} node${v.nodeCount === 1 ? '' : 's'})`);
      for (const n of v.nodes) lines.push(`             ${n.target}`);
    }
  }

  totalViolations += pageViolations;
  if (pageViolations > 0) failedPages += 1;

  console.log(`  ${pageViolations === 0 ? 'clean' : String(pageViolations).padStart(5)}  ${page}`);
  for (const l of lines) console.log(l);
}

console.log(`\ncheck-a11y: ${pages.length} page(s) at ${WIDTHS.join(' and ')}px — `
  + `${totalViolations} violation(s) across ${failedPages} page(s).`);

process.exit(totalViolations === 0 ? 0 : 1);
