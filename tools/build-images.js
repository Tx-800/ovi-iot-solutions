/* ==========================================================================
   build-images.js — the one photograph per solution/service page, end to end

   Fetch -> crop to 21:9 -> treat -> encode .webp -> write each page's
   <!-- @photo --> band -> write assets/img/CREDITS.md. Repeatable, so nobody
   hand-edits a JPEG. DESIGN.md §7.

   sharp is a devDependency. The outputs (.webp files, page markup,
   CREDITS.md) are committed, so the site still serves with node_modules
   deleted — same rule as build-css.js and build-icons.js.

   SOURCES
     Each image resolves its source in this order:
       1. assets/img/_src/<basename>.jpg            placed by hand — always wins
       2. assets/img/_src/<basename>.download.jpg   cached from a previous run
       3. fetched from IMAGES[].url, then cached as (2)
     .gitignore ignores only *.download.* — a hand-placed source is committable.

   SIZES
     -800w is 800 x 343, for phones: the band is ~380 CSS px wide there, and
     the photo is every page's LCP element, so a phone must not be handed the
     1240w. Lighthouse measured that rung as the difference between 93 and 97.
     @1x is 1240 x 531 (21:9 at the container width).
     @2x is emitted only when BOTH hold:
       - the cropped source is genuinely denser — at least 1.5x the @1x width —
         and it is never upscaled: its width is the smaller of 2480 and the
         source's own crop width. The Pexels downloads are 2400px wide, so
         their @2x is 2400w, not 2480w; the 1280px Pixabay source gets none.
       - it fits the 220 KB image budget at quality >= MIN_QUALITY. A 2x that
         only fits by smearing it is worse than the browser upscaling a good
         1x, so it is dropped rather than shipped over budget or degraded.

   TREATMENT — identical for every image, no per-image tuning:
     saturation x0.85, then a --navy-900 (#111B2E) multiply overlay at 18%.

   CROP — centred horizontally; vertically, the crop window sits FOCUS_Y of
     the way down the spare height (1/3 by default, biased toward the upper
     third). `focusY` per image overrides it — a re-crop is a data change here,
     not a hand edit.

   Usage: node tools/build-images.js [basename ...]
   ========================================================================== */

import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import sharp from 'sharp';

const ROOT = resolve(import.meta.dirname, '..');
const SRC_DIR = join(ROOT, 'assets', 'img', '_src');
const OUT_DIR = join(ROOT, 'assets', 'img');

const W1 = 1240;
/* A smaller rung for phones. On a 412px phone the band is ~380 CSS px, about
   665 device px at DPR 1.75 — without this the smallest file on offer was the
   1240w, and the photo is the LCP element on every page. */
const WS = 800;
const HS = Math.round(WS * 531 / 1240);
const H1 = 531;                  /* 1240 * 9/21, rounded */
const RATIO = W1 / H1;
const W2_MAX = 2480;
const MIN_2X_SOURCE = W1 * 1.5;  /* below this, a "2x" adds nothing honest */
const MAX_BYTES = 220_000;        /* ARCHITECTURE.md §7 — decimal kB, the stricter reading */
const FOCUS_Y = 1 / 3;
const MIN_QUALITY = 50;          /* below this the artefacts show; not worth serving */

const SATURATION = 0.85;
const OVERLAY = { r: 0x11, g: 0x1b, b: 0x2e, alpha: 0.18 };   /* --navy-900 @ 18% */

const pexels = (id) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=2400`;

const IMAGES = [
  {
    basename: 'smart-water-metering', page: 'solutions/smart-water-metering.html',
    url: pexels(11658940), source: 'Pexels', pageUrl: 'https://www.pexels.com/photo/11658940/',
    title: 'Close-up Photo of Water Meters', photographer: 'Jan van der Wolf',
    alt: 'A bank of water meters set into a concrete wall, connected by pipework',
    focusY: 0.5,   /* upper-third bias sliced the yellow meter at the bottom edge */
  },
  {
    basename: 'smart-street-lighting', page: 'solutions/smart-street-lighting.html',
    url: pexels(9920643), source: 'Pexels', pageUrl: 'https://www.pexels.com/photo/9920643/',
    title: 'Road and Street Lights at Night', photographer: 'Elias Tigiser',
    alt: 'An empty road at night lit by streetlights diffusing through fog',
    focusY: 0.6,   /* upper-third kept the lamps but cut the road the alt text describes */
  },
  {
    basename: 'water-leak-detection', page: 'solutions/water-leak-detection.html',
    url: pexels(17882790), source: 'Pexels', pageUrl: 'https://www.pexels.com/photo/17882790/',
    title: 'Water Overflowing from Pipe', photographer: 'Orhan Akbaba',
    alt: 'A large pipeline discharging water onto dry open ground',
  },
  {
    basename: 'water-quality-monitoring', page: 'solutions/water-quality-monitoring.html',
    url: pexels(7937300), source: 'Pexels', pageUrl: 'https://www.pexels.com/photo/7937300/',
    title: 'Steel Pipes with Pressure Gauge', photographer: 'Pavel Danilyuk',
    alt: 'Steel pipework with an analogue pressure gauge mounted on the line',
  },
  {
    basename: 'water-level-monitoring', page: 'solutions/water-level-monitoring.html',
    url: 'https://cdn.pixabay.com/photo/2021/08/08/18/33/water-level-meter-6531617_1280.jpg',
    source: 'Pixabay', pageUrl: 'https://pixabay.com/photos/water-level-meter-6531617/',
    title: 'Water Level Meter', photographer: 'xesisex',
    alt: 'A water level measuring gauge mounted in an open water channel',
  },
  {
    basename: 'people-asset-tracking', page: 'solutions/people-asset-tracking.html',
    url: pexels(4481326), source: 'Pexels', pageUrl: 'https://www.pexels.com/photo/4481326/',
    title: 'Photo of Warehouse', photographer: 'Tiger Lily',
    alt: 'A warehouse interior with racking bays of stacked pallets',
    focusY: 0.8,   /* upper-third was two-thirds ceiling; the pallets are the subject */
  },
  {
    basename: 'atex-zone-sensors', page: 'solutions/atex-zone-sensors.html',
    url: pexels(5884386), source: 'Pexels', pageUrl: 'https://www.pexels.com/photo/5884386/',
    title: 'Inside a Petrochemical Industry', photographer: '龔 月強',
    alt: 'Refinery pipework and steel structures under an overcast sky',
  },
  {
    basename: 'consultancy-tender-preparation', page: 'services/consultancy-tender-preparation.html',
    url: pexels(4134179), source: 'Pexels', pageUrl: 'https://www.pexels.com/photo/4134179/',
    title: 'White Ruler on White Printed Paper', photographer: 'John Guccione (www.advergroup.com)',
    alt: 'Technical drawings laid flat with a scale ruler across them',
  },
  {
    basename: 'rf-planning-site-survey', page: 'services/rf-planning-site-survey.html',
    url: pexels(12005160), source: 'Pexels', pageUrl: 'https://www.pexels.com/photo/12005160/',
    title: 'Photo of a Landscape with Electric Line and Transmission Towers', photographer: 'Robert So',
    alt: 'Transmission towers carrying lines across open terrain toward distant hills',
    focusY: 0.1,   /* upper-third cut the tower crossarm off at the top edge */
  },
];

/* --- Source ---------------------------------------------------------------- */

async function sourceFor(img) {
  const hand = join(SRC_DIR, `${img.basename}.jpg`);
  if (existsSync(hand)) return { path: hand, origin: 'hand-placed' };

  const cached = join(SRC_DIR, `${img.basename}.download.jpg`);
  if (existsSync(cached)) return { path: cached, origin: 'cached download' };

  const res = await fetch(img.url, { headers: { 'User-Agent': 'Mozilla/5.0 (ovi-website build-images)' } });
  if (!res.ok) throw new Error(`${img.basename}: HTTP ${res.status} fetching ${img.url}`);
  writeFileSync(cached, Buffer.from(await res.arrayBuffer()));
  return { path: cached, origin: 'downloaded' };
}

/* --- Crop ------------------------------------------------------------------ */

function cropBox(width, height, focusY) {
  if (width / height > RATIO) {
    const w = Math.round(height * RATIO);
    return { left: Math.round((width - w) / 2), top: 0, width: w, height };
  }
  const h = Math.round(width / RATIO);
  return { left: 0, top: Math.round((height - h) * focusY), width, height: h };
}

/* --- Treat + encode -------------------------------------------------------- */

async function render(srcPath, box, width, height) {
  const overlay = await sharp({
    create: { width, height, channels: 4, background: OVERLAY },
  }).png().toBuffer();

  const treated = await sharp(srcPath)
    .rotate()                               /* honour EXIF orientation */
    .extract(box)
    .resize(width, height, { fit: 'fill', kernel: 'lanczos3' })
    .modulate({ saturation: SATURATION })
    .composite([{ input: overlay, blend: 'multiply' }])
    .toColourspace('srgb')
    .png()
    .toBuffer();

  /* Highest quality that clears the 220 KB budget, never below MIN_QUALITY.
     Returns null when it cannot be done; the caller decides what that means —
     fatal for the 1x, "ship no 2x" for the 2x. */
  for (let q = 82; q >= MIN_QUALITY; q -= 4) {
    const buf = await sharp(treated).webp({ quality: q, effort: 6 }).toBuffer();
    if (buf.length <= MAX_BYTES) return { buf, quality: q };
  }
  return null;
}

/* --- Page markup ----------------------------------------------------------- */

const OPEN = '<!-- @photo -->';
const CLOSE = '<!-- /@photo -->';

/* Loading strategy — eager, default priority. Measured, not assumed.

   The band sits straight after a slim page-head, which puts its top edge
   389-596px down on all nine pages at every viewport measured (375x812
   through 1440x900). It is above the fold, so it is the page's LCP element.

   Lighthouse mobile, median of 3, with the 800w rung in place:
     eager + fetchpriority=high   metering 96 (LCP 2.71s)  leak 97 (2.42s)
     loading=lazy                metering 97 (LCP 2.42s)  leak 98 (2.34s)  but FAILS "LCP image lazily loaded"
     eager, default priority     metering 97 (LCP 2.57s)  leak 97 (2.41s)  <- chosen

   High priority loses because, under simulated 4G, it competes with the
   critical CSS and font. Lazy matches eager on score in the lab, but on a
   real device it holds an above-the-fold fetch until after layout. Plain
   eager is within noise of the best score and passes every audit.

   Re-check with tools/fold-probe.html if the page-head ever grows. */
const LOADING = 'decoding="async"';

function bandHTML(img, has2x, w2) {
  const base = `/assets/img/${img.basename}`;
  const srcset = [`${base}-${WS}w.webp ${WS}w`, `${base}.webp ${W1}w`]
    .concat(has2x ? [`${base}@2x.webp ${w2}w`] : [])
    .join(', ');
  const alt = img.alt.replaceAll('&', '&amp;').replaceAll('"', '&quot;');
  return [
    '',
    '    <div class="section section--tight media-band">',
    '      <div class="container">',
    `        <img class="media-band__img" src="${base}.webp"`,
    `             srcset="${srcset}"`,
    '             sizes="(min-width: 1240px) 1176px, (min-width: 800px) calc(100vw - 4rem), calc(100vw - 2rem)"',
    `             width="${W1}" height="${H1}" alt="${alt}" ${LOADING}>`,
    '      </div>',
    '    </div>',
    '    ',
  ].join('\n');
}

function placeInPage(img, has2x, w2) {
  const file = join(ROOT, img.page);
  let html = readFileSync(file, 'utf8');

  /* First run: put the marker pair straight after the page-head section, so
     the band sits between the lead and the first content section. */
  if (!html.includes(OPEN)) {
    const head = html.indexOf('page-head');
    const end = html.indexOf('</section>', head);
    if (head === -1 || end === -1) throw new Error(`${img.page}: no page-head section to place the band after`);
    const at = end + '</section>'.length;
    html = `${html.slice(0, at)}\n\n    ${OPEN}\n    ${CLOSE}${html.slice(at)}`;
  }

  const start = html.indexOf(OPEN) + OPEN.length;
  const stop = html.indexOf(CLOSE);
  html = html.slice(0, start) + bandHTML(img, has2x, w2) + html.slice(stop);
  writeFileSync(file, html, 'utf8');
}

/* --- Credits ---------------------------------------------------------------- */

function writeCredits() {
  const row = (i) => `| \`${i.basename}.webp\` | ${i.source} | [${i.title}](${i.pageUrl}) | ${i.photographer} |`;
  const pex = IMAGES.filter((i) => i.source === 'Pexels');
  const pix = IMAGES.filter((i) => i.source === 'Pixabay');
  const out = `# Photography credits

Generated by \`tools/build-images.js\` — edit the IMAGES table there, not this file.

Attribution is **not required** by either licence. This file exists so a future maintainer can trace
where every photograph came from. All nine are cropped to 21:9 and given the same treatment
(DESIGN.md §7): saturation ×0.85, then a \`--navy-900\` multiply overlay at 18%.

## Pexels — ${pex.length} images, [Pexels License](https://www.pexels.com/license/)

Free for commercial use, no attribution required.

| File | Source | Original | Photographer |
|---|---|---|---|
${pex.map(row).join('\n')}

## Pixabay — ${pix.length} image, [Pixabay Content License](https://pixabay.com/service/license-summary/)

Free for commercial use, no attribution required. The source is 1280px wide, so this one ships at
800w and 1240w only: no @2x variant, because one could only be made by upscaling.

| File | Source | Original | Uploader |
|---|---|---|---|
${pix.map(row).join('\n')}
`;
  writeFileSync(join(OUT_DIR, 'CREDITS.md'), out, 'utf8');
}

/* --- Run ------------------------------------------------------------------- */

mkdirSync(SRC_DIR, { recursive: true });

const only = process.argv.slice(2);
const todo = only.length ? IMAGES.filter((i) => only.includes(i.basename)) : IMAGES;
if (only.length && todo.length !== only.length) {
  console.error(`build-images: unknown basename in ${only.join(', ')}`);
  process.exit(1);
}

for (const img of todo) {
  const src = await sourceFor(img);
  const meta = await sharp(src.path).rotate().metadata();
  /* .rotate() with no args applies EXIF orientation; metadata() reports the
     stored size, so swap for 90-degree orientations. */
  const swap = meta.orientation >= 5;
  const sw = swap ? meta.height : meta.width;
  const sh = swap ? meta.width : meta.height;
  const box = cropBox(sw, sh, img.focusY ?? FOCUS_Y);

  const one = await render(src.path, box, W1, H1);
  if (!one) throw new Error(`${img.basename}: 1240w cannot fit ${MAX_BYTES} bytes at q${MIN_QUALITY}+`);
  writeFileSync(join(OUT_DIR, `${img.basename}.webp`), one.buf);

  const small = await render(src.path, box, WS, HS);
  writeFileSync(join(OUT_DIR, `${img.basename}-${WS}w.webp`), small.buf);

  /* A 2x ships only if the source is genuinely denser AND it fits the image
     budget at a quality worth serving. Failing either means 1240w only: a
     browser upscaling a good 1240w beats a smeared or oversized 2x. */
  let w2 = 0;
  let two = null;
  let why2x = 'source too small to be honestly denser';
  if (box.width >= MIN_2X_SOURCE) {
    w2 = Math.min(W2_MAX, box.width - (box.width % 2));
    two = await render(src.path, box, w2, Math.round(w2 / RATIO));
    if (!two) why2x = `${w2}w cannot fit 220 KB at q${MIN_QUALITY}+`;
  }
  const has2x = Boolean(two);
  const twoPath = join(OUT_DIR, `${img.basename}@2x.webp`);
  if (has2x) {
    writeFileSync(twoPath, two.buf);
  } else if (existsSync(twoPath)) {
    rmSync(twoPath);   /* never leave an @2x behind that the page no longer references */
  }

  placeInPage(img, has2x, w2);

  console.log(
    `${img.basename.padEnd(31)} ${sw}x${sh} (${src.origin}) crop ${box.width}x${box.height}@${box.left},${box.top}`
    + `  ${WS}w ${(small.buf.length / 1024).toFixed(0)} KB  1x ${(one.buf.length / 1024).toFixed(0)} KB q${one.quality}`
    + (two ? `  2x ${w2}w ${(two.buf.length / 1024).toFixed(0)} KB q${two.quality}` : `  2x none — ${why2x}`),
  );
}

writeCredits();
console.log(`build-images: ${todo.length} image(s), assets/img/CREDITS.md written`);
