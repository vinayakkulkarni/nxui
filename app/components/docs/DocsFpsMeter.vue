<script setup lang="ts">
  import { useFps } from '@vueuse/core';

  const { showFps } = useFpsMeter();
  const fps = useFps({ every: 10 });

  // Color the readout by health: green ≥50, amber ≥30, red below.
  const tone = computed(() => {
    if (fps.value >= 50) return 'text-emerald-400';
    if (fps.value >= 30) return 'text-amber-400';
    return 'text-red-400';
  });
</script>

<template>
  <ClientOnly>
    <div
      v-if="showFps"
      class="pointer-events-none absolute left-4 top-4 z-20 flex items-center gap-1.5 rounded-md border border-border/60 bg-background/70 px-2.5 py-1 font-mono text-xs tabular-nums backdrop-blur-sm"
      role="status"
      aria-label="Frames per second"
    >
      <span :class="['font-semibold', tone]">{{ fps }}</span>
      <span class="text-muted-foreground">FPS</span>
    </div>
  </ClientOnly>
</template>
