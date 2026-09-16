---
title: Art Gallery
description: An editorial gallery where classic paintings alternate with headline text that melts into ink as it leaves.
---

# Art Gallery

An editorial scroll: full-bleed classic paintings alternate with big rounded display type that _melts_ — each line deeper in a block dissolves harder, letterforms collapsing into ink blobs through a gooey SVG filter, like wet paint refusing to hold a word.

## Usage

```vue
<script setup lang="ts">
  import ArtGallery from '~/components/ui/art-gallery/ArtGallery.vue';
</script>

<template>
  <ArtGallery class="h-150" />
</template>
```

## Custom panels

```vue
<ArtGallery
  :panels="[
    {
      type: 'image',
      src: '/paintings/prometheus.jpg',
      alt: 'Prometheus Bound',
    },
    {
      type: 'lines',
      lines: ['Ground Pigment', 'Falling Shadow', 'Held Silence'],
    },
    {
      type: 'paragraph',
      text: 'We collect the paintings that hold their breath.',
    },
  ]"
/>
```

## Props

| Prop     | Type                | Default          | Description                              |
| -------- | ------------------- | ---------------- | ---------------------------------------- |
| `panels` | `ArtGalleryPanel[]` | curated defaults | `image` \| `lines` \| `paragraph` panels |
| `class`  | `string`            | `''`             | Additional classes                       |

The melt uses `feGaussianBlur` + an alpha-contrast `feColorMatrix` — pure SVG, no canvas — so the text stays selectable markup underneath.
