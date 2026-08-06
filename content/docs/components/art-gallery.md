---
title: Art Gallery
description: A museum-style painting showcase with crossfading featured artwork, poetic captions, and thumbnail navigation.
---

# Art Gallery

A museum-style painting showcase. The featured artwork crossfades with a slow Ken Burns zoom while its title and a poetic caption rise in; the thumbnail strip below jumps to any painting. Hover pauses the rotation.

## Usage

```vue
<script setup lang="ts">
  import ArtGallery from '~/components/ui/art-gallery/ArtGallery.vue';
</script>

<template>
  <ArtGallery class="h-120" />
</template>
```

## Props

| Prop                | Type        | Default    | Description                         |
| ------------------- | ----------- | ---------- | ----------------------------------- |
| `artworks`          | `Artwork[]` | 5 defaults | `{ title, caption, image }[]`       |
| `autoplay-interval` | `number`    | `4000`     | ms between crossfades; `0` disables |
| `class`             | `string`    | `''`       | Additional classes                  |
