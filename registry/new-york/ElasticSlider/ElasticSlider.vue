<script setup lang="ts">
  import { ref, computed } from 'vue';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      defaultValue?: number;
      startingValue?: number;
      maxValue?: number;
      isStepped?: boolean;
      stepSize?: number;
      class?: string;
    }>(),
    {
      defaultValue: 50,
      startingValue: 0,
      maxValue: 100,
      isStepped: false,
      stepSize: 1,
      class: '',
    },
  );

  const emit = defineEmits<{ change: [value: number] }>();

  const MAX_OVERFLOW = 50;
  const value = ref(props.defaultValue);
  const sliderRef = ref<HTMLDivElement>();
  const region = ref<'left' | 'middle' | 'right'>('middle');
  const overflow = ref(0);
  const isHovered = ref(false);
  const isDragging = ref(false);

  function decay(val: number, max: number) {
    if (max === 0) return 0;
    const entry = val / max;
    const sigmoid = 2 * (1 / (1 + Math.exp(-entry)) - 0.5);
    return sigmoid * max;
  }

  function getRangePercent() {
    const total = props.maxValue - props.startingValue;
    if (total === 0) return 0;
    return ((value.value - props.startingValue) / total) * 100;
  }

  function handlePointerMove(e: PointerEvent) {
    if (e.buttons === 0 || !sliderRef.value) return;
    isDragging.value = true;
    const { left, right, width } = sliderRef.value.getBoundingClientRect();

    let newVal = props.startingValue + ((e.clientX - left) / width) * (props.maxValue - props.startingValue);
    if (props.isStepped) {
      newVal = Math.round(newVal / props.stepSize) * props.stepSize;
    }
    newVal = Math.min(Math.max(newVal, props.startingValue), props.maxValue);
    value.value = newVal;
    emit('change', newVal);

    // Overflow elastic
    if (e.clientX < left) {
      region.value = 'left';
      overflow.value = decay(left - e.clientX, MAX_OVERFLOW);
    } else if (e.clientX > right) {
      region.value = 'right';
      overflow.value = decay(e.clientX - right, MAX_OVERFLOW);
    } else {
      region.value = 'middle';
      overflow.value = 0;
    }
  }

  function handlePointerDown(e: PointerEvent) {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    handlePointerMove(e);
  }

  function handlePointerUp() {
    isDragging.value = false;
    overflow.value = 0;
    region.value = 'middle';
  }

  const scaleMultiplier = computed(() => (isHovered.value ? 1.2 : 1));

  const trackStyle = computed(() => {
    const scX = sliderRef.value ? 1 + overflow.value / sliderRef.value.getBoundingClientRect().width : 1;
    const scY = 1 - (overflow.value / MAX_OVERFLOW) * 0.2;
    const h = isHovered.value ? 12 : 6;
    return {
      transform: `scaleX(${scX}) scaleY(${scY})`,
      height: `${h}px`,
      transition: isDragging.value ? 'none' : 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), height 0.2s ease',
    };
  });

  const leftIconStyle = computed(() => ({
    transform: region.value === 'left' ? `translateX(${-overflow.value / scaleMultiplier.value}px)` : 'none',
    transition: 'transform 0.3s ease',
  }));

  const rightIconStyle = computed(() => ({
    transform: region.value === 'right' ? `translateX(${overflow.value / scaleMultiplier.value}px)` : 'none',
    transition: 'transform 0.3s ease',
  }));
</script>

<template>
  <div :class="cn('flex w-48 flex-col items-center justify-center gap-4', $props.class)">
    <div
      class="flex w-full touch-none select-none items-center justify-center gap-4"
      :style="{ transform: `scale(${scaleMultiplier})`, opacity: isHovered ? 1 : 0.7, transition: 'transform 0.2s ease, opacity 0.2s ease' }"
      @mouseenter="isHovered = true"
      @mouseleave="isHovered = false"
    >
      <div :style="leftIconStyle">
        <slot name="left-icon">
          <svg class="size-5 text-muted-foreground" viewBox="0 0 24 24" fill="currentColor"><path d="M13 7.22L9.6 10H6v4h3.6L13 16.78V7.22z" /></svg>
        </slot>
      </div>

      <div
        ref="sliderRef"
        class="relative flex grow cursor-grab touch-none select-none items-center py-4 active:cursor-grabbing"
        style="max-width: 200px"
        @pointermove="handlePointerMove"
        @pointerdown="handlePointerDown"
        @pointerup="handlePointerUp"
      >
        <div class="flex grow" :style="trackStyle">
          <div class="relative h-full grow overflow-hidden rounded-full bg-muted-foreground/40">
            <div class="absolute h-full rounded-full bg-muted-foreground" :style="{ width: `${getRangePercent()}%` }" />
          </div>
        </div>
      </div>

      <div :style="rightIconStyle">
        <slot name="right-icon">
          <svg class="size-5 text-muted-foreground" viewBox="0 0 24 24" fill="currentColor"><path d="M13 7.22L9.6 10H6v4h3.6L13 16.78V7.22zM15.54 8.46a5.76 5.76 0 010 7.08l1.42 1.42a7.77 7.77 0 000-9.92l-1.42 1.42z" /></svg>
        </slot>
      </div>
    </div>

    <p class="text-xs font-medium tracking-wider text-muted-foreground">
      {{ Math.round(value) }}
    </p>
  </div>
</template>
