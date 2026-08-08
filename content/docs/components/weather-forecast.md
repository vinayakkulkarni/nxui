---
title: Weather Forecast
description: A weather card with a colored orb glowing behind frosted glass — the forecast reads through the blur.
---

# Weather Forecast

A weather card built around one idea: the condition lives as a soft gradient **orb** behind a frosted-glass panel. Switch days and the orb crossfades to that day's palette — burnt amber for sun, slate for rain — while the temperature, condition and icon spring in over the glass.

## Usage

```vue
<script setup lang="ts">
  import WeatherForecast from '~/components/ui/weather-forecast/WeatherForecast.vue';
</script>

<template>
  <WeatherForecast city="Chicago" />
</template>
```

## Props

| Prop                | Type           | Default       | Description                                      |
| ------------------- | -------------- | ------------- | ------------------------------------------------ |
| `city`              | `string`       | `'Chicago'`   | City shown in the header                         |
| `days`              | `WeatherDay[]` | 5-day default | `{ day, date, condition, temp }[]` (temps in °F) |
| `unit`              | `'f' \| 'c'`   | `'f'`         | Initial temperature unit                         |
| `autoplay-interval` | `number`       | `3200`        | ms between auto-advances; `0` disables           |
| `class`             | `string`       | `''`          | Additional classes                               |

## Events

| Event    | Payload        | Description                         |
| -------- | -------------- | ----------------------------------- |
| `change` | `(day, index)` | Fires when the selected day changes |

Conditions map to orb palettes: `Sunny`, `Partly cloudy`, `Cloudy`, `Rain`, `Snow`, `Storm`.
