<script setup lang="ts">
  import WeatherForecast from '@registry/new-york/weather-forecast/WeatherForecast.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import WeatherForecast from '~/components/ui/weather-forecast/WeatherForecast.vue';
</script>

<template>
  <WeatherForecast city=&quot;Chicago&quot; class=&quot;h-120&quot; />
</template>`"
  >
    <div class="flex size-full min-h-100 items-center justify-center p-6">
      <WeatherForecast />
    </div>
  </ComponentDemo>
</template>
