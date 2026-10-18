<script setup lang="ts">
  import { computed } from 'vue';
  import AsciiEffect from './AsciiEffect.vue';
  import { FLOW_COLORS } from './ascii-effect';
  import type { AsciiEffectPresetProps } from './types';

  const props = defineProps<AsciiEffectPresetProps>();

  const palette = computed(() => props.colors ?? FLOW_COLORS);
</script>

<template>
  <AsciiEffect v-bind="props" variant="flow" :colors="palette" />
</template>
