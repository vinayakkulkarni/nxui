<script setup lang="ts">
  const { featured } = useGallery();

  // 3-column bento: a 2×2 hero tile beside two stacked tiles, then mirrored.
  const LARGE = new Set([0, 4]);
</script>

<template>
  <section aria-label="Featured components" class="grid gap-4 md:grid-cols-3">
    <DocsGalleryTile
      v-for="(item, i) in featured"
      :key="item.path"
      :item="item"
      :size="LARGE.has(i) ? 'lg' : 'sm'"
    />
  </section>
</template>
