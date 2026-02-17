<script setup lang="ts">
  import { cn } from '~/lib/utils';

  withDefaults(
    defineProps<{
      align?: 'center' | 'start' | 'end';
      class?: string;
    }>(),
    { align: 'center' },
  );
</script>

<template>
  <div
    :class="
      cn(
        'preview flex min-h-[350px] w-full justify-center p-10 rounded-t-xl border border-border bg-muted/30 dark:bg-[#0A0A0A] overflow-x-auto relative',
        align === 'center' && 'items-center',
        align === 'start' && 'items-start',
        align === 'end' && 'items-end',
        $props.class,
      )
    "
  >
    <div class="min-w-fit">
      <slot></slot>
    </div>
  </div>
</template>
