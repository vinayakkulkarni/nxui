<script setup lang="ts">
  import { cn } from '~/lib/utils';
  import ScrollBasedVelocityRow from './ScrollBasedVelocityRow.vue';

  const props = withDefaults(
    defineProps<{
      text: string;
      defaultVelocity?: number;
      class?: string;
      repeats?: number;
    }>(),
    {
      defaultVelocity: 5,
      class: '',
      repeats: 8,
    },
  );
</script>

<template>
  <section class="relative w-full">
    <ScrollBasedVelocityRow
      :text="text"
      :base-velocity="defaultVelocity"
      :class="cn('font-display text-center text-4xl font-bold tracking-[-0.02em] text-foreground drop-shadow-sm md:text-7xl md:leading-[5rem]', props.class)"
      :repeats="repeats"
    />
    <ScrollBasedVelocityRow
      :text="text"
      :base-velocity="-defaultVelocity"
      :class="cn('font-display text-center text-4xl font-bold tracking-[-0.02em] text-foreground drop-shadow-sm md:text-7xl md:leading-[5rem]', props.class)"
      :repeats="repeats"
    />
  </section>
</template>
