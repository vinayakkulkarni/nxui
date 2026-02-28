<script setup lang="ts">
  import LightRays from '@registry/new-york/LightRays/LightRays.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import LightRays from '~/components/ui/LightRays.vue';
</script>

<template>
  <LightRays rays-color='#ffffff' :rays-speed='1' :light-spread='1' :ray-length='2' />
</template>`"
  >
    <div class="relative h-100 w-full overflow-hidden rounded-lg bg-background">
      <LightRays
        rays-color="#ffffff"
        :rays-speed="1"
        :light-spread="1"
        :ray-length="2"
      />
    </div>
  </ComponentDemo>
</template>
