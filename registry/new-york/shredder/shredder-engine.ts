import type { ShredderStrip, ShredderTexture } from './types';

export const FOLLOW = 30;
export const SETTLE = 16;
export const TUG = 2.4;
export const TUG_DECAY = 0.14;
export const SLIT = 6;
export const OVER = 40;
const SLIVER = 2;
export const STACK_K = 320;
export const STACK_C = 22;
export const STAGGER = 0.035;
export const ENTER = 22;
export const HYSTERESIS = 8;
export const DEG = Math.PI / 180;

export function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

export function ease(
  from: number,
  to: number,
  dt: number,
  tau: number,
): number {
  return from + (to - from) * (1 - Math.exp(-dt / tau));
}

export function smooth(t: number): number {
  const u = clamp(t, 0, 1);
  return u * u * (3 - 2 * u);
}

export function pick(lo: number, hi: number): number {
  return lo + Math.random() * (hi - lo);
}

export function side(): number {
  return Math.random() < 0.5 ? -1 : 1;
}

/** Critically damped spring step. Returns [position, velocity]. */
export function spring(
  p: number,
  v: number,
  target: number,
  dt: number,
  omega: number,
): [number, number] {
  const offset = p - target;
  const term = v + omega * offset;
  const decay = Math.exp(-omega * dt);
  return [
    target + (offset + term * dt) * decay,
    (v - omega * term * dt) * decay,
  ];
}

const urls = new Map<string, Promise<string>>();

function readBlob(blob: Blob): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('read'));
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/** Inline a remote image as a data URL so the SVG snapshot can paint it. */
export function dataUrl(src: string): Promise<string> {
  if (!src || src.startsWith('data:')) return Promise.resolve(src);
  const hit = urls.get(src);
  if (hit) return hit;
  const job = fetch(src, { mode: 'cors' })
    .then((res) => res.blob())
    .then(readBlob);
  urls.set(src, job);
  job.catch(() => urls.delete(src));
  return job;
}

function loadTexture(
  svg: string,
  W: number,
  H: number,
  scale: number,
): Promise<ShredderTexture> {
  return new Promise<ShredderTexture>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const tex = document.createElement('canvas');
      tex.width = Math.ceil(W * scale);
      tex.height = Math.ceil(H * scale);
      const ctx = tex.getContext('2d');
      if (!ctx) {
        reject(new Error('snapshot'));
        return;
      }
      ctx.drawImage(img, 0, 0, tex.width, tex.height);
      resolve({ tex, scale });
    };
    img.onerror = () => reject(new Error('snapshot'));
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  });
}

/** Rasterise a DOM node (computed styles inlined) through an SVG foreignObject. */
export async function snapshot(
  node: HTMLElement,
  W: number,
  H: number,
): Promise<ShredderTexture> {
  const clone = node.cloneNode(true);
  if (!(clone instanceof HTMLElement)) throw new Error('snapshot');
  const src: Element[] = [node, ...node.querySelectorAll('*')];
  const dst: Element[] = [clone, ...clone.querySelectorAll('*')];
  const images: [HTMLImageElement, string][] = [];
  for (let i = 0; i < src.length; i += 1) {
    const from = src[i];
    const to = dst[i];
    if (!(from instanceof HTMLElement) || !(to instanceof HTMLElement))
      continue;
    const cs = getComputedStyle(from);
    for (let j = 0; j < cs.length; j += 1) {
      const name = cs.item(j);
      to.style.setProperty(name, cs.getPropertyValue(name));
    }
    if (to instanceof HTMLImageElement && from instanceof HTMLImageElement)
      images.push([to, from.currentSrc || from.src]);
  }
  Object.assign(clone.style, {
    position: 'relative',
    inset: 'auto',
    margin: '0',
    transform: 'none',
    filter: 'none',
    outline: 'none',
    transition: 'none',
    width: `${W}px`,
    height: `${H}px`,
  });
  clone.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
  const scale = Math.min(3, window.devicePixelRatio || 1);
  await Promise.all(
    images.map(async ([img, from]) => {
      img.removeAttribute('srcset');
      img.removeAttribute('loading');
      try {
        img.setAttribute('src', await dataUrl(from));
      } catch {
        img.removeAttribute('src');
        img.style.background = 'rgba(127, 127, 127, 0.25)';
      }
    }),
  );
  const markup = new XMLSerializer().serializeToString(clone);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><foreignObject width="${W}" height="${H}">${markup}</foreignObject></svg>`;
  return loadTexture(svg, W, H, scale);
}

/** Plain fallback texture when the snapshot fails or is slow. */
export function flat(W: number, H: number, fill: string): ShredderTexture {
  const tex = document.createElement('canvas');
  tex.width = Math.max(1, W);
  tex.height = Math.max(1, H);
  const ctx = tex.getContext('2d');
  if (ctx) {
    ctx.fillStyle = fill;
    ctx.fillRect(0, 0, W, H);
  }
  return { tex, scale: 1 };
}

/** Walk a strip as a chain of slivers, writing [x, y, angle] triples. */
export function shape(
  st: ShredderStrip,
  len: number,
  time: number,
  tear: number,
): void {
  const pts = st.pts;
  pts.length = 0;
  let x = st.ax;
  let y = st.ay;
  const steps = Math.ceil(len / SLIVER);
  const swing = (3 + 9 * st.rA) * tear;
  const pace = time * (1.6 + st.rA * 2.2) + st.rA * 6.2832;
  for (let j = 0; j <= steps; j += 1) {
    const d = Math.min(j * SLIVER, len);
    const a = st.th + st.curl * d + st.amp * Math.sin(d * st.freq + st.wave);
    const flutter = swing * Math.sin(d * 0.045 + pace);
    pts.push(x + flutter * Math.cos(a), y - flutter * Math.sin(a), a);
    const h = Math.min(SLIVER, len - d);
    x += Math.sin(a) * h;
    y += Math.cos(a) * h;
  }
}

export function middle(pts: number[]): number {
  let y = 0;
  for (let j = 1; j < pts.length; j += 3) y += pts[j]!;
  return pts.length ? (y * 3) / pts.length : 0;
}

export function paintStrip(
  ctx: CanvasRenderingContext2D,
  st: ShredderStrip,
  len: number,
  dpr: number,
): void {
  const { tex, ts } = st.feed;
  if (!tex) return;
  const pts = st.pts;
  const wc = st.w * st.core;
  const half = wc / 2;
  const sx = (st.x + (st.w - wc) / 2) * ts;
  const v0 = st.H - len;
  ctx.globalAlpha = st.alpha;
  for (let j = 0; j + 3 < pts.length; j += 3) {
    const d = (j / 3) * SLIVER;
    const h = Math.min(SLIVER, len - d);
    if (h <= 0) break;
    const a = pts[j + 2]!;
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    ctx.setTransform(
      dpr * ca,
      -dpr * sa,
      dpr * sa,
      dpr * ca,
      dpr * (pts[j]! + OVER),
      dpr * pts[j + 1]!,
    );
    ctx.drawImage(
      tex,
      sx,
      (v0 + d) * ts,
      wc * ts,
      h * ts,
      -half,
      0,
      wc,
      h + 0.4,
    );
  }
  ctx.globalAlpha = 1;
}
