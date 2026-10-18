import type {
  PixelCardEngine,
  PixelCardEngineOptions,
  PixelCardPointer,
  PixelCardPreset,
  PixelCardPulse,
  PixelCardShape,
  PixelCardTrigger,
  PixelCardVariant,
} from './types';

export const PIXEL_CARD_VARIANTS: Record<PixelCardVariant, PixelCardPreset> = {
  default: {
    gap: 5,
    speed: 35,
    colors: {
      dark: ['#f8fafc', '#f1f5f9', '#cbd5e1'],
      light: ['#18181b', '#52525b', '#a1a1aa'],
    },
    glow: { dark: '#cbd5e1', light: '#71717a' },
    noFocus: false,
  },
  blue: {
    gap: 10,
    speed: 25,
    colors: {
      dark: ['#e0f2fe', '#7dd3fc', '#0ea5e9'],
      light: ['#0c4a6e', '#0369a1', '#0284c7'],
    },
    glow: { dark: '#0ea5e9', light: '#0284c7' },
    noFocus: false,
  },
  yellow: {
    gap: 3,
    speed: 20,
    colors: {
      dark: ['#fef08a', '#fde047', '#eab308'],
      light: ['#713f12', '#a16207', '#ca8a04'],
    },
    glow: { dark: '#eab308', light: '#ca8a04' },
    noFocus: false,
  },
  pink: {
    gap: 6,
    speed: 80,
    colors: {
      dark: ['#fecdd3', '#fda4af', '#e11d48'],
      light: ['#831843', '#be123c', '#e11d48'],
    },
    glow: { dark: '#e11d48', light: '#be123c' },
    noFocus: true,
  },
};

export const PIXEL_CARD_SHAPES: Record<PixelCardShape, number> = {
  square: 0,
  circle: 1,
  diamond: 2,
};

export const PIXEL_CARD_TRIGGERS: PixelCardTrigger[] = [
  'hover',
  'click',
  'always',
];

const APPEAR = 0.26;
const EXIT = 0.22;

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

const smoothstep = (edge0: number, edge1: number, value: number): number => {
  const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};

const easeOutBack = (t: number): number => {
  const c = 1.9;
  const u = t - 1;
  return 1 + (c + 1) * u * u * u + c * u * u;
};

export const toColorList = (value: string | string[]): string[] =>
  (Array.isArray(value) ? value : value.split(','))
    .map((color) => color.trim())
    .filter(Boolean);

let probe: CanvasRenderingContext2D | null = null;

/** Resolves any CSS color to RGB through a 1×1 canvas. Client only. */
function toRgb(color: string): [number, number, number] {
  if (typeof document === 'undefined') return [255, 255, 255];
  if (!probe) {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    probe = canvas.getContext('2d', { willReadFrequently: true });
  }
  if (!probe) return [255, 255, 255];
  probe.clearRect(0, 0, 1, 1);
  probe.fillStyle = '#fff';
  probe.fillStyle = color;
  probe.fillRect(0, 0, 1, 1);
  const data = probe.getImageData(0, 0, 1, 1).data;
  return [data[0] ?? 255, data[1] ?? 255, data[2] ?? 255];
}

/**
 * Canvas engine: a grid of pixels that reveal in a wave from the center or
 * the pointer, twinkle, swell under a spring-follow spotlight and ripple on
 * click. The host owns the rAF loop and DOM listeners.
 */
export function createPixelCardEngine(
  options: PixelCardEngineOptions,
): PixelCardEngine | null {
  const { container, canvas, getSettings, reduce, onActive, wake } = options;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  let last = 0;
  let time = 0;
  let visible = true;
  let width = 0;
  let height = 0;
  let ratio = 1;
  let key = '';
  let count = 0;
  let xs = new Float32Array(0);
  let ys = new Float32Array(0);
  let tint = new Uint8Array(0);
  let sizes = new Float32Array(0);
  let phase = new Float32Array(0);
  let rate = new Float32Array(0);
  let jitter = new Float32Array(0);
  let presence = new Float32Array(0);
  let delay = new Float32Array(0);
  let mask = new Float32Array(0);
  let maskKey = '';
  let mode: PixelCardTrigger | '' = '';
  let active = false;
  let changedAt = 0;
  let originX = 0;
  let originY = 0;
  let maxDistance = 1;
  let pointerX = 0;
  let pointerY = 0;
  let spotX = 0;
  let spotY = 0;
  let spotVX = 0;
  let spotVY = 0;
  let spotPower = 0;
  let hovering = false;
  let pulses: PixelCardPulse[] = [];
  let dt = 1 / 60;
  let releaseAt = -1;
  let introAt = -1;
  let introStarted = false;
  let glowKey = '';
  let glowRgb: [number, number, number] = [255, 255, 255];

  function schedule(): void {
    const s = getSettings();
    const span = s.revealDuration / 1000;
    let far = 1;
    for (let i = 0; i < count; i++) {
      far = Math.max(far, Math.hypot(xs[i]! - originX, ys[i]! - originY));
    }
    maxDistance = far;
    for (let i = 0; i < count; i++) {
      const distance = Math.hypot(xs[i]! - originX, ys[i]! - originY) / far;
      delay[i] = active
        ? distance * span * 0.82 + jitter[i]! * span * 0.18
        : (1 - distance) * span * 0.45 + jitter[i]! * span * 0.1;
    }
  }

  function build(): void {
    const s = getSettings();
    const rect = container.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width));
    const h = Math.max(1, Math.round(rect.height));
    const r = Math.min(window.devicePixelRatio || 1, 2);
    const next = [w, h, r, s.gap, s.pixelSize, s.colors.join(',')].join('|');
    if (next === key) return;
    key = next;
    width = w;
    height = h;
    ratio = r;
    canvas.width = Math.round(w * r);
    canvas.height = Math.round(h * r);

    const columns = Math.floor((w - 1) / s.gap) + 1;
    const rows = Math.floor((h - 1) / s.gap) + 1;
    const offsetX = (w - (columns - 1) * s.gap) / 2;
    const offsetY = (h - (rows - 1) * s.gap) / 2;
    const total = columns * rows;
    const previous = presence;
    count = total;
    xs = new Float32Array(total);
    ys = new Float32Array(total);
    tint = new Uint8Array(total);
    sizes = new Float32Array(total);
    phase = new Float32Array(total);
    rate = new Float32Array(total);
    jitter = new Float32Array(total);
    presence = new Float32Array(total);
    delay = new Float32Array(total);
    let i = 0;
    for (let column = 0; column < columns; column++) {
      for (let row = 0; row < rows; row++) {
        xs[i] = offsetX + column * s.gap;
        ys[i] = offsetY + row * s.gap;
        tint[i] = Math.floor(Math.random() * s.colors.length);
        sizes[i] = s.pixelSize * (0.25 + Math.random() * 0.75);
        phase[i] = Math.random() * Math.PI * 2;
        rate[i] = 0.55 + Math.random() * 0.9;
        jitter[i] = Math.random();
        if (previous.length)
          presence[i] = previous[Math.min(i, previous.length - 1)]!;
        i++;
      }
    }
    maxDistance = Math.hypot(w, h);
    schedule();
  }

  function setActive(value: boolean, x?: number, y?: number): void {
    if (active === value) return;
    const s = getSettings();
    active = value;
    changedAt = time;
    if (value) {
      const usePointer =
        s.origin === 'pointer' && x !== undefined && y !== undefined;
      originX = usePointer ? x : width / 2;
      originY = usePointer ? y : height / 2;
    }
    schedule();
    onActive(value);
    wake();
  }

  const context = ctx;
  const draw = (): number => {
    const s = getSettings();
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, width, height);
    const reduced = reduce();

    const nextMaskKey = `${count}|${width}|${height}|${s.fade}`;
    if (maskKey !== nextMaskKey) {
      maskKey = nextMaskKey;
      mask = new Float32Array(count);
      const near = Math.min(width, height) * 0.05;
      const far = Math.min(width, height) * 0.42;
      for (let i = 0; i < count; i++) {
        const edge = Math.min(xs[i]!, width - xs[i]!, ys[i]!, height - ys[i]!);
        const t = clamp((edge - near) / (far - near), 0, 1);
        mask[i] = 1 - s.fade * t * t * t * (t * (t * 6 - 15) + 10);
      }
    }

    let presenceSum = 0;
    const elapsed = time - changedAt;
    const appearStep = dt / APPEAR;
    const exitStep = dt / EXIT;
    for (let i = 0; i < count; i++) {
      const current = presence[i]!;
      const ready = elapsed >= delay[i]! || reduced;
      const target = active ? (ready ? 1 : 0) : ready ? 0 : current;
      if (reduced) presence[i] = target;
      else if (target > current)
        presence[i] = Math.min(1, current + appearStep);
      else if (target < current) presence[i] = Math.max(0, current - exitStep);
      presenceSum += presence[i]!;
    }
    const presenceAvg = count ? presenceSum / count : 0;

    if (s.glow > 0 && presenceAvg > 0.001) {
      if (glowKey !== s.glowColor) {
        glowKey = s.glowColor;
        glowRgb = toRgb(s.glowColor);
      }
      const [r, g, b] = glowRgb;
      const cx = spotPower > 0.01 ? spotX : originX;
      const cy = spotPower > 0.01 ? spotY : originY;
      const reach = Math.max(width, height) * 0.85;
      const gradient = context.createRadialGradient(cx, cy, 0, cx, cy, reach);
      const strength =
        s.glow * s.opacity * 0.32 * Math.min(1, presenceAvg * 1.4);
      gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${strength})`);
      gradient.addColorStop(0.45, `rgba(${r}, ${g}, ${b}, ${strength * 0.35})`);
      gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
      context.fillStyle = gradient;
      context.fillRect(0, 0, width, height);
    }

    const spotRadius = Math.min(width, height) * 0.38 + 30;
    const spotStrength = s.spotlight * spotPower;
    const twinkle = reduced ? 0 : smoothstep(0, 100, s.speed) > 0 ? 1 : 0;
    const frequency = (s.speed / 35) * 1.35;

    for (let color = 0; color < s.colors.length; color++) {
      context.fillStyle = s.colors[color]!;
      for (let i = 0; i < count; i++) {
        if (tint[i] !== color) continue;
        const p = presence[i]!;
        if (p <= 0.002) continue;
        const x = xs[i]!;
        const y = ys[i]!;
        let size = sizes[i]!;
        let alpha = 0.5 + p * 0.38;
        if (twinkle) {
          const wave = Math.sin(phase[i]! + time * frequency * rate[i]!);
          size *= 0.62 + 0.38 * wave;
          alpha +=
            0.12 * wave + (jitter[i]! > 0.92 ? 0.35 * Math.max(0, wave) : 0);
        }
        size *= easeOutBack(p);
        const flash = p < 1 && active ? Math.sin(p * Math.PI) : 0;
        size *= 1 + flash * 0.9;
        alpha += flash * 0.6;
        if (spotStrength > 0.001) {
          const near = smoothstep(
            spotRadius,
            0,
            Math.hypot(x - spotX, y - spotY),
          );
          size *= 1 + spotStrength * near * near * 2.4;
          alpha += spotStrength * near * 0.45;
        }
        alpha = Math.min(1, alpha) * mask[i]! * s.opacity;
        if (alpha <= 0.004) continue;
        for (const pulse of pulses) {
          const band =
            (Math.hypot(x - pulse.x, y - pulse.y) - pulse.radius) / 26;
          const wave = Math.exp(-band * band) * pulse.power;
          size *= 1 + wave * 1.4;
          alpha = Math.min(1, alpha + wave * 0.5);
        }
        if (size <= 0.05) continue;
        context.globalAlpha = alpha;
        if (s.shape === 1) {
          context.beginPath();
          context.arc(x, y, size * 0.5, 0, Math.PI * 2);
          context.fill();
        } else if (s.shape === 2) {
          const half = size * 0.62;
          context.beginPath();
          context.moveTo(x, y - half);
          context.lineTo(x + half, y);
          context.lineTo(x, y + half);
          context.lineTo(x - half, y);
          context.closePath();
          context.fill();
        } else {
          context.fillRect(x - size * 0.5, y - size * 0.5, size, size);
        }
      }
    }
    context.globalAlpha = 1;
    return presenceSum;
  };

  function frame(now: number): boolean {
    const s = getSettings();
    dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
    last = now;
    time += dt;
    build();

    if (introAt >= 0 && time >= introAt) {
      introAt = -1;
      if (!active) {
        setActive(true);
        if (mode !== 'always') releaseAt = time + s.revealDuration / 1000 + 0.7;
      }
    }

    if (releaseAt >= 0 && time >= releaseAt && !hovering && mode !== 'always') {
      releaseAt = -1;
      setActive(false);
    }

    const want = hovering && !reduce() ? 1 : 0;
    spotPower += (want - spotPower) * (1 - Math.exp(-(want ? 6 : 3) * dt));
    const stiffness = 120;
    const damping = 2 * Math.sqrt(stiffness) * 0.9;
    spotVX += (stiffness * (pointerX - spotX) - damping * spotVX) * dt;
    spotVY += (stiffness * (pointerY - spotY) - damping * spotVY) * dt;
    spotX += spotVX * dt;
    spotY += spotVY * dt;

    const pulseSpeed =
      maxDistance / Math.max(0.35, (s.revealDuration / 1000) * 0.9);
    pulses = pulses.filter((pulse) => {
      pulse.radius += pulseSpeed * dt;
      pulse.power = Math.max(0, 1 - pulse.radius / (maxDistance + 40));
      return pulse.power > 0;
    });

    const sum = draw();
    const settling =
      active ||
      introAt >= 0 ||
      sum > 0 ||
      pulses.length > 0 ||
      spotPower > 0.002 ||
      Math.abs(spotVX) + Math.abs(spotVY) > 0.5;
    const more = settling && visible;
    if (!more) last = 0;
    return more;
  }

  function local(event: PixelCardPointer): [number, number] {
    const rect = container.getBoundingClientRect();
    return [event.clientX - rect.left, event.clientY - rect.top];
  }

  function enter(event: PixelCardPointer): void {
    const [x, y] = local(event);
    hovering = event.pointerType !== 'touch';
    pointerX = x;
    pointerY = y;
    if (spotPower < 0.01) {
      spotX = x;
      spotY = y;
      spotVX = 0;
      spotVY = 0;
    }
    if (mode === 'hover') {
      releaseAt = -1;
      introAt = -1;
      setActive(true, x, y);
    }
    wake();
  }

  function move(event: PixelCardPointer): void {
    const [x, y] = local(event);
    pointerX = x;
    pointerY = y;
    wake();
  }

  function leave(event: PixelCardPointer): void {
    hovering = false;
    if (mode === 'hover') {
      if (event.pointerType === 'touch') releaseAt = time + 1.2;
      else setActive(false);
    }
    wake();
  }

  function down(event: PixelCardPointer): void {
    const [x, y] = local(event);
    if (mode === 'click') {
      introAt = -1;
      releaseAt = -1;
      setActive(!active, x, y);
    } else if (!active) {
      setActive(true, x, y);
    }
    if (getSettings().clickPulse && !reduce() && active) {
      pulses.push({ x, y, radius: 0, power: 1 });
    }
    wake();
  }

  function outside(target: EventTarget | null): void {
    if (
      mode === 'click' &&
      active &&
      !(target instanceof Node && container.contains(target))
    )
      setActive(false);
  }

  function toggle(): void {
    if (mode !== 'click') return;
    setActive(!active);
  }

  function focus(): void {
    if (mode === 'hover') setActive(true);
  }

  function blur(): void {
    if (mode === 'hover' && !hovering) setActive(false);
  }

  function sync(): void {
    const next = getSettings().trigger;
    if (mode === next) return;
    const previous = mode;
    mode = next;
    if (!previous) return;
    if (next === 'always') {
      releaseAt = -1;
      setActive(true);
    } else if (previous === 'always' && !hovering) {
      setActive(false);
    }
  }

  function setVisible(value: boolean): void {
    visible = value;
    const s = getSettings();
    if (
      visible &&
      !introStarted &&
      (s.trigger === 'always' || (s.intro && !reduce()))
    ) {
      introStarted = true;
      build();
      introAt = time + s.introDelay / 1000;
    }
    if (visible) wake();
  }

  function reset(): void {
    last = 0;
  }

  mode = getSettings().trigger;
  build();
  pointerX = width / 2;
  pointerY = height / 2;
  spotX = pointerX;
  spotY = pointerY;
  originX = width / 2;
  originY = height / 2;

  return {
    frame,
    build,
    sync,
    setVisible,
    enter,
    move,
    leave,
    down,
    outside,
    toggle,
    focus,
    blur,
    reset,
  };
}
