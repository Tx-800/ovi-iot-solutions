/* ==========================================================================
   config.js — hydrateSiteConfig()

   Writes values from js/site.config.js into the page at runtime. Three
   attributes, all of which take a dot path into SITE:

     data-site="email"              -> textContent
     data-site-attr="href:mailto"   -> sets an attribute from a named format
     data-site-if="social.linkedin" -> element is removed when the value is empty

   Named formats for data-site-attr keep tel:/mailto:/wa.me construction in
   one place:  mailto · tel · whatsapp · url

   tools/sync-partials.js bakes the same values into href and JSON-LD at build
   time, so the site still works with JavaScript disabled (PRD N5). This pass
   is for text nodes the build step does not own.

   textContent only — never innerHTML (ARCHITECTURE.md §6).
   ========================================================================== */

import { SITE } from '../site.config.js';

/** Resolve a dot path such as "address.city" against SITE. */
function read(path) {
  if (!path) return undefined;
  return path.split('.').reduce((value, key) => (
    value === null || value === undefined ? undefined : value[key]
  ), SITE);
}

/** The office address as a single line, skipping empty parts. */
function addressOneLine() {
  const a = SITE.address || {};
  return [a.line1, a.line2, a.city, a.region, a.postal, a.country]
    .filter(Boolean)
    .join(', ');
}

const FORMATS = {
  mailto:   () => `mailto:${SITE.email}`,
  tel:      () => `tel:${SITE.phoneRaw}`,
  whatsapp: () => `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(SITE.whatsappMessage || '')}`,
  url:      () => SITE.url,
};

export function hydrate() {
  /* Text nodes. "address" is a computed key; everything else is a path. */
  document.querySelectorAll('[data-site]').forEach((el) => {
    const path = el.getAttribute('data-site');
    const value = path === 'address' ? addressOneLine() : read(path);
    if (typeof value === 'string' && value !== '') {
      el.textContent = value;
    }
  });

  /* Attributes. Value is "attribute:format", e.g. "href:whatsapp". */
  document.querySelectorAll('[data-site-attr]').forEach((el) => {
    el.getAttribute('data-site-attr').split(/\s+/).forEach((pair) => {
      const [attr, format] = pair.split(':');
      const build = FORMATS[format];
      if (attr && build) el.setAttribute(attr, build());
    });
  });

  /* Anything whose source value is empty must not render — no dead social
     icons (PRD.md §6). */
  document.querySelectorAll('[data-site-if]').forEach((el) => {
    if (!read(el.getAttribute('data-site-if'))) el.remove();
  });
}

export { SITE };
