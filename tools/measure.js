/* ==========================================================================
   measure.js — layout facts a screenshot cannot prove.

   Drives tools/probe.html in headless Chrome and reports, per width:
   the real viewport, whether the document overflows horizontally, and which
   elements stick out. Use it for the 320/360/414/768/1024/1440/2560 pass in
   AGENTS.md §6 — a cropped screenshot cannot tell overflow from a crop.

   Requires the dev server running (npx serve . -l 4321) and a local Chrome.

   Usage:
     node tools/measure.js                      # index.html at all 7 widths
     node tools/measure.js solutions.html       # one page, all widths
     node tools/measure.js index.html 375       # one page, one width

   Pass the path without a leading slash: Git Bash rewrites a bare `/`
   argument into a Windows path before Node ever sees it.
   ========================================================================== */

import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const ORIGIN = process.env.OVI_ORIGIN || 'http://localhost:4321';
const WIDTHS = [320, 360, 414, 768, 1024, 1440, 2560];

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
  console.error('measure: no Chrome found. Set CHROME_PATH to a Chrome or Edge binary.');
  process.exit(1);
}

const [pageArg, widthArg] = process.argv.slice(2);
/* Git Bash turns a bare `/` argument into the MSYS root path; treat anything
   that is not a site-relative path as the home page. */
const page = !pageArg || pageArg.includes(':') ? '/' : `/${pageArg.replace(/^\/+/, '')}`;
const widths = widthArg ? [Number(widthArg)] : WIDTHS;

function probe(url, width) {
  const target = `${ORIGIN}/tools/probe.html#url=${encodeURIComponent(url)}&w=${width}&h=900`;
  const dom = execFileSync(chrome, [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--virtual-time-budget=6000',
    '--window-size=1600,1000',
    '--dump-dom',
    target,
  ], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 1024 * 1024 * 16 });

  const match = dom.match(/<pre id="out">([\s\S]*?)<\/pre>/);
  if (!match) throw new Error('probe produced no output');
  const text = match[1]
    .replaceAll('&quot;', '"').replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>').replaceAll('&amp;', '&');
  if (text.trim() === 'pending') throw new Error('probe did not finish loading');
  return JSON.parse(text);
}

let failures = 0;

for (const width of widths) {
  let r;
  try {
    r = probe(page, width);
  } catch (err) {
    console.error(`  ${String(width).padStart(4)}px  PROBE FAILED  ${err.message}`);
    failures += 1;
    continue;
  }

  const viewportNote = r.viewportMatches ? '' : `  (viewport reported ${r.viewportWidth})`;
  const verdict = r.horizontalOverflow ? 'OVERFLOW' : 'ok';
  console.log(
    `  ${String(width).padStart(4)}px  ${verdict.padEnd(8)}`
    + ` scrollWidth=${r.scrollWidth} clientWidth=${r.clientWidth}`
    + ` height=${r.documentHeight}${viewportNote}`
  );

  if (r.horizontalOverflow || r.offenderCount) {
    failures += 1;
    for (const o of r.offenders) {
      console.log(`           ${o.tag}${o.cls ? '.' + o.cls.trim().split(/\s+/).join('.') : ''}`
        + `  left=${o.left} right=${o.right}`);
    }
    if (r.offenderCount > r.offenders.length) {
      console.log(`           ...and ${r.offenderCount - r.offenders.length} more`);
    }
  }
}

console.log(`\nmeasure: ${page} — ${failures === 0 ? 'no horizontal overflow at any width' : `${failures} width(s) with problems`}`);
process.exit(failures === 0 ? 0 : 1);
