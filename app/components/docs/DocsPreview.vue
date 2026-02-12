<script setup lang="ts">
  withDefaults(
    defineProps<{
      class?: string;
    }>(),
    {
      class: '',
    },
  );
</script>

<template>
  <div
    class="flex min-h-[350px] items-center justify-center rounded-lg border bg-background p-10"
    :class="$props.class"
  >
    <slot />
  </div>
</template>
