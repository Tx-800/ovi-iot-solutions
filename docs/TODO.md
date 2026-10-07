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

---

## Open questions for the user

- [ ] **Icon delivery.** `ARCHITECTURE.md` §1 says Lucide via the UMD CDN bundle, but that ships ~1500 icons and breaks the 80 KB JS budget (`PRD.md` N4). Phase 2 uses an inline SVG sprite of the 7 UI icons drawn to Lucide's 24px grid. Phase 3 needs ~12 more for the solution cards. Options: (a) generate a sprite of just the icons we use from a `lucide-static` devDependency, exact artwork, zero runtime cost; (b) keep the CDN and raise the JS budget; (c) keep hand-drawn. **(a) recommended.**
- [ ] **CSS budget basis.** CSS is 36.1 KB uncompressed against a 35 KB budget — 21.3 KB of rules and 14.8 KB of comments; 9.9 KB gzipped. Phase 3 adds the hero, pillars, solutions grid and architecture diagram. Options: (a) govern on gzipped bytes; (b) raise the uncompressed budget to ~50 KB; (c) strip comments at the cost of the documentation. **(a) or (b) recommended** — there is no build step, so authored bytes are served bytes.
- [ ] **Primary button colour** — see the sign-off row in *Decisions*.

- [ ] Real contact details for `js/site.config.js` — address, phone, WhatsApp number, email, domain, business hours
- [ ] Web3Forms access key (free, 60 seconds: https://web3forms.com)
- [ ] Which host — Netlify / Vercel / Cloudflare Pages / cPanel? (decides the headers + 404 config file)
- [ ] Any real LinkedIn / X / YouTube profiles, or omit the social row entirely?
- [ ] Is there a company registration number or legal entity name needed in the footer?
