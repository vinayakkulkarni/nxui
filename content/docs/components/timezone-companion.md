---
title: Timezone Companion
description: Two timezone tools — a meeting-overlap grid with a draggable scrubber, and a dark world clock with a tick ruler.
---

# Timezone Companion

Two faithful timezone tools behind one mode switch.

**Meeting Finder** — every city is a row of 24 hour blocks, colored where that city is inside working hours. A full-height scrubber drags across the grid; the footer counts who's reachable ("2 of 4 in working hours", "late in London") and _Find best time_ sweeps the scrubber to the widest overlap.

**World Clock** — a dark widget: drag the tick ruler to scrub time forward and back, and every city row updates its rolling clock, day relation (`YESTERDAY`), and day-phase badge (`NIGHT`, `BEFORE WORK`, `WORKING`, `WRAPPING UP`).

## Usage

```vue
<script setup lang="ts">
  import TimezoneCompanion from '~/components/ui/timezone-companion/TimezoneCompanion.vue';
</script>

<template>
  <TimezoneCompanion mode="meeting" />
</template>
```

The `TimezoneMeeting` and `TimezoneClock` sub-components are also exported for standalone use.

## Props

| Prop     | Type                   | Default                      | Description                                                  |
| -------- | ---------------------- | ---------------------------- | ------------------------------------------------------------ |
| `mode`   | `'meeting' \| 'clock'` | `'meeting'`                  | Which tool renders                                           |
| `cities` | `TimezoneCity[]`       | SF / NY / São Paulo / London | `{ name, zone, offsetMinutes, workStart, workEnd, color }[]` |
| `class`  | `string`               | `''`                         | Additional classes                                           |
