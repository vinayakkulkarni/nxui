import { ref, watch } from 'vue';
import type { Ref } from 'vue';
import { useIntervalFn } from '@vueuse/core';

/** Counts up every `interval` ms while `playing()` is true. */
export function useBentoClock(
  playing: () => boolean,
  interval: number,
): Ref<number> {
  const tick = ref(0);
  const { pause, resume } = useIntervalFn(
    () => {
      tick.value += 1;
    },
    interval,
    { immediate: false },
  );

  watch(
    playing,
    (on) => {
      if (on) resume();
      else pause();
    },
    { immediate: true },
  );

  return tick;
}
