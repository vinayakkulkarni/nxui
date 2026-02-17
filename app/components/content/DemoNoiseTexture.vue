<script setup lang="ts">
  import NoiseTexture from '@registry/new-york/NoiseTexture/NoiseTexture.vue';
</script>

<template>
  <ComponentDemo
    full-width
    :code="`<script setup lang=&quot;ts&quot;>
  import NoiseTexture from '~/components/ui/NoiseTexture.vue';
</script>

<template>
  <NoiseTexture class=&quot;h-[300px] w-full bg-gradient-to-br from-violet-500 to-pink-500&quot;>
    <p class=&quot;text-3xl font-bold text-white&quot;>Noise Texture</p>
  </NoiseTexture>
</template>`"
  >
    <NoiseTexture
      class="flex min-h-[300px] w-full items-center justify-center bg-gradient-to-br from-violet-500 to-pink-500"
    >
      <p class="text-3xl font-bold text-white drop-shadow-lg">Noise Texture</p>
    </NoiseTexture>
  </ComponentDemo>
</template>
