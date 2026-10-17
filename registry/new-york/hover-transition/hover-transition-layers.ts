import type {
  HoverTransitionDirection,
  HoverTransitionEffect,
  HoverTransitionLayer,
  HoverTransitionLayerContext,
  HoverTransitionVector,
} from './types';

export const hoverTransitionEffects: readonly HoverTransitionEffect[] = [
  'wipe',
  'ripple',
  'parallax',
  'curtain',
  'diagonal',
  'morph',
  'strips',
  'slide',
];

export const hoverTransitionDirections: readonly HoverTransitionDirection[] = [
  'top',
  'right',
  'bottom',
  'left',
  'top-left',
  'top-right',
  'bottom-right',
  'bottom-left',
  'center',
];

const directionVectors: Record<
  HoverTransitionDirection,
  HoverTransitionVector
> = {
  top: { x: 0, y: -1 },
  right: { x: 1, y: 0 },
  bottom: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  'top-left': { x: -1, y: -1 },
  'top-right': { x: 1, y: -1 },
  'bottom-right': { x: 1, y: 1 },
  'bottom-left': { x: -1, y: 1 },
  center: { x: 0, y: 0 },
};

const rippleOrigins: Record<HoverTransitionDirection, string> = {
  top: '50% 0%',
  right: '100% 50%',
  bottom: '50% 100%',
  left: '0% 50%',
  'top-left': '0% 0%',
  'top-right': '100% 0%',
  'bottom-right': '100% 100%',
  'bottom-left': '0% 100%',
  center: '50% 50%',
};

const hiddenInsets: Record<HoverTransitionDirection, string> = {
  top: 'inset(0 0 100% 0)',
  right: 'inset(0 0 0 100%)',
  bottom: 'inset(100% 0 0 0)',
  left: 'inset(0 100% 0 0)',
  'top-left': 'inset(0 100% 100% 0)',
  'top-right': 'inset(0 0 100% 100%)',
  'bottom-right': 'inset(100% 0 0 100%)',
  'bottom-left': 'inset(100% 100% 0 0)',
  center: 'inset(50%)',
};

function hiddenInset(direction: HoverTransitionDirection): string {
  return hiddenInsets[direction];
}

/** Effects that paint their own copies of the default slot, hiding the base. */
export function duplicatesDefault(effect: HoverTransitionEffect): boolean {
  return (
    effect === 'parallax' ||
    effect === 'curtain' ||
    effect === 'diagonal' ||
    effect === 'slide'
  );
}

const STRIP_COUNT = 8;

/**
 * Builds the stacked layers for an effect, in paint order. Mirrors the
 * upstream per-effect render switch one-to-one.
 */
export function buildLayers(
  ctx: HoverTransitionLayerContext,
): HoverTransitionLayer[] {
  const { effect, direction, active, seconds, transitionFor } = ctx;
  const vector = directionVectors[direction];
  const distanceX = vector.x * 100;
  const distanceY = vector.y * 100;
  const layerTransition = transitionFor([
    'clip-path',
    'transform',
    'opacity',
    'filter',
    'border-radius',
  ]);

  const hoverLayer = (
    style: Record<string, string>,
    key = 'hover',
  ): HoverTransitionLayer => ({
    key,
    content: 'hover',
    style: { transition: layerTransition, ...style },
  });

  switch (effect) {
    case 'ripple':
      return [
        hoverLayer({
          clipPath: active
            ? `circle(150% at ${rippleOrigins[direction]})`
            : `circle(0% at ${rippleOrigins[direction]})`,
          filter: active ? 'blur(0px)' : 'blur(2px)',
          transform: active ? 'scale(1)' : 'scale(1.035)',
          transformOrigin: rippleOrigins[direction],
        }),
      ];
    case 'parallax':
      return [
        {
          key: 'parallax-default',
          content: 'default',
          style: {
            transform: active
              ? `translate3d(${-distanceX * 0.12}%, ${-distanceY * 0.12}%, 0) scale(1.045)`
              : 'translate3d(0, 0, 0) scale(1)',
            filter: active ? 'brightness(.78) saturate(.75)' : 'none',
            transition: transitionFor(['transform', 'filter']),
          },
        },
        {
          key: 'parallax-hover',
          content: 'hover',
          style: {
            clipPath: active ? 'inset(0)' : hiddenInset(direction),
            filter: active ? 'blur(0px)' : 'blur(2px)',
            transition: transitionFor(['clip-path', 'filter']),
          },
          innerStyle: {
            transform: active
              ? 'translate3d(0, 0, 0) scale(1)'
              : `translate3d(${distanceX * 0.24}%, ${distanceY * 0.24}%, 0) scale(1.07)`,
            transition: transitionFor(['transform']),
          },
        },
      ];
    case 'curtain': {
      const verticalMotion = vector.y !== 0 || direction === 'center';
      const panelTransition = transitionFor(['transform', 'filter']);
      const panelFilter = active ? 'blur(1px)' : 'blur(0px)';
      return [
        hoverLayer({
          opacity: active ? '1' : '0',
          filter: active ? 'blur(0px)' : 'blur(3px)',
          transform: active ? 'scale(1)' : 'scale(.96)',
        }),
        {
          key: 'curtain-a',
          content: 'default',
          style: {
            clipPath: verticalMotion ? 'inset(0 0 50% 0)' : 'inset(0 50% 0 0)',
            transform: active
              ? verticalMotion
                ? 'translate3d(0, -100%, 0)'
                : 'translate3d(-100%, 0, 0)'
              : 'translate3d(0, 0, 0)',
            filter: panelFilter,
            transition: panelTransition,
          },
        },
        {
          key: 'curtain-b',
          content: 'default',
          style: {
            clipPath: verticalMotion ? 'inset(50% 0 0 0)' : 'inset(0 0 0 50%)',
            transform: active
              ? verticalMotion
                ? 'translate3d(0, 100%, 0)'
                : 'translate3d(100%, 0, 0)'
              : 'translate3d(0, 0, 0)',
            filter: panelFilter,
            transition: panelTransition,
          },
        },
      ];
    }
    case 'diagonal': {
      const fromLeft = direction.includes('left');
      const panelTransition = transitionFor(['transform', 'filter']);
      const panelFilter = active ? 'blur(1px)' : 'blur(0px)';
      return [
        hoverLayer({
          opacity: active ? '1' : '0',
          filter: active ? 'blur(0px)' : 'blur(2px)',
          transform: active ? 'scale(1)' : 'scale(.97)',
        }),
        {
          key: 'diagonal-a',
          content: 'default',
          style: {
            clipPath: fromLeft
              ? 'polygon(0 0, 100% 0, 100% 100%)'
              : 'polygon(0 0, 100% 0, 0 100%)',
            transform: active
              ? fromLeft
                ? 'translate3d(100%, -100%, 0)'
                : 'translate3d(-100%, -100%, 0)'
              : 'translate3d(0, 0, 0)',
            filter: panelFilter,
            transition: panelTransition,
          },
        },
        {
          key: 'diagonal-b',
          content: 'default',
          style: {
            clipPath: fromLeft
              ? 'polygon(0 0, 100% 100%, 0 100%)'
              : 'polygon(100% 0, 100% 100%, 0 100%)',
            transform: active
              ? fromLeft
                ? 'translate3d(-100%, 100%, 0)'
                : 'translate3d(100%, 100%, 0)'
              : 'translate3d(0, 0, 0)',
            filter: panelFilter,
            transition: panelTransition,
          },
        },
      ];
    }
    case 'morph':
      return [
        hoverLayer({
          borderRadius: active ? '0%' : '42%',
          clipPath: active ? 'inset(0% round 0%)' : 'inset(43% round 42%)',
          filter: active ? 'blur(0px)' : 'blur(3px)',
          opacity: active ? '1' : '0',
          transform: active
            ? 'translate3d(0, 0, 0) scale(1) rotate(0deg)'
            : `translate3d(${distanceX * 0.04}%, ${distanceY * 0.04}%, 0) scale(.86) rotate(${vector.x < 0 ? -2 : 2}deg)`,
          transformOrigin: rippleOrigins[direction],
        }),
      ];
    case 'strips': {
      const vertical = Math.abs(vector.x) >= Math.abs(vector.y);
      const offsetX = (vector.x || (vector.y === 0 ? 1 : 0)) * 72;
      const offsetY = vector.y * 72;
      const staggerWindow = seconds * 0.15;
      return Array.from({ length: STRIP_COUNT }, (_, index) => {
        const start = (index / STRIP_COUNT) * 100;
        const end = ((index + 1) / STRIP_COUNT) * 100;
        const staggerIndex = active ? index : STRIP_COUNT - index - 1;
        const stripDelay = (staggerIndex / (STRIP_COUNT - 1)) * staggerWindow;
        return {
          key: `strip-${index}`,
          content: 'hover',
          style: {
            clipPath: vertical
              ? `inset(0 ${100 - end}% 0 ${start}%)`
              : `inset(${start}% 0 ${100 - end}% 0)`,
            filter: active ? 'blur(0px)' : 'blur(1.5px)',
            opacity: active ? 1 : 0,
            transform: active
              ? 'translate3d(0, 0, 0)'
              : `translate3d(${offsetX}%, ${offsetY}%, 0)`,
            transition: transitionFor(
              ['transform', 'opacity', 'filter'],
              stripDelay,
              0.85,
            ),
          },
        };
      });
    }
    case 'slide':
      return [
        {
          key: 'slide-default',
          content: 'default',
          style: {
            transform: active
              ? direction === 'center'
                ? 'scale(1.035)'
                : `translate3d(${-distanceX * 0.16}%, ${-distanceY * 0.16}%, 0) scale(1.025)`
              : 'translate3d(0, 0, 0)',
            filter: active ? 'brightness(.72) blur(2px)' : 'none',
            opacity: active ? 0 : 1,
            transition: transitionFor(['transform', 'opacity', 'filter']),
          },
        },
        hoverLayer({
          opacity: active ? '1' : '0',
          filter: active ? 'blur(0px)' : 'blur(3px)',
          transform: active
            ? 'translate3d(0, 0, 0)'
            : direction === 'center'
              ? 'scale(.96)'
              : `translate3d(${distanceX * 0.16}%, ${distanceY * 0.16}%, 0) scale(.985)`,
        }),
      ];
    case 'wipe':
    default:
      return [
        hoverLayer({
          clipPath: active ? 'inset(0)' : hiddenInset(direction),
          filter: active ? 'blur(0px)' : 'blur(1.5px)',
          transform: active ? 'scale(1)' : 'scale(1.025)',
          transformOrigin: rippleOrigins[direction],
        }),
      ];
  }
}
