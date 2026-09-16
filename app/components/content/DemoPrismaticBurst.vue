<script setup lang="ts">
  import PrismaticBurst from '@registry/new-york/prismatic-burst/PrismaticBurst.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import PrismaticBurst from '~/components/ui/PrismaticBurst.vue';
</script>

<template>
  <PrismaticBurst :intensity='2' :speed='0.5' animation-type='rotate3d' />
</template>`"
  >
    <div
      class="relative size-full min-h-80 overflow-hidden rounded-lg bg-black"
    >
      <PrismaticBurst :intensity="2" :speed="0.5" animation-type="rotate3d" />
    </div>
  </ComponentDemo>
</template>
