<script setup lang="ts">
  import { cn } from '~/lib/utils';

  withDefaults(
    defineProps<{
      shimmerColor?: string;
      shimmerSize?: string;
      shimmerDuration?: string;
      borderRadius?: string;
      background?: string;
      class?: string;
    }>(),
    {
      shimmerColor: '#ffffff',
      shimmerSize: '0.05em',
      shimmerDuration: '3s',
      borderRadius: '100px',
      background: 'var(--primary)',
      class: '',
    },
  );
</script>

<template>
  <button
    :class="cn(
      'group relative z-0 inline-flex h-11 cursor-pointer items-center justify-center overflow-hidden whitespace-nowrap px-6 py-2 text-sm font-medium text-primary-foreground transition-all duration-300 ease-[cubic-bezier(0.6,0.6,0,1)] hover:scale-105 active:scale-95',
      $props.class,
    )"
    :style="{ borderRadius }"
  >
    <!-- spark container -->
    <span
      class="absolute inset-0 overflow-hidden"
      :style="{ borderRadius }"
    >
      <span
        class="absolute inset-0"
        :style="{ background }"
      />
      <span
        class="absolute inset-[-100%] animate-[shimmer-spin_var(--shimmer-duration)_linear_infinite]"
        :style="{
          '--shimmer-duration': shimmerDuration,
          background: `conic-gradient(from 0deg, transparent 0 340deg, ${shimmerColor} 360deg)`,
        }"
      />
    </span>

    <!-- backdrop -->
    <span
      class="absolute overflow-hidden"
      :style="{
        inset: shimmerSize,
        borderRadius,
        background,
      }"
    />

    <!-- content -->
    <span class="relative z-10 flex items-center gap-2">
      <slot>Shimmer Button</slot>
    </span>

    <!-- highlight -->
    <span
      class="absolute left-1/2 top-0 h-px w-3/4 -translate-x-1/2 opacity-70"
      :style="{
        background: `linear-gradient(90deg, transparent, ${shimmerColor}40, transparent)`,
      }"
    />
  </button>
</template>

<style scoped>
  @keyframes shimmer-spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
