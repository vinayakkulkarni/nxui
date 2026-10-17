import type { MagnetEntry, MagnetPoint, MagnetReach } from './types';

/**
 * One shared pointer field for every Magnet on the page. Exclusive magnets
 * compete: only the one whose edge is nearest the cursor gets pulled.
 * Populated only from onMounted, so it never holds state during SSR.
 */
const registry = new Set<MagnetEntry>();
export const field: {
  pointer: MagnetPoint | null;
  owner: MagnetEntry | null;
} = { pointer: null, owner: null };
let detach: (() => void) | null = null;

export function reach(rect: DOMRect, pointer: MagnetPoint): MagnetReach {
  const dx = pointer.x - (rect.left + rect.width / 2);
  const dy = pointer.y - (rect.top + rect.height / 2);
  const outside = Math.hypot(
    Math.max(0, Math.abs(dx) - rect.width / 2),
    Math.max(0, Math.abs(dy) - rect.height / 2),
  );
  return { dx, dy, outside };
}

export function arbitrate(): void {
  let winner: MagnetEntry | null = null;
  let nearest = Infinity;
  let closest = Infinity;
  for (const entry of registry) {
    const s = entry.settings();
    let near: MagnetReach | null = null;
    if (field.pointer && !s.disabled && !entry.reduce()) {
      near = reach(entry.wrapper.getBoundingClientRect(), field.pointer);
      if (near.outside > s.padding) near = null;
    }
    if (!s.exclusive) {
      if (near || entry.active) entry.wake();
      continue;
    }
    if (!near) continue;
    const center = Math.hypot(near.dx, near.dy);
    if (
      near.outside < nearest ||
      (near.outside === nearest && center < closest)
    ) {
      winner = entry;
      nearest = near.outside;
      closest = center;
    }
  }
  const previous = field.owner;
  field.owner = winner;
  if (previous && previous !== winner) previous.wake();
  if (winner) winner.wake();
}

function attach(): () => void {
  const onPointerMove = (event: PointerEvent) => {
    if (event.pointerType === 'touch') return;
    field.pointer = { x: event.clientX, y: event.clientY };
    arbitrate();
  };
  const onLeave = () => {
    field.pointer = null;
    arbitrate();
  };
  const root = document.documentElement;
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('scroll', arbitrate, {
    passive: true,
    capture: true,
  });
  root.addEventListener('pointerleave', onLeave);
  window.addEventListener('blur', onLeave);
  return () => {
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('scroll', arbitrate, { capture: true });
    root.removeEventListener('pointerleave', onLeave);
    window.removeEventListener('blur', onLeave);
  };
}

/** Adds a magnet to the field; returns the function that removes it. */
export function registerMagnet(entry: MagnetEntry): () => void {
  registry.add(entry);
  if (!detach) detach = attach();
  return () => {
    registry.delete(entry);
    if (field.owner === entry) field.owner = null;
    if (!registry.size && detach) {
      detach();
      detach = null;
    }
  };
}
