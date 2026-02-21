<script setup lang="ts">
  import FluidGlass from '@registry/new-york/FluidGlass/FluidGlass.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import FluidGlass from '~/components/ui/FluidGlass.vue';
</script>

<template>
  <FluidGlass mode='lens' :chromatic-aberration='0.06' :ior='1.5' />
</template>`"
  >
    <div class="relative h-[400px] w-full overflow-hidden rounded-lg">
      <FluidGlass mode="lens" :chromatic-aberration="0.06" :ior="1.5" />
    </div>
  </ComponentDemo>
</template>
