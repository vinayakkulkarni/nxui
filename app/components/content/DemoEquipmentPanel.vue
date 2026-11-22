<script setup lang="ts">
  import { ref } from 'vue';
  import EquipmentPanel from '@registry/new-york/equipment-panel/EquipmentPanel.vue';
  import type {
    EquipmentDevice,
    EquipmentFilter,
  } from '@registry/new-york/equipment-panel/types';
  import { DEFAULT_DEVICES } from '@registry/new-york/equipment-panel/equipment-panel';

  const devices: EquipmentDevice[] = DEFAULT_DEVICES;
  const expanded = ref<string | null>('inverter');
  const filter = ref<EquipmentFilter>('all');
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import { ref } from 'vue';
  import EquipmentPanel from '~/components/ui/equipment-panel/EquipmentPanel.vue';
  import type { EquipmentDevice } from '~/components/ui/equipment-panel/types';

  const expanded = ref<string | null>('inverter');
  const devices: EquipmentDevice[] = [
    {
      id: 'battery-a',
      name: 'Battery A',
      detail: 'Garage wall · 13.5 kWh',
      status: 'ok',
      level: 0.7,
      levelColor: '#4ade80',
      power: 0.98,
      signed: true,
      temp: 24,
    },
  ];
</script>

<template>
  <EquipmentPanel
    v-model:expanded=&quot;expanded&quot;
    :devices=&quot;devices&quot;
    firmware=&quot;Firmware 26.4.1 · up to date&quot;
    @action=&quot;(device) => console.log('check', device.id)&quot;
  />
</template>`"
  >
    <div class="flex size-full min-h-100 items-center justify-center p-6">
      <EquipmentPanel
        v-model:expanded="expanded"
        v-model:filter="filter"
        :devices="devices"
      />
    </div>
  </ComponentDemo>
</template>
