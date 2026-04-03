<script setup lang="ts">
  import LetterGlitch from '@registry/new-york/letter-glitch/LetterGlitch.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import LetterGlitch from '~/components/ui/LetterGlitch/LetterGlitch.vue';
</script>

<template>
  <div class=&quot;relative h-100 w-full overflow-hidden rounded-lg&quot;>
    <LetterGlitch
      :glitch-colors=&quot;['#2b4539', '#61dca3', '#61b3dc']&quot;
      :glitch-speed=&quot;50&quot;
      center-vignette
      outer-vignette
      smooth
    />
  </div>
</template>`"
  >
    <div class="relative h-100 w-full overflow-hidden rounded-lg">
      <LetterGlitch
        :glitch-colors="['#2b4539', '#61dca3', '#61b3dc']"
        :glitch-speed="50"
        center-vignette
        outer-vignette
        smooth
      />
    </div>
  </ComponentDemo>
</template>
