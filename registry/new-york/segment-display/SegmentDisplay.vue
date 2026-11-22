<script setup lang="ts">
  import { computed, useId } from 'vue';
  import { cn } from '~/lib/utils';
  import { SEGMENT_NAMES, SEGMENT_POINTS, toCells } from './segment-display';
  import type { SegmentDisplayProps } from './types';

  const props = withDefaults(defineProps<SegmentDisplayProps>(), {
    digits: 0,
    color: 'currentColor',
    ghost: 0.12,
    glow: true,
    slant: 6,
    label: undefined,
    class: '',
  });

  // Each digit cell is 12 wide; the gap between cells is 3.5. Colons are 5 wide.
  const CELL = 12;
  const GAP = 3.5;
  const COLON = 5;

  const cells = computed(() => toCells(String(props.value), props.digits));

  const layout = computed(() => {
    let x = 0;
    return cells.value.map((cell) => {
      const at = x;
      x += (cell.colon ? COLON : CELL) + GAP;
      return { cell, x: at };
    });
  });

  // Slant shifts the top of each cell right, so widen the box to fit it.
  const lean = computed(() => Math.tan((props.slant * Math.PI) / 180) * 20);
  const width = computed(() => {
    const last = layout.value.at(-1);
    if (!last) return CELL;
    return last.x + (last.cell.colon ? COLON : CELL) + 2 + lean.value;
  });

  const filterId = `segment-glow-${useId()}`;
  const accessible = computed(() => props.label ?? String(props.value));
</script>

<template>
  <svg
    :class="cn('inline-block h-[1em] w-auto overflow-visible', props.class)"
    :viewBox="`0 0 ${width} 20`"
    role="img"
    :aria-label="accessible"
    :style="{ color: props.color }"
  >
    <defs v-if="props.glow">
      <filter :id="filterId" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="0.9" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    <g :transform="`translate(${lean} 0) skewX(${-props.slant})`">
      <g
        v-for="(item, i) in layout"
        :key="i"
        :transform="`translate(${item.x} 0)`"
      >
        <template v-if="item.cell.colon">
          <circle cx="2.5" cy="6.5" r="1.3" fill="currentColor" />
          <circle cx="2.5" cy="14" r="1.3" fill="currentColor" />
        </template>
        <template v-else>
          <polygon
            v-for="name in SEGMENT_NAMES"
            :key="name"
            :points="SEGMENT_POINTS[name]"
            fill="currentColor"
            :opacity="item.cell.lit.has(name) ? 1 : props.ghost"
            :filter="
              props.glow && item.cell.lit.has(name)
                ? `url(#${filterId})`
                : undefined
            "
            class="transition-opacity duration-150 motion-reduce:transition-none"
          />
          <circle
            cx="14.2"
            cy="18"
            r="1.2"
            fill="currentColor"
            :opacity="item.cell.dot ? 1 : 0"
          />
        </template>
      </g>
    </g>
  </svg>
</template>
