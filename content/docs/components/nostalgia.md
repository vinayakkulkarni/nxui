---
title: Nostalgia
description: Vintage slide-viewer that cycles through memories while a fan of polaroid thumbnails arcs around it and a year + serif title crossfade underneath.
---

::demo-nostalgia
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/nostalgia.json"
```

## Usage

```vue
<script setup lang="ts">
  import Nostalgia from '~/components/ui/nostalgia/Nostalgia.vue';

  const items = [
    { src: '/photos/first-breath.jpg', year: '1988', title: 'First Breath' },
    { src: '/photos/six-candles.jpg', year: '1994', title: 'Six Candles' },
    { src: '/photos/the-sea.jpg', year: '1995', title: 'The Sea' },
  ];
</script>

<template>
  <Nostalgia :items="items" :interval="2600" autoplay monochrome />
</template>
```

Each memory shows in the viewer while the rest fan out as polaroids on both
sides — past memories to the left, upcoming to the right. Clicking a polaroid
jumps to it. `v-model` tracks the active index.

## Props

| Prop             | Type              | Default | Description                               |
| ---------------- | ----------------- | ------- | ----------------------------------------- |
| `items`          | `NostalgiaItem[]` | —       | Ordered memories (`src`, `year`, `title`) |
| `v-model`        | `number`          | `0`     | Active memory index                       |
| `autoplay`       | `boolean`         | `true`  | Auto-advance through memories             |
| `interval`       | `number`          | `2600`  | Milliseconds each memory stays on screen  |
| `pause-on-hover` | `boolean`         | `true`  | Pause autoplay while hovering             |
| `monochrome`     | `boolean`         | `true`  | Render photos in black & white            |

## Events

| Event    | Payload  | Description                |
| -------- | -------- | -------------------------- |
| `change` | `number` | Fired on memory activation |

## Credits

Ported from the "nostalgia, as a component" exploration by
[@ozzyxs1a](https://x.com/ozzyxs1a/status/2074277530073264635).
