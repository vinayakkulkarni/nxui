<script setup lang="ts">
  import Grainient from '@registry/new-york/Grainient/Grainient.vue';
</script>

<template>
  <ComponentDemo
    :code="`<Grainient color1='#FF9FFC' color2='#5227FF' color3='#B19EEF' :speed='0.25' :grain-amount='0.1' />`"
  >
    <div class="relative h-[400px] w-full overflow-hidden rounded-lg">
      <Grainient
        color1="#FF9FFC"
        color2="#5227FF"
        color3="#B19EEF"
        :speed="0.25"
        :grain-amount="0.1"
      />
    </div>
  </ComponentDemo>
</template>
