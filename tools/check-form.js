/* ==========================================================================
   check-form.js — the contact form, tested in a real browser.

   Drives tools/form-harness.html in headless Chrome: the no-JS native form,
   then blank submit, invalid email, a valid payload, server error, network
   failure, honeypot and a missing access key — asserting validation, focus,
   aria-invalid / aria-describedby and every message written to the aria-live
   status region. fetch is mocked inside the frame, so nothing is posted to
   Web3Forms.

   Requires the dev server (npx serve . -l 4321) and a local Chrome.
   Usage: node tools/check-form.js
   ========================================================================== */

import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const ORIGIN = process.env.OVI_ORIGIN || 'http://localhost:4321';
const chrome = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean).find((p) => existsSync(p));

if (!chrome) {
  console.error('check-form: no Chrome found. Set CHROME_PATH.');
  process.exit(1);
}

function runOnce() {
  const dom = execFileSync(chrome, [
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--virtual-time-budget=45000', '--window-size=1400,1300', '--dump-dom',
    `${ORIGIN}/tools/form-harness.html`,
  ], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 1024 * 1024 * 32 });

  const m = dom.match(/<pre id="out">([\s\S]*?)<\/pre>/);
  if (!m) throw new Error('harness produced no output');
  const text = m[1].replaceAll('&quot;', '"').replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&amp;', '&');
  if (text.trim() === 'pending') throw new Error('harness did not finish');
  return JSON.parse(text);
}

/* Same transient-frame-load retry as check-nav.js, scoped to that one
   failure so it cannot hide a real assertion failure. */
let report = runOnce();
if (report.failed === 1 && report.results.some((r) => !r.pass && /frame never loaded/.test(r.detail))) {
  console.error('check-form: a frame timed out loading — retrying once');
  report = runOnce();
}

console.log('check-form: /contact.html\n');
for (const r of report.results) {
  console.log(`  ${r.pass ? 'pass' : 'FAIL'}  ${r.name}${r.detail ? `  — ${r.detail}` : ''}`);
}
console.log(`\ncheck-form: ${report.passed} passed, ${report.failed} failed.`);
process.exit(report.failed === 0 ? 0 : 1);
