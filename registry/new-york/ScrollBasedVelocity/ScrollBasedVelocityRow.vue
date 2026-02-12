<script setup lang="ts">
  import { useScroll, useRafFn } from '@vueuse/core';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      text: string;
      baseVelocity?: number;
      class?: string;
      repeats?: number;
    }>(),
    {
      baseVelocity: 5,
      class: '',
      repeats: 8,
    },
  );

  const baseX = ref(0);
  const directionFactor = ref(1);
  const { y: scrollY } = useScroll(window);
  const prevScrollY = ref(0);

  const x = computed(() => {
    const wrapped = ((baseX.value % 12.5) + 12.5) % 12.5 - 12.5;
    return `${wrapped}%`;
  });

  let lastTimestamp = 0;

  useRafFn(({ timestamp }) => {
    const delta = lastTimestamp ? timestamp - lastTimestamp : 16;
    lastTimestamp = timestamp;

    const scrollDelta = scrollY.value - prevScrollY.value;
    prevScrollY.value = scrollY.value;

    const velocityFactor = Math.min(Math.abs(scrollDelta) / 5, 5);

    if (scrollDelta < 0) {
      directionFactor.value = -1;
    } else if (scrollDelta > 0) {
      directionFactor.value = 1;
    }

    let moveBy =
      directionFactor.value * props.baseVelocity * (delta / 1000);
    moveBy += directionFactor.value * moveBy * velocityFactor;

    baseX.value += moveBy;
  });
</script>

<template>
  <div class="flex w-full flex-nowrap overflow-hidden whitespace-nowrap">
    <div
      :class="cn('flex whitespace-nowrap', props.class)"
      :style="{ transform: `translateX(${x})` }"
    >
      <span
        v-for="i in repeats"
        :key="i"
        class="mr-10 block last:mr-10"
      >
        {{ text }}
      </span>
    </div>
  </div>
</template>
