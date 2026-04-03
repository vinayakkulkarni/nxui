<script setup lang="ts">
  import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
  import { useEventListener } from '@vueuse/core';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      items?: Array<string>;
      gradientColor?: string;
      class?: string;
    }>(),
    {
      items: () => [],
      gradientColor: 'black',
      class: '',
    },
  );

  const TOTAL_ITEMS = 28;
  const ROWS = 4;
  const COLS = 7;

  const combinedItems = computed(() => {
    const defaults = Array.from(
      { length: TOTAL_ITEMS },
      (_, i) => `Item ${i + 1}`,
    );
    return props.items.length > 0
      ? props.items.slice(0, TOTAL_ITEMS)
      : defaults;
  });

  const rowRefs = ref<Array<HTMLDivElement | null>>([]);
  const mouseX = ref(typeof window !== 'undefined' ? window.innerWidth / 2 : 0);
  const rowPositions = ref<number[]>([0, 0, 0, 0]);

  let animationId = 0;

  const inertiaFactors = [0.6, 0.4, 0.3, 0.2];
  const MAX_MOVE = 300;
  const EASE_SPEED = 0.08;

  useEventListener('mousemove', (e: MouseEvent) => {
    mouseX.value = e.clientX;
  });

  function isImageUrl(content: string): boolean {
    return content.startsWith('http');
  }

  function getRows() {
    const rows: string[][] = [];
    for (let r = 0; r < ROWS; r++) {
      const row: string[] = [];
      for (let c = 0; c < COLS; c++) {
        row.push(combinedItems.value[r * COLS + c] ?? '');
      }
      rows.push(row);
    }
    return rows;
  }

  onMounted(() => {
    function update() {
      animationId = requestAnimationFrame(update);
      const w = window.innerWidth;
      if (w === 0) return;

      for (let i = 0; i < ROWS; i++) {
        const direction = i % 2 === 0 ? 1 : -1;
        const target =
          ((mouseX.value / w) * MAX_MOVE - MAX_MOVE / 2) * direction;
        const factor =
          EASE_SPEED / (1 + inertiaFactors[i % inertiaFactors.length]);
        rowPositions.value[i] += (target - rowPositions.value[i]) * factor;

        const row = rowRefs.value[i];
        if (row) {
          row.style.transform = `translateX(${rowPositions.value[i]}px)`;
        }
      }
    }
    animationId = requestAnimationFrame(update);
  });

  onBeforeUnmount(() => {
    cancelAnimationFrame(animationId);
  });
</script>

<template>
  <div :class="cn('size-full overflow-hidden', $props.class)">
    <section
      class="relative flex size-full items-center justify-center overflow-hidden"
      :style="{
        background: `radial-gradient(circle, ${props.gradientColor} 0%, transparent 100%)`,
      }"
    >
      <div
        class="relative z-[2] grid w-[150vw] flex-none origin-center -rotate-15 grid-rows-4 gap-4"
        style="height: 150vh"
      >
        <div
          v-for="(row, rowIndex) in getRows()"
          :key="rowIndex"
          :ref="
            (el) => {
              rowRefs[rowIndex] = el as HTMLDivElement | null;
            }
          "
          class="grid grid-cols-7 gap-4 will-change-transform"
        >
          <div
            v-for="(content, itemIndex) in row"
            :key="itemIndex"
            class="relative"
          >
            <div
              class="relative flex size-full items-center justify-center overflow-hidden rounded-[10px] bg-[#111] text-2xl text-white"
            >
              <div
                v-if="isImageUrl(content)"
                class="absolute inset-0 bg-cover bg-center"
                :style="{ backgroundImage: `url(${content})` }"
              ></div>
              <div v-else class="relative z-[1] p-4 text-center">
                {{ content }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
