# TODO.md — build order

> Work top to bottom. Run the verification loop (`AGENTS.md` §6) at the end of every phase.
> Tick boxes as you go and keep this file current — it is the shared status board.

---

## Phase 0 — Setup

- [x] Read `AGENTS.md`, `PRD.md`, `DESIGN.md`, `ARCHITECTURE.md` in full before writing code
- [x] Create the file tree from `ARCHITECTURE.md` §2 (empty files are fine) — except the 13 inner
      pages, see *Decisions*
- [x] Move the five docs into `docs/`; symlink or copy `AGENTS.md` → `CLAUDE.md` at the repo root
      — shipped that way in the kit; root `AGENTS.md` and `CLAUDE.md` are byte-identical
- [x] Confirm `assets/brand/` contains the 12 supplied logo/icon files — **do not regenerate them**
      — 14 files present, untouched
- [x] `js/site.config.js` from `PRD.md` §6, values left as `REPLACE_ME`
- [x] `.gitignore` (`node_modules`, `.DS_Store`, `.vscode`, `*.log`)
- [x] `npx serve .` runs and `index.html` loads over http://

---

## Phase 1 — Foundations (no visible pages yet)

- [x] `css/01-reset.css` — modern reset, `box-sizing: border-box`, media defaults, `text-wrap` defaults
- [x] `css/02-tokens.css` — **every** custom property from `DESIGN.md` §2, §3, §4. Nothing invented.
- [x] `css/03-base.css` — `html`/`body`, the type scale applied to h1–h6/p, link styles, `:focus-visible`, the reduced-motion block
- [x] `css/04-layout.css` — `.container`, `.grid`, `.section` (+ `--dark`, `--tight`), `.split-7-5`, `.flow`
- [x] `css/main.css` — `@layer` declaration + `@import` of 01→08 in order
- [x] `js/site.config.js` + `js/modules/config.js` (`hydrate()` writing `SITE` into `[data-site]`)
- [x] `js/main.js` entry with the route-scoped dynamic imports from `ARCHITECTURE.md` §6

**Gate:** a blank page loads `main.css` with zero console errors; tokens visible in DevTools. ✅
Measured 2026-10-06: all 20 referenced assets return 200; headless Chrome console clean (capture
method proved against a deliberately failing control page); tokens resolve — the rendered page shows
`--paper`, `--navy-500`, the Archivo wdth axis and `--section-pad` applied.

---

## Phase 2 — Shared chrome

- [ ] `partials/header.html` — logo, primary nav, Solutions mega-menu, `Request a consultation` button
- [ ] `js/modules/nav.js` — sticky + condense on scroll, mega-menu (hover **and** keyboard), mobile drawer with focus trap, `Esc` to close, body scroll lock, `aria-expanded` kept accurate
- [ ] No-JS fallback for the mobile nav (`<details>` or `:target`) — `PRD.md` N5
- [ ] `partials/footer.html` — logo on a white panel, nav columns, contact block from `SITE`, the single dashed contour ring (`DESIGN.md` §6.3)
- [ ] `partials/cta-band.html` — dark closing band
- [ ] `js/modules/ui.js` — back-to-top, WhatsApp FAB, copy-email + toast, accordion
- [ ] `tools/sync-partials.js` — include injection, `aria-current`, canonical, `tel:`/`mailto:`/`wa.me` baking, JSON-LD
- [ ] Lucide wired up, icons render

**Gate:** header and footer identical on two test pages; keyboard-only menu operation works; `Esc` closes the drawer.

---

## Phase 3 — Home page (the reference implementation)

Build this one *completely*. Every later page copies its patterns.

- [ ] Section 1 — hero: 7/5 split, H1 at `--step-5`, lead, two buttons
- [ ] **`js/modules/hero-plot.js`** — the SVG coverage plot and its staggered entrance (`DESIGN.md` §6.1). This is the single most important visual on the site; give it real attention.
- [ ] Section 2 — three pillars, divided by vertical hairlines, **not cards**
- [ ] Section 3 — `solutions-grid`, 8 cards, 4/2/1 columns, hairline borders, Lucide icons on contour rings
- [ ] Section 4 — **`js/modules/architecture.js`** — the 4-stage SVG diagram, dashed vs solid links, mono protocol labels, packets travelling once on scroll-in, vertical reflow below 900 px (`DESIGN.md` §6.2)
- [ ] Section 5 — Why choose OVI (4 items)
- [ ] Section 6 — services teaser, two wide cards
- [ ] Section 7 — CTA band
- [ ] Head block complete: title, description, canonical, OG, JSON-LD `Organization` + `WebSite`
- [ ] Responsive pass at all 7 widths
- [ ] **Screenshot review at 375 px and 1440 px — look at them fresh and fix what you see**

**Gate:** Lighthouse mobile ≥ 95 / 100 / 95 / 100. axe 0. Keyboard clean. Reduced-motion clean. JS-off clean.

---

## Phase 4 — Inner pages

Content for all of these is in `PRD.md` §4 — **use it verbatim**.

- [ ] `about.html` — `PRD.md` §4.2
- [ ] `technology.html` — architecture diagram reused + the LoRaWAN vs NB-IoT selection block (`PRD.md` §4.3). Qualitative only — no spec tables.
- [ ] `solutions.html` — index of all 8 (`PRD.md` §4.4)
- [ ] `services.html` — hub (`PRD.md` §4.5)

Solution detail pages — build a single shared layout, then fill:
- [ ] `solutions/smart-water-metering.html`
- [ ] `solutions/smart-street-lighting.html`
- [ ] `solutions/water-leak-detection.html`
- [ ] `solutions/water-quality-monitoring.html`
- [ ] `solutions/water-level-monitoring.html`
- [ ] `solutions/people-asset-tracking.html`
- [ ] `solutions/atex-zone-sensors.html` — the only page using `--hazard`
- [ ] `services/consultancy-tender-preparation.html`
- [ ] `services/rf-planning-site-survey.html` — includes the large pull quote
- [ ] Breadcrumbs + `related-solutions` + CTA band on every detail page
- [ ] The three water pages cross-link each other
- [ ] One treated photograph per solution page, `.webp`, explicit dimensions

**Gate:** every page has a unique title/description/canonical and `Service` JSON-LD; no page under ~300 words of real content.

---

## Phase 5 — Contact & form

- [ ] `contact.html` — `PRD.md` §4.6
- [ ] `js/modules/form.js` — inline per-field validation, honeypot, Web3Forms `fetch` POST, loading/success/error states, `aria-live` summary, no page reload
- [ ] Native `action`/`method` fallback so it submits with JS disabled
- [ ] WhatsApp click-to-chat (prefilled message), click-to-call, `mailto:`, copy-email toast
- [ ] `js/modules/map.js` — Leaflet + OSM, injected only on scroll-in, keyboard accessible, with a text address beside it
- [ ] Address, hours and phone rendered from `SITE`
- [ ] Test a real submission end to end once `web3formsKey` is filled in

**Gate:** submit with a blank form, a bad email, and a valid payload — all three behave correctly and announce to screen readers.

---

## Phase 6 — Polish & SEO

- [ ] `404.html`
- [ ] `robots.txt`, `sitemap.xml` (via `tools/build-sitemap.js`), `site.webmanifest`
- [ ] JSON-LD on every page: `Organization`, `WebSite`, `BreadcrumbList`, `Service`
- [ ] `tools/check-links.js` — crawl every `href` and fail on a broken internal link
- [ ] Images converted to `.webp`, resized, explicit `width`/`height`, LCP image `fetchpriority="high"` and not lazy
- [ ] Pin every CDN version (no `@latest`)
- [ ] Security headers file for the chosen host + 404 routing
- [ ] `README.md` — run locally, fill `site.config.js`, deploy, where the docs live

---

## Phase 7 — Ship Gate

Every line must pass. Report the real numbers.

- [ ] `grep -rin "ideas" . --include="*.html" --include="*.css" --include="*.js" --exclude-dir=docs` → **empty**
- [ ] `grep -rn "REPLACE_ME" . --include="*.html"` → **empty** (only `js/site.config.js` may contain it, and only if the user hasn't supplied details yet)
- [ ] `grep -rin "lorem\|ipsum\|FIXME\|coming soon" . --include="*.html"` → **empty**
- [ ] `grep -rn 'href="#"' . --include="*.html"` → **empty**
- [ ] `node tools/check-links.js` → **0 broken**
- [ ] `node tools/sync-partials.js` → **no diff**
- [ ] Lighthouse mobile on `index.html`: Perf ≥ 95 · A11y 100 · BP ≥ 95 · SEO 100
- [ ] Lighthouse mobile on one solution page: same gates
- [ ] axe DevTools on all 14 pages → **0 violations**
- [ ] Keyboard-only pass on all 14 pages
- [ ] JS disabled: all 14 pages readable and navigable
- [ ] `prefers-reduced-motion: reduce`: nothing animates
- [ ] 320 px → 2560 px: no horizontal scroll anywhere
- [ ] Chrome, Safari, Firefox, Edge + iOS Safari
- [ ] JS payload < 80 KB gzipped (excl. lazy Leaflet); CSS < 35 KB
- [ ] Self-critique questions in `DESIGN.md` §10 answered honestly, in writing

---

## Decisions log

Record judgement calls here as you make them, one line each.

| Date | Decision | Why |
|---|---|---|
| 2026-10-06 | Headings are sentence case sitewide, including the H1 tagline | `DESIGN.md` §3 requires it and `PRD.md` §4 explicitly permits light re-casing for the web. No technical meaning changes. |
| 2026-10-06 | `02-tokens.css` is imported **unlayered**; every other file gets its layer | A token definition should never lose to a layered rule. Unlayered normal declarations outrank layered ones. |
| 2026-10-06 | `--bp-*` tokens declared, but media queries repeat the literal px value | Custom properties are not valid inside a media query condition. Each query names its token in a comment. |
| 2026-10-06 | Body links keep `--blue-600` on hover; the underline thickens instead | `--ovi-blue` is 3.6:1 on white and fails AA for text (`DESIGN.md` §2). A hover state must not drop below the gate. |
| 2026-10-06 | Body measure (`68ch`) enforced on `p`/`li`/`dd`/`blockquote` by default | Enforcing by default rather than opt-in means a wide section cannot accidentally run copy past the measure. Full-width blocks opt out. |
| 2026-10-06 | The 13 inner pages were **not** created as empty files | An empty `.html` is an invalid document and nothing links to it yet. They are created in Phase 4 together with their content, so no dead link can ship. |
| 2026-10-06 | `index.html` carries no `canonical`/`og:url`/`og:image` yet | They must be absolute and built from `SITE.url`, which is still a placeholder. `tools/sync-partials.js` bakes them in Phase 2 — this keeps `REPLACE_ME` out of every HTML file from the start. |
| 2026-10-06 | `tools/check-links.js` written now rather than in Phase 6 | The `AGENTS.md` §6 loop calls it at the end of *every* phase. ~60 lines, no dependencies. |
| 2026-10-06 | Added `tools/probe.html`, `tools/measure.js`, `tools/shot.js` | Chrome's `--window-size` crops rather than reflows below ~500px on Windows, so a naive 375px screenshot shows overflow that does not exist. These render the page in an iframe at an exact CSS width and report real `scrollWidth` vs `clientWidth`. Dev-only, never linked from the site, no runtime dependency added. |
| 2026-10-06 | Motion pinned to `motion@12` (major) for now | An exact `12.x.x` pin is a Ship Gate requirement (`ARCHITECTURE.md` §1); pinning the patch before the animation code exists would be guesswork. Phase 6 sets it. |
| 2026-10-06 | Created the missing `%APPDATA%\npm` directory | `npx` failed with ENOENT because npm's global prefix folder did not exist. Environment fix, no project change. |

---

## Open questions for the user

- [ ] Real contact details for `js/site.config.js` — address, phone, WhatsApp number, email, domain, business hours
- [ ] Web3Forms access key (free, 60 seconds: https://web3forms.com)
- [ ] Which host — Netlify / Vercel / Cloudflare Pages / cPanel? (decides the headers + 404 config file)
- [ ] Any real LinkedIn / X / YouTube profiles, or omit the social row entirely?
- [ ] Is there a company registration number or legal entity name needed in the footer?
