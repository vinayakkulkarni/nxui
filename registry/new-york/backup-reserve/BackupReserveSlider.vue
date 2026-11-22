<script setup lang="ts">
  import { computed, ref } from 'vue';
  import type { BackupReserveSliderProps } from './types';

  const props = defineProps<BackupReserveSliderProps>();
  const model = defineModel<number>({ required: true });

  const track = ref<HTMLElement | null>(null);
  const thumb = ref<HTMLButtonElement | null>(null);
  const dragging = ref(false);

  const span = computed(() => Math.max(1, props.max - props.min));
  const percent = computed(
    () =>
      ((Math.min(props.max, Math.max(props.min, model.value)) - props.min) /
        span.value) *
      100,
  );

  const ticks = computed(() =>
    Array.from({ length: 21 }, (_, i) => {
      const at = i * 5;
      return { at, major: at % 25 === 0 };
    }),
  );
  const labels = computed(() =>
    [0, 25, 50, 75, 100].map((at) => ({
      at,
      text: String(Math.round(props.min + (span.value * at) / 100)),
    })),
  );

  function snap(v: number): number {
    const stepped =
      Math.round((v - props.min) / props.step) * props.step + props.min;
    return Math.min(props.max, Math.max(props.min, Number(stepped.toFixed(4))));
  }

  function valueAt(clientX: number): number {
    const box = track.value?.getBoundingClientRect();
    if (!box || box.width === 0) return model.value;
    const ratio = (clientX - box.left) / box.width;
    return snap(props.min + ratio * span.value);
  }

  function onPointerDown(event: PointerEvent): void {
    if (event.button !== 0) return;
    dragging.value = true;
    const el = event.currentTarget;
    if (el instanceof HTMLElement) el.setPointerCapture(event.pointerId);
    thumb.value?.focus({ preventScroll: true });
    model.value = valueAt(event.clientX);
  }

  function onPointerMove(event: PointerEvent): void {
    if (!dragging.value) return;
    model.value = valueAt(event.clientX);
  }

  function onPointerUp(event: PointerEvent): void {
    dragging.value = false;
    const el = event.currentTarget;
    if (el instanceof HTMLElement && el.hasPointerCapture(event.pointerId)) {
      el.releasePointerCapture(event.pointerId);
    }
  }

  function onKeydown(event: KeyboardEvent): void {
    const big = props.step * 10;
    const moves: Record<string, number> = {
      ArrowLeft: -props.step,
      ArrowDown: -props.step,
      ArrowRight: props.step,
      ArrowUp: props.step,
      PageDown: -big,
      PageUp: big,
    };
    let next: number | null = null;
    if (event.key in moves) next = model.value + (moves[event.key] ?? 0);
    else if (event.key === 'Home') next = props.min;
    else if (event.key === 'End') next = props.max;
    if (next === null) return;
    event.preventDefault();
    model.value = snap(next);
  }
</script>

<template>
  <div class="px-1" :style="{ '--br-accent': props.color }">
    <div
      class="relative flex h-10 cursor-pointer touch-none items-center select-none"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
    >
      <div
        ref="track"
        class="relative h-1.5 w-full rounded-full bg-black/10 shadow-[inset_0_1px_2px_rgb(0_0_0/0.15)] dark:bg-black dark:shadow-[inset_0_1px_2px_rgb(0_0_0/0.9),0_1px_0_rgb(255_255_255/0.05)]"
      >
        <div
          class="absolute inset-y-0 left-0 rounded-full bg-(--br-accent) shadow-[0_0_8px_var(--br-accent)]"
          :class="
            dragging
              ? ''
              : 'transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none'
          "
          :style="{ width: `${percent}%` }"
        />
      </div>
      <button
        ref="thumb"
        type="button"
        role="slider"
        :aria-label="props.label"
        :aria-valuemin="props.min"
        :aria-valuemax="props.max"
        :aria-valuenow="model"
        :aria-valuetext="`${model} %`"
        class="absolute top-1/2 flex h-9 w-7 -translate-1/2 items-center justify-center rounded-[10px] border border-black/15 bg-linear-to-b from-white to-zinc-200 shadow-[0_2px_6px_rgb(0_0_0/0.35),inset_0_1px_0_rgb(255_255_255/0.9)] outline-none focus-visible:ring-2 focus-visible:ring-(--br-accent) focus-visible:ring-offset-2 focus-visible:ring-offset-card active:scale-95 dark:border-black/40"
        :class="
          dragging
            ? 'scale-95'
            : 'transition-[left,scale] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none'
        "
        :style="{ left: `${percent}%` }"
        @keydown="onKeydown"
      >
        <span
          class="h-4.5 w-0.5 rounded-full bg-zinc-800 shadow-[1px_0_0_rgb(255_255_255/0.9),-1px_0_0_rgb(0_0_0/0.15)]"
        />
      </button>
    </div>

    <div class="relative mt-0.5 h-2.5" aria-hidden="true">
      <span
        v-for="t in ticks"
        :key="t.at"
        class="absolute top-0 w-px -translate-x-1/2 bg-foreground/25"
        :class="t.major ? 'h-2.5' : 'h-1.5'"
        :style="{ left: `${t.at}%` }"
      />
    </div>
    <div
      class="relative mt-1.5 h-5 text-sm text-muted-foreground tabular-nums"
      aria-hidden="true"
    >
      <span
        v-for="l in labels"
        :key="l.at"
        class="absolute top-0 whitespace-nowrap"
        :class="
          l.at === 0 ? 'left-0' : l.at === 100 ? 'right-0' : '-translate-x-1/2'
        "
        :style="l.at > 0 && l.at < 100 ? { left: `${l.at}%` } : undefined"
      >
        {{ l.at === 100 ? `${l.text} %` : l.text }}
      </span>
    </div>
  </div>
</template>
