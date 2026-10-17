import type { InjectionKey } from 'vue';
import type {
  WarmTooltipGroupContext,
  WarmTooltipSide,
  WarmTooltipSize,
  WarmTooltipSwap,
} from './types';

export const WARM_TOOLTIP_GROUP: InjectionKey<WarmTooltipGroupContext> =
  Symbol('warm-tooltip-group');

export const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];
export const LEAN_SPRING = { stiffness: 260, damping: 22, mass: 0.4 };
export const FULL_LEAN_SPEED = 1200;
export const SIGN: Record<WarmTooltipSide, number> = {
  top: 1,
  bottom: -1,
  left: -1,
  right: 1,
};
export const ORIGIN: Record<WarmTooltipSide, string> = {
  top: 'center bottom',
  bottom: 'center top',
  left: 'right center',
  right: 'left center',
};
export const SIZES: Record<
  WarmTooltipSize,
  { font: number; px: number; py: number }
> = {
  sm: { font: 11.5, px: 8, py: 5 },
  md: { font: 12.5, px: 10, py: 6 },
  lg: { font: 13.5, px: 12, py: 7 },
};
const MARGIN = 8;
export const HOLD_SLOP = 10;
export const SWAP = 0.14;
const SWAP_SHIFT = 10;
export const RISE = 4;
export const GRACE = 80;

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export const horizontal = (side: WarmTooltipSide): boolean =>
  side === 'top' || side === 'bottom';

export function anchorOf(
  rect: DOMRect,
  side: WarmTooltipSide,
  gap: number,
): [number, number] {
  if (side === 'top') return [rect.left + rect.width / 2, rect.top - gap];
  if (side === 'bottom') return [rect.left + rect.width / 2, rect.bottom + gap];
  if (side === 'left') return [rect.left - gap, rect.top + rect.height / 2];
  return [rect.right + gap, rect.top + rect.height / 2];
}

export function layoutOf(
  x: number,
  y: number,
  width: number,
  height: number,
  side: WarmTooltipSide,
): { X: number; Y: number } {
  if (horizontal(side)) {
    const X = clamp(
      x - width / 2,
      MARGIN,
      Math.max(MARGIN, window.innerWidth - MARGIN - width),
    );
    return { X, Y: side === 'top' ? y - height : y };
  }
  const Y = clamp(
    y - height / 2,
    MARGIN,
    Math.max(MARGIN, window.innerHeight - MARGIN - height),
  );
  return { X: side === 'left' ? x - width : x, Y };
}

/** Swap-layer variants, resolved with the current swap direction as `custom`. */
export const LAYER = {
  enter: ({ dir, across }: WarmTooltipSwap) => ({
    opacity: dir === 0 ? 1 : 0,
    x: across ? 0 : SWAP_SHIFT * dir,
    y: across ? SWAP_SHIFT * dir : 0,
    filter: dir === 0 ? 'blur(0px)' : 'blur(3px)',
  }),
  show: { opacity: 1, x: 0, y: 0, filter: 'blur(0px)' },
  exit: ({ dir, across }: WarmTooltipSwap) => ({
    opacity: 0,
    x: across ? 0 : -SWAP_SHIFT * dir,
    y: across ? -SWAP_SHIFT * dir : 0,
    filter: 'blur(3px)',
  }),
};
