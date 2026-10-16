import type {
  CircularCarouselAxis,
  CircularCarouselFace,
  CircularCarouselIntro,
  CircularCarouselItem,
  CircularCarouselLayout,
  CircularCarouselPreset,
  CircularCarouselSettings,
  CircularCarouselTile,
  CircularCarouselVec3,
} from './types';

const photo = (id: string) =>
  `https://images.unsplash.com/${id}?w=900&q=80&auto=format&fit=max&sat=-100`;

export const DEFAULT_ITEMS: CircularCarouselItem[] = [
  {
    src: photo('photo-1506744038136-46273834b3fb'),
    alt: 'Mist drifting through a mountain valley',
    title: 'Valley',
    subtitle: 'Landscape',
  },
  {
    src: photo('photo-1524504388940-b1c1722653e1'),
    alt: 'A woman with long hair in soft studio light',
    title: 'Portrait',
    subtitle: 'Studio',
  },
  {
    src: photo('photo-1486406146926-c627a92ad1ab'),
    alt: 'Glass towers seen from street level',
    title: 'Towers',
    subtitle: 'Architecture',
  },
  {
    src: photo('photo-1502680390469-be75c86b636f'),
    alt: 'A surfer carving inside a breaking wave',
    title: 'Swell',
    subtitle: 'Ocean',
  },
  {
    src: photo('photo-1487958449943-2429e8be8625'),
    alt: 'An angular white building against the sky',
    title: 'Facade',
    subtitle: 'Architecture',
  },
  {
    src: photo('photo-1509631179647-0177331693ae'),
    alt: 'A model in striped trousers leaning on a wall',
    title: 'Pose',
    subtitle: 'Editorial',
  },
  {
    src: photo('photo-1519681393784-d120267933ba'),
    alt: 'The Milky Way above snowy peaks',
    title: 'Night',
    subtitle: 'Sky',
  },
  {
    src: photo('photo-1485968579580-b6d095142e6e'),
    alt: 'A woman in a long coat on a city street',
    title: 'Street',
    subtitle: 'Editorial',
  },
  {
    src: photo('photo-1493246507139-91e8fad9978e'),
    alt: 'Mountains mirrored in a still lake',
    title: 'Mirror',
    subtitle: 'Landscape',
  },
  {
    src: photo('photo-1511818966892-d7d671e672a2'),
    alt: 'A glass skyscraper under a cloudy sky',
    title: 'Glass',
    subtitle: 'Architecture',
  },
];

export const PRESETS: Record<CircularCarouselPreset, CircularCarouselLayout> = {
  cylinder: {
    axis: 'y',
    tilt: -5,
    perspective: 2500,
    curve: 1,
    spread: 1,
    inward: false,
    billboard: false,
    backfaces: true,
    arc: 0,
  },
  orbit: {
    axis: 'y',
    tilt: -16,
    perspective: 1500,
    curve: 0,
    spread: 1.45,
    inward: false,
    billboard: true,
    backfaces: false,
    arc: 0,
  },
  wheel: {
    axis: 'x',
    tilt: 0,
    perspective: 1800,
    curve: 0,
    spread: 1,
    inward: false,
    billboard: false,
    backfaces: true,
    arc: 1.7,
  },
  panorama: {
    axis: 'y',
    tilt: 0,
    perspective: 0,
    curve: 1,
    spread: 1,
    inward: true,
    billboard: false,
    backfaces: false,
    arc: 0,
  },
};

export const INTRO_LENGTH: Record<CircularCarouselIntro, number> = {
  assemble: 1500,
  rise: 1400,
  spin: 1800,
  none: 0,
};
const TILES = 8;
const OVERLAP = 2.5;
export const DRAG_THRESHOLD = 5;
export const SPRING = 118;
export const SETTLE_SPEED = 9;
const CAPTION_SPACE = 76;
export const SWAP_LENGTH = 700;
export const SWAP_SPREAD = 420;
export const TO_RAD = Math.PI / 180;

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));
export const wrap = (degrees: number) =>
  ((((degrees + 180) % 360) + 360) % 360) - 180;
export const easeOut = (t: number) => 1 - Math.pow(1 - t, 4);
export const easeOutQuint = (t: number) => 1 - Math.pow(1 - t, 5);

function rotateX(
  p: CircularCarouselVec3,
  degrees: number,
): CircularCarouselVec3 {
  const r = degrees * TO_RAD;
  const c = Math.cos(r);
  const s = Math.sin(r);
  return [p[0], p[1] * c - p[2] * s, p[1] * s + p[2] * c];
}

function rotateY(
  p: CircularCarouselVec3,
  degrees: number,
): CircularCarouselVec3 {
  const r = degrees * TO_RAD;
  const c = Math.cos(r);
  const s = Math.sin(r);
  return [p[0] * c + p[2] * s, p[1], -p[0] * s + p[2] * c];
}

/** Ring radius that seats `count` cards of length `along` with `gap`. */
export function ringRadius(
  count: number,
  along: number,
  gap: number,
  spread: number,
  curve: number,
): number {
  const n = Math.max(count, 3);
  const pitch = (along + gap) * spread;
  const chord = pitch / (2 * Math.sin(Math.PI / n));
  const arc = (n * pitch) / (2 * Math.PI);
  return Math.max(chord + (arc - chord) * curve, along * 0.6);
}

/** Splits a card into strips that follow the ring's curvature. */
export function buildTiles(
  along: number,
  axis: CircularCarouselAxis,
  curve: number,
  inward: boolean,
  radius: number,
): CircularCarouselTile[] {
  const total = curve > 0.001 ? TILES : 1;
  const length = along / total;
  const bend = curve > 0.001 ? radius / curve : 0;
  return Array.from({ length: total }, (_, index) => {
    const start = index * length - (index > 0 ? OVERLAP / 2 : 0);
    const end = (index + 1) * length + (index < total - 1 ? OVERLAP / 2 : 0);
    const center = (start + end) / 2 - along / 2;
    const alpha = bend ? center / bend : 0;
    const shift = bend ? bend * Math.sin(alpha) : center;
    const sink = bend ? bend * (1 - Math.cos(alpha)) : 0;
    const depth = inward ? sink : -sink;
    const turn = ((inward ? -alpha : alpha) * 180) / Math.PI;
    const move =
      axis === 'x'
        ? `translate3d(0px, ${shift}px, ${depth}px) rotateX(${-turn}deg)`
        : `translate3d(${shift}px, 0px, ${depth}px) rotateY(${turn}deg)`;
    return { index, total, start, end, size: end - start, move };
  });
}

/** Precomputes the styles of every front (and optionally back) strip face. */
export function buildFaces(
  tiles: CircularCarouselTile[],
  backfaces: boolean,
  axis: CircularCarouselAxis,
  along: number,
  cardW: number,
  cardH: number,
): CircularCarouselFace[] {
  const r = 'var(--cc-radius)';
  const flip = axis === 'x' ? ' rotateX(180deg)' : ' rotateY(180deg)';
  const face = (tile: CircularCarouselTile, back: boolean) => {
    const strip = back ? tile.total - 1 - tile.index : tile.index;
    const first = strip === 0 ? r : '0';
    const last = strip === tile.total - 1 ? r : '0';
    const frameRadius =
      axis === 'x'
        ? `${first} ${first} ${last} ${last}`
        : `${first} ${last} ${last} ${first}`;
    const offset = back ? along - tile.end : tile.start;
    const size = tile.size;
    const box =
      axis === 'x'
        ? {
            left: `${-cardW / 2}px`,
            top: `${-size / 2}px`,
            width: `${cardW}px`,
            height: `${size}px`,
          }
        : {
            left: `${-size / 2}px`,
            top: `${-cardH / 2}px`,
            width: `${size}px`,
            height: `${cardH}px`,
          };
    return {
      key: `${back ? 'b' : 'f'}${tile.index}`,
      back,
      tileStyle: { ...box, transform: tile.move + (back ? flip : '') },
      frameStyle: {
        height: `${axis === 'x' ? size : cardH}px`,
        borderRadius: frameRadius,
      },
      photoStyle:
        axis === 'x'
          ? {
              left: '0px',
              top: `${-offset}px`,
              width: `${cardW}px`,
              height: `${cardH}px`,
            }
          : {
              left: `${-offset}px`,
              top: '0px',
              width: `${cardW}px`,
              height: `${cardH}px`,
            },
    };
  };
  const front = tiles.map((tile) => face(tile, false));
  return backfaces
    ? [...front, ...tiles.map((tile) => face(tile, true))]
    : front;
}

/** Projects the ring's silhouette and scales it to fit the container. */
export function fitRing(
  s: CircularCarouselSettings,
  rectWidth: number,
  rectHeight: number,
): { fit: number; shift: number; drop: number } {
  const room = s.captions ? CAPTION_SPACE : 0;
  const width = rectWidth * 0.94;
  const height = (rectHeight - room) * 0.92;
  const P = s.perspective;
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  if (s.layout.inward) {
    minX = -width / 2;
    maxX = width / 2;
    minY = -s.cardH / 2;
    maxY = s.cardH / 2;
  } else {
    const corners: [number, number][] = [
      [-s.cardW / 2, -s.cardH / 2],
      [s.cardW / 2, -s.cardH / 2],
      [-s.cardW / 2, s.cardH / 2],
      [s.cardW / 2, s.cardH / 2],
    ];
    const limit = s.layout.arc ? s.layout.arc * s.step : 180;
    for (let a = -limit; a <= limit; a += limit / 24) {
      for (const [cx, cy] of corners) {
        let p: CircularCarouselVec3;
        if (s.axis === 'x') {
          p = rotateY(rotateX([cx, cy, s.radius], -a), s.tilt);
        } else if (s.layout.billboard) {
          const c = rotateY([0, 0, s.radius], a);
          p = rotateX([c[0] + cx, cy, c[2]], s.tilt);
        } else {
          p = rotateX(rotateY([cx, cy, s.radius], a), s.tilt);
        }
        p = [p[0], p[1], p[2] - s.radius];
        if (p[2] >= P * 0.95) continue;
        const k = P / (P - p[2]);
        minX = Math.min(minX, p[0] * k);
        maxX = Math.max(maxX, p[0] * k);
        minY = Math.min(minY, p[1] * k);
        maxY = Math.max(maxY, p[1] * k);
      }
    }
  }
  const spanX = Math.max(maxX - minX, 1);
  const spanY = Math.max(maxY - minY, 1);
  const fit = Math.min(1, width / spanX, height / spanY);
  return {
    fit,
    shift: -((minY + maxY) / 2) * fit - room / 2,
    drop:
      s.axis === 'x'
        ? (rectWidth / fit) * 0.55 + s.cardW
        : (rectHeight / fit) * 0.55 + s.cardH,
  };
}

/** Resolves once the image has loaded and decoded (or failed). */
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => {
      image.decode().then(
        () => resolve(),
        () => resolve(),
      );
    };
    image.onerror = () => resolve();
    image.src = src;
  });
}
