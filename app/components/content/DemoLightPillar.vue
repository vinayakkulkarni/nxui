<script setup lang="ts">
  import LightPillar from '@registry/new-york/LightPillar/LightPillar.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import LightPillar from '~/components/ui/LightPillar.vue';
</script>

<template>
  <LightPillar top-color='#5227FF' bottom-color='#FF9FFC' :intensity='1' :rotation-speed='0.3' />
</template>`"
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
