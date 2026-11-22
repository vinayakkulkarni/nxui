<script setup lang="ts">
  import { ref, useTemplateRef, watch } from 'vue';
  import {
    useElementVisibility,
    useIntervalFn,
    usePreferredReducedMotion,
  } from '@vueuse/core';
  import AuraStability from '@registry/new-york/aura-stability/AuraStability.vue';
  import type { AuraStabilityRun } from '@registry/new-york/aura-stability/types';

  const runs: AuraStabilityRun[] = [
    { label: '06:00', min: 3.98, max: 9.14 },
    { label: '09:00', min: 2.65, max: 8.0 },
    { label: '12:00', min: 3.52, max: 9.21 },
    { label: '15:00', min: 5.57, max: 7.75 },
    { label: '18:00', min: 3.88, max: 9.13 },
    { label: '21:00', min: 4.89, max: 7.53 },
  ];

  const active = ref(2);
  const touched = ref(false);
  const root = useTemplateRef<HTMLElement>('root');
  const visible = useElementVisibility(root);
  const reduced = usePreferredReducedMotion();

  // Steps through the runs on its own until someone points at or tabs into the chart.
  const { pause, resume } = useIntervalFn(
    () => {
      active.value = (active.value + 1) % runs.length;
    },
    1600,
    { immediate: false },
  );

  watch(
    [visible, touched, reduced],
    ([isVisible, isTouched, motionPref]) => {
      if (isVisible && !isTouched && motionPref !== 'reduce') resume();
      else pause();
    },
    { immediate: true },
  );

  function stopTour(): void {
    touched.value = true;
  }
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import { ref } from 'vue';
  import AuraStability from '~/components/ui/aura-stability/AuraStability.vue';
  import type { AuraStabilityRun } from '~/components/ui/aura-stability/types';

  const runs: AuraStabilityRun[] = [
    { label: '06:00', min: 3.98, max: 9.14 },
    { label: '09:00', min: 2.65, max: 8.0 },
    { label: '12:00', min: 3.52, max: 9.21 },
    { label: '15:00', min: 5.57, max: 7.75 },
    { label: '18:00', min: 3.88, max: 9.13 },
    { label: '21:00', min: 4.89, max: 7.53 },
  ];
  const active = ref(2);
</script>

<template>
  <AuraStability v-model:active=&quot;active&quot; :runs=&quot;runs&quot; :stability=&quot;98.6&quot; />
</template>`"
  >
    <div
      ref="root"
      class="flex size-full min-h-100 items-center justify-center p-6"
      @pointerdown.capture="stopTour"
      @pointerover.capture="stopTour"
      @keydown.capture="stopTour"
    >
      <AuraStability v-model:active="active" :runs="runs" :stability="98.6" />
    </div>
  </ComponentDemo>
</template>
