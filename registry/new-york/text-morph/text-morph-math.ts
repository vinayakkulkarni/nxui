export const TEXT_MORPH_DEFAULT_WORDS = ['IMAGINE', 'REFINE', 'RELEASE'];
export const TEXT_MORPH_BLUR = 12;
export const TEXT_MORPH_THRESHOLD = 18;

export function clamp(value: number, minimum = 0, maximum = 1): number {
  return Math.min(maximum, Math.max(minimum, value));
}

export function smoothstep(value: number): number {
  const progress = clamp(value);
  return progress * progress * (3 - 2 * progress);
}

export function setLayerStyles(
  element: HTMLElement,
  opacity: number,
  blur: number,
  scale: number,
): void {
  element.style.opacity = opacity.toFixed(4);
  element.style.filter = blur > 0.01 ? `blur(${blur.toFixed(2)}px)` : 'none';
  element.style.transform = `translateX(-50%) scale(${scale.toFixed(4)})`;
}
