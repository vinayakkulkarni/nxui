import type { FallingTextPresetName, FallingTextPresetValues } from './types';

const SENTENCE =
  'Some sentences are built to last. This one falls apart on contact.';

const BASE: FallingTextPresetValues = {
  text: SENTENCE,
  highlightWords: ['falls', 'apart'],
  variant: 'text',
  split: 'words',
  order: 'random',
  gravity: 1,
  bounciness: 0.2,
  scatter: 0.5,
  stagger: 0.03,
  cursorPush: 0.5,
  mouseConstraintStiffness: 0.2,
  restoreDelay: 2,
  size: 2,
};

const OVERRIDES: Record<
  FallingTextPresetName,
  Partial<FallingTextPresetValues>
> = {
  classic: {},
  tiles: { variant: 'tiles', size: 1.5, bounciness: 0.15 },
  letters: {
    text: 'Gravity always wins',
    highlightWords: [],
    split: 'letters',
    size: 3.25,
    order: 'sequence',
    stagger: 0.035,
    scatter: 0.8,
  },
  domino: { order: 'sequence', stagger: 0.12, scatter: 0.2, bounciness: 0.1 },
  bouncy: { bounciness: 0.7, scatter: 1, gravity: 1.3, cursorPush: 1 },
};

export function isFallingTextPreset(
  value: unknown,
): value is FallingTextPresetName {
  return typeof value === 'string' && Object.hasOwn(OVERRIDES, value);
}

/** Demo look for a preset: the shared defaults with the preset's overrides applied. */
export function fallingTextPreset(
  name: FallingTextPresetName,
): FallingTextPresetValues {
  const values = { ...BASE, ...OVERRIDES[name] };
  return { ...values, highlightWords: [...values.highlightWords] };
}
