<script setup lang="ts">
  import DarkVeil from '@registry/new-york/DarkVeil/DarkVeil.vue';
</script>

<template>
  <ComponentDemo
    :code="`<DarkVeil :hue-shift='120' :speed='0.5' :noise-intensity='0.05' :scanline-intensity='0.15' />`"
  >
    <div class="relative h-[400px] w-full overflow-hidden rounded-lg">
      <DarkVeil
        :hue-shift="120"
        :speed="0.5"
        :noise-intensity="0.05"
        :scanline-intensity="0.15"
      />
    </div>
  </ComponentDemo>
</template>
