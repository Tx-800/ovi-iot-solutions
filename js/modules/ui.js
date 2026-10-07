/* ==========================================================================
   ui.js — back-to-top, copy-email + toast, accordions.

   Every behaviour guards its own target, so the module is inert on a page
   that has none. Controls that only work with JavaScript ship `hidden` in the
   markup and are revealed here, so a visitor without JavaScript never sees a
   dead button (PRD N5).

   The WhatsApp FAB needs nothing: it is a plain link whose href is baked in
   by tools/sync-partials.js.
   ========================================================================== */

import { prefersReducedMotion } from './motion.js';

/* --- Toast ---------------------------------------------------------------- */

let toastTimer;

export function showToast(message) {
  const toast = document.querySelector('[data-toast]');
  if (!toast) return;

  toast.textContent = message;          /* never innerHTML */
  toast.setAttribute('data-visible', '');

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.removeAttribute('data-visible'), 3200);
}

/* --- Back to top ---------------------------------------------------------- */

function initBackToTop() {
  const button = document.querySelector('[data-back-to-top]');
  if (!button) return;

  let ticking = false;

  const sync = () => {
    ticking = false;
    /* One viewport of scroll, per PRD F9. */
    button.toggleAttribute('hidden', window.scrollY < window.innerHeight);
  };

  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(sync);
  }, { passive: true });

  button.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  });

  sync();
}

/* --- Copy email ----------------------------------------------------------- */

/* Every copy button on the page — the footer has one, and contact.html adds a
   second beside its email link. */
function initCopyEmail() {
  if (!navigator.clipboard) return;   /* no silent no-op buttons */

  for (const button of document.querySelectorAll('[data-copy-email]')) {
    const value = button.getAttribute('data-copy-value');
    if (!value) continue;

    button.removeAttribute('hidden');

    button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(value);
        showToast('Email address copied to your clipboard.');
      } catch {
        showToast('Could not copy. Select the address and copy it manually.');
      }
    });
  }
}

/* --- Accordion ------------------------------------------------------------
   <button data-accordion aria-expanded aria-controls> + panel role="region".
   Used by the solution and service pages from Phase 4. */

function initAccordions() {
  const buttons = document.querySelectorAll('[data-accordion]');
  if (buttons.length === 0) return;

  for (const button of buttons) {
    const panel = document.getElementById(button.getAttribute('aria-controls'));
    if (!panel) continue;

    button.addEventListener('click', () => {
      const open = button.getAttribute('aria-expanded') === 'true';
      button.setAttribute('aria-expanded', String(!open));
      panel.toggleAttribute('hidden', open);
    });
  }
}

export function initUI() {
  initBackToTop();
  initCopyEmail();
  initAccordions();
}
