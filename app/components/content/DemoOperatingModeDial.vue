<script setup lang="ts">
  import { ref, useTemplateRef, watch } from 'vue';
  import {
    useElementVisibility,
    useIntervalFn,
    usePreferredReducedMotion,
  } from '@vueuse/core';
  import OperatingModeDial from '@registry/new-york/operating-mode-dial/OperatingModeDial.vue';
  import type { OperatingModeOption } from '@registry/new-york/operating-mode-dial/types';
  import { DEFAULT_MODES } from '@registry/new-york/operating-mode-dial/operating-mode-dial';

  const modes: OperatingModeOption[] = DEFAULT_MODES;
  const TOUR = ['time-based', 'export', 'backup', 'self-powered'];
  const TABS = ['weekdays', 'weekdays', 'weekends', 'holidays'];

  const mode = ref('time-based');
  const schedule = ref('weekdays');
  const touched = ref(false);
  const root = useTemplateRef<HTMLElement>('root');
  const visible = useElementVisibility(root);
  const reduced = usePreferredReducedMotion();
  let step = 0;

  const { pause, resume } = useIntervalFn(
    () => {
      step = (step + 1) % TOUR.length;
      mode.value = TOUR[step] ?? 'time-based';
      schedule.value = TABS[step] ?? 'weekdays';
    },
    2600,
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
  import OperatingModeDial from '~/components/ui/operating-mode-dial/OperatingModeDial.vue';

  const mode = ref('time-based');
  const schedule = ref('weekdays');
</script>

<template>
  <OperatingModeDial
    v-model=&quot;mode&quot;
    v-model:schedule=&quot;schedule&quot;
    badge=&quot;Auto&quot;
    @apply=&quot;(value) => console.log('apply', value)&quot;
  />
</template>`"
  >
    <div
      ref="root"
      class="flex size-full min-h-100 items-center justify-center p-6"
      @pointerdown.capture="stopTour"
      @keydown.capture="stopTour"
    >
      <OperatingModeDial
        v-model="mode"
        v-model:schedule="schedule"
        :modes="modes"
      />
    </div>
  </ComponentDemo>
</template>
