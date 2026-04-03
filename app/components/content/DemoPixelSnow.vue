<script setup lang="ts">
  import PixelSnow from '@registry/new-york/pixel-snow/PixelSnow.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import PixelSnow from '~/components/ui/PixelSnow.vue';
</script>

<template>
  <PixelSnow color='#ffffff' :speed='1.25' :density='0.3' variant='square' />
</template>`"
  >
    <div class="relative h-100 w-full overflow-hidden rounded-lg bg-background">
      <PixelSnow
        color="#ffffff"
        :speed="1.25"
        :density="0.3"
        variant="square"
      />
    </div>
  </ComponentDemo>
</template>
