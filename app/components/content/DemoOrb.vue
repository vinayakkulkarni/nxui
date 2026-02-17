<script setup lang="ts">
  import Orb from '@registry/new-york/Orb/Orb.vue';
</script>

<template>
  <ComponentDemo
    :code="`<Orb :hue='0' :hover-intensity='0.2' :rotate-on-hover='true' background-color='#000000' />`"
  >
    <div class="relative h-[400px] w-full overflow-hidden rounded-lg bg-black">
      <Orb
        :hue="0"
        :hover-intensity="0.2"
        :rotate-on-hover="true"
        background-color="#000000"
      />
    </div>
  </ComponentDemo>
</template>
