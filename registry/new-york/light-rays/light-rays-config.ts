import type {
  LightRaysOriginSpec,
  LightRaysProps,
  LightRaysSettings,
  LightRaysVec3,
  RaysOrigin,
} from './types';

export const PIXEL_BUDGET = 2.4e6;
export const MAX_PULSES = 4;

const ORIGINS: Record<RaysOrigin, LightRaysOriginSpec> = {
  'top-left': { anchor: [0, -0.2], dir: [0, 1] },
  'top-center': { anchor: [0.5, -0.2], dir: [0, 1] },
  'top-right': { anchor: [1, -0.2], dir: [0, 1] },
  left: { anchor: [-0.2, 0.5], dir: [1, 0] },
  right: { anchor: [1.2, 0.5], dir: [-1, 0] },
  'bottom-left': { anchor: [0, 1.2], dir: [0, -1] },
  'bottom-center': { anchor: [0.5, 1.2], dir: [0, -1] },
  'bottom-right': { anchor: [1, 1.2], dir: [0, -1] },
};

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

function parseColor(value: string | undefined): LightRaysVec3 | null {
  const text = String(value || '').trim();
  const hex = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(text);
  if (hex?.[1]) {
    const digits = hex[1];
    const full =
      digits.length === 3 ? digits.replace(/./g, (d) => d + d) : digits;
    return [
      Number.parseInt(full.slice(0, 2), 16) / 255,
      Number.parseInt(full.slice(2, 4), 16) / 255,
      Number.parseInt(full.slice(4, 6), 16) / 255,
    ];
  }
  const rgb = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i.exec(text);
  if (rgb) {
    const channel = (part: string | undefined) =>
      clamp(Number.parseFloat(part ?? '0') / 255, 0, 1);
    return [channel(rgb[1]), channel(rgb[2]), channel(rgb[3])];
  }
  return null;
}

export const smoother = (t: number) => {
  const x = clamp(t, 0, 1);
  return x * x * x * (x * (x * 6 - 15) + 10);
};

export function resolveSettings(props: LightRaysProps): LightRaysSettings {
  return {
    origin: ORIGINS[props.raysOrigin ?? 'top-center'] ?? ORIGINS['top-center'],
    color: parseColor(props.raysColor ?? '#ffffff') ?? [1, 1, 1],
    speed: Math.max(0, props.raysSpeed ?? 1),
    spread: Math.max(0.001, props.lightSpread ?? 0.5),
    length: Math.max(0.01, props.rayLength ?? 3),
    density: clamp(props.rayDensity ?? 1, 0.1, 6),
    tilt: (clamp(props.tilt ?? 0, -90, 90) * Math.PI) / 180,
    sharpness: clamp(props.raySharpness ?? 0.35, 0, 1),
    glow: Math.max(0, props.glow ?? 0.6),
    haze: clamp(props.haze ?? 0.25, 0, 1),
    atmosphere: clamp(props.atmosphere ?? 1, 0, 1),
    intensity: Math.max(0, props.intensity ?? 1),
    pulsating: props.pulsating ?? false,
    fade: Math.max(0.01, props.fadeDistance ?? 1),
    saturation: Math.max(0, props.saturation ?? 1),
    follow: props.followMouse ?? true,
    influence: clamp(props.mouseInfluence ?? 0.1, 0, 1),
    cursorShadow: props.cursorShadow ?? true,
    clickPulse: props.clickPulse ?? true,
    noise: clamp(props.noiseAmount ?? 0, 0, 1),
    distortion: props.distortion ?? 0,
    intro: props.intro ?? true,
    light: props.lightMode ?? false,
    opacity: clamp(props.opacity ?? 1, 0, 1),
    maxRatio: clamp(props.maxDevicePixelRatio ?? 2, 0.5, 3),
  };
}
