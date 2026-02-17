<script setup lang="ts">
  import FaultyTerminal from '@registry/new-york/FaultyTerminal/FaultyTerminal.vue';
</script>

<template>
  <ComponentDemo
    :code="`<FaultyTerminal :scale='1' :scanline-intensity='0.3' :curvature='0.2' :brightness='1' />`"
  >
    <div class="relative h-[400px] w-full overflow-hidden rounded-lg bg-black">
      <FaultyTerminal
        :scale="1"
        :scanline-intensity="0.3"
        :curvature="0.2"
        :brightness="1"
      />
    </div>
  </ComponentDemo>
</template>
