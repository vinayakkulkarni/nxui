import { clamp } from './pill-nav-themes';
import type { PillNavEngine, PillNavEngineOptions, PillNavRect } from './types';

/**
 * Spring engine behind the gliding pill, its clipped ink copy and the
 * sliding active dot. Both pill edges are separate springs so the leading
 * edge can stretch ahead of the trailing one. Runs a rAF loop only while
 * something is still moving.
 */
export function createPillNavEngine(
  options: PillNavEngineOptions,
): PillNavEngine {
  const { root, reduce } = options;
  const state = {
    x0: 0,
    x1: 0,
    v0: 0,
    v1: 0,
    alpha: 0,
    pop: 1,
    press: 1,
    pressVelocity: 0,
    dotX: 0,
    dotVelocity: 0,
    dotAlpha: 0,
    hover: -1,
    focus: false,
    sliding: false,
    pressing: false,
    waiting: options.waiting && !reduce,
  };
  const rects: PillNavRect[] = [];
  let trackWidth = 0;
  let trackHeight = 0;
  let raf = 0;
  let last = 0;
  let timer = 0;
  let destroyed = false;

  const measure = () => {
    const track = options.getTrack();
    if (!track) return;
    trackWidth = track.offsetWidth;
    trackHeight = track.offsetHeight;
    options.getSlots().forEach((slot, index) => {
      if (!slot) return;
      rects[index] = { left: slot.offsetLeft, width: slot.offsetWidth };
      const reach =
        Math.ceil(
          2 * Math.sqrt((slot.offsetWidth / 2) ** 2 + slot.offsetHeight ** 2),
        ) + 2;
      slot.style.setProperty('--pn-fill', `${reach}px`);
    });
  };

  const glideIndex = () => {
    const s = options.getSettings();
    if (s.hoverEffect === 'fill') return -1;
    if (s.hoverEffect === 'glide' && state.hover >= 0) return state.hover;
    return s.indicator === 'pill' ? s.activeIndex : -1;
  };

  const sync = () => {
    const s = options.getSettings();
    options.getSlots().forEach((slot, index) => {
      if (!slot) return;
      const hovered = state.hover === index;
      slot.toggleAttribute('data-lit', hovered);
      slot.toggleAttribute('data-hover', hovered && s.hoverEffect === 'fill');
    });
    root.toggleAttribute('data-focus', state.focus && state.hover >= 0);
    root.toggleAttribute(
      'data-dot-lit',
      s.hoverEffect === 'fill' &&
        state.hover >= 0 &&
        state.hover === s.activeIndex,
    );
  };

  const render = () => {
    const glideEl = options.getGlide();
    const ink = options.getInk();
    const dot = options.getDot();
    const width = Math.max(0, state.x1 - state.x0);
    const scale = state.press * state.pop;
    const target = rects[glideIndex()];
    const squash = target
      ? 1 - clamp((width / Math.max(target.width, 1) - 1) * 0.3, 0, 0.14)
      : 1;
    if (glideEl) {
      glideEl.style.width = `${width}px`;
      glideEl.style.transform = `translate3d(${state.x0}px, 0, 0) scale(${scale}, ${scale * squash})`;
      glideEl.style.opacity = `${state.alpha}`;
    }
    if (ink) {
      const half = (width * scale) / 2;
      const center = (state.x0 + state.x1) / 2;
      const inset = (trackHeight * (1 - scale * squash)) / 2;
      ink.style.clipPath = `inset(${inset}px ${trackWidth - center - half}px ${inset}px ${center - half}px round ${trackHeight / 2}px)`;
      ink.style.opacity = `${state.alpha}`;
    }
    if (dot) {
      const pull = clamp(Math.abs(state.dotVelocity) / 700, 0, 2.2);
      dot.style.transform = `translate3d(${state.dotX}px, 0, 0) scaleX(${1 + pull})`;
      dot.style.opacity = `${state.dotAlpha}`;
    }
  };

  const tick = (now: number) => {
    raf = 0;
    const s = options.getSettings();
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
    last = now;
    const target = rects[glideIndex()];
    const zeta = 1 - 0.55 * s.bounce;
    const base = 520;
    let busy = false;

    if (target && !state.waiting) {
      const t0 = target.left;
      const t1 = target.left + target.width;
      if (state.alpha < 0.02 && !state.sliding) {
        state.x0 = t0;
        state.x1 = t1;
        state.v0 = 0;
        state.v1 = 0;
        state.pop = 0.9;
      }
      if (reduce) {
        state.x0 = t0;
        state.x1 = t1;
        state.v0 = 0;
        state.v1 = 0;
      } else {
        const direction = Math.sign((t0 + t1) / 2 - (state.x0 + state.x1) / 2);
        const lead = base * (1 + 0.9 * s.stretch);
        const trail = base * (1 - 0.5 * s.stretch);
        const k0 = direction < 0 ? lead : direction > 0 ? trail : base;
        const k1 = direction > 0 ? lead : direction < 0 ? trail : base;
        const steps = Math.ceil(dt / (1 / 240));
        const h = dt / steps;
        for (let i = 0; i < steps; i++) {
          state.v0 +=
            (-k0 * (state.x0 - t0) - 2 * zeta * Math.sqrt(k0) * state.v0) * h;
          state.x0 += state.v0 * h;
          state.v1 +=
            (-k1 * (state.x1 - t1) - 2 * zeta * Math.sqrt(k1) * state.v1) * h;
          state.x1 += state.v1 * h;
        }
      }
      state.alpha +=
        (1 - state.alpha) * (reduce ? 1 : 1 - Math.exp(-dt / 0.06));
      busy =
        Math.abs(state.x0 - t0) > 0.05 ||
        Math.abs(state.x1 - t1) > 0.05 ||
        Math.abs(state.v0) > 0.5 ||
        Math.abs(state.v1) > 0.5 ||
        state.alpha < 0.999;
      if (!busy) state.sliding = false;
    } else {
      state.alpha +=
        (0 - state.alpha) * (reduce ? 1 : 1 - Math.exp(-dt / 0.07));
      if (state.alpha > 0.002) busy = true;
      else state.alpha = 0;
    }

    state.pop += (1 - state.pop) * (reduce ? 1 : 1 - Math.exp(-dt / 0.09));
    if (Math.abs(1 - state.pop) > 0.001) busy = true;

    const pressTarget = state.pressing ? 0.95 : 1;
    if (reduce) {
      state.press = pressTarget;
      state.pressVelocity = 0;
    } else {
      state.pressVelocity +=
        (-700 * (state.press - pressTarget) - 30 * state.pressVelocity) * dt;
      state.press += state.pressVelocity * dt;
    }
    if (
      Math.abs(state.press - pressTarget) > 0.0005 ||
      Math.abs(state.pressVelocity) > 0.01
    )
      busy = true;

    const dotTarget = s.indicator === 'dot' ? rects[s.activeIndex] : undefined;
    if (dotTarget && !state.waiting) {
      const center = dotTarget.left + dotTarget.width / 2;
      if (state.dotAlpha < 0.02) {
        state.dotX = center;
        state.dotVelocity = 0;
      }
      if (reduce) {
        state.dotX = center;
        state.dotVelocity = 0;
      } else {
        const k = 360;
        const steps = Math.ceil(dt / (1 / 240));
        const h = dt / steps;
        for (let i = 0; i < steps; i++) {
          state.dotVelocity +=
            (-k * (state.dotX - center) -
              2 * (1 - 0.5 * s.bounce) * Math.sqrt(k) * state.dotVelocity) *
            h;
          state.dotX += state.dotVelocity * h;
        }
      }
      state.dotAlpha +=
        (1 - state.dotAlpha) * (reduce ? 1 : 1 - Math.exp(-dt / 0.1));
      if (
        Math.abs(state.dotX - center) > 0.05 ||
        Math.abs(state.dotVelocity) > 0.5 ||
        state.dotAlpha < 0.999
      )
        busy = true;
    } else {
      state.dotAlpha +=
        (0 - state.dotAlpha) * (reduce ? 1 : 1 - Math.exp(-dt / 0.1));
      if (state.dotAlpha > 0.002) busy = true;
      else state.dotAlpha = 0;
    }

    render();
    if (busy) raf = requestAnimationFrame(tick);
  };

  const wake = () => {
    if (destroyed || raf) return;
    last = 0;
    raf = requestAnimationFrame(tick);
  };

  const release = () => {
    if (!state.pressing) return;
    state.pressing = false;
    wake();
  };

  const engine: PillNavEngine = {
    enter: (index, event) => {
      if (event?.pointerType === 'touch') return;
      state.hover = index;
      state.focus = false;
      sync();
      wake();
    },
    leave: () => {
      if (state.focus) return;
      state.hover = -1;
      sync();
      wake();
    },
    focus: (index, event) => {
      const target = event?.target;
      const visible =
        target instanceof Element && target.matches(':focus-visible');
      state.focus = visible;
      state.hover = visible ? index : state.hover;
      sync();
      wake();
    },
    blur: () => {
      if (!state.focus) return;
      state.focus = false;
      state.hover = -1;
      sync();
      wake();
    },
    press: (event) => {
      if (event && event.button > 0) return;
      state.pressing = true;
      wake();
    },
    release,
    refresh: () => {
      measure();
      sync();
      wake();
    },
    destroy: () => {
      destroyed = true;
      cancelAnimationFrame(raf);
      raf = 0;
      window.clearTimeout(timer);
      resizeObserver.disconnect();
      window.removeEventListener('pointerup', release);
      window.removeEventListener('pointercancel', release);
    },
  };

  measure();
  sync();
  render();
  wake();

  if (state.waiting) {
    state.x0 = 0;
    state.x1 = 0;
    timer = window.setTimeout(() => {
      state.waiting = false;
      if (glideIndex() >= 0) {
        state.alpha = 1;
        state.sliding = true;
      }
      wake();
    }, 420);
  }

  const resizeObserver = new ResizeObserver(() => {
    measure();
    render();
    wake();
  });
  const track = options.getTrack();
  if (track) resizeObserver.observe(track);
  document.fonts?.ready
    ?.then(() => {
      if (!destroyed) engine.refresh();
    })
    .catch(() => {});
  window.addEventListener('pointerup', release);
  window.addEventListener('pointercancel', release);

  return engine;
}
