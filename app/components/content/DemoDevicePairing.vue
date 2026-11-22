<script setup lang="ts">
  import { ref, useTemplateRef, watch } from 'vue';
  import {
    useElementVisibility,
    useIntervalFn,
    usePreferredReducedMotion,
  } from '@vueuse/core';
  import DevicePairing from '@registry/new-york/device-pairing/DevicePairing.vue';
  import type { DevicePairingStatus } from '@registry/new-york/device-pairing/types';

  const CODE = '472088';

  const code = ref('472');
  const status = ref<DevicePairingStatus>('idle');
  const touched = ref(false);
  const root = useTemplateRef<HTMLElement>('root');
  const pairing = useTemplateRef<InstanceType<typeof DevicePairing>>('pairing');
  const visible = useElementVisibility(root);
  const reduced = usePreferredReducedMotion();
  let wait = 3;

  // One tick every 420 ms: type a digit, pair when full, hold, then start over.
  const { pause, resume } = useIntervalFn(
    () => {
      if (wait > 0) {
        wait -= 1;
        return;
      }
      if (status.value === 'paired') {
        pairing.value?.reset();
        wait = 3;
        return;
      }
      if (status.value === 'pairing') return;
      if (code.value.length < CODE.length) {
        code.value = CODE.slice(0, code.value.length + 1);
        if (code.value.length === CODE.length) wait = 2;
        return;
      }
      pairing.value?.pair();
      wait = 8;
    },
    420,
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
  import DevicePairing from '~/components/ui/device-pairing/DevicePairing.vue';
  import type { DevicePairingStatus } from '~/components/ui/device-pairing/types';

  const code = ref('');
  const status = ref<DevicePairingStatus>('idle');

  async function onPair(value: string): Promise<void> {
    const ok = await fetch('/api/pair', { method: 'POST', body: value }).then((r) => r.ok);
    status.value = ok ? 'paired' : 'error';
  }
</script>

<template>
  <DevicePairing
    v-model=&quot;code&quot;
    v-model:status=&quot;status&quot;
    :auto-confirm=&quot;0&quot;
    @pair=&quot;onPair&quot;
  />
</template>`"
  >
    <div
      ref="root"
      class="flex size-full min-h-100 items-center justify-center p-6"
      @pointerdown.capture="stopTour"
      @keydown.capture="stopTour"
    >
      <DevicePairing ref="pairing" v-model="code" v-model:status="status" />
    </div>
  </ComponentDemo>
</template>
