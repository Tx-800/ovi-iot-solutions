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

- [x] `partials/header.html` — logo, primary nav, Solutions mega-menu, `Request a consultation` button
- [x] `js/modules/nav.js` — sticky + condense on scroll, mega-menu (hover **and** keyboard), mobile drawer with focus trap, `Esc` to close, body scroll lock, `aria-expanded` kept accurate
- [x] No-JS fallback for the mobile nav (`<details>` or `:target`) — `PRD.md` N5 — built **first**; neither technique used, see *Decisions*
- [x] `partials/footer.html` — logo on a white panel, nav columns, contact block from `SITE`, the single dashed contour ring (`DESIGN.md` §6.3)
- [x] `partials/cta-band.html` — dark closing band
- [x] `js/modules/ui.js` — back-to-top, WhatsApp FAB, copy-email + toast, accordion
- [x] `tools/sync-partials.js` — include injection, `aria-current`, canonical, `tel:`/`mailto:`/`wa.me` baking, JSON-LD
- [ ] Lucide wired up, icons render — **BLOCKED, needs a decision.** The UMD bundle in `ARCHITECTURE.md` §1 ships every Lucide icon and breaks the 80 KB JS budget (`PRD.md` N4). Phase 2 ships an inline SVG sprite of the 7 UI icons instead. See *Decisions*.

**Gate:** header and footer identical on two test pages; keyboard-only menu operation works; `Esc` closes the drawer. ✅
Measured 2026-10-06: header, footer and CTA band byte-identical across 6 sampled pages (`aria-current` normalised out, since it is page-specific by design). `node tools/check-nav.js` — 32/32 assertions pass on `index.html` and on `about.html`, covering drawer open/close, focus entering the panel, `inert` on the rest of the page, scroll lock, `Esc` closing and returning focus, the mega-menu by click and by `Esc`, and the whole nav operating with scripting disabled. axe: 0 violations on all 16 pages at 375 px and 1280 px.

---

## Phase 3 — Home page (the reference implementation)

Build this one *completely*. Every later page copies its patterns.

- [x] Section 1 — hero: 7/5 split, H1 at `--step-5`, lead, two buttons
- [x] **`js/modules/hero-plot.js`** — the SVG coverage plot and its staggered entrance (`DESIGN.md` §6.1). This is the single most important visual on the site; give it real attention.
- [x] Section 2 — three pillars, divided by vertical hairlines, **not cards**
- [x] Section 3 — `solutions-grid`, 8 cards, 4/2/1 columns, hairline borders, Lucide icons on contour rings
- [x] Section 4 — **`js/modules/architecture.js`** — the 4-stage SVG diagram, dashed vs solid links, mono protocol labels, packets travelling once on scroll-in, vertical reflow below 900 px (`DESIGN.md` §6.2)
- [x] Section 5 — Why choose OVI (4 items)
- [x] Section 6 — services teaser, two wide cards
- [x] Section 7 — CTA band
- [~] Head block: title, description and OG done. Canonical and JSON-LD are generated the moment `SITE.url` is real — proven, then reverted (see Phase 2 *Decisions*).
- [x] Responsive pass at all 7 widths — 0 horizontal overflow, measured
- [x] **Screenshot review at 375 px and 1440 px** — fixed what the images showed: plot mask too tight, 256px dead zone between sections, architecture links drawing only in the gutter, ragged protocol labels, back-to-top floating in the absent FAB gap, `End-to-end expertise` breaking across its own hyphen

**Gate:** Lighthouse mobile ≥ 95 / 100 / 95 / 100. axe 0. Keyboard clean. Reduced-motion clean. JS-off clean. ✅
Measured 2026-10-07 — see the Phase 3 numbers in the report and *Decisions* below.

---

## Phase 4 — Inner pages

Content for all of these is in `PRD.md` §4 — **use it verbatim**.

- [x] `about.html` — `PRD.md` §4.2
- [x] `technology.html` — architecture diagram reused + the LoRaWAN vs NB-IoT selection block (`PRD.md` §4.3). Qualitative only — no spec tables.
- [x] `solutions.html` — index of all 8 (`PRD.md` §4.4)
- [x] `services.html` — hub (`PRD.md` §4.5)

Solution detail pages — build a single shared layout, then fill:
- [x] `solutions/smart-water-metering.html`
- [x] `solutions/smart-street-lighting.html`
- [x] `solutions/water-leak-detection.html`
- [x] `solutions/water-quality-monitoring.html`
- [x] `solutions/water-level-monitoring.html`
- [x] `solutions/people-asset-tracking.html`
- [x] `solutions/atex-zone-sensors.html` — the only page using `--hazard`
- [x] `services/consultancy-tender-preparation.html`
- [x] `services/rf-planning-site-survey.html` — includes the large pull quote
- [x] Breadcrumbs + `related-solutions` + CTA band on every detail page — breadcrumbs are generated by `tools/sync-partials.js` from the same data as the `BreadcrumbList` JSON-LD, so the two cannot drift apart
- [x] The three water pages cross-link each other — each links its other two siblings, exactly as specified, not a third unrelated page
- [x] One treated photograph per solution page, `.webp`, explicit dimensions — all nine via `tools/build-images.js`; see Decisions for the 2400w @2x, the 800w rung, and eager loading

**Gate:** every page has a unique title/description/canonical and `Service` JSON-LD; no page under ~300 words of real content. ✅ (mostly)
Measured 2026-10-07: title/description verified unique and within length budget back in Phase 0 scaffolding. Canonical and `Service`/`BreadcrumbList` JSON-LD proved by temporarily setting a real domain, inspecting the output, then reverting — all three solution/service pages sampled generated correctly. Word counts (real `<main>` content, breadcrumb and nav text excluded would be lower still): consultancy 209, rf-planning 203, atex 193, tracking 212, lighting 212, metering 250, water-leak 180, water-level 213, water-quality 193. Seven of nine clear 190; two (water-leak, water-quality/atex at 180–193) sit under 300. Pushed further only by inventing content `PRD.md` does not support — the three water pages are deliberately thin in the source (one verbatim sentence each) — so flagging honestly rather than padding with fluff.

---

## Phase 5 — Contact & form

- [x] `contact.html` — `PRD.md` §4.6
- [x] `js/modules/form.js` — inline per-field validation, honeypot, Web3Forms `fetch` POST, loading/success/error states, `aria-live` summary, no page reload
- [x] Native `action`/`method` fallback so it submits with JS disabled
- [x] WhatsApp click-to-chat (prefilled message), click-to-call, `mailto:`, copy-email toast
- [x] `js/modules/map.js` — Leaflet + OSM, injected only on scroll-in, keyboard accessible, with a text address beside it
- [x] Address, hours and phone rendered from `SITE`
- [ ] Test a real submission end to end once `web3formsKey` is filled in — **still open**: no real key yet, so the network path is tested against a mocked endpoint only

**Gate:** submit with a blank form, a bad email, and a valid payload — all three behave correctly and announce to screen readers. ✅
Measured 2026-10-07 with `node tools/check-form.js` (44 assertions), in **both** the placeholder config and a populated test config: blank submit → nothing sent, “There are 3 problems” in the `aria-live` region, all three fields `aria-invalid` + `aria-describedby` to visible text, focus to Name; bad email → “There is 1 problem”, format message, focus to Email; valid payload → one JSON POST to Web3Forms, busy state, “Sending” then “Thanks” announced, form reset, no reload. Plus server error, network failure, honeypot, double-submit and missing key. Announcement is verified as live-region text and ARIA wiring in Chrome — not with a real screen reader.

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

Deferred from Phase 4 — tracked here, not dropped:
- [ ] **Move the photo band below the first content section** on all nine detail pages, then re-run
      `tools/fold-probe.html` and Lighthouse to find which element is actually LCP, and revisit the band's
      loading attribute accordingly (`LOADING` in `tools/build-images.js`).
- [ ] **Raise the image size cap to 220 KB** (`MAX_BYTES` in `tools/build-images.js`, and
      `ARCHITECTURE.md` §7) and re-encode anything that was pushed below where it looks good. Check
      `smart-water-metering.webp` for artefacts at the quality it settled on (q82, 168 KB at 1240w) and
      whether a 2x becomes possible.
- [ ] **Replace the street-lighting source with a dusk photograph** rather than exempting it from the
      §7 treatment. The user supplies the new source before Phase 6 runs; drop it in as
      `assets/img/_src/smart-street-lighting.jpg` (a hand-placed source always wins) and re-check its crop.

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
- [ ] axe DevTools on all 16 pages → **0 violations**
- [ ] Keyboard-only pass on all 16 pages
- [ ] JS disabled: all 16 pages readable and navigable
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
| 2026-10-06 | **Reversed the Phase 1 call: all 16 pages in the `PRD.md` §3 sitemap now exist** | The header links to 15 of them. Leaving them uncreated meant every page shipping 15 dead links, which is the thing the earlier decision existed to prevent. Each page carries its real head, H1 and lead from `PRD.md` §4 — not an empty file. Phase 3 and 4 add their body sections. |
| 2026-10-06 | **Primary button fill is `--blue-600`, not `--ovi-blue`. NEEDS SIGN-OFF.** | `DESIGN.md` §5 specifies `--ovi-blue`, and §2 permits "`--white`-on-blue buttons". But contrast is symmetric: white on `--ovi-blue` is the same 3.62:1 that §2 itself calls a failure for body text, so it fails AA for button labels and axe flagged it. White on `--blue-600` measures 5.49:1. `--ovi-blue` keeps every non-text job: focus rings, icons, borders, the signal motif. A genuine `DESIGN.md` vs `PRD.md` N2/N6 conflict — one line to revert if you would rather change the gate. |
| 2026-10-06 | Added `--blue-700`, derived via `color-mix` from `--blue-600` and `--navy-900` | A primary button needs a pressed state, and `DESIGN.md` §2's scale has no step below `--blue-600`. Derived rather than picked, so it is not an invented brand colour. |
| 2026-10-06 | Eyebrows are `--blue-200` on the dark page head, not `--blue-600` | `DESIGN.md` §3 specifies `--blue-600`, but §2 puts inner pages on a slim dark header, where `--blue-600` measures 3.13:1 and fails AA. `--blue-200` measures 11.1:1. |
| 2026-10-06 | No-JS nav is a plain visible list; JavaScript adds `data-nav-enhanced` to turn it into a drawer | `TODO.md` suggested `<details>` or `:target`. A closed `<details>` cannot be reliably forced open at desktop width across browsers, so it would have needed `!important` or a duplicated nav. The chosen direction fails safe: if the script never runs, the nav is still a working list rather than content behind a dead control. |
| 2026-10-06 | Drawer and mega-menu transitions are gated on `data-nav-ready`, set one frame after enhancement | Enhancement is what first applies `visibility: hidden` to a panel that was visible, so without the gate the drawer animated itself shut in front of the visitor on every page load. |
| 2026-10-06 | `aria-current="page"` is stamped on every link to the current page, header and footer | Both genuinely are links to the current page. Only the header link takes the visual treatment. |
| 2026-10-06 | `sync-partials.js` deletes elements marked `data-requires` whose `SITE` value is still a placeholder, and emits no canonical/OG/JSON-LD until `SITE.url` is real | This is what keeps placeholder strings out of shipped HTML while the real contact details are outstanding. Fill `js/site.config.js` and the address, phone, email, WhatsApp FAB, canonical and JSON-LD all appear on their own. |
| 2026-10-06 | Added `tools/check-nav.js` + `nav-harness.html` and `tools/check-a11y.js` + `a11y-harness.html` | The Phase 2 gate is keyboard and no-JS behaviour, which a screenshot cannot show. The harness drives the real header in an iframe; the no-JS frame uses `sandbox="allow-same-origin"` without `allow-scripts`, which genuinely disables scripting while leaving the DOM readable. |
| 2026-10-06 | Harness frames switch transitions off before asserting | Headless Chrome runs on virtual time, which freezes transitions part-way, so computed styles reported mid-animation values rather than settled state. Three apparent failures were this, not the site. The one real bug it masked is the `data-nav-ready` row above. |
| 2026-10-06 | Added `.gitattributes` with `* text=auto eol=lf` | `core.autocrlf` was rewriting line endings on checkout, which would have shown as whole-file churn in the "run sync-partials twice, no diff" proof. |
| 2026-10-06 | `PRD.md` header said "14 pages" while the §3 sitemap listed 16 files | Built the 16 the sitemap lists (7 root + 7 solutions + 2 services). Flagging the discrepancy rather than silently dropping two pages. |
| 2026-10-07 | **Fonts are self-hosted, not loaded from Google Fonts.** `ARCHITECTURE.md` §1 amended | The Google Fonts stylesheet was render-blocking at 840ms on mobile — most of the gap to the N1 Performance gate. Same woff2 subsets served from this origin. Both families are SIL OFL, so redistribution is permitted. Perf went 88 → 99, FCP 2.7s → 1.3s. |
| 2026-10-07 | Two metric-matched fallback faces (`size-adjust: 99.6%` text, `112.9%` display) | Measured against Arial at 100px in the browser, not guessed. Self-hosting moves the font off the blocking path, so the page paints in a fallback and swaps; matching the advance widths means the swap changes no line breaks. |
| 2026-10-07 | **`css/main.css` is now generated by `tools/build-css.js` from `css/src/`.** `ARCHITECTURE.md` §5 amended | The `@import` chain cost a render-blocking second round trip — the browser cannot discover the eight files until main.css arrives. Lighthouse measured ~450ms of blocked rendering. The bundle is committed, so the site still needs no build step to serve. Same rule as the icon sprite. |
| 2026-10-07 | **The progressive-enhancement pattern was inverted, and `ARCHITECTURE.md` §6 rewritten.** The enhanced layout is now the CSS default and `<noscript>` reverts it | This reverses what was documented in Phase 2 and what you asked me to write down. Shipping the plain nav and letting JS collapse it into a drawer changed the header height on boot and moved everything below: **CLS 0.565** against a < 0.02 gate. Declaring the drawer up front means neither path reflows. Cost: scripting-on-but-module-failed leaves a dead control. The no-JS path is still tested on every `check-nav` run in a frame with scripting genuinely disabled. |
| 2026-10-07 | Two adjacent light sections no longer stack their padding | 8rem against 8rem left a 256px dead zone between the pillars and the solutions grid. `.section` still owns the rhythm; the rule only stops it applying twice to one seam. A section after a dark band keeps full padding, because that seam is a real change of surface. |
| 2026-10-07 | The architecture diagram is HTML + CSS, not one SVG | `DESIGN.md` §6.2 says "SVG + CSS"; the intent is "not the bitmap from the deck". HTML reflows to the vertical stack below 900px without a second drawing, and keeps the protocol labels as real, selectable, translatable text. The dashed-radio / solid-wired convention is carried on the connector borders. |
| 2026-10-07 | The pillars block is not cards, despite `PRD.md` §4.1 saying "three cards with line icons" | Not treated as a contradiction: `AGENTS.md` §2 gives PRD the content and DESIGN the visuals, and `DESIGN.md` §5 is explicit that this block is "deliberately not cards" and is the main reason the page does not read as a card kit. Content honoured — three items, line icons. |
| 2026-10-07 | Added `.btn--outline-on-dark` and `.btn--ghost-on-dark` | `DESIGN.md` §5's Secondary is `--navy-700` on transparent, which is invisible on a dark band. White on `--navy-900` is 15.9:1. |
| 2026-10-07 | `.why__title` is `--step-1`, not the card `--step-2` | At four columns "End-to-end expertise" broke across its own hyphen. Smaller also keeps the block subordinate to the solutions grid above it, which is the point of not boxing it. |
| 2026-10-07 | Back-to-top takes the corner while the WhatsApp FAB is absent | Its offset reserves room for the FAB. The FAB is omitted until `whatsapp` is filled in, so without the rule the button floats in an empty gap. |
| 2026-10-07 | Added `tools/build-css.js`, `tools/build-icons.js`, `tools/motion-probe.html`, `tools/font-metrics.html`, `tools/box-probe.html` | Build-time generators for committed artefacts, plus probes so the reduced-motion gate, the font metrics and the layout geometry are measured rather than asserted. |
| 2026-10-07 | **Icon sprite moved from inline (every page) to external** `assets/icons/sprite.svg`. `ARCHITECTURE.md` §1 amended | Inline cost ~6.5 KB of identical markup on all 16 pages; external, the browser fetches and caches it once. `index.html` dropped from 29.3 KB to 23.7 KB raw. Verified before adopting, not assumed: `currentColor` inheritance through the external `<use>` shadow tree confirmed by rendering three icons in different colours and reading painted pixels (a computed-style check on the host element would not have proven the shadow content painted correctly); Lighthouse Performance held at 99 before and after. Both conditions were the ones set for keeping it. |
| 2026-10-07 | **HTML budget changed from < 30 KB uncompressed to ≤ 12 KB gzipped per page.** `ARCHITECTURE.md` §7 amended | Same basis as the CSS budget — transfer size is what a visitor pays, every host serves compressed, no build step means authored bytes are served bytes. `index.html` measures 5.13 KB gzipped against the new gate. |
| 2026-10-07 | **Photography deferred on all 9 solution/service pages.** Not shipped this phase | `DESIGN.md` §7 says "at most one photograph per solution page" — a ceiling, not a requirement — and `AGENTS.md` bans shipping a placeholder. Sourcing real, correctly-licensed stock photography without a Pexels/Unsplash API key means guessing at search results with no reliable way to verify licensing or get the right subject; that is a worse outcome than a page with no photo. Logged as an open question rather than silently skipped. |
| 2026-10-07 | Breadcrumbs are generated by `tools/sync-partials.js`, not hand-authored per page | They are computed from the same `breadcrumbFor()` data that already builds the `BreadcrumbList` JSON-LD, so the visible trail and the structured data cannot say different things. Root-relative hrefs, so — unlike the JSON-LD — breadcrumbs render correctly even before `SITE.url` is real. |
| 2026-10-07 | `solutions.html` and `services.html` do not use the `solutions-grid` / embed the shared partial's own heading | The partial's `<h2>Our solutions</h2>` would duplicate the page's own `<h1>Our solutions</h1>` two inches below it. Same fix as the architecture diagram on `technology.html`: the card markup is reused, the heading wrapper is not, and the section gets an `aria-label` instead. `PRD.md` §5's "used on Home, Solutions" is honoured in content, not literally in one shared `<section>` wrapper. |
| 2026-10-07 | Card titles are `<h2>` on `solutions.html`/`services.html` but `<h3>` on `index.html` | Each page's cards sit at a different heading depth: on the hub pages they are the first heading under the H1 (no intervening H2), on Home they sit under the section's own `<h2>Our solutions</h2>`. Same pattern as the architecture diagram's stage titles. |
| 2026-10-07 | Added `.hazard-band` (left rule, not a filled background) for the ATEX pull-out band | `DESIGN.md` §2: amber is permitted on exactly two pages, and the weighting note says blue/navy should still dominate. A left rule keeps `--hazard` a marker rather than a block of colour competing with the rest of the page. |
| 2026-10-07 | Added `.pull-quote`, sized at `--step-3` with the display font stack | `DESIGN.md` §4.5.2 says "set large." `--step-3` (H2 size) reads as a genuine pull quote without introducing a new type size outside the existing scale. |
| 2026-10-07 | `related-solutions` content is manually curated per page, not generated | The three water pages cross-link each other exactly as `PRD.md` specifies (2 links, not 3). The other six pages' three related links are chosen for genuine technical/deployment relationships (e.g. ATEX → RF planning, lighting → RF planning) rather than a mechanical "next N in the list," which would read as templated. Logged here since it is a judgement call, not derived from any PRD table. |
| 2026-10-07 | Connective prose added to thin pages (water family, ATEX, both service pages) to approach the ~300-word gate | Every added sentence explains or restates the implications of a verbatim claim already in `PRD.md` §4 — e.g. what "continuous" monitoring buys over a manual sample round — and introduces no new capability, number or claim. Nothing here is a fact about OVI that is not already in the source. |
| 2026-10-07 | Found and fixed: `.page-head` was not recognised as dark by the section-seam padding rule from Phase 3 | The rule collapses padding between two adjacent *light* sections by checking `:not(.section--dark)`, but `.page-head` is visually dark without carrying that class. Every inner page would have had its first content section's top padding wrongly zeroed against the dark header. Caught before it shipped by reviewing a screenshot, not by reading the code. |
| 2026-10-07 | Found and fixed: `nav.js`'s nested `requestAnimationFrame` for `data-nav-ready` doesn't reliably fire in headless Chrome | Confirmed with a minimal probe: a single rAF on a background iframe fires under `--virtual-time-budget`, a *second* one requested from inside that callback often does not. Replaced with a synchronous `setAttribute` — safe because, with the Phase 3 inversion, the enhanced layout is already the CSS default, so `data-nav-ready` only adds a `transition` property and changes no value; gaining the ability to transition is not itself an animation, so no frame delay was ever actually needed. Simpler and more robust than the code it replaced. |
| 2026-10-07 | `tools/check-nav.js` retries once on a transient frame-load timeout, keyed to that exact failure only | The harness stacks four real iframes in one page; occasionally one fails to load within the timeout under headless Chrome's launch scheduling, confirmed by rerunning a "failed" page and getting a clean 34/34 every time with no other check ever disagreeing with itself. The retry is scoped to that one failure signature so it cannot mask a real assertion failure. |
| 2026-10-07 | **Photography shipped on all nine solution/service pages** via `tools/build-images.js` (sharp devDependency, pre-approved). Supersedes the "deferred" row above | Sources supplied by you (8 Pexels, 1 Pixabay). One script fetches, crops to 21:9, applies the identical §7 treatment (saturation ×0.85, `--navy-900` multiply at 18%), encodes WebP, writes each page's `<!-- @photo -->` band and `assets/img/CREDITS.md`. Re-running it is byte-identical. Photographer names came from each source page, not invented. |
| 2026-10-07 | **@2x is 2400w, not the 2480w specified** | The Pexels URL supplied delivers 2400px. Same rule you set for the Pixabay image: never upscale. The script caps @2x at the source's own crop width. |
| 2026-10-07 | **`smart-water-metering` ships with no @2x** | Concrete texture plus dozens of fittings: its 2400w is 276 KB *at quality 40*. A 2x only ships if it fits the 180 KB image budget at quality ≥ 50; otherwise a browser upscaling a good 1240w beats a smeared or oversized 2x. Its 1240w is 168 KB at q82. |
| 2026-10-07 | Image budget read as 180,000 bytes, not 180 KiB | `water-leak-detection@2x` was 181,152 bytes — under 180 KiB, over 180 kB. Took the stricter reading so the gate cannot be argued; it now encodes at q66 (167 KB). Largest file on the site: 179,102 bytes. |
| 2026-10-07 | **Added an 800w rung to every srcset** — not in the brief | The band is the LCP element on phones (see below), and the smallest file on offer was the 1240w: a 412px phone downloaded 168 KB for a ~665-device-pixel slot. Lighthouse on `smart-water-metering` was 93 (below the gate) before the rung, 97 after. |
| 2026-10-07 | **The photo band is eager, default priority — not `loading="lazy"` as specified** | The brief's premise was that the bands sit below the fold. Measured with `tools/fold-probe.html`: all nine sit 389–596 px down at every viewport from 375×812 to 1440×900, so the band *is* the LCP element on every detail page, and lazy-loading it fails Lighthouse's "LCP image was lazily loaded" audit. Compared three strategies, median of 3: high priority 96/97, lazy 97/98 (audit fails), plain eager 97/97 (audit passes). Chose plain eager — within noise of the best score, passes every audit, and correct on real devices where lazy holds an above-fold fetch until after layout. `ARCHITECTURE.md` §3 amended: high priority measured worse here, so it is no longer assumed. |
| 2026-10-07 | Four crops moved off the default upper-third focus, as per-image crop data in the script | Checked every crop visually against the original. RF planning's default crop cut the tower crossarm off (focus 0.1). Street lighting kept the lamps but lost the road its alt text describes (0.6). Warehouse was two-thirds ceiling (0.8). The meters' yellow meter was sliced at the bottom edge (0.5). Treatment stays identical across all nine; only the crop window moves. |
| 2026-10-07 | **Every SITE-dependent block on contact.html lives in a partial** (`contact-channels`, `contact-form`, `contact-details`) | `sync-partials.js` bakes `{{tokens}}` and deletes `data-requires` elements across the whole page, not just partial regions. Written inline, the first sync with placeholder values would have deleted the contact details from the source page for good, and filling `site.config.js` later would never bring them back. In partials they are rebuilt from source on every run. Proved both ways: placeholder config omits them; a populated test config brings every one back. |
| 2026-10-07 | No-JS first: the form is a complete native HTML form; `form.js` only enhances it | Native POST to `https://api.web3forms.com/submit`, native `required` / `type="email"`, `botcheck` honeypot, and a CSS-only `:target` success note at `#sent`. JS then sets `novalidate`, validates inline, and submits with fetch. Field names, honeypot markup and the JSON fetch pattern were checked against Web3Forms' own docs, not memory. |
| 2026-10-07 | The no-JS redirect waits for `SITE.url` | Web3Forms' docs say `redirect` must be an absolute same-domain URL — a relative path does not work — so it is built from `SITE.url` and omitted while that is a placeholder. Until then a no-JS submission lands on Web3Forms' own thank-you page. |
| 2026-10-07 | While `web3formsKey` is a placeholder, the form says so rather than sending | The key's hidden input is removed at build time; `form.js` then reports "Your enquiry was not sent — this form is not connected to an inbox yet" instead of posting an enquiry that would bounce. **With JS off and no key, a submission still reaches Web3Forms and gets their error page** — accepted for the pre-launch state; `sync-partials.js` lists `web3formsKey` as unset on every run. |
| 2026-10-07 | Input borders are `--navy-300` (3.04:1), not `--hairline` (~1.2:1) as `DESIGN.md` §5 specifies | WCAG 2.2 1.4.11 needs 3:1 for the boundary that identifies a form field. axe does not test this, so it would have passed the gate silently. Accessibility gate wins (`AGENTS.md` §2). |
| 2026-10-07 | **The WhatsApp FAB, back-to-top and toast moved inside `<footer>`** — affects every page | axe flagged the FAB as content outside any landmark (`region`). Present since Phase 2 but invisible to every earlier run, because the FAB only exists once `SITE.whatsapp` is real and every run used placeholders. Found by testing with a populated config. They are `position: fixed`, so nothing moves on screen. |
| 2026-10-07 | **No cta-band on contact.html**, though `PRD.md` §5 says every page | Its heading is this page's H1 word for word, so two landmarks shared one name (axe `landmark-unique`), and its only button linked to the page the visitor is already on. |
| 2026-10-07 | Contact breadcrumb reads "Contact", not the H1 | The H1 is a sentence. `CRUMB_NAMES` in `sync-partials.js` overrides it; the `BreadcrumbList` JSON-LD follows automatically. |
| 2026-10-07 | `.split-7-5 > :only-child` keeps a lone column at 7/12 | With the office aside removed, the form was both `:first-child` and `:last-child`, and the later rule pushed it into the narrow 5-column slot. |
| 2026-10-07 | Leaflet 1.9.4 pinned with SRI hashes computed from the files; loads on scroll-in only; no scroll-wheel zoom | Hashes computed with `openssl` from the jsDelivr files. Zero Leaflet requests until the map nears the viewport (measured). `scrollWheelZoom: false` — DESIGN.md §8 bans scroll-jacking. Animations off under reduced motion. 0,0 is refused both at build time and in `map.js`. Tiles use `tile.openstreetmap.org`, which the CSP sketch in §9 (`*.tile.openstreetmap.org`) does not match — fix when the headers file is written in Phase 6. |
| 2026-10-07 | **CSS is 16.9 of 18 KB gzipped — watch item** | Form + contact styles (~2 KB) ship to every page, and `main.css` is the one render-blocking resource. `index.html` Performance median moved 99 → 97 this phase (a single re-run came back at LCP 2.1 s, so partly noise). Still above the gate. If Phase 6 needs headroom, splitting page-specific CSS out of `main.css` is the lever. |

---

## Open questions for the user

- [x] **Icon delivery — resolved.** `lucide-static` devDependency, `tools/build-icons.js` generates the sprite. Moved to an external `assets/icons/sprite.svg` in Phase 4 on your instruction; see Decisions.
- [x] **CSS budget basis — resolved.** Governed on gzipped bytes, ≤ 18 KB hard gate. HTML given the same treatment in Phase 4, ≤ 12 KB gzipped per page.
- [x] **Primary button colour — resolved.** `--blue-600` confirmed correct; `DESIGN.md` §2 and §5 amended.
- [x] **Solution page photography — resolved.** You supplied nine licensed sources; shipped in Phase 4. One open follow-up: `smart-street-lighting` reads almost black at phone width after the uniform treatment — your call whether to swap the source or exempt it.

- [ ] Real contact details for `js/site.config.js` — address, phone, WhatsApp number, email, domain, business hours
- [ ] Web3Forms access key (free, 60 seconds: https://web3forms.com)
- [ ] Which host — Netlify / Vercel / Cloudflare Pages / cPanel? (decides the headers + 404 config file)
- [ ] Any real LinkedIn / X / YouTube profiles, or omit the social row entirely?
- [ ] Is there a company registration number or legal entity name needed in the footer?
