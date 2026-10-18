<script setup lang="ts">
  import { cn } from '~/lib/utils';
  import type { HoverTransitionFallbackProps } from './types';

  const props = withDefaults(defineProps<HoverTransitionFallbackProps>(), {
    hover: false,
  });
</script>

<template>
  <div
    :class="
      cn(
        'relative flex size-full min-h-64 flex-col justify-between overflow-hidden p-5 text-white',
        props.hover
          ? 'bg-[radial-gradient(circle_at_75%_20%,#dfff63_0,transparent_26%),linear-gradient(145deg,#292929,#080808)]'
          : 'bg-[radial-gradient(circle_at_20%_15%,#4f5dff_0,transparent_30%),linear-gradient(145deg,#1d2230,#07080b)]',
      )
    "
  >
    <div
      class="flex items-center gap-2 font-mono text-xs tracking-[0.18em] text-white/70 uppercase"
    >
      <span class="size-2 bg-[#dfff63]" />
      {{ props.hover ? 'Hover' : 'Default' }}
    </div>
    <div>
      <p class="text-3xl font-medium tracking-[-0.04em]">
        {{ props.hover ? 'New perspective' : 'Hover this card' }}
      </p>
      <p class="mt-1 text-sm text-white/60">Hover Transition</p>
    </div>
  </div>
</template>
