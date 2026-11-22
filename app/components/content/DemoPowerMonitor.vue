<script setup lang="ts">
  import { ref } from 'vue';
  import PowerMonitor from '@registry/new-york/power-monitor/PowerMonitor.vue';
  import type { PowerMonitorRange } from '@registry/new-york/power-monitor/types';

  const range = ref<PowerMonitorRange>('day');
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import { ref } from 'vue';
  import PowerMonitor from '~/components/ui/power-monitor/PowerMonitor.vue';
  import type { PowerMonitorRange } from '~/components/ui/power-monitor/types';

  const range = ref<PowerMonitorRange>('day');
</script>

<template>
  <PowerMonitor
    v-model:range=&quot;range&quot;
    :solar=&quot;4.82&quot;
    :peak=&quot;5.7&quot;
    :home=&quot;2.14&quot;
    :to-battery=&quot;1.96&quot;
    :export-power=&quot;0.72&quot;
  />
</template>`"
  >
    <div class="flex size-full min-h-100 items-center justify-center p-6">
      <PowerMonitor v-model:range="range" />
    </div>
  </ComponentDemo>
</template>
