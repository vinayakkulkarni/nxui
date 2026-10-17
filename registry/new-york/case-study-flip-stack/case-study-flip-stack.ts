import type { CaseStudyFlipFrame, CaseStudyFlipItem } from './types';

export const CASE_STUDY_FLIP_DEFAULT_ITEMS: CaseStudyFlipItem[] = [
  {
    eyebrow: 'Fintech',
    title: 'Boosted conversion by 42% with a product-led redesign',
    description:
      'We restructured the onboarding flow and clarified the value proposition, helping the platform turn more visitors into activated users.',
    image:
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=1400&q=90&auto=format&fit=crop',
    imageAlt: 'Portrait framed by tropical greenery',
    background: '#a94808',
    foreground: '#fff7ed',
  },
  {
    eyebrow: 'Hospitality',
    title: 'A slower digital experience for a faster-growing retreat',
    description:
      'A cinematic booking journey brings the landscape forward, simplifies room selection, and gives every stay a stronger sense of place.',
    image:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1400&q=90&auto=format&fit=crop',
    imageAlt: 'A person overlooking a mountain landscape',
    background: '#067b8f',
    foreground: '#ecfeff',
  },
  {
    eyebrow: 'Culture',
    title: 'Turning a living archive into something you can wander through',
    description:
      'We paired bold editorial typography with an intuitive collection system, making decades of work feel immediate, playful, and alive.',
    image:
      'https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=1400&q=90&auto=format&fit=crop',
    imageAlt: 'Colorful artwork in a contemporary gallery',
    background: '#ba075f',
    foreground: '#fff1f7',
  },
  {
    eyebrow: 'Climate',
    title: 'Making complex energy data feel clear enough to act on',
    description:
      'An approachable visual system turns live infrastructure data into useful decisions for operators, partners, and the communities they serve.',
    image:
      'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?w=1400&q=90&auto=format&fit=crop',
    imageAlt: 'Wind turbines across a green landscape',
    background: '#3322a8',
    foreground: '#f3f1ff',
  },
];

/** Clamped linear map of `v` from [a, b] onto [from, to] (framer `useTransform` semantics). */
function mapRange(
  v: number,
  a: number,
  b: number,
  from: number,
  to: number,
): number {
  if (b === a) return v < a ? from : to;
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return from + (to - from) * t;
}

/**
 * Per-card transform values for a given stack progress (0–1). Mirrors the
 * upstream segment math: each card owns 1/total of the scroll, folds upward
 * (−118% + stack offset, rotateX 22°) during its segment, and the card below
 * rises from its resting offset/scale during the preceding segment.
 */
export function caseStudyFlipFrame(
  progress: number,
  index: number,
  total: number,
  reduceMotion: boolean,
): CaseStudyFlipFrame {
  const segment = 1 / Math.max(total, 1);
  const start = index * segment;
  const end = Math.min(start + segment, 1);
  const entryStart = Math.max(0, start - segment);
  const entryEnd =
    index === 0 ? 0.0001 : Math.min(start, entryStart + segment * 0.7);
  const stackedCardGap = Math.min(24, 72 / Math.max(total - 1, 1));
  const stackedOffset = index * stackedCardGap;
  const restingOffset = Math.min(index * 12, 34);
  const restingScale = 1 - Math.min(index * 0.012, 0.035);

  const exitPercent = reduceMotion
    ? 0
    : mapRange(progress, start, end, 0, -118);
  const exitStack = reduceMotion
    ? 0
    : mapRange(progress, start, end, 0, stackedOffset);
  const rotateX = reduceMotion ? 0 : mapRange(progress, start, end, 0, 22);
  const entryScale =
    index === 0 ? 1 : mapRange(progress, entryStart, entryEnd, restingScale, 1);
  const entryY =
    index === 0
      ? 0
      : mapRange(progress, entryStart, entryEnd, restingOffset, 0);

  return {
    transform: `translateY(calc(${exitPercent}% + ${exitStack}px)) rotateX(${rotateX}deg)`,
    opacity: reduceMotion ? mapRange(progress, start, end, 1, 0) : 1,
    innerTransform: `translateY(${entryY}px) scale(${entryScale})`,
  };
}

/** Upstream `useSpring` config for the smoothed scroll progress. */
export const CASE_STUDY_FLIP_SPRING = {
  stiffness: 120,
  damping: 22,
  mass: 0.8,
  restDelta: 0.0005,
};
