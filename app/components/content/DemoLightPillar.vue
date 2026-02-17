<script setup lang="ts">
  import LightPillar from '@registry/new-york/LightPillar/LightPillar.vue';
</script>

<template>
  <ComponentDemo
    :code="`<LightPillar top-color='#5227FF' bottom-color='#FF9FFC' :intensity='1' :rotation-speed='0.3' />`"
  >
    <div class="relative h-[400px] w-full overflow-hidden rounded-lg bg-black">
      <LightPillar
        top-color="#5227FF"
        bottom-color="#FF9FFC"
        :intensity="1"
        :rotation-speed="0.3"
      />
    </div>
  </ComponentDemo>
</template>
