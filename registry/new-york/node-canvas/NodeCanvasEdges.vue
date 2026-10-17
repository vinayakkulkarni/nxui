<script setup lang="ts">
  import { useId } from 'vue';
  import type { NodeCanvasEdgesProps } from './types';

  const props = defineProps<NodeCanvasEdgesProps>();

  const uid = useId();
  const solidMarker = `${uid}-arrow-solid`;
  const dashedMarker = `${uid}-arrow-dashed`;

  function markerFor(variant: string, arrow: boolean): string | undefined {
    if (!arrow) return undefined;
    return `url(#${variant === 'solid' ? solidMarker : dashedMarker})`;
  }
</script>

<template>
  <svg
    aria-hidden="true"
    class="pointer-events-none absolute top-0 left-0 size-px overflow-visible"
  >
    <defs>
      <marker
        :id="solidMarker"
        viewBox="0 0 10 10"
        refX="9"
        refY="5"
        markerWidth="7"
        markerHeight="7"
        orient="auto-start-reverse"
        class="text-blue-500"
      >
        <path
          d="M 1 1 L 9 5 L 1 9"
          fill="none"
          stroke="currentColor"
          stroke-width="1.6"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </marker>
      <marker
        :id="dashedMarker"
        viewBox="0 0 10 10"
        refX="9"
        refY="5"
        markerWidth="7"
        markerHeight="7"
        orient="auto-start-reverse"
        class="text-muted-foreground"
      >
        <path
          d="M 1 1 L 9 5 L 1 9"
          fill="none"
          stroke="currentColor"
          stroke-width="1.6"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </marker>
    </defs>
    <g v-for="edge in props.paths" :key="edge.id" :data-edge-id="edge.id">
      <path
        :d="edge.d"
        fill="none"
        :class="
          edge.variant === 'solid'
            ? 'stroke-blue-500'
            : 'stroke-muted-foreground/70'
        "
        :stroke-width="edge.variant === 'solid' ? 1.75 : 1.4"
        :stroke-dasharray="edge.variant === 'dashed' ? '4 4' : undefined"
        stroke-linecap="round"
        :marker-end="markerFor(edge.variant, edge.arrow)"
      />
      <circle
        v-if="!edge.arrow"
        :cx="edge.end.x"
        :cy="edge.end.y"
        r="3"
        :class="
          edge.variant === 'solid'
            ? 'fill-blue-500'
            : 'fill-muted-foreground/80'
        "
      />
    </g>
  </svg>
</template>
