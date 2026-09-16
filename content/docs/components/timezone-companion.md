---
title: Timezone Companion
description: A meeting-overlap finder — every city is a row of 24 hour blocks, colored inside working hours, with a draggable scrubber and a best-time sweep.
---

# Timezone Companion

A meeting-overlap finder for distributed teams.

Every city is a row of 24 hour blocks, colored where that city is inside working hours. A full-height scrubber drags across the grid; the footer counts who's reachable ("2 of 4 in working hours", "late in London") and _Find best time_ sweeps the scrubber to the widest overlap.

::demo-timezone-companion
::

## Usage

```vue
<script setup lang="ts">
  import TimezoneCompanion from '~/components/ui/timezone-companion/TimezoneCompanion.vue';
</script>

<template>
  <TimezoneCompanion />
</template>
```

The `TimezoneMeeting` sub-component is also exported for standalone use.

## Props

| Prop     | Type             | Default                      | Description                                                  |
| -------- | ---------------- | ---------------------------- | ------------------------------------------------------------ |
| `cities` | `TimezoneCity[]` | SF / NY / São Paulo / London | `{ name, zone, offsetMinutes, workStart, workEnd, color }[]` |
| `class`  | `string`         | `''`                         | Additional classes                                           |
