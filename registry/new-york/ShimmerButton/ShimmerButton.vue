<script setup lang="ts">
  import { cn } from '~/lib/utils';

  withDefaults(
    defineProps<{
      shimmerColor?: string;
      shimmerSize?: string;
      shimmerDuration?: string;
      background?: string;
      class?: string;
    }>(),
    {
      shimmerColor: '#ffffff',
      shimmerSize: '0.05em',
      shimmerDuration: '3s',
      background: 'rgba(0, 0, 0, 1)',
      class: '',
    },
  );
</script>

<template>
  <button
    :class="cn(
      'group relative inline-flex h-10 cursor-pointer items-center justify-center overflow-hidden whitespace-nowrap rounded-md border border-white/5 px-6 py-2 text-sm font-medium text-white shadow-2xl transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-[0_0_40px_8px_rgba(62,61,117,0.3)] dark:bg-[rgba(255,255,255,0.1)]',
      $props.class,
    )"
    :style="{
      '--shimmer-color': shimmerColor,
      '--shimmer-size': shimmerSize,
      '--shimmer-duration': shimmerDuration,
      '--bg': background,
    }"
  >
    <span
      class="absolute inset-0 overflow-hidden rounded-[inherit]"
      :style="{ background: 'var(--bg)' }"
    >
      <span
        class="absolute inset-[-100%] animate-[shimmer-slide_var(--shimmer-duration)_ease-in-out_infinite]"
        :style="{
          background: `conic-gradient(from 0deg, transparent 0%, var(--shimmer-color) 10%, transparent 20%)`,
        }"
      />
    </span>
    <span
      class="absolute inset-[var(--shimmer-size)] rounded-[inherit] bg-[var(--bg)]"
    />
    <span class="relative z-10">
      <slot>Shimmer Button</slot>
    </span>
  </button>
</template>

<style scoped>
  @keyframes shimmer-slide {
    to {
      transform: rotate(360deg);
    }
  }
</style>
