---
title: Flight Status Card
description: An animated card displaying real-time flight information with progress tracking.
---

::demo-flight-status-card
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/flight-status-card.json"
```

## Usage

```vue
<script setup lang="ts">
  import FlightStatusCardLight from '~/components/ui/flight-status-card/FlightStatusCardLight.vue';
</script>

<template>
  <FlightStatusCardLight
    departure-code="YYZ"
    arrival-code="HND"
    departure-city="Toronto"
    arrival-city="Tokyo"
    departure-time="MON, 6:14 PM"
    arrival-time="TUE, 7:14 AM"
    eta="ETA 2:15 PM"
    timezone="Tokyo Time"
    next-event="DINNER IN"
    next-event-time="2:34H"
    :progress="45"
    remaining-time="-7H 01M"
  />
</template>
```

## Props

| Prop     | Type         | Default  | Description                                               |
| -------- | ------------ | -------- | --------------------------------------------------------- |
| `flight` | `FlightInfo` | required | Flight information object with airline, route, and status |
| `class`  | `string`     | `''`     | Additional CSS classes for styling                        |
