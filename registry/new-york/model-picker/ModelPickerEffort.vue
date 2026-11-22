<script setup lang="ts">
  import { computed } from 'vue';
  import { EFFORTS } from './model-picker-constants';
  import type { ModelPickerEffortLevel, ModelPickerEffortProps } from './types';

  const props = defineProps<ModelPickerEffortProps>();
  const emit = defineEmits<{
    change: [effort: ModelPickerEffortLevel];
    hover: [key: string];
  }>();

  const index = computed(() => Math.max(0, EFFORTS.indexOf(props.effort)));
  const pillStyle = computed(() => ({
    transform: `translateX(${index.value * 100}%)`,
  }));

  function title(value: ModelPickerEffortLevel): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  function onPick(event: MouseEvent): void {
    const target = event.currentTarget;
    if (!(target instanceof HTMLElement)) return;
    const value = EFFORTS.find((item) => item === target.dataset.effort);
    if (value) emit('change', value);
  }

  function onEnter(): void {
    emit('hover', 'effort');
  }
</script>

<template>
  <div
    role="group"
    :aria-label="label"
    :class="[
      'flex items-center gap-3 rounded-lg py-1.5 pr-1.5 pl-13.5 transition-colors duration-150',
      active ? 'bg-foreground/4' : '',
    ]"
    @pointerenter="onEnter"
  >
    <span class="flex-1 text-[15px] text-muted-foreground">{{ label }}</span>
    <span class="relative grid grid-cols-3 rounded-md">
      <span
        class="absolute inset-y-0 left-0 w-1/3 rounded-md bg-foreground/8 shadow-xs transition-transform duration-250 ease-out motion-reduce:transition-none dark:bg-foreground/12"
        :style="pillStyle"
        aria-hidden="true"
      />
      <button
        v-for="value in EFFORTS"
        :key="value"
        type="button"
        role="menuitemradio"
        tabindex="-1"
        :data-effort="value"
        :data-mp-item="value === effort ? '' : undefined"
        :data-key="value === effort ? 'effort' : undefined"
        :aria-checked="value === effort"
        :class="[
          'relative z-10 rounded-md px-3 py-1 text-sm outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring/60',
          value === effort
            ? 'text-foreground'
            : 'text-muted-foreground hover:text-foreground',
        ]"
        @click="onPick"
      >
        {{ title(value) }}
      </button>
    </span>
  </div>
</template>
