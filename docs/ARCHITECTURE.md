# ARCHITECTURE.md — OVI IoT Solutions

> Owns **how it is built**. Read `PRD.md` for content, `DESIGN.md` for visuals, `AGENTS.md` for process.

---

## 1. The stack — and the constraint that drives it

**Hard constraint: HTML + CSS + vanilla JavaScript only. No React. No build step required to view the site.**

### ⚠️ Read this before you reach for a component library

The brief names three libraries. Two of them **cannot be used directly**:

| Library | What it actually is | Verdict |
|---|---|---|
| **[Motion](https://motion.dev)** | Has a first-class **vanilla JS** API (`animate`, `scroll`, `inView`, `stagger`) shipped as an ESM bundle | ✅ **Use it.** This is our animation engine. |
| **[Kokonut UI](https://kokonutui.com)** | React + Next.js + Tailwind + shadcn/ui components. Ships `.tsx` files that require a React runtime. | ❌ **Cannot be imported.** Use as a *visual reference only*. |
| **[Bklit UI](https://ui.bklit.com)** | React charts library built on shadcn/ui + Recharts. Also `.tsx`. | ❌ **Cannot be imported.** Use as a *visual reference only*. |

**How to use the two React libraries correctly:** open them, look at the component you like, and
**re-implement the visual result in semantic HTML + our own CSS**. Take the layout, spacing, and
interaction idea. Do not try to port their class names, do not pull in Tailwind to chase them, and do
not install React "just for one component". Every such component on this site is ~30 lines of HTML and
~20 lines of CSS written against the tokens in `DESIGN.md`.

> If you ever find yourself writing `npm install react`, stop. You have taken a wrong turn.

### Why hand-authored CSS and not Tailwind

This is a **14-page static site with no component system**. Tailwind's value is that a component
abstraction keeps utility strings DRY — we have no components, so every utility string would be
duplicated 14 times by hand, and a design change would mean 14 find-and-replaces. A small token-driven
stylesheet is both faster to write and far faster to change here. It also keeps us inside the
performance budget in §7 without a build step.

**Do not add Tailwind.** If you want a utility, add it to `css/08-utilities.css`.

### Runtime dependencies — shipped to the browser

**This list is closed.** All CDN, all vanilla, all pinned.

| Purpose | Library | Delivery |
|---|---|---|
| Animation | **Motion** | `import { animate, inView, stagger, scroll } from "https://cdn.jsdelivr.net/npm/motion@12/+esm"` |
| Icons | **Lucide** | `<script src="https://cdn.jsdelivr.net/npm/lucide@latest/dist/umd/lucide.min.js">` then `lucide.createIcons()` |
| Map (Contact only) | **Leaflet** 1.9 + OpenStreetMap tiles | CSS + JS injected lazily on scroll-in, never on other pages |
| Form transport | **[Web3Forms](https://web3forms.com)** | `fetch` POST to `https://api.web3forms.com/submit` — free, no backend, no account server-side |
| Fonts | **Archivo**, **IBM Plex Mono** | Google Fonts, `display=swap`, `preconnect` |

**Pin every version in production** (`motion@12.x.x`, not `@latest`). `@latest` is fine while building,
but the Ship Gate requires pinned versions.

**Nothing else.** No jQuery, no Bootstrap, no GSAP, no AOS, no Swiper, no Alpine, no Chart.js, no
Font Awesome. If you believe you need another runtime dependency, write down why in `TODO.md` and
ask first.

### Dev tooling — never shipped

Tooling that measures or checks the site is **not** governed by the list above. It lives in
`package.json` as a `devDependency` or in `tools/`, and the browser never sees it.

| Purpose | Tool | Where |
|---|---|---|
| Performance / a11y / SEO audit | **lighthouse** | `devDependencies` |
| Accessibility rule engine | **axe-core** | `devDependencies` |
| Link + dead-href checking | `tools/check-links.js` | `tools/`, no dependencies |
| Partial injection and value baking | `tools/sync-partials.js` | `tools/`, no dependencies |
| Sitemap generation | `tools/build-sitemap.js` | `tools/`, no dependencies |
| True-viewport measurement and screenshots | `tools/probe.html`, `tools/measure.js`, `tools/shot.js` | `tools/`, drives a local Chrome |

**The rule that keeps this honest:** nothing in `package.json` may ever become a runtime dependency,
and **the site must still open and work with `node_modules` deleted**. If that ever stops being
true, a build step has been introduced and the brief is broken. A dev tool may *generate* a
committed asset, but the generated file must be checked in and the site must not need the tool to
serve it.

---

## 2. File tree

```
ovi-website/
├── index.html
├── about.html
├── technology.html
├── solutions.html
├── services.html
├── contact.html
├── 404.html
│
├── solutions/
│   ├── smart-water-metering.html
│   ├── smart-street-lighting.html
│   ├── water-leak-detection.html
│   ├── water-quality-monitoring.html
│   ├── water-level-monitoring.html
│   ├── people-asset-tracking.html
│   └── atex-zone-sensors.html
│
├── services/
│   ├── consultancy-tender-preparation.html
│   └── rf-planning-site-survey.html
│
├── css/
│   ├── 01-reset.css          modern reset, box-sizing, media defaults
│   ├── 02-tokens.css         every custom property from DESIGN.md §2–4
│   ├── 03-base.css           html/body, typography, links, focus-visible
│   ├── 04-layout.css         .container, .grid, .section, .split-7-5
│   ├── 05-components.css     buttons, cards, chips, forms, nav, footer, toast
│   ├── 06-sections.css       hero, pillars, solutions-grid, architecture, cta-band
│   ├── 07-pages.css          the few genuine page-specific overrides
│   ├── 08-utilities.css      .visually-hidden, .flow, .text-balance, spacing helpers
│   └── main.css              @import of the above, in order. This is the only <link>.
│
├── js/
│   ├── site.config.js        ⬅ THE ONLY place contact details live (PRD §6)
│   ├── main.js               entry: imports and boots the modules below
│   └── modules/
│       ├── nav.js            sticky header, mega-menu, mobile drawer, focus trap
│       ├── motion.js         Motion One setup + reduced-motion guard
│       ├── hero-plot.js      the coverage-plot entrance (index only)
│       ├── architecture.js   packet flow on scroll-in
│       ├── form.js           validation + Web3Forms submit + states
│       ├── map.js            lazy Leaflet init (contact only)
│       ├── config.js         hydrateSiteConfig() — writes SITE into [data-site] nodes
│       └── ui.js             back-to-top, copy-email toast, WhatsApp FAB, accordions
│
├── assets/
│   ├── brand/                ⬅ SUPPLIED. Do not regenerate or edit these.
│   │   ├── ovi-logo.png              transparent, 658×285 master
│   │   ├── ovi-logo-{1200,600,320,160}.png
│   │   ├── ovi-mark.png              infinity + wifi mark only
│   │   ├── favicon.ico               16/32/48/64
│   │   ├── favicon-16.png  favicon-32.png
│   │   ├── apple-touch-icon.png      180×180
│   │   ├── icon-192.png  icon-512.png  icon-512-maskable.png
│   │   └── og-image.jpg              1200×630 social card
│   ├── img/                  photography, .webp, explicit dimensions
│   └── icons/                any hand-drawn SVG not covered by Lucide
│
├── partials/                 source of truth for repeated markup (§4)
│   ├── head.html  header.html  footer.html  cta-band.html
│   ├── why-ovi.html  pillars.html  solutions-grid.html
│
├── tools/
│   ├── sync-partials.js      injects partials into every page + bakes SITE values
│   └── build-sitemap.js      regenerates sitemap.xml from the page list
│
├── site.webmanifest
├── robots.txt
├── sitemap.xml
├── README.md
└── docs/                     PRD.md, DESIGN.md, ARCHITECTURE.md, AGENTS.md, TODO.md
```

---

## 3. HTML conventions

Every page starts from this skeleton. Do not deviate.

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Smart water metering — LoRaWAN & NB-IoT AMI | OVI IoT Solutions</title>
  <meta name="description" content="…≤155 chars, unique per page…">
  <link rel="canonical" href="https://DOMAIN/solutions/smart-water-metering.html">

  <meta property="og:type" content="website">
  <meta property="og:title" content="…">
  <meta property="og:description" content="…">
  <meta property="og:image" content="https://DOMAIN/assets/brand/og-image.jpg">
  <meta name="twitter:card" content="summary_large_image">

  <link rel="icon" href="/assets/brand/favicon.ico" sizes="any">
  <link rel="icon" href="/assets/brand/favicon-32.png" type="image/png">
  <link rel="apple-touch-icon" href="/assets/brand/apple-touch-icon.png">
  <link rel="manifest" href="/site.webmanifest">
  <meta name="theme-color" content="#111B2E">

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@100..125,400..700&family=IBM+Plex+Mono:wght@500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/css/main.css">

  <script type="application/ld+json">{ … }</script>
</head>
<body>
  <a class="skip-link" href="#main">Skip to content</a>
  <!-- @include header -->
  <main id="main">…</main>
  <!-- @include cta-band -->
  <!-- @include footer -->
  <script type="module" src="/js/main.js"></script>
</body>
</html>
```

**Rules**
- **`type="module"`, deferred by nature. No render-blocking JS, ever.**
- One `<h1>` per page. Heading levels never skip.
- Landmarks: `<header>`, `<nav aria-label="Primary">`, `<main id="main">`, `<footer>`, and `aria-labelledby` on every `<section>` that has a heading.
- Every `<img>`: `width`, `height`, `loading="lazy"` (except the hero/LCP image, which is `fetchpriority="high"` and **not** lazy), `decoding="async"`.
- Decorative SVG: `aria-hidden="true"` + `focusable="false"`.
- Use **root-relative** paths (`/css/main.css`), never `../../`.
- Class naming: **BEM-lite** — `.block`, `.block__element`, `.block--variant`. No utility soup, no ID selectors for styling.

---

## 4. Partials — how 14 pages stay in sync

The header and footer live in **one** file each, but ship **inlined into every page** so the site works
with JavaScript disabled and costs nothing extra at runtime.

Mark the slot in each page:
```html
<!-- @include header -->
<!-- /@include header -->
```
`node tools/sync-partials.js` reads `partials/header.html`, replaces everything between the markers in
every `.html` file, and also:
- stamps the correct `aria-current="page"` on the nav link matching that file,
- fixes the canonical URL from `SITE.url` + the file's path,
- bakes `SITE.phoneRaw`, `SITE.email`, `SITE.whatsapp` into `href="tel:…"`, `mailto:…`, `wa.me/…`,
- writes the JSON-LD `Organization` / `BreadcrumbList` block.

**Workflow: never hand-edit header or footer markup inside a page.** Edit `partials/`, then run the
script. Run it before every commit and as the last step before the Ship Gate.

Blocks that are visually identical across pages but whose *content* differs (solution cards, related
links) are plain HTML in each page — do not over-engineer a templating layer.

---

## 5. CSS architecture

- `main.css` is the only stylesheet linked. It `@import`s `01`→`08` **in that order**. Order is the cascade — do not reorder.
- **All design values come from `02-tokens.css`.** A raw hex, px font-size, or arbitrary spacing value anywhere else is a bug.
- Use `@layer reset, base, layout, components, sections, pages, utilities;` to make specificity explicit and stop later files from accidentally losing to earlier ones.
- **Section spacing lives on `.section` only.** Never put `margin-top` on a heading or `margin-bottom` on a last child to create section rhythm — that is exactly how padding rules end up cancelling. One class owns vertical rhythm; variants (`.section--dark`, `.section--tight`) change background and scale, nothing else.
- Use logical properties (`padding-block`, `margin-inline`, `inset-inline-start`).
- Nesting is fine (baseline in all target browsers) but never nest more than 2 deep.
- No `!important` except in the `prefers-reduced-motion` block.
- `:focus-visible` for focus rings; never remove focus without replacing it.

---

## 6. JavaScript architecture

- ES modules, no bundler. `js/main.js` is the single entry and imports feature modules.
- **Every module is a no-op if its target element is absent**, so one entry point serves all 14 pages:
  ```js
  // js/main.js
  import { initNav }  from './modules/nav.js';
  import { hydrate }  from './modules/config.js';
  import { initUI }   from './modules/ui.js';

  hydrate();          // writes SITE values into [data-site] nodes
  initNav();
  initUI();

  // route-scoped, dynamically imported so other pages never download them
  if (document.querySelector('[data-hero-plot]'))   import('./modules/hero-plot.js').then(m => m.init());
  if (document.querySelector('[data-architecture]')) import('./modules/architecture.js').then(m => m.init());
  if (document.querySelector('[data-contact-form]')) import('./modules/form.js').then(m => m.init());
  if (document.querySelector('[data-map]'))          import('./modules/map.js').then(m => m.init());
  ```
- **No global state, no `window.*` assignments.** Export named functions.
- Never write `innerHTML` with user-supplied or form data — use `textContent`.
- Guard every DOM query: `const el = document.querySelector(...); if (!el) return;`
- **Progressive enhancement is mandatory (PRD N5).** With JS off: content renders, nav links work
  (the mobile drawer falls back to a visible link list via a `<details>` element or `:target`),
  the form still submits natively to the Web3Forms endpoint via `action` + `method="POST"`.
- Leaflet's CSS and JS are injected by `map.js` only when the map scrolls into view.

---

## 7. Performance budget

| Resource | Budget |
|---|---|
| HTML per page | < 30 KB |
| CSS total | < 35 KB uncompressed |
| JS total (excl. lazy Leaflet) | < 80 KB gzipped |
| Fonts | 2 families, `woff2`, `display=swap`, max 4 weights total |
| Largest image | < 180 KB `.webp` |
| LCP (mobile, 4G) | < 2.0 s |
| CLS | < 0.02 |

- No image above the fold larger than its rendered size at 2×.
- `preload` only the LCP asset. Over-preloading is slower, not faster.
- Inline nothing except the JSON-LD and the hero SVG.

---

## 8. Accessibility — non-negotiable

- WCAG 2.2 AA. Keyboard-only pass on every page before Ship Gate.
- Mobile drawer: `role="dialog"`, `aria-modal="true"`, focus trapped, `Esc` closes, focus returns to the toggle, `inert` or `aria-hidden` on the rest.
- Mega-menu: operable with Enter/Space/Arrow/Esc, `aria-expanded` kept accurate.
- Accordion: `<button aria-expanded aria-controls>` + panel `role="region"`.
- Form errors: `aria-invalid`, `aria-describedby`, and an `aria-live="polite"` summary region.
- Toasts: `role="status"`, `aria-live="polite"`.
- Visible focus on every interactive element, including inside dark bands (use `--white` outline there).
- Test with the keyboard and with a screen reader's landmark list. Run `axe` DevTools — **zero violations**.

---

## 9. Security & privacy

- `rel="noopener noreferrer"` on every `target="_blank"`.
- Honeypot field (`botcheck`, visually hidden) on the form; reject on fill.
- Never log or echo submitted data to the console.
- No third-party analytics, no cookies, no trackers in v1 — so no consent banner is needed. Keep it that way.
- Recommended `_headers` / host config:
  `Content-Security-Policy` allowing `self`, `cdn.jsdelivr.net`, `fonts.googleapis.com`,
  `fonts.gstatic.com`, `api.web3forms.com`, `*.tile.openstreetmap.org`;
  plus `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`,
  `Permissions-Policy: geolocation=(), camera=(), microphone=()`.

---

## 10. Local dev & deploy

```bash
npx serve .          # or: python3 -m http.server 8000
node tools/sync-partials.js
node tools/build-sitemap.js
```

> Open over **http://**, not `file://` — ES modules and `fetch` require an origin.

**Deploy:** any static host — Netlify, Vercel, Cloudflare Pages, GitHub Pages, or plain nginx/Apache.
Include whichever of `netlify.toml` / `vercel.json` / `.htaccess` the user's host needs, wired for the
404 page and the security headers above. Document the choice in `README.md`.
