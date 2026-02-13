<script setup lang="ts">
  const props = withDefaults(
    defineProps<{
      class?: string;
    }>(),
    { class: '' },
  );
</script>

<template>
  <div
    class="not-prose relative my-6 flex min-h-[350px] w-full items-center justify-center overflow-hidden rounded-xl border bg-background p-6"
    :class="props.class"
  >
    <slot ></slot>
  </div>
</template>
