---
title: Weather Forecast
description: A compact weekly forecast strip with unit toggle, animated condition hero, and hover-driven day chips.
---

# Weather Forecast

A compact weather widget: a city header with a °F/°C toggle, a spring-animated hero showing the condition and temperature for the selected day, and a five-day strip that swaps the hero on hover — or on its own, auto-advancing through the week.

## Usage

```vue
<script setup lang="ts">
  import WeatherForecast from '~/components/ui/weather-forecast/WeatherForecast.vue';
</script>

<template>
  <WeatherForecast city="Chicago" class="h-120" />
</template>
```

## Props

| Prop                | Type           | Default       | Description                            |
| ------------------- | -------------- | ------------- | -------------------------------------- |
| `city`              | `string`       | `'Chicago'`   | City shown in the header               |
| `days`              | `WeatherDay[]` | 5-day default | `{ day, date, condition, temp }[]`     |
| `unit`              | `'f' \| 'c'`   | `'f'`         | Initial temperature unit               |
| `autoplay-interval` | `number`       | `3000`        | ms between auto-advances; `0` disables |
| `class`             | `string`       | `''`          | Additional classes                     |

## Events

| Event    | Payload        | Description                         |
| -------- | -------------- | ----------------------------------- |
| `change` | `(day, index)` | Fires when the selected day changes |
