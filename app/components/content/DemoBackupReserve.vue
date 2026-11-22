<script setup lang="ts">
  import { ref, watch } from 'vue';
  import { useElementVisibility, useIntervalFn } from '@vueuse/core';
  import BackupReserve from '@registry/new-york/backup-reserve/BackupReserve.vue';

  const reserve = ref(30);
  const stormWatch = ref(true);
  const gridRate = ref(3.8);

  // The battery slowly charges and settles, like a live reading.
  const battery = ref(64);
  const drift = [64, 65, 65, 66, 65, 64, 63, 64];
  const tick = ref(0);

  const wrapper = ref<HTMLElement | null>(null);
  const visible = useElementVisibility(wrapper);
  const timer = useIntervalFn(
    () => {
      tick.value = (tick.value + 1) % drift.length;
      battery.value = drift[tick.value] ?? 64;
    },
    2800,
    { immediate: false },
  );
  watch(visible, (on) => (on ? timer.resume() : timer.pause()));
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import { ref } from 'vue';
  import BackupReserve from '~/components/ui/backup-reserve/BackupReserve.vue';
  import type { BackupReserveSettings } from '~/components/ui/backup-reserve/types';

  const reserve = ref(30);
  const stormWatch = ref(true);
  const gridRate = ref(3.8);

  function onSave(settings: BackupReserveSettings) {
    console.log(settings);
  }
</script>

<template>
  <BackupReserve
    v-model:reserve=&quot;reserve&quot;
    v-model:storm-watch=&quot;stormWatch&quot;
    v-model:grid-rate=&quot;gridRate&quot;
    :battery=&quot;64&quot;
    :capacity=&quot;13.5&quot;
    :essential-load=&quot;0.45&quot;
    @save=&quot;onSave&quot;
  />
</template>`"
  >
    <div
      ref="wrapper"
      class="flex size-full min-h-100 items-center justify-center p-6"
    >
      <BackupReserve
        v-model:reserve="reserve"
        v-model:storm-watch="stormWatch"
        v-model:grid-rate="gridRate"
        :battery="battery"
      />
    </div>
  </ComponentDemo>
</template>
