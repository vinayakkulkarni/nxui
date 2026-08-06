<script setup lang="ts">
  import ArtGallery from '@registry/new-york/art-gallery/ArtGallery.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import ArtGallery from '~/components/ui/art-gallery/ArtGallery.vue';
</script>

<template>
  <ArtGallery class=&quot;h-120&quot; />
</template>`"
  >
    <div class="flex size-full min-h-100 items-center justify-center p-6">
      <ArtGallery />
    </div>
  </ComponentDemo>
</template>
