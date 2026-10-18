---
title: Status Panel
description: Service health lamps with an overall status, uptime and latency, plus a live event log.
---

# Status Panel

A status panel for service health. Each service shows a colored lamp that pulses while it is unhealthy, with optional uptime and latency. The header reports the worst status, and new events slide into the log as they arrive.

::demo-status-panel
::

## Usage

```vue
<script setup lang="ts">
  import StatusPanel from '~/components/ui/status-panel/StatusPanel.vue';
  import type {
    StatusEvent,
    StatusService,
  } from '~/components/ui/status-panel/types';

  const services: StatusService[] = [
    {
      id: 'api',
      name: 'API',
      status: 'operational',
      uptime: 99.99,
      latency: 84,
    },
    {
      id: 'queue',
      name: 'Job queue',
      status: 'degraded',
      uptime: 99.9,
      latency: 240,
    },
  ];
  const events: StatusEvent[] = [
    {
      id: '1',
      time: new Date(),
      message: 'Job queue latency above 2s',
      level: 'warning',
    },
  ];
</script>

<template>
  <StatusPanel :services="services" :events="events" />
</template>
```

## Props

| Prop         | Type                                        | Default           | Description                                                            |
| ------------ | ------------------------------------------- | ----------------- | ---------------------------------------------------------------------- |
| `services`   | `{ id; name; status; uptime?; latency? }[]` | —                 | `status` is `'operational'`, `'degraded'`, `'down'` or `'maintenance'` |
| `events`     | `{ id; time; message; level }[]`            | `[]`              | `level` is `'info'`, `'warning'`, `'error'` or `'success'`             |
| `max-events` | `number`                                    | `6`               | Newest events kept in the log                                          |
| `title`      | `string`                                    | `'System status'` | Panel heading                                                          |

Motion respects `prefers-reduced-motion`.
