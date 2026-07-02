<script setup lang="ts">
  import PaperImageDithering from '@registry/new-york/paper-image-dithering/PaperImageDithering.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import PaperImageDithering from '~/components/ui/paper-image-dithering/PaperImageDithering.vue';
</script>

<template>
  <div class=&quot;relative h-100 w-full overflow-hidden rounded-lg&quot;>
    <PaperImageDithering image=&quot;/flowers.webp&quot; type=&quot;8x8&quot; :color-steps=&quot;2&quot; />
  </div>
</template>`"
  >
    <div class="relative h-100 w-full overflow-hidden rounded-lg">
      <PaperImageDithering image="/flowers.webp" type="8x8" :color-steps="2" />
    </div>
  </ComponentDemo>
</template>
