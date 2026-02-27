<script setup lang="ts">
  import PixelCard from '@registry/new-york/PixelCard/PixelCard.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import PixelCard from '~/components/ui/PixelCard.vue';
</script>

<template>
  <PixelCard variant='blue'>
    <h3 class='text-xl font-bold text-white'>Hover Me</h3>
  </PixelCard>
</template>`"
  >
    <div
      class="flex h-[500px] w-full items-center justify-center rounded-lg bg-background"
    >
      <PixelCard variant="blue">
        <h3 class="text-xl font-bold text-white">Hover Me</h3>
      </PixelCard>
    </div>
  </ComponentDemo>
</template>
