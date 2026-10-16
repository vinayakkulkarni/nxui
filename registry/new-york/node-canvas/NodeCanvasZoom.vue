<script setup lang="ts">
  import { computed } from 'vue';
  import type { NodeCanvasZoomProps } from './types';

  const props = defineProps<NodeCanvasZoomProps>();

  const emit = defineEmits<{ zoomIn: []; zoomOut: []; reset: [] }>();

  const percent = computed(() => Math.round(props.zoom * 100));

  function onZoomIn(): void {
    emit('zoomIn');
  }

  function onZoomOut(): void {
    emit('zoomOut');
  }

  function onReset(): void {
    emit('reset');
  }
</script>

<template>
  <div
    role="group"
    aria-label="Zoom"
    class="flex items-center gap-1 rounded-2xl border bg-card/95 p-1 shadow-lg backdrop-blur-sm"
    @pointerdown.stop
  >
    <button
      type="button"
      aria-label="Zoom out"
      :disabled="props.zoom <= props.minZoom"
      class="grid size-7 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-40"
      @click="onZoomOut"
    >
      <Icon name="lucide:minus" class="size-3.5" />
    </button>
    <button
      type="button"
      aria-label="Reset zoom to 100%"
      class="flex h-7 min-w-14 items-center justify-center gap-1.5 rounded-xl bg-muted px-2.5 text-sm text-foreground tabular-nums focus-visible:outline-2 focus-visible:outline-ring"
      @click="onReset"
    >
      <span aria-live="polite" data-zoom-label>{{ percent }}</span>
      <span>%</span>
    </button>
    <button
      type="button"
      aria-label="Zoom in"
      :disabled="props.zoom >= props.maxZoom"
      class="grid size-7 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-40"
      @click="onZoomIn"
    >
      <Icon name="lucide:plus" class="size-3.5" />
    </button>
  </div>
</template>
