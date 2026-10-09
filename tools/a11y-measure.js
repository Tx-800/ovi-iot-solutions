/* ==========================================================================
   a11y-measure.js — rendered contrast and target-size measurement.

   Dev-only, loaded by tools/a11y-harness.html; never linked from the site.

   axe missed failures in this project that a reviewer later found by eye:
   a primary button whose fill was too light for its white label, an input
   border that vanished against the page, breadcrumb links too small to hit.
   axe stays quiet on the first when the background is a pseudo-element or a
   gradient, does not test component boundaries at all, and exempts small
   targets more generously than WCAG does. This module measures what the
   page actually renders, for every interactive element, in four states
   (rest, hover, keyboard focus, and the header after scrolling):

     1.4.3  text contrast — every visible text run inside the control, and
            placeholder text, against the composited background under it.
            4.5:1, or 3:1 for large text (24px, or 18.66px bold).
     1.4.11 non-text contrast, 3:1 against the surroundings:
            - form fields: border or fill must be identifiable
            - icon-only controls: the icon against what is under it
            - the focus indicator (outline or box-shadow) against what is
              next to it
     2.4.11 focus not obscured — a focused control must not be entirely
            covered by something else (a panel, a sticky bar, a backdrop).
     2.5.8  target size — 24×24 CSS px, unless the inline exception (a link
            inside a sentence) or the spacing exception (a 24px circle on
            the target's centre touches no other target) applies.

   How the background is found: document.elementsFromPoint() at the point
   being tested, then every layer under the element is composited bottom-up
   — background colours with their alpha and inherited opacity, every colour
   stop of a gradient as a separate candidate, and ::before/::after fills as
   optional layers (present or absent, both tested). Photographs, canvases
   and url() backgrounds have unknown pixels, so they are bracketed between
   black and white and the worst case is kept. Every candidate must pass.
   That is deliberately pessimistic: a false alarm costs a minute to check,
   a false pass ships.

   :hover cannot be forced from script, so every :hover rule in the page's
   stylesheets is cloned, in place and in the same cascade layer, as an
   attribute selector the measurer can switch on.
   ========================================================================== */

(function () {
  'use strict';

  const INTERACTIVE = [
    'a[href]', 'button', 'input:not([type="hidden"])', 'select', 'textarea',
    'summary', '[tabindex]:not([tabindex="-1"])', '[role="button"]', '[role="link"]',
    '[contenteditable="true"]',
  ].join(',');
  const TEXT_FIELDS = new Set(['text', 'email', 'tel', 'url', 'search', 'password', 'number', 'date']);
  const HOVER_ATTR = 'data-a11y-hover';
  const TARGET_MIN = 24;
  const MAX_CANDIDATES = 48;

  /* ---- colour ---------------------------------------------------------- */

  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const parsed = new Map();

  /** Any CSS colour string → [r, g, b, a] with r,g,b 0–255 and a 0–1.
   *  The canvas does the parsing, so oklch(), color-mix() and friends work. */
  function parseColor(str) {
    if (parsed.has(str)) return parsed.get(str);
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = '#000';
    ctx.fillStyle = str;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
    /* getImageData un-premultiplies, which loses precision at low alpha;
       read the alpha from the string itself when it is a plain rgba(). */
    const m = /^rgba?\(\s*[\d.]+[\s,]+[\d.]+[\s,]+[\d.]+\s*[,/]\s*([\d.]+%?)\s*\)$/.exec(str.trim());
    let alpha = a / 255;
    if (m) alpha = m[1].endsWith('%') ? parseFloat(m[1]) / 100 : parseFloat(m[1]);
    if (/^transparent$/i.test(str.trim())) alpha = 0;
    const c = [r, g, b, alpha];
    parsed.set(str, c);
    return c;
  }

  const COLOR_TOKEN = /(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\([^()]*(?:\([^()]*\)[^()]*)*\)|#[0-9a-f]{3,8}\b|\btransparent\b/gi;

  function colorsIn(str) {
    return (str.match(COLOR_TOKEN) || []).map(parseColor);
  }

  function over(top, bottom) {
    const a = top[3];
    return [
      top[0] * a + bottom[0] * (1 - a),
      top[1] * a + bottom[1] * (1 - a),
      top[2] * a + bottom[2] * (1 - a),
      1,
    ];
  }

  function luminance([r, g, b]) {
    const lin = (v) => {
      const c = v / 255;
      return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  }

  function ratio(a, b) {
    const la = luminance(a);
    const lb = luminance(b);
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
  }

  const hex = (c) => '#' + c.slice(0, 3).map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');

  /* ---- geometry and visibility ---------------------------------------- */

  function rendered(el) {
    if (!el.isConnected) return false;
    if (typeof el.checkVisibility === 'function'
      && !el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) return false;
    const r = el.getBoundingClientRect();
    return r.width > 1 && r.height > 1;
  }

  function opacityChain(el, win) {
    let o = 1;
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
      o *= parseFloat(win.getComputedStyle(n).opacity);
    }
    return o;
  }

  function* ancestorsOf(node) {
    for (let n = node; n && n.nodeType === 1; n = n.parentElement) yield n;
  }

  function within(node, root) {
    return node === root || root.contains(node);
  }

  /** Background layers of one element, bottom first. Each layer is a list of
   *  alternatives; null means "this layer may be absent at this point". */
  function layersOf(el, win, op) {
    const cs = win.getComputedStyle(el);
    const layers = [];
    const fill = parseColor(cs.backgroundColor);
    if (fill[3] > 0) layers.push([[fill[0], fill[1], fill[2], fill[3] * op]]);

    const img = cs.backgroundImage;
    if (img && img !== 'none') {
      if (/url\(/.test(img)) layers.push(['image']);
      const stops = colorsIn(img).filter((c) => c[3] > 0);
      if (stops.length) layers.push(stops.map((c) => [c[0], c[1], c[2], c[3] * op]));
    }

    if (/^(img|video|canvas|picture|iframe|object|embed)$/i.test(el.tagName)) layers.push(['image']);
    if (el.tagName === 'svg' || el.tagName === 'SVG') {
      /* An inline SVG paints its own fill under any text placed on it. */
      const f = cs.fill;
      if (f && f !== 'none' && !/url\(/.test(f)) {
        const c = parseColor(f);
        if (c[3] > 0) layers.push([null, [c[0], c[1], c[2], c[3] * op]]);
      }
    }

    for (const pseudo of ['::before', '::after']) {
      const ps = win.getComputedStyle(el, pseudo);
      if (ps.content === 'none' || ps.content === 'normal' || ps.display === 'none') continue;
      if (ps.visibility === 'hidden') continue;
      const pop = op * parseFloat(ps.opacity);
      const alts = [null];
      const pf = parseColor(ps.backgroundColor);
      if (pf[3] > 0) alts.push([pf[0], pf[1], pf[2], pf[3] * pop]);
      const pimg = ps.backgroundImage;
      if (pimg && pimg !== 'none') {
        if (/url\(/.test(pimg)) alts.push('image');
        for (const c of colorsIn(pimg)) if (c[3] > 0) alts.push([c[0], c[1], c[2], c[3] * pop]);
      }
      /* ::before paints under the element's content, ::after over the
         element's background too; either way it sits above the element's
         own background, which is where it is pushed. */
      if (alts.length > 1) layers.push(alts);
    }
    return layers;
  }

  /** Every background colour that may be under (x, y), below `from`.
   *  `from` itself is included unless `excludeRoot` is given, in which case
   *  that element and its descendants are skipped (for "surroundings"). */
  function backgroundsAt(doc, win, x, y, { from = null, excludeRoot = null } = {}) {
    const stack = doc.elementsFromPoint(x, y);
    let start = 0;
    if (from) {
      start = stack.indexOf(from);
      if (start < 0) return null;
    }
    let below = stack.slice(start);
    if (excludeRoot) {
      /* Surroundings are what the component is designed to sit on. A
         floating control — position:fixed and itself interactive, like the
         WhatsApp and back-to-top buttons — floats over whatever
         happens to scroll beneath it, so it is not part of any component's
         surroundings; overlap with it is 2.4.11's job (checkObscured). Fixed
         layers that are not controls (the open drawer panel) still count. */
      below = below.filter((n) => !within(n, excludeRoot)
        && ![...ancestorsOf(n)].some((a) => !within(excludeRoot, a)
          && a.matches(INTERACTIVE) && win.getComputedStyle(a).position === 'fixed'));
    }

    let candidates = [[255, 255, 255, 1]];
    for (const el of below.reverse()) {
      const op = opacityChain(el, win);
      for (const alts of layersOf(el, win, op)) {
        const next = [];
        for (const base of candidates) {
          for (const alt of alts) {
            if (alt === null) next.push(base);
            else if (alt === 'image') next.push([0, 0, 0, 1], [255, 255, 255, 1]);
            else next.push(over(alt, base));
          }
        }
        const seen = new Set();
        candidates = next.filter((c) => {
          const k = c.slice(0, 3).map(Math.round).join(',');
          if (seen.has(k)) return false;
          seen.add(k);
          return true;
        });
        if (candidates.length > MAX_CANDIDATES) {
          /* Keep the extremes: contrast is worst at the lightest or darkest
             background, so the middle can be dropped without losing it. */
          candidates.sort((a, b) => luminance(a) - luminance(b));
          candidates = [...candidates.slice(0, MAX_CANDIDATES / 2), ...candidates.slice(-MAX_CANDIDATES / 2)];
        }
      }
    }
    return candidates;
  }

  /** Lowest contrast of a foreground (with alpha) against any candidate
   *  background, plus the colours that produced it. */
  function worst(fg, bgs) {
    let min = Infinity;
    let pair = null;
    for (const bg of bgs) {
      const f = fg[3] < 1 ? over(fg, bg) : fg;
      const r = ratio(f, bg);
      if (r < min) { min = r; pair = [f, bg]; }
    }
    return { ratio: min, fg: pair && hex(pair[0]), bg: pair && hex(pair[1]) };
  }

  /** Best contrast between a set of component colours and a set of
   *  surroundings, judged at the worst surrounding. */
  function boundary(compBgs, outBgs) {
    let min = Infinity;
    let pair = null;
    for (const out of outBgs) {
      let best = 0;
      let bp = null;
      for (const c of compBgs) {
        const r = ratio(c, out);
        if (r > best) { best = r; bp = [c, out]; }
      }
      if (best < min) { min = best; pair = bp; }
    }
    return { ratio: min, fg: pair && hex(pair[0]), bg: pair && hex(pair[1]) };
  }

  /* ---- describing elements ------------------------------------------- */

  function describe(el) {
    const parts = [];
    for (let n = el, depth = 0; n && n.nodeType === 1 && depth < 4; n = n.parentElement, depth++) {
      let s = n.tagName.toLowerCase();
      if (n.id) { parts.unshift(`${s}#${n.id}`); break; }
      const cls = [...n.classList].slice(0, 2);
      if (cls.length) s += '.' + cls.join('.');
      parts.unshift(s);
      if (n.tagName === 'MAIN' || n.tagName === 'HEADER' || n.tagName === 'FOOTER') break;
    }
    const label = (el.getAttribute('aria-label') || el.textContent || el.getAttribute('placeholder') || el.name || '')
      .replace(/\s+/g, ' ').trim().slice(0, 40);
    return { selector: parts.join(' > '), label };
  }

  /* ---- hover ----------------------------------------------------------- */

  /** Clone every :hover rule as [data-a11y-hover], directly after the
   *  original so it sits in the same layer at the same cascade position. */
  function cloneHoverRules(doc) {
    let cloned = 0;
    const walk = (list) => {
      for (let i = list.cssRules.length - 1; i >= 0; i--) {
        const rule = list.cssRules[i];
        if (rule.cssRules && !(rule instanceof CSSStyleRule)) {
          walk(rule);
          continue;
        }
        if (rule instanceof CSSStyleRule && rule.selectorText.includes(':hover')) {
          const sel = rule.selectorText.replaceAll(':hover', `[${HOVER_ATTR}]`);
          try {
            list.insertRule(`${sel} { ${rule.style.cssText} }`, i + 1);
            cloned += 1;
          } catch { /* a selector the clone cannot express; leave it */ }
        }
      }
    };
    for (const sheet of doc.styleSheets) {
      try { walk(sheet); } catch { /* cross-origin sheet (Leaflet); its hover rules are not ours */ }
    }
    return cloned;
  }

  function setHover(el, on) {
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
      if (on) n.setAttribute(HOVER_ATTR, '');
      else n.removeAttribute(HOVER_ATTR);
    }
  }

  /* ---- the checks ------------------------------------------------------ */

  function isLarge(cs) {
    const size = parseFloat(cs.fontSize);
    const weight = parseInt(cs.fontWeight, 10) || 400;
    return size >= 24 || (size >= 18.66 && weight >= 700);
  }

  function visibleTextRuns(el, doc) {
    const runs = [];
    const walker = doc.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let t = walker.nextNode(); t; t = walker.nextNode()) {
      if (!t.data.trim()) continue;
      const p = t.parentElement;
      if (!p || !rendered(p)) continue;
      const range = doc.createRange();
      range.selectNodeContents(t);
      const rects = [...range.getClientRects()].filter((r) => r.width > 1 && r.height > 1);
      if (!rects.length) continue;
      runs.push({ node: t, parent: p, rects: rects.slice(0, 3) });
    }
    return runs;
  }

  function inViewport(win, x, y) {
    return x >= 0 && y >= 0 && x < win.innerWidth && y < win.innerHeight;
  }

  function checkText(el, ctxt, state, report) {
    const { doc, win } = ctxt;
    const tag = el.tagName;
    const isField = (tag === 'INPUT' && TEXT_FIELDS.has(el.type)) || tag === 'TEXTAREA' || tag === 'SELECT';
    let anyText = false;

    if (isField) {
      const r = el.getBoundingClientRect();
      const x = r.left + Math.min(r.width / 2, 24);
      const y = r.top + r.height / 2;
      if (!inViewport(win, x, y)) return { anyText: false, skipped: 'offscreen' };
      const bgs = backgroundsAt(doc, win, x, y, { from: el });
      if (!bgs) return { anyText: false, skipped: 'not at its own point' };
      const cs = win.getComputedStyle(el);
      const need = isLarge(cs) ? 3 : 4.5;
      const fg = parseColor(cs.color);
      const res = worst([fg[0], fg[1], fg[2], fg[3] * opacityChain(el, win)], bgs);
      if (res.ratio < need) report('1.4.3', state, el, `field text ${res.fg} on ${res.bg} = ${res.ratio.toFixed(2)}:1, needs ${need}:1`);
      if (el.placeholder && !el.value) {
        const ps = win.getComputedStyle(el, '::placeholder');
        const pf = parseColor(ps.color);
        const pres = worst([pf[0], pf[1], pf[2], pf[3] * opacityChain(el, win)], bgs);
        if (pres.ratio < need) report('1.4.3', state, el, `placeholder ${pres.fg} on ${pres.bg} = ${pres.ratio.toFixed(2)}:1, needs ${need}:1`);
      }
      return { anyText: true };
    }

    for (const run of visibleTextRuns(el, doc)) {
      const cs = win.getComputedStyle(run.parent);
      const need = isLarge(cs) ? 3 : 4.5;
      const fg = parseColor(cs.webkitTextFillColor && cs.webkitTextFillColor !== cs.color
        ? cs.webkitTextFillColor : cs.color);
      const op = opacityChain(run.parent, win);
      for (const rect of run.rects) {
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        if (!inViewport(win, x, y)) continue;
        const bgs = backgroundsAt(doc, win, x, y, { from: run.parent });
        if (!bgs) continue; /* clipped away at this point (visually hidden text) */
        anyText = true;
        const res = worst([fg[0], fg[1], fg[2], fg[3] * op], bgs);
        if (res.ratio < need) {
          report('1.4.3', state, el, `“${run.node.data.trim().slice(0, 30)}” ${res.fg} on ${res.bg} = ${res.ratio.toFixed(2)}:1, needs ${need}:1`);
          break;
        }
      }
    }
    return { anyText };
  }

  /** Points just outside each edge of a rect, `gap` px away. */
  function outsidePoints(r, gap) {
    return [
      [r.left - gap, r.top + r.height / 2],
      [r.right + gap, r.top + r.height / 2],
      [r.left + r.width / 2, r.top - gap],
      [r.left + r.width / 2, r.bottom + gap],
    ];
  }

  function surroundings(el, ctxt, gap) {
    const { doc, win } = ctxt;
    const r = el.getBoundingClientRect();
    let all = [];
    for (const [x, y] of outsidePoints(r, gap)) {
      if (!inViewport(win, x, y)) continue;
      const b = backgroundsAt(doc, win, x, y, { excludeRoot: el });
      if (b) all = all.concat(b);
    }
    return all;
  }

  function checkFieldBoundary(el, ctxt, state, report) {
    const { doc, win } = ctxt;
    const cs = win.getComputedStyle(el);
    const out = surroundings(el, ctxt, 2);
    if (!out.length) return;
    const r = el.getBoundingClientRect();
    const inside = backgroundsAt(doc, win, r.left + r.width / 2, r.top + r.height / 2, { from: el }) || [];

    const comp = [];
    for (const side of ['Top', 'Right', 'Bottom', 'Left']) {
      const w = parseFloat(cs[`border${side}Width`]);
      const style = cs[`border${side}Style`];
      if (w >= 1 && style !== 'none' && style !== 'hidden') {
        const c = parseColor(cs[`border${side}Color`]);
        if (c[3] > 0) for (const o of out) comp.push(over(c, o));
      }
    }
    /* A filled field is identifiable by its fill alone. */
    for (const f of inside) comp.push(f);

    if (cs.appearance !== 'none' && (el.type === 'checkbox' || el.type === 'radio')) {
      report('1.4.11', state, el, 'native checkbox/radio: rendering is the browser\'s, not measurable here — check by eye', 'unverified');
      return;
    }
    const res = boundary(comp, out);
    if (res.ratio < 3) report('1.4.11', state, el, `field boundary: best of border/fill ${res.fg} against ${res.bg} = ${res.ratio.toFixed(2)}:1, needs 3:1`);
  }

  function checkIcon(el, ctxt, state, report) {
    const { doc, win } = ctxt;
    if (/^(IMG|PICTURE|CANVAS|VIDEO)$/.test(el.tagName)) return 'image'; /* logos, photos: 1.4.11 does not apply */
    const icons = [...el.querySelectorAll('svg')].filter(rendered);
    const imgs = [...el.querySelectorAll('img')].filter(rendered);
    if (!icons.length) {
      if (imgs.length) return 'image';
      const r = el.getBoundingClientRect();
      const top = doc.elementsFromPoint(r.left + r.width / 2, r.top + r.height / 2).slice(0, 3)
        .map((n) => n.tagName.toLowerCase() + (n.classList[0] ? '.' + n.classList[0] : '')).join(' > ');
      report('1.4.11', state, el, `no text or icon found at the control's own position (under its centre: ${top || 'nothing'}, opacity ${win.getComputedStyle(el).opacity}, rect ${Math.round(r.left)},${Math.round(r.top)} ${Math.round(r.width)}×${Math.round(r.height)})`, 'unverified');
      return 'none';
    }
    for (const svg of icons) {
      const cs = win.getComputedStyle(svg);
      const r = svg.getBoundingClientRect();
      const x = r.left + r.width / 2;
      const y = r.top + r.height / 2;
      if (!inViewport(win, x, y)) continue;
      const bgs = backgroundsAt(doc, win, x, y, { from: svg }) || backgroundsAt(doc, win, x, y, { from: el });
      if (!bgs) continue;
      /* Lucide icons are stroked with currentColor; a filled icon uses fill. */
      const paint = cs.stroke && cs.stroke !== 'none' ? cs.stroke : cs.fill;
      const c = parseColor(/currentcolor/i.test(paint) || !paint || paint === 'none' ? cs.color : paint);
      const res = worst([c[0], c[1], c[2], c[3] * opacityChain(svg, win)], bgs);
      if (res.ratio < 3) report('1.4.11', state, el, `icon ${res.fg} on ${res.bg} = ${res.ratio.toFixed(2)}:1, needs 3:1`);
    }
    return 'icon';
  }

  /** 2.4.11 Focus Not Obscured (Minimum): the focused control must not be
   *  entirely hidden by author-created content. Five points — the centre and
   *  four inset corners — are hit-tested; if something outside the control
   *  is on top at all five, it is hidden. Layers that paint nothing
   *  (opacity 0) do not count as covering it. */
  function checkObscured(el, ctxt, report) {
    const { doc, win } = ctxt;
    const r = el.getBoundingClientRect();
    const ix = Math.min(4, r.width / 4);
    const iy = Math.min(4, r.height / 4);
    const points = [
      [r.left + r.width / 2, r.top + r.height / 2],
      [r.left + ix, r.top + iy], [r.right - ix, r.top + iy],
      [r.left + ix, r.bottom - iy], [r.right - ix, r.bottom - iy],
    ].filter(([x, y]) => inViewport(win, x, y));
    if (!points.length) return;
    let coveredBy = null;
    const visibleAt = points.some(([x, y]) => {
      for (const n of doc.elementsFromPoint(x, y)) {
        if (within(n, el)) return true;
        if (opacityChain(n, win) > 0.05) { coveredBy = coveredBy || n; return false; }
      }
      return false;
    });
    if (!visibleAt && coveredBy) {
      const d = describe(coveredBy);
      report('2.4.11', 'focus', el, `focused but entirely covered by ${d.selector}`);
    }
  }

  function ringOf(win, node) {
    const cs = win.getComputedStyle(node);
    const ow = parseFloat(cs.outlineWidth);
    const indicators = [];
    let gap = 0;
    if (cs.outlineStyle !== 'none' && ow >= 1) {
      indicators.push(parseColor(cs.outlineColor));
      gap = Math.max(1, parseFloat(cs.outlineOffset) + ow + 1);
    }
    if (cs.boxShadow && cs.boxShadow !== 'none') {
      for (const c of colorsIn(cs.boxShadow)) if (c[3] > 0) indicators.push(c);
      gap = Math.max(gap, 4);
    }
    return { indicators, gap, key: `${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineColor} ${cs.boxShadow}` };
  }

  function checkFocusIndicator(el, ctxt, report) {
    const { win } = ctxt;
    if (el.matches(':disabled')) return;
    const carriers = [];
    for (let n = el, i = 0; n && n.nodeType === 1 && i < 5; n = n.parentElement, i++) {
      carriers.push({ node: n, ring: ringOf(win, n) });
    }
    el.focus({ preventScroll: true });
    if (ctxt.doc.activeElement !== el) return; /* not focusable as marked up */
    checkObscured(el, ctxt, report);
    if (!el.matches(':focus-visible')) {
      report('1.4.11', 'focus', el, 'programmatic focus did not match :focus-visible — indicator not measurable', 'unverified');
      el.blur();
      return;
    }
    /* The ring may be drawn by the control or by an ancestor that reacts to
       it (.card:has(.card__link:focus-visible)); take whichever of them
       gained an outline or box-shadow on focus. */
    let carrier = null;
    let ring = null;
    for (let i = 0; i < carriers.length; i++) {
      const now = ringOf(win, carriers[i].node);
      const changed = now.key !== carriers[i].ring.key;
      if ((i === 0 || changed) && now.indicators.length) { carrier = carriers[i].node; ring = now; break; }
    }
    if (!ring) {
      report('1.4.11', 'focus', el, 'no outline or box-shadow on :focus-visible, on the control or an ancestor', 'fail');
      el.blur();
      return;
    }
    const indicators = ring.indicators;
    const out = surroundings(carrier, ctxt, ring.gap);
    if (out.length) {
      let best = { ratio: 0 };
      for (const ind of indicators) {
        const res = worst(ind, out);
        if (res.ratio > best.ratio) best = res;
      }
      if (best.ratio < 3) report('1.4.11', 'focus', el, `focus indicator ${best.fg} against ${best.bg} = ${best.ratio.toFixed(2)}:1, needs 3:1`);
    }
    el.blur();
  }

  /* ---- target size ---------------------------------------------------- */

  function blockAncestor(el, win) {
    for (let n = el.parentElement; n; n = n.parentElement) {
      const d = win.getComputedStyle(n).display;
      if (!/^inline/.test(d) && d !== 'contents') return n;
    }
    return el.ownerDocument.body;
  }

  /** The inline exception: the target sits in a run of text and its size
   *  is set by the line-height of that text. */
  function isInlineInText(el, win) {
    if (win.getComputedStyle(el).display !== 'inline') return false;
    const block = blockAncestor(el, win);
    const own = el.textContent.replace(/\s+/g, ' ').trim().length;
    const all = block.textContent.replace(/\s+/g, ' ').trim().length;
    /* Another target's text in the same block is not "a sentence"; count
       only text that is not inside a link or button. */
    let prose = 0;
    const walker = el.ownerDocument.createTreeWalker(block, NodeFilter.SHOW_TEXT);
    for (let t = walker.nextNode(); t; t = walker.nextNode()) {
      if (!t.parentElement.closest('a, button')) prose += t.data.replace(/\s+/g, ' ').trim().length;
    }
    return all > own && prose >= 12;
  }

  function targetRect(el, doc) {
    const r = el.getBoundingClientRect();
    if (el.tagName === 'INPUT' && (el.type === 'checkbox' || el.type === 'radio') && el.labels) {
      /* A label that activates the control is part of its target. */
      let { left, top, right, bottom } = r;
      for (const l of el.labels) {
        const lr = l.getBoundingClientRect();
        left = Math.min(left, lr.left); top = Math.min(top, lr.top);
        right = Math.max(right, lr.right); bottom = Math.max(bottom, lr.bottom);
      }
      return { left, top, right, bottom, width: right - left, height: bottom - top };
    }
    return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height };
  }

  function distToRect(x, y, r) {
    const dx = Math.max(r.left - x, 0, x - r.right);
    const dy = Math.max(r.top - y, 0, y - r.bottom);
    return Math.hypot(dx, dy);
  }

  function checkTargets(els, ctxt, report) {
    const { doc, win } = ctxt;
    /* Measure in document coordinates so targets far apart on the page are
       compared correctly however the frame is scrolled. */
    const sx = win.scrollX;
    const sy = win.scrollY;
    const items = els.map((el) => {
      const r = targetRect(el, doc);
      return {
        el,
        r: { left: r.left + sx, right: r.right + sx, top: r.top + sy, bottom: r.bottom + sy, width: r.width, height: r.height },
        fixed: win.getComputedStyle(el).position === 'fixed' || !!el.closest('[data-header]'),
      };
    });
    for (const it of items) {
      it.small = it.r.width < TARGET_MIN - 0.01 || it.r.height < TARGET_MIN - 0.01;
      it.cx = (it.r.left + it.r.right) / 2;
      it.cy = (it.r.top + it.r.bottom) / 2;
    }
    for (const a of items) {
      if (!a.small) continue;
      const size = `${a.r.width.toFixed(1)}×${a.r.height.toFixed(1)}px`;
      if (isInlineInText(a.el, win)) {
        report('2.5.8', 'rest', a.el, `${size}, passes by the inline exception`, 'info');
        continue;
      }
      const clash = items.find((b) => {
        if (b === a || b.fixed !== a.fixed) return false;
        if (within(b.el, a.el) || within(a.el, b.el)) return false;
        if (b.small) return Math.hypot(a.cx - b.cx, a.cy - b.cy) < TARGET_MIN;
        return distToRect(a.cx, a.cy, b.r) < TARGET_MIN / 2;
      });
      if (clash) {
        const d = describe(clash.el);
        report('2.5.8', 'rest', a.el,
          `${size}, and a 24px circle on it overlaps “${d.label || d.selector}”`);
      } else {
        report('2.5.8', 'rest', a.el, `${size}, passes by the spacing exception`, 'info');
      }
    }
  }

  /* ---- the run --------------------------------------------------------- */

  function wait(win, ms) {
    return new Promise((res) => win.setTimeout(res, ms));
  }

  async function settle(win) {
    await wait(win, 60);
    for (const a of win.document.getAnimations()) {
      try {
        if (a.effect && a.effect.getTiming().iterations !== Infinity) a.finish();
        else a.pause(); /* an endless loop (the orbit revolve) is measured where it stands */
      } catch { /* already finished */ }
    }
  }

  /**
   * Measure a loaded page.
   * @param {Window} win   the page's window (an iframe's contentWindow)
   * @param {object} opts  scope: CSS selector limiting which controls are
   *                       measured (default the whole page); label: a name
   *                       for this state in the report; prepare: an async
   *                       function run before each control, to restore the
   *                       state being measured (focusing and blurring a
   *                       menu's controls closes the menu, by design)
   */
  async function measure(win, { scope = null, label = 'page', prepare = null } = {}) {
    const doc = win.document;
    const ctxt = { doc, win };
    const findings = [];
    const seen = new Set();
    const report = (sc, state, el, detail, kind = 'fail') => {
      const d = describe(el);
      const key = `${sc}|${state}|${d.selector}|${d.label}|${detail}`;
      if (seen.has(key)) return;
      seen.add(key);
      findings.push({ sc, state: `${label}/${state}`, kind, selector: d.selector, label: d.label, detail });
    };

    /* Dev harness only: freeze transitions so a state is measured at its
       end value, and make every element hit-testable so a decorative layer
       with pointer-events: none still shows up under the point. */
    const freeze = doc.createElement('style');
    freeze.textContent = `*, *::before, *::after { transition: none !important; pointer-events: auto !important; caret-color: transparent !important; }`;
    doc.head.appendChild(freeze);
    const hoverRules = cloneHoverRules(doc);

    /* One pass down the page so anything revealed on scroll has run. */
    const height = doc.documentElement.scrollHeight;
    if (!scope) {
      for (let y = 0; y < height; y += Math.max(200, win.innerHeight * 0.6)) {
        win.scrollTo(0, y);
        await wait(win, 30);
      }
      win.scrollTo(0, 0);
    }
    await settle(win);

    const root = scope ? doc.querySelector(scope) : doc;
    const controls = root ? [...root.querySelectorAll(INTERACTIVE)].filter((el) => {
      if (el.closest('[inert]')) return false;
      return rendered(el);
    }) : [];
    /* A visually hidden control (the skip link) appears on focus; it is
       measured in its focused state below and skipped at rest. */
    const counted = { controls: controls.length, hoverRules };

    const offscreen = [];
    const gone = new Set();
    const sweep = async (els, tag, withStates) => {
      for (const el of els) {
        if (el.matches(':disabled')) continue;
        if (prepare) await prepare();
        if (!rendered(el) && win.getComputedStyle(el).position === 'fixed') {
          /* Fixed controls that appear once the page has scrolled (back to
             top): scroll down and give the observer a moment. */
          win.scrollTo(0, Math.min(doc.documentElement.scrollHeight, win.innerHeight * 2));
          await settle(win);
          await wait(win, 200);
        }
        if (typeof el.checkVisibility === 'function' && !el.checkVisibility()) {
          /* display: none — the page removed it on purpose (the map's
             fallback link once Leaflet mounts). Nothing left to measure. */
          gone.add(el);
          continue;
        }
        if (!rendered(el)) {
          report('1.4.11', tag, el, 'stopped rendering before it could be measured', 'unverified');
          continue;
        }
        const r0 = el.getBoundingClientRect();
        if (r0.top < 0 || r0.bottom > win.innerHeight) {
          const before = win.scrollY;
          el.scrollIntoView({ block: 'center', inline: 'nearest' });
          if (win.scrollY !== before) await settle(win);
        }
        const r1 = el.getBoundingClientRect();
        if (r1.bottom <= 0 || r1.right <= 0 || r1.top >= win.innerHeight || r1.left >= win.innerWidth) {
          offscreen.push(el); /* parked off-screen until focused: the skip link */
          continue;
        }
        const isField = (el.tagName === 'INPUT' && TEXT_FIELDS.has(el.type)) || el.tagName === 'TEXTAREA'
          || el.tagName === 'SELECT' || (el.tagName === 'INPUT' && (el.type === 'checkbox' || el.type === 'radio'));

        const t = checkText(el, ctxt, tag, report);
        if (isField) checkFieldBoundary(el, ctxt, tag, report);
        else if (!t.anyText && !t.skipped) checkIcon(el, ctxt, tag, report);
        if (!withStates) continue;

        setHover(el, true);
        checkText(el, ctxt, 'hover', report);
        if (isField) checkFieldBoundary(el, ctxt, 'hover', report);
        else if (!t.anyText) checkIcon(el, ctxt, 'hover', report);
        setHover(el, false);

        /* The error state is a border colour too; measure it as well. */
        if (el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || (el.tagName === 'INPUT' && TEXT_FIELDS.has(el.type))) {
          const was = el.getAttribute('aria-invalid');
          el.setAttribute('aria-invalid', 'true');
          checkFieldBoundary(el, ctxt, 'invalid', report);
          if (was === null) el.removeAttribute('aria-invalid');
          else el.setAttribute('aria-invalid', was);
        }

        checkFocusIndicator(el, ctxt, report);
      }
    };

    win.scrollTo(0, 0);
    await settle(win);
    await sweep(controls, 'rest', true);

    /* Controls that are visually hidden until focused (the skip link). */
    if (!scope) {
      const hidden = [...doc.querySelectorAll(INTERACTIVE)].filter((el) => !rendered(el)
        && !el.closest('[inert], [hidden]') && win.getComputedStyle(el).display !== 'none').concat(offscreen);
      for (const el of hidden) {
        win.scrollTo(0, 0);
        el.focus({ preventScroll: true });
        if (doc.activeElement !== el || !rendered(el)) { el.blur(); continue; }
        if (!offscreen.includes(el)) counted.controls += 1;
        checkText(el, ctxt, 'focus', report);
        el.blur();
        checkFocusIndicator(el, ctxt, report);
      }

      /* The header changes once the page scrolls; measure it again there. */
      const header = doc.querySelector('[data-header]');
      if (header) {
        win.scrollTo(0, Math.min(height, win.innerHeight * 1.5));
        await settle(win);
        await sweep([...header.querySelectorAll(INTERACTIVE)].filter(rendered), 'scrolled', false);
        win.scrollTo(0, 0);
        await settle(win);
      }
    }

    if (prepare) await prepare();
    checkTargets(controls.filter((el) => !offscreen.includes(el) && !gone.has(el) && rendered(el)), ctxt, report);

    /* The freeze stays: the harness opens the menus after this pass, and
       a menu transition that starts unfrozen can stall at opacity 0 under
       headless virtual time. The frame is thrown away afterwards. */
    return { counted, findings };
  }

  window.oviMeasure = measure;
})();
