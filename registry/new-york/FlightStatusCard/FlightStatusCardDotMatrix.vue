<script setup lang="ts">
import { motion } from 'motion-v';
import { DOT_MATRIX } from './dot-matrix-data';
import { cn } from '~/lib/utils';

const props = withDefaults(
  defineProps<{
    text: string;
    dotSize?: number;
    gap?: number;
    charGap?: number;
    activeColor?: string;
    inactiveColor?: string;
    class?: string;
  }>(),
  {
    dotSize: 4,
    gap: 2,
    charGap: 8,
    activeColor: '#b4f54e',
    inactiveColor: 'rgba(180, 245, 78, 0.1)',
    class: '',
  },
);

const chars = computed(() => props.text.split(''));

function getMatrix(char: string) {
  return DOT_MATRIX[char.toUpperCase()] ?? DOT_MATRIX['A']!;
}

function charWidth(dotSize: number, gap: number) {
  return 5 * dotSize + 4 * gap;
}

function charHeight(dotSize: number, gap: number) {
  return 7 * dotSize + 6 * gap;
}
</script>

<template>
  <div :class="cn('flex items-center', props.class)" :style="{ gap: `${charGap}px` }">
    <svg
      v-for="(char, charIndex) in chars"
      :key="charIndex"
      :width="charWidth(dotSize, gap)"
      :height="charHeight(dotSize, gap)"
      :viewBox="`0 0 ${charWidth(dotSize, gap)} ${charHeight(dotSize, gap)}`"
    >
      <template v-for="(row, rowIndex) in getMatrix(char)" :key="rowIndex">
        <component
          :is="motion.rect"
          v-for="(cell, colIndex) in row"
          :key="`${rowIndex}-${colIndex}`"
          :x="colIndex * (dotSize + gap)"
          :y="rowIndex * (dotSize + gap)"
          :width="dotSize"
          :height="dotSize"
          :rx="dotSize / 2"
          :ry="dotSize / 2"
          :fill="cell ? activeColor : inactiveColor"
          :initial="{ opacity: 0 }"
          :animate="{ opacity: 1 }"
          :transition="{ delay: charIndex * 0.1 + colIndex * 0.05 + rowIndex * 0.05, duration: 0.2 }"
          :style="cell ? { filter: 'drop-shadow(0 0 3px rgba(180, 245, 78, 0.6))' } : {}"
        />
      </template>
    </svg>
  </div>
</template>
