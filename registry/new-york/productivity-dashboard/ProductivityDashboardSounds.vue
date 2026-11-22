<script setup lang="ts">
  import { computed, onBeforeUnmount, ref, shallowRef, watch } from 'vue';
  import { useElementVisibility, useRafFn } from '@vueuse/core';
  import { AnimatePresence, animate, motion } from 'motion-v';
  import type { ProductivitySoundsProps } from './types';

  const props = withDefaults(defineProps<ProductivitySoundsProps>(), {
    instant: false,
  });

  const emit = defineEmits<{ toggle: [] }>();

  const COUNT = 40;
  const MAX = 72;

  /** Deterministic idle heights (no Math.random, so SSR matches). */
  const IDLE = Array.from({ length: COUNT }, (_, i) => {
    const n = Math.sin(i * 12.9898 + 4.1) * 43758.5453;
    return 10 + (n - Math.floor(n)) * 14;
  });

  const wave = (i: number, t: number): number => {
    const body = Math.abs(Math.sin(i * 0.31 + t * 1.6));
    const ripple = 0.55 + 0.45 * Math.sin(i * 0.9 - t * 3.1);
    return 18 + (MAX - 18) * body * ripple;
  };

  const root = ref<HTMLElement | null>(null);
  const visible = useElementVisibility(root);
  const amp = ref(props.playing ? 1 : 0);
  const heights = shallowRef<number[]>(
    IDLE.map((h, i) => h + (wave(i, 0) - h) * amp.value),
  );
  let time = 0;

  const draw = (): void => {
    heights.value = IDLE.map((h, i) => h + (wave(i, time) - h) * amp.value);
  };

  const raf = useRafFn(
    ({ delta }) => {
      time += Math.min(delta, 50) / 1000;
      draw();
    },
    { immediate: false },
  );

  const sync = (): void => {
    const live = (props.playing || amp.value > 0.001) && visible.value;
    if (live && !props.instant) raf.resume();
    else {
      raf.pause();
      draw();
    }
  };

  let ampAnim: ReturnType<typeof animate> | null = null;
  watch(
    () => props.playing,
    (on) => {
      ampAnim?.stop();
      if (props.instant) {
        amp.value = on ? 1 : 0;
        sync();
        return;
      }
      ampAnim = animate(amp.value, on ? 1 : 0, {
        type: 'spring',
        stiffness: 70,
        damping: 16,
        onUpdate: (v) => {
          amp.value = v;
        },
        onComplete: sync,
      });
      sync();
    },
  );

  watch([visible, () => props.instant], sync, { immediate: true });
  onBeforeUnmount(() => {
    ampAnim?.stop();
    raf.pause();
  });

  const status = computed(() => (props.playing ? 'Playing' : 'Paused'));
  const handleToggle = (): void => emit('toggle');
</script>

<template>
  <div ref="root" class="flex h-full flex-col">
    <div class="flex items-center gap-3">
      <span
        class="flex size-10 items-center justify-center rounded-full bg-(--pd-chip)"
      >
        <Icon name="lucide:audio-lines" class="size-4.5 text-(--pd-violet)" />
      </span>
      <span class="text-[17px] font-medium text-(--pd-muted)">Sounds</span>
      <span class="ml-auto grid justify-items-end" aria-live="polite">
        <AnimatePresence :initial="false">
          <motion.span
            :key="status"
            :class="[
              'col-start-1 row-start-1 text-[15px] font-medium',
              playing ? 'text-(--pd-violet)' : 'text-(--pd-muted)',
            ]"
            :initial="{ opacity: 0, filter: 'blur(4px)' }"
            :animate="{ opacity: 1, filter: 'blur(0px)' }"
            :exit="{ opacity: 0, filter: 'blur(4px)' }"
            :transition="instant ? { duration: 0 } : { duration: 0.25 }"
          >
            {{ status }}
          </motion.span>
        </AnimatePresence>
      </span>
    </div>

    <div
      class="flex min-h-20 flex-1 items-center justify-between gap-0.5"
      aria-hidden="true"
    >
      <span
        v-for="(h, i) in heights"
        :key="i"
        :class="[
          'w-1 rounded-full transition-colors duration-500',
          playing ? 'bg-(--pd-violet-wave)' : 'bg-(--pd-wave-idle)',
        ]"
        :style="{ height: `${h}px` }"
      />
    </div>

    <div class="flex items-center gap-4">
      <button
        type="button"
        :aria-label="playing ? `Pause ${sound.title}` : `Play ${sound.title}`"
        :aria-pressed="playing"
        class="pd-focus flex size-12 shrink-0 items-center justify-center rounded-full bg-(--pd-pill) text-(--pd-pill-fg) transition-transform active:scale-95"
        @click="handleToggle"
      >
        <Icon
          :name="playing ? 'lucide:pause' : 'lucide:play'"
          class="size-4.5 fill-current"
        />
      </button>
      <div class="min-w-0">
        <p class="truncate text-base font-semibold text-(--pd-fg)">
          {{ sound.title }}
        </p>
        <p class="truncate text-sm text-(--pd-muted)">{{ sound.subtitle }}</p>
      </div>
    </div>
  </div>
</template>
