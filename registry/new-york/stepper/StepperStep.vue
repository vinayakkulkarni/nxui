<script setup lang="ts">
  import type { StepperStepProps } from './types';

  // title / description / icon are read by the parent Stepper from the vnode.
  defineProps<StepperStepProps>();
</script>

<template>
  <div class="min-w-0">
    <slot />
  </div>
</template>
