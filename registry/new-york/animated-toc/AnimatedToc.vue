<script setup lang="ts">
  // Animated table of contents: a single SVG rail snakes through the
  // indentation levels, and a dot glides along the curve to the active
  // entry while the traveled portion of the path darkens.
  // Inspired by the "Clean table of contents" by @AliGrids / @raul_dronca.
  import { ref, computed, watch, onMounted } from 'vue';
  import { useRafFn } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import type { AnimatedTocProps } from './types';

  const props = withDefaults(defineProps<AnimatedTocProps>(), {
    rowHeight: 48,
    indent: 24,
    title: 'On this page',
    class: '',
  });

  const active = defineModel<number>({ default: 0 });

  const emit = defineEmits<{
    select: [index: number];
  }>();

  const RAIL_X = 8;
  const CORNER = 12;

  const xOf = (i: number) =>
    RAIL_X + (props.items[i]?.depth ?? 0) * props.indent;
  const yOf = (i: number) => i * props.rowHeight + props.rowHeight / 2;

  const svgWidth = computed(
    () =>
      RAIL_X +
      Math.max(...props.items.map((it) => it.depth ?? 0)) * props.indent +
      10,
  );
  const svgHeight = computed(() => props.items.length * props.rowHeight);

  // Rail path: vertical runs connected by rounded S-bends where depth changes.
  const railPath = computed(() => {
    if (props.items.length === 0) return '';
    let d = `M ${xOf(0)} ${yOf(0)}`;
    for (let i = 1; i < props.items.length; i++) {
      const x0 = xOf(i - 1);
      const x1 = xOf(i);
      const y1 = yOf(i);
      if (x0 === x1) {
        d += ` L ${x1} ${y1}`;
      } else {
        const midY = yOf(i - 1) + props.rowHeight / 2;
        const dir = x1 > x0 ? 1 : -1;
        const sweep0 = dir === 1 ? 0 : 1;
        const sweep1 = dir === 1 ? 1 : 0;
        d += ` L ${x0} ${midY - CORNER}`;
        d += ` A ${CORNER} ${CORNER} 0 0 ${sweep0} ${x0 + CORNER * dir} ${midY}`;
        d += ` L ${x1 - CORNER * dir} ${midY}`;
        d += ` A ${CORNER} ${CORNER} 0 0 ${sweep1} ${x1} ${midY + CORNER}`;
        d += ` L ${x1} ${y1}`;
      }
    }
    return d;
  });

  const pathEl = ref<SVGPathElement | null>(null);
  const totalLen = ref(0);
  const rowLens = ref<number[]>([]);

  // Map each row to its arc length along the rail (y is monotonic).
  function measure() {
    const path = pathEl.value;
    if (!path) return;
    totalLen.value = path.getTotalLength();
    rowLens.value = props.items.map((_, i) => {
      const targetY = yOf(i);
      let lo = 0;
      let hi = totalLen.value;
      for (let step = 0; step < 24; step++) {
        const mid = (lo + hi) / 2;
        if (path.getPointAtLength(mid).y < targetY) lo = mid;
        else hi = mid;
      }
      return (lo + hi) / 2;
    });
  }

  onMounted(measure);
  watch([railPath, () => props.rowHeight], () => measure(), { flush: 'post' });

  // Spring-glide the dot's arc length toward the active row.
  const dotLen = ref(0);
  const dotVel = ref(0);
  const dot = ref({ x: RAIL_X, y: props.rowHeight / 2 });

  const { resume, pause } = useRafFn(
    ({ delta }) => {
      const path = pathEl.value;
      const target = rowLens.value[active.value] ?? 0;
      const dt = Math.min(delta / 1000, 1 / 30);
      const accel = 180 * (target - dotLen.value) - 26 * dotVel.value;
      dotVel.value += accel * dt;
      dotLen.value += dotVel.value * dt;
      if (path) {
        const p = path.getPointAtLength(
          Math.min(Math.max(dotLen.value, 0), totalLen.value),
        );
        dot.value = { x: p.x, y: p.y };
      }
      if (
        Math.abs(dotLen.value - target) < 0.25 &&
        Math.abs(dotVel.value) < 0.5
      ) {
        dotLen.value = target;
        dotVel.value = 0;
        pause();
      }
    },
    { immediate: false },
  );

  watch([active, rowLens], () => resume(), { flush: 'post' });

  function select(index: number) {
    active.value = index;
    emit('select', index);
  }

  const progressOffset = computed(() =>
    Math.max(totalLen.value - dotLen.value, 0),
  );
</script>

<template>
  <nav :class="cn('w-full max-w-xs select-none', props.class)">
    <p
      v-if="title"
      class="mb-3 flex items-center gap-2 text-xs font-semibold tracking-widest text-muted-foreground uppercase"
    >
      <Icon name="lucide:file-text" class="size-4" />
      {{ title }}
    </p>

    <div class="relative flex">
      <svg
        class="shrink-0"
        :width="svgWidth"
        :height="svgHeight"
        :viewBox="`0 0 ${svgWidth} ${svgHeight}`"
        aria-hidden="true"
      >
        <!-- Base rail -->
        <path
          ref="pathEl"
          :d="railPath"
          fill="none"
          class="stroke-border"
          stroke-width="2"
          stroke-linecap="round"
        />
        <!-- Traveled portion -->
        <path
          :d="railPath"
          fill="none"
          class="stroke-foreground/60"
          stroke-width="2"
          stroke-linecap="round"
          :stroke-dasharray="totalLen"
          :stroke-dashoffset="progressOffset"
        />
        <!-- Traveling dot -->
        <circle :cx="dot.x" :cy="dot.y" r="5" class="fill-foreground" />
      </svg>

      <ul class="min-w-0 flex-1">
        <li
          v-for="(item, i) in items"
          :key="item.label"
          :style="{ height: `${rowHeight}px` }"
        >
          <a
            :href="item.href"
            class="flex h-full cursor-pointer items-center text-base transition-colors duration-300"
            :class="[
              i === active
                ? 'font-semibold text-foreground'
                : 'text-muted-foreground hover:text-foreground/80',
            ]"
            :style="{ paddingLeft: `${16 + (item.depth ?? 0) * indent}px` }"
            @click="select(i)"
          >
            {{ item.label }}
          </a>
        </li>
      </ul>
    </div>
  </nav>
</template>
