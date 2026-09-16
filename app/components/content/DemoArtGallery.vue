<script setup lang="ts">
  import ArtGallery from '@registry/new-york/art-gallery/ArtGallery.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import ArtGallery from '~/components/ui/art-gallery/ArtGallery.vue';
</script>

<template>
  <ArtGallery class=&quot;h-150&quot; />
</template>`"
  >
    <div class="relative size-full min-h-100">
      <ArtGallery class="absolute inset-0 size-full" />
      <p
        class="pointer-events-none absolute inset-x-0 bottom-4 z-10 text-center text-xs text-zinc-500"
      >
        scroll — the words melt as the paintings pass
      </p>
    </div>
  </ComponentDemo>
</template>
