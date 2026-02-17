<script setup lang="ts">
  import PrismaticBurst from '@registry/new-york/PrismaticBurst/PrismaticBurst.vue';
</script>

<template>
  <ComponentDemo
    :code="`<PrismaticBurst :intensity='2' :speed='0.5' animation-type='rotate3d' />`"
  >
    <div class="relative h-[400px] w-full overflow-hidden rounded-lg bg-black">
      <PrismaticBurst :intensity="2" :speed="0.5" animation-type="rotate3d" />
    </div>
  </ComponentDemo>
</template>
