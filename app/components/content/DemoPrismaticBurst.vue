<script setup lang="ts">
  import PrismaticBurst from '@registry/new-york/PrismaticBurst/PrismaticBurst.vue';
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
    <div class="relative h-100 w-full overflow-hidden rounded-lg bg-background">
      <PrismaticBurst :intensity="2" :speed="0.5" animation-type="rotate3d" />
    </div>
  </ComponentDemo>
</template>
