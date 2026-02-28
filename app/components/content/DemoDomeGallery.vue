<script setup lang="ts">
  import DomeGallery from '@registry/new-york/DomeGallery/DomeGallery.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import DomeGallery from '~/components/ui/DomeGallery.vue';
</script>

<template>
  <DomeGallery :grayscale='true' />
</template>`"
  >
    <div class="relative h-125 w-full overflow-hidden rounded-lg">
      <DomeGallery :grayscale="true" />
    </div>
  </ComponentDemo>
</template>
