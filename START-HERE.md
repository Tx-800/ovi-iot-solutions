# OVI IoT Solutions — vibe-coding kit

Everything Claude Code needs to build the OVI IoT Solutions website in one pass.
Content is taken from the company profile deck and rebranded from the retired name **IDEAS IOT**.

## What's in here

| File | What it is |
|---|---|
| **`PROMPT.md`** | 👉 **Start here.** The prompt to paste into Claude Code, plus the follow-up prompts for each phase. |
| `PRD.md` | Every word of content for all 14 pages, the sitemap, functional and non-functional requirements, SEO spec, and the one config block where contact details live. |
| `DESIGN.md` | The "Coverage" design concept, colour tokens sampled from your logo, the type system, layout grid, component specs, the two signature animated pieces, and a banned-patterns list. |
| `ARCHITECTURE.md` | Stack decisions, the full file tree, HTML/CSS/JS conventions, the partials system, performance budget, a11y and security requirements. |
| `AGENTS.md` | How Claude Code should work: ten non-negotiable rules, copywriting rules, the verification loop, reporting format. Rename a copy to `CLAUDE.md` at the repo root so it's auto-loaded. |
| `TODO.md` | The phased build order (Phase 0 → 7) and the ship gate. Doubles as the status board. |
| `assets/brand/` | Logo and icon files generated from the PNG you supplied. |

## Brand assets generated for you

The supplied logo was a JPEG with black letterbox bars. These are cleaned up and web-ready.
**The mark itself is untouched** — same shapes, same colours, nothing redrawn.

| File | Size | Use |
|---|---|---|
| `ovi-logo.png` | 658×285 | transparent master |
| `ovi-logo-1200/600/320/160.png` | — | responsive `srcset` |
| `ovi-mark.png` | 292×205 | infinity + wifi mark alone |
| `favicon.ico` | 16/32/48/64 | browser tab |
| `favicon-16.png`, `favicon-32.png` | — | modern PNG favicons |
| `apple-touch-icon.png` | 180×180 | iOS home screen |
| `icon-192.png`, `icon-512.png`, `icon-512-maskable.png` | — | PWA manifest |
| `og-image.jpg` | 1200×630 | WhatsApp / LinkedIn / X link previews |

**Brand colours, sampled from the logo file (not eyeballed):**
`--ovi-blue: #0387F6` · `--ovi-navy: #1C2C45`

## Before you run

Fill in `PRD.md` §6 with your real contact details — address, phone, WhatsApp number, email, domain,
business hours — and get a free [Web3Forms](https://web3forms.com) access key for the contact form.
Everything else is ready.
