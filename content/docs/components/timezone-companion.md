---
title: Timezone Companion
description: Two timezone tools in one — a meeting-overlap finder and a live world clock — switched by a mode toggle.
---

# Timezone Companion

Two timezone tools behind one toggle: **Meeting** shows your team's cities, their working hours, and how many are reachable at any UTC hour — scrub the timeline or hit _Find best time_ to land on the widest overlap. **Clock** is a live world clock with per-city day-phase badges (night, before work, working, wrapping up).

## Usage

```vue
<script setup lang="ts">
  import TimezoneCompanion from '~/components/ui/timezone-companion/TimezoneCompanion.vue';
</script>

<template>
  <TimezoneCompanion mode="meeting" class="h-120" />
</template>
```

## Props

| Prop     | Type                   | Default     | Description                                  |
| -------- | ---------------------- | ----------- | -------------------------------------------- |
| `mode`   | `'meeting' \| 'clock'` | `'meeting'` | Initial view mode                            |
| `cities` | `TimezoneCity[]`       | 4 defaults  | `{ name, tz, offset, workStart, workEnd }[]` |
| `class`  | `string`               | `''`        | Additional classes                           |

The default cities are San Francisco, New York, São Paulo and London — pass your own `cities` to match any team.
