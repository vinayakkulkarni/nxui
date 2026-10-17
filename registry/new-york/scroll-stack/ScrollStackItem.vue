<script setup lang="ts">
  import { cn } from '~/lib/utils';
  import type { ScrollStackItemProps } from './types';

  const props = withDefaults(defineProps<ScrollStackItemProps>(), {
    class: '',
  });
</script>

<template>
  <div
    :class="
      cn(
        'scroll-stack-card relative box-border [--scroll-stack-dim:0] h-80 w-full origin-top rounded-[28px] bg-card p-10 text-card-foreground shadow-[0_0_0_1px_rgb(0_0_0/0.06),0_-12px_40px_-16px_rgb(0_0_0/0.35),0_24px_48px_-24px_rgb(0_0_0/0.4)] will-change-transform dark:shadow-[0_0_0_1px_rgb(255_255_255/0.08),0_-12px_40px_-16px_rgb(0_0_0/0.35),0_24px_48px_-24px_rgb(0_0_0/0.4)]',
        props.class,
      )
    "
  >
    <slot />
    <span
      class="pointer-events-none absolute inset-0 rounded-[inherit] bg-black opacity-(--scroll-stack-dim)"
      aria-hidden="true"
    />
  </div>
</template>
