<script setup lang="ts">
  import Silk from '@registry/new-york/Silk/Silk.vue';
</script>

<template>
  <ComponentDemo
    :code="`<Silk :speed='5' :scale='1' color='#7B7481' :noise-intensity='1.5' :rotation='0' />`"
  >
    <div class="relative h-[400px] w-full overflow-hidden rounded-lg">
      <Silk :speed="5" :scale="1" color="#7B7481" :noise-intensity="1.5" :rotation="0" />
    </div>
  </ComponentDemo>
</template>
