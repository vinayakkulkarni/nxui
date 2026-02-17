<script setup lang="ts">
  import { cn } from '~/lib/utils';

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
  <button
    :class="cn(
      'group relative cursor-pointer overflow-hidden rounded-full border bg-background px-6 py-2 text-center font-semibold',
      $props.class,
    )"
  >
    <span
      class="relative z-10 inline-block translate-x-1 text-foreground transition-all duration-300 group-hover:translate-x-12 group-hover:opacity-0"
    >
      <slot>Hover Me</slot>
    </span>
    <div
      class="absolute inset-0 z-10 flex -translate-x-full items-center justify-center gap-2 text-primary-foreground transition-all duration-300 group-hover:translate-x-0"
    >
      <Icon name="lucide:arrow-right" class="size-4" />
      <slot name="hover">
        <slot>Hover Me</slot>
      </slot>
    </div>
    <span
      class="absolute inset-0 z-0 scale-x-0 rounded-full bg-primary transition-transform duration-300 group-hover:scale-x-100"
    ></span>
  </button>
</template>
