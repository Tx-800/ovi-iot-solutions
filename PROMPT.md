# The prompt to paste into Claude Code

## Before you paste

1. Create an empty folder, e.g. `ovi-website/`, and open it in VS Code.
2. Copy the kit in:
   ```
   ovi-website/
   ├── docs/
   │   ├── PRD.md
   │   ├── AGENTS.md
   │   ├── DESIGN.md
   │   ├── ARCHITECTURE.md
   │   └── TODO.md
   ├── AGENTS.md          ← copy of docs/AGENTS.md (Claude Code auto-reads this)
   └── assets/brand/      ← the 12 logo + icon files
   ```
3. Open `docs/PRD.md` §6 and fill in the real contact details if you have them. If not, leave
   `REPLACE_ME` — the build is designed around that and it's a one-file change later.
4. Run `claude` in the terminal, then paste the prompt below.

> **Work phase by phase.** Paste the prompt, let it finish Phase 0–1, check the result, then say
> `continue with Phase 2`. One long unattended run produces worse work than five short supervised ones.

---

## ▼ COPY FROM HERE ▼

```
You are building a complete static marketing website for OVI IoT Solutions, a LoRaWAN and NB-IoT
infrastructure IoT company.

Everything you need is already written down. Start by reading these five files IN FULL, in this order,
before writing any code:

  1. docs/AGENTS.md         — how you work, the ten non-negotiable rules, the verification loop
  2. docs/PRD.md            — every word of content, the 14-page sitemap, functional requirements
  3. docs/DESIGN.md         — the "Coverage" design concept, tokens, type, layout, motion
  4. docs/ARCHITECTURE.md   — stack, file tree, conventions, performance budget
  5. docs/TODO.md           — the phased build order and the ship gate

Then work through docs/TODO.md from Phase 0, in order, ticking boxes as you go.

Six things to internalise before you start, because they are where this build most easily goes wrong:

1. THE RENAME. The source company profile deck is branded "IDEAS IOT". That name is retired. The
   company is "OVI IoT Solutions" ("OVI" after first mention). The substring "IDEAS" must not appear
   anywhere in any shipped file — not in markup, CSS, JS, comments, alt text, meta tags, JSON-LD, or
   filenames.

2. STACK. HTML, CSS and vanilla JavaScript only. No React, no Tailwind, no bundler, no build step
   required to view the site. The brief mentions Kokonut UI and Bklit UI — both are React/shadcn
   libraries and CANNOT be imported here. Use them as visual reference only and re-implement anything
   you like in plain semantic HTML and our own CSS. Motion (motion.dev) IS usable: it has a real
   vanilla ESM API, and it is our animation engine. The full dependency list is ARCHITECTURE.md §1 —
   do not add anything outside it without asking me first.

3. DO NOT INVENT FACTS. No fake clients, logos, case studies, testimonials, statistics, certifications,
   awards, team members, or years in business. Every factual claim on this site must come from
   PRD.md §4, which is taken from the company's own profile deck. If a section feels thin without a
   number, use a qualitative benefit from PRD.md instead of inventing one.

4. THE LOGO IS FINAL. assets/brand/ already contains the transparent master PNG, four web sizes, the
   icon-only mark, a full favicon set, app icons, and a 1200x630 OG image. Do not redraw, recolour,
   trace, outline, stretch, or regenerate the logo. The two brand colours are sampled from that file
   and are in DESIGN.md §2: --ovi-blue #0387F6 and --ovi-navy #1C2C45.

5. THE DESIGN MUST NOT LOOK TEMPLATED. DESIGN.md §1 sets out a specific concept — "Coverage", built on
   RF contour rings and the dashed-wireless / solid-wired line convention from the company's own
   architecture diagram. Read its banned-patterns list and honour it: no cream backgrounds, no
   identical rounded cards with soft grey shadows, no tracked-out ALL-CAPS eyebrows, no arrow glyphs
   appended to button labels, no fade-up animation on every section, no gradient-blob decoration.
   Spend the boldness on the hero coverage plot and keep everything else quiet.

6. CONTACT DETAILS LIVE IN ONE FILE. js/site.config.js only. Never hardcode a phone number, email, or
   address into a page. Values currently reading REPLACE_ME are expected — build around them.

Working agreement:

- Build index.html completely first — markup, CSS, JS, responsive, accessibility — and get it genuinely
  good before producing the other 13 pages. It is the reference implementation.
- Run the verification loop in AGENTS.md §6 at the end of every phase, and always finish a page by
  taking a screenshot at 375px and 1440px and looking at it fresh. You will see what you intended, not
  what rendered, if you only read your own code.
- Never claim a number you did not measure. If a gate fails, say so with the real figure.
- Report at the end of each phase in four lines: Done / Decisions / Numbers / Next. Then stop and wait
  for me before starting the next phase.
- Stop and ask me if PRD.md and DESIGN.md genuinely contradict each other, if you want a dependency not
  in ARCHITECTURE.md §1, or if you need a company fact that isn't written down. Otherwise make the call,
  log it in TODO.md under Decisions, and keep moving.

Start now with Phase 0 and Phase 1, then stop and report.
```

## ▲ COPY TO HERE ▲

---

## Follow-up prompts

Once Phase 0–1 look right, drive it one phase at a time:

| When | Say |
|---|---|
| After Phase 1 | `Phase 2: build the shared header, footer, CTA band and the partial-sync tool.` |
| After Phase 2 | `Phase 3: build index.html completely, including the hero coverage plot and the animated architecture diagram. Then screenshot it at 375px and 1440px and show me.` |
| Home looks good | `Phase 4: build all inner pages using index.html's patterns. Content verbatim from PRD.md §4.` |
| After Phase 4 | `Phase 5: contact page, Web3Forms submission, WhatsApp and call buttons, lazy Leaflet map.` |
| After Phase 5 | `Phase 6: 404, sitemap, robots, manifest, JSON-LD, image optimisation, pin CDN versions, README.` |
| Last | `Phase 7: run the full ship gate in TODO.md and report every real number. Don't fix anything yet — show me the list first.` |

### Useful mid-build prompts

- `The hero doesn't feel specific enough to an RF company yet. Re-read DESIGN.md §1 and §6.1 and rework the coverage plot.`
- `Screenshot every page at 375px, look at them fresh, and give me a list of what's actually broken.`
- `Run the verification loop in AGENTS.md §6 and paste the real output.`
- `I've filled in js/site.config.js. Re-run tools/sync-partials.js and verify the tel:, mailto: and wa.me links.`
- `Audit the whole site against DESIGN.md §10 and answer all seven questions honestly.`
