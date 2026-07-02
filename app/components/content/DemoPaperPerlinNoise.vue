<script setup lang="ts">
  import PaperPerlinNoise from '@registry/new-york/paper-perlin-noise/PaperPerlinNoise.vue';
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import PaperPerlinNoise from '~/components/ui/paper-perlin-noise/PaperPerlinNoise.vue';
</script>

<template>
  <div class=&quot;relative h-100 w-full overflow-hidden rounded-lg&quot;>
    <PaperPerlinNoise
      :color-front=&quot;'#fccff7'&quot;
      :color-back=&quot;'#632ad5'&quot;
      :proportion=&quot;0.35&quot;
      :octave-count=&quot;2&quot;
      :speed=&quot;0.5&quot;
    />
  </div>
</template>`"
  >
    <div class="relative h-100 w-full overflow-hidden rounded-lg">
      <PaperPerlinNoise
        :color-front="'#fccff7'"
        :color-back="'#632ad5'"
        :proportion="0.35"
        :octave-count="2"
        :speed="0.5"
      />
    </div>
  </ComponentDemo>
</template>
