import type {
  PixelTransitionEngine,
  PixelTransitionPoint,
  PixelTransitionSettings,
} from './types';

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const WINDOW = 0.35;
const SEAL = 0.22;
const TONES = 5;
const LEVELS = 16;

type Edge = 'left' | 'right' | 'top' | 'bottom';

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

const smooth = (t: number) => t * t * (3 - 2 * t);

function hash(x: number, y: number, seed: number): number {
  let h =
    Math.imul(x + 1, 668265261) ^
    Math.imul(y + 1, 374761393) ^
    Math.imul(seed + 1, 739982445);
  h = Math.imul(h ^ (h >>> 15), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/**
 * Canvas pixel-dissolve engine. Progress runs 0 → 1 per transition: the
 * first half covers the card, the content swaps at 0.5, the second half
 * clears it. Reversing mid-way just runs progress backwards, so quick
 * hovers never jump.
 */
export function createPixelEngine(
  root: HTMLElement,
  canvas: HTMLCanvasElement,
  getSettings: () => PixelTransitionSettings,
  show: (index: number) => void,
  initial: number,
): PixelTransitionEngine | null {
  const context = canvas.getContext('2d');
  if (!context) return null;
  const ctx: CanvasRenderingContext2D = context;

  const probe = document.createElement('canvas');
  probe.width = 1;
  probe.height = 1;
  const probeCtx = probe.getContext('2d', { willReadFrequently: true });
  const state = {
    progress: 0,
    base: initial,
    goal: initial,
    shown: initial,
    seed: 1,
    originX: 0.5,
    originY: 0.5,
    edge: 'left' as Edge,
    tones: ['#ffffff'],
    toneKey: '',
    dpr: 1,
  };
  let raf = 0;
  let last = 0;
  let drawnAt = 0;
  let alive = true;

  function resolveTones() {
    const s = getSettings();
    canvas.style.color = s.pixelColor;
    const color = getComputedStyle(canvas).color;
    canvas.style.color = '';
    let rgba = [255, 255, 255, 1];
    if (probeCtx) {
      probeCtx.clearRect(0, 0, 1, 1);
      probeCtx.fillStyle = color;
      probeCtx.fillRect(0, 0, 1, 1);
      const data = probeCtx.getImageData(0, 0, 1, 1).data;
      rgba = [
        data[0] ?? 255,
        data[1] ?? 255,
        data[2] ?? 255,
        (data[3] ?? 255) / 255,
      ];
    }
    const [r0 = 255, g0 = 255, b0 = 255, a0 = 1] = rgba;
    const target =
      (0.2126 * r0 + 0.7152 * g0 + 0.0722 * b0) / 255 > 0.5 ? 0 : 255;
    state.tones = Array.from({ length: TONES }, (_, index) => {
      const mix = s.mosaic * 0.5 * (index / (TONES - 1));
      const [r, g, b] = [r0, g0, b0].map((value) =>
        Math.round(value + (target - value) * mix),
      );
      return `rgba(${r}, ${g}, ${b}, ${a0})`;
    });
    state.toneKey = `${s.pixelColor}|${s.mosaic}`;
  }

  function setShown(index: number) {
    state.shown = index;
    show(index);
  }

  function draw() {
    const s = getSettings();
    const { width, height } = canvas;
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, width, height);
    const progress = state.progress;
    if (progress <= 0 || progress >= 1) return;
    if (state.toneKey !== `${s.pixelColor}|${s.mosaic}`) resolveTones();

    const covering = progress < 0.5;
    const local = covering ? progress * 2 : progress * 2 - 1;
    const seal = covering
      ? smooth(clamp((local - 1 + SEAL) / SEAL, 0, 1))
      : 1 - smooth(clamp(local / SEAL, 0, 1));
    const cols = s.gridSize;
    const cell = width / cols;
    const rows = Math.ceil(height / cell);
    const top = (height - rows * cell) / 2;
    const gap = Math.min(cell * 0.8, s.gap * state.dpr) * (1 - seal);
    const ox = state.originX * width;
    const oy = state.originY * height;
    const far = Math.max(
      Math.hypot(ox, oy),
      Math.hypot(width - ox, oy),
      Math.hypot(ox, height - oy),
      Math.hypot(width - ox, height - oy),
    );
    const paths = new Map<number, Path2D>();

    for (let row = 0; row < rows; row++) {
      const y0 = top + row * cell;
      const cy = y0 + cell / 2;
      for (let col = 0; col < cols; col++) {
        const x0 = col * cell;
        const cx = x0 + cell / 2;
        const noise = hash(col, row, state.seed);
        let delay = noise;
        if (s.pattern === 'dither')
          delay = ((BAYER[(row & 3) * 4 + (col & 3)] ?? 0) + noise) / 16;
        else if (s.pattern !== 'random') {
          let base: number;
          if (s.pattern === 'ripple')
            base = Math.hypot(cx - ox, cy - oy) / Math.max(1, far);
          else if (state.edge === 'left') base = cx / width;
          else if (state.edge === 'right') base = 1 - cx / width;
          else if (state.edge === 'top') base = cy / height;
          else base = 1 - cy / height;
          delay = clamp(base, 0, 1) * (1 - s.randomness) + noise * s.randomness;
        }

        let amount: number;
        if (s.animation === 'pop') amount = local >= delay === covering ? 1 : 0;
        else {
          const t = smooth(
            clamp((local - delay * (1 - WINDOW)) / WINDOW, 0, 1),
          );
          amount = covering ? t : 1 - t;
        }
        if (amount <= 0.002) continue;

        const size = (s.animation === 'grow' ? cell * amount : cell) - gap;
        if (size <= 0) continue;
        const level =
          s.animation === 'fade'
            ? Math.max(1, Math.round(amount * LEVELS))
            : LEVELS;
        const tone = s.mosaic > 0 ? Math.floor(hash(col, row, 7) * TONES) : 0;
        const key = tone * (LEVELS + 1) + level;
        let path = paths.get(key);
        if (!path) {
          path = new Path2D();
          paths.set(key, path);
        }

        if (s.shape === 'circle') {
          const radius = (size / 2) * (1 + 0.45 * seal);
          path.moveTo(cx + radius, cy);
          path.arc(cx, cy, radius, 0, Math.PI * 2);
        } else if (s.shape === 'rounded' && seal < 1 && 'roundRect' in path) {
          path.roundRect(
            cx - size / 2,
            cy - size / 2,
            size,
            size,
            size * 0.3 * (1 - seal),
          );
        } else if (size >= cell - 0.01) {
          const left = Math.round(x0);
          const upper = Math.round(y0);
          path.rect(
            left,
            upper,
            Math.round(x0 + cell) - left,
            Math.round(y0 + cell) - upper,
          );
        } else {
          path.rect(cx - size / 2, cy - size / 2, size, size);
        }
      }
    }

    paths.forEach((path, key) => {
      ctx.globalAlpha = (key % (LEVELS + 1)) / LEVELS;
      ctx.fillStyle =
        state.tones[Math.floor(key / (LEVELS + 1))] ?? state.tones[0] ?? '#fff';
      ctx.fill(path);
    });
    ctx.globalAlpha = 1;
  }

  function paint() {
    const index = state.progress >= 0.5 ? 1 - state.base : state.base;
    if (index !== state.shown) setShown(index);
    draw();
  }

  function frame(now: number) {
    raf = 0;
    if (!alive) return;
    const s = getSettings();
    const dt = last ? Math.min(0.1, (now - last) / 1000) : 1 / 60;
    last = now;
    const aim = state.goal === state.base ? 0 : 1;
    const step = s.reduce ? 1 : dt / (2 * s.duration);
    state.progress =
      aim > state.progress
        ? Math.min(aim, state.progress + step)
        : Math.max(aim, state.progress - step);
    const settled = state.progress === aim;
    if (settled && aim === 1) {
      state.base = 1 - state.base;
      state.progress = 0;
    }
    if (settled || !s.fps || now - drawnAt >= 1000 / s.fps - 2) {
      drawnAt = now;
      paint();
    }
    if (!settled) raf = requestAnimationFrame(frame);
  }

  function start(point: PixelTransitionPoint | null) {
    const rect = root.getBoundingClientRect();
    const x = point
      ? clamp((point.x - rect.left) / Math.max(1, rect.width), 0, 1)
      : 0.5;
    const y = point
      ? clamp((point.y - rect.top) / Math.max(1, rect.height), 0, 1)
      : 0.5;
    state.originX = x;
    state.originY = y;
    state.seed = Math.floor(Math.random() * 65536);
    if (!point) state.edge = 'left';
    else {
      const sides: [Edge, number][] = [
        ['left', x * rect.width],
        ['right', (1 - x) * rect.width],
        ['top', y * rect.height],
        ['bottom', (1 - y) * rect.height],
      ];
      state.edge = sides.reduce((best, side) =>
        side[1] < best[1] ? side : best,
      )[0];
    }
    resolveTones();
  }

  function go(next: boolean, point: PixelTransitionPoint | null) {
    const goal = next ? 1 : 0;
    if (goal === state.goal) return;
    if (!goal && getSettings().once) return;
    state.goal = goal;
    if (state.progress === 0 && goal !== state.base) start(point);
    if (raf) return;
    last = 0;
    drawnAt = 0;
    raf = requestAnimationFrame(frame);
  }

  function resize() {
    state.dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(root.clientWidth * state.dpr));
    canvas.height = Math.max(1, Math.round(root.clientHeight * state.dpr));
    draw();
  }

  function destroy() {
    alive = false;
    cancelAnimationFrame(raf);
    raf = 0;
  }

  resize();

  return { go, goal: () => state.goal, resize, destroy };
}
