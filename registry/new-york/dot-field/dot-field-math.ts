import type {
  DotFieldPattern,
  DotFieldProps,
  DotFieldSettings,
  Vec3,
} from './types';

export const PIXEL_BUDGET = 9e6;
export const MAX_DOTS = 120000;
const PATTERNS: Record<DotFieldPattern, number> = {
  grid: 0,
  hex: 1,
  spiral: 2,
  scatter: 3,
};
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

function parseColor(value: string): Vec3 | null {
  const text = String(value || '').trim();
  const hex = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(text);
  if (hex?.[1]) {
    const full =
      hex[1].length === 3
        ? hex[1].replace(/./g, (digit) => digit + digit)
        : hex[1];
    return [
      Number.parseInt(full.slice(0, 2), 16) / 255,
      Number.parseInt(full.slice(2, 4), 16) / 255,
      Number.parseInt(full.slice(4, 6), 16) / 255,
    ];
  }
  const rgb = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i.exec(text);
  if (rgb)
    return [
      clamp(Number.parseFloat(rgb[1] ?? '0') / 255, 0, 1),
      clamp(Number.parseFloat(rgb[2] ?? '0') / 255, 0, 1),
      clamp(Number.parseFloat(rgb[3] ?? '0') / 255, 0, 1),
    ];
  return null;
}

const toLinear = (channel: number) =>
  channel <= 0.04045
    ? channel / 12.92
    : Math.pow((channel + 0.055) / 1.055, 2.4);

function toOklab(color: Vec3): Vec3 {
  const r = toLinear(color[0]);
  const g = toLinear(color[1]);
  const b = toLinear(color[2]);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

/** OKLab color; in light mode, bright colors are darkened into readable ink. */
function toInk(value: string, fallback: Vec3, light: boolean): Vec3 {
  const lab = toOklab(parseColor(value) ?? fallback);
  if (!light) return lab;
  const hue = (Math.atan2(lab[2], lab[1]) * 180) / Math.PI;
  const warmth = clamp(1 - Math.abs(hue - 85) / 40, 0, 1);
  const ceiling = 0.6 + 0.16 * warmth * warmth * (3 - 2 * warmth);
  if (lab[0] <= ceiling) return lab;
  const boost = 1 + (lab[0] - ceiling) * 1.6;
  return [ceiling, lab[1] * boost, lab[2] * boost];
}

function chroma(value: string) {
  const lab = toOklab(parseColor(value) ?? [1, 1, 1]);
  return Math.hypot(lab[1], lab[2]);
}

function hash(a: number, b: number, c: number) {
  let h =
    (Math.imul(a, 374761393) +
      Math.imul(b, 668265263) +
      Math.imul(c, 1274126177)) |
    0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

/** Furthest distance a dot can be pushed by the lens. */
export function lensReach(radius: number, strength: number, twist: number) {
  let peak = 0;
  for (let index = 1; index < 48; index++) {
    const x = index / 48;
    const w = (1 - x * x) ** 3;
    const sigma = x * radius;
    const grow = 1 + strength * w;
    const theta = twist * w;
    peak = Math.max(
      peak,
      Math.hypot(
        sigma * (grow * Math.cos(theta) - 1),
        sigma * grow * Math.sin(theta),
      ),
    );
  }
  return peak;
}

/** Packs dots as [x, y, seedA, seedB] per instance. */
export function buildDots(
  width: number,
  height: number,
  step: number,
  pattern: number,
  margin: number,
) {
  const cx = width / 2;
  const cy = height / 2;
  const minX = -margin;
  const maxX = width + margin;
  const minY = -margin;
  const maxY = height + margin;
  const out: number[] = [];
  const push = (x: number, y: number, a: number, b: number) => {
    if (x >= minX && x <= maxX && y >= minY && y <= maxY) out.push(x, y, a, b);
  };
  if (pattern === PATTERNS.spiral) {
    const spacing = step / Math.sqrt(Math.PI);
    const reach = Math.hypot(width / 2 + margin, height / 2 + margin);
    const count = Math.ceil((reach / spacing) ** 2);
    for (let index = 0; index < count; index++) {
      const r = spacing * Math.sqrt(index + 0.5);
      const angle = index * GOLDEN_ANGLE;
      push(
        cx + r * Math.cos(angle),
        cy + r * Math.sin(angle),
        hash(index, 0, 3),
        hash(index, 0, 4),
      );
    }
  } else {
    const rowStep = pattern === PATTERNS.hex ? (step * Math.sqrt(3)) / 2 : step;
    const cols = Math.ceil((width / 2 + margin) / step) + 1;
    const rows = Math.ceil((height / 2 + margin) / rowStep) + 1;
    for (let row = -rows; row <= rows; row++) {
      for (let col = -cols; col <= cols; col++) {
        let x =
          cx +
          col * step +
          (pattern === PATTERNS.hex && row & 1 ? step / 2 : 0);
        let y = cy + row * rowStep;
        if (pattern === PATTERNS.scatter) {
          x += (hash(col, row, 1) - 0.5) * step * 0.8;
          y += (hash(col, row, 2) - 0.5) * step * 0.8;
        }
        push(x, y, hash(col, row, 3), hash(col, row, 4));
      }
    }
  }
  return new Float32Array(out);
}

/** Clamps and converts the public props into what the shaders read. */
export function toSettings(
  props: Required<Omit<DotFieldProps, 'class'>>,
): DotFieldSettings {
  const radius = clamp(props.dotRadius, 0.25, 12);
  const step = radius * 2 + clamp(props.dotSpacing, 1, 200);
  const angle = (props.gradientAngle * Math.PI) / 180;
  const light = props.lightMode;
  return {
    radius,
    step,
    pattern: PATTERNS[props.pattern] ?? PATTERNS.grid,
    from: toInk(props.gradientFrom, [0.32, 0.15, 1], light),
    to: toInk(props.gradientTo, [1, 0.62, 0.99], light),
    glowColor: toInk(props.glowColor, [1, 1, 1], light),
    glowWeight: light
      ? clamp((chroma(props.glowColor) - 0.02) / 0.06, 0, 1)
      : 1,
    direction: [Math.sin(angle), -Math.cos(angle)],
    lensRadius: clamp(props.cursorRadius, 20, 2000),
    strength: clamp(props.bulgeStrength, -1, 1),
    twist: (clamp(props.twist, -360, 360) * Math.PI) / 180,
    glowRadius: Math.max(0, props.glowRadius),
    glowIntensity: clamp(props.glowIntensity, 0, 2),
    base: clamp(props.baseOpacity, 0, 1),
    wave: clamp(props.waveAmplitude, 0, 60),
    sparkle: props.sparkle ? 1 : 0,
    speed: Math.max(0, props.speed),
    interactive: props.interactive,
    holdToZoom: props.holdToZoom,
    intro: props.intro,
    light,
    opacity: clamp(props.opacity, 0, 1),
    maxRatio: clamp(props.maxDevicePixelRatio, 0.5, 3),
  };
}
