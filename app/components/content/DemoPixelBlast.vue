<script setup lang="ts">
  import PixelBlast from '@registry/new-york/PixelBlast/PixelBlast.vue';
</script>

<template>
  <ComponentDemo
    :code="`<PixelBlast color='#B19EEF' :pixel-size='3' variant='square' :enable-ripples='true' />`"
  >
    <div class="relative h-[400px] w-full overflow-hidden rounded-lg bg-black">
      <PixelBlast
        color="#B19EEF"
        :pixel-size="3"
        variant="square"
        :enable-ripples="true"
      />
    </div>
  </ComponentDemo>
</template>
