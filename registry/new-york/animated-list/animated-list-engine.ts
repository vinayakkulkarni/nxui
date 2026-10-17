import type {
  AnimatedListAnimation,
  AnimatedListEngine,
  AnimatedListState,
} from './types';
import type { AnimatedListMode } from './animated-list-utils';
import {
  ANIMATED_LIST_HIDDEN,
  ANIMATED_LIST_SPRING,
  isHiddenMode,
} from './animated-list-utils';

export interface AnimatedListEngineSettings {
  selected: number;
  animation: AnimatedListAnimation;
  animateOnce: boolean;
  stagger: number;
  showGradients: boolean;
  fadeSize: number;
}

export interface AnimatedListEngineOptions {
  root: HTMLElement;
  viewport: HTMLElement;
  track: HTMLElement;
  indicator: HTMLElement;
  ring: HTMLElement;
  reduced: boolean;
  items: () => (HTMLElement | null)[];
  settings: () => AnimatedListEngineSettings;
}

/**
 * Drives the scroll-in poses of the rows, the spring-follow selection
 * indicator and the edge fades. All writes go straight to the DOM.
 */
export function createAnimatedListEngine(
  options: AnimatedListEngineOptions,
): AnimatedListEngine {
  const { root, viewport, track, indicator, ring, reduced } = options;
  const springEase = CSS.supports?.(
    'transition-timing-function',
    'linear(0, 1)',
  )
    ? ANIMATED_LIST_SPRING
    : 'cubic-bezier(0.34, 1.4, 0.64, 1)';
  const transition = `transform 620ms ${springEase}, opacity 300ms cubic-bezier(0.22, 1, 0.36, 1), filter 200ms ease`;
  const motion = { y: 0, h: 0, vy: 0, vh: 0, ty: 0, th: 0, ready: false };
  const fades = { top: '', bottom: '' };
  let boxes: ([number, number] | null)[] = [];
  let current: AnimatedListMode | null = null;
  let entered = false;
  let raf = 0;
  let last = 0;

  const mode = (): AnimatedListMode => {
    const chosen = options.settings().animation;
    if (chosen === 'none' || !isHiddenMode(chosen)) return 'none';
    return reduced ? 'fade' : chosen;
  };

  const apply = (element: HTMLElement, state: AnimatedListState) => {
    element.dataset.state = state;
    const pose =
      current && current !== 'none' && state !== 'in'
        ? ANIMATED_LIST_HIDDEN[current][state]
        : '';
    element.style.transform = pose;
    element.style.opacity = pose ? '0' : '';
  };

  const recorded = (
    element: HTMLElement | null | undefined,
  ): AnimatedListState | null => {
    const state = element?.dataset.state;
    return state === 'in' || state === 'above' || state === 'below'
      ? state
      : null;
  };

  const stateOf = (element: HTMLElement | null | undefined) =>
    recorded(element) ?? 'in';

  const syncRing = () => {
    const item = options.items()[options.settings().selected];
    if (!item) return;
    const state = stateOf(item);
    if (state === ring.dataset.state) return;
    ring.style.transitionDelay = item.style.transitionDelay;
    apply(ring, state);
  };

  const write = () => {
    indicator.style.transform = `translate3d(0, ${motion.y.toFixed(2)}px, 0)`;
    indicator.style.height = `${motion.h.toFixed(2)}px`;
  };

  const frame = (now: number) => {
    raf = 0;
    const dt = Math.min(0.05, (now - last) / 1000 || 0);
    last = now;
    const omega = 30;
    const zeta = 0.78;
    const steps = Math.max(1, Math.ceil(dt / (1 / 240)));
    const h = dt / steps;
    for (let i = 0; i < steps; i++) {
      motion.vy +=
        (omega * omega * (motion.ty - motion.y) -
          2 * zeta * omega * motion.vy) *
        h;
      motion.vh +=
        (omega * omega * (motion.th - motion.h) -
          2 * zeta * omega * motion.vh) *
        h;
      motion.y += motion.vy * h;
      motion.h += motion.vh * h;
    }
    const moving =
      Math.abs(motion.ty - motion.y) > 0.05 ||
      Math.abs(motion.th - motion.h) > 0.05 ||
      Math.abs(motion.vy) + Math.abs(motion.vh) > 0.5;
    if (!moving) {
      motion.y = motion.ty;
      motion.h = motion.th;
      motion.vy = 0;
      motion.vh = 0;
    }
    write();
    if (moving) raf = requestAnimationFrame(frame);
  };

  const place = (snap: boolean) => {
    const item = options.items()[options.settings().selected];
    if (!item) {
      indicator.style.opacity = '0';
      motion.ready = false;
      return;
    }
    indicator.style.opacity = '1';
    motion.ty = item.offsetTop;
    motion.th = item.offsetHeight;
    if (snap || reduced || !motion.ready) {
      motion.y = motion.ty;
      motion.h = motion.th;
      motion.vy = 0;
      motion.vh = 0;
      motion.ready = true;
      write();
      return;
    }
    if (!raf) {
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
  };

  const updateFades = () => {
    const s = options.settings();
    const span = Math.max(1, s.fadeSize);
    const { scrollTop, scrollHeight, clientHeight } = viewport;
    const top = s.showGradients ? Math.min(span, Math.max(0, scrollTop)) : 0;
    const bottom = s.showGradients
      ? Math.min(span, Math.max(0, scrollHeight - clientHeight - scrollTop))
      : 0;
    const nextTop = `${top.toFixed(1)}px`;
    const nextBottom = `${bottom.toFixed(1)}px`;
    if (nextTop !== fades.top) {
      fades.top = nextTop;
      viewport.style.setProperty('--al-fade-top', nextTop);
    }
    if (nextBottom !== fades.bottom) {
      fades.bottom = nextBottom;
      viewport.style.setProperty('--al-fade-bottom', nextBottom);
    }
  };

  const measure = () => {
    const offset = track.offsetTop;
    boxes = options
      .items()
      .map((item) =>
        item ? [offset + item.offsetTop, item.offsetHeight] : null,
      );
  };

  const reveal = (entrance: boolean) => {
    if (!entered) return;
    const s = options.settings();
    const top = viewport.scrollTop;
    const view = viewport.clientHeight;
    let order = 0;
    options.items().forEach((item, index) => {
      const box = boxes[index];
      if (!item || !box) return;
      const start = box[0] - top;
      const overlap = Math.min(view, start + box[1]) - Math.max(0, start);
      const hidden =
        current !== 'none' &&
        overlap < Math.min(box[1], view) * 0.5 &&
        !(s.animateOnce && item.dataset.seen);
      const state: AnimatedListState = hidden
        ? start + box[1] / 2 < view / 2
          ? 'above'
          : 'below'
        : 'in';
      if (state === item.dataset.state) return;
      const delay =
        entrance && !hidden ? (order++ * Math.max(0, s.stagger)).toFixed(3) : 0;
      item.style.transitionDelay = delay ? `${delay}s, ${delay}s, 0s` : '';
      if (!hidden) item.dataset.seen = 'true';
      apply(item, state);
    });
    syncRing();
  };

  const sync = () => {
    const items = options
      .items()
      .filter((item): item is HTMLElement => Boolean(item));
    const next = mode();
    const changed = next !== current;
    const restyle = changed
      ? items
      : items.filter((item) => !item.dataset.state);
    current = next;
    if (current === 'none') entered = true;
    if (restyle.length) {
      const elements = changed ? [...restyle, ring] : restyle;
      for (const element of elements) element.style.transition = 'none';
      for (const item of restyle) {
        apply(item, current === 'none' ? 'in' : (recorded(item) ?? 'below'));
      }
      if (changed)
        apply(ring, stateOf(options.items()[options.settings().selected]));
      void root.offsetHeight;
      for (const element of elements) element.style.transition = transition;
    }
    measure();
    reveal(restyle.length > 0);
  };

  sync();

  return {
    place,
    syncRing,
    updateFades,
    sync,
    enter() {
      if (entered) return;
      entered = true;
      measure();
      reveal(true);
    },
    resize() {
      place(true);
      updateFades();
      measure();
      reveal(false);
    },
    scroll() {
      updateFades();
      reveal(false);
    },
    dispose() {
      cancelAnimationFrame(raf);
    },
  };
}
