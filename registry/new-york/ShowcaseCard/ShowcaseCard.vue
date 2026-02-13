<script setup lang="ts">
  import { useMouseInElement } from '@vueuse/core';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      class?: string;
    }>(),
    {
      class: '',
    },
  );

  const cardRef = ref<HTMLElement>();
  const { elementX, elementY, isOutside } = useMouseInElement(cardRef);

  const rotateX = computed(() => {
    if (isOutside.value || !cardRef.value) return 0;
    const rect = cardRef.value.getBoundingClientRect();
    return -((elementY.value - rect.height / 2) / rect.height) * 8;
  });

  const rotateY = computed(() => {
    if (isOutside.value || !cardRef.value) return 0;
    const rect = cardRef.value.getBoundingClientRect();
    return ((elementX.value - rect.width / 2) / rect.width) * 8;
  });

  const cardStyle = computed(() => ({
    transform: `perspective(1000px) rotateX(${rotateX.value}deg) rotateY(${rotateY.value}deg)`,
    transition: isOutside.value ? 'transform 0.5s ease-out' : 'transform 0.1s ease-out',
  }));
</script>

<template>
  <div
    ref="cardRef"
    :class="cn(
      'rounded-xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-lg',
      props.class,
    )"
    :style="cardStyle"
  >
    <slot ></slot>
  </div>
</template>
