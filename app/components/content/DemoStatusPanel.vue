<script setup lang="ts">
  import { ref } from 'vue';
  import { useIntervalFn } from '@vueuse/core';
  import StatusPanel from '@registry/new-york/status-panel/StatusPanel.vue';
  import type {
    StatusEvent,
    StatusService,
  } from '@registry/new-york/status-panel/types';
  import type { DemoStatusStep } from '~/types/components';

  const services = ref<StatusService[]>([
    {
      id: 'api',
      name: 'API',
      status: 'operational',
      uptime: 99.99,
      latency: 84,
    },
    {
      id: 'web',
      name: 'Web app',
      status: 'operational',
      uptime: 99.98,
      latency: 132,
    },
    {
      id: 'db',
      name: 'Database',
      status: 'operational',
      uptime: 99.95,
      latency: 12,
    },
    {
      id: 'queue',
      name: 'Job queue',
      status: 'operational',
      uptime: 99.9,
      latency: 40,
    },
  ]);

  const start = Date.now();
  const events = ref<StatusEvent[]>([
    {
      id: 'e0',
      time: new Date(start - 60_000),
      message: 'Deploy v2.14.0 completed',
      level: 'success',
    },
    {
      id: 'e1',
      time: new Date(start - 30_000),
      message: 'Health checks passing in all regions',
      level: 'info',
    },
  ]);

  // Scripted incident: degrade, go down, recover, then loop.
  const script: DemoStatusStep[] = [
    {
      serviceId: 'queue',
      status: 'degraded',
      message: 'Job queue latency above 2s',
      level: 'warning',
    },
    {
      serviceId: 'api',
      status: 'down',
      message: 'API returning 503 in eu-west',
      level: 'error',
    },
    {
      serviceId: 'api',
      status: 'operational',
      message: 'API recovered after failover',
      level: 'success',
    },
    {
      serviceId: 'queue',
      status: 'operational',
      message: 'Job queue drained, latency normal',
      level: 'success',
    },
  ];

  const BASE_LATENCY: Record<string, number> = Object.fromEntries(
    services.value.map((service) => [service.id, service.latency ?? 0]),
  );

  let step = 0;
  useIntervalFn(() => {
    const { serviceId, status, message, level } = script[step % script.length]!;
    services.value = services.value.map((service) =>
      service.id === serviceId
        ? {
            ...service,
            status,
            latency:
              BASE_LATENCY[service.id]! * (status === 'operational' ? 1 : 6),
          }
        : service,
    );
    events.value = [
      ...events.value,
      { id: `e${step + 2}`, time: new Date(), message, level },
    ];
    step += 1;
  }, 2200);
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import StatusPanel from '~/components/ui/status-panel/StatusPanel.vue';
  import type { StatusEvent, StatusService } from '~/components/ui/status-panel/types';

  const services: StatusService[] = [
    { id: 'api', name: 'API', status: 'operational', uptime: 99.99, latency: 84 },
    { id: 'queue', name: 'Job queue', status: 'degraded', uptime: 99.9, latency: 240 },
  ];
  const events: StatusEvent[] = [
    { id: '1', time: new Date(), message: 'Job queue latency above 2s', level: 'warning' },
  ];
</script>

<template>
  <StatusPanel :services=&quot;services&quot; :events=&quot;events&quot; />
</template>`"
  >
    <div class="flex size-full min-h-100 items-center justify-center p-6">
      <StatusPanel :services="services" :events="events" class="max-w-lg" />
    </div>
  </ComponentDemo>
</template>
