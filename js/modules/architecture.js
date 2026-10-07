/* ==========================================================================
   architecture.js — packets travel the diagram once, on scroll-in.

   DESIGN.md §6.2: small --ovi-blue dots run device -> gateway -> server ->
   application over 2.4s, then stop. It is not a loop, and it fires once.

   The diagram is complete HTML and CSS without this module; the packets are
   the only thing it adds. Under reduced motion, or if Motion cannot load,
   nothing moves and nothing is missing.
   ========================================================================== */

import { loadMotion, prefersReducedMotion } from './motion.js';

const TOTAL = 2.4;           /* seconds for the whole run — DESIGN.md §6.2 */

export async function init() {
  const diagram = document.querySelector('[data-architecture]');
  if (!diagram) return;
  if (prefersReducedMotion()) return;

  const packets = diagram.querySelectorAll('[data-packet]');
  if (packets.length === 0) return;

  const motion = await loadMotion();
  if (!motion) return;

  const { animate, inView } = motion;

  /* Below 900px the diagram is a vertical stack, so the packets run down the
     links rather than across them. Read it at fire time, not at load. */
  const isVertical = () => !window.matchMedia('(min-width: 900px)').matches;

  const leg = TOTAL / packets.length;
  let fired = false;

  const run = () => {
    if (fired) return;
    fired = true;

    const axis = isVertical() ? 'translateY' : 'translateX';

    packets.forEach((packet, i) => {
      const link = packet.parentElement;
      const distance = isVertical() ? link.offsetHeight : link.offsetWidth;

      animate(
        packet,
        {
          transform: [`${axis}(0px)`, `${axis}(${distance}px)`],
          opacity: [0, 1, 1, 0],
        },
        { duration: leg, delay: i * leg, ease: 'linear' },
      );
    });
  };

  /* Once. inView's returned stop function is called immediately so it never
     re-triggers on a second pass. */
  const stop = inView(diagram, () => {
    run();
    stop();
  }, { amount: 0.3 });
}
