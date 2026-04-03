<script setup lang="ts">
  import LightPillar from '@registry/new-york/light-pillar/LightPillar.vue';
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
    <div class="relative h-100 w-full overflow-hidden rounded-lg bg-background">
      <LightPillar
        top-color="#5227FF"
        bottom-color="#FF9FFC"
        :intensity="1"
        :rotation-speed="0.3"
      />
    </div>
  </ComponentDemo>
</template>
