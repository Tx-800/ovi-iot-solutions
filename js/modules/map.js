/* ==========================================================================
   map.js — Leaflet + OpenStreetMap on contact.html, loaded on scroll-in.

   Leaflet's CSS and JS are injected here and on no other page, and only once
   the map is about to scroll into view (ARCHITECTURE.md §6) — they are 41.6
   KB gzipped, excluded from the JS budget as a lazy dependency (PRD N4).

   Pinned to 1.9.4 with Subresource Integrity. The two hashes were computed
   from the files on jsDelivr, not copied from anywhere.

   The coordinates come from data-lat / data-lng, baked from
   js/site.config.js by tools/sync-partials.js. While they are the 0,0
   placeholder the whole map block is removed at build time; this module
   also refuses 0,0 itself, so a map in the Gulf of Guinea can never render.

   Accessibility: Leaflet's own keyboard support stays on (the map is
   focusable; arrows pan, +/- zoom), the zoom controls are links, the marker
   is not a tab stop (it has no popup), and the office address is always
   written out as text beside the map.
   ========================================================================== */

import { prefersReducedMotion } from './motion.js';

const VERSION = '1.9.4';
const BASE = `https://cdn.jsdelivr.net/npm/leaflet@${VERSION}/dist`;
const SRI = {
  css: 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=',
  js: 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=',
};

/* OpenStreetMap's current tile URL (no a/b/c subdomains). Their usage policy
   requires the attribution Leaflet shows by default. */
const TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

let leafletPromise;

function loadLeaflet() {
  if (leafletPromise) return leafletPromise;

  leafletPromise = new Promise((resolve, reject) => {
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = `${BASE}/leaflet.css`;
    css.integrity = SRI.css;
    css.crossOrigin = 'anonymous';
    document.head.append(css);

    const script = document.createElement('script');
    script.src = `${BASE}/leaflet.js`;
    script.integrity = SRI.js;
    script.crossOrigin = 'anonymous';
    script.onload = () => (window.L ? resolve(window.L) : reject(new Error('Leaflet missing')));
    script.onerror = () => reject(new Error('Leaflet failed to load'));
    document.head.append(script);
  });

  return leafletPromise;
}

function mount(L, el, lat, lng, zoom) {
  const still = prefersReducedMotion();

  const map = L.map(el, {
    center: [lat, lng],
    zoom,
    scrollWheelZoom: false,          /* no scroll-jacking — DESIGN.md §8 */
    zoomAnimation: !still,
    fadeAnimation: !still,
    markerZoomAnimation: !still,
  });

  L.tileLayer(TILES, { maxZoom: 19, attribution: ATTRIBUTION }).addTo(map);

  /* Not interactive: there is no popup, so a focusable marker would be a tab
     stop that does nothing. The alt text still names it, and the address is
     written out beside the map. */
  L.marker([lat, lng], {
    alt: 'OVI IoT Solutions office',
    keyboard: false,
    interactive: false,
  }).addTo(map);

  /* Hides the fallback link (07-pages.css) now that tiles cover it. */
  el.setAttribute('data-map-ready', '');
}

export function init() {
  const el = document.querySelector('[data-map]');
  if (!el) return;

  const lat = Number.parseFloat(el.dataset.lat);
  const lng = Number.parseFloat(el.dataset.lng);
  const zoom = Number.parseInt(el.dataset.zoom, 10) || 15;
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) return;

  const start = () => {
    loadLeaflet()
      .then((L) => mount(L, el, lat, lng, zoom))
      /* If the CDN is unreachable the fallback link simply stays. */
      .catch(() => {});
  };

  if (!('IntersectionObserver' in window)) {
    start();
    return;
  }

  /* 200px of lead time, so the tiles are arriving as the map scrolls in. */
  const observer = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) {
      observer.disconnect();
      start();
    }
  }, { rootMargin: '200px' });

  observer.observe(el);
}
