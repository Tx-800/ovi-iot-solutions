/* ==========================================================================
   nav.js — sticky header, Solutions mega-menu, mobile drawer, focus trap.

   This module only ever *adds* behaviour. The header in partials/header.html
   is already usable without it: the nav is a plain visible list, "Solutions"
   is a real link, and CSS :focus-within opens the mega-menu for keyboard
   users. So the first thing initNav does is announce itself with
   `data-nav-enhanced`, which is what switches the CSS into drawer mode.
   Nothing is hidden behind a control that cannot work (PRD N5).
   ========================================================================== */

const DRAWER_QUERY = '(max-width: 767.98px)';   /* below --bp-md */
const MEGA_QUERY = '(min-width: 1024px)';       /* --bp-lg and up */

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function focusableWithin(root) {
  return Array.from(root.querySelectorAll(FOCUSABLE))
    .filter((el) => !el.hasAttribute('hidden') && el.offsetParent !== null);
}

export function initNav() {
  const header = document.querySelector('[data-header]');
  if (!header) return;

  const toggle = header.querySelector('[data-drawer-toggle]');
  const drawer = header.querySelector('[data-drawer]');
  const drawerMedia = window.matchMedia(DRAWER_QUERY);
  const megaMedia = window.matchMedia(MEGA_QUERY);

  /* Switches the CSS from "plain list" to "drawer + dropdown". */
  header.setAttribute('data-nav-enhanced', '');
  if (toggle) toggle.removeAttribute('hidden');

  /* Enhancement is what first hides the drawer, so transitions have to stay
     off for that first style change — otherwise the panel animates itself
     shut in front of the visitor on every page load. One frame later, the
     closed state is the starting state and motion is safe to switch on. */
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => header.setAttribute('data-nav-ready', ''));
  });

  /* --- Sticky condense --------------------------------------------------- */

  let ticking = false;
  const syncScrolled = () => {
    ticking = false;
    header.toggleAttribute('data-scrolled', window.scrollY > 8);
  };

  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(syncScrolled);
  }, { passive: true });

  syncScrolled();

  /* --- Drawer ------------------------------------------------------------ */

  const outsideElements = () =>
    Array.from(document.body.children).filter((el) => el !== header);

  function openDrawer() {
    if (!drawer || !toggle) return;

    header.setAttribute('data-drawer-open', '');
    toggle.setAttribute('aria-expanded', 'true');
    document.body.classList.add('is-scroll-locked');

    /* Modal semantics only while it is actually a modal. */
    drawer.setAttribute('role', 'dialog');
    drawer.setAttribute('aria-modal', 'true');
    drawer.setAttribute('aria-label', 'Site menu');
    outsideElements().forEach((el) => el.setAttribute('inert', ''));

    const first = focusableWithin(drawer)[0];
    if (first) first.focus();
  }

  function closeDrawer({ restoreFocus = true } = {}) {
    if (!drawer || !toggle) return;
    if (!header.hasAttribute('data-drawer-open')) return;

    header.removeAttribute('data-drawer-open');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('is-scroll-locked');

    drawer.removeAttribute('role');
    drawer.removeAttribute('aria-modal');
    drawer.removeAttribute('aria-label');
    outsideElements().forEach((el) => el.removeAttribute('inert'));

    /* ARCHITECTURE.md §8: focus returns to the toggle. Returning it to
       whatever was focused before is wrong when the drawer was opened by a
       pointer, which leaves focus on the body. */
    if (restoreFocus) toggle.focus();
  }

  const drawerIsOpen = () => header.hasAttribute('data-drawer-open');

  if (toggle) {
    toggle.addEventListener('click', () => {
      if (drawerIsOpen()) closeDrawer();
      else openDrawer();
    });
  }

  /* Focus trap. `inert` on the rest of the page already does most of this;
     the explicit wrap keeps it correct where inert is unsupported. */
  if (drawer) {
    drawer.addEventListener('keydown', (event) => {
      if (event.key !== 'Tab' || !drawerIsOpen()) return;

      const items = [toggle, ...focusableWithin(drawer)].filter(Boolean);
      if (items.length === 0) return;

      const first = items[0];
      const last = items[items.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
  }

  /* Leaving drawer width with the drawer open would strand the page in a
     locked, inert state. */
  drawerMedia.addEventListener('change', (event) => {
    if (!event.matches) closeDrawer({ restoreFocus: false });
  });

  /* --- Mega-menu --------------------------------------------------------- */

  const menus = Array.from(header.querySelectorAll('[data-disclosure]')).map((button) => {
    const panel = document.getElementById(button.getAttribute('aria-controls'));
    return panel ? { button, panel, item: button.closest('.site-nav__item') } : null;
  }).filter(Boolean);

  function setMenu(menu, open) {
    menu.button.setAttribute('aria-expanded', String(open));
    menu.panel.toggleAttribute('data-open', open);
  }

  function closeAllMenus(except) {
    for (const menu of menus) if (menu !== except) setMenu(menu, false);
  }

  for (const menu of menus) {
    menu.button.addEventListener('click', () => {
      const open = menu.button.getAttribute('aria-expanded') === 'true';
      closeAllMenus(menu);
      setMenu(menu, !open);
    });

    /* Down arrow opens and moves into the panel. */
    menu.button.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowDown') return;
      event.preventDefault();
      closeAllMenus(menu);
      setMenu(menu, true);
      const first = focusableWithin(menu.panel)[0];
      if (first) first.focus();
    });

    /* Pointer users open it by hover (CSS), so aria-expanded has to follow,
       or a screen-reader user hears a state that is not true. */
    menu.item?.addEventListener('mouseenter', () => {
      if (megaMedia.matches) setMenu(menu, true);
    });

    menu.item?.addEventListener('mouseleave', () => {
      if (!megaMedia.matches) return;
      if (menu.item.contains(document.activeElement)) return;   /* keyboard still inside */
      setMenu(menu, false);
    });

    menu.item?.addEventListener('focusout', (event) => {
      if (!megaMedia.matches) return;
      if (menu.item.contains(event.relatedTarget)) return;
      setMenu(menu, false);
    });
  }

  /* --- Escape ------------------------------------------------------------ */

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;

    if (drawerIsOpen()) {
      closeDrawer();
      return;
    }

    const openMenu = menus.find((m) => m.button.getAttribute('aria-expanded') === 'true');
    if (openMenu) {
      setMenu(openMenu, false);
      openMenu.button.focus();
    }
  });

  /* A click outside an open dropdown closes it. */
  document.addEventListener('click', (event) => {
    if (drawerIsOpen()) return;
    for (const menu of menus) {
      if (menu.button.getAttribute('aria-expanded') !== 'true') continue;
      if (!menu.item?.contains(event.target)) setMenu(menu, false);
    }
  });
}
