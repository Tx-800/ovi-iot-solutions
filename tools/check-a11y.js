/* ==========================================================================
   check-a11y.js — axe-core plus rendered measurement over every page.

   The gate is zero violations (ARCHITECTURE.md §8). Runs inside a real
   browser against the real rendered page, at a desktop and a mobile width,
   because contrast, target size and reflow depend on layout.

   Two passes per page and width:
     axe              the standard rule set
     a11y-measure.js  rendered contrast of text (1.4.3) and of field
                      boundaries, icons and focus indicators (1.4.11), and
                      target size (2.5.8), for every interactive control at
                      rest, on hover, on focus, after the header scrolls,
                      and inside the opened drawer (375px) or mega menu
                      (1280px). Written because axe passed three values
                      that failed WCAG; see that file's header.
   Any axe violation, any measured failure, and any control the measurer
   could not verify fails the run.

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
const SKIP_DIRS = new Set(['docs', 'node_modules', '.git', 'partials', 'tools', '.shots', 'dist']);
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
    '--virtual-time-budget=120000',
    '--window-size=1400,1500',
    '--dump-dom',
    `${ORIGIN}/tools/a11y-harness.html#url=${encodeURIComponent(page)}&w=${width}`,
  ], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 1024 * 1024 * 64 });

  const match = dom.match(/<pre id="out">([\s\S]*?)<\/pre>/);
  if (!match) throw new Error('harness produced no output');

  const text = match[1]
    .replaceAll('&quot;', '"').replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>').replaceAll('&amp;', '&');
  if (text.trim() === 'pending') throw new Error('harness did not finish');
  return JSON.parse(text);
}

let totalViolations = 0;
let failedPages = 0;
let controlsMeasured = 0;
let unverified = 0;
const exceptions = [];

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

    const { measured } = r;
    if (!/^(drawer|mega)$/.test(measured.menuState)) {
      lines.push(`    ${width}px  ERROR  navigation menu: ${measured.menuState}`);
      pageViolations += 1;
    }
    controlsMeasured += measured.page.controls + measured.menu.controls;
    for (const f of r.findings) {
      if (f.kind === 'info') {
        /* Not a failure: an undersized target WCAG exempts. Listed so a
           reliance on the exception is a visible decision, not an accident. */
        exceptions.push(`    ${width}px  ${page}  ${f.selector}${f.label ? ` “${f.label}”` : ''} — ${f.detail}`);
        continue;
      }
      pageViolations += 1;
      if (f.kind === 'unverified') unverified += 1;
      lines.push(`    ${width}px  ${f.kind === 'fail' ? 'FAIL' : 'UNVERIFIED'}  ${f.sc} ${f.state}  ${f.selector}${f.label ? ` “${f.label}”` : ''}`);
      lines.push(`             ${f.detail}`);
    }
  }

  totalViolations += pageViolations;
  if (pageViolations > 0) failedPages += 1;

  console.log(`  ${pageViolations === 0 ? 'clean' : String(pageViolations).padStart(5)}  ${page}`);
  for (const l of lines) console.log(l);
}

if (exceptions.length) {
  console.log('\nUndersized targets WCAG exempts (2.5.8 exceptions, not failures):');
  for (const e of new Set(exceptions)) console.log(e);
}

console.log(`\ncheck-a11y: ${pages.length} page(s) at ${WIDTHS.join(' and ')}px — `
  + `${totalViolations} problem(s) across ${failedPages} page(s)`
  + `${unverified ? ` (${unverified} of them unverifiable)` : ''}; `
  + `${controlsMeasured} control measurements.`);

process.exit(totalViolations === 0 ? 0 : 1);
