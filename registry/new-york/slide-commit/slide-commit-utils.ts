export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Black or white, whichever reads better on the given hex colour. */
export function onColor(hex: string): string {
  const raw = hex.replace('#', '');
  const full =
    raw.length === 3 ? [...raw].map((ch) => ch + ch).join('') : raw.slice(0, 6);
  const n = Number.parseInt(full, 16);
  if (Number.isNaN(n)) return '#ffffff';
  const yiq =
    (((n >> 16) & 255) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000;
  return yiq >= 128 ? '#111111' : '#ffffff';
}

export function velocityOf(hist: Array<[number, number]>): number {
  const a = hist[0];
  const b = hist[hist.length - 1];
  if (!a || !b || hist.length < 2) return 0;
  return ((b[1] - a[1]) / Math.max(1, b[0] - a[0])) * 1000;
}

export function isThenable(value: unknown): value is PromiseLike<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'then' in value &&
    typeof value.then === 'function'
  );
}
