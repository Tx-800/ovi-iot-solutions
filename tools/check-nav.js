/* ==========================================================================
   check-nav.js — asserts the header's keyboard and no-JavaScript behaviour.

   Drives tools/nav-harness.html in headless Chrome and prints each assertion.
   This covers the Phase 2 gate in TODO.md — keyboard-only menu operation, Esc
   closing the drawer, and a nav that works with scripting disabled — as
   measurements rather than claims.

   Requires the dev server running (npx serve . -l 4321) and a local Chrome.

   Usage: node tools/check-nav.js [page]
   ========================================================================== */

import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const ORIGIN = process.env.OVI_ORIGIN || 'http://localhost:4321';

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
  console.error('check-nav: no Chrome found. Set CHROME_PATH to a Chrome or Edge binary.');
  process.exit(1);
}

const arg = process.argv[2];
const page = !arg || arg.includes(':') ? '/index.html' : `/${arg.replace(/^\/+/, '')}`;

const dom = execFileSync(chrome, [
  '--headless=new',
  '--disable-gpu',
  '--no-first-run',
  '--no-default-browser-check',
  '--virtual-time-budget=15000',
  '--window-size=1400,1000',
  '--dump-dom',
  `${ORIGIN}/tools/nav-harness.html#url=${encodeURIComponent(page)}`,
], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 1024 * 1024 * 32 });

const match = dom.match(/<pre id="out">([\s\S]*?)<\/pre>/);
if (!match) {
  console.error('check-nav: harness produced no output');
  process.exit(1);
}

const text = match[1]
  .replaceAll('&quot;', '"').replaceAll('&lt;', '<')
  .replaceAll('&gt;', '>').replaceAll('&amp;', '&');

if (text.trim() === 'pending') {
  console.error('check-nav: harness did not finish');
  process.exit(1);
}

const report = JSON.parse(text);

console.log(`check-nav: ${report.url}\n`);
for (const r of report.results) {
  const mark = r.pass ? 'pass' : 'FAIL';
  console.log(`  ${mark}  ${r.name}${r.detail ? `  — ${r.detail}` : ''}`);
}
console.log(`\ncheck-nav: ${report.passed} passed, ${report.failed} failed.`);

process.exit(report.failed === 0 ? 0 : 1);
