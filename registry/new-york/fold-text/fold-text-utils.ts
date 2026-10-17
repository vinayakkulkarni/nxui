import type {
  FoldTextAxis,
  FoldTextHinge,
  FoldTextHingeConfig,
  FoldTextSegment,
  FoldTextSplitBy,
  FoldTextStaggerFrom,
  FoldTextStyle,
} from './types';

export type EaseFn = (progress: number) => number;

export const HINGES: Record<FoldTextHinge, FoldTextHingeConfig> = {
  top: { origin: '50% 0%', axis: 'rotateX', sign: -1 },
  bottom: { origin: '50% 100%', axis: 'rotateX', sign: 1 },
  left: { origin: '0% 50%', axis: 'rotateY', sign: 1 },
  right: { origin: '100% 50%', axis: 'rotateY', sign: -1 },
};

export const SLATS: Record<
  FoldTextAxis,
  { origins: string[]; clips: string[] }
> = {
  rotateX: {
    origins: ['50% 25%', '50% 75%'],
    clips: ['inset(-40% -20% 50% -20%)', 'inset(50% -20% -40% -20%)'],
  },
  rotateY: {
    origins: ['25% 50%', '75% 50%'],
    clips: ['inset(-40% 50% -40% -20%)', 'inset(-40% -20% -40% 50%)'],
  },
};

export const FOLD_STYLES: FoldTextStyle[] = ['paper', 'blinds', 'flip'];
export const SLAT_DELAY = 0.24;

export const POWER1_IN: EaseFn = (p) => p * p;
export const POWER1_OUT: EaseFn = (p) => 1 - (1 - p) ** 2;
export const POWER2_IN: EaseFn = (p) => p ** 3;
export const POWER3_OUT: EaseFn = (p) => 1 - (1 - p) ** 4;

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function bounceOut(p: number): number {
  const n = 7.5625;
  const d = 2.75;
  if (p < 1 / d) return n * p * p;
  if (p < 2 / d) return n * (p - 1.5 / d) ** 2 + 0.75;
  if (p < 2.5 / d) return n * (p - 2.25 / d) ** 2 + 0.9375;
  return n * (p - 2.625 / d) ** 2 + 0.984375;
}

function easeIn(name: string, param: number | undefined): EaseFn | null {
  const powers: Record<string, number> = {
    power0: 1,
    linear: 1,
    none: 1,
    power1: 2,
    quad: 2,
    power2: 3,
    cubic: 3,
    power3: 4,
    quart: 4,
    power4: 5,
    quint: 5,
    strong: 5,
  };
  const power = powers[name];
  if (power !== undefined) return (p) => p ** power;
  if (name === 'sine') return (p) => 1 - Math.cos((p * Math.PI) / 2);
  if (name === 'expo') return (p) => (p ? 2 ** (10 * (p - 1)) : 0);
  if (name === 'circ') return (p) => -(Math.sqrt(1 - p * p) - 1);
  if (name === 'back') {
    const s = param ?? 1.70158;
    return (p) => p * p * ((s + 1) * p - s);
  }
  if (name === 'bounce') return (p) => 1 - bounceOut(1 - p);
  return null;
}

/** Parses GSAP-style ease names such as `power3.out`, `expo.inOut` or `back.out(1.2)`. */
export function parseEase(value: string): EaseFn | null {
  const match =
    /^\s*([a-z]+\d?)(?:\.(in|out|inOut))?(?:\(\s*([-\d.]+)\s*\))?\s*$/i.exec(
      value,
    );
  if (!match) return null;
  const name = (match[1] ?? '').toLowerCase();
  const type =
    match[2] ?? (name === 'none' || name === 'linear' ? 'in' : 'out');
  const param = match[3] === undefined ? undefined : Number(match[3]);
  const base = easeIn(name, Number.isFinite(param) ? param : undefined);
  if (!base) return null;
  if (type === 'in') return base;
  if (type === 'out') return (p) => 1 - base(1 - p);
  return (p) => (p < 0.5 ? base(p * 2) / 2 : 1 - base((1 - p) * 2) / 2);
}

/** Per-index stagger delays, matching GSAP's `{ each, from }` distribution. */
export function staggerDelays(
  count: number,
  each: number,
  from: FoldTextStaggerFrom,
): number[] {
  const origin = (count - 1) / 2;
  const distances = Array.from({ length: count }, (_, index) => {
    if (from === 'end') return count - 1 - index;
    if (from === 'center') return Math.abs(index - origin);
    if (from === 'edges') return origin - Math.abs(index - origin);
    return index;
  });
  if (from === 'random') {
    for (let i = count - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const swap = distances[i]!;
      distances[i] = distances[j]!;
      distances[j] = swap;
    }
  }
  const min = Math.min(...distances, 0);
  return distances.map((distance) => (distance - min) * each);
}

export function buildSegments(
  text: string,
  splitBy: FoldTextSplitBy,
): FoldTextSegment[] {
  if (splitBy === 'line') {
    return text.split('\n').map((line, index) => ({
      kind: 'piece',
      key: `line-${index}`,
      content: line || '\u00A0',
      line: true,
    }));
  }

  return text.split(/(\s+)/).flatMap((part, partIndex): FoldTextSegment[] => {
    if (!part) return [];

    if (/^\s+$/.test(part)) {
      return part
        .split('\n')
        .flatMap((spaces, lineIndex): FoldTextSegment[] => {
          const items: FoldTextSegment[] = [];
          if (lineIndex > 0) {
            items.push({ kind: 'break', key: `br-${partIndex}-${lineIndex}` });
          }
          if (spaces) {
            items.push({
              kind: 'space',
              key: `sp-${partIndex}-${lineIndex}`,
              text: spaces,
            });
          }
          return items;
        });
    }

    if (splitBy === 'word') {
      return [
        { kind: 'piece', key: `word-${partIndex}`, content: part, line: false },
      ];
    }

    return [
      {
        kind: 'word',
        key: `word-${partIndex}`,
        chars: Array.from(part).map((char, charIndex) => ({
          key: `char-${partIndex}-${charIndex}`,
          content: char,
        })),
      },
    ];
  });
}
