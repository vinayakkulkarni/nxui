<script setup lang="ts">
  import PixelBlast from '@registry/new-york/pixel-blast/PixelBlast.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import PixelBlast from '~/components/ui/PixelBlast.vue';
</script>

<template>
  <PixelBlast color='#B19EEF' :pixel-size='3' variant='square' :enable-ripples='true' />
</template>`"
  >
    <div
      class="relative size-full min-h-80 overflow-hidden rounded-lg bg-background"
    >
      <PixelBlast
        class="absolute inset-0 size-full"
        color="#B19EEF"
        :pixel-size="3"
        variant="square"
        :enable-ripples="true"
      />
    </div>
  </ComponentDemo>
</template>
