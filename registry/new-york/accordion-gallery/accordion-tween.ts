import type { AccordionGalleryItem, AccordionTweenTrack } from './types';

export const ACCORDION_GALLERY_DEFAULT_ITEMS: AccordionGalleryItem[] = [
  {
    image: 'https://picsum.photos/id/1015/900/1200',
    label: 'Canyon',
    link: '#',
  },
  {
    image: 'https://picsum.photos/id/1018/900/1200',
    label: 'Ridgeline',
    link: '#',
  },
  {
    image: 'https://picsum.photos/id/1039/900/1200',
    label: 'Falls',
    link: '#',
  },
  {
    image: 'https://picsum.photos/id/1043/900/1200',
    label: 'Harbour',
    link: '#',
  },
  {
    image: 'https://picsum.photos/id/1044/900/1200',
    label: 'Skyline',
    link: '#',
  },
];

type Curve = (t: number) => number;

const powerOut =
  (p: number): Curve =>
  (t) =>
    1 - (1 - t) ** p;
const powerIn =
  (p: number): Curve =>
  (t) =>
    t ** p;
const powerInOut =
  (p: number): Curve =>
  (t) =>
    t < 0.5 ? 2 ** (p - 1) * t ** p : 1 - (-2 * t + 2) ** p / 2;

const BACK = 1.70158;

const CURVES: Record<string, Curve> = {
  none: (t) => t,
  linear: (t) => t,
  'sine.in': (t) => 1 - Math.cos((t * Math.PI) / 2),
  'sine.out': (t) => Math.sin((t * Math.PI) / 2),
  'sine.inOut': (t) => -(Math.cos(Math.PI * t) - 1) / 2,
  'expo.in': (t) => (t === 0 ? 0 : 2 ** (10 * t - 10)),
  'expo.out': (t) => (t === 1 ? 1 : 1 - 2 ** (-10 * t)),
  'expo.inOut': (t) =>
    t === 0 || t === 1
      ? t
      : t < 0.5
        ? 2 ** (20 * t - 10) / 2
        : (2 - 2 ** (-20 * t + 10)) / 2,
  'circ.out': (t) => Math.sqrt(1 - (t - 1) ** 2),
  'back.out': (t) => 1 + (BACK + 1) * (t - 1) ** 3 + BACK * (t - 1) ** 2,
};

for (let p = 1; p <= 4; p++) {
  CURVES[`power${p}.out`] = powerOut(p + 1);
  CURVES[`power${p}.in`] = powerIn(p + 1);
  CURVES[`power${p}.inOut`] = powerInOut(p + 1);
  CURVES[`power${p}`] = powerOut(p + 1);
}

/** Resolves a GSAP-style ease name ("power3.out", "expo.inOut", "none") to a curve. */
export function resolveEase(name: string): Curve {
  const key = name.replace(/\(.*\)$/, '');
  return CURVES[key] ?? CURVES['power3.out'] ?? powerOut(4);
}

/** Runs a set of numeric tracks on one rAF loop. Returns a cancel function. */
export function runTracks(
  tracks: AccordionTweenTrack[],
  ease: Curve,
): () => void {
  let frame = 0;
  let start = -1;
  const finishAll = () => {
    for (const track of tracks) track.apply(track.to);
  };
  const instant = tracks.every((t) => t.duration <= 0 && t.delay <= 0);
  if (instant) {
    finishAll();
    return () => {};
  }
  const step = (now: number) => {
    if (start < 0) start = now;
    const elapsed = (now - start) / 1000;
    let running = false;
    for (const track of tracks) {
      const local = elapsed - track.delay;
      if (local < 0) {
        running = true;
        continue;
      }
      const t = track.duration <= 0 ? 1 : Math.min(local / track.duration, 1);
      if (t < 1) running = true;
      track.apply(track.from + (track.to - track.from) * ease(t));
    }
    if (running) frame = requestAnimationFrame(step);
  };
  frame = requestAnimationFrame(step);
  return () => cancelAnimationFrame(frame);
}
