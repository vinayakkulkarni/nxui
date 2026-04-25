<script setup lang="ts">
  import Dither from '@registry/new-york/dither/Dither.vue';

  const waveColor: [number, number, number] = [0.5, 0.5, 0.5];

  const code = `<script setup lang="ts">
  import Dither from '~/components/ui/Dither.vue';
</script>

<template>
  <Dither :wave-color="[0.5, 0.5, 0.5]" />
</template>`;
</script>

<template>
  <ComponentDemo :code="code">
    <div class="relative h-full min-h-100 w-full overflow-hidden rounded-lg">
      <Dither :wave-color="waveColor" />
    </div>
  </ComponentDemo>
</template>
