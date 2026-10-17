export const TAU = Math.PI * 2;
const DARK_INK = 'rgba(18, 15, 23, 0.86)';
const LIGHT_INK = 'rgba(255, 255, 255, 0.94)';

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const decimalsOf = (step: number) => {
  const text = String(step);
  return text.includes('.') ? (text.split('.')[1]?.length ?? 0) : 0;
};

/** Sigmoid rubber band: approaches `limit` as `distance` grows. */
export const rubber = (distance: number, limit: number) =>
  limit > 0 ? 2 * (1 / (1 + Math.exp(-distance / limit)) - 0.5) * limit : 0;

let probe: CanvasRenderingContext2D | null = null;

/** Parses any CSS color into `[r, g, b, a]` (a in 0–1). */
export function readColor(
  text: string,
): [number, number, number, number] | null {
  const match =
    /^rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)$/.exec(text);
  if (match) {
    return [
      Number(match[1]),
      Number(match[2]),
      Number(match[3]),
      match[4] === undefined ? 1 : Number(match[4]),
    ];
  }
  if (typeof document === 'undefined') return null;
  if (!probe) {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    probe = canvas.getContext('2d', { willReadFrequently: true });
  }
  if (!probe) return null;
  probe.clearRect(0, 0, 1, 1);
  probe.fillStyle = '#000000';
  probe.fillStyle = text;
  probe.fillRect(0, 0, 1, 1);
  const [r = 0, g = 0, b = 0, a = 0] = probe.getImageData(0, 0, 1, 1).data;
  return [r, g, b, a / 255];
}

/** Ink colour that reads on top of a fill colour. */
export function inkFor(color: [number, number, number, number] | null) {
  if (!color || color[3] < 0.5) return 'var(--elastic-slider-content)';
  const luma =
    (0.2126 * color[0] + 0.7152 * color[1] + 0.0722 * color[2]) / 255;
  return luma > 0.55 ? DARK_INK : LIGHT_INK;
}
