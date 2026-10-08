/* ==========================================================================
   sync-partials.js — keeps every page in sync from partials/

   For each page it:
     1. replaces everything between <!-- @include x --> and <!-- /@include x -->
        with partials/x.html,
     2. deletes elements marked data-requires / data-requires-any whose value in
        js/site.config.js is still a placeholder,
     3. bakes {{token}} values into href, text and attributes, so the phone,
        email and address are present with JavaScript disabled,
     4. stamps aria-current="page" on the nav link for that page,
     5. writes the canonical URL, Open Graph tags and JSON-LD into the
        <!-- @generated meta --> region.

   It is idempotent by construction: every run rebuilds the managed regions
   from source rather than editing what is already there, so a second run
   produces no diff.

   It refuses to write a page that still contains an unresolved {{token}} or a
   placeholder string, which is what keeps REPLACE_ME out of shipped HTML.

   Usage: node tools/sync-partials.js [--check]
     --check  report what would change and exit 1 if anything would, or if
              SITE.url is still a placeholder (not shippable), without
              writing. Useful in the verification loop.
   ========================================================================== */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve, relative } from 'node:path';
import { SITE } from '../js/site.config.js';

const ROOT = resolve(import.meta.dirname, '..');
const PARTIALS_DIR = join(ROOT, 'partials');
const SKIP_DIRS = new Set(['docs', 'node_modules', '.git', 'partials', 'tools', '.shots', 'dist']);
const CHECK_ONLY = process.argv.includes('--check');

/* --- Which values are real yet -------------------------------------------- */

/** A value is "unset" when it is empty, still says REPLACE_ME, or is one of
 *  the all-zero dialling placeholders in PRD.md §6. */
function isUnset(value) {
  if (value === null || value === undefined) return true;
  const s = String(value).trim();
  if (s === '') return true;
  if (/REPLACE_ME/i.test(s)) return true;
  if (/^\+?[0\s().-]+$/.test(s)) return true;
  return false;
}

function read(path) {
  return path.split('.').reduce((v, k) => (v == null ? undefined : v[k]), SITE);
}

const addressParts = () => {
  const a = SITE.address || {};
  return [a.line1, a.line2, a.city, a.region, a.postal, a.country].filter((p) => !isUnset(p));
};

const addressLine = () => addressParts().join(', ');

/** Everything a {{token}} can resolve to, plus whether it is usable yet. */
const VALUES = {
  name:     SITE.name,
  shortName: SITE.shortName,
  tagline:  SITE.tagline,
  url:      SITE.url,
  email:    SITE.email,
  phone:    SITE.phone,
  hours:    SITE.hours,
  address:  addressLine(),
  year:     String(new Date().getFullYear()),
  tel:      isUnset(SITE.phoneRaw) ? '' : `tel:${SITE.phoneRaw}`,
  mailto:   isUnset(SITE.email) ? '' : `mailto:${SITE.email}`,
  whatsapp: isUnset(SITE.whatsapp)
    ? ''
    : `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(SITE.whatsappMessage || '')}`,
  'social.linkedin': SITE.social?.linkedin,
  'social.x':        SITE.social?.x,
  'social.youtube':  SITE.social?.youtube,

  /* Contact page (Phase 5). */
  web3formsKey:     SITE.web3formsKey,
  'address.line1':  SITE.address?.line1,
  'address.line2':  SITE.address?.line2,
  'address.city':   SITE.address?.city,
  'address.region': SITE.address?.region,
  'address.postal': SITE.address?.postal,
  'address.country': SITE.address?.country,
  /* Web3Forms only redirects a plain-HTML (no-JS) submission to an ABSOLUTE,
     same-domain URL — a relative path is documented as not working — so this
     only exists once SITE.url is real. #sent shows the CSS-only success note. */
  contactSent: isUnset(SITE.url) ? '' : `${SITE.url.replace(/\/+$/, '')}/contact.html#sent`,
  ...mapValues(),
};

/** The office map. 0,0 is the placeholder in PRD.md §6, and a pin in the
 *  Gulf of Guinea is worse than no map, so 0,0 counts as unset. */
function mapValues() {
  const lat = Number(SITE.map?.lat);
  const lng = Number(SITE.map?.lng);
  const zoom = Number(SITE.map?.zoom) || 15;
  const set = Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0);
  return {
    map: set ? `${lat},${lng}` : '',
    'map.lat': set ? String(lat) : '',
    'map.lng': set ? String(lng) : '',
    'map.zoom': String(zoom),
    osmUrl: set ? `https://www.openstreetmap.org/?mlat=${lat}&amp;mlon=${lng}#map=${zoom}/${lat}/${lng}` : '',
  };
}

/* `address` is unset when every part is; `phone`/`whatsapp` follow their raw form. */
const UNSET = new Set(
  Object.keys(VALUES).filter((k) => isUnset(VALUES[k]))
);
if (addressParts().length === 0) UNSET.add('address');
if (isUnset(SITE.phoneRaw)) UNSET.add('phone');
if (isUnset(SITE.whatsapp)) UNSET.add('whatsapp');

const isUnsetKey = (key) => UNSET.has(key);

/* --- HTML helpers ---------------------------------------------------------
   Deliberately string-based: this script must run with node_modules deleted
   (ARCHITECTURE.md §1), so it cannot depend on an HTML parser. The markup it
   edits is markup this repository authors, not arbitrary HTML. */

const VOID_TAGS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr',
]);

/** Remove each element whose opening tag matches `attrRe`, with its subtree. */
function removeElements(html, attrRe, shouldRemove) {
  let out = html;
  let guard = 0;

  while (guard++ < 500) {
    const openTag = new RegExp(`<([a-zA-Z][\\w-]*)\\b[^>]*?\\s${attrRe}\\s*=\\s*"([^"]*)"[^>]*>`);
    const m = openTag.exec(out);
    if (!m) break;

    const [full, tagName, attrValue] = m;
    const start = m.index;

    if (!shouldRemove(attrValue)) {
      /* Keep it, but drop the build-time attribute so it never ships. */
      const cleaned = full.replace(new RegExp(`\\s${attrRe}\\s*=\\s*"[^"]*"`), '');
      out = out.slice(0, start) + cleaned + out.slice(start + full.length);
      continue;
    }

    if (VOID_TAGS.has(tagName.toLowerCase()) || full.endsWith('/>')) {
      out = out.slice(0, start) + out.slice(start + full.length);
      continue;
    }

    /* Walk forward to the matching close tag, counting nested same-name tags. */
    const scanner = new RegExp(`<(/?)${tagName}\\b[^>]*?(/?)>`, 'gi');
    scanner.lastIndex = start + full.length;
    let depth = 1;
    let end = -1;
    let hit;

    while ((hit = scanner.exec(out)) !== null) {
      const isClose = hit[1] === '/';
      const selfClosing = hit[2] === '/';
      if (selfClosing) continue;
      depth += isClose ? -1 : 1;
      if (depth === 0) { end = hit.index + hit[0].length; break; }
    }

    if (end === -1) {
      throw new Error(`sync-partials: unbalanced <${tagName}> while removing ${attrRe}`);
    }

    /* Take the whitespace before it too, so removal leaves no blank line. */
    let from = start;
    while (from > 0 && (out[from - 1] === ' ' || out[from - 1] === '\n')) from -= 1;
    out = out.slice(0, from) + out.slice(end);
  }

  return out;
}

function replaceRegion(html, openMarker, closeMarker, body, { file }) {
  const start = html.indexOf(openMarker);
  const end = html.indexOf(closeMarker);
  if (start === -1 || end === -1) return html;
  if (end < start) throw new Error(`sync-partials: markers out of order in ${file}`);

  return html.slice(0, start + openMarker.length)
    + body
    + html.slice(end);
}

const stripTags = (s) => s.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

function decode(s) {
  return s.replaceAll('&amp;', '&').replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>').replaceAll('&quot;', '"')
    .replaceAll('&rsquo;', '’').replaceAll('&middot;', '·')
    .replaceAll('&copy;', '©');
}

const jsonEscape = (s) => JSON.stringify(String(s));

/* --- Gather ---------------------------------------------------------------- */

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

const partials = new Map();
for (const entry of readdirSync(PARTIALS_DIR)) {
  if (!entry.endsWith('.html')) continue;
  const name = entry.replace(/\.html$/, '');
  let body = readFileSync(join(PARTIALS_DIR, entry), 'utf8');
  /* Drop the partial's own explanatory header comment — it documents the
     source file and has no business in 16 shipped pages. */
  body = body.replace(/^\s*<!--[\s\S]*?-->\s*\n/, '');
  /* The closing marker carries its own indentation, so the body ends with a
     bare newline — otherwise the marker drifts two spaces right on every run. */
  partials.set(name, '\n' + body.replace(/\s*$/, '') + '\n');
}

/* --- Per-page generation --------------------------------------------------- */

const SITE_URL_READY = !isUnsetKey('url');
const siteOrigin = SITE_URL_READY ? SITE.url.replace(/\/+$/, '') : '';

/** "/", "/about.html", "/solutions/smart-water-metering.html" */
function sitePath(file) {
  const rel = relative(ROOT, file).replaceAll('\\', '/');
  return rel === 'index.html' ? '/' : `/${rel}`;
}

const SECTIONS = {
  solutions: { path: '/solutions.html', name: 'Our solutions' },
  services:  { path: '/services.html', name: 'Consultancy & RF planning' },
};

function breadcrumbFor(file, h1) {
  const rel = relative(ROOT, file).replaceAll('\\', '/');
  if (rel === 'index.html' || rel === '404.html') return null;

  const crumbs = [{ name: 'Home', path: '/' }];
  const dir = rel.includes('/') ? rel.split('/')[0] : null;
  if (dir && SECTIONS[dir]) crumbs.push(SECTIONS[dir]);
  crumbs.push({ name: CRUMB_NAMES[rel] || h1, path: `/${rel}` });
  return crumbs;
}

/* Pages whose H1 is a sentence rather than a name. The trail (and the
   BreadcrumbList JSON-LD built from it) uses the nav label instead. */
const CRUMB_NAMES = {
  'contact.html': 'Contact',
};

/** The visible breadcrumb trail, built from the same breadcrumbFor() data as
 *  the BreadcrumbList JSON-LD, so the two can never drift apart. Root-relative
 *  hrefs, so — unlike the JSON-LD — it renders correctly even before
 *  SITE.url is real. Returns '' for pages breadcrumbFor() excludes
 *  (Home, 404), which is how the marker ends up empty on those two pages. */
function breadcrumbsHTML(file, html) {
  const h1 = decode(stripTags((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1] || ''));
  const crumbs = breadcrumbFor(file, h1);
  if (!crumbs) return '';

  const items = crumbs.map((c, i) => {
    const last = i === crumbs.length - 1;
    const label = escapeHtml(c.name);
    return last
      ? `      <li class="breadcrumbs__item" aria-current="page">${label}</li>`
      : `      <li class="breadcrumbs__item"><a href="${c.path}">${label}</a></li>`;
  });

  return [
    '',
    '    <nav class="breadcrumbs" aria-label="Breadcrumb">',
    '      <ol class="breadcrumbs__list" role="list">',
    ...items,
    '      </ol>',
    '    </nav>',
    '  ',
  ].join('\n');
}

const escapeHtml = (s) => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

function generatedMeta(file, html) {
  const title = decode((html.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '');
  const desc = decode((html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '');
  const h1 = decode(stripTags((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1] || ''));
  const path = sitePath(file);
  const rel = relative(ROOT, file).replaceAll('\\', '/');

  if (!SITE_URL_READY) {
    /* Without a domain, canonical, og:url and og:image cannot be absolute and
       JSON-LD would carry a placeholder. Emit only what is domain-free. */
    return [
      '',
      '  <meta property="og:type" content="website">',
      `  <meta property="og:site_name" content="${SITE.name}">`,
      `  <meta property="og:title" content="${title.replaceAll('"', '&quot;')}">`,
      `  <meta property="og:description" content="${desc.replaceAll('"', '&quot;')}">`,
      '  <meta name="twitter:card" content="summary_large_image">',
      '  ',
    ].join('\n');
  }

  const canonical = `${siteOrigin}${path}`;
  /* The 404 page is served at whatever URL was missed, so it has no URL of
     its own to declare: no canonical, no og:url. It is noindex anyway. */
  const notFound = rel === '404.html';
  const lines = [
    '',
    ...(notFound ? [] : [`  <link rel="canonical" href="${canonical}">`]),
    '  <meta property="og:type" content="website">',
    `  <meta property="og:site_name" content="${SITE.name}">`,
    `  <meta property="og:title" content="${title.replaceAll('"', '&quot;')}">`,
    `  <meta property="og:description" content="${desc.replaceAll('"', '&quot;')}">`,
    ...(notFound ? [] : [`  <meta property="og:url" content="${canonical}">`]),
    `  <meta property="og:image" content="${siteOrigin}/assets/brand/og-image.jpg">`,
    '  <meta name="twitter:card" content="summary_large_image">',
  ];

  const blocks = [];

  if (rel === 'index.html') {
    const org = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: SITE.name,
      url: siteOrigin,
      logo: `${siteOrigin}/assets/brand/ovi-logo.png`,
      description: SITE.tagline,
    };
    if (!isUnsetKey('email') || !isUnsetKey('phone')) {
      org.contactPoint = {
        '@type': 'ContactPoint',
        contactType: 'sales',
        ...(isUnsetKey('email') ? {} : { email: SITE.email }),
        ...(isUnsetKey('phone') ? {} : { telephone: SITE.phoneRaw }),
      };
    }
    if (!isUnsetKey('address')) {
      const a = SITE.address;
      org.address = {
        '@type': 'PostalAddress',
        ...(isUnset(a.line1) ? {} : { streetAddress: [a.line1, a.line2].filter((p) => !isUnset(p)).join(', ') }),
        ...(isUnset(a.city) ? {} : { addressLocality: a.city }),
        ...(isUnset(a.region) ? {} : { addressRegion: a.region }),
        ...(isUnset(a.postal) ? {} : { postalCode: a.postal }),
        ...(isUnset(a.country) ? {} : { addressCountry: a.country }),
      };
    }
    blocks.push(org);
    blocks.push({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE.name,
      url: siteOrigin,
    });
  }

  const crumbs = breadcrumbFor(file, h1);
  if (crumbs) {
    blocks.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: crumbs.map((c, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: c.name,
        item: `${siteOrigin}${c.path}`,
      })),
    });
  }

  /* Every solution and service detail page is a Service (PRD.md §9). Name and
     description come from the page itself — nothing is invented here. */
  if (/^(solutions|services)\//.test(rel) && h1) {
    blocks.push({
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: h1,
      description: desc,
      url: canonical,
      provider: { '@type': 'Organization', name: SITE.name, url: siteOrigin },
    });
  }

  for (const block of blocks) {
    lines.push(`  <script type="application/ld+json">${JSON.stringify(block)}</script>`);
  }

  lines.push('  ');
  return lines.join('\n');
}

/* --- Transform one page ---------------------------------------------------- */

function buildPage(file) {
  const original = readFileSync(file, 'utf8');
  let html = original;

  /* 1. Inject partials. */
  for (const [name, body] of partials) {
    html = replaceRegion(html, `<!-- @include ${name} -->`, `  <!-- /@include ${name} -->`, body, { file });
  }

  /* 2. Drop elements whose value is still a placeholder. */
  html = removeElements(html, 'data-requires-any', (value) =>
    value.split(/\s+/).filter(Boolean).every(isUnsetKey));
  html = removeElements(html, 'data-requires', (value) => isUnsetKey(value.trim()));

  /* 3. Bake {{token}} values. */
  html = html.replace(/\{\{([\w.]+)\}\}/g, (match, key) => {
    if (!(key in VALUES)) throw new Error(`sync-partials: unknown token {{${key}}} in ${relative(ROOT, file)}`);
    return String(VALUES[key] ?? '');
  });

  /* 4. aria-current on the nav link for this page. */
  const path = sitePath(file);
  if (path !== '/') {
    html = html.replace(
      new RegExp(`(<a\\b[^>]*\\shref="${path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}")`, 'g'),
      '$1 aria-current="page"'
    );
  }

  /* 5. Canonical, Open Graph, JSON-LD. */
  html = replaceRegion(html, '<!-- @generated meta -->', '  <!-- /@generated meta -->',
    generatedMeta(file, html), { file });

  /* 6. Visible breadcrumb trail — every page except Home and 404 (PRD.md §5).
     replaceRegion() is a no-op when a page carries no marker, which is how
     Home and 404 opt out: they simply never include it. */
  html = replaceRegion(html, '<!-- @breadcrumbs -->', '<!-- /@breadcrumbs -->',
    breadcrumbsHTML(file, html), { file });

  return { original, html };
}

/* --- Run ------------------------------------------------------------------- */

const pages = htmlFiles();
const changed = [];
const problems = [];

for (const file of pages) {
  const rel = relative(ROOT, file).replaceAll('\\', '/');
  let result;
  try {
    result = buildPage(file);
  } catch (err) {
    problems.push(`${rel}: ${err.message}`);
    continue;
  }

  const leftoverToken = result.html.match(/\{\{[\w.]+\}\}/);
  if (leftoverToken) {
    problems.push(`${rel}: unresolved token ${leftoverToken[0]}`);
    continue;
  }
  if (/REPLACE_ME/.test(result.html)) {
    problems.push(`${rel}: a placeholder value reached the page — mark its element with data-requires`);
    continue;
  }

  if (result.html !== result.original) {
    changed.push(rel);
    if (!CHECK_ONLY) writeFileSync(file, result.html, 'utf8');
  }
}

console.log(`sync-partials: ${pages.length} page(s), ${partials.size} partial(s).`);

const omitted = [...UNSET].sort();
if (omitted.length) {
  console.log(`  not yet set in js/site.config.js, so omitted from every page: ${omitted.join(', ')}`);
}
if (!SITE_URL_READY) {
  console.log('  SITE.url is a placeholder, so canonical, og:url, og:image and JSON-LD are not emitted.');
}

if (problems.length) {
  console.error(`\n${problems.length} problem(s):`);
  for (const p of problems) console.error(`  ${p}`);
  process.exit(1);
}

/* --check is a release gate as well as a drift check: pages built without a
   domain have no canonical, og:url or JSON-LD, so they are not shippable
   even when they are perfectly in sync. Plain runs (no --check) stay quiet
   about it, because building with placeholders is normal during development. */
if (CHECK_ONLY && !SITE_URL_READY) {
  console.error('\n  ✗ NOT SHIPPABLE: SITE.url in js/site.config.js is still a placeholder.');
  console.error('    Set it to the production domain, then run: node tools/sync-partials.js');
  if (changed.length) console.error(`    (also out of sync: ${changed.join(', ')})`);
  process.exit(1);
}

if (changed.length === 0) {
  console.log('  no changes — pages are in sync.');
  process.exit(0);
}

console.log(`  ${CHECK_ONLY ? 'would update' : 'updated'}: ${changed.length} page(s)`);
for (const c of changed) console.log(`    ${c}`);
process.exit(CHECK_ONLY ? 1 : 0);
