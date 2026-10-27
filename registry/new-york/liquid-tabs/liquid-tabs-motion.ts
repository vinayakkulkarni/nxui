import type { Transition, VariantType } from 'motion-v';
import type { LiquidTabsVariants } from './types';

export const TAB_H = 52;
export const ROW_H = 72;

/* springs with no wobble — just a smooth settle */
export const BLOB_SPRING: Transition = {
  type: 'spring',
  visualDuration: 0.55,
  bounce: 0.12,
};
export const SMOOTH: Transition = {
  type: 'spring',
  visualDuration: 0.4,
  bounce: 0,
};
export const GLIDE: Transition = {
  type: 'spring',
  visualDuration: 0.3,
  bounce: 0,
};
export const INSTANT: Transition = { duration: 0 };

export const LIST_VARIANTS: LiquidTabsVariants = {
  initial: {},
  animate: { transition: { staggerChildren: 0.04, delayChildren: 0.05 } },
  exit: { transition: { staggerChildren: 0.02 } },
};

export const ROW_VARIANTS: LiquidTabsVariants = {
  initial: (dir: number) => ({ opacity: 0, x: dir * 18, filter: 'blur(4px)' }),
  animate: {
    opacity: 1,
    x: 0,
    filter: 'blur(0px)',
    transition: { type: 'spring', visualDuration: 0.45, bounce: 0 },
  },
  exit: (dir: number) => ({
    opacity: 0,
    x: dir * -18,
    filter: 'blur(4px)',
    transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] },
  }),
};

/* reduced motion: the rows only cross-fade */
export const ROW_VARIANTS_REDUCED: LiquidTabsVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.15 } },
  exit: { opacity: 0, transition: { duration: 0.1 } },
};

export const LABEL_IN = { y: 10, opacity: 0, filter: 'blur(3px)' };
export const LABEL_SHOW = { y: 0, opacity: 1, filter: 'blur(0px)' };
export const LABEL_OUT = { y: -10, opacity: 0, filter: 'blur(3px)' };
export const FADE_IN = { opacity: 0 };
export const FADE_SHOW = { opacity: 1 };

export const MENU_IN = { opacity: 0, scale: 0.95, y: -6, filter: 'blur(4px)' };
export const MENU_SHOW = { opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' };
export const MENU_OUT = { opacity: 0, scale: 0.97, y: -4, filter: 'blur(3px)' };
export const MENU_ITEM_IN = { opacity: 0, x: 6 };

export const CHEVRON_OPEN = { rotate: 180 };
export const CHEVRON_CLOSED = { rotate: 0 };

export const AVATAR_ON = { scale: [0.9, 1.04, 1] };
export const AVATAR_OFF = { scale: 1 };
export const AVATAR_TRANSITION: Transition = {
  duration: 0.45,
  ease: [0.22, 1, 0.36, 1],
};
export const ROW_PRESS = { scale: 0.985 };

export function menuItemShow(index: number): VariantType {
  return { opacity: 1, x: 0, transition: { ...GLIDE, delay: 0.03 * index } };
}
