export const MAX_LAYERS = 64;
export const INTRO_MS = 1200;
export const PUSH_STIFFNESS = 260;
export const PUSH_DAMPING = 17;
export const PRESS_EXTRA = 0.25;
export const FLOAT_EASE = 0.7;

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function getLayerColor(
  faceColor: string,
  depthColor: string,
  index: number,
  total: number,
): string {
  const progress = total <= 1 ? 1 : index / total;
  const eased = progress * progress;
  const faceMix = Math.round((1 - eased) * 72 + 4);
  return `color-mix(in srgb, color-mix(in srgb, ${faceColor} ${faceMix}%, ${depthColor}) 92%, black)`;
}

export function getFadeColor(
  depthColor: string,
  index: number,
  total: number,
  outline: boolean,
): string {
  const reach = (layer: number) =>
    Math.pow(clamp(1 - (layer - 0.5) / total, 0, 1), 1.6);
  const here = reach(index);
  const behind = index >= total ? 0 : reach(index + 1);
  const alpha = outline
    ? here
    : behind >= 1
      ? 1
      : 1 - (1 - here) / (1 - behind);
  return `color-mix(in srgb, ${depthColor} ${(clamp(alpha, 0, 1) * 100).toFixed(2)}%, transparent)`;
}

export function getTransform(
  rotateX: number,
  rotateY: number,
  lift = 0,
  roll = 0,
  sink = 0,
): string {
  return [
    lift ? `translateY(${lift.toFixed(2)}px)` : '',
    roll ? `rotateZ(${roll.toFixed(3)}deg)` : '',
    `rotateX(${rotateX.toFixed(3)}deg) rotateY(${rotateY.toFixed(3)}deg)`,
    sink ? `translateZ(${(-sink).toFixed(2)}px)` : '',
  ]
    .filter(Boolean)
    .join(' ');
}
