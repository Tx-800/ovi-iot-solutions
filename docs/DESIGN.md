# DESIGN.md — OVI IoT Solutions

> Owns **how it looks and moves**. `PRD.md` owns what it says.
> If you are about to make a visual decision that is not in this file, make it *consistent with §1*.

---

## 1. The concept — "Coverage"

OVI's real craft is **making a radio signal reliably reach things that are far apart**: meters in
basements, lamp posts across a city, sensors in a hazardous zone. The deliverable their customers
actually buy is *coverage*.

So the site is built on the visual language of an **RF coverage plot**: a calm dark field, a faint
survey grid, and **concentric contour rings** radiating from the points that matter. Contour lines
are what an RF propagation map genuinely looks like — this motif belongs to this company and to
almost no other.

**One motif, used everywhere, in exactly one way:** the **contour ring**.
Behind the hero. Behind the architecture nodes. Behind section numbers on service pages.
Under the footer. Nowhere else — it is a structural device, not wallpaper.

**One engineering convention, borrowed and honoured throughout:**

| Line | Means | Where |
|---|---|---|
| **Dashed** | a wireless / radio link | device→gateway links, the field-side gutter rule on solution pages, the hero contours |
| **Solid** | a wired / IP link, or physical infrastructure | gateway→server→app links, section rules, card borders |

A reader never has to be told this. It just quietly makes the site feel like it was made by engineers.

### Where the boldness is spent

**The hero coverage plot, and nothing else.** It is the one orchestrated motion moment and the one
large graphic. Every other section is deliberately quiet: hairline borders, flat surfaces, no shadows,
no gradients, no second idea competing with it.

### Explicitly banned (these make a site look generated)

- Cream / beige backgrounds (`#F4F1EA`, `#FAF0E6`) and terracotta or clay accents.
- Identical rounded cards with the same soft `rgba(0,0,0,.1)` shadow under every one.
- Gradient washes used as decoration. (The hero plot is the only gradient-adjacent element, and it is a radial *fill*, not a brand gradient.)
- Tracked-out ALL-CAPS eyebrow labels above every heading.
- `→` appended to button or link text.
- Accenting one word of a headline in a different colour or italic.
- `01 / 02 / 03` numbered markers on anything that is not an actual sequence. (The architecture pipeline *is* a sequence — it may be numbered. The solutions grid is not — it may not.)
- Glassmorphism, neumorphism, animated gradient blobs, floating 3-D devices, fake dashboard screenshots with invented numbers.
- Generic stock photos of a man in a hard hat pointing at a tablet.

---

## 2. Colour

Both brand values are **sampled from the supplied logo file** — do not re-pick them by eye.

```css
:root {
  /* Brand — sampled from the logo. Do not alter. */
  --ovi-blue:    #0387F6;   /* the infinity mark + wifi arcs */
  --ovi-navy:    #1C2C45;   /* the "ovi" wordmark */

  /* Field */
  --navy-900:    #111B2E;   /* deepest surface: hero, CTA band, footer */
  --navy-700:    #1C2C45;   /* brand navy: headings on light, second dark surface */
  --navy-500:    #3A4D6D;   /* muted body text on light */
  --navy-300:    #8295B4;   /* captions, disabled, diagram strokes on dark */

  /* Signal */
  --blue-600:    #0269C4;   /* hover / pressed state of brand blue */
  --blue-500:    #0387F6;   /* = --ovi-blue. Primary action + "live" signal */
  --blue-200:    #A9D4FD;   /* contour rings on light surfaces */
  --blue-100:    #DCEDFE;   /* signal wash, chip fills, selected rows */

  /* Paper */
  --paper:       #F6F8FB;   /* page field. Cool, never warm. */
  --white:       #FFFFFF;   /* card + panel surfaces */
  --hairline:    #DFE5EE;   /* every border on light */
  --hairline-dk: #27374F;   /* every border on dark */

  /* Functional — semantic only, never decorative */
  --hazard:      #F0A202;   /* ATEX / hazardous-zone content, and form warnings ONLY */
  --success:     #0E9F6E;   /* form success only */
  --danger:      #D7263D;   /* form errors only */
}
```

**Weighting — hold to this.** Navy and paper carry ~75% of the page. Blue is ~20% and appears on
actions, the signal motif, and live data. `--hazard` appears on **two pages only**
(ATEX Zone Sensors, and form validation) — if you find yourself reaching for amber elsewhere, don't.

**The dark/light sandwich:** hero (dark) → content (light) → CTA band (dark) → footer (dark).
Inner pages: slim dark page-header → light content → dark CTA → dark footer.

**Contrast gates.** `--navy-500` on `--paper` = 7.0:1 ✓. `--white` on `--navy-900` = 15.9:1 ✓.
`--ovi-blue` on `--white` = 3.6:1 — **fails for body text.** Blue is permitted for: large text ≥ 24 px,
icons, borders, and `--white`-on-blue buttons. For a blue link in body copy use `--blue-600` (5.3:1).
**Verify every pair you invent** — do not assume.

---

## 3. Typography

**One superfamily, two widths.** Archivo is a grotesque drawn for signage and documents — it reads as
infrastructure rather than as a startup. The width contrast does the work a second typeface usually does,
which keeps the page cohesive and the font payload small.

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@100..125,400..700&family=IBM+Plex+Mono:wght@500&display=swap" rel="stylesheet">
```

| Role | Family | Setting |
|---|---|---|
| Display / H1 / H2 | **Archivo**, `font-stretch: 112%`, weight 600 | `letter-spacing: -0.02em`, `line-height: 1.04` |
| H3 / H4 | **Archivo**, `font-stretch: 100%`, weight 600 | `letter-spacing: -0.01em`, `line-height: 1.2` |
| Body | **Archivo**, `font-stretch: 100%`, weight 400 | `line-height: 1.65`, `max-width: 68ch` |
| UI / buttons / nav | **Archivo**, weight 500 | `line-height: 1.2` |
| Protocol labels only | **IBM Plex Mono** 500 | `LoRaWAN`, `NB-IoT`, `TCP/IP SSL` **in the architecture diagram only** |

> Mono is permitted *only* for transport/protocol strings, where it marks a literal technical token.
> It is not a styling device. Do not set captions, stats, or eyebrows in mono.

**Type scale** — fluid, ratio ≈ 1.25:

```css
--step--1: clamp(0.84rem, 0.82rem + 0.10vw, 0.89rem);  /* captions, legal     */
--step-0:  clamp(1.00rem, 0.96rem + 0.20vw, 1.13rem);  /* body                */
--step-1:  clamp(1.25rem, 1.18rem + 0.35vw, 1.42rem);  /* lead paragraph      */
--step-2:  clamp(1.56rem, 1.44rem + 0.60vw, 1.78rem);  /* H3                  */
--step-3:  clamp(1.95rem, 1.75rem + 1.00vw, 2.22rem);  /* H2                  */
--step-4:  clamp(2.44rem, 2.10rem + 1.70vw, 3.16rem);  /* page H1             */
--step-5:  clamp(3.05rem, 2.45rem + 3.00vw, 4.50rem);  /* home hero H1 only   */
```

**Rules**
- Body measure never exceeds **68ch**. Lead paragraphs never exceed **56ch**.
- **Sentence case everywhere.** No Title Case headings, no ALL-CAPS labels.
- Eyebrows exist only where they **classify** a page into a family — e.g. `Water monitoring applications`
  above *Water Leak Detection*. Sentence case, `--step--1`, `--blue-600`, no letter-spacing, no caps.
  Pages with no family get no eyebrow.
- Never hyphenate headings. `text-wrap: balance` on H1/H2, `text-wrap: pretty` on paragraphs.

---

## 4. Layout

**Grid:** 12 columns, `--gutter: clamp(1rem, 4vw, 2rem)`, container `max-width: 1240px`.

**The asymmetric split is the house layout.** Where a section pairs copy with a visual, use **7/5**,
not 6/6 — copy left (7), visual right (5). Reverse it at most once per page, and only to break a run
of three identical sections. 50/50 reads as a template.

```
┌──────────────────────────────────────────────────────────┐
│ ░░ contour field ░░                                      │
│                                                          │
│  Smart IoT Solutions for          ╭─────────────────╮    │
│  Connected Infrastructure         │   ((( o )))     │    │ ← hero: copy 7 / plot 5
│                                   │  coverage plot  │    │
│  OVI IoT Solutions designs…       ╰─────────────────╯    │
│  [ Explore solutions ] [ Talk… ]                         │
└──────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────┐
│  Dual connectivity │ End-to-end delivery │ Multi-sector   │ ← 3-up, hairline dividers, NO cards
└──────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────┐
│  Our solutions                                           │
│  ┌────────┐┌────────┐┌────────┐┌────────┐                │
│  │ 1      ││ 2      ││ 3      ││ 4      │  ← 4/2/1 cols   │
│  └────────┘└────────┘└────────┘└────────┘   hairline only │
│  ┌────────┐┌────────┐┌────────┐┌────────┐                │
└──────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────┐
│  End devices ⇢⇢ Gateways ── Network Server ── Applications│ ← full-bleed dark, animated
└──────────────────────────────────────────────────────────┘
```

**Spacing scale** (8 px base) — use these tokens only, never arbitrary values:
`4 8 12 16 24 32 48 64 96 128`
Section padding: `padding-block: clamp(4rem, 9vw, 8rem)`.
**Set section spacing on the section, never on the first/last child** — that is how padding rules end up
cancelling each other. One `.section` class owns vertical rhythm; variants only change background.

**Radius:** `--r-sm: 2px` (chips, inputs), `--r-md: 4px` (cards, buttons), `--r-lg: 8px` (modals, drawer).
Small radii read as datasheet, not as SaaS. **Nothing is fully rounded except the WhatsApp FAB.**

**Elevation:** there are **two** shadows in the whole site, no more:
```css
--shadow-header: 0 1px 0 var(--hairline), 0 6px 20px -12px rgb(17 27 46 / 0.22); /* sticky header, scrolled */
--shadow-overlay: 0 24px 60px -20px rgb(17 27 46 / 0.40);                        /* drawer, modal, toast  */
```
Cards get a **hairline border**, never a shadow. On hover a card's border goes `--ovi-blue` and its
title shifts to `--blue-600`. That is the entire hover treatment.

---

## 5. Components

### Buttons
| Variant | Fill | Text | Border | Use |
|---|---|---|---|---|
| Primary | `--ovi-blue` | `--white` | none | one per section, max |
| Secondary | transparent | `--navy-700` | `1px --navy-700` | paired with primary |
| On dark | `--white` | `--navy-900` | none | inside dark bands |
| Ghost | transparent | `--blue-600` | none | tertiary, in-card links |

`padding: 14px 24px`, `--r-md`, weight 500. **No arrow glyph in the label.** If a card is entirely
clickable, use a stretched-link pseudo-element over the card, not a nested `<a>`.
Focus: `outline: 2px solid var(--ovi-blue); outline-offset: 3px` — never `outline: none`.

### Cards
`background: var(--white)`, `border: 1px solid var(--hairline)`, `--r-md`, `padding: 32px`.
Icon at top: 28 px Lucide line icon, `stroke: var(--ovi-blue)`, `stroke-width: 1.5`, sitting on a
24 px faint contour ring. Title `--step-2`. Body `--step-0` in `--navy-500`.

### The pillars block — deliberately not cards
Three columns divided by `1px solid var(--hairline)` vertical rules, no background, no box. This
breaks the run of card grids and is the main reason the page doesn't read as a card kit.

### Chips
`background: var(--blue-100)`, `color: var(--blue-600)`, `--r-sm`, `padding: 4px 10px`, `--step--1`.
Used for parameters (`pH`, `Turbidity`, `Chlorine`) and assets (`Tanks`, `Reservoirs`, `Channels`).

### Forms
Inputs: `--white`, `1px solid var(--hairline)`, `--r-sm`, `padding: 12px 14px`, min height **48 px**.
Focus: border `--ovi-blue` + 3 px `--blue-100` ring. Error: border `--danger` + message below,
tied with `aria-describedby`, and `aria-invalid="true"`.
Labels sit **above** inputs and are always visible — no placeholder-as-label.

### Section header
H2 left-aligned, one-line sub below in `--navy-500` at `--step-1`, then a `1px --hairline` rule
spanning the grid. The rule is the only divider on the page — don't also add top borders to the content below.

---

## 6. The signature pieces

### 6.1 Hero coverage plot (`index.html` only)
Inline SVG, ~`560×560`, right 5 columns, bleeding slightly past the container's right edge.

- A faint survey grid: `1px` lines at 40 px, `--hairline-dk` at 40% opacity.
- **Five concentric contour rings**, dashed (`stroke-dasharray: 2 6`), `--blue-200` at descending opacity (0.9 → 0.15) with increasing radius — an RF propagation falloff.
- A gateway node at the centre: a small solid `--ovi-blue` disc with a 1 px `--white` ring.
- 6–8 device nodes scattered at varying radii — 3 px `--blue-200` dots. Nodes further out are dimmer.
- **Load animation (the one orchestrated moment):** rings scale from 0.6→1 and fade in, staggered 90 ms apart, 900 ms total, `ease: [0.16, 1, 0.3, 1]`. Then one slow continuous pulse ring every 4 s. Nothing else on the page animates on load.
- Under `prefers-reduced-motion: reduce`: render the final state immediately, no pulse.

> Do **not** substitute a photograph, a 3-D render, a dashboard mockup, or a stock illustration here.

### 6.2 Architecture diagram (`index.html`, `technology.html`)
Full-bleed `--navy-900` band. Four nodes left→right: **End devices · Gateways · Network Server · Applications**.
This *is* a sequence, so it may carry step numbers.

- Device→gateway links: **dashed** `--navy-300`. Gateway→server and server→app: **solid** `--navy-300`.
- Protocol labels in IBM Plex Mono `--step--1`, `--navy-300`: `LoRaWAN`, `TCP/IP SSL LoRaWAN`, `TCP/IP SSL`.
- **Scroll-triggered once:** small `--ovi-blue` packet dots travel the paths left→right, 2.4 s, then stop. Not a loop.
- Below 900 px it reflows to a **vertical** stack with the same link conventions. It must stay legible at 320 px — if the horizontal form can't survive, switch earlier rather than shrinking the type.
- Build it as **SVG + CSS**. Do not ship the bitmap from the deck.

### 6.3 Footer contour
A single large contour ring, clipped by the footer's top edge, `--hairline-dk`, `1px`, dashed.
It closes the loop with the hero. One ring, not a field of them.

---

## 7. Icons & imagery

**Icons:** [Lucide](https://lucide.dev) via CDN, `stroke-width: 1.5`, 24 px in UI / 28 px in cards.
Line icons match the deck's drawing style and the logo's stroke weight. Never mix icon sets.
Suggested: `gauge` (metering) · `lightbulb` (lighting) · `droplets` (leak) · `flask-conical` (quality) ·
`waves` (level) · `map-pin` (tracking) · `shield-alert` (ATEX) · `compass` (RF) · `file-text` (tender) ·
`radio-tower` (gateways) · `server` · `monitor-smartphone`.

**Photography:** sparing — at most **one** photograph per solution page, as a wide 21:9 band.
Source from [Unsplash](https://unsplash.com) / [Pexels](https://pexels.com) (free, commercial use).
Subjects: water treatment infrastructure, street lighting at dusk, industrial pipework, control rooms,
city aerials. **No people posing with tablets. No invented dashboard screenshots.**
Apply a consistent treatment so photos feel like one set: slight desaturation and a `--navy-900`
multiply overlay at 18%.
Serve as `.webp` with `loading="lazy"`, `decoding="async"`, and explicit `width`/`height`.

**The logo is supplied and must not be redrawn, recoloured, restretched, or outlined.**
Files are in `/assets/brand/`. Clear space on all sides = the height of the "o" in the wordmark.
Minimum width 120 px. On `--navy-900` surfaces (header-on-dark, footer), place the supplied full-colour
logo on a **white rounded panel** (`--r-md`, 12 px padding) rather than inventing a knockout version.

---

## 8. Motion

Motion One (`motion.dev`) — see `ARCHITECTURE.md` §3 for the exact import.

**Budget: one orchestrated entrance per page, plus state-change motion.** That is all.

| Allowed | Spec |
|---|---|
| Hero plot entrance (Home) | §6.1 |
| Architecture packets | §6.2, fires once on scroll-in |
| Inner-page H1 + lead | a single 320 ms fade+rise, together, not staggered per element |
| Drawer / mega-menu open | 220 ms, `cubic-bezier(.32,.72,0,1)` |
| Accordion expand | height + opacity, 240 ms |
| Button / card hover | 140 ms colour and border only |
| Toast | slide + fade, 200 ms |

**Not allowed:** fade-up on every section, staggered reveals on every card grid, parallax,
counting-number animations, typewriter text, auto-playing carousels, scroll-jacking,
infinite marquees, cursor followers.

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
    scroll-behavior: auto !important;
  }
}
```
Also guard in JS: `if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { /* final state, no animation */ }`.

---

## 9. Responsive

| Token | Width | Behaviour |
|---|---|---|
| `--bp-sm` | 480 px | single column; hero plot drops below copy at 70% scale |
| `--bp-md` | 768 px | 2-col solution grid; drawer nav below this |
| `--bp-lg` | 1024 px | 7/5 splits engage; mega-menu available |
| `--bp-xl` | 1280 px | container caps at 1240 px |

- **Mobile first.** Base CSS is the 320 px layout; `min-width` queries add from there.
- Tap targets ≥ 44×44 px. Body never below 16 px.
- No horizontal scroll at any width — test 320, 360, 414, 768, 1024, 1440, 2560.
- The WhatsApp FAB sits bottom-right, 16 px inset, above `env(safe-area-inset-bottom)`, and must never
  cover the form submit button on mobile — give the last section `padding-bottom: 96px` on small screens.

---

## 10. Self-critique before you call it done

Open the built site and answer honestly:

1. If I swapped in another company's logo and content, would this still "work"? **If yes, it is not specific enough.** Fix the hero first.
2. Is there more than one bold element competing on any page? Remove one.
3. Are all my cards the same radius, shadow and padding regardless of their importance? Differentiate or de-card.
4. Did a tracked-out ALL-CAPS eyebrow creep back in? Remove it.
5. Does anything animate that a user did not ask to animate, other than the one hero moment?
6. Is the amber appearing anywhere other than ATEX and form errors?
7. Take a screenshot at 375 px and at 1440 px and look at both fresh. Fix what you actually see, not what you intended.
