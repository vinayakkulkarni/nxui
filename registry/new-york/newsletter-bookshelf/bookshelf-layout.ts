import type { BookLayout, NewsletterBookshelfItem, ShelfBounds } from './types';

const PALETTE = [
  '#0b1e4b',
  '#16277a',
  '#2233b8',
  '#4040ff',
  '#6b7bff',
  '#9fb0ff',
  '#dce4ff',
  '#faf7ee',
  '#efe8d4',
  '#f4f2ec',
  '#25252a',
  '#3a3a40',
];

const DEFAULT_TITLES = [
  'The systems issue',
  'A field guide to good taste',
  'The small team advantage',
  'Notes on building in public',
  'A better creative workflow',
  'The useful AI playbook',
  'Designing for momentum',
  'The quiet automation stack',
  'How ideas become products',
  "The founder's operating manual",
  'A week of useful experiments',
  'The leverage edition',
  'What we learned shipping early',
  'Tools worth keeping',
  'The case for fewer meetings',
  'A practical guide to agents',
  'Making software feel human',
  'The compounding details',
  'Build the smallest useful thing',
  'The creative director in your pocket',
  'Signals from the frontier',
  'A calmer way to move fast',
  'The prototype-first company',
  'Workflows that actually stick',
  'The one-person studio',
  'Notes from a strange future',
  'The high-agency handbook',
  'A new interface for work',
  'The craft issue',
  'Ideas with a pulse',
  'The independent builder',
  'A map for the next chapter',
];

const dateFormat = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});

export const defaultNewsletterBooks: NewsletterBookshelfItem[] =
  DEFAULT_TITLES.map((title, index) => ({
    id: `edition-${DEFAULT_TITLES.length - index}`,
    title,
    date: dateFormat
      .format(new Date(Date.UTC(2026, 6, 31 - index * 7, 12)))
      .toUpperCase(),
    subtitle:
      'A concise collection of practical notes, experiments, and ideas for people building what comes next.',
  }));

export function hash(input: string): number {
  let value = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    value ^= input.charCodeAt(index);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

export function seeded(seed: number): () => number {
  let value = seed >>> 0;
  return () => {
    // 0x6d2b79f5 (mulberry32 increment)
    value += 1831565813;
    let next = value;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

function channel(value: number): number {
  const normalized = value / 255;
  return normalized <= 0.03928
    ? normalized / 12.92
    : ((normalized + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const color = Number.parseInt(hex.slice(1), 16);
  return (
    channel((color >> 16) & 255) * 0.2126 +
    channel((color >> 8) & 255) * 0.7152 +
    channel(color & 255) * 0.0722
  );
}

export function deriveLayout(items: NewsletterBookshelfItem[]): BookLayout[] {
  let cursor = 0;
  return items.map((item) => {
    const random = seeded(hash(item.id));
    const fallbackColor = PALETTE[Math.floor(random() * PALETTE.length)]!;
    const width = 0.34 + random() * 0.3;
    const bookHeight = 3.65 + (random() * 2 - 1) * 0.22;
    const color = item.color ?? fallbackColor;
    const foil = item.foil ?? (luminance(color) < 0.5 ? '#f2ead8' : '#3030ff');
    if (random() < 0.14) cursor += 0.2;
    const x = cursor + width / 2;
    cursor += width + 0.065;
    return {
      ...item,
      x,
      width,
      bookHeight,
      depth: bookHeight * 0.67,
      motif: Math.floor(random() * 8),
      color,
      foil,
    };
  });
}

export function nearestBook(books: BookLayout[], x: number): number {
  let nearest = 0;
  let distance = Number.POSITIVE_INFINITY;
  books.forEach((book, index) => {
    const next = Math.abs(book.x - x);
    if (next < distance) {
      nearest = index;
      distance = next;
    }
  });
  return nearest;
}

/** Horizontal camera range so the shelf ends stay roughly a third inset. */
export function shelfBounds(
  books: BookLayout[],
  stageWidth: number,
  stageHeight: number,
): ShelfBounds {
  const last = books.at(-1)?.x ?? 0;
  const aspect = stageWidth / Math.max(420, stageHeight);
  const visibleSpan = 2 * 10 * Math.tan((35 * Math.PI) / 360) * aspect;
  const inset = visibleSpan * 0.31;
  const min = Math.min(last / 2, (books[0]?.x ?? 0) + inset);
  const max = Math.max(last / 2, last - inset);
  return max <= min
    ? { min: last / 2, max: last / 2, visibleSpan }
    : { min, max, visibleSpan };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function safeHref(
  href: string | undefined,
  base: string,
): string | null {
  if (!href) return null;
  try {
    const destination = new URL(href, base);
    if (destination.protocol !== 'http:' && destination.protocol !== 'https:') {
      return null;
    }
    return destination.href;
  } catch {
    return null;
  }
}
