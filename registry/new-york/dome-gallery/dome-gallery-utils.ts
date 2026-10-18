import type {
  DomeGalleryFitBasis,
  DomeGalleryRotation,
  GalleryImage,
  TileItem,
} from './types';

export const DOME_GALLERY_DEFAULT_IMAGES: GalleryImage[] = [
  {
    src: 'https://images.unsplash.com/photo-1755331039789-7e5680e26e8f?q=80&w=774&auto=format&fit=crop',
    alt: 'Abstract art',
  },
  {
    src: 'https://images.unsplash.com/photo-1755569309049-98410b94f66d?q=80&w=772&auto=format&fit=crop',
    alt: 'Modern sculpture',
  },
  {
    src: 'https://images.unsplash.com/photo-1755497595318-7e5e3523854f?q=80&w=774&auto=format&fit=crop',
    alt: 'Digital artwork',
  },
  {
    src: 'https://images.unsplash.com/photo-1755353985163-c2a0fe5ac3d8?q=80&w=774&auto=format&fit=crop',
    alt: 'Contemporary art',
  },
  {
    src: 'https://images.unsplash.com/photo-1745965976680-d00be7dc0377?q=80&w=774&auto=format&fit=crop',
    alt: 'Geometric pattern',
  },
  {
    src: 'https://images.unsplash.com/photo-1752588975228-21f44630bb3c?q=80&w=774&auto=format&fit=crop',
    alt: 'Textured surface',
  },
  {
    src: 'https://pbs.twimg.com/media/Gyla7NnXMAAXSo_?format=jpg&name=large',
    alt: 'Social media image',
  },
];

export function clamp(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), max);
}

export function normalizeAngle(d: number): number {
  return ((d % 360) + 360) % 360;
}

export function wrapAngleSigned(deg: number): number {
  const a = (((deg + 180) % 360) + 360) % 360;
  return a - 180;
}

export function getDataNumber(
  el: HTMLElement,
  name: string,
  fallback: number,
): number {
  const attr = el.dataset[name];
  const n = attr == null ? Number.NaN : Number.parseFloat(attr);
  return Number.isFinite(n) ? n : fallback;
}

/** Lays images onto the dome grid, avoiding identical neighbours. */
export function buildItems(
  pool: (string | GalleryImage)[],
  seg: number,
): TileItem[] {
  const xCols = Array.from({ length: seg }, (_, i) => -37 + i * 2);
  const evenYs = [-4, -2, 0, 2, 4];
  const oddYs = [-3, -1, 1, 3, 5];

  const coords = xCols.flatMap((x, c) => {
    const ys = c % 2 === 0 ? evenYs : oddYs;
    return ys.map((y) => ({ x, y, sizeX: 2, sizeY: 2 }));
  });

  const totalSlots = coords.length;
  if (pool.length === 0) {
    return coords.map((c) => ({ ...c, src: '', alt: '' }));
  }

  const normalized = pool.map((image) =>
    typeof image === 'string'
      ? { src: image, alt: '' }
      : { src: image.src || '', alt: image.alt || '' },
  );

  const used = Array.from(
    { length: totalSlots },
    (_, i) => normalized[i % normalized.length]!,
  );

  for (let i = 1; i < used.length; i++) {
    if (used[i]!.src === used[i - 1]!.src) {
      for (let j = i + 1; j < used.length; j++) {
        if (used[j]!.src !== used[i]!.src) {
          const tmp = used[i]!;
          used[i] = used[j]!;
          used[j] = tmp;
          break;
        }
      }
    }
  }

  return coords.map((c, i) => ({
    ...c,
    src: used[i]!.src,
    alt: used[i]!.alt,
  }));
}

export function computeItemBaseRotation(
  offsetX: number,
  offsetY: number,
  sizeX: number,
  sizeY: number,
  segments: number,
): DomeGalleryRotation {
  const unit = 360 / segments / 2;
  return {
    y: unit * (offsetX + (sizeX - 1) / 2),
    x: unit * (offsetY - (sizeY - 1) / 2),
  };
}

export function fitRadius(
  w: number,
  h: number,
  basisMode: DomeGalleryFitBasis,
  fit: number,
  minRadius: number,
  maxRadius: number,
): number {
  const minDim = Math.min(w, h);
  const maxDim = Math.max(w, h);
  const aspect = w / h;
  let basis: number;
  switch (basisMode) {
    case 'min':
      basis = minDim;
      break;
    case 'max':
      basis = maxDim;
      break;
    case 'width':
      basis = w;
      break;
    case 'height':
      basis = h;
      break;
    default:
      basis = aspect >= 1.3 ? w : minDim;
  }
  const radius = Math.min(basis * fit, h * 1.35);
  return Math.round(clamp(radius, minRadius, maxRadius));
}
