<script setup lang="ts">
  import { ref, computed } from 'vue';
  import type { PodcastWaveformProps } from './types';

  const props = defineProps<PodcastWaveformProps>();

  const emit = defineEmits<{
    seek: [fraction: number];
  }>();

  const track = ref<HTMLElement | null>(null);
  const hoverFraction = ref<number | null>(null);

  function fractionFromEvent(event: PointerEvent): number {
    const rect = track.value?.getBoundingClientRect();
    if (!rect || rect.width === 0) return 0;
    return Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
  }

  function onMove(event: PointerEvent) {
    hoverFraction.value = fractionFromEvent(event);
  }

  function onLeave() {
    hoverFraction.value = null;
  }

  function onClick(event: PointerEvent) {
    emit('seek', fractionFromEvent(event));
  }

  const tooltip = computed(() => {
    if (hoverFraction.value === null) return null;
    const total = Math.floor(hoverFraction.value * props.duration);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  });
</script>

<template>
  <div
    ref="track"
    class="relative flex h-12 w-full min-w-0 cursor-pointer items-center gap-px"
    role="slider"
    aria-label="Seek"
    :aria-valuemin="0"
    :aria-valuemax="100"
    :aria-valuenow="Math.round(progress * 100)"
    @pointermove="onMove"
    @pointerleave="onLeave"
    @pointerdown="onClick"
  >
    <span
      v-for="(h, i) in heights"
      :key="i"
      class="min-w-0.5 flex-1 rounded-full transition-colors duration-100"
      :style="{
        height: `${h * 100}%`,
        background: i / heights.length <= progress ? accent : 'var(--border)',
      }"
    />

    <template v-if="tooltip !== null && hoverFraction !== null">
      <span
        class="pointer-events-none absolute inset-y-0 w-px bg-foreground/60"
        :style="{ left: `${hoverFraction * 100}%` }"
      />
      <span
        class="pointer-events-none absolute -top-7 -translate-x-1/2 rounded-sm border border-border bg-popover px-1.5 py-0.5 font-mono text-[10px] text-popover-foreground tabular-nums"
        :style="{ left: `${hoverFraction * 100}%` }"
      >
        {{ tooltip }}
      </span>
    </template>
  </div>
</template>
