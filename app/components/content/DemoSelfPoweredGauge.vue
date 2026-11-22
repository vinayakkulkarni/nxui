<script setup lang="ts">
  import { ref, watch } from 'vue';
  import { useElementVisibility, useIntervalFn } from '@vueuse/core';
  import SelfPoweredGauge from '@registry/new-york/self-powered-gauge/SelfPoweredGauge.vue';
  import type { SelfPoweredDay } from '@registry/new-york/self-powered-gauge/types';

  // Today's share drifts a little, so the needle keeps springing.
  const steps = [86, 89, 84, 87, 91, 86];
  const step = ref(0);
  const value = ref(86);

  const history: SelfPoweredDay[] = [
    { label: 'F', name: 'Friday', value: 72 },
    { label: 'S', name: 'Saturday', value: 88 },
    { label: 'S', name: 'Sunday', value: 87 },
    { label: 'M', name: 'Monday', value: 68 },
    { label: 'T', name: 'Tuesday', value: 79 },
    { label: 'W', name: 'Wednesday', value: 80 },
    { label: 'T', name: 'Thursday', value: 86 },
  ];

  const wrapper = ref<HTMLElement | null>(null);
  const visible = useElementVisibility(wrapper);
  const timer = useIntervalFn(
    () => {
      step.value = (step.value + 1) % steps.length;
      value.value = steps[step.value] ?? 86;
    },
    3200,
    { immediate: false },
  );
  watch(visible, (on) => (on ? timer.resume() : timer.pause()));
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import SelfPoweredGauge from '~/components/ui/self-powered-gauge/SelfPoweredGauge.vue';
  import type { SelfPoweredDay } from '~/components/ui/self-powered-gauge/types';

  const history: SelfPoweredDay[] = [
    { label: 'F', name: 'Friday', value: 72 },
    { label: 'S', name: 'Saturday', value: 88 },
    { label: 'S', name: 'Sunday', value: 87 },
    { label: 'M', name: 'Monday', value: 68 },
    { label: 'T', name: 'Tuesday', value: 79 },
    { label: 'W', name: 'Wednesday', value: 80 },
    { label: 'T', name: 'Thursday', value: 86 },
  ];
</script>

<template>
  <SelfPoweredGauge :value=&quot;86&quot; badge=&quot;+9 pts&quot; :zone-from=&quot;80&quot; :history=&quot;history&quot; />
</template>`"
  >
    <div
      ref="wrapper"
      class="flex size-full min-h-100 items-center justify-center p-6"
    >
      <SelfPoweredGauge :value="value" :history="history" />
    </div>
  </ComponentDemo>
</template>
