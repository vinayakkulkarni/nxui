import type {
  GlareElements,
  GlareEngine,
  GlareHoverMode,
  GlareHoverVariant,
  GlareSettings,
} from './types';

const smootherstep = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

function bump(t: number, center: number, half: number): number {
  const distance = Math.abs(t - center);
  return distance >= half ? 0 : smootherstep(1 - distance / half);
}

const PROFILES: Record<
  GlareHoverVariant,
  (t: number, softness: number) => number
> = {
  streak: (t, softness) =>
    bump(t, 0.5, 0.06 + 0.16 * softness) + 0.32 * bump(t, 0.5, 0.5),
  twin: (t, softness) =>
    bump(t, 0.36, 0.08 + 0.18 * softness) +
    0.85 * bump(t, 0.7, 0.03 + 0.06 * softness) +
    0.26 * bump(t, 0.5, 0.5),
  sheen: (t, softness) =>
    0.55 * bump(t, 0.5, 0.25 + 0.25 * softness) + 0.3 * bump(t, 0.5, 0.5),
};

/** 33-stop gradient across the band; the profile shapes the light. */
export function glareGradient(
  color: string,
  opacity: number,
  variant: GlareHoverVariant,
  softness: number,
): string {
  const profile = PROFILES[variant] ?? PROFILES.streak;
  const stops = Array.from({ length: 33 }, (_, index) => {
    const t = index / 32;
    const alpha =
      Math.round(Math.min(1, profile(t, softness) * opacity) * 1000) / 10;
    return `color-mix(in srgb, ${color} ${alpha}%, transparent) ${(t * 100).toFixed(1)}%`;
  });
  return `linear-gradient(90deg, ${stops.join(', ')})`;
}

const ease = (t: number) => (1 - Math.cos(Math.PI * t)) / 2;

interface Sweep {
  from: number;
  to: number;
  start: number;
  duration: number;
}

/**
 * Moves a rotated light band across the element. Hover/click/loop modes run
 * eased sweeps that enter from the side the pointer came in; follow mode
 * springs the band to the pointer's projection on the glare axis.
 */
export function createGlareEngine(
  els: GlareElements,
  mode: GlareHoverMode,
  getSettings: () => GlareSettings,
): GlareEngine {
  const { root, glare } = els;
  const geometry = { band: 0, reach: 0, ux: 0, uy: -1, angle: 0 };
  const state = {
    pos: 0,
    velocity: 0,
    target: 0,
    presence: 0,
    presenceTarget: 0,
    visible: true,
  };
  let active: Sweep | null = null;
  let raf = 0;
  let last = 0;
  let timer = 0;
  let introDone = false;

  function write() {
    const transform = `translate(-50%, -50%) rotate(${geometry.angle - 90}deg) translateX(${state.pos.toFixed(2)}px)`;
    for (const band of els.bands()) band.style.transform = transform;
    glare.style.opacity = state.presence.toFixed(3);
  }

  function measure() {
    const { glareAngle: angle, glareSize: size } = getSettings();
    const width = root.clientWidth;
    const height = root.clientHeight;
    const radians = (angle * Math.PI) / 180;
    const ux = Math.sin(radians);
    const uy = -Math.cos(radians);
    const diagonal = Math.hypot(width, height);
    const band = Math.max(8, (diagonal * size) / 100);
    const reach =
      (Math.abs(width * ux) + Math.abs(height * uy)) / 2 + band / 2 + 2;
    const resting = !active && mode !== 'follow';
    Object.assign(geometry, { band, reach, ux, uy, angle });
    for (const element of els.bands()) {
      element.style.width = `${band}px`;
      element.style.height = `${diagonal + band}px`;
    }
    if (resting) state.pos = state.pos > 0 ? reach : -reach;
    write();
  }

  function frame(now: number) {
    const dt = Math.min(0.05, (now - last) / 1000 || 0);
    last = now;
    let moving = false;
    if (active) {
      const sweep = active;
      const t = Math.min(1, (now - sweep.start) / sweep.duration);
      state.pos = sweep.from + (sweep.to - sweep.from) * ease(t);
      if (t < 1) moving = true;
      else active = null;
    } else if (mode === 'follow') {
      const steps = Math.max(1, Math.ceil(dt / (1 / 120)));
      const h = dt / steps;
      for (let i = 0; i < steps; i++) {
        state.velocity +=
          (170 * (state.target - state.pos) - 24 * state.velocity) * h;
        state.pos += state.velocity * h;
      }
      const tau = state.presenceTarget > state.presence ? 0.18 : 0.4;
      state.presence +=
        (state.presenceTarget - state.presence) * (1 - Math.exp(-dt / tau));
      moving =
        Math.abs(state.target - state.pos) > 0.05 ||
        Math.abs(state.velocity) > 0.05 ||
        Math.abs(state.presenceTarget - state.presence) > 0.002;
      if (!moving) state.presence = state.presenceTarget;
    }
    write();
    raf = moving ? requestAnimationFrame(frame) : 0;
  }

  function wake() {
    if (raf) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }

  function sweep(sign: number) {
    if (getSettings().reduce || !geometry.reach) return;
    const end = sign * geometry.reach;
    const from =
      active || Math.abs(state.pos) < geometry.reach ? state.pos : -end;
    if (from === end) return;
    const share = Math.abs(end - from) / (2 * geometry.reach);
    active = {
      from,
      to: end,
      start: performance.now(),
      duration: Math.max(120, getSettings().transitionDuration * share),
    };
    wake();
  }

  function along(event: PointerEvent): number {
    const rect = root.getBoundingClientRect();
    const dx = event.clientX - (rect.left + rect.width / 2);
    const dy = event.clientY - (rect.top + rect.height / 2);
    return dx * geometry.ux + dy * geometry.uy;
  }

  function follow(event: PointerEvent) {
    state.target = Math.max(
      -geometry.reach,
      Math.min(geometry.reach, along(event)),
    );
    wake();
  }

  function onEnter(event: PointerEvent) {
    if (mode === 'hover') sweep(along(event) > 0 ? -1 : 1);
    if (mode === 'follow') {
      if (state.presence < 0.02) {
        state.pos = Math.max(
          -geometry.reach,
          Math.min(geometry.reach, along(event)),
        );
        state.velocity = 0;
      }
      state.presenceTarget = getSettings().reduce ? 0 : 1;
      follow(event);
    }
  }

  function onMove(event: PointerEvent) {
    if (mode === 'follow') follow(event);
  }

  function onLeave(event: PointerEvent) {
    if (mode === 'hover' && !getSettings().playOnce)
      sweep(along(event) > 0 ? 1 : -1);
    if (mode === 'follow') {
      state.presenceTarget = 0;
      wake();
    }
  }

  function onDown(event: PointerEvent) {
    if (mode === 'click') sweep(along(event) > 0 ? -1 : 1);
  }

  function onFocus(event: FocusEvent) {
    if (
      mode !== 'follow' &&
      event.target instanceof Element &&
      event.target.matches(':focus-visible')
    ) {
      sweep(1);
    }
  }

  function schedule() {
    window.clearTimeout(timer);
    if (mode !== 'loop' || getSettings().reduce) return;
    timer = window.setTimeout(
      () => {
        if (state.visible && !document.hidden) sweep(1);
        schedule();
      },
      Math.max(0.5, getSettings().interval) * 1000,
    );
  }

  root.addEventListener('pointerenter', onEnter);
  root.addEventListener('pointermove', onMove);
  root.addEventListener('pointerleave', onLeave);
  root.addEventListener('pointerdown', onDown);
  root.addEventListener('focusin', onFocus);

  const resizeObserver = new ResizeObserver(measure);
  resizeObserver.observe(root);

  const visibilityObserver = new IntersectionObserver(
    ([entry]) => {
      if (!entry) return;
      state.visible = entry.isIntersecting;
      if (entry.isIntersecting && getSettings().intro && !introDone) {
        introDone = true;
        sweep(1);
      }
    },
    { threshold: 0.4 },
  );
  visibilityObserver.observe(root);

  state.presence = mode === 'follow' ? 0 : 1;
  state.presenceTarget = state.presence;
  state.pos = -1e4;
  measure();
  schedule();

  return {
    measure,
    destroy: () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      root.removeEventListener('pointerenter', onEnter);
      root.removeEventListener('pointermove', onMove);
      root.removeEventListener('pointerleave', onLeave);
      root.removeEventListener('pointerdown', onDown);
      root.removeEventListener('focusin', onFocus);
    },
  };
}
