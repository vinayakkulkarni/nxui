<script setup lang="ts">
  import type { Testimonial } from './types';
  import { cn } from '~/lib/utils';
  import TestimonialMarqueeRow from './TestimonialMarqueeRow.vue';
  import TestimonialMarqueeCard from './TestimonialMarqueeCard.vue';

  const props = withDefaults(
    defineProps<{
      items: Testimonial[];
      variant?: 'default' | 'dual' | 'flush';
      speed?: number;
      pauseOnHover?: boolean;
      class?: string;
    }>(),
    {
      variant: 'default',
      speed: 30,
      pauseOnHover: true,
      class: '',
    },
  );

  // Ensure enough items for smooth loop
  const displayItems = computed(() => {
    let result = [...props.items];
    while (result.length < 10) {
      result = [...result, ...props.items];
    }
    return result;
  });

  const firstHalf = computed(() =>
    displayItems.value.slice(0, Math.ceil(displayItems.value.length / 2)),
  );
  const secondHalf = computed(() =>
    displayItems.value.slice(Math.ceil(displayItems.value.length / 2)),
  );
</script>

<template>
  <!-- Dual row variant -->
  <div
    v-if="variant === 'dual'"
    :class="cn('flex flex-col gap-4 overflow-hidden py-8', props.class)"
  >
    <TestimonialMarqueeRow
      :speed="speed"
      direction="left"
      :pause-on-hover="pauseOnHover"
    >
      <TestimonialMarqueeCard
        v-for="(item, i) in firstHalf"
        :key="`r1-${i}`"
        :item="item"
      />
    </TestimonialMarqueeRow>
    <TestimonialMarqueeRow
      :speed="speed"
      direction="right"
      :pause-on-hover="pauseOnHover"
    >
      <TestimonialMarqueeCard
        v-for="(item, i) in secondHalf"
        :key="`r2-${i}`"
        :item="item"
      />
    </TestimonialMarqueeRow>
  </div>

  <!-- Flush variant -->
  <div
    v-else-if="variant === 'flush'"
    :class="cn('overflow-hidden py-8', props.class)"
  >
    <TestimonialMarqueeRow
      :speed="speed"
      direction="left"
      :pause-on-hover="pauseOnHover"
      class="[--gap:0]"
    >
      <TestimonialMarqueeCard
        v-for="(item, i) in displayItems"
        :key="`f-${i}`"
        :item="item"
        variant="flush"
      />
    </TestimonialMarqueeRow>
  </div>

  <!-- Default single row -->
  <div v-else :class="cn('overflow-hidden py-8', props.class)">
    <TestimonialMarqueeRow
      :speed="speed"
      direction="left"
      :pause-on-hover="pauseOnHover"
    >
      <TestimonialMarqueeCard
        v-for="(item, i) in displayItems"
        :key="`d-${i}`"
        :item="item"
      />
    </TestimonialMarqueeRow>
  </div>
</template>
