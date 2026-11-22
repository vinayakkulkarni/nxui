<script setup lang="ts">
  import { ref, useTemplateRef, watch } from 'vue';
  import {
    useElementVisibility,
    usePreferredReducedMotion,
    useTimeoutFn,
  } from '@vueuse/core';
  import AuraSpeedTest from '@registry/new-york/aura-speed-test/AuraSpeedTest.vue';

  const root = useTemplateRef<HTMLElement>('root');
  const meter = useTemplateRef<InstanceType<typeof AuraSpeedTest>>('meter');
  const visible = useElementVisibility(root);
  const reduced = usePreferredReducedMotion();
  const touched = ref(false);
  const due = ref(false);

  // Replays the run every few seconds until someone interacts with the demo.
  const { start: queue, stop: unqueue } = useTimeoutFn(
    () => {
      due.value = true;
    },
    3500,
    { immediate: false },
  );

  watch([due, visible, touched], ([isDue, isVisible, isTouched]) => {
    if (!isDue || !isVisible || isTouched) return;
    due.value = false;
    meter.value?.run();
  });

  function onComplete(): void {
    if (!touched.value && reduced.value !== 'reduce') queue();
  }

  function stopTour(): void {
    touched.value = true;
    due.value = false;
    unqueue();
  }
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import AuraSpeedTest from '~/components/ui/aura-speed-test/AuraSpeedTest.vue';
  import type { AuraSpeedTestResult } from '~/components/ui/aura-speed-test/types';

  function onComplete(result: AuraSpeedTestResult): void {
    console.log(result.download);
  }
</script>

<template>
  <AuraSpeedTest
    label=&quot;Home office / Wi-Fi 6&quot;
    :download=&quot;912.3&quot;
    :upload=&quot;204&quot;
    :ping=&quot;9&quot;
    :packet-loss=&quot;2&quot;
    server=&quot;PRG&quot;
    distance=&quot;4 km&quot;
    @complete=&quot;onComplete&quot;
  />
</template>`"
  >
    <div
      ref="root"
      class="flex size-full min-h-100 items-center justify-center p-6"
      @pointerdown.capture="stopTour"
      @keydown.capture="stopTour"
    >
      <AuraSpeedTest ref="meter" @complete="onComplete" />
    </div>
  </ComponentDemo>
</template>
