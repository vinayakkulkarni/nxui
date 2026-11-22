<script setup lang="ts">
  import { computed } from 'vue';
  import type { EquipmentBarProps } from './types';

  const props = withDefaults(defineProps<EquipmentBarProps>(), {
    cellClass: 'h-3 w-2',
    trackClass: 'bg-white/7',
  });

  const lit = computed(() =>
    Math.round(Math.min(1, Math.max(0, props.level)) * props.cells),
  );
  const cells = computed(() =>
    Array.from({ length: props.cells }, (_, i) => i < lit.value),
  );
</script>

<template>
  <span
    class="flex gap-0.75"
    role="meter"
    :aria-valuenow="Math.round(props.level * 100)"
    aria-valuemin="0"
    aria-valuemax="100"
  >
    <span
      v-for="(on, i) in cells"
      :key="i"
      class="rounded-[2px] transition-[background-color,box-shadow] duration-500 motion-reduce:transition-none"
      :class="[props.cellClass, on ? '' : props.trackClass]"
      :style="
        on
          ? {
              backgroundColor: props.color,
              boxShadow: `0 0 5px ${props.color}66`,
            }
          : undefined
      "
    />
  </span>
</template>
