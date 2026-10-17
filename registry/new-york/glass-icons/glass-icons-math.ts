import type {
  GlassIconsGradient,
  GlassIconsHover,
  GlassIconsLabels,
  GlassIconsMaps,
  GlassIconsMotion,
  GlassIconsPlate,
  GlassIconsPose,
  GlassIconsSettings,
  GlassIconsStop,
  GlassIconsTheme,
} from './types';

export const GLASS_ICONS_GRADIENTS: Record<string, string> = {
  blue: 'linear-gradient(135deg, hsl(214, 95%, 66%), hsl(226, 80%, 50%))',
  purple: 'linear-gradient(135deg, hsl(276, 84%, 70%), hsl(262, 66%, 52%))',
  red: 'linear-gradient(135deg, hsl(354, 95%, 68%), hsl(342, 80%, 52%))',
  indigo: 'linear-gradient(135deg, hsl(236, 90%, 72%), hsl(246, 64%, 54%))',
  orange: 'linear-gradient(135deg, hsl(38, 100%, 62%), hsl(20, 94%, 54%))',
  green: 'linear-gradient(135deg, hsl(146, 66%, 54%), hsl(162, 82%, 34%))',
  teal: 'linear-gradient(135deg, hsl(184, 80%, 56%), hsl(196, 84%, 40%))',
  pink: 'linear-gradient(135deg, hsl(326, 92%, 74%), hsl(314, 70%, 54%))',
  graphite: 'linear-gradient(135deg, hsl(250, 6%, 46%), hsl(250, 8%, 22%))',
  silver: 'linear-gradient(135deg, hsl(240, 6%, 92%), hsl(240, 5%, 70%))',
};

export const GLASS_ICONS_THEMES: Record<
  GlassIconsTheme,
  Record<string, string>
> = {
  dark: {
    '--glass-icons-label': 'rgba(244, 244, 245, 0.86)',
    '--glass-icons-edge': 'rgba(255, 255, 255, 0.16)',
    '--glass-icons-fallback': 'rgba(255, 255, 255, 0.1)',
    '--glass-icons-drop': 'rgba(0, 0, 0, 0.45)',
    '--glass-icons-shade': '0.35',
  },
  light: {
    '--glass-icons-label': 'rgba(24, 24, 27, 0.78)',
    '--glass-icons-edge': 'rgba(24, 24, 27, 0.08)',
    '--glass-icons-fallback': 'rgba(255, 255, 255, 0.32)',
    '--glass-icons-drop': 'rgba(24, 24, 27, 0.28)',
    '--glass-icons-shade': '0.22',
  },
};

export const GLASS_ICONS_PLATES: readonly GlassIconsPlate[] = [
  'tilt',
  'offset',
  'circle',
  'none',
];
export const GLASS_ICONS_HOVERS: readonly GlassIconsHover[] = [
  'lift',
  'float',
  'press',
  'none',
];
export const GLASS_ICONS_LABELS: readonly GlassIconsLabels[] = [
  'hover',
  'always',
  'none',
];
export const GLASS_ICONS_PLATE_CODES: Record<GlassIconsPlate, number> = {
  none: 0,
  tilt: 1,
  offset: 2,
  circle: 3,
};
export const GLASS_ICONS_STAGGER = 0.07;

const SIDES: Record<string, number> = {
  top: 0,
  right: 90,
  bottom: 180,
  left: 270,
};
const MAPS = new Map<string, GlassIconsMaps>();

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function ease(t: number): number {
  return 1 - Math.pow(1 - clamp(t, 0, 1), 3);
}

function fade(from: number, to: number, t: number): number {
  const x = clamp((t - from) / (to - from), 0, 1);
  return x * x * (3 - 2 * x);
}

/** Semi-implicit Euler spring step. Returns [value, velocity]. */
export function drive(
  value: number,
  velocity: number,
  target: number,
  stiffness: number,
  damping: number,
  dt: number,
): [number, number] {
  const next =
    velocity + (stiffness * (target - value) - damping * velocity) * dt;
  return [value + next * dt, next];
}

export function isDarkColor(color: string): boolean {
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color.trim())?.[1];
  if (!hex) return false;
  const full = hex.length === 3 ? [...hex].map((c) => c + c).join('') : hex;
  const [r = 0, g = 0, b = 0] = [0, 2, 4].map(
    (i) => Number.parseInt(full.slice(i, i + 2), 16) / 255,
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 0.5;
}

function splitTopLevel(text: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '(') depth++;
    else if (text[i] === ')') depth--;
    else if (text[i] === ',' && depth === 0) {
      parts.push(text.slice(start, i).trim());
      start = i + 1;
    }
  }
  parts.push(text.slice(start).trim());
  return parts;
}

export function parseGradient(value: string): GlassIconsGradient {
  const text = value.trim();
  const match = /^linear-gradient\((.*)\)$/is.exec(text);
  if (!match?.[1]) {
    return {
      angle: 180,
      stops: [
        [0, text],
        [1, text],
      ],
    };
  }
  const parts = splitTopLevel(match[1]);
  const head = (parts[0] ?? '').toLowerCase();
  let angle = 180;
  if (/^-?[\d.]+(?:deg|turn|rad|grad)$/.test(head)) {
    const number = Number.parseFloat(head);
    if (head.endsWith('turn')) angle = number * 360;
    else if (head.endsWith('grad')) angle = number * 0.9;
    else if (head.endsWith('rad')) angle = (number * 180) / Math.PI;
    else angle = number;
    parts.shift();
  } else if (head.startsWith('to ')) {
    const sides = head.slice(3).split(/\s+/);
    const vertical = sides.includes('top')
      ? -1
      : sides.includes('bottom')
        ? 1
        : 0;
    const horizontal = sides.includes('left')
      ? -1
      : sides.includes('right')
        ? 1
        : 0;
    angle =
      sides.length === 1
        ? (SIDES[sides[0] ?? ''] ?? 180)
        : (Math.atan2(horizontal, -vertical) * 180) / Math.PI;
    parts.shift();
  }
  const raw: Array<[number | null, string]> = parts.map((part) => {
    const stop = /\s(-?[\d.]+)%$/.exec(part);
    const color = stop ? part.slice(0, stop.index).trim() : '';
    return stop?.[1] && color ? [Number(stop[1]) / 100, color] : [null, part];
  });
  if (!raw.length) raw.push([0, '#ffffff']);
  const first = raw[0]!;
  const last = raw[raw.length - 1]!;
  if (first[0] === null) first[0] = 0;
  if (last[0] === null) last[0] = 1;
  for (let i = 1; i < raw.length - 1; i++) {
    if (raw[i]![0] !== null) continue;
    let next = i + 1;
    while (raw[next]![0] === null) next++;
    const from = raw[i - 1]![0] ?? 0;
    raw[i]![0] = from + ((raw[next]![0] ?? 1) - from) / (next - i + 1);
  }
  const stops: GlassIconsStop[] = raw.map(([at, color]) => [at ?? 0, color]);
  return { angle, stops };
}

/** Bakes the bevel refraction, shine and shade maps used by the CSS fallback and SVG filter. */
export function buildMaps(
  size: number,
  radius: number,
  bevel: number,
): GlassIconsMaps | null {
  const key = `${size}:${radius}:${bevel}`;
  const cached = MAPS.get(key);
  if (cached) return cached;
  const res = 2;
  const w = Math.max(8, Math.round(size * res));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = w;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const refraction = ctx.createImageData(w, w);
  const shine = ctx.createImageData(w, w);
  const shade = ctx.createImageData(w, w);
  const r = Math.min(radius * res, w / 2);
  const band = Math.max(1, bevel * res);
  const half = w / 2;
  const lx = -0.55;
  const ly = -0.83;
  for (let y = 0; y < w; y++) {
    for (let x = 0; x < w; x++) {
      const px = x + 0.5 - half;
      const py = y + 0.5 - half;
      const qx = Math.abs(px) - (half - r);
      const qy = Math.abs(py) - (half - r);
      const ox = Math.max(qx, 0);
      const oy = Math.max(qy, 0);
      const distance = Math.hypot(ox, oy) + Math.min(Math.max(qx, qy), 0) - r;
      let nx = 0;
      let ny = 0;
      if (qx > 0 && qy > 0) {
        const length = Math.hypot(ox, oy) || 1;
        nx = (ox / length) * Math.sign(px);
        ny = (oy / length) * Math.sign(py);
      } else if (qx > qy) {
        nx = Math.sign(px);
      } else {
        ny = Math.sign(py);
      }
      const inside = -distance;
      const t = inside >= band ? 0 : inside <= 0 ? 1 : 1 - inside / band;
      const slope = Math.pow(t, 2.2);
      const i = (y * w + x) * 4;
      refraction.data[i] = Math.round(128 + 127 * nx * slope);
      refraction.data[i + 1] = Math.round(128 + 127 * ny * slope);
      refraction.data[i + 2] = 128;
      refraction.data[i + 3] = 255;
      const facing = nx * lx + ny * ly;
      const edge = inside <= 0 ? 0 : Math.min(1, inside / (1.2 * res));
      const glow =
        (Math.max(0, facing) * 0.95 + Math.max(0, -facing) * 0.35) *
        t *
        t *
        t *
        edge;
      shine.data[i] = 255;
      shine.data[i + 1] = 255;
      shine.data[i + 2] = 255;
      shine.data[i + 3] = Math.round(255 * Math.min(1, glow));
      const dim = (Math.max(0, -facing) * 0.75 + 0.25) * t * t * edge;
      shade.data[i + 3] = Math.round(255 * Math.min(1, dim));
    }
  }
  ctx.putImageData(refraction, 0, 0);
  const refractionUrl = canvas.toDataURL();
  ctx.putImageData(shine, 0, 0);
  const shineUrl = canvas.toDataURL();
  ctx.putImageData(shade, 0, 0);
  const shadeUrl = canvas.toDataURL();
  const maps = { refractionUrl, shineUrl, shadeUrl };
  MAPS.set(key, maps);
  return maps;
}

/** SVG-filter backdrops only render in Chromium. Call from onMounted. */
export function supportsLiquid(): boolean {
  const agent = navigator.userAgent;
  const safari = /Safari/.test(agent) && !/Chrome|Chromium|Edg/.test(agent);
  if (safari || /Firefox/.test(agent)) return false;
  return window.CSS?.supports?.('backdrop-filter', 'url(#a)') ?? false;
}

export function createMotion(start: number): GlassIconsMotion {
  return {
    h: 0,
    hv: 0,
    ht: 0,
    p: 0,
    pv: 0,
    pt: 0,
    x: 0,
    xv: 0,
    xt: 0,
    y: 0,
    yv: 0,
    yt: 0,
    e: start,
    ev: 0,
    et: start,
    at: 0,
  };
}

export function poseOf(
  state: GlassIconsMotion,
  s: GlassIconsSettings,
): GlassIconsPose {
  const size = s.tile;
  const enter = clamp(state.e, 0, 1);
  const swing = ease((enter - 0.18) / 0.82);
  const hover = state.h;
  const lift = s.hover === 'lift' ? hover : 0;
  const clear = s.plate === 'none';
  let liftY = 0;
  let glassScale = 1;
  if (!clear && s.hover === 'lift') liftY = -0.08 * size * hover;
  if (!clear && s.hover === 'float') liftY = -0.14 * size * hover;
  if (s.hover === 'press') {
    liftY = clear ? 0 : -0.03 * size * hover;
    glassScale = 1 - 0.08 * state.p;
  }
  const settle = clear ? 1 : 0.92 + 0.08 * ease(enter);
  const glyphRise = (1 - ease((enter - 0.25) / 0.75)) * 0.1 * size;
  const shift: [number, number] = [
    -state.x * s.parallax * 0.07 * size,
    -state.y * s.parallax * 0.07 * size,
  ];
  let angle = 0;
  let offset: [number, number] = [0, 0];
  let grow = 1;
  if (s.plate === 'tilt') {
    angle = (s.tilt + 10 * lift) * swing;
    offset = [-0.08 * size * lift, -0.08 * size * lift];
  } else if (s.plate === 'offset') {
    const reach = s.spread * (0.26 + 0.08 * lift) * size * swing;
    offset = [reach, -reach];
  } else if (s.plate === 'circle') {
    const reach =
      (s.spread * (0.24 + 0.06 * lift) + 0.06 * lift) * size * swing;
    offset = [reach, -reach];
    grow = 1 + 0.08 * lift;
  }
  const lightX = -0.55 + state.x * 0.35;
  const lightY = -0.83 + state.y * 0.35;
  const length = Math.hypot(lightX, lightY) || 1;
  return {
    liftY,
    glassScale: clear ? 1 : glassScale * settle,
    domScale: clear ? 1 : glassScale * settle,
    glassAlpha: fade(0, 0.55, enter),
    plateAlpha: fade(0, 0.35, enter),
    faceY: (clear ? -0.05 * size * hover : liftY) + glyphRise,
    faceScale: glassScale,
    faceAlpha: fade(0.3, 0.85, enter),
    plateScale: (s.hover === 'press' ? 1 - 0.08 * state.p : 1) * grow,
    shift,
    angle,
    offset,
    bend: 1 + 1.2 * (1 - ease(enter)),
    glow: 1 + (clear ? 0.6 : 0.25) * hover,
    light: [lightX / length, lightY / length],
  };
}
