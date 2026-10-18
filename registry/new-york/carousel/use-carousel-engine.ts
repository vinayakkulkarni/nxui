import { computed, watch } from 'vue';
import {
  tryOnScopeDispose,
  useDocumentVisibility,
  useEventListener,
  useIntersectionObserver,
  usePreferredReducedMotion,
  useRafFn,
} from '@vueuse/core';
import {
  CAROUSEL_DAMPING,
  CAROUSEL_STIFFNESS,
  band,
  clamp,
  nearest,
  pose,
  wrap,
} from './carousel-math';
import type {
  CarouselEngine,
  CarouselEngineOptions,
  CarouselEngineState,
  CarouselSettings,
} from './types';

/**
 * Spring-driven carousel position. Writes transforms straight to the slide
 * elements so dragging and settling never go through a Vue re-render.
 */
export function useCarouselEngine(
  options: CarouselEngineOptions,
): CarouselEngine {
  const { root, viewport, settings, slides, shades, fills, active } = options;
  const reducedMotion = usePreferredReducedMotion();
  const reduce = computed(() => reducedMotion.value === 'reduce');
  const documentVisibility = useDocumentVisibility();

  const start = active.value;
  const state: CarouselEngineState = {
    p: start,
    v: 0,
    target: start,
    shown: start,
    elapsed: 0,
    hovered: false,
    focused: false,
    visible: true,
    drag: null,
    wheeling: false,
    wheelTimer: 0,
    suppress: false,
    last: 0,
  };

  const unit = (s: CarouselSettings): number =>
    s.mode === 'fade' || s.mode === 'cube' ? s.cardWidth : s.span;
  const limit = (s: CarouselSettings, value: number): number =>
    s.loop ? value : clamp(value, 0, s.count - 1);

  function apply(): void {
    const s = settings.value;
    for (let i = 0; i < s.count; i++) {
      const slide = slides[i];
      if (!slide) continue;
      const next = pose(i, state.p, s);
      slide.style.transform = next.transform;
      slide.style.opacity = String(next.opacity);
      slide.style.visibility = next.visible ? 'visible' : 'hidden';
      slide.style.zIndex = String(next.layer);
      slide.style.setProperty('--carousel-focus', String(next.focus));
      const shade = shades[i];
      if (shade) shade.style.opacity = String(next.shade);
    }
    if (!s.bars) return;
    const progress = s.autoplay
      ? clamp(state.elapsed / s.autoplayDelay, 0, 1)
      : 1;
    for (let i = 0; i < s.count; i++) {
      const fill = fills[i];
      if (!fill) continue;
      const scale = i < state.shown ? 1 : i === state.shown ? progress : 0;
      fill.style.transform = `scaleX(${scale})`;
    }
  }

  function announce(): void {
    const s = settings.value;
    if (!s.count) return;
    const rounded = Math.round(state.target);
    const index = s.loop
      ? wrap(rounded, s.count)
      : clamp(rounded, 0, s.count - 1);
    if (index === state.shown) return;
    state.shown = index;
    active.value = index;
  }

  function paused(s: CarouselSettings): boolean {
    return (
      (s.pauseOnHover && state.hovered) ||
      state.focused ||
      Boolean(state.drag) ||
      state.wheeling ||
      !state.visible ||
      documentVisibility.value === 'hidden'
    );
  }

  const { pause, resume, isActive } = useRafFn(
    ({ timestamp }) => {
      const s = settings.value;
      const dt = state.last
        ? Math.min(0.05, (timestamp - state.last) / 1000)
        : 1 / 60;
      state.last = timestamp;
      let busy = false;
      if (!state.drag?.moved && !state.wheeling) {
        if (reduce.value) {
          state.p = state.target;
          state.v = 0;
        } else {
          const steps = Math.ceil(dt * 240);
          const h = dt / steps;
          for (let k = 0; k < steps; k++) {
            state.v +=
              (CAROUSEL_STIFFNESS * (state.target - state.p) -
                CAROUSEL_DAMPING * state.v) *
              h;
            state.p += state.v * h;
          }
          if (
            Math.abs(state.target - state.p) < 0.0004 &&
            Math.abs(state.v) < 0.004
          ) {
            state.p = state.target;
            state.v = 0;
          } else {
            busy = true;
          }
        }
        if (!busy && s.loop && s.count) {
          state.target = wrap(Math.round(state.target), s.count);
          state.p = state.target;
        }
      }
      if (s.autoplay && !paused(s)) {
        state.elapsed += dt * 1000;
        if (state.elapsed >= s.autoplayDelay) step(1, true);
        busy = true;
      }
      apply();
      if (!busy) {
        state.last = 0;
        pause();
      }
    },
    { immediate: false },
  );

  function wake(): void {
    if (!isActive.value) resume();
  }

  function moveTo(target: number): void {
    state.target = target;
    state.elapsed = 0;
    announce();
    apply();
    wake();
  }

  function step(direction: number, auto = false): void {
    const s = settings.value;
    if (s.count < 2) return;
    let next = Math.round(state.target) + direction;
    if (!s.loop) {
      if (auto && next > s.count - 1) next = 0;
      next = clamp(next, 0, s.count - 1);
    }
    moveTo(next);
  }

  function goTo(index: number): void {
    const s = settings.value;
    if (!s.count) return;
    const goal = clamp(Math.round(index), 0, s.count - 1);
    const current = Math.round(state.target);
    moveTo(
      s.loop ? current + nearest(goal - wrap(current, s.count), s.count) : goal,
    );
  }

  function sync(): void {
    const s = settings.value;
    if (!s.loop && s.count) {
      state.target = clamp(Math.round(state.target), 0, s.count - 1);
      state.p = clamp(state.p, -0.3, s.count - 0.7);
    }
    announce();
    apply();
    wake();
  }

  useEventListener(viewport, 'pointerdown', (event: PointerEvent) => {
    const s = settings.value;
    if (!s.draggable || (event.pointerType === 'mouse' && event.button !== 0))
      return;
    state.drag = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      p: state.p,
      from: 0,
      moved: false,
      samples: [],
    };
  });

  useEventListener(viewport, 'pointermove', (event: PointerEvent) => {
    const drag = state.drag;
    const el = viewport.value;
    if (!drag || !el || event.pointerId !== drag.id) return;
    const s = settings.value;
    if (!drag.moved) {
      const dx = event.clientX - drag.x;
      const dy = event.clientY - drag.y;
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      if (Math.abs(dy) > Math.abs(dx)) {
        state.drag = null;
        return;
      }
      drag.moved = true;
      drag.x = event.clientX;
      drag.p = state.p;
      drag.from = Math.round(state.target);
      el.setPointerCapture(event.pointerId);
      el.dataset.dragging = 'true';
    }
    const raw = drag.p - (event.clientX - drag.x) / unit(s);
    state.p = s.loop ? raw : band(raw, s.count - 1);
    state.v = 0;
    state.target = Math.round(limit(s, state.p));
    drag.samples.push([event.timeStamp, event.clientX]);
    if (drag.samples.length > 8) drag.samples.shift();
    announce();
    apply();
  });

  function onPointerUp(event: PointerEvent): void {
    const drag = state.drag;
    if (!drag || event.pointerId !== drag.id) return;
    state.drag = null;
    if (viewport.value) delete viewport.value.dataset.dragging;
    if (!drag.moved) {
      wake();
      return;
    }
    state.suppress = true;
    window.setTimeout(() => {
      state.suppress = false;
    }, 0);
    const s = settings.value;
    const sample = drag.samples.find(
      ([time]) => event.timeStamp - time < 90,
    ) ?? [event.timeStamp, event.clientX];
    const elapsed = Math.max(16, event.timeStamp - sample[0]);
    const velocity = clamp(
      ((sample[1] - event.clientX) / elapsed) * (1000 / unit(s)),
      -12,
      12,
    );
    const travelled = state.p - drag.from;
    let target = Math.round(state.p + velocity * 0.2);
    if (target === drag.from) {
      if (Math.abs(velocity) > 0.8) target += Math.sign(velocity);
      else if (Math.abs(travelled) > 0.18) target += Math.sign(travelled);
    }
    if (!s.loop) target = clamp(target, 0, s.count - 1);
    const inside = s.loop || (state.p >= 0 && state.p <= s.count - 1);
    state.v = inside ? velocity : 0;
    moveTo(target);
  }

  useEventListener(viewport, ['pointerup', 'pointercancel'], onPointerUp);

  useEventListener(
    viewport,
    'click',
    (event: MouseEvent) => {
      if (!state.suppress) return;
      event.preventDefault();
      event.stopPropagation();
      state.suppress = false;
    },
    { capture: true },
  );

  useEventListener(
    viewport,
    'wheel',
    (event: WheelEvent) => {
      const s = settings.value;
      if (!s.draggable || Math.abs(event.deltaX) <= Math.abs(event.deltaY))
        return;
      event.preventDefault();
      const raw = state.p + event.deltaX / unit(s);
      state.p = s.loop ? raw : clamp(raw, -0.15, s.count - 0.85);
      state.v = 0;
      state.wheeling = true;
      state.target = Math.round(limit(s, state.p));
      announce();
      apply();
      window.clearTimeout(state.wheelTimer);
      state.wheelTimer = window.setTimeout(() => {
        state.wheeling = false;
        moveTo(Math.round(limit(settings.value, state.p)));
      }, 120);
    },
    { passive: false },
  );

  useEventListener(root, 'keydown', (event: KeyboardEvent) => {
    if (
      event.target instanceof Element &&
      event.target.closest('input, textarea, select, [contenteditable="true"]')
    )
      return;
    const s = settings.value;
    let action: (() => void) | null = null;
    if (event.key === 'ArrowRight') action = () => step(1);
    else if (event.key === 'ArrowLeft') action = () => step(-1);
    else if (event.key === 'Home') action = () => goTo(0);
    else if (event.key === 'End') action = () => goTo(s.count - 1);
    if (!action) return;
    event.preventDefault();
    action();
  });

  useEventListener(root, 'mouseenter', () => {
    state.hovered = true;
  });

  useEventListener(root, 'mouseleave', () => {
    state.hovered = false;
    wake();
  });

  useEventListener(root, 'focusin', () => {
    const el = root.value;
    try {
      state.focused = Boolean(
        el &&
        (el.matches(':focus-visible') || el.querySelector(':focus-visible')),
      );
    } catch {
      state.focused = false;
    }
  });

  useEventListener(root, 'focusout', (event: FocusEvent) => {
    const el = root.value;
    if (
      el &&
      event.relatedTarget instanceof Node &&
      el.contains(event.relatedTarget)
    )
      return;
    state.focused = false;
    wake();
  });

  useIntersectionObserver(root, (entries) => {
    state.visible = entries.some((entry) => entry.isIntersecting);
    if (state.visible) wake();
  });

  watch(documentVisibility, (visibility) => {
    if (visibility === 'hidden') return;
    state.last = 0;
    wake();
  });

  tryOnScopeDispose(() => {
    if (state.wheelTimer) window.clearTimeout(state.wheelTimer);
  });

  return { goTo, step, sync };
}
