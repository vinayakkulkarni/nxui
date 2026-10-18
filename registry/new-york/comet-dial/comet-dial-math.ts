/** Ring radius in the 200×200 viewBox. */
const RING_R = 80;

export function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

export function velocityOf(hist: Array<[number, number]>): number {
  const a = hist[0];
  const b = hist[hist.length - 1];
  if (!a || !b || hist.length < 2) return 0;
  return ((b[1] - a[1]) / Math.max(1, b[0] - a[0])) * 1000;
}

export function decimalsOf(step: number): number {
  const s = String(step);
  const i = s.indexOf('.');
  return i === -1 ? 0 : s.length - i - 1;
}

export function pointAt(deg: number): [number, number] {
  const a = (deg * Math.PI) / 180;
  return [100 + Math.cos(a) * RING_R, 100 + Math.sin(a) * RING_R];
}

export function arcPath(a0: number, a1: number): string {
  const [x0, y0] = pointAt(a0);
  const [x1, y1] = pointAt(a1);
  return `M ${x0.toFixed(3)} ${y0.toFixed(3)} A ${RING_R} ${RING_R} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1.toFixed(3)} ${y1.toFixed(3)}`;
}
