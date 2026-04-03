<script setup lang="ts">
  import { ref, computed, useTemplateRef } from 'vue';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      modelValue?: number;
      defaultValue?: number;
      label: string;
      min?: number;
      max?: number;
      step?: number;
      class?: string;
    }>(),
    {
      modelValue: undefined,
      defaultValue: 0,
      min: 0,
      max: 100,
      step: 1,
      class: '',
    },
  );

  const emit = defineEmits<{
    'update:modelValue': [value: number];
  }>();

  const internalValue = ref(props.defaultValue);
  const isControlled = computed(() => props.modelValue !== undefined);
  const value = computed(() =>
    isControlled.value ? props.modelValue! : internalValue.value,
  );

  const isDragging = ref(false);
  const containerRef = useTemplateRef<HTMLDivElement>('container');

  function handleValueChange(newValue: number) {
    if (!isControlled.value) {
      internalValue.value = newValue;
    }
    emit('update:modelValue', newValue);
  }

  function updateValueFromPointer(clientX: number) {
    if (!containerRef.value) return;
    const rect = containerRef.value.getBoundingClientRect();
    const x = clientX - rect.left;
    let percentage = x / rect.width;
    percentage = Math.max(0, Math.min(1, percentage));

    let newValue = props.min + percentage * (props.max - props.min);
    newValue = Math.round(newValue / props.step) * props.step;

    // Ensure value stays within bounds due to rounding
    newValue = Math.max(props.min, Math.min(props.max, newValue));

    if (newValue !== value.value) {
      handleValueChange(newValue);
    }
  }

  function onPointerDown(e: PointerEvent) {
    containerRef.value?.setPointerCapture(e.pointerId);
    isDragging.value = true;
    updateValueFromPointer(e.clientX);
  }

  function onPointerMove(e: PointerEvent) {
    if (!isDragging.value) return;
    updateValueFromPointer(e.clientX);
  }

  function onPointerUp(e: PointerEvent) {
    containerRef.value?.releasePointerCapture(e.pointerId);
    isDragging.value = false;
  }

  const percentage = computed(() =>
    props.max > props.min
      ? ((value.value - props.min) / (props.max - props.min)) * 100
      : 0,
  );

  // Minimum fill width so it doesn't look too weird when value is 0
  const fillWidth = computed(() => Math.max(20, percentage.value));
</script>

<template>
  <div
    ref="container"
    :class="
      cn(
        'relative h-12 w-70 cursor-ew-resize select-none touch-none overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100 transition-transform active:scale-[0.98] dark:border-zinc-800 dark:bg-zinc-900',
        $props.class,
      )
    "
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerUp"
  >
    <!-- Fill / thumb -->
    <div
      :class="
        cn(
          'absolute left-0 top-0 flex h-full items-center justify-end rounded-2xl border-r border-zinc-200 bg-white pr-3 shadow-[0_2px_8px_rgba(0,0,0,0.1)] dark:border-zinc-700 dark:bg-zinc-800 dark:shadow-none',
          isDragging
            ? 'transition-none'
            : 'transition-[width] duration-300 ease-out',
        )
      "
      :style="{ width: `${fillWidth}%` }"
    >
      <!-- Handle mark -->
      <div class="h-5 w-0.75 rounded-full bg-zinc-300 dark:bg-zinc-600"></div>
    </div>

    <!-- Label and Value overlay -->
    <div
      class="pointer-events-none absolute inset-0 flex items-center justify-between px-5"
    >
      <span
        class="text-[15px] font-medium tracking-tight text-black/60 dark:text-white/60"
      >
        {{ label }}
      </span>
      <span
        class="text-[16px] font-medium tracking-tight text-black/50 dark:text-white/50"
      >
        {{ value }}
      </span>
    </div>
  </div>
</template>
