# AGENTS.md — working rules for this repository

> Read this **first**, in full, before writing a single line. Then `PRD.md` → `DESIGN.md` → `ARCHITECTURE.md` → `TODO.md`.
> `CLAUDE.md` in the repo root is a symlink to this file. They are the same document.

---

## 1. What this project is

A **static marketing website** for **OVI IoT Solutions** — a LoRaWAN / NB-IoT infrastructure IoT company.
16 pages. **HTML, CSS and vanilla JavaScript only.** No React, no framework, no bundler.

The site's job is to win a technical meeting with a utility engineer, a procurement officer, or a
plant HSE manager. Credibility beats flash.

---

## 2. The five documents

| File | Owns | You consult it when |
|---|---|---|
| `AGENTS.md` | process, rules, quality bar | always, first |
| `PRD.md` | **content** — every word on the site, the sitemap, the requirements | writing any copy or deciding what a page contains |
| `DESIGN.md` | **visuals** — the concept, tokens, type, layout, motion | writing any CSS or choosing any visual treatment |
| `ARCHITECTURE.md` | **build** — stack, file tree, conventions, budgets | creating files, adding a dependency, structuring code |
| `TODO.md` | **order** — the phased build plan and the ship gate | starting work, and at the end of every phase |

**Precedence when they disagree:** `PRD.md` > `DESIGN.md` > `ARCHITECTURE.md` > your own preference.
If you find a real contradiction, **stop and ask** — do not silently pick one.

**The accessibility gate wins over the design doc whenever they disagree.** If a visual instruction
in `DESIGN.md` cannot meet WCAG 2.2 AA, the gate stands and the design doc is wrong. Implement the
accessible version, log it under *Decisions*, and flag it for sign-off — do not ship a known
violation because a document asked for it.

---

## 3. Ten rules that are not negotiable

1. **The company is `OVI IoT Solutions`.** The old name `IDEAS IOT` is retired. The substring `IDEAS` must not appear in any shipped file. See `PRD.md` §0.
2. **Do not invent facts.** No fake clients, logos, case studies, testimonials, statistics, certifications, awards, team members, or years-in-business. If `PRD.md` §4 doesn't say it, it doesn't go on the site. See `PRD.md` §2.
3. **No React, no Tailwind, no bundler.** Kokonut UI and Bklit UI are React libraries — reference their *look*, re-implement in plain HTML/CSS. See `ARCHITECTURE.md` §1.
4. **The logo is supplied and final.** Do not redraw it, recolour it, trace it to SVG, add effects to it, or generate a variant. Files are already in `assets/brand/`.
5. **Contact details live only in `js/site.config.js`.** Never hardcode a phone number, email, or address into a page. See `PRD.md` §6.
6. **Design tokens only.** No raw hex values, no magic pixel numbers, outside `css/02-tokens.css`.
7. **Accessibility is a gate, not a nice-to-have.** WCAG 2.2 AA, zero axe violations, full keyboard operation.
8. **The site must work with JavaScript disabled.** All content readable, all links functional, form still submits.
9. **One orchestrated motion moment per page.** Scroll-triggered fade-ups on every section are banned. See `DESIGN.md` §8.
10. **Verify, don't assume.** Every claim you make about the build ("Lighthouse 97", "no violations", "all links work") must come from a command you actually ran. See §6.

---

## 4. How to work

### Build in the order `TODO.md` gives
Phases exist because later work depends on earlier work. Do not jump ahead to "make it pretty" before
the tokens and layout primitives exist — you will write CSS you then have to delete.

### Build one page completely, then templatise
Build `index.html` end to end — markup, CSS, JS, responsive, a11y — and get it genuinely good.
It establishes every pattern. Only then produce the other 13, which become mostly assembly.

### Finish the thing you started
Do not leave a page half-built to go start another. A page is done when it passes §6 at every breakpoint.

### Prefer deleting to adding
If a section needs a decoration to feel finished, the layout is wrong. Fix the layout.

### Ask when it matters
Stop and ask the user — do not guess — when:
- `PRD.md` and `DESIGN.md` genuinely contradict each other
- you want a dependency not listed in `ARCHITECTURE.md` §1
- you need a fact about the company that is not in `PRD.md`
- a real contact detail is still `REPLACE_ME` and the user is present to supply it
- something in the source material looks wrong or out of date

Otherwise, make the call, note it in `TODO.md` under *Decisions*, and keep moving.

### Never do these
- ❌ Leave `lorem ipsum`, `TODO`, `FIXME`, `Coming soon`, or a grey placeholder box in shipped output
- ❌ Ship a link to `#` or a page that doesn't exist
- ❌ Hand-edit header/footer markup inside a page (edit `partials/`, run `tools/sync-partials.js`)
- ❌ Use `!important` outside the reduced-motion block
- ❌ Use `outline: none` without an equivalent `:focus-visible` replacement
- ❌ Commit `node_modules`, `.DS_Store`, or editor config
- ❌ Reformat or restructure a file you were not asked to touch

---

## 5. Copywriting rules

You will write connective copy. Hold to this:

- **Sentence case** for every heading, button and label. No Title Case, no ALL-CAPS.
- **Active voice.** A button says what happens: `Request a consultation`, not `Submit`.
- **Plain, specific, technical.** Write for an engineer who already knows what LoRaWAN is.
- **Banned words:** revolutionary, cutting-edge, seamless, unleash, empower, game-changing, next-generation, world-class, synergy, leverage (as a verb), robust solutions, state-of-the-art, best-in-class.
- **No invented numbers.** Not even "99.9% uptime" or "years of experience".
- **`IoT`** is always camel-case. **`LoRaWAN`** and **`NB-IoT`** are always spelled exactly like that.
- Empty and error states give direction, not mood: say what happened and what to do next.
- Keep each written element doing exactly one job.

---

## 6. Verification loop — run this at the end of every phase

```bash
# 1. The rename actually happened
grep -rin "ideas" . --include="*.html" --include="*.css" --include="*.js" --exclude-dir=docs
# expect: no output

# 2. No placeholders escaped into shipped files
grep -rn "REPLACE_ME" . --include="*.html" --exclude-dir=docs
grep -rin "lorem\|ipsum\|TODO\|FIXME\|coming soon\|\[insert" . --include="*.html"
# expect: no output

# 3. No dead links
grep -rn 'href="#"' . --include="*.html"
# expect: no output

# 4. Every internal link resolves (write this as a tiny node script, or use a link checker)
node tools/check-links.js

# 5. Partials are in sync
node tools/sync-partials.js && git diff --stat
# expect: no changes if you edited partials properly
```

Then, in the browser:

| Check | How | Gate |
|---|---|---|
| Lighthouse | DevTools → Lighthouse → Mobile, on `index.html` and one solution page | Perf ≥ 95, A11y 100, BP ≥ 95, SEO 100 |
| axe | axe DevTools extension, every page | 0 violations |
| Keyboard | Tab through the whole page, open the menu, open the drawer, submit the form | no trap, focus always visible, `Esc` works |
| Reduced motion | OS setting on → reload | nothing animates |
| JS off | DevTools → disable JS → reload | content readable, nav usable, form submits |
| Responsive | 320 / 360 / 414 / 768 / 1024 / 1440 / 2560 | no horizontal scroll, nothing overlaps or clips |
| Screenshot review | Capture 375 px and 1440 px, **look at the images fresh** | fix what you see, not what you intended |

> After staring at your own code you will see what you meant, not what rendered.
> **Always finish by looking at a screenshot.** It catches overflow and overlap that reading code never will.

---

## 7. Reporting back

When you finish a phase, report in **four lines**:

```
Done:     what now exists
Decisions: judgement calls you made and why
Numbers:  Lighthouse / axe / budget figures you actually measured
Next:     the next TODO item
```

- Never claim a number you did not measure.
- If a gate failed, say so plainly with the number, and say what you'll do about it. Do not round up, do not bury it.
- Don't narrate every file write. One summary per phase.

---

## 8. Git

- Small, scoped commits. Conventional prefixes: `feat:`, `fix:`, `style:`, `refactor:`, `docs:`, `chore:`, `a11y:`, `perf:`.
- One concern per commit. `feat: solutions index page` — not `feat: everything`.
- Never commit secrets. The Web3Forms access key is public by design, but still read it from `site.config.js`.
- Do not force-push, do not rewrite history, do not commit unless the user asked.

---

## 9. When you are stuck

1. Re-read the relevant doc section. The answer is usually written down.
2. Build the simplest version that works, confirm it, then improve it.
3. If you've tried the same fix twice and it hasn't worked, stop and explain the problem instead of trying a third variation.
