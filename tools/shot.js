/* ==========================================================================
   shot.js — screenshots at a true viewport width.

   Chrome's --window-size crops rather than reflows below roughly 500px on
   Windows, so a naive 375px screenshot looks like overflow that isn't there.
   This renders the page inside tools/probe.html at an exact CSS width and
   captures that instead.

   Requires the dev server running (npx serve . -l 4321) and a local Chrome.

   Usage:
     node tools/shot.js                          # home at 375 and 1440
     node tools/shot.js solutions.html           # that page at 375 and 1440
     node tools/shot.js index.html 414 1200      # one width, explicit height

   Writes PNGs to the directory in OVI_SHOT_DIR, or ./.shots.
   ========================================================================== */

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ORIGIN = process.env.OVI_ORIGIN || 'http://localhost:4321';
const OUT_DIR = resolve(process.env.OVI_SHOT_DIR || join(import.meta.dirname, '..', '.shots'));

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
  console.error('shot: no Chrome found. Set CHROME_PATH to a Chrome or Edge binary.');
  process.exit(1);
}

const [pageArg, widthArg, heightArg] = process.argv.slice(2);
const page = !pageArg || pageArg.includes(':') ? '/' : `/${pageArg.replace(/^\/+/, '')}`;
const widths = widthArg ? [Number(widthArg)] : [375, 1440];
const height = Number(heightArg) || 2400;   // tall enough to catch a whole page

mkdirSync(OUT_DIR, { recursive: true });

const slug = page === '/' ? 'index' : page.replace(/^\//, '').replace(/\.html$/, '').replaceAll('/', '-');

for (const width of widths) {
  const file = join(OUT_DIR, `${slug}-${width}.png`);
  const target = `${ORIGIN}/tools/probe.html#url=${encodeURIComponent(page)}&w=${width}&h=${height}&shot=1`;

  execFileSync(chrome, [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--hide-scrollbars',
    '--force-device-scale-factor=1',
    '--virtual-time-budget=8000',
    `--window-size=${width},${height}`,
    `--screenshot=${file}`,
    target,
  ], { stdio: ['ignore', 'ignore', 'ignore'] });

  console.log(`shot: ${page} @ ${width}px -> ${file}`);
}
