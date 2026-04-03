<script setup lang="ts">
  import { computed } from 'vue';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      text: string;
      radius?: number;
      fontSize?: number;
      spin?: boolean;
      spinDuration?: number;
      class?: string;
    }>(),
    {
      radius: 80,
      fontSize: 14,
      spin: true,
      spinDuration: 20,
      class: '',
    },
  );

  const characters = computed(() => props.text.split(''));

  const anglePerChar = computed(() => 360 / characters.value.length);

  const containerSize = computed(() => props.radius * 2 + props.fontSize * 2);
</script>

<template>
  <div
    :class="cn('relative inline-flex items-center justify-center', props.class)"
    :style="{
      width: `${containerSize}px`,
      height: `${containerSize}px`,
    }"
  >
    <div
      class="absolute inset-0"
      :class="spin && 'animate-[spin_var(--spin-duration)_linear_infinite]'"
      :style="{ '--spin-duration': `${spinDuration}s` }"
    >
      <span
        v-for="(char, i) in characters"
        :key="i"
        class="absolute left-1/2 top-0 origin-[0_var(--radius)] font-medium text-foreground"
        :style="{
          '--radius': `${radius}px`,
          fontSize: `${fontSize}px`,
          transform: `rotate(${i * anglePerChar}deg)`,
          transformOrigin: `0 ${radius + fontSize / 2}px`,
        }"
      >
        {{ char }}
      </span>
    </div>
  </div>
</template>
