<script setup lang="ts">
  import PixelTrail from '@registry/new-york/PixelTrail/PixelTrail.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import PixelTrail from '~/components/ui/PixelTrail.vue';
</script>

<template>
  <PixelTrail :pixel-size='24' :fade-duration='500' color='#ffffff' :gooey-filter='true' />
</template>`"
  >
    <div
      class="relative h-[300px] w-full overflow-hidden rounded-lg bg-background"
    >
      <PixelTrail
        :pixel-size="24"
        :fade-duration="500"
        color="#ffffff"
        :gooey-filter="true"
      />
    </div>
  </ComponentDemo>
</template>
