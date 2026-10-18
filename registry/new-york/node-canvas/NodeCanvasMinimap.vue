<script setup lang="ts">
  import { computed, useTemplateRef } from 'vue';
  import { unionRect } from './node-canvas-geometry';
  import type {
    NodeCanvasMinimapProps,
    NodeCanvasPoint,
    NodeCanvasRect,
  } from './types';

  const props = defineProps<NodeCanvasMinimapProps>();

  const emit = defineEmits<{ navigate: [point: NodeCanvasPoint] }>();

  const WIDTH = 64;
  const HEIGHT = 40;
  const PAD = 4;

  const bounds = computed(() => unionRect([...props.items, props.viewport]));

  const scale = computed(() =>
    Math.min(
      (WIDTH - PAD * 2) / bounds.value.width,
      (HEIGHT - PAD * 2) / bounds.value.height,
    ),
  );

  const offset = computed(() => ({
    x: (WIDTH - bounds.value.width * scale.value) / 2,
    y: (HEIGHT - bounds.value.height * scale.value) / 2,
  }));

  function project(rect: NodeCanvasRect): NodeCanvasRect {
    return {
      x: offset.value.x + (rect.x - bounds.value.x) * scale.value,
      y: offset.value.y + (rect.y - bounds.value.y) * scale.value,
      width: Math.max(2, rect.width * scale.value),
      height: Math.max(2, rect.height * scale.value),
    };
  }

  const frame = computed(() => project(props.viewport));

  const svg = useTemplateRef<SVGSVGElement>('svg');

  function onClick(event: MouseEvent): void {
    const box = svg.value?.getBoundingClientRect();
    // Keyboard activation has no pointer position: recenter on all nodes.
    if (!box || event.detail === 0) {
      const nodes = unionRect(props.items);
      emit('navigate', {
        x: nodes.x + nodes.width / 2,
        y: nodes.y + nodes.height / 2,
      });
      return;
    }
    const sx = ((event.clientX - box.left) / box.width) * WIDTH;
    const sy = ((event.clientY - box.top) / box.height) * HEIGHT;
    emit('navigate', {
      x: bounds.value.x + (sx - offset.value.x) / scale.value,
      y: bounds.value.y + (sy - offset.value.y) / scale.value,
    });
  }
</script>

<template>
  <button
    type="button"
    aria-label="Minimap. Click to move the view."
    class="block rounded-xl border bg-card/95 p-1 shadow-lg backdrop-blur-sm focus-visible:outline-2 focus-visible:outline-ring"
    @pointerdown.stop
    @click="onClick"
  >
    <svg ref="svg" :viewBox="`0 0 ${WIDTH} ${HEIGHT}`" class="block h-10 w-16">
      <rect
        v-for="item in props.items"
        :key="item.id"
        :data-minimap-id="item.id"
        v-bind="project(item)"
        rx="2"
        :fill="item.color"
      />
      <rect
        data-minimap-viewport
        v-bind="frame"
        rx="3"
        fill="none"
        class="stroke-foreground/70"
        stroke-width="1"
      />
    </svg>
  </button>
</template>
