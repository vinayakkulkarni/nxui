/** Centre of the 240 × 240 view box. */
export const CENTER = 120;

function point(radius: number, angle: number): string {
  const x = CENTER + radius * Math.sin(angle);
  const y = CENTER - radius * Math.cos(angle);
  return `${x.toFixed(3)} ${y.toFixed(3)}`;
}

/**
 * Annular sector between `start` and `end` (radians, clockwise from 12
 * o'clock). Each side is pulled in by `inset` user units, measured along the
 * arc, so the gap between neighbours stays the same width at every radius.
 */
export function sectorPath(
  inner: number,
  outer: number,
  start: number,
  end: number,
  inset: number,
): string {
  const angles = (radius: number): [number, number] => {
    const pull = inset / radius;
    const a = start + pull;
    const b = end - pull;
    if (b > a) return [a, b];
    const mid = (start + end) / 2;
    return [mid - 0.0005, mid + 0.0005];
  };
  const [o0, o1] = angles(outer);
  const [i0, i1] = angles(inner);
  const largeOuter = o1 - o0 > Math.PI ? 1 : 0;
  const largeInner = i1 - i0 > Math.PI ? 1 : 0;
  return [
    `M ${point(outer, o0)}`,
    `A ${outer} ${outer} 0 ${largeOuter} 1 ${point(outer, o1)}`,
    `L ${point(inner, i1)}`,
    `A ${inner} ${inner} 0 ${largeInner} 0 ${point(inner, i0)}`,
    'Z',
  ].join(' ');
}
