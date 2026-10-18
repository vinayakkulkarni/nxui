import type {
  AnimatedContentEaseFn,
  AnimatedContentPhase,
  AnimatedContentStaggerFrom,
  AnimatedContentState,
  AnimatedContentWipe,
} from './types';

const edge = (dir: string) =>
  `linear-gradient(${dir}, #000 calc(var(--ac-wipe) * 140% - 40%), transparent calc(var(--ac-wipe) * 140%))`;

export const WIPES: Record<Exclude<AnimatedContentWipe, 'none'>, string> = {
  up: edge('to top'),
  down: edge('to bottom'),
  left: edge('to left'),
  right: edge('to right'),
  center:
    'radial-gradient(farthest-corner at 50% 50%, #000 calc(var(--ac-wipe) * 140% - 40%), transparent calc(var(--ac-wipe) * 140%))',
};

export const REST: AnimatedContentState = {
  offset: 0,
  scale: 1,
  opacity: 1,
  blur: 0,
  rotate: 0,
  tilt: 0,
  wipe: 1,
};

/** GSAP `stagger: { each, from }` distribution, in seconds per target. */
export function staggerOffsets(
  count: number,
  each: number,
  from: AnimatedContentStaggerFrom,
): number[] {
  const mid = (count - 1) / 2;
  if (from === 'random') {
    const order = Array.from({ length: count }, (_, i) => i);
    for (let i = count - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j]!, order[i]!];
    }
    return order.map((rank) => rank * each);
  }
  return Array.from({ length: count }, (_, i) => {
    if (from === 'end') return (count - 1 - i) * each;
    if (from === 'center') return Math.abs(i - mid) * each;
    if (from === 'edges') return (mid - Math.abs(i - mid)) * each;
    return i * each;
  });
}

export function makePhase(
  from: AnimatedContentState,
  to: AnimatedContentState,
  starts: number[],
  duration: number,
  ease: AnimatedContentEaseFn,
): AnimatedContentPhase {
  const safe = Math.max(duration, 0.0001);
  return {
    from,
    to,
    starts,
    duration: safe,
    ease,
    total: Math.max(0, ...starts) + safe,
  };
}

/** State of target `index` at timeline time `time` (from-state before it starts). */
export function sample(
  phase: AnimatedContentPhase,
  index: number,
  time: number,
): AnimatedContentState {
  const local = Math.min(
    1,
    Math.max(0, (time - phase.starts[index]!) / phase.duration),
  );
  const k = phase.ease(local);
  const { from, to } = phase;
  return {
    offset: from.offset + (to.offset - from.offset) * k,
    scale: from.scale + (to.scale - from.scale) * k,
    opacity: from.opacity + (to.opacity - from.opacity) * k,
    blur: from.blur + (to.blur - from.blur) * k,
    rotate: from.rotate + (to.rotate - from.rotate) * k,
    tilt: from.tilt + (to.tilt - from.tilt) * k,
    wipe: from.wipe + (to.wipe - from.wipe) * k,
  };
}

export function applyState(
  el: HTMLElement,
  s: AnimatedContentState,
  horizontal: boolean,
  useBlur: boolean,
  usePerspective: boolean,
): void {
  const x = horizontal ? s.offset : 0;
  const y = horizontal ? 0 : s.offset;
  const tilt = horizontal ? `rotateY(${s.tilt}deg)` : `rotateX(${s.tilt}deg)`;
  el.style.transform = `${usePerspective ? 'perspective(900px) ' : ''}translate3d(${x}px, ${y}px, 0) rotate(${s.rotate}deg) ${tilt} scale(${s.scale})`;
  el.style.opacity = String(s.opacity);
  if (useBlur) el.style.filter = `blur(${Math.max(0, s.blur)}px)`;
  el.style.setProperty('--ac-wipe', String(s.wipe));
}

export function setMask(el: HTMLElement, mask: string | null): void {
  el.style.maskImage = mask ?? '';
  el.style.webkitMaskImage = mask ?? '';
}

/** Clears the animated props once the reveal lands, like GSAP clearProps. */
export function settle(el: HTMLElement, clearMask: boolean): void {
  el.style.removeProperty('transform');
  el.style.removeProperty('filter');
  el.style.removeProperty('--ac-wipe');
  if (clearMask) setMask(el, null);
}

/** Fully reverts everything the reveal wrote. */
export function revert(el: HTMLElement): void {
  settle(el, true);
  el.style.removeProperty('opacity');
}
