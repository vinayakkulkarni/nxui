<script setup lang="ts">
  import Dither from '@registry/new-york/dither/Dither.vue';

  const waveColor: [number, number, number] = [0.5, 0.5, 0.5];
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import Dither from '~/components/ui/Dither.vue';
</script>

<template>
  <Dither :wave-color=&quot;[0.5, 0.5, 0.5]&quot; />
</template>`"
  >
    <div class="relative size-full min-h-100 overflow-hidden rounded-lg">
      <Dither :wave-color="waveColor" />
    </div>
  </ComponentDemo>
</template>
