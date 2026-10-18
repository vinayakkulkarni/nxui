import type {
  ShinyTextEasing,
  ShinyTextEngine,
  ShinyTextEngineOptions,
  ShinyTextRgba,
  ShinyTextState,
  ShinyTextTrigger,
} from './types';

export const SHINY_TEXT_EASINGS: Record<
  ShinyTextEasing,
  (t: number) => number
> = {
  linear: (t) => t,
  smooth: (t) => 0.5 - Math.cos(Math.PI * t) / 2,
  snappy: (t) =>
    t < 0.5 ? 16 * Math.pow(t, 5) : 1 - Math.pow(-2 * t + 2, 5) / 2,
};

export const SHINY_TEXT_TRIGGERS: ShinyTextTrigger[] = [
  'loop',
  'hover',
  'view',
];

const FALLOFF = [0, 0.2, 0.4, 0.6, 0.8, 1];

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

let paint: CanvasRenderingContext2D | null = null;

/** Resolves any CSS color through a 2D canvas into RGBA. */
function parseColor(value: string): ShinyTextRgba | null {
  if (typeof document === 'undefined') return null;
  if (!paint) paint = document.createElement('canvas').getContext('2d');
  if (!paint) return null;
  paint.fillStyle = '#000000';
  paint.fillStyle = value;
  const resolved = String(paint.fillStyle);
  if (resolved.startsWith('#')) {
    const [r, g, b] = [1, 3, 5].map((i) =>
      Number.parseInt(resolved.slice(i, i + 2), 16),
    );
    return [r ?? 0, g ?? 0, b ?? 0, 1];
  }
  const parts = resolved.match(/[\d.]+/g);
  if (!parts || parts.length < 3) return null;
  return [
    Number(parts[0]),
    Number(parts[1]),
    Number(parts[2]),
    parts.length > 3 ? Number(parts[3]) : 1,
  ];
}

/** Gamma-correct mix of two colors; premultiplied when alphas differ. */
function blend(from: ShinyTextRgba, to: ShinyTextRgba, amount: number): string {
  const channel = (a: number, b: number) =>
    Math.round(
      Math.pow(
        Math.pow(a / 255, 2.2) * (1 - amount) + Math.pow(b / 255, 2.2) * amount,
        1 / 2.2,
      ) * 255,
    );
  const alpha = from[3] * (1 - amount) + to[3] * amount;
  if (alpha <= 0) return 'rgba(0, 0, 0, 0)';
  const weigh = (a: number, b: number) =>
    (a * from[3] * (1 - amount) + b * to[3] * amount) / alpha;
  const mix = (i: 0 | 1 | 2) =>
    from[3] === to[3]
      ? channel(from[i], to[i])
      : Math.round(weigh(from[i], to[i]));
  return `rgba(${mix(0)}, ${mix(1)}, ${mix(2)}, ${Math.round(alpha * 1000) / 1000})`;
}

/**
 * Sweeps a band of light across text painted with `background-clip: text`.
 * A single rAF loop drives loop / hover / view triggers, yoyo, pause on
 * hover and a spring that follows the pointer; it sleeps between sweeps.
 */
export function createShinyText(
  options: ShinyTextEngineOptions,
): ShinyTextEngine {
  const { root, reduced: reduce } = options;
  const config = options.settings;
  const state: ShinyTextState = {
    pos: null,
    vel: 0,
    phase: 'idle',
    from: 0,
    to: 0,
    start: 0,
    duration: 1,
    resume: 0,
    flip: false,
    inside: false,
    target: 0,
    visible: true,
    seen: false,
    colors: '',
  };
  let base: ShinyTextRgba | null = null;
  let shine: ShinyTextRgba | null = null;
  let clear: ShinyTextRgba | null = null;
  let raf = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let last = 0;
  let alive = true;

  const extent = () => {
    const s = config();
    return s.shineWidth / 2 + (s.bands - 1) * s.shineWidth * 1.3 + 2;
  };
  const entry = () => (config().sign > 0 ? -extent() : 100 + extent());
  const exit = () => (config().sign > 0 ? 100 + extent() : -extent());
  const nearest = () => (state.target < 50 ? -extent() : 100 + extent());

  function gradient(pos: number, fill: ShinyTextRgba, light: ShinyTextRgba) {
    const s = config();
    const half = s.shineWidth / 2;
    const core = half * (1 - s.softness);
    const fade = half - core;
    const stops: [number, number][] = [];
    for (let band = 0; band < s.bands; band++) {
      const center = pos - s.sign * band * s.shineWidth * 1.3;
      const strength = 1 - band * 0.28;
      for (const side of [-1, 1]) {
        for (const f of FALLOFF) {
          const at = center + side * (core + fade * (1 - f));
          stops.push([at, f * f * (3 - 2 * f) * strength]);
        }
      }
    }
    stops.sort((a, b) => a[0] - b[0]);
    const list = stops.map(
      ([at, amount]) => `${blend(fill, light, amount)} ${at.toFixed(2)}%`,
    );
    const edge = blend(fill, light, 0);
    return `linear-gradient(${s.angle}deg, ${edge} 0%, ${list.join(', ')}, ${edge} 100%)`;
  }

  function draw() {
    const s = config();
    const key = `${s.color}|${s.shineColor}`;
    if (key !== state.colors) {
      state.colors = key;
      base = parseColor(s.color);
      shine = parseColor(s.shineColor);
      clear = shine ? [shine[0], shine[1], shine[2], 0] : null;
    }
    const glow = options.glow();
    if (!base || !shine || !clear) {
      root.style.backgroundImage = `linear-gradient(${s.color}, ${s.color})`;
      return;
    }
    if (state.pos === null || s.disabled) {
      root.style.backgroundImage = `linear-gradient(${s.color}, ${s.color})`;
      if (glow) glow.style.backgroundImage = 'none';
      return;
    }
    root.style.backgroundImage = gradient(state.pos, base, shine);
    if (glow) {
      glow.style.backgroundImage = gradient(state.pos, clear, shine);
      glow.style.opacity = String(s.glow);
    }
  }

  function sweep(from: number, to: number, now: number) {
    const span = Math.abs(exit() - entry()) || 1;
    state.phase = 'sweep';
    state.from = from;
    state.to = to;
    state.start = now;
    state.duration =
      config().speed * 1000 * Math.max(0.15, Math.abs(to - from) / span);
  }

  function wake() {
    if (raf || !alive) return;
    clearTimeout(timer);
    timer = undefined;
    last = performance.now();
    raf = requestAnimationFrame(tick);
  }

  function tick(now: number) {
    raf = 0;
    if (!alive) return;
    const s = config();
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
    last = now;
    if (s.disabled) {
      state.pos = null;
      state.phase = 'idle';
      draw();
      return;
    }
    if (s.followPointer && state.inside) {
      const pos = state.pos ?? nearest();
      const stiffness = 220;
      state.vel +=
        ((state.target - pos) * stiffness -
          state.vel * 2 * Math.sqrt(stiffness)) *
        dt;
      state.pos = pos + state.vel * dt;
      state.phase = 'follow';
      draw();
      raf = requestAnimationFrame(tick);
      return;
    }
    if (state.phase === 'follow') {
      state.vel = 0;
      sweep(state.pos ?? nearest(), nearest(), now);
    }
    if (state.phase === 'sweep') {
      if (s.pauseOnHover && state.inside) {
        state.start += dt * 1000;
        raf = requestAnimationFrame(tick);
        return;
      }
      const t = clamp((now - state.start) / state.duration, 0, 1);
      state.pos = state.from + (state.to - state.from) * s.ease(t);
      draw();
      if (t < 1) {
        raf = requestAnimationFrame(tick);
        return;
      }
      if (s.trigger !== 'loop' || reduce) {
        state.phase = 'idle';
        state.pos = null;
        draw();
        return;
      }
      state.phase = 'wait';
      state.resume = now + s.delay * 1000;
    }
    if (state.phase === 'wait') {
      if (!state.visible) return;
      if (now < state.resume) {
        clearTimeout(timer);
        timer = setTimeout(wake, state.resume - now);
        return;
      }
      if (s.yoyo) {
        state.flip = !state.flip;
        sweep(
          state.flip ? exit() : entry(),
          state.flip ? entry() : exit(),
          now,
        );
      } else {
        sweep(entry(), exit(), now);
      }
      raf = requestAnimationFrame(tick);
      return;
    }
    if (
      state.phase === 'idle' &&
      s.trigger === 'loop' &&
      !reduce &&
      state.visible
    ) {
      state.flip = false;
      sweep(entry(), exit(), now);
      raf = requestAnimationFrame(tick);
    }
  }

  /** Pointer position projected onto the band's travel axis, in %. */
  function locate(event: PointerEvent): number {
    const s = config();
    const rect = root.getBoundingClientRect();
    const radians = (s.angle * Math.PI) / 180;
    const dx = Math.sin(radians);
    const dy = -Math.cos(radians);
    const length = Math.abs(rect.width * dx) + Math.abs(rect.height * dy) || 1;
    const along =
      (event.clientX - rect.left - rect.width / 2) * dx +
      (event.clientY - rect.top - rect.height / 2) * dy;
    return 50 + (along / length) * 100;
  }

  function onEnter(event: PointerEvent) {
    const s = config();
    state.inside = true;
    state.target = locate(event);
    if (s.disabled) return;
    if (s.followPointer) {
      if (state.pos === null) state.pos = nearest();
    } else if (s.trigger === 'hover' && state.phase === 'idle' && !reduce) {
      sweep(entry(), exit(), performance.now());
    }
    wake();
  }

  function onMove(event: PointerEvent) {
    state.target = locate(event);
    if (config().followPointer) wake();
  }

  function onLeave() {
    state.inside = false;
    wake();
  }

  const observer = new IntersectionObserver((entries) => {
    const visible = entries.some((item) => item.isIntersecting);
    state.visible = visible;
    const s = config();
    if (!visible) return;
    if (s.trigger === 'view' && !state.seen && !reduce && !s.disabled) {
      state.seen = true;
      sweep(entry(), exit(), performance.now());
    }
    wake();
  });
  observer.observe(root);

  root.addEventListener('pointerenter', onEnter);
  root.addEventListener('pointermove', onMove);
  root.addEventListener('pointerleave', onLeave);

  draw();
  wake();

  return {
    sync() {
      const s = config();
      if (s.disabled) {
        state.pos = null;
        state.phase = 'idle';
      } else if (s.trigger !== 'loop' && state.phase === 'wait') {
        state.phase = 'idle';
        state.pos = null;
      }
      draw();
      wake();
    },
    dispose() {
      alive = false;
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      observer.disconnect();
      root.removeEventListener('pointerenter', onEnter);
      root.removeEventListener('pointermove', onMove);
      root.removeEventListener('pointerleave', onLeave);
    },
  };
}
