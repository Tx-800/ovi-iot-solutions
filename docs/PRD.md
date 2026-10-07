# PRD.md — OVI IoT Solutions Website

> **Read me first.** This is the single source of truth for *what* the site says and *what* it must do.
> `DESIGN.md` owns how it looks. `ARCHITECTURE.md` owns how it is built. `AGENTS.md` owns how you work.
> `TODO.md` is the build order.

---

## 0. CRITICAL — Brand rename

The source company profile deck is branded **"IDEAS IOT"**. That name is **retired**.

| Never write | Always write |
|---|---|
| IDEAS IOT | **OVI IoT Solutions** |
| IDEAS | **OVI** |
| ideas-iot, ideasiot | **ovi**, **ovi-iot** |

**The string "IDEAS" must not appear anywhere** in the final site — not in HTML, CSS, JS, comments,
`alt` text, file names, meta tags, JSON-LD, `aria-label`s, or image filenames.
Before you declare the build done, run the check in `TODO.md` §Ship Gate.

Short forms, in order of preference:
- Full legal/formal: **OVI IoT Solutions**
- In running copy after first mention: **OVI**
- Never: "Ovi", "ovi" mid-sentence (the logo is lowercase; **written copy is not**), "OVI IOT" (IoT is camel-case)

---

## 1. What this company is

**OVI IoT Solutions** designs, deploys, and supports end-to-end Internet of Things solutions built on
**LoRaWAN** and **NB-IoT** connectivity. From smart utility metering and street lighting to industrial
safety monitoring and asset tracking, OVI helps **cities, utilities, and industries** turn physical
infrastructure into connected, data-driven assets.

Beyond hardware and connectivity, the team supports customers through **consultancy, tender preparation,
and RF network planning** — carrying projects from feasibility through to reliable, large-scale deployment.

**Primary tagline:** Smart IoT Solutions for Connected Infrastructure
**Closing CTA line:** Let's Build Smarter Infrastructure Together
**Descriptor strip:** LoRaWAN & NB-IoT Solutions · Consultancy · RF Planning

### The three pillars (use on Home and About)

| Pillar | One-liner |
|---|---|
| **Dual Connectivity** | LoRaWAN & NB-IoT networks matched to each application |
| **End-to-End Delivery** | Consultancy, planning, deployment and support |
| **Multi-Sector Reach** | Utilities, smart cities, and industrial facilities |

---

## 2. Audience & job to be done

| Audience | What they came for | What must be ≤ 2 clicks away |
|---|---|---|
| Utility / municipal engineer | "Do they do smart water metering at city scale?" | Solution detail page + architecture |
| Procurement / tender officer | "Can they write our spec and are they credible?" | Services → Consultancy & Tender Preparation |
| Industrial / plant HSE manager | "Are the sensors ATEX certified?" | Solutions → ATEX Zone Sensors |
| Consultant / integrator | "What's the network stack and can they do RF planning?" | Technology + RF Planning & Site Survey |

**Tone:** engineering-credible, specific, unhyped. This site's job is to win a meeting, not a click.
No "revolutionary", no "cutting-edge", no "unleash", no invented statistics.

> ### ⛔ Do not invent facts
> No made-up client names, logos, case studies, testimonials, project counts, "500+ deployments",
> years-in-business, team bios, certifications, awards, or percentages.
> Everything in §4 came from the company deck and is true. **Anything not in this file does not go on the site.**
> If a section feels empty without a number, use a qualitative benefit from §4 instead.

---

## 3. Site map

16 pages. Multi-page static HTML.

```
/
├── index.html                  Home
├── about.html                  About OVI
├── technology.html             LoRaWAN & NB-IoT + solution architecture
├── solutions.html              Solutions index (all 8 cards)
├── services.html               Services hub (consultancy + RF planning)
├── contact.html                Contact + enquiry form
├── 404.html                    Not found
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
└── services/
    ├── consultancy-tender-preparation.html
    └── rf-planning-site-survey.html
```

**Primary nav:** Solutions · Services · Technology · About · Contact → plus a `Request a Consultation` button.
`Solutions` opens a mega-menu / dropdown listing all 7 solution pages. On mobile it is an accordion.

---

## 4. Page-by-page content

> Every bullet below is **verbatim-approved copy from the company deck**. You may lightly re-case or
> re-punctuate for the web. **Do not change the technical meaning.** You may write *additional*
> connective sentences, but never new claims, numbers, or capabilities.

### 4.1 `index.html` — Home

**Section 1 — Hero**
- H1: **Smart IoT Solutions for Connected Infrastructure**
  *(No eyebrow label above it — see `DESIGN.md` §3. The coverage plot carries the "radio" signal, not a caps label.)*
- Sub: OVI IoT Solutions designs, deploys, and supports end-to-end Internet of Things solutions built on LoRaWAN and NB-IoT connectivity — helping cities, utilities, and industries turn physical infrastructure into connected, data-driven assets.
- Buttons: `Explore Solutions` → `/solutions.html` (primary) · `Talk to an Engineer` → `/contact.html` (secondary)
- Visual: animated "Signal" hero per `DESIGN.md` §6.1 — do **not** use a stock hero photo here.

**Section 2 — The three pillars** (§1 table) as three cards with line icons.

**Section 3 — Solutions grid** — all 8 cards from §4.4, linking out. Heading:
`Our Solutions` / sub: `A full portfolio of connected-infrastructure and industrial IoT applications`

**Section 4 — Solution architecture** — the 4-stage diagram (§4.3). Heading: `Solution Architecture` /
sub: `End-to-end data flow — from field devices to the applications you use`. Link → `/technology.html`.

**Section 5 — Why Choose OVI** — the 4 cards from §4.8.

**Section 6 — Services teaser** — two wide cards: Consultancy & Tender Preparation, RF Planning & Site Survey.

**Section 7 — Closing CTA** — dark band. H2: `Let's Build Smarter Infrastructure Together`.
Sub: `LoRaWAN & NB-IoT Solutions · Consultancy · RF Planning`. Button → `/contact.html`.

---

### 4.2 `about.html` — About Us

**Intro (verbatim):**
> OVI IoT Solutions designs, deploys, and supports end-to-end Internet of Things solutions built on LoRaWAN and NB-IoT connectivity. From smart utility metering and street lighting to industrial safety monitoring and asset tracking, we help cities, utilities, and industries turn physical infrastructure into connected, data-driven assets.

**End-to-End Delivery (verbatim):**
> Beyond hardware and connectivity, our team supports customers through consultancy, tender preparation, and RF network planning — carrying projects from feasibility through to reliable, large-scale deployment.

Then: the three pillars (§1), the Why Choose OVI four (§4.8), sectors served
(utilities · smart cities · industrial facilities · oil & gas, chemical and process industries),
and a closing CTA.

---

### 4.3 `technology.html` — Technology

**H1:** Solution Architecture
**Sub:** End-to-end data flow — from field devices to the applications you use

**The 4-stage pipeline** — build as an animated SVG/HTML diagram, **not** a bitmap:

| # | Stage | Contains | Link out |
|---|---|---|---|
| 1 | **End devices** | Smart meters, sensors, trackers in the field | — |
| 2 | **Gateways** | LoRaWAN gateways / base stations aggregating device traffic | — |
| 3 | **Network Server** | Device management, deduplication, security, payload routing | — |
| 4 | **Applications** | Dashboards, mobile, billing and asset systems | — |

**Link labels on the diagram (verbatim from the deck):**
- End devices → Gateways: `LoRaWAN`
- Gateways → Network Server: `TCP/IP SSL LoRaWAN`
- Network Server → Applications: `TCP/IP SSL`

Device-side links are **dashed** (wireless); backhaul links are **solid** (wired/IP). Honour this.

**Also on this page — "Dual Connectivity: matched to the application".**
A comparison block for LoRaWAN vs NB-IoT. Frame it as *selection criteria*, and keep it qualitative —
**do not publish a spec table of ranges, data rates or battery figures**, as those are not in the deck:
- **LoRaWAN** — unlicensed spectrum, private network you own and operate, long range, very low power; suits campus, plant and citywide rollouts where you control the gateways.
- **NB-IoT** — licensed carrier spectrum, no gateway infrastructure to deploy, deep indoor penetration; suits dispersed assets across an operator's existing coverage.
- Closing line: *OVI selects the connectivity per application rather than forcing one technology across a programme.*

---

### 4.4 Solutions

`solutions.html` is a grid of **8 cards**. Cards 1–7 link to their detail page; card 8 links to `/services.html`.

**Page H1:** Our Solutions · **Sub:** A full portfolio of connected-infrastructure and industrial IoT applications

| # | Card title | Card blurb (write from the detail page's first line) | Href |
|---|---|---|---|
| 1 | Smart Water Metering | LoRaWAN and NB-IoT connected smart water meters for residential, commercial and bulk supply points | `/solutions/smart-water-metering.html` |
| 2 | Smart Street Lighting | LoRaWAN / NB-IoT connected lighting control and monitoring | `/solutions/smart-street-lighting.html` |
| 3 | Water Leak Detection | Acoustic and pressure-based sensors identify leaks early, reducing water loss and repair costs | `/solutions/water-leak-detection.html` |
| 4 | Water Quality Monitoring | Continuous monitoring of pH, turbidity, chlorine and other parameters to safeguard supply quality | `/solutions/water-quality-monitoring.html` |
| 5 | Water Level Monitoring | Real-time level monitoring in tanks, reservoirs and channels supports optimized management and flood alerts | `/solutions/water-level-monitoring.html` |
| 6 | People & Asset Tracking | Location visibility and safety across sites and facilities | `/solutions/people-asset-tracking.html` |
| 7 | ATEX Zone Sensors | Certified monitoring for hazardous and explosive-atmosphere environments | `/solutions/atex-zone-sensors.html` |
| 8 | Consultancy & RF Planning | Advisory, tender preparation and RF network design from feasibility to go-live | `/services.html` |

#### 4.4.1 `solutions/smart-water-metering.html`
- **H1:** Smart Water Metering
- **Lead:** LoRaWAN and NB-IoT connected smart water meters for residential, commercial and bulk supply points — **LoRaWAN & NB-IoT based AMI**.
  *(The deck's "LoRaWAN & NB-IoT based AMI" line belongs in the lead sentence, not as a tracked-caps eyebrow — `DESIGN.md` §3.)*
- **Key points (verbatim):**
  - Automated, remote meter reading eliminates manual site visits
  - Real-time consumption data supports accurate, timely billing
  - Leak and tamper alerts flag abnormal usage patterns early
  - Long battery life and long-range connectivity suited to citywide rollout
  - Reduces non-revenue water and improves network visibility for utilities

#### 4.4.2 `solutions/smart-street-lighting.html`
- **H1:** Smart Street Lighting · **Sub:** LoRaWAN / NB-IoT connected lighting control and monitoring
- **Four capability cards (verbatim):**

| Capability | Description |
|---|---|
| Remote Control | Individual or grouped on/off switching and dimming schedules from a central platform |
| Energy Monitoring | Real-time power consumption tracking to quantify and verify energy savings |
| Fault Detection | Automatic alerts for lamp failures, driver faults and abnormal power draw |
| Maintenance Planning | Usage and fault data drive predictive, rather than reactive, maintenance |

> **The three water pages share a family.** Their eyebrow is `Water monitoring applications` and each
> carries the family descriptor **"Sensor-based monitoring across the water network"** as a one-line
> sub under the H1. Treat them as a set: same layout, same cross-link block, consistent photography.

#### 4.4.3 `solutions/water-leak-detection.html`
- **H1:** Water Leak Detection · **Family label:** Water Monitoring Applications
- **Lead (verbatim):** Acoustic and pressure-based sensors identify leaks early, reducing water loss and repair costs.
- Cross-link the other two water pages at the foot ("Related water monitoring").

#### 4.4.4 `solutions/water-quality-monitoring.html`
- **H1:** Water Quality Monitoring · **Family label:** Water Monitoring Applications
- **Lead (verbatim):** Continuous monitoring of pH, turbidity, chlorine and other parameters to safeguard supply quality.
- Parameter chips: `pH` · `Turbidity` · `Chlorine` · `and other parameters` — do **not** invent extra parameters or ranges.
- Cross-link the other two water pages.

#### 4.4.5 `solutions/water-level-monitoring.html`
- **H1:** Water Level Monitoring · **Family label:** Water Monitoring Applications
- **Lead (verbatim):** Real-time level monitoring in tanks, reservoirs and channels supports optimized management and flood alerts.
- Asset chips: `Tanks` · `Reservoirs` · `Channels`
- Cross-link the other two water pages.

#### 4.4.6 `solutions/people-asset-tracking.html`
- **H1:** People & Asset Tracking · **Sub:** Location visibility and safety across sites and facilities
- **Key points (verbatim):**
  - LoRaWAN based indoor and outdoor tracking of personnel across large sites
  - Real-time location and status visibility for tools, equipment and vehicles
  - Geofencing and lone-worker safety alerts for hazardous or restricted zones
  - Deployed across industrial plants, warehouses, campuses and logistics yards

#### 4.4.7 `solutions/atex-zone-sensors.html`
- **H1:** ATEX Zone Sensors · **Sub:** Certified monitoring for hazardous and explosive-atmosphere environments
- **Three sensing cards (verbatim):**

| Sensor | Description |
|---|---|
| Temperature Monitoring | Continuous temperature sensing on critical equipment to flag overheating before failure. |
| Vibration Monitoring | Vibration analysis on rotating machinery supports early fault and imbalance detection. |
| Valve Positioning | Remote valve position sensing confirms open/closed status for safety and process control. |

- **Pull-out band (verbatim):** Built for oil & gas, chemical and process industries operating in classified hazardous (ATEX) zones
- ⚠️ Say **"ATEX-rated"** / **"certified for ATEX zones"**. Do **not** name specific zone numbers, directive numbers, certificate numbers, or an issuing body — none are in the source.

---

### 4.5 `services.html` — Services hub

**H1:** Consultancy & RF Planning
**Sub:** Expert advisory and network engineering, from feasibility through to go-live

Two large cards → the two service pages below, plus the Why Choose OVI block and a CTA.

#### 4.5.1 `services/consultancy-tender-preparation.html`
- **H1:** Consultancy & Tender Preparation · **Sub:** Expert advisory support from feasibility through procurement
- **Four cards (verbatim):**

| Service | Description |
|---|---|
| Tender Document Preparation | Technical specifications, scope of work and evaluation criteria for IoT procurement |
| Feasibility Studies | Assessing technology fit, coverage and cost of ownership before commitment |
| Vendor & Technology Evaluation | Independent comparison of connectivity, hardware and platform options |
| End-to-End Project Advisory | Guidance from concept through deployment and handover |

#### 4.5.2 `services/rf-planning-site-survey.html`
- **H1:** RF Planning & Site Survey · **Sub:** Engineering reliable connectivity for large-scale IoT networks
- **Pull quote (verbatim, set large):** *"Reliable coverage built on data, not guesswork"*
- **Four cards (verbatim):**

| Service | Description |
|---|---|
| RF Propagation Planning | Modeling LoRaWAN and NB-IoT coverage across the deployment area |
| On-Site Signal Surveys | Field measurements to validate signal strength and identify dead zones |
| Gateway Placement Optimization | Positioning gateways and base stations for maximum, efficient coverage |
| Coverage Simulation | Simulation and optimization before rollout to reduce costly rework |

---

### 4.6 `contact.html` — Contact

**H1:** Let's Build Smarter Infrastructure Together
**Sub:** Tell us about your network, site or tender and we'll come back with a technical response.

**Form fields:** Name* · Company · Work email* · Phone · Country/City · Interest (select) · Message*
**Interest options:** Smart Water Metering · Smart Street Lighting · Water Leak Detection · Water Quality Monitoring · Water Level Monitoring · People & Asset Tracking · ATEX Zone Sensors · Consultancy & Tender Preparation · RF Planning & Site Survey · Other

**Submission:** Web3Forms (see §6). Plus a **WhatsApp** click-to-chat button and **click-to-call** / **mailto** links, all prominent — many enquiries will never fill a form.

Also show: the office address block, an embedded **Leaflet + OpenStreetMap** map, and business hours.

---

### 4.7 `404.html`
Friendly, on-brand, links back to Home / Solutions / Contact. Reuse the hero's signal motif.

---

### 4.8 Why Choose OVI (reusable block — Home, About, Services)

| Title | Description |
|---|---|
| **End-to-End Expertise** | From consultancy and RF planning to deployment and support |
| **Multi-Technology** | LoRaWAN and NB-IoT connectivity matched to each use case |
| **Industrial Grade** | ATEX-rated sensing for hazardous, safety-critical environments |
| **Advisory Partner** | Trusted support from tender preparation through to go-live |

---

## 5. Reusable blocks

Build each of these **once** and reuse across pages (see `ARCHITECTURE.md` §4 partials):

| Block | Used on |
|---|---|
| `site-header` (nav + Solutions mega-menu + CTA) | all |
| `site-footer` (logo, nav columns, contact, legal) | all |
| `pillars` (3 cards) | Home, About |
| `solutions-grid` (8 cards) | Home, Solutions |
| `why-ovi` (4 cards) | Home, About, Services |
| `architecture-diagram` | Home, Technology |
| `cta-band` (dark, closing) | every page |
| `breadcrumbs` | all except Home, 404 |
| `related-solutions` | all solution/service detail pages |

---

## 6. Contact details & configuration

> 🔴 **ACTION REQUIRED — placeholders.** Every value below is a placeholder.
> They live in **exactly one place**: `js/site.config.js`.
> Replace them there once and every page picks them up.
> **Do not hardcode a phone number, email or address into any HTML file.**

```js
// js/site.config.js
export const SITE = {
  name:        "OVI IoT Solutions",
  shortName:   "OVI",
  tagline:     "Smart IoT Solutions for Connected Infrastructure",
  url:         "https://REPLACE_ME.com",          // production domain, no trailing slash
  email:       "REPLACE_ME@domain.com",
  phone:       "+00 000 000 0000",                 // display format
  phoneRaw:    "+000000000000",                    // tel: format, digits and + only
  whatsapp:    "000000000000",                     // international, no + and no spaces
  address: {
    line1:   "REPLACE_ME",
    line2:   "REPLACE_ME",
    city:    "REPLACE_ME",
    region:  "REPLACE_ME",
    postal:  "REPLACE_ME",
    country: "REPLACE_ME",
  },
  map:         { lat: 0.0, lng: 0.0, zoom: 15 },   // for Leaflet
  hours:       "REPLACE_ME",                        // e.g. "Sun–Thu, 09:00–18:00"
  social: {                                         // omit any that don't exist — do not invent profiles
    linkedin: "",
    x:        "",
    youtube:  "",
  },
  web3formsKey: "REPLACE_ME",                       // https://web3forms.com — free, no backend
};
```

**Rules:**
- Any social link left as `""` must **not render** — no dead icons.
- Render `address`, `phone`, `email`, `hours` from `SITE` in the footer and on Contact via a small
  `hydrateSiteConfig()` pass on `DOMContentLoaded`.
- **Exception:** also emit the real values into the JSON-LD block and the `<a href="tel:">`/`mailto:`
  attributes at build time via `tools/sync-partials.js`, so they survive with JS disabled.
- Grep gate: `grep -rn "REPLACE_ME" .` must return **only** `js/site.config.js` and the docs.

---

## 7. Functional requirements

| ID | Requirement |
|---|---|
| F1 | Sticky header; condenses on scroll; active page highlighted in nav |
| F2 | Solutions mega-menu on desktop (hover + keyboard), accordion on mobile |
| F3 | Mobile drawer nav: focus-trapped, `Esc` closes, body scroll locked, closes on route change |
| F4 | Contact form: inline per-field validation, honeypot + Web3Forms, loading state, success and error states, no page reload |
| F5 | WhatsApp FAB (floating button) on every page, built from `SITE.whatsapp` with a prefilled message |
| F6 | Scroll-reveal on section entry (Motion One), respecting `prefers-reduced-motion` |
| F7 | Animated architecture diagram: packets travel device → gateway → server → app on scroll into view |
| F8 | Leaflet map on Contact, lazy-initialised only when scrolled into view |
| F9 | Back-to-top button appearing after 1 viewport of scroll |
| F10 | Every solution/service page ends with `related-solutions` + `cta-band` |
| F11 | `404.html` wired up (`.htaccess` / `netlify.toml` / `vercel.json`, whichever host) |
| F12 | Copy-to-clipboard on the email address with a toast confirmation |

---

## 8. Non-functional requirements

| ID | Requirement | Gate |
|---|---|---|
| N1 | Lighthouse **Performance ≥ 95** on mobile for `index.html` | hard |
| N2 | Lighthouse **Accessibility = 100**, **Best Practices ≥ 95**, **SEO = 100** | hard |
| N3 | No layout shift: **CLS < 0.02**. Every `<img>` has explicit `width`/`height` | hard |
| N4 | Total JS shipped (excl. map, which is lazy) **< 80 KB** gzipped | hard |
| N5 | Works with **JavaScript disabled**: all content readable, all links work, nav usable | hard |
| N6 | **WCAG 2.2 AA**: 4.5:1 text contrast, visible focus rings, full keyboard operation, correct heading order | hard |
| N7 | Renders correctly 320 px → 2560 px. No horizontal scroll at any width | hard |
| N8 | `prefers-reduced-motion: reduce` disables all transform/opacity animation | hard |
| N9 | Dark mode is **out of scope** for v1 — do not build it | — |
| N10 | Latest 2 versions of Chrome, Safari, Firefox, Edge + iOS Safari | hard |

---

## 9. SEO requirements

- Unique `<title>` (≤ 60 chars) and `<meta name="description">` (≤ 155 chars) per page.
- `<link rel="canonical">` on every page, absolute, built from `SITE.url`.
- Open Graph + Twitter card tags; `og:image` → `/assets/brand/og-image.jpg` (1200×630, already supplied).
- **JSON-LD:** `Organization` (Home, with `logo`, `address`, `contactPoint`), `BreadcrumbList`
  (all inner pages), `Service` (each solution and service page), `WebSite` (Home).
- `sitemap.xml` listing all 16 pages, and a `robots.txt` pointing at it.
- One `<h1>` per page. Semantic `<header> <nav> <main> <section> <article> <footer>`.
- Descriptive `alt` on every meaningful image; `alt=""` + `aria-hidden="true"` on decorative SVG.
- Target terms per page, used naturally — never stuffed:
  `LoRaWAN`, `NB-IoT`, `smart water metering`, `AMI`, `smart street lighting`,
  `water leak detection`, `water quality monitoring`, `water level monitoring`,
  `people and asset tracking`, `ATEX sensors`, `RF planning`, `IoT consultancy`, `IoT tender preparation`.

---

## 10. Out of scope for v1

Blog/CMS · multi-language · client login or dashboard · e-commerce · live device telemetry ·
case studies · careers page · dark mode · cookie consent (no third-party analytics in v1).

If the user later asks for analytics, use a cookieless provider and add consent then.

---

## 11. Definition of done

1. All 16 pages exist, are linked, and have no dead links or dead images.
2. `grep -rin "ideas" .` returns nothing outside `/docs`.
3. `grep -rn "REPLACE_ME" .` returns only `js/site.config.js`.
4. No lorem ipsum, no `TODO`, no placeholder images anywhere in `/` output.
5. All §8 gates pass, verified and reported with numbers.
6. `README.md` explains how to run locally, how to fill `site.config.js`, and how to deploy.
