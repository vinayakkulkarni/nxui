import { computed, onMounted, ref, toValue, watch } from 'vue';
import type { ComputedRef, MaybeRefOrGetter } from 'vue';
import {
  TransitionPresets,
  usePreferredReducedMotion,
  useTransition,
} from '@vueuse/core';

/**
 * Tweens a number from 0 to `target` after mount, then follows it.
 * Charts animate by tweening their data, never the rendered SVG, so the same
 * motion works with the hand-rolled engine and with TanStack Charts.
 * The server render starts at 0; with reduced motion the value jumps to
 * `target` on mount instead of tweening.
 */
export function useChartTween(
  target: MaybeRefOrGetter<number>,
  duration = 900,
): ComputedRef<number> {
  const motion = usePreferredReducedMotion();
  const reduce = computed(() => motion.value === 'reduce');
  const source = ref(0);

  onMounted(() => {
    source.value = toValue(target);
  });
  watch(
    () => toValue(target),
    (value) => {
      source.value = value;
    },
  );

  return useTransition(source, {
    duration,
    transition: TransitionPresets.easeOutCubic,
    disabled: reduce,
  });
}
