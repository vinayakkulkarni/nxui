<script setup lang="ts">
  import PixelSnow from '@registry/new-york/PixelSnow/PixelSnow.vue';
</script>

<template>
  <ComponentDemo
    :code="`<PixelSnow color='#ffffff' :speed='1.25' :density='0.3' variant='square' />`"
  >
    <div class="relative h-[400px] w-full overflow-hidden rounded-lg bg-black">
      <PixelSnow
        color="#ffffff"
        :speed="1.25"
        :density="0.3"
        variant="square"
      />
    </div>
  </ComponentDemo>
</template>
