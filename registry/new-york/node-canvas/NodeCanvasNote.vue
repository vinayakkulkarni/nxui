<script setup lang="ts">
  import type { NodeCanvasNoteProps } from './types';

  const props = withDefaults(defineProps<NodeCanvasNoteProps>(), {
    class: '',
  });
</script>

<template>
  <p
    :class="[
      'size-full rounded-xl bg-[#f5d03b] px-3.5 py-3 text-sm/snug font-medium text-neutral-900 shadow-[0_8px_20px_rgb(0_0_0/0.25)]',
      props.class,
    ]"
  >
    {{ props.text }}
  </p>
</template>
