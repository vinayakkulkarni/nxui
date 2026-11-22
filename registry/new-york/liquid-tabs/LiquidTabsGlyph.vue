<script setup lang="ts">
  import type { LiquidTabsGlyphProps } from './types';

  withDefaults(defineProps<LiquidTabsGlyphProps>(), { size: 18 });
</script>

<template>
  <!-- the domed "badge" glyph -->
  <svg
    v-if="name === 'dome'"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path
      d="M4 11.2C4 6.67 7.58 3.5 12 3.5s8 3.17 8 7.7v7.3a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7.3Z"
    />
  </svg>
  <!-- a solid shield with an inset outline -->
  <svg
    v-else-if="name === 'shield-outline'"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M12 2.5 19.5 5.6v5.9c0 4.6-3.1 8.3-7.5 10-4.4-1.7-7.5-5.4-7.5-10V5.6L12 2.5Z"
      fill="currentColor"
    />
    <path
      d="M12 6.6 16 8.3v3.3c0 2.5-1.6 4.5-4 5.6-2.4-1.1-4-3.1-4-5.6V8.3l4-1.7Z"
      stroke="var(--pltabs-icon-inset)"
      stroke-width="1.8"
      stroke-linejoin="round"
    />
  </svg>
  <!-- a rounded shield with a small notch -->
  <svg
    v-else
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M12 3c3 0 7.5 1.2 7.5 3.4v5c0 5.2-4.4 9.6-7.5 9.6s-7.5-4.4-7.5-9.6v-5C4.5 4.2 9 3 12 3Z"
      fill="currentColor"
    />
    <path
      d="M10 6.2a2 2 0 0 1 4 0v1.3h-4V6.2Z"
      fill="var(--pltabs-icon-inset)"
    />
  </svg>
</template>
