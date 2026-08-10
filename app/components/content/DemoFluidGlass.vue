<script setup lang="ts">
  import FluidGlass from '@registry/new-york/fluid-glass/FluidGlass.vue';
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
    <div class="relative size-full min-h-80 overflow-hidden rounded-lg">
      <FluidGlass
        class="absolute inset-0 size-full"
        mode="lens"
        :chromatic-aberration="0.06"
        :ior="1.5"
      />
    </div>
  </ComponentDemo>
</template>
