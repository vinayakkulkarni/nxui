import { computed, ref, watch } from 'vue';
import {
  useElementVisibility,
  useEventListener,
  useIntervalFn,
} from '@vueuse/core';
import type { ModelPickerAutoplayOptions } from './types';

const STOP_EVENTS = ['pointerdown', 'pointerenter', 'keydown', 'focusin'];

/**
 * Runs a looping list of steps while the target is on screen, and stops for
 * good the first time the user points at, clicks, focuses or types in it.
 */
export function useModelPickerAutoplay(options: ModelPickerAutoplayOptions) {
  const target = computed(() => options.target() ?? null);
  const visible = useElementVisibility(target);
  const stopped = ref(false);
  let index = 0;

  const { pause, resume } = useIntervalFn(
    () => {
      const steps = options.steps();
      if (steps.length === 0) return;
      const step = steps[index % steps.length];
      index += 1;
      if (step) step();
    },
    options.interval,
    { immediate: false },
  );

  function stop(): void {
    if (stopped.value || !options.enabled()) return;
    stopped.value = true;
    pause();
    options.onStop();
  }

  useEventListener(target, STOP_EVENTS, stop, { passive: true });

  const running = computed(
    () => options.enabled() && !stopped.value && visible.value,
  );

  watch(
    running,
    (on) => {
      if (on) resume();
      else pause();
    },
    { immediate: true },
  );

  return { stopped, stop };
}
