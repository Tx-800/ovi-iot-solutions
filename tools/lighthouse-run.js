/* ==========================================================================
   lighthouse-run.js — Lighthouse, mobile, three runs, median reported.

   A single run on localhost varies by several points, so this runs three
   times and reports the median of each category. Mobile emulation and the
   CLI's default simulated throttling are both left alone.

   lighthouse is a devDependency and never ships.

   Usage: node tools/lighthouse-run.js [page] [runs]
   ========================================================================== */

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, unlinkSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const ORIGIN = process.env.OVI_ORIGIN || 'http://localhost:4321';

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
].filter(Boolean);
const chrome = CHROME_CANDIDATES.find((p) => existsSync(p));
if (!chrome) { console.error('lighthouse-run: no Chrome found.'); process.exit(1); }
process.env.CHROME_PATH = chrome;

const arg = process.argv[2];
const page = !arg || arg.includes(':') ? '/index.html' : `/${arg.replace(/^\/+/, '')}`;
const runs = Number(process.argv[3]) || 3;

const CATEGORIES = ['performance', 'accessibility', 'best-practices', 'seo'];
const cli = join(ROOT, 'node_modules', 'lighthouse', 'cli', 'index.js');
const results = [];

for (let i = 1; i <= runs; i += 1) {
  const out = join(ROOT, `.lh-${i}.json`);
  execFileSync(process.execPath, [
    cli,
    `${ORIGIN}${page}`,
    '--quiet',
    '--output=json',
    `--output-path=${out}`,
    '--only-categories=' + CATEGORIES.join(','),
    '--chrome-flags=--headless=new --disable-gpu --no-first-run',
  ], { stdio: ['ignore', 'ignore', 'inherit'], cwd: ROOT });

  const report = JSON.parse(readFileSync(out, 'utf8'));
  unlinkSync(out);

  const row = { run: i };
  for (const c of CATEGORIES) row[c] = Math.round(report.categories[c].score * 100);
  row.lcp = report.audits['largest-contentful-paint'].numericValue;
  row.cls = report.audits['cumulative-layout-shift'].numericValue;
  results.push(row);
  console.log(`  run ${i}:  perf ${row.perf ?? row.performance}  a11y ${row.accessibility}`
    + `  bp ${row['best-practices']}  seo ${row.seo}`
    + `  LCP ${(row.lcp / 1000).toFixed(2)}s  CLS ${row.cls.toFixed(3)}`);
}

const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
};

console.log(`\nlighthouse (mobile, default simulated throttling), median of ${runs} runs — ${page}`);
for (const c of CATEGORIES) {
  console.log(`  ${c.padEnd(15)} ${median(results.map((r) => r[c]))}`);
}
console.log(`  ${'LCP'.padEnd(15)} ${(median(results.map((r) => r.lcp)) / 1000).toFixed(2)}s`);
console.log(`  ${'CLS'.padEnd(15)} ${median(results.map((r) => r.cls)).toFixed(3)}`);
